require('./dataAnalysis.css')
require('eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css')
require('../../../../static/ng.datetimepicker')

module.exports = angular.module('ccp.func-statistics-data-analysis', [
  'datetimepicker'
])
  .directive('statisticsDataAnalysis', require('./data-analysis-directive'))
