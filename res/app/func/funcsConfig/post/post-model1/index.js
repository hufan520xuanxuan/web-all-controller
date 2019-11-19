require('./post-model1.css')
require('eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css')
require('../../../../static/ng.datetimepicker')

let moment = window.moment

module.exports = angular.module('ccp.func-post-model1', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  'datetimepicker'
])
  .directive('postModel1', require('./post-model1-directive'))
  .filter('filterMomentTime', function() {
    return function(time) {

      return moment(time).format('YYYY-MM-DD HH:mm:ss')
    }
  })

