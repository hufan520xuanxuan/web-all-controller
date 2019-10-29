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

  //打开设置中某个界面的方法
  function openSetting(activity) {
    run('am start -a android.intent.action.MAIN -n com.android.settings/.Settings\\$' + activity)
  }

  //***************************************下面是一些具体打开app的方法***********************************//

  //打开Ins主界面
  $scope.openIns = function() {
    run('am start -a android.intent.action.MAIN -n com.instagram.android/.activity.MainTabActivity')
  }

  //打开SSR主界面
  $scope.openSSR = function() {
    run('am start in.zhaoj.shadowsocksr/com.github.shadowsocks.Shadowsocks')
  }

  //打开微信主界面
  $scope.openWechat = function() {
    run('am start -a android.intent.action.MAIN -n com.tencent.mm/.ui.LauncherUI')
  }

  //打开抖音主界面
  $scope.openDouyin = function() {
    run('am start -a android.intent.action.MAIN -n com.ss.android.ugc.aweme/.splash.SplashActivity')
  }

  //打开微博主界面
  $scope.openWeibo = function() {
    run('am start -a android.intent.action.MAIN -n com.sina.weibo/.SplashActivity')
  }

  //打开西瓜视频
  $scope.openXigua = function() {
    run('am start -a android.intent.action.MAIN -n com.ss.android.article.video/' +
      '.activity.SplashActivity')
  }

  //打开QQ
  $scope.openQq = function() {
    run('am start -a android.intent.action.MAIN -n com.tencent.mobileqq/.activity.SplashActivity')
  }

  //输入法设置
  $scope.openInput = function() {
    run('am start -a android.intent.action.MAIN -n com.android.settings/.LanguageSettings')
  }

  //关于手机
  $scope.openAbout = function() {
    run('am start com.android.settings/com.android.settings.DeviceInfoSettings')
  }

  //设置Wifi
  $scope.openWiFiSettings = function() {
    run('am start -a android.settings.WIFI_SETTINGS')
  }

  //打开设置
  $scope.openSettings = function() {
    run('am start -a android.intent.action.MAIN -n com.android.settings/.Settings')
  }

  //打开开发者选项
  $scope.openDeveloperSettings = function() {
    run('am start com.android.settings/com.android.settings.DevelopmentSettings')
  }

  //导入图片到手机相册
  $scope.copyPic = function() {
    // run('push /Users/hufan/Desktop/设备图片/iphone11.jpg /storage/emulated/0/DCIM/iphone11.jpg')
    // pushResource('/Users/hufan/Desktop/设备图片/iphone11.jpg')
  }

  //管理apps
  $scope.openManageApps = function() {
    run('am start -a android.settings.APPLICATION_SETTINGS')
  }

  //显示设置
  $scope.openDisplay = function() {
    run('am start -a android.intent.action.MAIN -n com.android.settings/.DisplaySettings')
  }

  $scope.clear = function() {
    $scope.command = ''
    $scope.data = ''
    $scope.result = null
  }
}
