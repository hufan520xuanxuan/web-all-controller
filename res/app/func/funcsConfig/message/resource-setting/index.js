require('./resuorce-setting.css')

module.exports = angular.module('ccp.func-message-resource-setting', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  require('../../emoji').name,
])
  .directive('msgResSetting', require('./resource-setting-directive'))
  .filter('filterType', function () {
    return function (type) {
      let typeText = ''
      switch (Number(type)) {
        case 1:
          typeText = '资源'
          break
        case 2:
          typeText = '粉丝'
          break
        case 3:
          typeText = '关注'
          break
        case 4:
          typeText = '点赞'
          break
        case 5:
          typeText = '评论'
          break
      }
      return typeText
    }
  })
  .filter('filterStatus', function () {
    return function (status) {
      let typeText = ''
      switch (Number(status)) {
        case 7:
          typeText = '关注成功'
          break
        case 9:
          typeText = '私密用户'
          break
        case 10:
          typeText = '筛选过的'
          break
        case 11:
          typeText = '点赞过的'
          break
        case 12:
          typeText = '评论过的'
          break
        case 13:
          typeText = '私信过的'
          break
      }
      return typeText
    }
  })


