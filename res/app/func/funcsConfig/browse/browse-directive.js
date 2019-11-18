module.exports = function AutoBrowseDirective($http, $uibModal) {
  return {
    restrict: 'E'
    , template: require('./browse.pug')
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
