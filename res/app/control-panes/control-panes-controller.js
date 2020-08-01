module.exports =
  function ControlPanesController(
    $scope,
    $http,
    gettext,
    $routeParams,
    $timeout,
    $location,
    DeviceService,
    GroupService,
    ControlService,
    StorageService,
    FatalMessageService,
    SettingsService) {

    var sharedTabs = [
      {
        title: gettext('功能模块'),
        icon: 'fa-group color-green',
        templateUrl: 'control-panes/script/script.pug',
        filters: ['native', 'web']
      },
      {
        title: gettext('屏幕截图'),
        icon: 'fa-camera color-skyblue',
        templateUrl: 'control-panes/screenshots/screenshots.pug',
        filters: ['native', 'web']
      },
      {
        title: gettext('手机设置'),
        icon: 'fa-gear color-brown',
        templateUrl: 'control-panes/advanced/advanced.pug',
        filters: ['native', 'web']
      },
      {
        title: gettext('文件管理'),
        icon: 'fa-folder-open color-blue',
        templateUrl: 'control-panes/explorer/explorer.pug',
        filters: ['native', 'web']
      },
      {
        title: gettext('设备信息'),
        icon: 'fa-info color-orange',
        templateUrl: 'control-panes/info/info.pug',
        filters: ['native', 'web']
      },
      {
        title: gettext('运行日志'),
        icon: 'fa-list-alt color-red',
        templateUrl: 'control-panes/logs/logs.pug',
        filters: ['native', 'web']
      }
    ]

    //右上方功能栏
    $scope.topTabs = [
      {
        title: gettext('控制面板'),
        icon: 'fa-dashboard fa-fw color-pink',
        templateUrl: 'control-panes/dashboard/dashboard.pug',
        filters: ['native', 'web']
      }
    ].concat(angular.copy(sharedTabs))

    //右下方功能栏
    $scope.belowTabs = [
      {
        title: gettext('Logs'),
        icon: 'fa-list-alt color-red',
        templateUrl: 'control-panes/logs/logs.pug',
        filters: ['native', 'web']
      }
    ].concat(angular.copy(sharedTabs))

    $scope.allStatus = false
    $scope.tracker = DeviceService.trackAll($scope)
    $scope.device = null
    $scope.control = null
    $scope.controlAll = null
    $scope.channelList = []
    $scope.mainChannel = []
    $scope.serialList = []

    // 设备获取要单控的设备
    // TODO: Move this out to Ctrl.resolve
    function getDevice(serial) {
      DeviceService.get(serial, $scope)
        .then(function (device) {
          return GroupService.invite(device)
        })
        .then(function (device) {
          $scope.device = device
          $scope.control = ControlService.create(device, device.channel)
          // TODO: Change title, flickers too much on Chrome
          // $rootScope.pageTitle = device.name
          SettingsService.set('lastUsedDevice', serial)
          return device
        })
        //保存设备列表
        .then(function () {
          let devices = _.sortBy($scope.tracker.devices, device => Number(device.notes)).filter(item => !item.adminUsing)
          devices.filter(device => device.state === 'available' || device.state === 'using').forEach(device => {
            //添加到所有设备列表
            $scope.serialList.push(device.serial)
            $scope.channelList.push(device.channel)
            //添加到主设备列表
            if (device.serial === $routeParams.serial) {
              $scope.mainChannel.push(device.channel)
            }
            //执行脚本的所有控制
            $scope.controlAll = ControlService.create(devices, $scope.channelList)
          })
        })
        .catch(function () {
          $timeout(function () {
            $location.path('/')
          })
        })
    }

    $scope.getAllDevice = function () {
      $scope.allStatus = !$scope.allStatus
      getAllDevices()
    }

    function getAllDevices() {
      // 延迟执行代码
      $timeout(() => {
        if ($scope.control !== null) {
          if ($scope.allStatus) {
            $scope.control.setChannel($scope.channelList)
          } else {
            $scope.control.setChannel($scope.mainChannel)
          }
        }
      }, 10)
    }

    getAllDevices()
    getDevice($routeParams.serial)

    $scope.$watch('device.state', function (newValue, oldValue) {
      if (newValue !== oldValue) {
        if (oldValue === 'using') {
          FatalMessageService.open($scope.device, false)
        }
      }
    }, true)

  }
