require('./nowpost.css')
require('angular-bootstrap-switch')
require('eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css')
require('../../../../static/ng.datetimepicker')

module.exports = angular.module('ccp.func-post-nowpost', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  'frapontillo.bootstrap-switch',
  'datetimepicker'
])
  .directive('nowPost', require('./nowpost-directive'))
