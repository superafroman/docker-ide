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
    'mm.foundation'
  ])
  .run(['$rootScope', '$http', '$window', '$state',
    function($rootScope, $http, $window, $state) {
      $rootScope.$on('$stateChangeSuccess', function() {
        $window.scrollTo(0, 0);
      });

      $rootScope.$state = $state;
    }])
  .config(['$urlRouterProvider',
    function ($urlRouterProvider) {
      $urlRouterProvider.otherwise('/');
  }]);
