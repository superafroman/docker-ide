'use strict';

angular.module('dockerIde')
  .config(['$stateProvider',
    function ($stateProvider) {

      $stateProvider.state('editor', {

        url: '/',

        templateUrl: 'scripts/editor/editor.html',

        controller: ['$scope', '$state', '$log', '$timeout', 'docker', 'lineStatusService', 'BuildManager',
          function ($scope, $state, $log, $timeout, docker, lineStatusService, BuildManager) {

            var codeMirror,
                buildManager;

            $scope.dockerfile = '';
            $scope.terminals = [];

            function handleGutterClick(lineNumber) {
              var line = codeMirror.getLineHandle(lineNumber),
                  terminal;
              $scope.terminals.some(function(t) {
                if (t.imageId === line.__imageId) {
                  terminal = t;
                  return true;
                }
                return false;
              });
              if (terminal) {
                terminal.active = true;
              } else if (line.__imageId) {
                line.__state = 'loading';
                $scope.terminals.push({
                  line: line,
                  imageId: line.__imageId,
                  title: line.text,
                  active: true
                });
                lineStatusService.update(codeMirror, line);
              }
            }

            $scope.terminalOpened = function(index) {
              var line = $scope.terminals[index].line;
              line.__state = 'connected';
              lineStatusService.update(codeMirror, line);
            };

            $scope.terminalClosed = function(index) {
              var line = $scope.terminals[index].line;
              line.__state = 'built';
              lineStatusService.update(codeMirror, line);
              $scope.terminals.splice(index, 1);
            };

            $scope.options = {
              lineNumbers: true,
              mode: 'dockerfile',
              theme: 'lesser-dark',
              gutters: [ 'line-status' ],
              onLoad: function (instance) {
                codeMirror = instance;

                function forward(event) {
                  codeMirror.on(event, function(instance, data) {
                    $scope.$apply(function() {
                      CodeMirror.signal(codeMirror, 'cm:' + event, data);
                    });
                  });
                }
                forward('change');
                forward('gutterClick');

                codeMirror.on('cm:gutterClick', function(lineNumber) {
                  handleGutterClick(lineNumber);
                });

                buildManager = new BuildManager(codeMirror);
              }
            };

            $scope.toggleState = function(stateName) {
              if ($state.includes(stateName)) {
                $state.go('editor');
              } else {
                $state.go(stateName);
              }
            };
          }]
      });
    }]);
