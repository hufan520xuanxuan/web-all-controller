require('./post.css')
require('eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css')
require('../../../../../static/ng.datetimepicker')


module.exports = angular.module('ccp.funcs-post-detail', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  'datetimepicker'
])
  .config(function($routeProvider) {
    $routeProvider
      .when('/post/detail/:id', {
        template: require('./post.pug')
      })
  })
  .controller('PostDetailCtrl', require('./post-controller'))
