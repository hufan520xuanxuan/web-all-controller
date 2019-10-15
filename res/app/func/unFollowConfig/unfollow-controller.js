module.exports = function unFollowCtrl($scope, $routeParams, $http) {
  $scope.insAccount = {}
  $scope.error = ''
  $scope.switchOnText = '开启'
  $scope.switchOffText = '关闭'

  $http.get('/app/api/v1/ins_account_detail/' + $routeParams.account)
    .then(res => {
      $scope.insAccount = res.data.data
    }).catch(err => {
    let {
      msg
    } = err.data
    if (msg) {
      $scope.error = msg
    }
  })

  $scope.switchChange = () => {
    let item = $scope.insAccount
    let account = item.account
    let status = item.config.follow.status

    $http.post('/app/api/v1/update_ins_follow_state', {
      account,
      status
    })
  }

}
