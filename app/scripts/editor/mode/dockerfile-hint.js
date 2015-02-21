'use strict';

angular.module('dockerIde')
  .run([
    'DOCKER_INSTRUCTIONS',
    function(instructions) {

      function getCompletions() {
        return instructions;
      }

      function hint(editor, options) {

        var cursor = editor.getCursor(),
            token = editor.getTokenAt(cursor);

        token.state = CodeMirror.innerMode(editor.getMode(), token.state).state;

        if (token.end > cursor.ch) {
          token.end = cursor.ch;
          token.string = token.string.slice(0, cursor.ch - token.start);
        }

        return {
          list: getCompletions(token, options),
          from: CodeMirror.Pos(cursor.line, token.start),
          to: CodeMirror.Pos(cursor.line, token.end)
        };
      }

      CodeMirror.registerHelper('hint', 'dockerfile', hint);
    }]);
