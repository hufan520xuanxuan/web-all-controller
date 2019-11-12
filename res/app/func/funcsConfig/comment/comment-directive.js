module.exports = function AutoUnFollowDirective($http, $uibModal) {
  return {
    restrict: 'E'
    , template: require('./comment.pug')
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
