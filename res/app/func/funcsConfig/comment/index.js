require('./comment.css')

module.exports = angular.module('ccp.func-autocomment', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  require('./setting').name,
  require('../logs').name,
  require('./resource-setting').name
])
  .directive('autoComment', require('./comment-directive'))
