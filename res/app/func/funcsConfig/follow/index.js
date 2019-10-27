require('./follow.css')

module.exports = angular.module('ccp.func-autofollow', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  require('./setting').name,
  require('../logs').name
])
  .directive('autoFollow', require('./follow-directive'))
