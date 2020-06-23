module.exports =
  function FatalMessageServiceFactory($uibModal, $location, $route, $interval,
                                      StateClassesService) {
    var FatalMessageService = {}

    var intervalDeviceInfo

    var ModalInstanceCtrl = function($scope, $uibModalInstance, device,
                                     tryToReconnect) {
      $scope.ok = function() {
        console.log('222=重新加载')
        $uibModalInstance.close(true)
        $route.reload()
      }

      function update() {
        $scope.device = device
        $scope.stateColor = StateClassesService.stateColor(device.state)
      }

      update()

      // TODO: remove this please
      intervalDeviceInfo = $interval(update, 750)

      if (tryToReconnect) {
        // TODO: this is ugly, find why its not updated correctly (also on the device list)
        intervalDeviceInfo = $interval(function() {
          update()

          if (device.usable) {
            // Try to reconnect
            $scope.ok()
          }
        }, 1000, 500)
      }

      $scope.second = function() {
        console.log('222=去设备列表?')
        $uibModalInstance.dismiss()
        $location.path('/devices/')
      }

      $scope.cancel = function() {
        console.log('222=取消?')
        $uibModalInstance.dismiss('cancel')
      }

      var destroyInterval = function() {
        if (angular.isDefined(intervalDeviceInfo)) {
          $interval.cancel(intervalDeviceInfo)
          intervalDeviceInfo = undefined
        }
      }

      $scope.$on('$destroy', function() {
        console.log('222=断开连接了?')
        destroyInterval()
      })
    }

    FatalMessageService.open = function(device, tryToReconnect) {
      console.log('222=打开重连的弹窗')
      var modalInstance = $uibModal.open({
        // 这里注释了  重连的窗口就没了
        template: require('./fatal-message.pug'),
        controller: ModalInstanceCtrl,
        resolve: {
          device: function () {
            return device
          },
          tryToReconnect: function () {
            return tryToReconnect
          }
        }
      })
      modalInstance.result.then(function() {
      }, function() {
      })
      // 自动连接会有bug
      // setTimeout(() => {
      //   $route.reload()
      // }, 1000)
    }


    return FatalMessageService
  }
