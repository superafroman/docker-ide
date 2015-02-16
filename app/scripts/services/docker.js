'use strict';

var app = angular.module('dockerIde');

var DOCKER_HOST = 'http://192.168.59.103:2375';

var Tar;
/* jshint ignore:start */
Tar = require('tar-js');
/* jshint ignore:end */

app.service('docker', [
  '$http', '$log',
  function ($http, $log) {

    function Docker() {
    }

    Docker.prototype.build = function(dockerfile) {
      $log.debug('Building image');

      var tar = new Tar(),
          output = tar.append('Dockerfile', dockerfile);

      return $http.post(DOCKER_HOST + '/build', new Uint8Array(output), {
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