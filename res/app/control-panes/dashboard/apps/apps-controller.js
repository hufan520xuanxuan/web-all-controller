// See https://github.com/android/platform_packages_apps_settings/blob/master/AndroidManifest.xml

module.exports = function ShellCtrl($scope) {
  $scope.result = null

  // 运行shell指令的地方
  var run = function(cmd) {
    var command = cmd
    // Force run activity
    command += ' --activity-clear-top'
    return $scope.control.shell(command)
      .then(function(result) {
        // console.log('执行命令返回=' + result)
      })
  }

  // TODO: Move this to server side
  // TODO: Android 2.x doesn't support openSetting(), account for that on the UI

  function openSetting(activity) {
    run('am start -a android.intent.action.MAIN -n com.android.settings/.Settings\\$' + activity)
  }

  $scope.openIns = function() {
    // run('am start -a android.intent.action.MAIN -n com.instagram.android/.activity.MainTabActivity')
    run('am instrument -w -r   -e debug false -e class \'com.phone.mhzk.function.instagram.InsFollow\' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner')
  }

  $scope.openWechat = function() {
    // run('am start -a android.intent.action.MAIN -n com.tencent.mm/.ui.LauncherUI')
    run('am instrument -w -r   -e debug false -e class \'com.phone.mhzk.function.wechat.WechatCircleAuto\' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner')
  }

  $scope.openSettings = function() {
    run('am start -a android.intent.action.MAIN -n com.android.settings/.Settings')
  }

  $scope.openWiFiSettings = function() {
    //openSetting('WifiSettingsActivity')
    run('am start -a android.settings.WIFI_SETTINGS')
  }

  $scope.openLocaleSettings = function() {
    openSetting('LocalePickerActivity')
  }

  $scope.openIMESettings = function() {
    openSetting('KeyboardLayoutPickerActivity')
  }

  $scope.openDisplaySettings = function() {
    openSetting('DisplaySettingsActivity')
  }

  $scope.openDeviceInfo = function() {
    openSetting('DeviceInfoSettingsActivity')
  }

  $scope.openManageApps = function() {
    //openSetting('ManageApplicationsActivity')
    run('am start -a android.settings.APPLICATION_SETTINGS')
  }

  $scope.openRunningApps = function() {
    openSetting('RunningServicesActivity')
  }

  $scope.openDeveloperSettings = function() {
    openSetting('DevelopmentSettingsActivity')
  }

  $scope.clear = function() {
    $scope.command = ''
    $scope.data = ''
    $scope.result = null
  }
}
