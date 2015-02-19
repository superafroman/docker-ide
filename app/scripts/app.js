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
    'angularFileUpload'
  ])
  .run(['$rootScope', '$http', '$window', '$state',
    function($rootScope, $http, $window, $state) {
      $rootScope.$state = $state;
    }])
  .config(['$urlRouterProvider',
    function ($urlRouterProvider) {
      $urlRouterProvider.otherwise('/');
  }]);
