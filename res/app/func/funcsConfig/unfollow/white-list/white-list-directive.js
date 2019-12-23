module.exports = function WhiteListDirective($http, $routeParams, $timeout) {
  return {
    restrict: 'E'
    , template: require('./white-list.pug')
    , scope: {}
    , link: function(scope, element) {
      scope.status = false
      scope.list = []
      scope.whiteListStr = ''
      scope.page = 1
      scope.hasNext = 1
      scope.search = ''
      $http.post('/app/api/v1/ins/get_unfollow_whitelist_status', {
        account: $routeParams.account
      })
        .then(res => {
          scope.whiteListStatus = res.data.data
          scope.status = true
        })

      function getList() {
        $http.post('/app/api/v1/ins/get_unfollow_whitelist', {
          account: $routeParams.account,
          page: scope.page,
          search: scope.search
        })
          .then(res => {
            scope.list = res.data.data
            scope.hasNext =  scope.list.length === 10
          })
      }

      getList()

      scope.getList = getList

      scope.addWhiteList = function() {
        let users = [...new Set(scope.whiteListStr.split('\n'))]
        scope.whiteListStr = ''

        $http.post('/app/api/v1/ins/update_unfollow_whitelist', {
          account: $routeParams.account,
          list: users
        }).then(res => {
          getList()
        })
      }

      scope.changeSwitch = function() {
        $http.post('/app/api/v1/ins/update_unfollow_whitelist_status', {
          account: $routeParams.account,
          status: scope.whiteListStatus
        })
      }

      scope.del = function(index) {
        let ret = confirm('是否确定删除？')
        if(ret) {
          let item = scope.list[index]
          $http.post('/app/api/v1/ins/del_unfollow_whitelist', {
            account: $routeParams.account,
            resName: item
          }).then(res => {
            getList()
          })
        }
      }

      scope.searchList = function() {
        scope.page = 1
        getList()
      }

      scope.next = function() {
        ++scope.page
        getList()
      }

      scope.prev = function() {
        --scope.page
        getList()
      }
    }
  }
}
