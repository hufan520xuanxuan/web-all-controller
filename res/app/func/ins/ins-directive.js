module.exports = function InsTableDirective($http, $uibModal) {
  return {
    restrict: 'E'
    , template: require('./ins.pug')
    , scope: {
    }
    , link: function(scope, element) {
      scope.colums = []

      scope.switchOnText = '开启'
      scope.switchOffText = '关闭'

      scope.empty = false

      scope.switchChange = (index, type) => {
        let item = scope.colums[index]
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
        }

        $http.post(url, {
          account,
          status
        }).then(res => {
          getInsList()
        })
      }

      getInsList()
      getAllDevice()

      /**
       * 获取ins账号列表
       */
      function getInsList() {
        $http.get('/app/api/v1/ins_account').then(res => {
          let list = res.data.data
          scope.colums = list
        })
      }

      function getAllDevice() {
        $http.get('/app/api/v1/ins/devices').then(res => {
          let devices = res.data.data
          scope.devices = devices
        })
      }

      scope.createIns = function() {
        let model = $uibModal.open({
          template: require('./create-ins.pug'),
          size: 'sm',
          controller: function($scope) {
            $scope.account = ''
            $scope.error = ''

            $scope.closeModal = function() {
              $scope.account = ''
              model.close()
            }

            $scope.save = function() {
              $scope.error = ''
              if ($scope.account) {
                $http.post('/app/api/v1/save_ins_account', {
                  account: $scope.account
                }).then(res => {
                  if (res.data.success) {
                    $scope.account = ''
                    getInsList()
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
                $scope.error = '请输入ins账号'
              }
            }
          }
        })
      }

      scope.changeDevice = function(index) {
        let {
          account,
          serial
        } = scope.colums[index]
        $http.post('/app/api/v1/ins/update_serial', {
          account,
          serial
        }).catch(err => {
          let {
            msg
          } = err.data
          if (msg) {
            alert(msg)
          }
        })
      }

      /**
       * 删除Ins账户
       * @param index
       */
      scope.delAccount = function(index) {
        let {account} = scope.colums[index]
        $http.post('/app/api/v1/ins/del_account', {
          account
        }).then(() => {
          scope.colums.splice(index, 1)
        }).catch(err => {
          let {
            msg
          } = err.data
          if (msg) {
            alert(msg)
          }
        })
      }
    }
  }
}
