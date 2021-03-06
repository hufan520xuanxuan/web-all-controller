require('./message.css')

module.exports = angular.module('ccp.func-automessage', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  require('./setting').name,
  require('../logs').name,
  require('./resource-setting').name
])
  .directive('autoMessage', require('./message-directive'))
