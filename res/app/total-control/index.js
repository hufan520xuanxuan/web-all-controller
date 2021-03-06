require('./total-control.css')

module.exports = angular.module('total-control', [
  require('angular-xeditable').name,
  require('stf/device').name,
  require('stf/user/group').name,
  require('stf/control').name,
  require('stf/common-ui').name,
  require('stf/settings').name,
  require('../device-control').name
])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/total-control', {
        template: require('./total-control.pug'),
        controller: 'TotalControlCtrl'
      })
  }])
  .run(function(editableOptions) {
    // bootstrap3 theme for xeditables
    editableOptions.theme = 'bs3'
  })
  .controller('TotalControlCtrl', require('./total-control-controller'))
