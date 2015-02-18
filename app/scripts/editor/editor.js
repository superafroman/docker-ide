'use strict';

angular.module('dockerIde')
  .config(['$stateProvider',
    function ($stateProvider) {

      $stateProvider.state('editor', {

        url: '/',

        templateUrl: 'scripts/editor/editor.html',

        controller: ['$scope', '$log', '$timeout', 'docker', 'lineStatusService', 'BuildManager',
          function ($scope, $log, $timeout, docker, lineStatusService, BuildManager) {

            var codeMirror,
                buildManager;

            $scope.terminals = [];

            function handleGutterClick(lineNumber) {
              var line = codeMirror.getLineHandle(lineNumber);
              if (line.__imageId && line.__state === 'ready') {
                line.__state = 'loading';
                $scope.terminals.push({
                  line: line,
                  imageId: line.__imageId,
                  title: ''
                });
                lineStatusService.update(codeMirror, line);
              }
            }

            $scope.terminalOpened = function(index) {
              var line = $scope.terminals[index];
              line.__status = 'terminal-active';
              lineStatusService.update(codeMirror, line);
            };

            $scope.terminalClosed = function(index) {
              var line = $scope.terminals[index];
              line.__status = 'ready';
              lineStatusService.update(codeMirror, line);
              $scope.terminals.splice(index, 1);
            };

            $scope.options = {
              lineNumbers: true,
              mode: 'dockerfile',
              theme: 'lesser-dark',
              gutters: [ 'build-status' ],
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
            $scope.dockerfile = '';
          }]
      });
    }]);
