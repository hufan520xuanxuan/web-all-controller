module.exports = function ResourceSettingDirective($http, $routeParams, $timeout) {
  return {
    restrict: 'E'
    , template: require('./resource-setting.pug')
    , scope: {
    }
    , link: function(scope, element) {
      scope.users1 = ''
      scope.users2 = ''
      scope.users3 = ''
      scope.type = 1
      scope.status = false
      $timeout(() => {
        scope.status = true
      }, 0)
      $http.get('/app/api/v1/ins_account_detail/' + $routeParams.account)
        .then(res => {
          let insAccount = res.data.data
          scope.insAccount = insAccount
        }).catch(err => {
        let {
          msg
        } = err.data
        if (msg) {
          scope.error = msg
        }
      })

      function getResource(type) {
        let resourceType = ''
        let usersType = ''
        switch(Number(type)) {
          case 1: resourceType = 'resource1'
            usersType = 'users1'
            break
          case 2:
          case 3: resourceType = 'resource2'
            usersType = 'users2'
            break
          case 4:
          case 5: resourceType = 'resource3'
            usersType = 'users3'
            break
        }

        return {
          resourceType,
          usersType
        }
      }

      /**
       * 添加资源
       */
      scope.addResource = function(type) {
        let {
          usersType,
          resourceType
        } = getResource(type)
        console.log(scope, usersType, scope[usersType], scope.users1)
        // 判断users是否有内容
        if (scope[usersType]) {
          let users = scope[usersType].split('\n')
          scope[usersType] = ''

          if (resourceType) {
            console.log(scope.insAccount.config.follow.insUsers, resourceType)
            users.map(user => {
              scope.insAccount.config.follow.insUsers[resourceType].res.push({
                res: user,
                status: 1,
                level: 1,
                type,
                record: 0,
                created: window.moment().format('YYYY-MM-DD HH:mm')
              })
            })

            // $http.post('/app/api/v1/ins/update_config', scope.insAccount)
          }
        }
      }

      scope.switchChange = function() {
        // $http.post('/app/api/v1/ins/update_config', scope.insAccount)
      }

      scope.addlevel = function(type, index) {
        let {
          resourceType
        } = getResource(type)
        let level = scope.insAccount.config.follow.insUsers[resourceType].res[index].level
        if (level < 10) {
          ++scope.insAccount.config.follow.insUsers[resourceType].res[index].level
          // $http.post('/app/api/v1/ins/update_config', scope.insAccount)
        }
      }

      scope.reductionLevel = function(type, index) {
        let {
          resourceType
        } = getResource(type)
        let level = scope.insAccount.config.follow.insUsers[resourceType].res[index].level
        if (level > 0) {
          --scope.insAccount.config.follow.insUsers[resourceType].res[index].level
          // $http.post('/app/api/v1/ins/update_config', scope.insAccount)
        }
      }

      scope.delInsUser = function(type, index) {
        let {
          resourceType
        } = getResource(type)
        let ret = confirm('是否确定删除？')
        if (ret) {
          scope.insAccount.config.follow.insUsers[resourceType].res.splice(index, 1)
          // $http.post('/app/api/v1/ins/update_config', scope.insAccount)
        }
      }

      scope.switchResStatus = () => {
        // $http.post('/app/api/v1/ins/update_config', scope.insAccount)
      }

      scope.addResLevel = (type) => {
        let {
          resourceType
        } = getResource(type)
        let level = scope.insAccount.config.follow.insUsers[resourceType].level
        if (level < 10) {
          ++scope.insAccount.config.follow.insUsers[resourceType].level
          // $http.post('/app/api/v1/ins/update_config', scope.insAccount)
        }
      }

      scope.reductionResLevel = function(type) {
        let {
          resourceType
        } = getResource(type)
        let level = scope.insAccount.config.follow.insUsers[resourceType].level
        if (level > 0) {
          --scope.insAccount.config.follow.insUsers[resourceType].level
          // $http.post('/app/api/v1/ins/update_config', scope.insAccount)
        }
      }

      scope.save = function() {
        let insUsers = scope.insAccount.config.follow.insUsers
        let levelSet = new Set()
        Object.keys(insUsers).map(key => {
          let level = insUsers[key]
          levelSet.add(level.level)
        })
        if (levelSet.size === 3) {
          $http.post('/app/api/v1/ins/update_config', scope.insAccount)
        } else {
          alert('请检查资源优先级')
        }
      }
    }
  }
}
