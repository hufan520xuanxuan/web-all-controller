module.exports = function MenuCtrl($scope, $rootScope, SettingsService,
  $location, $http) {

  SettingsService.bind($scope, {
    target: 'lastUsedDevice'
  })

  SettingsService.bind($rootScope, {
    target: 'platform',
    defaultValue: 'native'
  })

  $scope.$on('$routeChangeSuccess', function() {
    $scope.isControlRoute = $location.path().search('/control') !== -1
  })

  $scope.logout = function() {
    $http.post('/app/api/v1/logout').then(() => {
      location.reload()
    })
  }
}
