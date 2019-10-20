require('angular-bootstrap-switch')
require('./funcs.css')

module.exports = angular.module('ccp.funcs-config', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  require('stf/common-ui/nothing-to-show').name,
  'frapontillo.bootstrap-switch',
])
  .config(function($routeProvider) {
    $routeProvider
      .when('/funcs/:account', {
        template: require('./funcsConfig.pug')
      })
  })
  .controller('FuncsCtrl', require('./funcs-controller'))
