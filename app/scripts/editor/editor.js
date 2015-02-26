'use strict';

var app = angular.module('dockerIde');

app.config(['$stateProvider',
    function ($stateProvider) {

      $stateProvider.state('editor', {

        url: '/',

        templateUrl: 'scripts/editor/editor.html',

        controller: [
          '$scope', '$state', '$timeout', 'MODE', 'BuildManager', 'TerminalManager', 'localStorageService',
          function ($scope, $state, $timeout, mode, BuildManager, TerminalManager, localStorageService) {

            var codeMirror,
              buildManager,
              terminalManager;

            if (mode !== 'embedded' && !localStorageService.get('dockerUrl') && !$state.includes('editor.settings')) {
              $state.go('editor.settings');
            }

            localStorageService.bind($scope, 'dockerfile');

            $scope.$on('LocalStorageModule.notification.setitem', function(event, data) {
              if (data.key === 'dockerfile') {
                $scope.dockerfile = data.newvalue;
              }
            });

            $scope.options = {
              lineNumbers: true,
              extraKeys: {
                'Ctrl-Space': 'autocomplete'
              },
              mode: 'dockerfile',
              theme: 'lesser-dark',
              gutters: [ 'line-status' ],
              autoCloseBrackets: true,
              onLoad: function (instance) {
                codeMirror = instance;

                function forward(event) {
                  codeMirror.on(event, function(instance, data) {
                    $timeout(function() {
                      CodeMirror.signal(codeMirror, 'cm:' + event, data);
                    });
                  });
                }
                forward('change');
                forward('focus');
                forward('gutterClick');

                codeMirror.on('cm:focus', function() {
                  if (!$state.is('editor')) {
                    $state.go('editor');
                  }
                });

                buildManager = new BuildManager(codeMirror);
                terminalManager = new TerminalManager($scope, codeMirror);
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

app.filter('encodeURIComponent', function() {
  return window.encodeURIComponent;
});