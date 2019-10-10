module.exports = function SignInCtrl($scope, $http) {

  $scope.error = null

  // 登陆请求接口的地方
  $scope.submit = function() {
    var data = {
      // name: $scope.signin.username.$modelValue
      // , email: $scope.signin.email.$modelValue
      // todo 这里每次打包要配置这个用户的用户名
      id: 1
      // , username: 'xiaohei'
      // , password: 'xiaohei666'
      , username: $scope.signin.username.$modelValue
      , password: $scope.signin.password.$modelValue
    }
    var data1 = {
      name: $scope.signin.username.$modelValue
      , password: $scope.signin.password.$modelValue
      // , email: $scope.signin.email.$modelValue
      , email: '123@123.com'
    }
    $scope.invalid = false
    $http.post('http://47.98.142.217:8080/user/login', data)
      .success(function(response) {
        if (response.success) {
          $http.post('/auth/api/v1/mock', data1)
            .success(function(response) {
              $scope.error = null
              location.replace(response.redirect)
            })
        }
        else {
          //打印错误日志
          $scope.error = {
            $error: true
          }
        }
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
