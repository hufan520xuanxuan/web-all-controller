require('./emoji.css')
module.exports = angular.module('ccp.emoji', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
])
  .directive('emoji', require('./emoji-directive'))
