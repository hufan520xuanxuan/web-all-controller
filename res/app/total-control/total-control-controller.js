module.exports = function TotalControlCtrl(
  $scope
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

  setTimeout(() => {
    $scope.$apply(function() {
      $scope.status = 0
      if ($scope.tracker.devices.length) {
        let controlList = ''
        let mainScreen = ''
        $scope.tracker.devices.map(device => {
          if(device.state === 'available' || device.state === 'using') {
            if (!mainScreen) {
              mainScreen = device
            } else {
              if(controlList) {
                controlList += ','
              }
              controlList += device.channel
            }
          }
        })
        $scope.controlList = controlList
        $scope.mainScreen = mainScreen
        console.log($scope)
      }
    })
  }, 1000)


  $scope.changeControlList = (e) => {
    console.log(e)
  }
}
