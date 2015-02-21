'use strict';

var app = angular.module('dockerIde');

app.constant('DOCKER_INSTRUCTIONS', [
  'FROM', 'MAINTAINER', 'RUN', 'CMD', 'EXPOSE', 'ENV',
  'ADD', 'COPY', 'ENTRYPOINT', 'VOLUME', 'USER',
  'WORKDIR', 'ONBUILD'
]);

app.run([
  'DOCKER_INSTRUCTIONS',
  function(instructions) {

    var instructionsRegExp = new RegExp('\\s*(' + instructions.join('|') + ')(\\s|$)', 'i');

    CodeMirror.defineSimpleMode('dockerfile', {
      start: [
        { regex: instructionsRegExp, token: [ 'instruction', null ] },
        { regex: /"(?:[^\\]|\\.)*?"/, token: 'string' },
        { regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i, token: 'number' },
        { regex: /#.*$/, token: 'comment' },
        { regex: /\\(\s)*$/ },
        { regex: /[^\s]+/, token: 'argument'}
      ],
      meta: {
        lineComment: '#'
      }
    });

    CodeMirror.defineMIME('text/x-dockerfile', 'dockerfile');
  }
]);