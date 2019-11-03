var r = require('rethinkdb')
var util = require('util')

var db = require('./')
var wireutil = require('../wire/util')

var dbapi = Object.create(null)

dbapi.DuplicateSecondaryIndexError = function DuplicateSecondaryIndexError() {
  Error.call(this)
  this.name = 'DuplicateSecondaryIndexError'
  Error.captureStackTrace(this, DuplicateSecondaryIndexError)
}

util.inherits(dbapi.DuplicateSecondaryIndexError, Error)

dbapi.close = function(options) {
  return db.close(options)
}

dbapi.saveUserAfterLogin = function(user) {
  return db.run(r.table('users').get(user.email).update({
    name: user.name
    , ip: user.ip
    , lastLoggedInAt: r.now()
  }))
    .then(function(stats) {
      if (stats.skipped) {
        return db.run(r.table('users').insert({
          email: user.email
          , name: user.name
          , ip: user.ip
          , group: wireutil.makePrivateChannel()
          , lastLoggedInAt: r.now()
          , createdAt: r.now()
          , forwards: []
          , settings: {}
        }))
      }
      return stats
    })
}

dbapi.loadUser = function(email) {
  return db.run(r.table('users').get(email))
}

dbapi.updateUserSettings = function(email, changes) {
  return db.run(r.table('users').get(email).update({
    settings: changes
  }))
}

dbapi.resetUserSettings = function(email) {
  return db.run(r.table('users').get(email).update({
    settings: r.literal({})
  }))
}

dbapi.insertUserAdbKey = function(email, key) {
  return db.run(r.table('users').get(email).update({
    adbKeys: r.row('adbKeys').default([]).append({
      title: key.title
      , fingerprint: key.fingerprint
    })
  }))
}

dbapi.deleteUserAdbKey = function(email, fingerprint) {
  return db.run(r.table('users').get(email).update({
    adbKeys: r.row('adbKeys').default([]).filter(function(key) {
      return key('fingerprint').ne(fingerprint)
    })
  }))
}

dbapi.lookupUsersByAdbKey = function(fingerprint) {
  return db.run(r.table('users').getAll(fingerprint, {
    index: 'adbKeys'
  }))
}

