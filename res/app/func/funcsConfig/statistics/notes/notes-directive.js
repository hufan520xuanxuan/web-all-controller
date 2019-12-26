const E = require('wangeditor')

module.exports = function AutoUnFollowDirective($http, $routeParams) {
  return {
    restrict: 'E'
    , template: require('./notes.pug')
    , scope: {
    }
    , link: function(scope, element) {
      let editor = new E('#editor')
      editor.create()

      $http.post('/app/api/v1/ins/get_notes', {
        account: $routeParams.account
      }).then(res => {
        editor.txt.html(res.data.data)
      })

      scope.save = function() {
        $http.post('/app/api/v1/ins/save_notes', {
          notes: editor.txt.html(),
          account: $routeParams.account
        })
      }
    }
  }
}
