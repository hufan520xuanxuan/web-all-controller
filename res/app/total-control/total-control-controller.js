let _ = window._

module.exports = function TotalControlCtrl(
  $scope
  , $timeout
  , DeviceService
  , DeviceColumnService
  , GroupService
  , ControlService
  , SettingsService
  , $location
  , $http
) {
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

  function initTotalControl() {
    $scope.tracker = DeviceService.trackAll($scope)

    $scope.control = ControlService.create($scope.tracker.devices, '*ALL')
    // console.log($scope.control)
    $scope.columnDefinitions = DeviceColumnService
    $scope.status = 1
    $scope.mainScreen = {}
    $scope.controlList = ''
    $scope.checkAll = false

    let deviceCount = 0

    $scope.size = 2

    $timeout(() => {
      if ($scope.tracker.devices.length) {
        let mainScreen = ''
        let devices = _.sortBy($scope.tracker.devices, device => device.notes).filter(item => !item.adminUsing)
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
            console.log(device.adminUsing)
            if (device.adminUsing) {
              // promiseList.push(GroupService.kick(device).catch(function(e) {
              //   throw new Error(e)
              // }))
            }
            if (!mainScreen) {
              mainScreen = device
            }
            else {
              deviceCount += 1
            }
          }
        })
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
          arr.forEach(function(item) {
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
        }
        else {
          $timeout(() => {
            $scope.controlList = ''
            $scope.mainScreen = mainScreen
            $scope.devices = devices
            $scope.status = 0
          }, 500)
        }
      }
      // test
      // run('am start -a android.settings.APPLICATION_SETTINGS')
    }, 1000)
  }

  initTotalControl()

  $scope.getAlldeviceChannel = () => {
    let controlListArray = $scope.controlList ? $scope.controlList.split(',') : []
    let controlList = ''
    if (controlListArray.length === deviceCount) {
      controlList = ''
    }
    else {
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

  $scope.save = (index) => {
    let device = $scope.devices[index]
    DeviceService.updateNote(device.serial, device.notes)
    // destroyXeditableNote(id)
    console.log(device.updateNote)
  }

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

  $scope.startIns = () => {
    exeShell('am start -a android.intent.action.MAIN -n com.instagram.android/.activity.MainTabActivity')
  }

  $scope.startAdd = () => {
    exeShell('am instrument -w -r -e debug false -e class \'com.phone.mhzk.function.facebook.FaceAdd\' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner')
  }

  $scope.startPass = () => {
    exeShell('am instrument -w -r -e debug false -e class \'com.phone.mhzk.function.facebook.FacePass\' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner')
  }


  function exeShell(shell) {
    let cannelList = $scope.controlList.split(',')
    let devices = [$scope.mainScreen]
    console.log(cannelList)
    cannelList.map(channel => {
      if (channel) {
        let device = _.find($scope.devices, {channel})
        console.log(device)
        devices.push(device)
      }
    })

    let control = ControlService.create(devices, cannelList)
    console.log(control)
    control.shell(shell)
  }

  $scope.changeSize = (size) => {
    $scope.size = size
  }
}
