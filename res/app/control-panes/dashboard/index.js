module.exports = angular.module('stf.dashboard', [
  require('./navigation/index').name,
  require('./shell/index').name,
  require('./install/index').name,
  require('./copy/index').name,
  require('./apps/index').name,
  // require('./func/index').name,
  require('./clipboard/index').name,
  require('./remote-debug/index').name,
  require('./func-switch/index').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'control-panes/dashboard/dashboard.pug'
      , require('./dashboard.pug')
    )
  }])
  .controller('DashboardCtrl', require('./dashboard-controller'))
