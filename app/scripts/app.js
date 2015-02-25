'use strict';

angular
  .module('dockerIde', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ui.router',
    'ui.codemirror',
    'mm.foundation',
    'LocalStorageModule',
    'angularFileUpload',
    'configuration'
  ])
  .run(['$rootScope', '$http', '$window', '$state', 'MODE',
    function($rootScope, $http, $window, $state, MODE) {
      $rootScope.$state = $state;
      $rootScope.mode = MODE;
    }])
  .config(['$urlRouterProvider',
    function ($urlRouterProvider) {
      $urlRouterProvider.otherwise('/');
  }]);
