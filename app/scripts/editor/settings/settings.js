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
              '$scope', 'localStorageService',
              function($scope, localStorageService) {
                localStorageService.bind($scope, 'dockerHost');
              }]
          }
        }
      });
    }]);
