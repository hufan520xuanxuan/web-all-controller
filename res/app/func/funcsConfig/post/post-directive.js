module.exports = function AutoUnFollowDirective($http, $uibModal) {
  return {
    restrict: 'E'
    , template: require('./post.pug')
    , scope: {
    }
    , link: function(scope, element) {
      scope.activeTabs = {
        model1: true,
        model2: false,
        logs: false
      }
    }
  }
}