dbapi.lookupUserByAdbFingerprint = function(fingerprint) {
  return db.run(r.table('users').getAll(fingerprint, {
    index: 'adbKeys'
  })
    .pluck('email', 'name', 'group'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(groups) {
      switch (groups.length) {
        case 1:
          return groups[0]
        case 0:
          return null
        default:
          throw new Error('Found multiple users for same ADB fingerprint')
      }
    })
}

dbapi.lookupUserByVncAuthResponse = function(response, serial) {
  return db.run(r.table('vncauth').getAll([response, serial], {
    index: 'responsePerDevice'
  })
    .eqJoin('userId', r.table('users'))('right')
    .pluck('email', 'name', 'group'))
    .then(function(cursor) {
      return cursor.toArray()
    })
    .then(function(groups) {
      switch (groups.length) {
        case 1:
          return groups[0]
        case 0:
          return null
        default:
          throw new Error('Found multiple users with the same VNC response')
      }
    })
}

dbapi.loadUserDevices = function(email) {
  return db.run(r.table('devices').getAll(email, {
    index: 'owner'
  }))
}

dbapi.saveDeviceLog = function(serial, entry) {
  return db.run(r.table('logs').insert({
      serial: serial
      , timestamp: r.epochTime(entry.timestamp)
      , priority: entry.priority
      , tag: entry.tag
      , pid: entry.pid
      , message: entry.message
    }
    , {
      durability: 'soft'
    }))
}

dbapi.saveDeviceInitialState = function(serial, device) {
  var data = {
    present: false
    , presenceChangedAt: r.now()
    , provider: device.provider
    , owner: null
    , status: device.status
    , statusChangedAt: r.now()
    , ready: false
    , reverseForwards: []
    , remoteConnect: false
    , remoteConnectUrl: null
    , usage: null
  }
  return db.run(r.table('devices').get(serial).update(data))
    .then(function(stats) {
      if (stats.skipped) {
        data.serial = serial
        data.createdAt = r.now()
        return db.run(r.table('devices').insert(data))
      }
      return stats
    })
}

dbapi.setDeviceConnectUrl = function(serial, url) {
  return db.run(r.table('devices').get(serial).update({
    remoteConnectUrl: url
    , remoteConnect: true
  }))
}

dbapi.unsetDeviceConnectUrl = function(serial) {
  return db.run(r.table('devices').get(serial).update({
    remoteConnectUrl: null
    , remoteConnect: false
  }))
}

dbapi.saveDeviceStatus = function(serial, status) {
  return db.run(r.table('devices').get(serial).update({
    status: status
    , statusChangedAt: r.now()
  }))
}

dbapi.setDeviceOwner = function(serial, owner) {
  return db.run(r.table('devices').get(serial).update({
    owner: owner
  }))
}

dbapi.unsetDeviceOwner = function(serial) {
  return db.run(r.table('devices').get(serial).update({
    owner: null
  }))
}

dbapi.setDevicePresent = function(serial) {
  return db.run(r.table('devices').get(serial).update({
    present: true
    , presenceChangedAt: r.now()
  }))
}

dbapi.setDeviceAbsent = function(serial) {
  return db.run(r.table('devices').get(serial).update({
    present: false
    , presenceChangedAt: r.now()
  }))
}

dbapi.setDeviceUsage = function(serial, usage) {
  return db.run(r.table('devices').get(serial).update({
    usage: usage
    , usageChangedAt: r.now()
  }))
}

dbapi.unsetDeviceUsage = function(serial) {
  return db.run(r.table('devices').get(serial).update({
    usage: null
    , usageChangedAt: r.now()
  }))
}

dbapi.setDeviceAirplaneMode = function(serial, enabled) {
  return db.run(r.table('devices').get(serial).update({
    airplaneMode: enabled
  }))
}

dbapi.setDeviceBattery = function(serial, battery) {
  return db.run(r.table('devices').get(serial).update({
      battery: {
        status: battery.status
        , health: battery.health
        , source: battery.source
        , level: battery.level
        , scale: battery.scale
        , temp: battery.temp
        , voltage: battery.voltage
      }
    }
    , {
      durability: 'soft'
    }))
}

dbapi.setDeviceBrowser = function(serial, browser) {
  return db.run(r.table('devices').get(serial).update({
    browser: {
      selected: browser.selected
      , apps: browser.apps
    }
  }))
}

dbapi.setDeviceConnectivity = function(serial, connectivity) {
  return db.run(r.table('devices').get(serial).update({
    network: {
      connected: connectivity.connected
      , type: connectivity.type
      , subtype: connectivity.subtype
      , failover: !!connectivity.failover
      , roaming: !!connectivity.roaming
    }
  }))
}

dbapi.setDevicePhoneState = function(serial, state) {
  return db.run(r.table('devices').get(serial).update({
    network: {
      state: state.state
      , manual: state.manual
      , operator: state.operator
    }
  }))
}

dbapi.setDeviceRotation = function(serial, rotation) {
  return db.run(r.table('devices').get(serial).update({
    display: {
      rotation: rotation
    }
  }))
}

dbapi.setDeviceNote = function(serial, note) {
  return db.run(r.table('devices').get(serial).update({
    notes: note
  }))
}

dbapi.setDeviceReverseForwards = function(serial, forwards) {
  return db.run(r.table('devices').get(serial).update({
    reverseForwards: forwards
  }))
}

dbapi.setDeviceReady = function(serial, channel) {
  return db.run(r.table('devices').get(serial).update({
    channel: channel
    , ready: true
    , owner: null
    , reverseForwards: []
  }))
}

dbapi.saveDeviceIdentity = function(serial, identity) {
  return db.run(r.table('devices').get(serial).update({
    platform: identity.platform
    , manufacturer: identity.manufacturer
    , operator: identity.operator
    , model: identity.model
    , version: identity.version
    , abi: identity.abi
    , sdk: identity.sdk
    , display: identity.display
    , phone: identity.phone
    , product: identity.product
    , cpuPlatform: identity.cpuPlatform
    , openGLESVersion: identity.openGLESVersion
  }))
}

dbapi.loadDevices = function() {
  return db.run(r.table('devices'))
}

dbapi.loadPresentDevices = function() {
  return db.run(r.table('devices').getAll(true, {
    index: 'present'
  }))
}

dbapi.loadDevice = function(serial) {
  return db.run(r.table('devices').get(serial))
}

dbapi.saveUserAccessToken = function(email, token) {
  return db.run(r.table('accessTokens').insert({
    email: email
    , id: token.id
    , title: token.title
    , jwt: token.jwt
  }))
}

dbapi.removeUserAccessToken = function(email, title) {
  return db.run(r.table('accessTokens').getAll(email, {
    index: 'email'
  }).filter({title: title}).delete())
}

dbapi.loadAccessTokens = function(email) {
  return db.run(r.table('accessTokens').getAll(email, {
    index: 'email'
  }))
}

dbapi.loadAccessToken = function(id) {
  return db.run(r.table('accessTokens').get(id))
}

dbapi.saveInsAccount = function(account, serial = '') {
  return db.run(r.table('insAccount').insert({
    account,
    serial,
    config: {
      follow: {
        status: 0,         // 开启状态
        minPerson: 0,      // 最小人数
        maxPerson: 0,      // 最大人数
        minDelay: 0,       // 最小间隔时间
        maxDelay: 0,       // 最大间隔时间
        excute: {
          start: '00:00',
          end: '00:00'
        },        // 执行时间
        weekday: [1, 2, 3, 4, 5, 6, 0],       // 周
        checkSsr: 0, // 是否检查ssr
        startInfo: {
          status: 0,       // 开启的状态
          startName: 'Instagram'    // 分身的名称
        },
        skipSecretAccount: 0, // 跳过私密用户
        skipNonEnglish: 0, // 跳过非英语用户
        hasProfile: 0,     // 有个人资料
        followingWords: {
          status: 0,       // 开启状态
          words: ''        // 单词
        },                 // 至少一个帖子包含以下内容
        minFollowers: 0,   // 最小粉丝数
        maxFollowers: 0,   // 最大粉丝数
        minFollowing: 0,   // 最小关注数
        maxFollowing: 0,   // 最大关注数
        followerStatus: 0, // 粉丝数开启状态
        zoneChoiceStatus: 0, // 对用户帖子筛选的开启状态
        zoneBefore: 0, // 对用户前多少条帖子筛选
        zoneTime: 0, // 对用户帖子筛选的开启状态
        zoneComment: 0, // 对用户帖子筛选的开启状态
        skipFollowers: 0,  // 跳过跟随者
        skipBussiness: 0,  // 跳过商业账户
        skipWebsite: 0,    // 跳过网站账户
        skipPhone: 0,      // 跳过手机号用户
        followOnly: {
          gender: 1,       // 性别
          language: 0,    // 语言 0=关闭 1=中文 2=英文(三种选项)
        },                 // 只关注
        skipWaitTime: 0,   // 跳过没有更多结果的等待时间
        insUsers: [],
        minWait: '',       // 最小行动等待时间
        maxWait: '',       // 最大行动等待时间
        minDay: 0,         // 每天关注的最小总数
        maxDay: 0,         // 每天关注的最大总数
        addDay: 0,         // 每天自增长个数
        topDay: 0,         // 每天增长的顶值
        fullMinDay: 0,         // 每天自增长到顶后的最小范围值
        fullMaxDay: 0,         // 每天自增长到顶后的最大范围值
      },
      unfollow: {
        status: 0,         // 开启状态
        checkSsr: 0,      // 是否检查ssr
        startInfo: {
          status: 0,       // 开启的状态
          startName: 'Instagram'    // 分身的名称
        },
        rankType: 2,       // 排序方式
        minPerson: 0,      // 最小人数
        maxPerson: 0,      // 最大人数
        minDelay: 0,       // 最小间隔时间
        maxDelay: 0,       // 最大间隔时间
        excute: {
          start: '00:00',
          end: '00:00'
        },        // 执行时间
        weekday: [1, 2, 3, 4, 5, 6, 0],       // 周
        allUserByCCP: 0,   // 取关所有CCP关注用户
        allUserOutside: 0, // 取关所有非CCP关注用户
        whitelist: {
          status: 0,       // 白名单开启状态
          list: ''         // 白名单列表
        }                  // 白名单
      },
      thumb: {
        status: 0,         // 开启状态
        minPerson: 0,      // 最小人数
        maxPerson: 0,      // 最大人数
        minDelay: 0,       // 最小间隔时间
        maxDelay: 0,       // 最大间隔时间
        excute: {
          start: '00:00',
          end: '00:00'
        },        // 执行时间
        weekday: [1, 2, 3, 4, 5, 6, 0],       // 周
        checkSsr: 0, // 是否检查ssr
        startInfo: {
          status: 0,       // 开启的状态
          startName: 'Instagram'    // 分身的名称
        },
        skipSecretAccount: 0, // 跳过私密用户
        skipNonEnglish: 0, // 跳过非英语用户
        hasProfile: 0,     // 有个人资料
        followingWords: {
          status: 0,       // 开启状态
          words: ''        // 单词
        },                 // 至少一个帖子包含以下内容
        minFollowers: 0,   // 最小粉丝数
        maxFollowers: 0,   // 最大粉丝数
        minFollowing: 0,   // 最小关注数
        maxFollowing: 0,   // 最大关注数
        followerStatus: 0, // 粉丝数开启状态
        zoneChoiceStatus: 0, // 对用户帖子筛选的开启状态
        zoneBefore: 0, // 对用户前多少条帖子筛选
        zoneTime: 0, // 对用户帖子筛选的开启状态
        zoneComment: 0, // 对用户帖子筛选的开启状态
        skipFollowers: 0,  // 跳过跟随者
        skipBussiness: 0,  // 跳过商业账户
        skipWebsite: 0,    // 跳过网站账户
        skipPhone: 0,      // 跳过手机号用户
        followOnly: {
          gender: 1,       // 性别
          language: 0,    // 语言 0=关闭 1=中文 2=英文(三种选项)
        },                 // 只关注
        skipWaitTime: 0,   // 跳过没有更多结果的等待时间
        insUsers: [],
        minWait: '',       // 最小行动等待时间
        maxWait: '',       // 最大行动等待时间
        minDay: 0,         // 每天关注的最小总数
        maxDay: 0,         // 每天关注的最大总数
        addDay: 0,         // 每天自增长个数
        topDay: 0,         // 每天增长的顶值
        fullMinDay: 0,         // 每天自增长到顶后的最小范围值
        fullMaxDay: 0,         // 每天自增长到顶后的最大范围值
      },
      comments: {
        status: 0,         // 开启状态
        minPerson: 0,      // 最小人数
        maxPerson: 0,      // 最大人数
        minDelay: 0,       // 最小间隔时间
        maxDelay: 0,       // 最大间隔时间
        excute: {
          start: '00:00',
          end: '00:00'
        },        // 执行时间
        weekday: [1, 2, 3, 4, 5, 6, 0],       // 周
        checkSsr: 0, // 是否检查ssr
        startInfo: {
          status: 0,       // 开启的状态
          startName: 'Instagram'    // 分身的名称
        },
        skipSecretAccount: 0, // 跳过私密用户
        skipNonEnglish: 0, // 跳过非英语用户
        hasProfile: 0,     // 有个人资料
        followingWords: {
          status: 0,       // 开启状态
          words: ''        // 单词
        },                 // 至少一个帖子包含以下内容
        minFollowers: 0,   // 最小粉丝数
        maxFollowers: 0,   // 最大粉丝数
        minFollowing: 0,   // 最小关注数
        maxFollowing: 0,   // 最大关注数
        followerStatus: 0, // 粉丝数开启状态
        zoneChoiceStatus: 0, // 对用户帖子筛选的开启状态
        zoneBefore: 0, // 对用户前多少条帖子筛选
        zoneTime: 0, // 对用户帖子筛选的开启状态
        zoneComment: 0, // 对用户帖子筛选的开启状态
        skipFollowers: 0,  // 跳过跟随者
        skipBussiness: 0,  // 跳过商业账户
        skipWebsite: 0,    // 跳过网站账户
        skipPhone: 0,      // 跳过手机号用户
        followOnly: {
          gender: 1,       // 性别
          language: 0,    // 语言 0=关闭 1=中文 2=英文(三种选项)
        },                 // 只关注
        skipWaitTime: 0,   // 跳过没有更多结果的等待时间
        insUsers: [],
        minWait: '',       // 最小行动等待时间
        maxWait: '',       // 最大行动等待时间
        minDay: 0,         // 每天关注的最小总数
        maxDay: 0,         // 每天关注的最大总数
        addDay: 0,         // 每天自增长个数
        topDay: 0,         // 每天增长的顶值
        fullMinDay: 0,         // 每天自增长到顶后的最小范围值
        fullMaxDay: 0,         // 每天自增长到顶后的最大范围值
      },
      message: {
        status: 0,         // 开启状态
        minPerson: 0,      // 最小人数
        maxPerson: 0,      // 最大人数
        minDelay: 0,       // 最小间隔时间
        maxDelay: 0,       // 最大间隔时间
        excute: {
          start: '00:00',
          end: '00:00'
        },        // 执行时间
        weekday: [1, 2, 3, 4, 5, 6, 0],       // 周
        checkSsr: 0, // 是否检查ssr
        startInfo: {
          status: 0,       // 开启的状态
          startName: 'Instagram'    // 分身的名称
        },
        skipSecretAccount: 0, // 跳过私密用户
        skipNonEnglish: 0, // 跳过非英语用户
        hasProfile: 0,     // 有个人资料
        followingWords: {
          status: 0,       // 开启状态
          words: ''        // 单词
        },                 // 至少一个帖子包含以下内容
        minFollowers: 0,   // 最小粉丝数
        maxFollowers: 0,   // 最大粉丝数
        minFollowing: 0,   // 最小关注数
        maxFollowing: 0,   // 最大关注数
        followerStatus: 0, // 粉丝数开启状态
        zoneChoiceStatus: 0, // 对用户帖子筛选的开启状态
        zoneBefore: 0, // 对用户前多少条帖子筛选
        zoneTime: 0, // 对用户帖子筛选的开启状态
        zoneComment: 0, // 对用户帖子筛选的开启状态
        skipFollowers: 0,  // 跳过跟随者
        skipBussiness: 0,  // 跳过商业账户
        skipWebsite: 0,    // 跳过网站账户
        skipPhone: 0,      // 跳过手机号用户
        followOnly: {
          gender: 1,       // 性别
          language: 0,    // 语言 0=关闭 1=中文 2=英文(三种选项)
        },                 // 只关注
        skipWaitTime: 0,   // 跳过没有更多结果的等待时间
        insUsers: [],
        minWait: '',       // 最小行动等待时间
        maxWait: '',       // 最大行动等待时间
        minDay: 0,         // 每天关注的最小总数
        maxDay: 0,         // 每天关注的最大总数
        addDay: 0,         // 每天自增长个数
        topDay: 0,         // 每天增长的顶值
        fullMinDay: 0,         // 每天自增长到顶后的最小范围值
        fullMaxDay: 0,         // 每天自增长到顶后的最大范围值
      },
      post: {
        status: 0,         // 开启状态
        minPerson: 0,      // 最小人数
        maxPerson: 0,      // 最大人数
        minDelay: 0,       // 最小间隔时间
        maxDelay: 0,       // 最大间隔时间
        excute: {
          start: '00:00',
          end: '00:00'
        },        // 执行时间
        weekday: [1, 2, 3, 4, 5, 6, 0],       // 周
        checkSsr: 0, // 是否检查ssr
        startInfo: {
          status: 0,       // 开启的状态
          startName: 'Instagram'    // 分身的名称
        },
        skipSecretAccount: 0, // 跳过私密用户
        skipNonEnglish: 0, // 跳过非英语用户
        hasProfile: 0,     // 有个人资料
        followingWords: {
          status: 0,       // 开启状态
          words: ''        // 单词
        },                 // 至少一个帖子包含以下内容
        minFollowers: 0,   // 最小粉丝数
        maxFollowers: 0,   // 最大粉丝数
        minFollowing: 0,   // 最小关注数
        maxFollowing: 0,   // 最大关注数
        followerStatus: 0, // 粉丝数开启状态
        zoneChoiceStatus: 0, // 对用户帖子筛选的开启状态
        zoneBefore: 0, // 对用户前多少条帖子筛选
        zoneTime: 0, // 对用户帖子筛选的开启状态
        zoneComment: 0, // 对用户帖子筛选的开启状态
        skipFollowers: 0,  // 跳过跟随者
        skipBussiness: 0,  // 跳过商业账户
        skipWebsite: 0,    // 跳过网站账户
        skipPhone: 0,      // 跳过手机号用户
        followOnly: {
          gender: 1,       // 性别
          language: 0,    // 语言 0=关闭 1=中文 2=英文(三种选项)
        },                 // 只关注
        skipWaitTime: 0,   // 跳过没有更多结果的等待时间
        insUsers: [],
        minWait: '',       // 最小行动等待时间
        maxWait: '',       // 最大行动等待时间
        minDay: 0,         // 每天关注的最小总数
        maxDay: 0,         // 每天关注的最大总数
        addDay: 0,         // 每天自增长个数
        topDay: 0,         // 每天增长的顶值
        fullMinDay: 0,         // 每天自增长到顶后的最小范围值
        fullMaxDay: 0,         // 每天自增长到顶后的最大范围值
      }
    }
  }))
}

dbapi.getAllInsAccount = function() {
  return db.run(r.table('insAccount'))
}

dbapi.getInsAccountByAccount = function(account) {
  return db.run(r.table('insAccount').get(account))
}

dbapi.updateInsAccountSerialByAccount = function(account, serial) {
  return db.run(r.table('insAccount').get(account).update({
    serial
  }))
}

dbapi.updateInsAccountConfigByAccount = function(account, config) {
  return db.run(r.table('insAccount').get(account).update({
    config
  }))
}

dbapi.delInsAccountByAcccount = function(account) {
  return db.run(r.table('insAccount').get(account).delete())
}

dbapi.saveLog = function(log) {
  log.created = Date.now()
  return db.run(r.table('insLogs').insert(log))
}

dbapi.getAllLogs = function() {
  return db.run(r.table('insLogs').eqJoin(
    'serial',
    r.table('devices')
  ))
}

dbapi.getLogsBySerial = function(serial, type) {
  return db.run(r.table('insLogs').filter({serial, type}).eqJoin(
    'serial',
    r.table('devices')
  ))
}

dbapi.getLogsByAccountLimit = function(account, type, page, limit) {
  return db.run(r.table('insLogs').filter({serial: account, type}).skip((page - 1) * limit).limit(limit).eqJoin(
    'serial',
    r.table('devices')
  ))
}

dbapi.getDeviceNameByAccount = function(account) {
  return db.run(r.table('insAccount').filter({account}).eqJoin(
    'serial',
    r.table('devices')
  ))
}

module.exports = dbapi
