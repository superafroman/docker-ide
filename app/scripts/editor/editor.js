'use strict';

angular.module('dockerIde')
  .config(['$stateProvider',
    function ($stateProvider) {

      $stateProvider.state('editor', {

        url: '/',

        templateUrl: 'scripts/editor/editor.html',

        controller: ['$scope', '$log', '$interval', 'docker',
          function ($scope, $log, $interval, docker) {

            var processChangesTimeoutId;

            function scheduleProcessChanges(instance) {
              $log.debug('Scheduling process changes');
              if (!processChangesTimeoutId) {
                $log.debug('Already scheduled');
                processChangesTimeoutId = setTimeout(function () {
                  processChanges(instance);
                }, 500);
              }
            }

            function clearWidget(widget) {
              widget.clear();
            }

            function handleChange(instance, change) {
              $log.debug('Handling codemirror change event.', change);

              var lineNumber = change.from.line,
                  lastLine = instance.lastLine(),
                  line = instance.getLineHandle(lineNumber),
                  multiline = change.text.length > 1 || change.removed.length > 1,
                  comment = /^#/.test(line.text),
                  hasChanged = (!comment || multiline) && (change.text.join('').length > 0 || change.removed.join('').length > 0);

              if (hasChanged) {
                for (; lineNumber <= lastLine; lineNumber++) {
                  line = instance.getLineHandle(lineNumber);
                  // Line is only dirty if it's not a comment and has content.
                  line.__dirty = !(/^$|^#/.test(line.text));
                  line.__lastChange = new Date();
                  line.__error = null;
                  if (line.widgets) {
                    line.widgets.forEach(clearWidget);
                  }
                  instance.setGutterMarker(line, 'build-status', null);
                }
                scheduleProcessChanges(instance);
              }
            }

            function buildImage(instance, line, previousImageId) {
              $log.debug('Building image.');

              var dockerfile = line.text;

              if (previousImageId) {
                dockerfile = 'FROM ' + previousImageId + '\n' + dockerfile;
              }

              line.__dirty = false;
              instance.setGutterMarker(line, 'build-status', angular.element('<i class="fa fa-fw fa-spinner"></i>')[0]);

              docker.build(dockerfile).then(
                function(result) {
                  if (result.state === 'success') {
                    $log.debug('Image build successful');
                    line.__imageId = result.imageId;
                    instance.setGutterMarker(line, 'build-status', angular.element('<i class="fa fa-fw fa-plug"></i>')[0]);
                    scheduleProcessChanges(instance);
                  } else {
                    $log.debug('Image build failed. Error:', result.message);
                    if (line.__dirty) {
                      // Line has been updated since triggering build.
                      scheduleProcessChanges(instance);
                    } else {
                      line.__error = result.message;
                      instance.addLineWidget(line, angular.element('<span class="cm-error">' + result.message + '</span>')[0]);
                    }
                  }
                },
                function() {
                  $log.debug('Docker build request failed.', arguments);
                  instance.setGutterMarker(line, 'build-status', null);
                  line.__dirty = true;
                  scheduleProcessChanges(instance);
                });
            }

            function processChanges(instance) {
              $log.debug('Processing line changes.');
              processChangesTimeoutId = null;

              var lineNumber = 0,
                  lastLine = instance.lastLine(),
                  line,
                  previousImageId = null;

              for (; lineNumber <= lastLine; lineNumber++) {
                $log.debug('Processing line', lineNumber);
                line = instance.getLineHandle(lineNumber);
                if (line.__dirty) {
                  $log.debug('Line is dirty');
                  if (new Date() - line.__lastChange > 1000) {
                    $log.debug('Line is stable.');
                    buildImage(instance, line, previousImageId);
                  } else {
                    $log.debug('Line is not stable.');
                    scheduleProcessChanges(instance);
                  }
                  break;
                } else if (line.__error) {
                  break;
                }

                if (line.__imageId) {
                  previousImageId = line.__imageId;
                }
              }
            }

            $scope.options = {
              lineNumbers: false,
              mode: 'dockerfile',
              theme: 'lesser-dark',
              gutters: [ 'build-status' ],
              onLoad: function (instance) {
                instance.on('change', handleChange);
              }
            };
            $scope.dockerfile = '';
          }]
      });
    }]);
