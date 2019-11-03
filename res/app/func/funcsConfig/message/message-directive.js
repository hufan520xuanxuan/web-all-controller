module.exports = function AutoUnFollowDirective($http, $uibModal) {
  return {
    restrict: 'E'
    , template: require('./message.pug')
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
