'use strict';

function LineStatusService() {
}

LineStatusService.prototype.update = function(codeMirror, line) {

  if (line.__error) {

  }

  // building codeMirror.setGutterMarker(line, 'build-status', angular.element('<i class="fa fa-fw fa-spinner fa-spin"></i>')[0]);
  // ready    codeMirror.setGutterMarker(line, 'build-status', angular.element('<i class="fa fa-fw fa-plug"></i>')[0]);
  // loading  codeMirror.setGutterMarker(line, 'build-status', angular.element('<i class="fa fa-fw fa-spinner fa-spin"></i>')[0]);
  // terminal-active codeMirror.setGutterMarker($scope.activeLine, 'build-status', angular.element('<i class="fa fa-fw fa-code"></i>')[0]);
};

angular.module('dockerIde').service('lineStatusService', [LineStatusService]);
