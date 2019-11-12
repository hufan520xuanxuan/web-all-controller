require('./setting.css')
// require('angular-bootstrap-switch')
require('eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css')
require('../../../../static/ng.datetimepicker')

module.exports = angular.module('ccp.func-message-setting', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  'datetimepicker'
])
  .directive('messageSetting', require('./setting-directive'))
