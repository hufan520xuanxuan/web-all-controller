let _ = window._

module.exports = function CloudControlCtrl(
  $scope
  , $timeout
  , DeviceService
  , DeviceColumnService
  , GroupService
  , ControlService
  , SettingsService
  , InstallService
  , $location
  , $http
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
    shellName: '启动脚本命令',
    contacts: '13866666666\n13688888888',
    mlUsrs: '13366666666\n13866666666',
    controlList: '',
    pasteContent: '粘贴文字到手机剪切板'
  }
  // 屏幕监控
  $scope.jk = {}
  // 抖音
  $scope.dy = {
    homeCommentAll: '厉害',
    homeViewNum: 10,
    homeLikeNum: 2,
    homeCommentNum: 3,
    searchId: '1715636540',
    addType: 1,
    addNum: 3,
    addAllNum: 20,
    minPageNum: 1,
    maxPageNum: 5,
    allAddNum: 20
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
  // 快手
  $scope.ks = {
    homeCommentAll: '拍的很好',
    homeViewNum: 10,
    homeLikeNum: 2,
    homeCommentNum: 3,
    commentType: 1,
    searchIds: '热血传奇',
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
  // 小红书
  $scope.xhs = {}
  // 火山视频
  $scope.hs = {}
  // 今日头条
  $scope.jr = {}
  // 微博
  $scope.wb = {}
  // 陌陌
  $scope.mm = {}

  //配置功能tab
  module.exports = function FuncCtrl($scope) {
    $scope.activeTabs = {
      xt: true
      , jk: false
      , dy: false
      , wx: false
      , ks: false
      , xhs: false
      , hs: false
      , jr: false
      , wb: false
      , mm: false
    }
  }

  //初始化群控
  initCloudControl()

  //****************************** 屏幕监控 **************************************************

  //调节屏幕尺寸
  $scope.changeSize = (size) => {
    $scope.size = size
  }

  //获取设备列表(全选的实现方法)
  $scope.getAllDeviceChannel = () => {
    let controlListArray = $scope.controlList ? $scope.controlList.split(',') : []
    let controlList = ''
    if (controlListArray.length === deviceCount) {
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

  //****************************** 微信 **************************************************

  //打开微信
  $scope.startWx = () => {
    exeShell('am start -a android.intent.action.MAIN -n com.tencent.mm/com.tencent.mm.ui.LauncherUI')
  }

  //添加通讯录好友
  $scope.wxAddContact = function () {
    let json = '\'' + JSON.stringify($scope.wx) + '\'';
    console.log('222=json=' + json)
    exeJson(json, 'wx.WxAddContact')
  }

  //自动转发朋友圈(仅文字)
  $scope.sendCircle = function () {
    let json = '\'' + JSON.stringify($scope.wx) + '\'';
    console.log('222=json=' + json)
    exeJson(json, 'wx.WxCircleAuto')
  }

  //自动添加id
  $scope.wxSearchAdd = function () {
    let json = '\'' + JSON.stringify($scope.wx) + '\'';
    console.log('222=json=' + json)
    exeJson(json, 'wx.WxSearchAdd')
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

  //采集信息
  $scope.ksGetInfo = function () {
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

  //****************************** 小红书 **************************************************

  //打开小红书
  $scope.startXhs = () => {
    exeShell('')
  }

  //****************************** 火山视频 **************************************************

  //打开火山视频
  $scope.startHs = () => {
    exeShell('')
  }

  //****************************** 今日头条 **************************************************

  //打开今日头条
  $scope.startTt = () => {
    exeShell('')
  }

  //****************************** 微博 **************************************************

  //打开微博
  $scope.startWb = () => {
    exeShell('')
  }

  //****************************** 陌陌 **************************************************

  //打开陌陌
  $scope.startMm = () => {
    exeShell('')
  }

  //****************************** 工具 **************************************************

  // 初始化群控
  function initCloudControl() {
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
          console.log('222=device状态=' + device.state)
          if (device.state === 'available' || device.state === 'using') {
            console.log('main=' + mainScreen)
            if (!mainScreen) {
              console.log('fenpei1')
              mainScreen = device
            } else {
              console.log('fenpei2')
              deviceCount += 1
            }
          }
        })

        console.log('device1010=' + deviceCount)

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

        console.log(promiseList)
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
    console.log('device666=' + $scope.controlList)
    let controlListArray = $scope.controlList ? $scope.controlList.split(',') : []
    console.log('device777=' + controlListArray.length + '==' + deviceCount)
    if (controlListArray.length === deviceCount) {
      $scope.checkAll = true
    } else {
      $scope.checkAll = false
    }
    console.log('device888=' + $scope.checkAll)
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

