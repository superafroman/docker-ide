'use strict';

var GUTTER_NAME = 'line-status';

function LineStatusService() {
}

LineStatusService.prototype.update = function(codeMirror, line) {

  function createMarker(classes) {
    return angular.element('<i class="fa fa-fw ' + classes + '"></i>')[0];
  }

  switch (line.__state) {
    case 'loading':
      codeMirror.setGutterMarker(line, GUTTER_NAME, createMarker('fa-spinner fa-spin'));
      break;
    case 'built':
      codeMirror.setGutterMarker(line, GUTTER_NAME, createMarker('fa-plug'));
      break;
    case 'connected':
      codeMirror.setGutterMarker(line, GUTTER_NAME, createMarker('fa-terminal'));
      break;
    default:
      codeMirror.setGutterMarker(line, GUTTER_NAME, null);
  }
};

angular.module('dockerIde').service('lineStatusService', [LineStatusService]);
