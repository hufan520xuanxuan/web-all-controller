require('./func-switch.css')
require('angular-bootstrap-switch')

module.exports = angular.module('stf.func-switch', [
  require('stf/common-ui').name,
  'frapontillo.bootstrap-switch'
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/dashboard/func-switch/func-switch.pug',
      require('./func-switch.pug')
    )
  }])
  .controller('FuncSwitchCtrl', require('./func-switch-controller'))
