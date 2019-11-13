require('./resuorce-setting.css')

module.exports = angular.module('ccp.func-message-resource-setting', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name
])
  .directive('msgResSetting', require('./resource-setting-directive'))
