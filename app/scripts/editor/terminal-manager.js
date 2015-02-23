'use strict';

angular.module('dockerIde').factory('TerminalManager', [
  '$log', 'lineStatusService',
  function($log, lineStatusService) {

    function TerminalManager($scope, codeMirror) {
      this.codeMirror = codeMirror;
      this.codeMirror.on('cm:gutterClick', angular.bind(this, this.openTerminalForLine));
      this.terminals = [];

      $scope.terminals = this.terminals;
      $scope.terminalOpened = angular.bind(this, this.terminalOpened);
      $scope.terminalClosed = angular.bind(this, this.terminalClosed);
    }

    TerminalManager.prototype.openTerminalForLine = function(lineNumber) {
      var codeMirror = this.codeMirror,
        line = codeMirror.getLineHandle(lineNumber),
        terminal;

      this.terminals.some(function(t) {
        if (t.imageId === line.__imageId) {
          terminal = t;
          return true;
        }
        return false;
      });

      if (terminal) {
        terminal.active = true;
      } else if (line.__imageId) {
        this.terminals.push({
          line: line,
          imageId: line.__imageId,
          title: line.text,
          active: true
        });
        lineStatusService.update(codeMirror, line, 'loading');
      }
    };

    TerminalManager.prototype.terminalOpened = function(index) {
      var terminals = this.terminals,
        line = terminals[index].line,
        codeMirror = this.codeMirror;
      lineStatusService.update(codeMirror, line, 'connected');
    };

    TerminalManager.prototype.terminalClosed = function(index) {
      var terminals = this.terminals,
        line = terminals[index].line,
        codeMirror = this.codeMirror;
      lineStatusService.update(codeMirror, line, 'built');
      terminals.splice(index, 1);
    };

    return TerminalManager;
  }]);
