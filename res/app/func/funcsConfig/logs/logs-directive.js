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
      scope.totalPage = []

      function getLogs() {
        let page = scope.page
        $http.post('/app/api/v1/ins/account/logs', {
          page,
          account,
          type
        }).then(res => {
          scope.totalPage = res.data.total
          scope.allNum = res.data.allNum
          let list = res.data.data
          list.map(item => {
            item.created = window.moment(item.created).format('YYYY-MM-DD HH:mm')
          })
          scope.logs = list
        })
      }

      getLogs()

      scope.getLogs = getLogs

      scope.clearLogs = function() {
        let ret = confirm('是否确认清空日志?')

        if (ret) {
          $http.post('/app/api/v1/ins/account/clear_logs', {
            account,
            type
          }).then(res => {
            getLogs()
          })
        }
      }


      scope.range = function (start, end) {
        let ret = [];
        if (!end) {
          end = start;
          start = 0;
        }
        for (let i = start; i < end; i++) {
          ret.push(i);
        }
        return ret;
      }

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
