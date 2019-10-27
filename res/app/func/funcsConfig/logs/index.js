require('./logs.css')

module.exports = angular.module('ccp.func-logs', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name
])
  .directive('funcLogs', require('./logs-directive'))
