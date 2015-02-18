'use strict';

angular.module('dockerIde').factory('BuildManager', [
  '$log', '$timeout', 'docker', 'lineStatusService',
  function($log, $timeout, docker, lineStatusService) {

    function BuildManager(codeMirror) {
      this.codeMirror = codeMirror;
      this.codeMirror.on('cm:change', angular.bind(this, this.handleChange));
      this.processChangesTimeoutId = null;
    }

    BuildManager.prototype.scheduleProcessChanges = function() {
      $log.debug('Scheduling process changes');
      if (!this.processChangesTimeoutId) {
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
        comment = /^#/.test(line.text),
        // TODO: handle line that's just been commented out
        hasChanged = (!comment || multiline) && (change.text.join('').length > 0 || change.removed.join('').length > 0);

      function clearWidget(widget) {
        widget.clear();
      }

      if (hasChanged) {
        for (; lineNumber <= lastLine; lineNumber++) {
          line = codeMirror.getLineHandle(lineNumber);
          // Line is only dirty if it's not a comment and has content.
          if (!(/^$|^#/.test(line.text))) {
            line.__state = 'dirty';
          }
          line.__lastChange = new Date();
          line.__error = null;
          if (line.widgets) {
            line.widgets.forEach(clearWidget);
          }
          lineStatusService.update(codeMirror, line);
        }
        this.scheduleProcessChanges();
      }
    };

    BuildManager.prototype.buildImage = function(line, previousImageId) {
      $log.debug('Building image.');

      var buildManager = this,
          codeMirror = this.codeMirror,
          dockerfile = line.text;

      if (previousImageId) {
        dockerfile = 'FROM ' + previousImageId + '\n' + dockerfile;
      }

      line.__state = 'loading';
      lineStatusService.update(codeMirror, line);

      docker.build(dockerfile).then(
        function(result) {
          if (result.state === 'success') {
            $log.debug('Image build successful');
            line.__state = 'built';
            line.__imageId = result.imageId;
            buildManager.scheduleProcessChanges();
          } else {
            $log.debug('Image build failed. Error:', result.message);
            if (line.__state === 'dirty') {
              // Line has been updated since triggering build.
              buildManager.scheduleProcessChanges();
            } else {
              line.__state = 'error';
              line.__error = result.message;
              codeMirror.addLineWidget(line, angular.element('<span class="cm-error">' + result.message + '</span>')[0]);
            }
          }
          lineStatusService.update(codeMirror, line);
        },
        function(message) {
          $log.debug('Docker build request failed, will retry.', message);
          line.__state = 'dirty';
          buildManager.scheduleProcessChanges();
        });
    };

    BuildManager.prototype.processChanges = function() {
      $log.debug('Processing line changes.');
      this.processChangesTimeoutId = null;

      var codeMirror = this.codeMirror,
          lineNumber = 0,
          lastLine = codeMirror.lastLine(),
          line,
          previousImageId = null;

      for (; lineNumber <= lastLine; lineNumber++) {
        $log.debug('Processing line', lineNumber);
        line = codeMirror.getLineHandle(lineNumber);
        if (line.__state === 'dirty') {
          $log.debug('Line is dirty');
          if (new Date() - line.__lastChange > 1000) {
            $log.debug('Line is stable.');
            this.buildImage(line, previousImageId);
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
