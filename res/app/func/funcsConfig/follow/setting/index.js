require('./setting.css')
// require('angular-bootstrap-switch')
require('eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css')
require('../../../../static/ng.datetimepicker')

module.exports = angular.module('ccp.func-follow-setting', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  require('../emoji').name,
  'datetimepicker'
])
  .directive('followSetting', require('./setting-directive'))
