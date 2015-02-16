'use strict';

angular.module('dockerIde')
  .config(['$stateProvider',
    function ($stateProvider) {

      $stateProvider.state('editor', {

        url: '/',

        templateUrl: 'scripts/editor/editor.html',

        controller: ['$scope',
          function ($scope) {
            $scope.options = {
              lineNumbers: true,
              mode: 'dockerfile',
              theme: 'lesser-dark',
              onLoad: function (_cm) {
              }
            };
            $scope.dockerfile = 'FROM ubuntu';
          }]
      });
    }]);
