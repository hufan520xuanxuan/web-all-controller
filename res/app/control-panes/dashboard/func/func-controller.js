// 功能模块执行
module.exports = function ShellCtrl($scope) {
  $scope.result = null

  let run = function(cmd) {
    let command = cmd
    // Force run activity
    command += ' --activity-clear-top'
    return $scope.control.shell(command)
      .then(function(result) {
        // console.log(result)
      })
  }

  function openSetting(activity) {
    run('am start -a android.intent.action.MAIN -n com.android.settings/.Settings\\$' +
      activity)
  }

  $scope.openIns = function() {
    // run('am start -a android.intent.action.MAIN -n com.instagram.android/.activity.MainTabActivity')
    run('am start -a android.intent.action.MAIN -n com.tencent.mm/.ui.LauncherUI')
  }

  $scope.openWechat = function() {
    run('am start -a android.intent.action.MAIN -n com.tencent.mm/.ui.LauncherUI')
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
