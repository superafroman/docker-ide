'use strict';

angular.module('dockerIde')
  .run([
    'DOCKER_INSTRUCTIONS',
    function(instructions) {

      function getCompletions(token, context) {

        if (context.length) {
          return null;
        }

        var textRegExp = new RegExp('^' + token.string, 'i'),
            matchingInstructions = instructions.filter(function(instruction) {
              return textRegExp.test(instruction);
            }),
            uppercase = token.string.charAt(0) === token.string.charAt(0).toUpperCase();

        for (var i = 0; i < matchingInstructions.length; i++) {
          matchingInstructions[i] = uppercase ? matchingInstructions[i].toUpperCase() : matchingInstructions[i].toLowerCase();
        }
        return matchingInstructions;
      }

      function hint(editor) {

        var cursor = editor.getCursor(),
            token = editor.getTokenAt(cursor);

        token.state = CodeMirror.innerMode(editor.getMode(), token.state).state;

        if (token.end > cursor.ch) {
          token.end = cursor.ch;
          token.string = token.string.slice(0, cursor.ch - token.start);
        }

        var previousToken = token,
            context = [];
        while (previousToken && previousToken.type === 'argument') {
          previousToken = editor.getTokenAt(CodeMirror.Pos(cursor.line, previousToken.start));
          if (previousToken && previousToken.type) {
            context.push(previousToken);
          }
        }

        return {
          list: getCompletions(token, context),
          from: CodeMirror.Pos(cursor.line, token.start),
          to: CodeMirror.Pos(cursor.line, token.end)
        };
      }

      CodeMirror.registerHelper('hint', 'dockerfile', hint);
    }]);
