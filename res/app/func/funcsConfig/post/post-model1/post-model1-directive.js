module.exports = function AutoUnFollowDirective($http, $uibModal) {
  return {
    restrict: 'E'
    , template: require('./post-model1.pug')
    , scope: {
    }
    , link: function(scope, element) {

      scope.colums = []
      let moment = window.moment
      /**
       * 获取帖子列表
       */
      function getList() {
        $http.get('/app/api/v1/ins/post_list').then(res => {
          let list = res.data.data
          list.map(item => {
            item.created = moment(item.created).format('YYYY-MM-DD HH:mm')
          })
          scope.colums = res.data.data
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
                $http.post('/app/api/v1/ins/create_post', {
                  title,
                }).then(res => {
                  if (res.data.success) {
                    $scope.title = ''
                    getList()
                    model.close()
                  }
                }).catch(err => {
                  let {
                    msg
                  } = err.data
                  if (msg) {
                    $scope.error = msg
                  }
                })
              }
              else {
                $scope.error = '请输入帖子标题'
              }
            }
          }
        })
      }

      scope.editPost = (id) => {
        location.href = '/#!/post/detail/' + id
      }

      scope.delPost = (id) => {
        $http.post('/app/api/v1/ins/del_post', {
          id
        }).then(() => {
          getList()
        })
      }

      getList()

    }
  }
}
