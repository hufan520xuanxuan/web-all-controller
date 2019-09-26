module.exports = function SignInCtrl($scope, $http) {

  $scope.error = null

  // 登陆请求接口的地方
  $scope.submit = function() {
    var data = {
      // name: $scope.signin.username.$modelValue
      // , email: $scope.signin.email.$modelValue
      id: 123
      , username: 'xiaohei'
      , password: 'woshishui'
    }
    var data1 = {
      name: $scope.signin.username.$modelValue
      , email: $scope.signin.email.$modelValue
    }
    $scope.invalid = false
    $http.post('http://47.98.142.217:8080/user/login', data)
    // $http.post('/auth/api/v1/mock', data)
      .success(function(response) {
        $http.post('/auth/api/v1/mock', data1)
          .success(function(response) {
            $scope.error = null
            location.replace(response.redirect)
          })
        // $scope.error = null
        // location.replace(response.redirect)
      })
      .error(function(response) {
        switch (response.error) {
          case 'ValidationError':
            $scope.error = {
              $invalid: true
            }
            break
          case 'InvalidCredentialsError':
            $scope.error = {
              $incorrect: true
            }
            break
          default:
            $scope.error = {
              $server: true
            }
            break
        }
      })
  }
}
