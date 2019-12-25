require('./funcs.css')

module.exports = angular.module('ccp.funcs-config', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  require('./follow').name,
  require('./unfollow').name,
  require('./thumb').name,
  require('./comment').name,
  require('./message').name,
  require('./post').name,
  require('./browse').name,
  require('./statistics').name,
])
  .config(function($routeProvider) {
    $routeProvider
      .when('/funcs/:account/:type', {
        template: require('./funcsConfig.pug')
      })
  })
  .controller('FuncsCtrl', require('./funcs-controller'))
