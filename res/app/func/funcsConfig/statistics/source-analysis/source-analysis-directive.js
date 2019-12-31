module.exports = function SourceAnalysisDirective($http, $routeParams) {
  return {
    restrict: 'E'
    , template: require('./source-analysis.pug')
    , scope: {
    }
    , link: function(scope, element) {
      scope.page = 1
      scope.hasNext = false
      scope.data = []

      scope.tableStart = moment().subtract(15, 'days').format('YYYY-MM-DD')
      scope.tableEnd = moment().format('YYYY-MM-DD')

      function getList() {
        $http.post('/app/api/v1/ins/get_source_analysis', {
          page: scope.page,
          account: $routeParams.account,
          start: moment(scope.tableStart).format('YYYY-MM-DD'),
          end: moment(scope.tableEnd).format('YYYY-MM-DD'),
        }).then(res => {
          let list = res.data.data
          list.map(item => {
            item.createdAt = moment(item.created).format('YYYY-MM-DD')
          })
          scope.data = list
          scope.hasNext = list.length === 10
        })
      }

      getList()
    }
  }
}
