require('./log.css')

module.exports = angular.module('log', [])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/log', {
        template: require('./log.pug'),
        controller: 'LogCtrl'
      })
  }])
  .run(function(editableOptions) {
    // bootstrap3 theme for xeditables
    editableOptions.theme = 'bs3'
  })
  .controller('LogCtrl', require('./log-controller'))
