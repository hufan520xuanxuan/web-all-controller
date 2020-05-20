require('./page-total-control.css')

module.exports = angular.module('page-total-control', [
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
      .when('/page-total-control', {
        template: require('./page-total-control.pug'),
        controller: 'PageTotalControlCtrl'
      })
  }])
  .run(function(editableOptions) {
    // bootstrap3 theme for xeditables
    editableOptions.theme = 'bs3'
  })
  .controller('PageTotalControlCtrl', require('./page-total-control-controller'))
