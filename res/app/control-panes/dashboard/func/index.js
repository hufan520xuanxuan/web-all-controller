require('./func.css')

module.exports = angular.module('stf.func', [
  require('stf/common-ui').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/dashboard/func/func.pug',
      require('./func.pug')
    )
  }])
  .controller('FuncCtrl', require('./func-controller'))
