module.exports = function FuncLogsDirective($http, $routeParams) {
  return {
    restrict: 'E'
    , template: require('./logs.pug')
    , scope: {
    }
    , link: function(scope, element) {
      let serial = $routeParams.serial
      let logType = $routeParams.type
      let type = ''
      switch (logType) {
        case 'autoFollow': type = 1
          break
        case 'autoUnfollow': type = 2
          break
      }
      $http.get('/app/api/v1/ins/logs/' + serial + '?type=' + type).then(res => {
        let list = res.data.data
        list.map(item => {
          item.created = window.moment(item.created).format('YYYY-MM-DD HH:mm')
        })
        scope.logs = list
      })
    }
  }
}
