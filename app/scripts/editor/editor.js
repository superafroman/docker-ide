'use strict';

angular.module('dockerIde')
  .config(['$stateProvider',
    function ($stateProvider) {

      $stateProvider.state('editor', {

        url: '/',

        templateUrl: 'scripts/editor/editor.html',

        controller: ['$scope', '$log', '$interval', 'docker', 'Line',
          function ($scope, $log, $interval, docker, Line) {

            var lines = [];

            function clearWidget(widget) {
              widget.clear();
            }

            function handleChange(instance, change) {
              $log.debug('Handling codemirror change event.', change);

              var lineNumber = change.to.line,
                  lastLine = instance.lastLine();

              if (change.text.join('').length === 0) {
                $log.debug('No change, not re-building.');
                return;
              }

              for (var i = lineNumber; i <= lastLine; i++) {

                var widgets = instance.lineInfo(i).widgets;
                if (widgets) {
                  widgets.forEach(clearWidget);
                }

                lines[i] = new Line({
                  text: instance.getLine(lineNumber),
                  lineNumber: lineNumber,
                  codeMirror: instance
                });
              }
            }

            $interval(function() {
              var parentImageId = null;
              lines.some(function(line) {
                if (line.isPending()) {
                  $log.debug('Found pending line, waiting for completion. Line number:', line.lineNumber);
                  return true;
                }
                if (line.isDirty()) {
                  $log.debug('Found dirty line. Line number:', line.lineNumber);
                  if (line.isSettled()) {
                    $log.debug('Line settled, building image.');

                    var dockerfile = line.text;

                    if (parentImageId) {
                      dockerfile = 'FROM ' + parentImageId + '\n' + dockerfile;
                    }

                    line.setPending();

                    docker.build(dockerfile).then(
                      function(result) {
                        if (result.state === 'success') {
                          $log.debug('Image built for line ' + line.lineNumber);
                          line.setImageId(result.imageId);
                        } else {
                          $log.debug('Image build failed for line ' + line.lineNumber + '. Message: ' + result.message);
                          line.setError(result.message);
                        }
                      },
                      function() {
                        $log.debug('Docker build request failed.', arguments);
                      });
                  }
                  return true;
                }
                if (line.imageId !== null) {
                  parentImageId = line.imageId;
                }
              });
            }, 500);

            $scope.options = {
              lineNumbers: true,
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
