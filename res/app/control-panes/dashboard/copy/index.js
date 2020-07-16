require('./copy.css')

require('ng-file-upload')

module.exports = angular.module('stf.copy', [
  'angularFileUpload',
  require('stf/common-ui').name,
  require('stf/upload').name
])
  .run(['$templateCache', function ($templateCache) {
    $templateCache.put('control-panes/dashboard/copy/copy.pug',
      require('./copy.pug')
    )
  }])
  .controller('CopyCtrl', require('./copy-controller'))
