module.exports = function PostDetailCtrl($scope, $routeParams, $http) {
  $scope.post = {}
  $scope.file = null

  let insAccount

  function getDetail() {
    let index = $routeParams.index
    $http.get('/app/api/v1/ins_account_detail/' + $routeParams.account)
      .then(res => {
        insAccount = res.data.data
        let post = insAccount.config.post.postList[index]
        post.postTime = window.moment(post.postTime).format('YYYY-MM-DD HH:mm:ss')

        $scope.post = post
      })
    // $http.post('/app/api/v1/ins/get_post', {
    //   id
    // }).then(res => {
    //   let post = res.data.data
    //   post.postTime = window.moment(post.postTime).format('YYYY-MM-DD HH:mm:ss')
    //   $scope.post = post
    // })
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

  $scope.save = () => {
    let post = JSON.parse(JSON.stringify($scope.post))
    post.type = Number(post.type)
    post.postTime = Number(window.moment(post.postTime))

    let index = $routeParams.index
    insAccount.config.post.postList[index] = post

    insAccount.type = 6
    $http.post('/app/api/v1/ins/update_config', insAccount)
  }

  getDetail()
}
