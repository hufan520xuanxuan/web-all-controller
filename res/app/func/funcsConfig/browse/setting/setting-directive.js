const _findKey = require('lodash/findKey')
module.exports = function browseSettingDirective($http, $routeParams, $timeout) {
  return {
    restrict: 'E'
    , template: require('./setting.pug')
    , scope: {
    }
    , link: function(scope, element) {
      scope.insAccount = {}
      scope.error = ''
      scope.weekday = {
        momday: {
        title: '周一',
        value: 1
      }, tuesday: {
        title: '周二',
        value: 2
      }, wednesday: {
        title: '周三',
        value: 3
      }, thursday: {
        title: '周四',
        value: 4
      }, friday: {
        title: '周五',
        value: 5
      }, saturday: {
        title: '周六',
        value: 6
      }, sunday: {
        title: '周日',
        value: 0
      }}
      scope.datetimepickerOptions = {
        format: 'HH:mm',
      }
      scope.status = false
      $timeout(() => {
        scope.status = true
      }, 0)
      $http.get('/app/api/v1/ins_account_detail/' + $routeParams.account)
        .then(res => {
          let insAccount = res.data.data
          let selectedWeek = {}
          insAccount.config.browse.weekday.map(item => {
            let day = _findKey(scope.weekday, i => i.value === item)
            selectedWeek[day] = true
          })
          scope.insAccount = insAccount
          scope.selectedWeek = selectedWeek
        }).catch(err => {
        let {
          msg
        } = err.data
        if (msg) {
          scope.error = msg
        }
      })

      scope.switchChange = () => {
        let item = scope.insAccount
        let account = item.account
        let status = item.config.browse.status

        $http.post('/app/api/v1/update_ins_browse_state', {
          account,
          status,
          type: 7
        })
      }

      scope.save = () => {
        let insAccount = JSON.parse(JSON.stringify(scope.insAccount))
        let weekday = []
        Object.keys(scope.selectedWeek).map(item => {
          if (scope.selectedWeek[item]) {
            weekday.push(scope.weekday[item].value)
          }
        })
        insAccount.config.browse.weekday = weekday

        insAccount.type = 7
        $http.post('/app/api/v1/ins/update_config', insAccount)
      }
    }
  }
}
