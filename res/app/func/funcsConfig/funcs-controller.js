module.exports = function FollowCtrl($scope, $routeParams, $http) {
  let {
    type = 'autoFollow'
  } = $routeParams
  let activeTabs = {
    autoFollow: false,
    autoUnfollow: false,
    autoThumb: false,
    autoComments: false,
    autoMessage: false,
    autoPost: false
  }
  activeTabs[type] = true
  $scope.activeTabs = activeTabs
}
