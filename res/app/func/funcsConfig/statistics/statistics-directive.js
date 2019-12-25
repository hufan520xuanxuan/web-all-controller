module.exports = function AutoUnFollowDirective($http, $uibModal) {
  return {
    restrict: 'E'
    , template: require('./statistics.pug')
    , scope: {
    }
    , link: function(scope, element) {
      scope.activeTabs = {
        notes: true,
        dataAnalysis: false,
        sourceAnalysis: false
      }
    }
  }
}
