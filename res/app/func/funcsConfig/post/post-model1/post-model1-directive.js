const _findKey = require('lodash/findKey')

module.exports = function AutoUnFollowDirective($http, $uibModal, $routeParams) {
  return {
    restrict: 'E'
    , template: require('./post-model1.pug')
    , scope: {
    }
    , link: function(scope, element) {

      scope.colums = []
      let moment = window.moment
      let insAccount

      /**
       * 获取帖子列表
       */
      function getList() {
        $http.get('/app/api/v1/ins_account_detail/' + $routeParams.account)
          .then(res => {
            insAccount = res.data.data
            scope.colums = insAccount.config.post.postList
          })
      }

      /**
       * 创建帖子
       */
      scope.createPost = function() {
        let model = $uibModal.open({
          template: require('./create-post.pug'),
          size: 'sm',
          controller: function($scope) {
            $scope.title = ''
            $scope.error = ''

            $scope.closeModal = function() {
              $scope.title = ''
              model.close()
            }

            $scope.save = function() {
              $scope.error = ''
              if ($scope.title) {
                let {
                  title,
                } = $scope
                scope.colums.push({
                  title,
                  created: moment().format('YYYY-MM-DD HH:mm'),
                  imgList: [],
                  res: '',
                  postTime: '',
                  type: 1
                })
                $scope.title = ''
                model.close()
                updateConfig()
              }
              else {
                $scope.error = '请输入帖子标题'
              }
            }
          }
        })
      }

      /**
       * 更新配置
       */
      function updateConfig() {
        insAccount.config.post.postList = scope.colums
        $http.post('/app/api/v1/ins/update_config', insAccount)
      }

      scope.editPost = (index) => {
        let {account} = $routeParams
        location.href = '/#!/post/detail/' + account + '/' + index
      }

      scope.delPost = (index) => {
        scope.colums.splice(index, 1)
        updateConfig()
      }

      getList()

    }
  }
}
