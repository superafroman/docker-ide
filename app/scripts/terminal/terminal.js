'use strict';

var app = angular.module('dockerIde');

app.directive('terminal', [
  '$log', 'docker',
  function($log, docker) {

    function link(scope, element, attrs) {

      var socket,
          terminal = new Terminal({
            cols: 80,
            rows: 24
          });

      terminal.open(element.get(0));

      terminal.on('data', function(data) {
        if (socket) {
          socket.send(data);
        }
      });

      docker.connect(attrs.imageId).then(
        function(newSocket) {
          socket = newSocket;
          socket.onclose = function() {
            scope.$broadcast('socket:close');
          };
          socket.onmessage = function(event) {
            scope.$broadcast('socket:data', event.data);
          };
          socket.onerror = function(event) {
            scope.$broadcast('socket:error', event);
          };
        },
        function(message) {
          $log.debug('Error creating container.', message);
        });

      scope.$on('socket:data', function(event, data) {
        terminal.write(data);
      });

      scope.$on('socket:error', function(event) {
        $log.debug('Error:', event);
      });

      scope.$on('socket:close', function() {
        terminal.destroy();
      });
    }

    return {
      restrict: 'E',
      replace: true,
      scope: {
        imageId: '='
      },
      templateUrl: 'scripts/terminal/terminal.html',
      link: link
    };
  }
]);