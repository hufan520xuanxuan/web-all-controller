require('./post-model2.css')

module.exports = angular.module('ccp.func-post-model2', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
])
  .directive('postModel2', require('./post-model2-directive'))
