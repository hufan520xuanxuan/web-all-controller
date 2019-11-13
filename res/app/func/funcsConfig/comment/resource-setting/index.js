require('./resuorce-setting.css')

module.exports = angular.module('ccp.func-resource-setting', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name
])
  .directive('commentResSetting', require('./resource-setting-directive'))
