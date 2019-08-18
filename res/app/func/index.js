require('./func.css')

module.exports = angular.module('stf.func', [
    require('stf/common-ui').name,
])
  .config(function($routeProvider) {
    $routeProvider
      .when('/func', {
        template: require('./func.pug')
      })
  })
  .controller('FuncCtrl', require('./func-controller'))
