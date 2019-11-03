require('./funcs.css')

module.exports = angular.module('ccp.funcs-config', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  require('./follow').name,
  require('./unfollow').name,
  require('./thumb').name,
  require('./comments').name,
  require('./message').name,
  require('./post').name
])
  .config(function($routeProvider) {
    $routeProvider
      .when('/funcs/:account/:type/:serial', {
        template: require('./funcsConfig.pug')
      })
  })
  .controller('FuncsCtrl', require('./funcs-controller'))
