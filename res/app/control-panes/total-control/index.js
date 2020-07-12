require('./total-control.css')

module.exports = angular.module('stf.total-control', [
  require('angular-xeditable').name,
  require('stf/device').name,
  require('stf/user/group').name,
  require('stf/control').name,
  require('stf/common-ui').name,
  require('stf/settings').name,
  require('../device-control').name
])
  // .config(['$routeProvider', function ($routeProvider) {
  //   $routeProvider
  //     .when('/total-control', {
  //       template: require('./total-control.pug'),
  //       controller: 'TotalControlCtrl'
  //     })
  // }])
  // .run(function(editableOptions) {
  //   // bootstrap3 theme for xeditables
  //   editableOptions.theme = 'bs3'
  // })
  .run(['$templateCache', function ($templateCache) {
    $templateCache.put('control-panes/total-control/total-control.pug',
      require('./total-control.pug')
    )
  }])
  .controller('TotalControlCtrl', require('./total-control-controller'))


// require('./screenshots.css')
//
// module.exports = angular.module('stf.screenshots', [
//   require('stf/image-onload').name,
//   require('stf/settings').name
// ])
//   .run(['$templateCache', function($templateCache) {
//     $templateCache.put('control-panes/screenshots/screenshots.pug',
//       require('./screenshots.pug')
//     )
//   }])
//   .controller('ScreenshotsCtrl', require('./screenshots-controller'))
