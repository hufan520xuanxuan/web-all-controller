require('./white-list.css')

module.exports = angular.module('ccp.func-unfollow-white-list', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
])
  .directive('whiteListSetting', require('./white-list-directive'))
