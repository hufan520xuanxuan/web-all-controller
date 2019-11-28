var QueryParser = require('./util/query-parser')
var _ = require('lodash')

module.exports = function DeviceListCtrl(
  $scope
, DeviceService
, DeviceColumnService
, GroupService
, ControlService
, SettingsService
, $location
, $http
) {
  $scope.tracker = DeviceService.trackAll($scope)
  $scope.control = ControlService.create($scope.tracker.devices, '*ALL')

  function SelectCell(options) {
    return _.defaults(options, {
      title: options.title
      , defaultOrder: 'asc'
      , build: function() {
        var td = document.createElement('td')
        var select = document.createElement('select')
        let defaultOption = document.createElement('option')
        defaultOption.value = ''
        defaultOption.textContent = '未分配'
        select.appendChild(defaultOption)
        options.selections.map(selection => {
          let option = document.createElement('option')
          option.value = selection.email
          option.textContent = selection.name
          select.appendChild(option)
        })
        td.appendChild(select)
        select.onchange = function(e) {
          let {
            id,
            value
          } = e.target

          $http.post('/app/api/user/update_device', {
            serial: id,
            email: value
          })
        }
        return td
      }
      , update: function(td, item) {
        var select = td.firstChild
        select.id = item.serial

        select.value = item.user

        return td
      }
      , compare: function(a, b) {
          var la = (a || '').toLowerCase()
          var lb = (b || '').toLowerCase()
          if (la === lb) {
            return 0
          }
          else {
            return la < lb ? -1 : 1
          }
      }
    })
  }



  var defaultColumns = [
    {
      name: 'state'
    , selected: true
    }
  , {
      name: 'model'
    , selected: true
    }
  , {
      name: 'name'
    , selected: true
    }
  , {
      name: 'serial'
    , selected: false
    }
  , {
      name: 'operator'
    , selected: true
    }
  , {
      name: 'releasedAt'
    , selected: true
    }
  , {
      name: 'version'
    , selected: true
    }
  , {
      name: 'network'
    , selected: false
    }
  , {
      name: 'display'
    , selected: false
    }
  , {
      name: 'manufacturer'
    , selected: false
    }
  , {
      name: 'sdk'
    , selected: false
    }
  , {
      name: 'abi'
    , selected: false
    }
  , {
      name: 'cpuPlatform'
    , selected: false
    }
  , {
      name: 'openGLESVersion'
    , selected: false
    }
  , {
      name: 'browser'
    , selected: false
    }
  , {
      name: 'phone'
    , selected: false
    }
  , {
      name: 'imei'
    , selected: false
    }
  , {
      name: 'imsi'
    , selected: false
    }
  , {
      name: 'iccid'
    , selected: false
    }
  , {
      name: 'batteryHealth'
    , selected: false
    }
  , {
      name: 'batterySource'
    , selected: false
    }
  , {
      name: 'batteryStatus'
    , selected: false
    }
  , {
      name: 'batteryLevel'
    , selected: false
    }
  , {
      name: 'batteryTemp'
    , selected: false
    }
  , {
      name: 'provider'
    , selected: true
    }
  , {
      name: 'notes'
    , selected: true
    }
  , {
      name: 'owner'
    , selected: true
    }
  ]

  let deviceColumn = DeviceColumnService

  $scope.columns = []

  function setColumns() {
    $scope.columnDefinitions = deviceColumn
    $scope.columns = defaultColumns

    SettingsService.bind($scope, {
      target: 'columns'
      , source: 'deviceListColumns'
    })
  }

  // 判断是否为管理员
  $http.post('/app/api/user/is_admin').then(res => {
    if (res.data.data) {
      $http.get('/api/v1/users').then(res => {
        deviceColumn.user = SelectCell({
          title: '分配用户',
          selections: res.data.data
        })
        defaultColumns.push({
          name: 'user',
          selected: true
        })

        setColumns()
      })
    }
    else {
      setColumns()
    }
  })

  var defaultSort = {
    fixed: [
      {
        name: 'state'
        , order: 'asc'
      }
    ]
    , user: [
      {
        name: 'name'
        , order: 'asc'
      }
    ]
  }

  $scope.sort = defaultSort

  SettingsService.bind($scope, {
    target: 'sort'
  , source: 'deviceListSort'
  })

  $scope.filter = []

  $scope.activeTabs = {
    icons: true
  , details: false
  }

  SettingsService.bind($scope, {
    target: 'activeTabs'
  , source: 'deviceListActiveTabs'
  })

  $scope.toggle = function(device) {
    if (device.using) {
      $scope.kick(device)
    } else {
      $location.path('/control/' + device.serial)
    }
  }

  $scope.invite = function(device) {
    return GroupService.invite(device).then(function() {
      $scope.$digest()
    })
  }

  $scope.applyFilter = function(query) {
    $scope.filter = QueryParser.parse(query)
  }

  $scope.search = {
    deviceFilter: '',
    focusElement: false
  }

  $scope.focusSearch = function() {
    if (!$scope.basicMode) {
      $scope.search.focusElement = true
    }
  }

  $scope.reset = function() {
    $scope.search.deviceFilter = ''
    $scope.filter = []
    $scope.sort = defaultSort
    $scope.columns = defaultColumns
  }

  // 界面卸载移除所有设备占用
  window.onbeforeunload = () => {
    $scope.tracker.devices.map(device => {
      if(device.state === 'using') {
        kickDevice(device)
      }
    })
  }

  function kickDevice(device, force) {
    return GroupService.kick(device, force).catch(function(e) {
      alert(('设备无法移除'))
      throw new Error(e)
    })
  }
}
