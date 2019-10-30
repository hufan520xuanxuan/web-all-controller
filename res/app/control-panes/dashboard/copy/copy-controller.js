// See https://github.com/android/platform_packages_apps_settings/blob/master/AndroidManifest.xml
module.exports = function ShellCtrl($scope, InstallService) {
  $scope.result = null
  $scope.copyation = null

  //进度条
  $scope.$on('copyation', function(e, copyation) {
    $scope.copyation = copyation.apply($scope)
  })

  //拷贝图片
  $scope.installPic = function($files) {
    if ($files.length) {
      return InstallService.installPic($scope.control, $files)
    }
  }

}
