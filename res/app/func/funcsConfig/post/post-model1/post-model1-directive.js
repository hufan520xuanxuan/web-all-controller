module.exports = function AutoPostDirective($http, $uibModal, $routeParams, $timeout) {
  return {
    restrict: 'E'
    , template: require('./post-model1.pug')
    , scope: {}
    , link: function (scope, element) {

      scope.colums = []
      let moment = window.moment
      scope.insAccount = {}

      scope.status = false
      $timeout(() => {
        scope.status = true
      }, 0)

      /**
       * 获取帖子列表
       */
      function getList() {
        $http.get('/app/api/v1/ins_account_detail/' + $routeParams.account)
          .then(res => {
            scope.insAccount = res.data.data
            scope.colums = scope.insAccount.config.post.postList
          })
      }

      /**
       * 创建帖子
       */
      scope.createPost = function () {
        let model = $uibModal.open({
          template: require('./create-post.pug'),
          // size: 'sm',
          backdrop: 'static',
          controller: function ($scope) {
            function resetPost() {
              $scope.emoji1Visible = false
              $scope.emoji2Visible = false

              $scope.toggleEmoji = (key) => {
                $scope[key] = !$scope[key]
              }

              $scope.post = {
                id: Date.now() + '' + Math.round(Math.random() * 10000),
                title: '',
                checkSsr: 0, // 是否检查ssr
                checkV2: 0,
                startInfo: {
                  status: 0,       // 开启的状态
                  startName: 'Instagram'    // 分身的名称
                },
                locInfo: {
                  status: 0,       // 开启的状态
                  locName: '中国'    // 模拟位置的名称
                },
                postDelay: {
                  status: false, // 延时状态
                  minDelay: 1, // 最小延时
                  maxDelay: 1 // 最大延时
                },
                commentInfo: {
                  comment: '',
                  status: false
                },
                created: moment().format('YYYY-MM-DD HH:mm'),
                imgList: [],
                res: '',
                postTime: moment().format('YYYY-MM-DD HH:mm'),
                type: 1,
                used: false
              }
            }

            resetPost()

            $scope.error = ''

            $scope.closeModal = function () {
              resetPost()
              model.close()
            }

            $scope.uploadImg = function (e) {
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
            $scope.removeImg = function (index) {
              $scope.post.imgList.splice(index, 1)
            }

            $scope.save = function () {
              $scope.error = ''
              if ($scope.post.title) {
                let {
                  post,
                } = $scope
                console.log(post)
                scope.colums.push(post)
                model.close()
                updateConfig()
              } else {
                $scope.error = '请输入帖子标题'
              }
            }
          }
        })
      }

      /**
       * 清空帖子库
       */
      scope.clearPost = function () {
        let ret = confirm('是否确定清空帖子？')
        if(ret) {
          scope.colums = []
          updateConfig()
        }
      }

      /**
       * 更新配置
       */
      function updateConfig() {
        scope.insAccount.config.post.postList = scope.colums
        let insAccount = JSON.parse(JSON.stringify(scope.insAccount))
        insAccount.type = 6
        $http.post('/app/api/v1/ins/update_config', insAccount)
      }

      scope.editPost = (index) => {
        let {account} = $routeParams
        location.href = '/#!/post/detail/' + account + '/' + index
      }

      scope.delPost = (index) => {
        let ret = confirm('是否确定删除帖子？')
        if (ret) {
          scope.colums.splice(index, 1)
          updateConfig()
        }
      }

      scope.switchChange = () => {
        let item = scope.insAccount
        let account = item.account
        let status = item.config.post.status

        $http.post('/app/api/v1/update_ins_post_state', {
          account,
          status
        })
      }

      getList()

    }
  }
}
