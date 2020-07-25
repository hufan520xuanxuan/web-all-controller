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

  //自动取关
  $scope.ksUnFollow = function () {
    let json = '\'' + JSON.stringify($scope.ks) + '\''
    runFunc(json, 'ks.KsUnFollow')
  }

  //自动回关
  $scope.ksFollowBack = function () {
    let json = '\'' + JSON.stringify($scope.ks) + '\''
    runFunc(json, 'ks.KsFollowBack')
  }

  //通讯录加关注
  $scope.ksContactAdd = function () {
    let json = '\'' + JSON.stringify($scope.ks) + '\''
    runFunc(json, 'ks.KsContactAdd')
  }

  //推荐列表加关注
  $scope.ksRecommendAdd = function () {
    let json = '\'' + JSON.stringify($scope.ks) + '\''
    runFunc(json, 'ks.KsRecommendAdd')
  }

  //评论列表加关注
  $scope.ksCommentAdd = function () {
    let json = '\'' + JSON.stringify($scope.ks) + '\''
    runFunc(json, 'ks.KsCommentAdd')
  }

  //评论列表点赞
  $scope.ksCommentLike = function () {
    let json = '\'' + JSON.stringify($scope.ks) + '\''
    runFunc(json, 'ks.KsCommentLike')
  }

  //评论列表私信
  $scope.ksCommentMsg = function () {
    let json = '\'' + JSON.stringify($scope.ks) + '\''
    runFunc(json, 'ks.KsCommentMsg')
  }

  //私信列表私信
  $scope.ksListMsg = function () {
    let json = '\'' + JSON.stringify($scope.ks) + '\''
    runFunc(json, 'ks.KsListMsg')
  }

  //*************************************** 微信 *****************************************************************//

  //微信参数
  $scope.wx = {
    idList: 'M2018520\n1445145745',
    sayList: '话术1\n话术2'
  }

  //打开微信主界面
  $scope.wxStart = function () {
    startApp('com.tencent.mm', 'com.tencent.mm.ui.LauncherUI')
  }

  //搜索加好友
  $scope.wxAddSearch = function () {
    let json = '\'' + JSON.stringify($scope.wx) + '\''
    runFunc(json, 'wx.WxAddSearch')
  }

  //通讯录加好友
  $scope.wxAddContact = function () {
    let json = '\'' + JSON.stringify($scope.wx) + '\''
    runFunc(json, 'wx.WxAddContact')
  }

  //群加好友
  $scope.wxAddGroup = function () {
    let json = '\'' + JSON.stringify($scope.wx) + '\''
    runFunc(json, 'wx.WxAddGroup')
  }

  //添加群成员
  $scope.wxGroupAdd = function () {
    let json = '\'' + JSON.stringify($scope.wx) + '\''
    runFunc(json, 'wx.WxGroupAdd')
  }

  //朋友圈转发
  $scope.wxCirclePublish = function () {
    let json = '\'' + JSON.stringify($scope.wx) + '\''
    runFunc(json, 'wx.WxCirclePublish')
  }

  //朋友圈点赞
  $scope.wxCircleLike = function () {
    let json = '\'' + JSON.stringify($scope.wx) + '\''
    runFunc(json, 'wx.WxCircleLike')
  }

  //朋友圈评论
  $scope.wxCircleComment = function () {
    let json = '\'' + JSON.stringify($scope.wx) + '\''
    runFunc(json, 'wx.WxCircleComment')
  }

  //*************************************** 闲鱼 *****************************************************************//

  //闲鱼参数
  $scope.xy = {
    idList: 'M2018520\n1445145745',
    sayList: '话术1\n话术2'
  }

  //打开闲鱼主界面
  $scope.xyStart = function () {
    startApp('com.taobao.idlefish', 'com.taobao.fleamarket.home.activity.InitActivity')
  }

  //好友列表私信
  $scope.xyListMsg = function () {
    let json = '\'' + JSON.stringify($scope.xy) + '\''
    runFunc(json, 'xy.XyListMsg')
  }

  //首页浏览商品
  $scope.xyHomeView = function () {
    let json = '\'' + JSON.stringify($scope.xy) + '\''
    runFunc(json, 'xy.XyHomeView')
  }

  //浏览指定商品
  $scope.xyViewPost = function () {
    let json = '\'' + JSON.stringify($scope.xy) + '\''
    runFunc(json, 'xy.XyViewPost')
  }

  //粉丝列表加关注
  $scope.xyListAdd = function () {
    let json = '\'' + JSON.stringify($scope.xy) + '\''
    runFunc(json, 'xy.XyListAdd')
  }

}
