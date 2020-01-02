const echarts = require('echarts')

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
        }
      }

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

        if (config) {
          scope.config = config
        }
      })

      scope.save = function() {
        let {
          checkSsr,
          startInfo
        } = scope.config
        $http.post('/app/api/v1/ins/save_statistics', {
          account: $routeParams.account,
          checkSsr,
          startInfo
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
