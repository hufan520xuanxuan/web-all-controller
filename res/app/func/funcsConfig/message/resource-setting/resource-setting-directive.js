module.exports = function ResourceSettingDirective($http, $routeParams, $timeout) {
  return {
    restrict: 'E'
    , template: require('./resource-setting.pug')
    , scope: {}
    , link: function(scope, element) {
      const funcType = 5
      scope.users1 = ''
      scope.users2 = ''
      scope.users3 = ''
      scope.search1 = ''
      scope.search2 = ''
      scope.search3 = ''
      scope.type = 1
      scope.status = false
      scope.resource1 = {
        page: 1,
        res: [],
        hasNext: true,
        level: 0,
        status: 0
      }
      scope.resource2 = {
        page: 1,
        res: [],
        hasNext: true,
        level: 0,
        status: 0
      }
      scope.resource3 = {
        page: 1,
        res: [],
        hasNext: true,
        level: 0,
        status: 0
      }
      scope.rotateMsg = {
        users1: '',
        users2: '',
        users3: ''
      }
      $timeout(() => {
        scope.status = true
      }, 0)

      $http.post('/app/api/v1/ins/get_ins_users', {
        account: $routeParams.account,
        type: funcType
      }).then(res => {
        let {
          resource1,
          resource2,
          resource3
        } = res.data.data

        scope.resource1.status = resource1.status
        scope.resource1.level = resource1.level

        scope.resource2.status = resource2.status
        scope.resource2.level = resource2.level

        scope.resource3.status = resource3.status
        scope.resource3.level = resource3.level
      })

      function getList(type = 1) {
        console.log(scope.search1, 'search' + type, scope)
        $http.post('/app/api/v1/ins/get_resource', {
          account: $routeParams.account,
          type: funcType,
          resourceType: type,
          page: scope['resource' + type].page,
          search: scope['search' + type]
        }).then(res => {
          let list = res.data.data
          scope['resource' + type].res = list
          scope['resource' + type].hasNext = list.length === 10
        })
      }

      getList()
      getList(2)
      getList(3)

      scope.getList = getList

      function getResource(type) {
        let resourceType = ''
        let usersType = ''
        let resType = 1

        switch(Number(type)) {
          case 1: resourceType = 'resource1'
            usersType = 'users1'
            resType = 1
            break
          case 2:
          case 3: resourceType = 'resource2'
            usersType = 'users2'
            resType = 2
            break
          case 4:
          case 5: resourceType = 'resource3'
            usersType = 'users3'
            resType = 3
            break
        }

        return {
          resourceType,
          usersType,
          resType
        }
      }

      /**
       * 添加资源
       */
      scope.addResource = function(type) {
        let {
          usersType,
          resourceType,
          resType
        } = getResource(type)
        // 判断users是否有内容
        if (scope[usersType]) {
          // users去重
          let users = [...new Set(scope[usersType].split('\n'))]

          let rotateMsg = scope.rotateMsg[usersType]
          scope.rotateMsg[usersType] = ''

          scope[usersType] = ''

          if (resourceType) {
            let resList = []
            users.map(user => {
              resList.push({
                res: user,
                type,
                rotateMsg
              })
            })

            $http.post('/app/api/v1/ins/add_resource', {
              resList,
              account: $routeParams.account,
              type: funcType,
              resourceType: resType
            }).then(() => {
              getList(resType)
            })
          }
        }
      }

      scope.switchChange = function(type, index) {
        let {
          resourceType
        } = getResource(type)
        let res = scope[resourceType].res[index]
        updateInsUserRes(res, type)
      }
      scope.addlevel = function(type, index) {
        let {
          resourceType
        } = getResource(type)
        let level = scope[resourceType].res[index].level
        if (level < 10) {
          ++scope[resourceType].res[index].level
          let res = scope[resourceType].res[index]
          updateInsUserRes(res, type)
          // $http.post('/app/api/v1/ins/update_config', scope.insAccount)
        }
      }

      scope.reductionLevel = function(type, index) {
        let {
          resourceType,
        } = getResource(type)
        let level = scope[resourceType].res[index].level
        if (level > 0) {
          --scope[resourceType].res[index].level
          let res = scope[resourceType].res[index]
          updateInsUserRes(res, type)
        }
      }

      function updateInsUserRes(resource, resourceType) {
        let {
          resType
        } = getResource(resourceType)
        $http.post('/app/api/v1/ins/update_resource_res', {
          account: $routeParams.account,
          type: funcType,
          resource,
          resourceType,
        }).then(() => {
          $timeout(() => {
            getList(resType)
          }, 500)
        })
      }

      scope.delInsUser = function(type, index) {
        let {
          resourceType,
          resType
        } = getResource(type)
        let ret = confirm('是否确定删除？')
        if (ret) {

          let res = scope[resourceType].res[index]

          $http.post('/app/api/v1/ins/del_resource', {
            resName: res.res,
            account: $routeParams.account,
            type: funcType,
            resType,
            resourceType: type,
          }).then(() => {
            getList(resType)
          })
        }
      }

      scope.switchResStatus = () => {
        // $http.post('/app/api/v1/ins/update_config', scope.insAccount)
      }

      scope.addResLevel = (type) => {
        let {
          resourceType
        } = getResource(type)
        let level = scope[resourceType].level
        if (level < 10) {
          ++scope[resourceType].level
          // $http.post('/app/api/v1/ins/update_config', scope.insAccount)
        }
      }

      scope.reductionResLevel = function(type) {
        let {
          resourceType
        } = getResource(type)
        let level = scope[resourceType].level
        if (level > 0) {
          --scope[resourceType].level
          // $http.post('/app/api/v1/ins/update_config', scope.insAccount)
        }
      }

      scope.save = function() {
        console.log(scope)
        let resource1 = {
          level: scope.resource1.level,
          status: scope.resource1.status
        }
        let resource2 = {
          level: scope.resource2.level,
          status: scope.resource2.status
        }
        let resource3 = {
          level: scope.resource3.level,
          status: scope.resource3.status
        }
        let levelSet = new Set()
        levelSet.add(resource1.level)
        levelSet.add(resource2.level)
        levelSet.add(resource3.level)
        if (levelSet.size === 3) {
          $http.post('/app/api/v1/ins/update_resource_status', {
            resource1,
            resource2,
            resource3,
            account: $routeParams.account,
            type: funcType,
          })
        } else {
          alert('请检查资源优先级')
        }
      }

      scope.next = function(type = 1) {
        ++scope['resource' + type].page
        getList(type)
      }

      scope.prev = function(type = 1) {
        --scope['resource' + type].page
        getList(type)
      }
    }
  }
}
