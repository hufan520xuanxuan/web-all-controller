module.exports = function FuncLogsDirective($http, $routeParams) {
  return {
    restrict: 'E'
    , template: require('./logs.pug')
    , scope: {
    }
    , link: function(scope, element) {
      let serial = $routeParams.serial
      $http.get('/app/api/v1/ins/logs/' + serial).then(res => {
        let list = res.data.data
        list.map(item => {
          item.created = window.moment(item.created).format('YYYY-MM-DD HH:mm')
        })
        scope.logs = list
      })
    }
  }
}
