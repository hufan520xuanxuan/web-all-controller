let _ = window._;

module.exports = function TotalControlCtrl(
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
  $scope.size = 2;

  let deviceCount = 0;

  // 系统工具
  $scope.xt = {
    shellName: 'tips:这里贴上你要启动的脚本的shell',
    contacts: '111,222'
  }
  // 抖音
  $scope.dy = {
    homeCommentAll: '厉害',
    homeViewNum: 10,
    homeLikeNum: 2,
    homeCommentNum: 3,
    searchId: '1715636540',
    addType: 1,
    addNum: 3,
    addAllNum: 20
  }
  // 快手
  $scope.ks = {
    homeCommentAll: '拍的很好',
    homeViewNum: 10,
    homeLikeNum: 2,
    homeCommentNum: 3
  }
  // 微信
  $scope.wx = {
    wxIdList: '13388433582\n17764239520\n13277306452',
    sayList: '你好,认识一下'
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
  };

  //初始化群控
  initTotalControl();

  //调节屏幕尺寸
  $scope.changeSize = (size) => {
    $scope.size = size
  }

  //获取设备列表
  $scope.getAllDeviceChannel = () => {
    let controlListArray = $scope.controlList ? $scope.controlList.split(',') : [];
    let controlList = '';
    if (controlListArray.length === deviceCount) {
      controlList = ''
    } else {
      $scope.devices.map(device => {
        if (device.state === 'available' || device.state === 'using' &&
          device.serial !== $scope.mainScreen.serial) {
          if (controlList) {
            controlList += ','
          }
          controlList += device.channel
        }
      })
    }
    $scope.controlList = controlList;
    checkDeviceControl()
  };

  //选择设备
  $scope.chooseChannel = (channel) => {
    let controlListArray = $scope.controlList ? $scope.controlList.split(',') : [];
    let i = controlListArray.indexOf(channel);
    if (i >= 0) {
      controlListArray.splice(i, 1)
    } else {
      controlListArray.push(channel)
    }
    $scope.controlList = controlListArray.join(',');
    checkDeviceControl()
  };

  //保存备注
  $scope.save = (index) => {
    let device = $scope.devices[index];
    DeviceService.updateNote(device.serial, device.notes);
    // destroyXeditableNote(id)
    console.log(device.updateNote)
  };

  //设置主控设备
  $scope.setMainDevice = (index) => {
    let device = $scope.devices[index];

    $http.post('/app/api/v1/device/set_main', {
      serial: device.serial,
      oldSerial: $scope.mainScreen.serial
    });

    $scope.devices.splice(index, 1);
    $scope.devices.unshift(device);
    $scope.mainScreen = device;
    $scope.controlList = '';
    $scope.checkAll = false
  };

  //打开抖音
  $scope.startDy = () => {
    exeShell('am start -a android.intent.action.MAIN -n com.ss.android.ugc.aweme/.splash.SplashActivity')
  };

  //打开快手
  $scope.startKs = () => {
    exeShell('am start -a android.intent.action.MAIN -n com.smile.gifmaker/com.yxcorp.gifshow.HomeActivity')
  };

  //打开微信
  $scope.startWx = () => {
    exeShell('am start -a android.intent.action.MAIN -n com.tencent.mm/com.tencent.mm.ui.LauncherUI')
  };

  //打开Tiktok
  $scope.startTk = () => {
    exeShell('am start -a android.intent.action.MAIN -n com.ss.android.ugc.trill/com.ss.android.ugc.aweme.splash.SplashActivity')
  };

  //停止功能
  $scope.stopFun = () => {
    exeShell('am force-stop com.phone.mhzk')
  };

  //****************************** 系统工具 **************************************************

  //拷贝图片
  $scope.installPic = function ($files) {
    if ($files.length) {
      InstallService.installPic(getControls(), $files)
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

  //****************************** 抖音 **************************************************

  //首页养号
  $scope.dyHomeView = function () {
    let json = '\'' + JSON.stringify($scope.dy) + '\'';
    console.log('222=json=' + json)
    exeJson(json, 'dy.DyHomeView')
  };

  //自动关注
  $scope.dySearchAdd = function () {
    let json = '\'' + JSON.stringify($scope.dy) + '\'';
    console.log('222=json=' + json)
    exeJson(json, 'dy.DySearchAdd')
  };

  //****************************** 快手 **************************************************

  //首页养号
  $scope.ksHomeView = function () {
    let json = '\'' + JSON.stringify($scope.ks) + '\'';
    console.log('222=json=' + json)
    exeJson(json, 'ks.KsHomeView')
    //输入框输入的文字(换行转换的 加到这个里面的参数)
    // exeShell('am instrument -w -r -e json ' + json
    //     + ' -e debug false -e class \'com.phone.mhzk.function.ks.KsHomeView\' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner')
  };

  //****************************** 微信 **************************************************

  //自动添加id
  $scope.wxSearchAdd = function () {
    let json = '\'' + JSON.stringify($scope.wx) + '\'';
    console.log('222=json=' + json)
    exeJson(json, 'wx.WxSearchAdd')
  };

  //****************************** Tiktok **************************************************

  //首页养号
  $scope.tkHomeView = function () {
    let json = '\'' + JSON.stringify($scope.tt) + '\'';
    console.log('222=json=' + json)
    exeJson(json, 'tk.HomeView')
  };

  //搜索养号
  $scope.tkSearchView = function () {
    let json = '\'' + JSON.stringify($scope.tt) + '\'';
    console.log('222=json=' + json)
    exeJson(json, 'tk.SearchView')
  };

  //****************************** Facebook **************************************************

  //打开Facebook
  $scope.startFb = function () {
    exeShell('am start -a android.intent.action.MAIN -n com.facebook.katana/com.facebook.katana.LoginActivity')
  };

  //打开Message
  $scope.startMsg = function () {
    exeShell('am start -a android.intent.action.MAIN -n com.facebook.orca/com.facebook.orca.auth.StartScreenActivity')
  };

  //主动加好友
  $scope.fbAdd = function () {
    exeShell('am instrument -w -r -e debug false -e class \'com.phone.mhzk.function.facebook.FaceAdd\' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner')
  };

  //通过好友验证
  $scope.fbPass = function () {
    exeShell('am instrument -w -r -e debug false -e class \'com.phone.mhzk.function.facebook.FacePass\' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner')
  };

  //****************************** 工具 **************************************************

  //初始化群控
  function initTotalControl() {
    $timeout(() => {
      if ($scope.tracker.devices.length) {
        let mainScreen = '';
        let devices = _.sortBy($scope.tracker.devices, device => Number(device.notes)).filter(item => !item.adminUsing);
        let mainDeviceIndex = _.findIndex(devices, 'main');
        let mainDevice = devices[mainDeviceIndex];

        if (mainDevice && (mainDevice.state === 'available' || mainDevice.state === 'using')) {
          mainScreen = mainDevice;
          devices.splice(mainDeviceIndex, 1);
          devices.unshift(mainDevice)
        }
        let promiseList = [];
        devices.map(device => {
          if (device.state === 'available' || device.state === 'using') {
            console.log(device.adminUsing);
            if (device.adminUsing) {
              // promiseList.push(GroupService.kick(device).catch(function(e) {
              //   throw new Error(e)
              // }))
            }
            if (!mainScreen) {
              mainScreen = device
            } else {
              deviceCount += 1
            }
          }
        });
        let success = () => {
          $timeout(() => {
            $scope.controlList = '';
            $scope.mainScreen = mainScreen;
            $scope.devices = devices;
            $scope.status = 0
          }, 1000)
        };

        var res = [];

        // 构建队列
        function queue(arr) {
          var sequence = Promise.resolve();
          arr.forEach(function (item) {
            sequence = sequence.then(item).then(data => {
              res.push(data);
              return res
            })
          });
          return sequence
        }

        console.log(promiseList);
        if (promiseList.length) {
          // 执行队列
          queue(promiseList).then(() => {
            initTotalControl()
          })
        } else {
          $timeout(() => {
            $scope.controlList = '';
            $scope.mainScreen = mainScreen;
            $scope.devices = devices;
            $scope.status = 0
          }, 500)
        }
      }
    }, 1000)
  }

  // 检查设备
  function checkDeviceControl() {
    let controlListArray = $scope.controlList ? $scope.controlList.split(',') : [];

    if (controlListArray.length === deviceCount) {
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

}

