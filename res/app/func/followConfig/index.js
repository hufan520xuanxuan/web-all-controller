require('angular-bootstrap-switch')
require('./follow.css')
require('eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css')
require('../../static/ng.datetimepicker')

module.exports = angular.module('ccp.func-follow-config', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  require('stf/common-ui/nothing-to-show').name,
  'frapontillo.bootstrap-switch',
  'datetimepicker'
])
  .config(function($routeProvider) {
    $routeProvider
      .when('/func-follow/:account', {
        template: require('./followConfig.pug')
      })
  })
  .controller('FollowCtrl', require('./follow-controller'))
