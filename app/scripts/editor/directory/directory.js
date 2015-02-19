'use strict';

var Tar;
/* jshint ignore:start */
Tar = require('tar-js');
/* jshint ignore:end */

angular.module('dockerIde')
  .config(['$stateProvider',
    function ($stateProvider) {
      $stateProvider.state('editor.directory', {
        url: 'directory',
        views: {
          'side-bar': {
            templateUrl: 'scripts/editor/directory/directory.html',
            controller: [
              '$scope', '$log', '$timeout', 'localStorageService', 'docker',
              function($scope, $log, $timeout, localStorageService, docker) {

                localStorageService.bind($scope, 'directory');

                $scope.state = '';

                $scope.selectDirectory = function(files) {
                  if (files.length === 0) {
                    return;
                  }

                  $log.debug('Directory selected');

                  $scope.state = 'loading';
                  $scope.directory = null;

                  var tar = new Tar(),
                      ignoreFile = null,
                      ignorePatterns = [],
                      directory = files[0].webkitRelativePath.substring(0, files[0].webkitRelativePath.indexOf('/'));

                  files.some(function(file) {
                    if (file.name === '.dockerignore') {
                      ignoreFile = file;
                      return true;
                    }
                    return false;
                  });

                  function ignore(path) {
                    return ignorePatterns.some(function(pattern) {
                      return pattern.test(path);
                    });
                  }

                  function buildTar() {
                    files = files.filter(function(file) {
                      file.path = file.webkitRelativePath.substring(file.webkitRelativePath.indexOf('/') + 1);
                      return !ignore(file.path);
                    });

                    (function nextFile(index) {
                      if (index === files.length) {
                        $timeout(function() {
                          $scope.state = 'success';
                          $scope.directory = directory;
                          // TODO: Too big for local storage, maybe look at file system api.
                          docker.setContext(tar);
                        });
                        return;
                      }
                      var fileReader = new FileReader(),
                          file = files[index];

                      if (file.path === 'Dockerfile') {
                        fileReader.onload = function() {
                          $timeout(function() {
                            localStorageService.set('dockerfile', fileReader.result);
                          });
                          nextFile(index + 1);
                        };
                        fileReader.readAsText(file);
                      } else {
                        fileReader.onload = function() {
                          tar.append(file.path, new Uint8Array(fileReader.result));
                          nextFile(index + 1);
                        };
                        fileReader.readAsArrayBuffer(file);
                      }
                    })(0);
                  }

                  if (ignoreFile) {
                    var fileReader = new FileReader(),
                        ignoreLines;
                    fileReader.onload = function() {
                      ignoreLines = fileReader.result.split(/\n/);
                      ignorePatterns = [];
                      for (var i = 0; i < ignoreLines.length; i++) {
                        if (ignoreLines[i].trim().length > 0) {
                          ignorePatterns[i] = new RegExp('^' + ignoreLines[i].replace(/\./g, '\\.').replace(/\*/g, '.*'));
                        }
                      }
                      buildTar();
                    };
                    fileReader.readAsText(ignoreFile);
                  } else {
                    buildTar();
                  }
                };
              }]
          }
        }
      });
    }]);
