'use strict';

angular.module('dockerIde')
  .factory('Line', [function() {

    function Line(o) {
      angular.extend(this, o || {});
      this.__setState('dirty');
      this.imageId = null;
    }

    Line.prototype.__setState = function(state) {
      if (this.isEmpty()) {
        this.state = null;
        this.codeMirror.setGutterMarker(this.lineNumber, 'build-status', null);
      } else {
        this.state = state;

        var icon = 'fa fa-fw ';
        switch (state) {
          case 'success':
            icon += 'build-status-success';
            break;
          case 'error':
            icon += 'fa-times build-status-error';
            break;
          case 'pending':
            icon += 'fa-spinner build-status-pending';
            break;
          default:
            icon += 'build-status-unknown';
        }
        this.codeMirror.setGutterMarker(this.lineNumber, 'build-status', angular.element('<i class="' + icon + '"></i>')[0]);
      }
    };

    Line.prototype.isEmpty = function() {
      return (!this.text || this.text.trim().length === 0 || this.text.match(/^#/));
    };

    Line.prototype.isDirty = function() {
      return this.state === 'dirty';
    };

    Line.prototype.isPending = function() {
      return this.state === 'pending';
    };

    Line.prototype.setPending = function() {
      this.__setState('pending');
    };

    Line.prototype.setImageId = function(imageId) {
      this.__setState('success');
      this.imageId = imageId;
    };

    Line.prototype.setError = function(error) {
      this.__setState('error');
      this.imageId = null;
      this.error = error;
    };

    return Line;
  }]);
