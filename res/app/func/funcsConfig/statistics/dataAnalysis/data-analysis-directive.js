const echarts = require('echarts')

module.exports = function AutoUnFollowDirective($http, $routeParams) {
  return {
    restrict: 'E'
    , template: require('./dataAnalysis.pug')
    , scope: {
    }
    , link: function(scope, element) {
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
          data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          type: 'line',
          data: [820, 932, 901, 934, 1290, 1330, 1320],
        }]
      };

      // 使用刚指定的配置项和数据显示图表。
      myChart.setOption(option);
    }
  }
}
