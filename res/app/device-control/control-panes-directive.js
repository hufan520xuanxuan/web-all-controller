module.exports = function DeviceScreenDirective(
  $http, gettext, $routeParams,
  $timeout, $location, DeviceService, GroupService, ControlService,
  FatalMessageService, SettingsService
) {
  return {
  template: require('./control-panes.pug'),
  scope: {
    controlList: '='
  },
  link: function($scope, element, data) {
      let {
        serial,
        mainScreen = '0',
        control = '0'
      } = data
      let {
        controlList = '',
      } = $scope
      $scope.device = null
      $scope.control = {}

      function getDevice(serial) {
        console.log('来了一个', serial)
        DeviceService.get(serial, $scope)
          .then(function(device) {
            console.log('device到了', device)
            return GroupService.invite(device)
          })
          .then(function(device) {
            console.log('我的device也到了', device)
            $scope.device = device
            if (Number(mainScreen) === 1 || Number(control) === 1) {
              let channelList = controlList ? controlList.split(',') : []
              channelList.push(device.channel)
              $scope.control = ControlService.create(device, channelList)
            } else
            {
              $scope.control = ControlService.create(device, device.channel)
            }
            SettingsService.set('lastUsedDevice', serial)
            console.log($scope.control)
            if (!$scope.control.keyUp) {
              console.log('草你妈，重连')
              getDevice(serial)
            }
            return device
          })
          .catch(function() {
            $timeout(function() {
              $location.path('/')
            })
          })
      }

      $scope.$watch('device.state', function(newValue, oldValue) {
        if (newValue !== oldValue) {
          if (oldValue === 'using') {
            FatalMessageService.open($scope.device, false)
          }
        }
      }, true)

    $scope.$watch('controlList', function(controlList, oldValue) {
      if ($scope.device) {
        let channelList = controlList ? controlList.split(',') : []
        channelList.push($scope.device.channel)
        $scope.control.setChannel(channelList)
      }
    }, true)

      getDevice(serial)
    }
  }
}
