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

            function handleChange(instance, change) {
              $log.debug('Handling codemirror change event.', change);

              var lineNumber = change.from.line,
                  lastLine = instance.lastLine();

              for (var i = lineNumber; i <= lastLine; i++) {
                lines[i] = new Line({
                  text: instance.getLine(lineNumber),
                  lineNumber: lineNumber,
                  changed: new Date(),
                  codeMirror: instance,
                  lines: lines
                });
              }
            }

            $interval(function() {
              var parentImageId = null;
              lines.some(function(line) {
                if (line.isPending()) {
                  return true;
                }
                if (line.isDirty()) {
                  if (new Date() - line.changed > 1000) {
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
                          $log.debug('Image build failed for line ' + line.lineNumber + '. Message: ' +result.message);
                          line.setError(result.message);
                        }
                      },
                      function() {
                        $log.debug('Docker build failed.', arguments);
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
