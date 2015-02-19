'use strict';

var app = angular.module('dockerIde');

// var DOCKER_HOST = '192.168.59.103:2375';

var Tar;
/* jshint ignore:start */
Tar = require('tar-js');
/* jshint ignore:end */

app.factory('docker', [
  '$http', '$log', '$q', 'localStorageService',
  function ($http, $log, $q, localStorageService) {

    function Docker() {
    }

    function getUrl() {
      var host = localStorageService.get('dockerUrl');
      if (!/^http/.test(host)) {
        host = 'http://' + host;
      }
      return host;
    }

    Docker.prototype.setContext = function(context) {
      this.context = context;
    };

    Docker.prototype.ping = function() {
      var host = getUrl();
      return $http.get(host + '/_ping', { timeout: 2000 });
    };

    Docker.prototype.connect = function(imageId) {
      $log.debug('Sending connect request.');

      var deferred = $q.defer(),
          host = getUrl();

      $http.post(host + '/containers/create', {
        'AttachStdin': true,
        'AttachStdout': true,
        'AttachStderr': true,
        'Tty': true,
        'OpenStdin': true,
        'StdinOnce': true,
        'EntryPoint': [ '/bin/sh' ],
        'Cmd': [ '' ],
        'Image': imageId
      }).then(
        function(response) {
          var id = response.data.Id,
              socket = new WebSocket(host.replace(/^http/, 'ws') + '/containers/' + id +
                '/attach/ws?logs=1&stderr=1&stdout=1&stream=1&stdin=1');

          $http.post(host + '/containers/' + id + '/start').then(
            function() {
              deferred.resolve(socket);
            },
            function() {
              deferred.reject('Error starting container.');
            });
        },
        function(response) {
          deferred.reject(response.data || 'Error creating container.');
        });
      return deferred.promise;
    };

    Docker.prototype.build = function(dockerfile) {
      $log.debug('Sending build request.');

      var tar = new Tar(),
          output,
          host = getUrl();

      if (this.context) {
        tar.out = new Uint8Array(this.context.out);
        tar.written = this.context.written;
      }
      output = tar.append('Dockerfile', dockerfile);

      var deferred = $q.defer();

      $http.post(host + '/build', new Uint8Array(output), {
        headers: { 'content-type': 'application/x-tar' },
        transformRequest: [],
        transformResponse: function(data, headers) {
          var result = null;
          if (headers('content-type') === 'application/json') {
            var steps = angular.fromJson('[' + data.replace(/}\r\n{/g, '},{') + ']'),
                status = steps[steps.length - 1],
                match = null;
            result = { steps: steps };
            if (status.error) {
              result.state = 'error';
              result.message = status.error;
            } else if ((match = /Successfully built (.*)\n/.exec(status.stream))) {
              result.state = 'success';
              result.imageId = match[1];
            } else {
              result.state = 'unknown';
              result.message = status.stream;
            }
            return result;
          } else {
            result = { state: 'error', message: data };
          }
          return result;
        }
      }).then(
        function(response) {
          $log.debug('Build image successful.', response);
          deferred.resolve(response.data);
        },
        function(response) {
          $log.debug('Build image failed.', response);
          deferred.reject(response.data);
        });
      return deferred.promise;
    };

    return new Docker();
  }
]);