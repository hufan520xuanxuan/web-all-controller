module.exports = function AutoFollowDirective($http, $uibModal) {
  return {
    restrict: 'E'
    , template: require('./follow.pug')
    , scope: {
    }
    , link: function(scope, element) {
      scope.activeTabs = {
        setting: true,
        asset: false,
        logs: false
      }
    }
  }
}
