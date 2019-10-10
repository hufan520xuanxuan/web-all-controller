module.exports = function TotalControlCtrl(
  $scope
  , $timeout
  , DeviceService
  , DeviceColumnService
  , GroupService
  , ControlService
  , SettingsService
  , $location
) {
  $scope.tracker = DeviceService.trackAll($scope)
  $scope.control = ControlService.create($scope.tracker.devices, '*ALL')
  // console.log($scope.control)
  $scope.columnDefinitions = DeviceColumnService
  $scope.status = 1
  $scope.mainScreen = {}
  $scope.controlList = ''
  $scope.checkAll = false

  let deviceCount = 0

  $timeout(() => {
    $scope.status = 0
    if ($scope.tracker.devices.length) {
      let mainScreen = ''
      $scope.tracker.devices.map(device => {
        if (device.state === 'available' || device.state === 'using') {
          if (!mainScreen) {
            mainScreen = device
          }
          else {
            deviceCount += 1
          }
        }
      })
      $scope.controlList = ''
      $scope.mainScreen = mainScreen
    }
  }, 1000)

  $scope.getAlldeviceChannel = () => {
    let controlListArray = $scope.controlList ? $scope.controlList.split(',') : []
    let controlList = ''
    if (controlListArray.length === deviceCount) {
      controlList = ''
    }
    else {
      $scope.tracker.devices.map(device => {
        if (device.state === 'available' || device.state === 'using' &&
          device.serial !== $scope.mainScreen.serial) {
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

  function checkDeviceControl() {
    let controlListArray = $scope.controlList ? $scope.controlList.split(',') : []

    if (controlListArray.length === deviceCount) {
      $scope.checkAll = true
    }
    else {
      $scope.checkAll = false
    }
  }

  $scope.chooseChannel = (channel) => {
    let controlListArray = $scope.controlList ? $scope.controlList.split(',') : []
    let i = controlListArray.indexOf(channel)
    if (i >= 0) {
      controlListArray.splice(i, 1)
    }
    else {
      controlListArray.push(channel)
    }
    $scope.controlList = controlListArray.join(',')
    checkDeviceControl()
  }
}
