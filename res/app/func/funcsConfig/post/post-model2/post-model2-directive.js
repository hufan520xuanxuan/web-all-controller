module.exports = function PostModel2Directive($http, $routeParams, $timeout) {
  return {
    restrict: 'E'
    , template: require('./post-model2.pug')
    , scope: {}
    , link: function(scope, element) {
      scope.post = {}
      scope.file = null

      scope.insAccount = {}

      scope.status = false
      $timeout(() => {
        scope.status = true
      }, 0)

      function getDetail() {
        $http.get('/app/api/v1/ins_account_detail/' + $routeParams.account)
          .then(res => {
            scope.insAccount = res.data.data
            let post = scope.insAccount.config.post.randomPost
            post.postTime = window.moment(post.postTime).format('YYYY-MM-DD HH:mm:ss')

            scope.post = post
          })
      }

      scope.uploadImg = function(e) {
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
          scope.post.imgList = [...scope.post.imgList, ...res.data.data]
        })
      }

      /**
       * 移除图片
       * @param index
       */
      scope.removeImg = function(index) {
        scope.post.imgList.splice(index, 1)
      }

      scope.save = () => {
        let post = JSON.parse(JSON.stringify(scope.post))
        post.type = Number(post.type)
        post.postTime = Number(window.moment(post.postTime))

        scope.insAccount.config.post.randomPost = post

        scope.insAccount.type = 6
        $http.post('/app/api/v1/ins/update_config', scope.insAccount)
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

      getDetail()
    }
  }
}
