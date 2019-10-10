module.exports = function($scope, SettingsService) {

  //重置账号
  $scope.resetSettings = function() {
    SettingsService.reset()
    alert('重置成功')
  }

  //heizi 退出账号
  $scope.exitSettings = function() {

    alert('退出成功')
  }
}
