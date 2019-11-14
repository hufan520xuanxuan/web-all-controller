require('./post.css')

module.exports = angular.module('ccp.func-autopost', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  require('./post-model1').name,
  require('./post-model2').name,
])
  .directive('autoPost', require('./post-directive'))
