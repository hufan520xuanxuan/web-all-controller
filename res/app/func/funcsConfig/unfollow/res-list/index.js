require('./res-list.css')

module.exports = angular.module('ccp.func-unfollow-res-list', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
])
  .directive('resListSetting', require('./res-list-directive'))
