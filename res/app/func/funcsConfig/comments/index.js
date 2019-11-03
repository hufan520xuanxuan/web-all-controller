require('./comments.css')

module.exports = angular.module('ccp.func-autocomments', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  // require('./setting').name
])
  .directive('autoComments', require('./comments-directive'))
