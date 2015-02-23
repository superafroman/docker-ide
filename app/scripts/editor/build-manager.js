'use strict';

angular.module('dockerIde').factory('BuildManager', [
  '$log', '$timeout', 'docker', 'lineStatusService',
  function($log, $timeout, docker, lineStatusService) {

    function BuildManager(codeMirror) {
      this.codeMirror = codeMirror;
      this.codeMirror.on('cm:change', angular.bind(this, this.handleChange));
      this.processChangesTimeoutId = null;
    }

    function displayError(codeMirror, line, message) {
      codeMirror.addLineClass(line, 'text', 'cm-error');
      codeMirror.addLineWidget(line, angular.element('<span class="cm-error">' + message + '</span>')[0]);
    }

    function includesNextLine(line) {
      var text = line.text.trim();
      return text.charAt(text.length - 1) === '\\';
    }

    BuildManager.prototype.scheduleProcessChanges = function() {
      if (!this.processChangesTimeoutId) {
        $log.debug('Scheduling process changes');
        this.processChangesTimeoutId = $timeout(angular.bind(this, this.processChanges), 500);
      }
    };

    BuildManager.prototype.handleChange = function(change) {
      $log.debug('Handling CodeMirror change event.', change);

      var codeMirror = this.codeMirror,
        lineNumber = change.from.line,
        lastLine = codeMirror.lastLine(),
        line = codeMirror.getLineHandle(lineNumber),
        multiline = change.text.length > 1 || change.removed.length > 1,
        // don't count the line as a comment if it's just been commented out
        comment = /^#/.test(line.text) && (change.from.ch > 0 || change.text[0] !== '#'),
        hasChanged = (!comment || multiline) && (change.text.join('').length > 0 || change.removed.join('').length > 0);

      function clearWidget(widget) {
        widget.clear();
      }

      if (hasChanged) {
        // handle line continuation (lines ending '\') by backtracking to first line in series
        for (; lineNumber > 0; lineNumber--) {
          line = codeMirror.getLineHandle(lineNumber - 1);
          if (!includesNextLine(line)) {
            break;
          }
        }

        var continuing = false;
        for (; lineNumber <= lastLine; lineNumber++) {
          line = codeMirror.getLineHandle(lineNumber);
          line.__continuation = continuing;

          // Line is only dirty if it's not a comment and has content.
          if (!(/^$|^#/.test(line.text.trim()))) {
            line.__state = 'dirty';
          } else {
            line.__imageId = null;
          }
          line.__lastChange = new Date();
          line.__error = null;
          if (line.widgets) {
            codeMirror.removeLineClass(line, 'text', 'cm-error');
            line.widgets.forEach(clearWidget);
          }
          lineStatusService.update(codeMirror, line);
          continuing = includesNextLine(line);
        }
        // if still continuing then either there's an error or the current command isn't finished, so don't bother
        // processing.
        if (!continuing) {
          this.scheduleProcessChanges();
        }
      }
    };

    BuildManager.prototype.buildImage = function(lines, previousImageId) {
      $log.debug('Building image.');

      var buildManager = this,
          codeMirror = this.codeMirror,
          line = lines[0],
          dockerfile = '';

      function setState(lines, state) {
        lines.forEach(function(l) {
          if (l.__state !== state) {
            l.__state = state;
            lineStatusService.update(codeMirror, l);
          }
        });
      }

      setState(lines, 'loading');

      if (previousImageId) {
        dockerfile = 'FROM ' + previousImageId + '\n';
      }

      lines.forEach(function(l) {
        dockerfile += l.text + '\n';
      });

      docker.build(dockerfile).then(
        function(result) {
          $log.debug('Image build successful');
          setState(lines, 'built');
          line.__imageId = result.imageId;
          buildManager.scheduleProcessChanges();
        },
        function(error) {
          if (error) {
            $log.debug('Image build failed. Error:', error.message);
            if (lines.some(function(l) { return l.__state === 'dirty'; })) {
              // At least one line has been updated since triggering build.
              setState(lines, 'dirty');
              buildManager.scheduleProcessChanges();
            } else {
              setState(lines, 'error');
              displayError(codeMirror, lines[lines.length - 1], error.message);
            }
          } else {
            $log.debug('Docker build request failed, will retry.', error);
            setState(lines, 'dirty');
            buildManager.scheduleProcessChanges();
          }
        });
    };

    BuildManager.prototype.processChanges = function() {
      $log.debug('Processing line changes.');
      this.processChangesTimeoutId = null;

      var codeMirror = this.codeMirror,
          lineNumber = 0,
          lastLine = codeMirror.lastLine(),
          line,
          lines = [],
          previousImageId = null;

      for (; lineNumber <= lastLine; lineNumber++) {
        $log.debug('Processing line', lineNumber);
        line = codeMirror.getLineHandle(lineNumber);
        if (line.__state === 'dirty') {
          $log.debug('Line is dirty');
          if (new Date() - line.__lastChange > 1000) {
            $log.debug('Line is stable.');
            lines.push(line);
            if (includesNextLine(line)) {
              continue;
            }
            this.buildImage(lines, previousImageId);
          } else {
            $log.debug('Line is not stable.');
            this.scheduleProcessChanges();
          }
          break;
        } else if (line.__state === 'error') {
          break;
        }

        if (line.__imageId) {
          previousImageId = line.__imageId;
        }
      }
    };

    return BuildManager;
  }]);
