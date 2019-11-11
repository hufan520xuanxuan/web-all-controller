require('./setting.css')
// require('angular-bootstrap-switch')
require('eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css')
require('../../../../static/ng.datetimepicker')

module.exports = angular.module('ccp.func-thumb-setting', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  'datetimepicker'
])
  .directive('thumbSetting', require('./setting-directive'))
