module.exports = function InsTableDirective($http, $uibModal, $timeout) {
  return {
    restrict: 'E'
    , template: require('./ins.pug')
    , scope: {}
    , link: function (scope, element) {

      scope.colums = []

      scope.switchOnText = '开启'
      scope.switchOffText = '关闭'
      scope.loading = true
      scope.accountList = []

      scope.totalPage = []
      scope.page = 1
      scope.hasNext = true

      scope.empty = false
      scope.search = ''

      scope.switchChange = (index, type) => {
        let item = scope.colums[index]
        let account = item.account
        let status = item.config[type].status

        let url = ''
        switch (type) {
          case 'follow':
            url = '/app/api/v1/update_ins_follow_state'
            break
          case 'unfollow':
            url = '/app/api/v1/update_ins_unfollow_state'
            break
          case 'thumb':
            url = '/app/api/v1/update_ins_thumb_state'
            break
          case 'comment':
            url = '/app/api/v1/update_ins_comment_state'
            break
          case 'message':
            url = '/app/api/v1/update_ins_message_state'
            break
          case 'post':
            url = '/app/api/v1/update_ins_post_state'
            break
          case 'browse':
            url = '/app/api/v1/update_ins_browse_state'
            break
        }

        $http.post(url, {
          account,
          status
        })
      }

      getInsList()
      getAllDevice()
      getAllInsAccountName()

      function getAllInsAccountName() {
        $http.post('/app/api/v1/ins/get_all_account_name').then(res => {
          let list = res.data.data
          scope.accountList = list
        })
      }

      /**
       * 获取ins账号列表
       */
      function getInsList() {
        scope.loading = true

        $http.post('/app/api/v1/ins_account', {
          page: scope.page,
          search: scope.search,
          limit: 10
        }).then(res => {
          let list = res.data.data
          scope.totalPage = res.data.total
          console.log('length=' + scope.totalPage)
          scope.colums = list
          scope.loading = false
          scope.hasNext = list.length === 10
        })
      }

      scope.searchList = () => {
        scope.page = 1
        getInsList()
      }

      function getAllDevice() {
        $http.get('/app/api/v1/ins/devices').then(res => {
          let devices = res.data.data
          devices.map(item => {
            item._i = parseInt(item.notes) || 999999
          })

          devices.sort((a, b) => a._i - b._i)
          scope.devices = devices
        })
      }

      scope.createIns = function () {
        let model = $uibModal.open({
          template: require('./create-ins.pug'),
          size: 'sm',
          controller: function ($scope) {
            $scope.account = ''
            $scope.copyAccount = ''
            $scope.copyList = [{
              title: '关注',
              val: 'follow',
              checked: false,
            }, {
              title: '取关',
              val: 'unfollow',
              checked: false,
            }, {
              title: '点赞',
              val: 'thumb',
              checked: false,
            }, {
              title: '评论',
              val: 'comment',
              checked: false,
            }, {
              title: '私信',
              val: 'message',
              checked: false,
            }, {
              title: '发帖',
              val: 'post',
              checked: false,
            }, {
              title: '热身',
              val: 'browse',
              checked: false
            }]
            $scope.selectAllState = false

            $scope.error = ''
            let accountList = scope.accountList
            // scope.colums.map(account => {
            //   accountList.push(account.account)
            // })

            $scope.accountList = accountList

            $scope.closeModal = function () {
              $scope.account = ''
              $scope.copyAccount = ''
              $scope.copyList.map(item => {
                item.checked = false
              })
              model.close()
            }

            $scope.save = function () {
              $scope.error = ''
              if ($scope.account) {
                let {
                  account,
                  copyAccount
                } = $scope
                let copyList = []
                $scope.copyList.map(item => {
                  if (item.checked) {
                    copyList.push(item.val)
                  }
                })
                $http.post('/app/api/v1/save_ins_account', {
                  account,
                  copyAccount,
                  copyList
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
              } else {
                $scope.error = '请输入ins账号'
              }
            }
            $scope.selectAll = function () {
              if ($scope.selectAllState) {
                $scope.copyList.map(item => {
                  item.checked = true
                })
              } else {
                $scope.copyList.map(item => {
                  item.checked = false
                })
              }
            }

            $scope.changeCopyItem = function () {
              let status = true
              $scope.copyList.every(item => {
                if (!item.checked) {
                  status = false
                }
                return status
              })

              console.log(status)
              $scope.selectAllState = status
            }
          }
        })
      }

      scope.changeDevice = function (index) {
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
      scope.delAccount = function (index) {
        let {account} = scope.colums[index]
        $http.post('/app/api/v1/ins/del_account', {
          account
        }).then(() => {
          getInsList()
        }).catch(err => {
          let {
            msg
          } = err.data
          if (msg) {
            alert(msg)
          }
        })
      }

      scope.clearRecords = function (index, type) {
        let ret = confirm('是否确认清除记录')
        if (ret) {
          let {account} = scope.colums[index]
          $http.post('/app/api/v1/ins/clear_account_record', {
            account,
            type
          }).then(() => {
            getInsList()
          })
        }
      }

      scope.copyAccountConfig = function (index) {
        // /app/api/v1/ins/copy_account_config
        let model = $uibModal.open({
          template: require('./copy-ins.pug'),
          size: 'sm',
          controller: function ($scope) {
            $scope.copyAccount = ''
            $scope.copyList = [{
              title: '关注',
              val: 'follow',
              checked: false,
            }, {
              title: '取关',
              val: 'unfollow',
              checked: false,
            }, {
              title: '点赞',
              val: 'thumb',
              checked: false,
            }, {
              title: '评论',
              val: 'comment',
              checked: false,
            }, {
              title: '私信',
              val: 'message',
              checked: false,
            }, {
              title: '发帖',
              val: 'post',
              checked: false,
            }, {
              title: '热身',
              val: 'browse',
              checked: false
            }]
            $scope.selectAllState = false

            $scope.error = ''
            let accountList = scope.accountList
            // scope.colums.map(account => {
            //   accountList.push(account.account)
            // })

            $scope.accountList = accountList

            $scope.closeModal = function () {
              $scope.account = ''
              $scope.copyAccount = ''
              $scope.copyList.map(item => {
                item.checked = false
              })
              model.close()
            }

            $scope.save = function () {
              $scope.error = ''
              let account = scope.colums[index].account
              let {
                copyAccount
              } = $scope
              let copyList = []
              $scope.copyList.map(item => {
                if (item.checked) {
                  copyList.push(item.val)
                }
              })
              $http.post('/app/api/v1/ins/copy_account_config', {
                account,
                copyAccount,
                copyList
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
            $scope.selectAll = function () {
              if ($scope.selectAllState) {
                $scope.copyList.map(item => {
                  item.checked = true
                })
              } else {
                $scope.copyList.map(item => {
                  item.checked = false
                })
              }
            }

            $scope.changeCopyItem = function () {
              let status = true
              $scope.copyList.every(item => {
                if (!item.checked) {
                  status = false
                }
                return status
              })

              console.log(status)
              $scope.selectAllState = status
            }
          }
        })
      }

      scope.next = function () {
        ++scope.page
        getInsList()
      }

      scope.prev = function () {
        --scope.page
        getInsList()
      }
    }
  }
}
