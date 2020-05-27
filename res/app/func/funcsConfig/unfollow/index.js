require('./unfollow.css')

module.exports = angular.module('ccp.func-autounfollow', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  require('./setting').name,
  require('./white-list').name,
  require('./res-list').name,
])
  .directive('autoUnFollow', require('./unfollow-directive'))
