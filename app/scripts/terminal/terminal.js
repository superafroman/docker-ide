'use strict';

var app = angular.module('dockerIde');

app.directive('terminal', [
  '$log', 'docker',
  function($log, docker) {

    function link(scope, element) {

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

      scope.$on('socket:open', function() {
        if (scope.open) {
          scope.open();
        }
        terminal.focus();
      });

      scope.$on('socket:data', function(event, data) {
        terminal.write(data);
      });

      scope.$on('socket:error', function(event) {
        $log.debug('Error:', event);
      });

      scope.$on('socket:close', function() {
        if (scope.close) {
          scope.close();
        }
        socket = null;
        terminal.reset();
      });

      scope.$watch('imageId', function(imageId) {

        if (socket) {
          socket.close();
          socket = null;
        }

        if (imageId) {
          docker.connect(imageId).then(
            function(newSocket) {
              socket = newSocket;
              socket.onopen = function() {
                scope.$apply(function() {
                  scope.$broadcast('socket:open');
                });
              };
              socket.onclose = function() {
                scope.$apply(function() {
                  scope.$broadcast('socket:close');
                });
              };
              socket.onmessage = function(event) {
                scope.$apply(function() {
                  scope.$broadcast('socket:data', event.data);
                });
              };
              socket.onerror = function(event) {
                scope.$apply(function() {
                  scope.$broadcast('socket:error', event);
                });
              };
            },
            function(message) {
              $log.debug('Error creating container.', message);
            });
        }
      });
    }

    return {
      restrict: 'E',
      replace: true,
      scope: {
        imageId: '=',
        open: '&onOpen',
        close: '&onClose'
      },
      templateUrl: 'scripts/terminal/terminal.html',
      link: link
    };
  }
]);