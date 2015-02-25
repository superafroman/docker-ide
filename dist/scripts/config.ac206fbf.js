'use strict';

/**
 * Configuration module.
 *
 * Values will be replaced by environment variables when run through Docker.
 */
angular.module('configuration', [])
  .constant('MODE', 'hosted')
  ;
