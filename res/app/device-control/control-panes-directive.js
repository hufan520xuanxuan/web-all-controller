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
      $scope.canControl = false
    console.log('----------->')
    console.log(data)
    console.log($scope)

      function getDevice(serial) {
        DeviceService.get(serial, $scope)
          .then(function(device) {
            return GroupService.invite(device)
          })
          .then(function(device) {
            $scope.device = device
            if (Number(mainScreen) === 1 || Number(control) === 1) {
              let channelList = controlList ? controlList.split(',') : []
              channelList.push(device.channel)
              $scope.control = ControlService.create(device, channelList)
              $scope.canControl = true
            } else
            {
              $scope.control = {}
            }
            SettingsService.set('lastUsedDevice', serial)

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
