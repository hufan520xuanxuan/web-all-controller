module.exports = angular.module('stf.control-panes', [
  require('stf/device').name,
  require('stf/control').name,
  require('stf/scoped-hotkeys').name,
  require('./device-control').name,

])
  // .config(['$routeProvider', function($routeProvider) {
  //   $routeProvider
  //     .when('/control/:serial', {
  //       template: require('./control-panes.pug'),
  //       controller: 'ControlPanesCtrl',
  //     })
  // }])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/control-panes.pug',
      require('./control-panes.pug')
    )
  }])
  // .controller('ControlPanesCtrl', require('./control-panes-controller'))
  .controller('ControlPanesHotKeysCtrl', require('./control-panes-hotkeys-controller'))
  .directive('controlPanes', require('./control-panes-directive'))

