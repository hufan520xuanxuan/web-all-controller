require('./cloud-control.css')

// 导包
module.exports = angular.module('cloud-control', [
  require('angular-xeditable').name,
  require('stf/device').name,
  require('stf/user/group').name,
  require('stf/control').name,
  require('stf/common-ui').name,
  require('stf/settings').name,
  require('../device-control').name
])
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/cloud-control', {
        template: require('./cloud-control.pug'),
        controller: 'CloudControlCtrl'
      })
  }])
  .run(function (editableOptions) {
    // bootstrap3 theme for xeditables
    editableOptions.theme = 'bs3'
  })
  .controller('CloudControlCtrl', require('./cloud-control-controller'))
