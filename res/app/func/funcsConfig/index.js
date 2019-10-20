require('./funcs.css')

module.exports = angular.module('ccp.funcs-config', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  require('./follow').name,
  require('./unfollow').name
])
  .config(function($routeProvider) {
    $routeProvider
      .when('/funcs/:account', {
        template: require('./funcsConfig.pug')
      })
  })
  .controller('FuncsCtrl', require('./funcs-controller'))
