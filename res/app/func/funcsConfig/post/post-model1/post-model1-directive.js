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
          // size: 'sm',
          controller: function($scope) {
            $scope.post = {
              title: '',
              created: moment().format('YYYY-MM-DD HH:mm'),
              imgList: [],
              res: '',
              postTime: moment().format('YYYY-MM-DD HH:mm'),
              type: 1
            }
            $scope.error = ''

            $scope.closeModal = function() {
              $scope.post = {
                title: '',
                created: moment().format('YYYY-MM-DD HH:mm'),
                imgList: [],
                res: '',
                postTime: moment().format('YYYY-MM-DD HH:mm'),
                type: 1
              }
              model.close()
            }

            $scope.uploadImg = function(e) {
              let files = e[0].files
              let formData = new FormData()
              for (let i = 0; i < files.length; i++) {
                formData.append('files', files.item(i))
              }

              $http({
                method: 'POST',
                url: '/app/api/v1/upload_file',
                // encType: 'multipart/form-data',
                headers: {
                  'Content-Type': undefined
                },
                data: formData
              }).then(res => {
                $scope.post.imgList = [...$scope.post.imgList, ...res.data.data]
              })
            }

            /**
             * 移除图片
             * @param index
             */
            $scope.removeImg = function(index) {
              $scope.post.imgList.splice(index, 1)
            }

            $scope.save = function() {
              $scope.error = ''
              if ($scope.post.title) {
                let {
                  post,
                } = $scope
                scope.colums.push(post)
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
