require('./post-model1.css')

module.exports = angular.module('ccp.func-post-model1', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
])
  .directive('postModel1', require('./post-model1-directive'))
