'use strict';

angular.module('dockerIde')
  .config(['$stateProvider',
    function ($stateProvider) {
      $stateProvider.state('editor.settings', {
        url: 'settings',
        views: {
          'side-bar': {
            templateUrl: 'scripts/editor/settings/settings.html',
            controller: [
              '$scope', 'localStorageService', 'docker',
              function($scope, localStorageService, docker) {
                localStorageService.bind($scope, 'dockerUrl');

                $scope.state = '';

                $scope.testConnection = function() {
                  if (!$scope.dockerUrl) {
                    $scope.state = '';
                    return;
                  }
                  $scope.state = 'loading';
                  docker.ping().then(
                    function() {
                      $scope.state = 'success';
                    },
                    function() {
                      $scope.state = 'failure';
                    });
                };

                $scope.$watch('dockerUrl', function() {
                  $scope.testConnection();
                });
              }]
          }
        }
      });
    }]);
