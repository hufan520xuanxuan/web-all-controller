require('./post.css')

module.exports = angular.module('ccp.func-autopost', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  // require('./setting').name
  require('./nowpost').name
])
  .directive('autoPost', require('./post-directive'))
