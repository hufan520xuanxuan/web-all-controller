const echarts = require('echarts')
const _findKey = require('lodash/findKey')

module.exports = function AutoUnFollowDirective($http, $routeParams) {
  return {
    restrict: 'E'
    , template: require('./dataAnalysis.pug')
    , scope: {
    }
    , link: function(scope, element) {
      scope.config = {
        checkSsr: 0,
        startInfo: {
          status: 0,
          startName: ''
        },
        excute: {
          start: '00:00',
          end: '00:00'
        }
      }

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
      scope.selectedWeek = {}

      scope.page = 1
      scope.hasNext = false
      scope.data = []

      scope.tableStart = moment().subtract(15, 'days').format('YYYY-MM-DD')
      scope.tableEnd = moment().format('YYYY-MM-DD')

      scope.echartStart = moment().subtract(15, 'days').format('YYYY-MM-DD')
      scope.echartEnd = moment().format('YYYY-MM-DD')
      scope.echartType = 1

      function getList() {
        $http.post('/app/api/v1/ins/get_statistics_logs', {
          page: scope.page,
          account: $routeParams.account,
          start: moment(scope.tableStart).format('YYYY-MM-DD'),
          end: moment(scope.tableEnd).format('YYYY-MM-DD'),
        }).then(res => {
          let list = []
          res.data.data.forEach(item => {
            let msg = JSON.parse(item.msg)
            list.push({
              createdAt: moment(item.created).format('YYYY-MM-DD'),
              followerNicksNum: msg.followerNicksNum,
              followerNum: msg.followerNum,
              followingNum: msg.followingNum,
              monthGrowth: item.monthGrowth,
            })
          })
          scope.data = list
          scope.hasNext = list.length === 10
        })
      }

      getList()

      scope.tableSearch = function() {
        scope.page = 1
        getList()
      }

      function initEchart (keys = [], values = []) {

        // 基于准备好的dom，初始化echarts实例
        var myChart = echarts.init(document.getElementById('main'));

        // 指定图表的配置项和数据
        var option = {
          title: {
            text: '数据分析'
          },
          tooltip: {
            trigger: 'axis'
          },
          xAxis: {
            type: 'category',
            data: keys
          },
          yAxis: {
            type: 'value'
          },
          series: [{
            type: 'line',
            data: values
          }]
        };

        // 使用刚指定的配置项和数据显示图表。
        myChart.setOption(option)
      }

      function getDataAnalysis() {
        $http.post('/app/api/v1/ins/get_data_analysis', {
          start: moment(scope.echartStart).format('YYYY-MM-DD'),
          end: moment(scope.echartEnd).format('YYYY-MM-DD'),
          type: scope.echartType,
          account: $routeParams.account
        }).then(res => {
          let data = res.data.data
          initEchart(Object.keys(data), Object.values(data))
        })
      }

      getDataAnalysis()

      scope.getDataAnalysis = getDataAnalysis

      $http.post('/app/api/v1/ins/get_statistics', {
        account: $routeParams.account
      }).then(res => {
        let config = res.data.data
        let selectedWeek = {}
        config.weekday = config.weekday || []
        config.weekday.map(item => {
          let day = _findKey(scope.weekday, i => i.value === item)
          selectedWeek[day] = true
        })

        scope.selectedWeek = selectedWeek
        if (config) {
          scope.config = config
        }
      })

      scope.save = function() {
        let {
          checkSsr,
          startInfo,
          excute
        } = scope.config
        let weekday = []
        Object.keys(scope.selectedWeek).map(item => {
          if (scope.selectedWeek[item]) {
            weekday.push(scope.weekday[item].value)
          }
        })
        $http.post('/app/api/v1/ins/save_statistics', {
          account: $routeParams.account,
          checkSsr,
          startInfo,
          excute,
          weekday
        })
      }

      scope.getList = function() {

      }

      scope.next = function() {
        ++scope.page
        getList()
      }

      scope.prev = function() {
        --scope.page
        getList()
      }
    }
  }
}
