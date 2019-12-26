require('./statistics.css')

module.exports = angular.module('ccp.func-statistics', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  require('./notes').name,
  require('./dataAnalysis').name
])
  .directive('statistics', require('./statistics-directive'))
