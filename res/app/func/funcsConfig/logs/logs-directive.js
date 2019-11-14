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
      scope.totalPage = 1

      function getLogs() {
        let page = scope.page
        $http.post('/app/api/v1/ins/account/logs', {
          page,
          account,
          type
        }).then(res => {
          scope.totalPage = res.data.totalPage
          let list = res.data.data
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
