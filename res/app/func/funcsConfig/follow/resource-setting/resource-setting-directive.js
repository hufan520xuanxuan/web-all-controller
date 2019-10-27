module.exports = function ResourceSettingDirective($http, $routeParams) {
  return {
    restrict: 'E'
    , template: require('./resource-setting.pug')
    , scope: {
    }
    , link: function(scope, element) {
      scope.users = ''
      scope.type = 1
      $http.get('/app/api/v1/ins_account_detail/' + $routeParams.account)
        .then(res => {
          let insAccount = res.data.data
          insAccount.config.follow.insUsers = Array.isArray(insAccount.config.follow.insUsers) ?
            insAccount.config.follow.insUsers : []
          scope.insAccount = insAccount
        }).catch(err => {
        let {
          msg
        } = err.data
        if (msg) {
          scope.error = msg
        }
      })

      /**
       * 添加资源
       */
      scope.addResource = function() {
        // 判断users是否有内容
        if (scope.users) {
          let users = scope.users.split('\n')
          scope.users = ''
          let type = scope.type

          users.map(user => {
            scope.insAccount.config.follow.insUsers.push({
              res: user,
              status: 1,
              level: 1,
              type,
              record: 0,
              created: window.moment().format('YYYY-MM-DD HH:mm')
            })
          })

          $http.post('/app/api/v1/ins/update_config', scope.insAccount)
        }
      }
    }
  }
}
