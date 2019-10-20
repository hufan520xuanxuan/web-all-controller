module.exports = function FollowCtrl($scope, $routeParams, $http) {
  $scope.activeTabs = {
    autoFollow: true,
    autoUnfollow: false,
    autoThumb: false,
    autoComments: false,
    autoMessage: false,
    autoPost: false
  }
}
