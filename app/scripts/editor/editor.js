'use strict';

angular.module('dockerIde')
  .config(['$stateProvider',
    function ($stateProvider) {

      $stateProvider.state('editor', {

        url: '/',

        templateUrl: 'scripts/editor/editor.html',

        controller: ['$scope', '$log', '$timeout', 'docker',
          function ($scope, $log, $timeout, docker) {

            var processChangesTimeoutId,
                codeMirror;

            $scope.terminalImageId = null;

            function scheduleProcessChanges() {
              $log.debug('Scheduling process changes');
              if (!processChangesTimeoutId) {
                $log.debug('Already scheduled');
                processChangesTimeoutId = $timeout(function () {
                  processChanges();
                }, 500);
              }
            }

            function clearWidget(widget) {
              widget.clear();
            }

            function clearMarker(line) {
              codeMirror.setGutterMarker(line, 'build-status', null);
            }

            function handleChange(change) {
              $log.debug('Handling codemirror change event.', change);

              var lineNumber = change.from.line,
                  lastLine = codeMirror.lastLine(),
                  line = codeMirror.getLineHandle(lineNumber),
                  multiline = change.text.length > 1 || change.removed.length > 1,
                  comment = /^#/.test(line.text),
                  hasChanged = (!comment || multiline) && (change.text.join('').length > 0 || change.removed.join('').length > 0);

              if (hasChanged) {
                for (; lineNumber <= lastLine; lineNumber++) {
                  line = codeMirror.getLineHandle(lineNumber);
                  // Line is only dirty if it's not a comment and has content.
                  line.__dirty = !(/^$|^#/.test(line.text));
                  line.__lastChange = new Date();
                  line.__error = null;
                  if (line.widgets) {
                    line.widgets.forEach(clearWidget);
                  }
                  clearMarker(line);
                }
                scheduleProcessChanges();
              }
            }

            function buildImage(line, previousImageId) {
              $log.debug('Building image.');

              var dockerfile = line.text;

              if (previousImageId) {
                dockerfile = 'FROM ' + previousImageId + '\n' + dockerfile;
              }

              line.__dirty = false;
              codeMirror.setGutterMarker(line, 'build-status', angular.element('<i class="fa fa-fw fa-spinner fa-spin"></i>')[0]);

              docker.build(dockerfile).then(
                function(result) {
                  if (result.state === 'success') {
                    $log.debug('Image build successful');
                    line.__imageId = result.imageId;
                    codeMirror.setGutterMarker(line, 'build-status', angular.element('<i class="fa fa-fw fa-plug"></i>')[0]);
                    scheduleProcessChanges();
                  } else {
                    $log.debug('Image build failed. Error:', result.message);
                    if (line.__dirty) {
                      // Line has been updated since triggering build.
                      scheduleProcessChanges();
                    } else {
                      line.__error = result.message;
                      codeMirror.addLineWidget(line, angular.element('<span class="cm-error">' + result.message + '</span>')[0]);
                      clearMarker(line);
                    }
                  }
                },
                function() {
                  $log.debug('Docker build request failed.', arguments);
                  line.__dirty = true;
                  scheduleProcessChanges();
                });
            }

            function processChanges() {
              $log.debug('Processing line changes.');
              processChangesTimeoutId = null;

              var lineNumber = 0,
                  lastLine = codeMirror.lastLine(),
                  line,
                  previousImageId = null;

              for (; lineNumber <= lastLine; lineNumber++) {
                $log.debug('Processing line', lineNumber);
                line = codeMirror.getLineHandle(lineNumber);
                if (line.__dirty) {
                  $log.debug('Line is dirty');
                  if (new Date() - line.__lastChange > 1000) {
                    $log.debug('Line is stable.');
                    buildImage(line, previousImageId);
                  } else {
                    $log.debug('Line is not stable.');
                    scheduleProcessChanges();
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

            function handleGutterClick(lineNumber) {
              var line = codeMirror.getLineHandle(lineNumber);
              if (line.__imageId) {
                codeMirror.setGutterMarker(line, 'build-status', angular.element('<i class="fa fa-fw fa-spinner fa-spin"></i>')[0]);
                $scope.terminalImageId = line.__imageId;
              }
            }

            $scope.terminalClosed = function() {
              var i = 0,
                  lastLine = codeMirror.lastLine(),
                  line;
              for (; i <= lastLine; i++) {
                line = codeMirror.getLineHandle(i);
                if (line.__imageId === $scope.terminalImageId) {
                  codeMirror.setGutterMarker(line, 'build-status', angular.element('<i class="fa fa-fw fa-plug"></i>')[0]);
                  break;
                }
              }
              $scope.terminalImageId = null;
            };

            $scope.options = {
              lineNumbers: true,
              mode: 'dockerfile',
              theme: 'lesser-dark',
              gutters: [ 'build-status' ],
              onLoad: function (instance) {
                codeMirror = instance;
                codeMirror.on('change', function(cm, change) {
                  $scope.$apply(function() {
                    handleChange(change);
                  });
                });
                codeMirror.on('gutterClick', function(cm, lineNumber) {
                  $scope.$apply(function() {
                    handleGutterClick(lineNumber);
                  });
                });
              }
            };
            $scope.dockerfile = '';
          }]
      });
    }]);
