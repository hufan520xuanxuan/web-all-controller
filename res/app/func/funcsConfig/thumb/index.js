require('./thumb.css')

module.exports = angular.module('ccp.func-autothumb', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  require('./setting').name
])
  .directive('autoThumb', require('./thumb-directive'))
