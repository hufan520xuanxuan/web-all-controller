const E = require('wangeditor')

module.exports = function AutoUnFollowDirective($http, $uibModal) {
  return {
    restrict: 'E'
    , template: require('./notes.pug')
    , scope: {
    }
    , link: function(scope, element) {
      let editor = new E('#editor')
      editor.create()
    }
  }
}
