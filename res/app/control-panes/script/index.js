require('./script.css')

module.exports = angular.module('stf.script', [
  require('angular-xeditable').name,
  require('stf/device').name,
  require('stf/user/group').name,
  require('stf/control').name,
  require('stf/common-ui').name,
  require('stf/settings').name,
  require('../device-control').name
])
  .run(['$templateCache', function ($templateCache) {
    $templateCache.put('control-panes/script/script.pug',
      require('./script.pug')
    )
  }])
  .controller('ScriptCtrl', require('./script-controller'))

