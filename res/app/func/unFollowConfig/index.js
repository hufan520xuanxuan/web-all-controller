require('angular-bootstrap-switch')
require('./unfollow.css')

module.exports = angular.module('ccp.func-unfollow-config', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  require('stf/common-ui/nothing-to-show').name,
  'frapontillo.bootstrap-switch',
])
  .config(function($routeProvider) {
    $routeProvider
      .when('/func-unfollow/:account', {
        template: require('./unFollowConfig.pug')
      })
  })
  .controller('unFollowCtrl', require('./unfollow-controller'))
