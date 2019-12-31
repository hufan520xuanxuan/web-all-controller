require('eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css')

require('../../../../static/ng.datetimepicker')
require('./source-analysis.css')

module.exports = angular.module('ccp.func-statistics-source-analysis', [
  'datetimepicker'
])
  .directive('sourceAnalysis', require('./source-analysis-directive'))
