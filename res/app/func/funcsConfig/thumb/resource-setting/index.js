require('./resuorce-setting.css')

module.exports = angular.module('ccp.func-thumb-resource-setting', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name
])
  .directive('thumbResSetting', require('./thumb-res-setting-directive'))
