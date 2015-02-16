'use strict';

var DEFAULT_QUERY = {
  method: 'GET',
  isArray: true,
  transformResponse: function(data) {
    data = angular.fromJson(data);
    return data.content;
  }
};

var app = angular.module('commuterAdmin');


app.factory('operatingSystems', [function() {
  return [ 'IOS', 'ANDROID' ];
}]);


app.factory('User', ['API_URL', '$resource', function (API_URL, $resource) {
  return $resource(API_URL + '/users/:userId',
    { userId: '@userId' }, {
      me: { method: 'GET', params: { userId: 'me' } },
      query: DEFAULT_QUERY
    });
}]);


app.factory('Account', ['API_URL', '$resource', function (API_URL, $resource) {
  return $resource(API_URL + '/accounts/:id?size=10',
    { id: '@id' }, {
      query: {
        method: 'GET',
        isArray: false
      }
    });
}]);


app.factory('AppVersion', ['API_URL', '$resource', function(API_URL, $resource) {
  var AppVersion = $resource(API_URL + '/versions/app/:id',
    { id: '@id' }, {
      query: DEFAULT_QUERY
    });
  AppVersion.prototype.label = function() {
    var label = this.versionNumber;
    if (this.operatingSystem || this.operatingSystemVersion) {
      label += ' - ' + (this.operatingSystem || '') + (this.operatingSystemVersion || '');
    }
    return label;
  };
  return AppVersion;
}]);


app.factory('Content', ['API_URL', '$resource', function(API_URL, $resource) {
  return $resource(API_URL + '/content/:id',
    { id: '@id' }, {
      query: DEFAULT_QUERY
    });
}]);


app.factory('InAppMessage', ['API_URL', '$resource', function(API_URL, $resource) {
  return $resource(API_URL + '/notifications/in-app/:id',
    { id: '@id' }, {
      query: DEFAULT_QUERY
    });
}]);


app.factory('PushNotification', ['API_URL', '$resource', function(API_URL, $resource) {
  return $resource(API_URL + '/notifications/push/:id',
    { id: '@id' }, {
      query: DEFAULT_QUERY
    });
}]);

