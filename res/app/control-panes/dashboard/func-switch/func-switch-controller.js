// 功能模块执行
module.exports = function FuncSwitchCtrl($scope, $http, $routeParams) {
  $scope.switchOnText = '开启'
  $scope.switchOffText = '关闭'
  $scope.accountList = []
  let serial = $routeParams.serial

  function getAccount() {
    $http.post('/app/api/v1/ins_account_by_serial', {
      serial
    }).then(res => {
      $scope.accountList = res.data.data
    })
  }

  getAccount()

  $scope.switchChange = (type, index) => {
    let item = $scope.accountList[index]
    let account = item.account
    let status = item.config[type].status

    let url = ''
    switch(type) {
      case 'follow': url = '/app/api/v1/update_ins_follow_state'
        break
      case 'unfollow': url = '/app/api/v1/update_ins_unfollow_state'
        break
      case 'thumb': url = '/app/api/v1/update_ins_thumb_state'
        break
      case 'comment': url = '/app/api/v1/update_ins_comment_state'
        break
      case 'message': url = '/app/api/v1/update_ins_message_state'
        break
      case 'post': url = '/app/api/v1/update_ins_post_state'
        break
      case 'browse': url = '/app/api/v1/update_ins_browse_state'
        break
    }

    $http.post(url, {
      account,
      status
    })
  }
}
