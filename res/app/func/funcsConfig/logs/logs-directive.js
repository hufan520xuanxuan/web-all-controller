module.exports = function FuncLogsDirective($http, $routeParams) {
  return {
    restrict: 'E'
    , template: require('./logs.pug')
    , scope: {
      type: '='
    }
    , link: function(scope, element) {
      let account = $routeParams.account
      let type = scope.type
      scope.page = 1
      scope.hasNext = true

      function getLogs() {
        let page = scope.page
        $http.post('/app/api/v1/ins/account/logs', {
          page,
          account,
          type
        }).then(res => {
          let list = res.data.data
          scope.hasNext = list.length === 10
          list.map(item => {
            item.created = window.moment(item.created).format('YYYY-MM-DD HH:mm')
          })
          scope.logs = list
        })
      }

      getLogs()

      scope.next = function() {
        ++scope.page
        getLogs()
      }

      scope.prev = function() {
        --scope.page
        getLogs()
      }
    }
  }
}
