require('./style.css')
// window.$ = require('jquery')
require.ensure([], function (require) {
  require('angular')
  require('angular-route')
  require('angular-touch')

  angular.module('app', [
    'ngRoute',
    'ngTouch',
    require('gettext').name,
    require('angular-hotkeys').name,
    require('./layout').name,
    require('./device-list').name,
    require('./control-panes').name,
    require('./menu').name,
    require('./settings').name,
    require('./docs').name,
    require('./user').name,
    require('./../common/lang').name,
    require('stf/standalone').name,
    require('./func').name,
    require('./cloud-control').name,
    require('./total-control').name,
    require('./page-total-control').name,
    require('./log').name,
    require('./func/funcsConfig').name,
    require('./func/funcsConfig/post/post-model1/post').name
  ])
    .config(function ($routeProvider, $locationProvider) {
      $locationProvider.hashPrefix('!')
      $routeProvider
        .otherwise({
          redirectTo: '/devices'
        })
    })

    .config(function (hotkeysProvider) {
      hotkeysProvider.templateTitle = 'Keyboard Shortcuts:'
    })
})
