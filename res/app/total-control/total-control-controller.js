module.exports = function TotalControlCtrl(
  $scope,
  $timeout,
  DeviceService,
  DeviceColumnService,
  GroupService,
  ControlService,
  SettingsService,
  InstallService,
  $location,
  $http
) {
  $scope.tracker = DeviceService.trackAll($scope)
  $scope.control = ControlService.create($scope.tracker.devices, '*ALL')
  $scope.columnDefinitions = DeviceColumnService
  $scope.status = 1
  $scope.mainScreen = {}
  $scope.controlList = ''
  $scope.checkAll = false
  $scope.size = 2

  let deviceCount = 0

  // 系统工具
  $scope.xt = {
    shellName: '这里贴上你要启动的脚本的shell',
    contacts: '111,222',
    mlUsrs: '13388433582',
    controlList: '',
    pasteContent: '',
    wfName: 'Tips:这里填写要连接的Wifi名称',
    wfPwd: 'Tips:这里填写要连接的Wifi密码'
  }
  // facebook
  $scope.fb = {
    type: 1,
    gender: 0,
    language: 0,
    business: '不限',
    minAge: 18,
    maxAge: 25,
    addNum: 10
  }
  // 抖音
  $scope.dy = {
    dkName: '抖音短视频分身',
    minViewTime: 1,
    maxViewTime: 10,
    homeCommentAll: '拍的不错\n厉害啊',
    homeViewNum: 10,
    homeLikeNum: 2,
    homeCommentNum: 3,
    liveBuy: 5,
    searchId: 'Y523222369\n1715636540\n13388433582',
    videoIndex: 2,
    videoAdd: true,
    videoLike: true,
    videoComment: true,
    addType: 1,
    addNum: 3,
    addAllNum: 20,
    minPageNum: 1,
    maxPageNum: 5,
    allAddNum: 20,
    minView: 1,
    maxView: 10,
    minCommentNum: 5,
    videoCommentNum: 8,
    allCommentNum: 20
  }
  // 快手
  $scope.ks = {
    homeCommentAll: '拍的很好',
    homeViewNum: 10,
    homeLikeNum: 2,
    homeCommentNum: 3,
    commentType: 1,
    searchIds: 'ty981231\n热血传奇\n1405702942',
    comments: '拍的不错\n厉害啊',
    commentNum: 3,
    minView: 10,
    maxView: 30,
    searchUsrs: 'SB810810810\ndaweiwangtongtong',
    searchTxts: '很喜欢看你的视频\n视频拍的真好,值得学习.',
    postNum: 2,
    videoId: true,
    videoCommentId: true,
    openComment: true,
    nearVideo: true,
    hasUsr: true
  }
  // 微信
  $scope.wx = {
    circleTxt: '冒号智控,终端批量管理系统.',
    wxIdList: '13388433582\n17764239520\n13277306452',
    sayList: '你好,认识一下',
    sayTxts: '你好,认识一下',
    minPageNum: 1,
    maxPageNum: 5,
    allAddNum: 20
  }
  // 国际版抖音
  $scope.tt = {
    homeCommentAll: '厉害',
    homeViewNum: 10,
    homeLikeNum: 2,
    homeCommentNum: 3,
    viewVideo: false,
    likeVideo: false,
    commentVideo: false,
    searchId: '1715636540',
    commentTxt: '拍的很好的视频'
  }

  //配置功能tab
  module.exports = function FuncCtrl($scope) {
    $scope.activeTabs = {
      xt: true
      , dy: false
      , ks: false
      , wx: false
      , tt: false
      , fb: false
      , ins: false
      , qq: false
      , wb: false
      , mm: false
      , xg: false
      , xw: false
      , yx: false
      , qt: false
    }
  }

  //初始化群控
  initTotalControl()

  //调节屏幕尺寸
  $scope.changeSize = (size) => {
    $scope.size = size
  }

  //获取设备列表(全选的实现方法)
  $scope.getAllDeviceChannel = () => {
    let totalCount = $scope.devices.filter(device => device.state === 'available' || device.state === 'using').length || 1
    totalCount -= 1
    let controlListArray = $scope.controlList ? $scope.controlList.split(',') : []
    let controlList = ''
    if (controlListArray.length >= totalCount) {
      controlList = ''
    } else {
      $scope.devices.map(device => {
        if ((device.state === 'available' || device.state === 'using')
          && device.serial !== $scope.mainScreen.serial) {
          if (controlList) {
            controlList += ','
          }
          controlList += device.channel
        }
      })
    }
    $scope.controlList = controlList
    checkDeviceControl()
  }

  //选择设备
  $scope.chooseChannel = (channel) => {
    let controlListArray = $scope.controlList ? $scope.controlList.split(',') : []
    let i = controlListArray.indexOf(channel)
    if (i >= 0) {
      controlListArray.splice(i, 1)
    } else {
      controlListArray.push(channel)
    }
    $scope.controlList = controlListArray.join(',')
    checkDeviceControl()
  }

  //保存备注
  $scope.save = (index) => {
    let device = $scope.devices[index]
    DeviceService.updateNote(device.serial, device.notes)
    console.log(device.updateNote)
  }

  //设置主控设备
  $scope.setMainDevice = (index) => {
    let device = $scope.devices[index]
    $http.post('/app/api/v1/device/set_main', {
      serial: device.serial,
      oldSerial: $scope.mainScreen.serial
    })
    $scope.devices.splice(index, 1)
    $scope.devices.unshift(device)
    $scope.mainScreen = device
    $scope.controlList = ''
    $scope.checkAll = false
  }

  //打开Tiktok
  $scope.startTk = () => {
    exeShell('am start -a android.intent.action.MAIN -n com.ss.android.ugc.trill/com.ss.android.ugc.aweme.splash.SplashActivity')
  }

  //停止功能
  $scope.stopFun = () => {
    exeShell('am force-stop com.phone.mhzk')
  }

  // 上滑
  $scope.swipeUp = () => {
    exeShell('am instrument -w -r -e json UP -e debug false -e class \'com.phone.mhzk.function.qt.ScreenSwipe\' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner')
  }

  // 下滑
  $scope.swipeDown = () => {
    exeShell('am instrument -w -r -e json DOWN -e debug false -e class \'com.phone.mhzk.function.qt.ScreenSwipe\' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner')
  }

  //****************************** 系统工具 **************************************************

  //打开淘宝
  $scope.startTb = function () {
    exeShell('am start com.taobao.taobao/com.taobao.tao.TBMainActivity')
  }

  //连接指定wifi
  $scope.linkWifi = function () {
    let json = '\'' + JSON.stringify($scope.xt) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'xt.LinkWifi')
  }

  //打开多开软件
  $scope.startDk = function () {
    exeShell('am start com.bly.dkplat/.widget.splash.Splash')
  }

  //拷贝图片
  $scope.installPic = function ($files) {
    if ($files.length) {
      InstallService.installPic(getControls(), $files)
    }
    //刷新相册识别导入的图片
    exeShell('am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/DCIM/')
  }

  //拷贝视频/文件
  $scope.pushFile = function ($files) {
    console.log('222=', $files[0])
    if ($files.length) {
      InstallService.pushFile(getControls(), $files)
    }
    //刷新相册识别导入的图片
    exeShell('am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/DCIM/')
  }

  //安装本地apk文件
  $scope.installFile = function ($files) {
    if ($files.length) {
      return InstallService.installFile(getControls(), $files)
    }
  }

  //启动自定义脚本
  $scope.startShell = function () {
    console.log('222=shell=' + $scope.xt.shellName)
    exeShell($scope.xt.shellName)
  }

  //设置文字到手机剪切板
  $scope.setContents = function () {
    console.log('222=content=' + $scope.xt.pasteContent)
    getControls().setContent($scope.xt.pasteContent)
  }

  //导入通讯录
  $scope.addContacts = function () {
    let json = '\'' + JSON.stringify($scope.xt) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'xt.AddContacts')
  }

  //清空通讯录
  $scope.clearContacts = function () {
    exeShell('pm clear com.android.providers.contacts')
  }

  // 自动登录
  $scope.autoLogin = function () {
    // exeShell('')
    $scope.xt.controlList = getControlsList()
    console.log('list=' + getControlsList())
    let json = '\'' + JSON.stringify($scope.xt) + '\''
    console.log('json=' + json)
    exeJson(json, 'qt.MlLogin')
  }

  //****************************** 抖音 **************************************************

  //打开抖音
  $scope.startDy = () => {
    exeShell('am start -a android.intent.action.MAIN -n com.ss.android.ugc.aweme/.splash.SplashActivity')
  }

  //打开抖音分身
  $scope.startDyFs = () => {
    let json = '\'' + JSON.stringify($scope.dy) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'dy.DyStartDk')
  }

  //进入直播间
  $scope.dyEnterLive = function () {
    let json = '\'' + JSON.stringify($scope.dy) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'dy.DyEnterLive')
  }

  //直播间疯狂点赞
  $scope.dyLiveLike = function () {
    let json = '\'' + JSON.stringify($scope.dy) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'dy.DyLiveLike')
  }

  //停止疯狂点赞
  $scope.stopLiveLike = function () {
    exeShell('am force-stop com.phone.mhzk')
  }

  //直播间自动评论
  $scope.dyLiveComment = function () {
    let json = '\'' + JSON.stringify($scope.dy) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'dy.DyLiveComment')
  }

  //停止自动评论
  $scope.stopLiveComment = function () {
    exeShell('am force-stop com.phone.mhzk')
  }

  //直播间小黄车加购
  $scope.dyLiveBuy = function () {
    let json = '\'' + JSON.stringify($scope.dy) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'dy.DyLiveBuy')
  }

  //推荐视频评论点赞
  $scope.dyHomeCommentLike = function () {
    let json = '\'' + JSON.stringify($scope.dy) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'dy.DyHomeCommentLike')
  }

  //精准用户视频操作
  $scope.dyVideoOpt = function () {
    let json = '\'' + JSON.stringify($scope.dy) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'dy.DyVideoOpt')
  }

  //添加通讯录好友
  $scope.dyAddContact = function () {
    let json = '\'' + JSON.stringify($scope.dy) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'dy.DyAddContact')
  }

  //首页养号
  $scope.dyHomeView = function () {
    let json = '\'' + JSON.stringify($scope.dy) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'dy.DyHomeView')
  }

  //自动关注
  $scope.dySearchAdd = function () {
    let json = '\'' + JSON.stringify($scope.dy) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'dy.DySearchAdd')
  }

  //****************************** 快手 **************************************************

  //打开快手
  $scope.startKs = () => {
    exeShell('am start -a android.intent.action.MAIN -n com.smile.gifmaker/com.yxcorp.gifshow.HomeActivity')
  }

  //精准评论
  $scope.ksSearchComment = function () {
    let json = '\'' + JSON.stringify($scope.ks) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'ks.KsSearchComment')
  }

  //指定评论
  $scope.ksUsrsComment = function () {
    let json = '\'' + JSON.stringify($scope.ks) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'ks.KsUsrsComment')
  }

  //指定私信
  $scope.ksUsrsMsg = function () {
    let json = '\'' + JSON.stringify($scope.ks) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'ks.KsUsrsMsg')
  }

  //采集用户视频信息
  $scope.ksGetInfo1 = function () {
    let json = '\'' + JSON.stringify($scope.ks) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'ks.KsSearchGetInfo')
  }

  //采集标签视频信息
  $scope.ksGetInfo2 = function () {
    let json = '\'' + JSON.stringify($scope.ks) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'ks.KsGetInfo')
  }

  //首页养号
  $scope.ksHomeView = function () {
    let json = '\'' + JSON.stringify($scope.ks) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'ks.KsHomeView')
  }

  //****************************** 微信 **************************************************

  //打开微信
  $scope.startWx = () => {
    exeShell('am start -a android.intent.action.MAIN -n com.tencent.mm/com.tencent.mm.ui.LauncherUI')
  }

  //添加通讯录好友
  $scope.wxAddContact = function () {
    let json = '\'' + JSON.stringify($scope.wx) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'wx.WxAddContact')
  }

  //自动转发朋友圈(仅文字)
  $scope.sendCircle = function () {
    let json = '\'' + JSON.stringify($scope.wx) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'wx.WxCircleAuto')
  }

  //自动添加id
  $scope.wxSearchAdd = function () {
    let json = '\'' + JSON.stringify($scope.wx) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'wx.WxSearchAdd')
  }

  //****************************** Tiktok **************************************************

  //首页养号
  $scope.tkHomeView = function () {
    let json = '\'' + JSON.stringify($scope.tt) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'tk.HomeView')
  }

  //搜索养号
  $scope.tkSearchView = function () {
    let json = '\'' + JSON.stringify($scope.tt) + '\''
    console.log('222=json=' + json)
    exeJson(json, 'tk.SearchView')
  }

  //****************************** Facebook **************************************************

  //打开Facebook
  $scope.startFb = function () {
    exeShell('am start -a android.intent.action.MAIN -n com.facebook.katana/com.facebook.katana.LoginActivity')
  }

  //打开Message
  $scope.startMsg = function () {
    exeShell('am start -a android.intent.action.MAIN -n com.facebook.orca/com.facebook.orca.auth.StartScreenActivity')
  }

  //执行功能
  $scope.startFunction = function () {
    let config = '\'' + JSON.stringify($scope.fb) + '\''
    console.log('222=config=' + config)
    //执行脚本
    exeJson(config, 'facebook.FbAddAll')
  }

  //主动加好友
  $scope.fbAdd = function () {
    exeShell('am instrument -w -r -e debug false -e class \'com.phone.mhzk.function.facebook.FaceAdd\' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner')
  }

  //通过好友验证
  $scope.fbPass = function () {
    exeShell('am instrument -w -r -e debug false -e class \'com.phone.mhzk.function.facebook.FacePass\' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner')
  }

  //****************************** 工具 **************************************************

  //初始化群控
  function initTotalControl() {
    $timeout(() => {
      if ($scope.tracker.devices.length) {
        let mainScreen = ''
        let devices = _.sortBy($scope.tracker.devices, device => Number(device.notes)).filter(item => !item.adminUsing)
        let mainDeviceIndex = _.findIndex(devices, 'main')
        let mainDevice = devices[mainDeviceIndex]

        if (mainDevice && (mainDevice.state === 'available' || mainDevice.state === 'using')) {
          mainScreen = mainDevice
          devices.splice(mainDeviceIndex, 1)
          devices.unshift(mainDevice)
        }
        let promiseList = []
        devices.map(device => {
          if (device.state === 'available' || device.state === 'using') {
            if (!mainScreen) {
              mainScreen = device
            } else {
              deviceCount += 1
            }
          }
        })

        console.log('设备数量=' + deviceCount)

        let success = () => {
          $timeout(() => {
            $scope.controlList = ''
            $scope.mainScreen = mainScreen
            $scope.devices = devices
            $scope.status = 0
          }, 1000)
        }

        var res = []

        // 构建队列
        function queue(arr) {
          var sequence = Promise.resolve()
          arr.forEach(function (item) {
            sequence = sequence.then(item).then(data => {
              res.push(data)
              return res
            })
          })
          return sequence
        }

        if (promiseList.length) {
          // 执行队列
          queue(promiseList).then(() => {
            initTotalControl()
          })
        } else {
          $timeout(() => {
            $scope.controlList = ''
            $scope.mainScreen = mainScreen
            $scope.devices = devices.filter(device => device.state === 'available' || device.state === 'using')
            $scope.status = 0
          }, 500)
        }
      }
    }, 1000)
  }

  // 设置可显示设备列表
  function setShowDevices() {
    let page = $scope.page
    let limit = 10

    let devices = $scope.devices.split(1, $scope.devices.length)
    // let devices = $scope.devices
    $scope.showDevices = devices.slice((page - 1) * limit, page * limit)
  }

  $scope.prev = function () {
    --$scope.page

    setShowDevices()
  }

  $scope.next = function () {
    ++$scope.page

    setShowDevices()
  }

  // 检查设备
  function checkDeviceControl() {
    let totalCount = $scope.devices.filter(device => device.state === 'available' || device.state === 'using').length || 1
    totalCount -= 1
    let controlListArray = $scope.controlList ? $scope.controlList.split(',') : []
    if (controlListArray.length === totalCount) {
      $scope.checkAll = true
    } else {
      $scope.checkAll = false
    }
  }

  //执行脚本公共
  function exeJson(json, pkg) {
    exeShell('am instrument -w -r -e json ' + json
      + ' -e debug false -e class \'com.phone.mhzk.function.' + pkg
      + '\' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner')
  }

  //执行脚本
  function exeShell(shell) {
    getControls().shell(shell)
  }

  //获取当前选中的设备参数
  function getControls() {
    let cannelList = $scope.controlList.split(',')
    let devices = [$scope.mainScreen]
    cannelList.map(channel => {
      if (channel) {
        let device = _.find($scope.devices, {channel})
        devices.push(device)
      }
    })
    return ControlService.create(devices, cannelList)
  }

  //获取当前选中的设备所有序列号集合
  function getControlsList() {
    let cannelList = $scope.controlList.split(',')
    let devices = [$scope.mainScreen.serial]
    cannelList.map(channel => {
      if (channel) {
        let device = _.find($scope.devices, {channel})
        devices.push(device.serial)
      }
    })
    return devices
  }

}

