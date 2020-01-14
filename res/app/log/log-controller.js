module.exports = function LogCtrl(
  $scope
  , $http
) {

  $scope.page = 1
  $scope.totalPage = []

  function getLogs() {
    let page = $scope.page
    $http.post('/app/api/v1/ins/logs', {
      page
    }).then(res => {
      $scope.totalPage = res.data.total
      let list = res.data.data
      list.map(item => {
        item.created = window.moment(item.created).format('YYYY-MM-DD HH:mm')
      })
      $scope.logs = list
    })
  }

  getLogs()

  $scope.getLogs = getLogs

  $scope.range = function (start, end) {
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

  $scope.next = function() {
    ++$scope.page
    getLogs()
  }

  $scope.prev = function() {
    --$scope.page
    getLogs()
  }
}
