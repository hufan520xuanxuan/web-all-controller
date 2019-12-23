require('./resuorce-setting.css')

module.exports = angular.module('ccp.func-message-resource-setting', [
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  require('../../emoji').name,
])
  .directive('msgResSetting', require('./resource-setting-directive'))
  .filter('filterType', function() {
    return function(type) {
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

