'use strict';

var GUTTER_NAME = 'line-status';

function LineStatusService() {
}

LineStatusService.prototype.update = function(codeMirror, line, state) {

  if (line.__state === state) {
    return;
  }
  line.__state = state;

  function createMarker(classes) {
    return angular.element('<i class="fa fa-fw ' + classes + '"></i>')[0];
  }

  function clearMarker() {
    codeMirror.setGutterMarker(line, GUTTER_NAME, null);
  }

  if (line.__continuation) {
    clearMarker();
  } else {
    switch (line.__state) {
      case 'loading':
        codeMirror.setGutterMarker(line, GUTTER_NAME, createMarker('fa-refresh fa-spin'));
        break;
      case 'built':
      case 'connected':
        codeMirror.setGutterMarker(line, GUTTER_NAME, createMarker('fa-terminal'));
        break;
      case 'error':
        codeMirror.setGutterMarker(line, GUTTER_NAME, createMarker('fa-circle alert'));
        break;
      default:
        clearMarker();
    }
  }
};

angular.module('dockerIde').service('lineStatusService', [LineStatusService]);
