require('angular-bootstrap-switch')
require('./ins.css')

module.exports = angular.module('ccp.func-ins', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  require('stf/common-ui/nothing-to-show').name,
  'frapontillo.bootstrap-switch'
])
  .directive('insTable', require('../*/ins-directive'))
