module.exports = function FollowCtrl($scope, $routeParams, $http) {
  let {
    type = 'autoFollow'
  } = $routeParams
  let activeTabs = {
    autoFollow: false,
    autoUnfollow: false,
    autoThumb: false,
    autoComment: false,
    autoMessage: false,
    autoPost: false
  }
  activeTabs[type] = true
  $scope.activeTabs = activeTabs

  $scope.back = function() {
    history.back()
  }


  $http.get('/app/api/v1/ins/device_name?account=' + $routeParams.account).then(res => {
    $scope.deviceName = res.data.data ? res.data.data.notes || res.data.data.serial : '未绑定设备'
    $scope.account = $routeParams.account
  })
}
