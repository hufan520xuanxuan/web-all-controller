require('./browse.css')

module.exports = angular.module('ccp.func-autobrowse', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  require('./setting').name
])
  .directive('autoBrowse', require('./browse-directive'))
