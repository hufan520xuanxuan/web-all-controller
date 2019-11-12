require('./post.css')

module.exports = angular.module('ccp.func-autopost', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
])
  .directive('autoPost', require('./post-directive'))
