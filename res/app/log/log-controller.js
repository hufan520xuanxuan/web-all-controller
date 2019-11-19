module.exports = function LogCtrl(
  $scope
  , $http
) {

  $scope.page = 1
  $scope.hasNext = true

  function getLogs() {
    let page = $scope.page
    $http.post('/app/api/v1/ins/logs', {
      page
    }).then(res => {
      let list = res.data.data
      $scope.hasNext = list.length === 10
      list.map(item => {
        item.created = window.moment(item.created).format('YYYY-MM-DD HH:mm')
      })
      $scope.logs = list
    })
  }

  getLogs()

  $scope.next = function() {
    ++$scope.page
    getLogs()
  }

  $scope.prev = function() {
    --$scope.page
    getLogs()
  }
}
