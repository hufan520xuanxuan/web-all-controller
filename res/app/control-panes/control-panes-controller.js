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

    $scope.tracker = DeviceService.trackAll($scope)
    $scope.device = null
    $scope.control = null
    $scope.channelList = []


    // TODO: Move this out to Ctrl.resolve
    function getDevice(serial) {
      DeviceService.get(serial, $scope)
        .then(function(device) {
          return GroupService.invite(device)
        })
        .then(function(device) {
          $scope.device = device
          console.log(device)
          $scope.control = ControlService.create(device,  device.channel)
          // TODO: Change title, flickers too much on Chrome
          // $rootScope.pageTitle = device.name
          SettingsService.set('lastUsedDevice', serial)
          return device
        })
        .catch(function() {
          $timeout(function() {
            $location.path('/')
          })
        })
    }

    function getAllDevices() {
      $timeout(() => {
        if ($scope.tracker.devices.length) {
          let devices = _.sortBy($scope.tracker.devices, device => Number(device.notes)).filter(item => !item.adminUsing)

          const channelList = []
          devices.filter(device => device.state === 'available' || device.state === 'using').forEach(device => {
            channelList.push(device.channel)
          })

          console.log(channelList)
          $scope.channelList = channelList

          $scope.control.setChannel(channelList)
        }
      }, 1000)
    }

    getAllDevices()
    getDevice($routeParams.serial)

    $scope.$watch('device.state', function(newValue, oldValue) {
      if (newValue !== oldValue) {
        if (oldValue === 'using') {
          FatalMessageService.open($scope.device, false)
        }
      }
    }, true)

  }
