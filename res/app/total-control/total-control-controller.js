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

  // 运行shell指令的地方
  var run = function(cmd) {
    var command = cmd
    // Force run activity
    command += ' --activity-clear-top'
    return $scope.control.shell(command)
      .then(function(result) {
        // console.log('执行命令返回=' + result)
      })
  }

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
    run('am start -a android.settings.APPLICATION_SETTINGS')
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
