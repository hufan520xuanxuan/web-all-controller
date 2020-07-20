module.exports = function ScriptCtrl($scope) {

  //*************************************** 工具 *****************************************************************//

  // 所有设备运行shell
  let allRun = function (cmd) {
    let command = cmd
    command += ' --activity-clear-top'
    return $scope.controlAll.shell(command)
      .then(function (result) {
        console.log('执行命令返回=' + result)
      })
  }

  // 打开app主界面
  let startApp = function (pkgName, className) {
    allRun('am start -a android.intent.action.MAIN -n ' + pkgName + '/' + className)
  }

  // 运行脚本
  function runFunc(json, pkg) {
    console.log('脚本参数=' + json)
    allRun('am instrument -w -r -e json ' + json
      + ' -e debug false -e class \'com.phone.mhzk.allFunc.' + pkg
      + '\' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner')
  }

  // 停止所有脚本运行
  $scope.stopFunc = function () {
    allRun('am force-stop com.phone.mhzk')
  }

  //*************************************** 抖音 *****************************************************************//

  //抖音参数
  $scope.dy = {
    idList: 'M2018520\n1445145745',
    sayList: '话术1\n话术2'
  }

  //打开抖音主界面
  $scope.dyStart = function () {
    startApp('com.ss.android.ugc.aweme', '.splash.SplashActivity')
  }

  //进入抖音直播间
  $scope.dyEnterLive = function () {
    let json = '\'' + JSON.stringify($scope.dy) + '\''
    runFunc(json, 'dy.DyEnterLive')
  }

  //直播间点赞
  $scope.dyLiveLike = function () {
    let json = '\'' + JSON.stringify($scope.dy) + '\''
    runFunc(json, 'dy.DyLiveLike')
  }

  //直播间评论
  $scope.dyLiveComment = function () {
    let json = '\'' + JSON.stringify($scope.dy) + '\''
    runFunc(json, 'dy.DyLiveComment')
  }

  //直播间小黄车
  $scope.dyLiveShop = function () {
    let json = '\'' + JSON.stringify($scope.dy) + '\''
    runFunc(json, 'dy.DyLiveShop')
  }

  //自动关注
  $scope.dyAutoAdd = function () {
    let json = '\'' + JSON.stringify($scope.dy) + '\''
    runFunc(json, 'dy.DyAutoAdd')
  }

  //自动取关
  $scope.dyUnFollow = function () {
    let json = '\'' + JSON.stringify($scope.dy) + '\''
    runFunc(json, 'dy.DyUnFollow')
  }

  //自动回关
  $scope.dyFollowBack = function () {
    let json = '\'' + JSON.stringify($scope.dy) + '\''
    runFunc(json, 'dy.DyFollowBack')
  }

  //发布作品
  $scope.dyPublish = function () {
    let json = '\'' + JSON.stringify($scope.dy) + '\''
    runFunc(json, 'dy.DyPublish')
  }

  //刷视频
  $scope.dyViewVideo = function () {
    let json = '\'' + JSON.stringify($scope.dy) + '\''
    runFunc(json, 'dy.DyViewVideo')
  }

  //视频转发
  $scope.dyShareVideo = function () {
    let json = '\'' + JSON.stringify($scope.dy) + '\''
    runFunc(json, 'dy.DyShareVideo')
  }

  //*************************************** 快手 *****************************************************************//

  //快手参数
  $scope.ks = {
    idList: 'M2018520\n1445145745',
    sayList: '话术1\n话术2'
  }

  //打开快手主界面
  $scope.ksStart = function () {
    startApp('com.smile.gifmaker', 'com.yxcorp.gifshow.HomeActivity')
  }

  //进入快手直播间
  $scope.ksEnterLive = function () {
    let json = '\'' + JSON.stringify($scope.ks) + '\''
    runFunc(json, 'ks.KsEnterLive')
  }

  //快手直播间点赞
  $scope.ksLiveLike = function () {
    let json = '\'' + JSON.stringify($scope.ks) + '\''
    runFunc(json, 'ks.KsLiveLike')
  }

  //快手直播间评论
  $scope.ksLiveComment = function () {
    let json = '\'' + JSON.stringify($scope.ks) + '\''
    runFunc(json, 'ks.KsLiveComment')
  }

  //快手直播间送小爱心
  $scope.ksLiveGift = function () {
    let json = '\'' + JSON.stringify($scope.ks) + '\''
    runFunc(json, 'ks.KsLiveGift')
  }

  //*************************************** 微信 *****************************************************************//

  //打开微信主界面
  $scope.wxStart = function () {
    startApp('com.tencent.mm', 'com.tencent.mm.ui.LauncherUIy')
  }

}
