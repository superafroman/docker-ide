'use strict';

var app = angular.module('dockerIde');

var DOCKER_HOST = '192.168.59.103:2375';

var Tar;
/* jshint ignore:start */
Tar = require('tar-js');
/* jshint ignore:end */

app.service('docker', [
  '$http', '$log', '$q',
  function ($http, $log, $q) {

    function Docker() {
    }

    Docker.prototype.connect = function(imageId) {
      $log.debug('Sending connect request.');

      var deferred = $q.defer();

      $http.post('http://' + DOCKER_HOST + '/containers/create', {
        'AttachStdin': true,
        'AttachStdout': true,
        'AttachStderr': true,
        'Tty': true,
        'OpenStdin': true,
        'StdinOnce': true,
        'Cmd': [
          '/bin/sh'
        ],
        'Image': imageId
      }).then(function(response) {
        var id = response.data.Id;
        var socket = new WebSocket('ws://' + DOCKER_HOST + '/containers/' + id + '/attach/ws?logs=1&stderr=1&stdout=1&stream=1&stdin=1');

        $http.post('http://' + DOCKER_HOST + '/containers/' + id + '/start').then(
          function() {
            deferred.resolve(socket);
          },
          function() {
            deferred.reject('Error starting container.');
          });
      }, function(response) {
        deferred.reject(response.data || 'Error creating container.');
      });
      return deferred.promise;
    };

    Docker.prototype.build = function(dockerfile) {
      $log.debug('Sending build request.');

      var tar = new Tar(),
          output = tar.append('Dockerfile', dockerfile);

      return $http.post('http://' + DOCKER_HOST + '/build', new Uint8Array(output), {
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
          return response.data;
        },
        function(response) {
          $log.debug('Build image failed.', response);
          return response.data;
        });
    };

    return new Docker();
  }
]);