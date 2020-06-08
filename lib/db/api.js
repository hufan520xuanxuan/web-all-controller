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

dbapi.close = function (options) {
  return db.close(options)
}

dbapi.saveUserAfterLogin = function (user) {
  return db.run(r.table('users').get(user.email).update({
    name: user.name
    , ip: user.ip
    , lastLoggedInAt: r.now()
  }))
    .then(function (stats) {
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

dbapi.getUserByEmail = function (email) {
  return db.run(r.table('users').get(email))
}

dbapi.initUserByName = function (user) {
  return db.run(r.table('users').get(user.email).update({
    ip: user.ip
    , group: wireutil.makePrivateChannel()
    , lastLoggedInAt: r.now()
    , createdAt: r.now()
    , forwards: []
    , settings: {}
    , devices: []
  }))
    .then(function (stats) {
      return stats
    })
}

dbapi.updateUserDeviceByEmail = function (email, devices) {
  return db.run(r.table('users').get(email).update({devices}))
}

dbapi.getUsersNotAdmin = function () {
  return db.run(r.table('users').filter({admin: false}))
}

dbapi.loadUser = function (email) {
  return db.run(r.table('users').get(email))
}

dbapi.getUserBySerial = function (serial) {
  return db.run(r.table('users').filter(r.row('devices').contains(serial)))
}

dbapi.updateUserSettings = function (email, changes) {
  return db.run(r.table('users').get(email).update({
    settings: changes
  }))
}

dbapi.resetUserSettings = function (email) {
  return db.run(r.table('users').get(email).update({
    settings: r.literal({})
  }))
}

dbapi.insertUserAdbKey = function (email, key) {
  return db.run(r.table('users').get(email).update({
    adbKeys: r.row('adbKeys').default([]).append({
      title: key.title
      , fingerprint: key.fingerprint
    })
  }))
}

dbapi.deleteUserAdbKey = function (email, fingerprint) {
  return db.run(r.table('users').get(email).update({
    adbKeys: r.row('adbKeys').default([]).filter(function (key) {
      return key('fingerprint').ne(fingerprint)
    })
  }))
}

dbapi.lookupUsersByAdbKey = function (fingerprint) {
  return db.run(r.table('users').getAll(fingerprint, {
    index: 'adbKeys'
  }))
}

dbapi.lookupUserByAdbFingerprint = function (fingerprint) {
  return db.run(r.table('users').getAll(fingerprint, {
    index: 'adbKeys'
  })
    .pluck('email', 'name', 'group'))
    .then(function (cursor) {
      return cursor.toArray()
    })
    .then(function (groups) {
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

dbapi.lookupUserByVncAuthResponse = function (response, serial) {
  return db.run(r.table('vncauth').getAll([response, serial], {
    index: 'responsePerDevice'
  })
    .eqJoin('userId', r.table('users'))('right')
    .pluck('email', 'name', 'group'))
    .then(function (cursor) {
      return cursor.toArray()
    })
    .then(function (groups) {
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

dbapi.loadUserDevices = function (email) {
  return db.run(r.table('devices').getAll(email, {
    index: 'owner'
  }))
}

dbapi.saveDeviceLog = function (serial, entry) {
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

dbapi.saveDeviceInitialState = function (serial, device) {
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
    .then(function (stats) {
      if (stats.skipped) {
        data.serial = serial
        data.createdAt = r.now()
        return db.run(r.table('devices').insert(data))
      }
      return stats
    })
}

dbapi.setDeviceConnectUrl = function (serial, url) {
  return db.run(r.table('devices').get(serial).update({
    remoteConnectUrl: url
    , remoteConnect: true
  }))
}

dbapi.unsetDeviceConnectUrl = function (serial) {
  return db.run(r.table('devices').get(serial).update({
    remoteConnectUrl: null
    , remoteConnect: false
  }))
}

dbapi.saveDeviceStatus = function (serial, status) {
  return db.run(r.table('devices').get(serial).update({
    status: status
    , statusChangedAt: r.now()
  }))
}

dbapi.setDeviceOwner = function (serial, owner) {
  return db.run(r.table('devices').get(serial).update({
    owner: owner
  }))
}

dbapi.unsetDeviceOwner = function (serial) {
  return db.run(r.table('devices').get(serial).update({
    owner: null
  }))
}

dbapi.setDevicePresent = function (serial) {
  return db.run(r.table('devices').get(serial).update({
    present: true
    , presenceChangedAt: r.now()
  }))
}

dbapi.setDeviceAbsent = function (serial) {
  return db.run(r.table('devices').get(serial).update({
    present: false
    , presenceChangedAt: r.now()
  }))
}

dbapi.setDeviceUsage = function (serial, usage) {
  return db.run(r.table('devices').get(serial).update({
    usage: usage
    , usageChangedAt: r.now()
  }))
}

dbapi.unsetDeviceUsage = function (serial) {
  return db.run(r.table('devices').get(serial).update({
    usage: null
    , usageChangedAt: r.now()
  }))
}

dbapi.setDeviceAirplaneMode = function (serial, enabled) {
  return db.run(r.table('devices').get(serial).update({
    airplaneMode: enabled
  }))
}

dbapi.setDeviceBattery = function (serial, battery) {
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

dbapi.setDeviceBrowser = function (serial, browser) {
  return db.run(r.table('devices').get(serial).update({
    browser: {
      selected: browser.selected
      , apps: browser.apps
    }
  }))
}

dbapi.setDeviceConnectivity = function (serial, connectivity) {
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

dbapi.setDevicePhoneState = function (serial, state) {
  return db.run(r.table('devices').get(serial).update({
    network: {
      state: state.state
      , manual: state.manual
      , operator: state.operator
    }
  }))
}

dbapi.setDeviceRotation = function (serial, rotation) {
  return db.run(r.table('devices').get(serial).update({
    display: {
      rotation: rotation
    }
  }))
}

dbapi.setDeviceNote = function (serial, note) {
  return db.run(r.table('devices').get(serial).update({
    notes: note
  }))
}

dbapi.setDeviceReverseForwards = function (serial, forwards) {
  return db.run(r.table('devices').get(serial).update({
    reverseForwards: forwards
  }))
}

dbapi.setDeviceReady = function (serial, channel) {
  return db.run(r.table('devices').get(serial).update({
    channel: channel
    , ready: true
    , owner: null
    , reverseForwards: []
  }))
}

dbapi.saveDeviceIdentity = function (serial, identity) {
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

dbapi.loadDevices = function () {
  return db.run(r.table('devices'))
}

dbapi.loadPresentDevices = function () {
  return db.run(r.table('devices').getAll(true, {
    index: 'present'
  }))
}

dbapi.loadDevice = function (serial) {
  return db.run(r.table('devices').get(serial))
}

dbapi.saveUserAccessToken = function (email, token) {
  return db.run(r.table('accessTokens').insert({
    email: email
    , id: token.id
    , title: token.title
    , jwt: token.jwt
  }))
}

dbapi.removeUserAccessToken = function (email, title) {
  return db.run(r.table('accessTokens').getAll(email, {
    index: 'email'
  }).filter({title: title}).delete())
}

dbapi.loadAccessTokens = function (email) {
  return db.run(r.table('accessTokens').getAll(email, {
    index: 'email'
  }))
}

dbapi.loadAccessToken = function (id) {
  return db.run(r.table('accessTokens').get(id))
}

dbapi.saveInsAccount = function (account, config, serial = '') {
  let follow,
    unfollow,
    thumb,
    comment,
    message,
    post,
    browse,
    statistics
  if (config) {
    follow = config.follow
    unfollow = config.unfollow
    thumb = config.thumb
    comment = config.comment
    message = config.message
    post = config.post
    browse = config.browse
    statistics = config.statistics
  }

  !follow && (follow = {
    status: 0,         // 开启状态
    filtStatus: 0,     // 筛选功能的开启状态
    minPerson: 10,      // 最小人数
    maxPerson: 100,      // 最大人数
    minDelay: 1,       // 最小间隔时间
    maxDelay: 5,       // 最大间隔时间
    excute: {
      start: '00:00',
      end: '23:59'
    },        // 执行时间
    weekday: [1, 2, 3, 4, 5, 6, 0],       // 周
    isTest: 0, // 是否开启测试模式 默认0 不开启
    isLock: 1,
    closeBack: 0,
    closeBackStatus: 1,
    checkSsr: 0, // 是否检查ssr
    startInfo: {
      status: 0,       // 开启的状态
      startName: 'Instagram'    // 分身的名称
    },
    skipAddSecret: 0, // 对隐私用户撤销操作
    skipNoNear: 0, // 跳过没有小圈圈的用户
    skipSecretAccount: 0, // 跳过私密用户
    hasProfile: 0,     // 有个人资料
    followingWords: {
      status: 0,       // 开启状态
      words: ''        // 单词
    },                 // 至少一个帖子包含以下内容
    minFollowers: 0,   // 最小粉丝数
    maxFollowers: 0,   // 最大粉丝数
    minFollowing: 0,   // 最小关注数
    maxFollowing: 0,   // 最大关注数
    postStatus: 0,     //对用户帖子数量的筛选
    minPost: 1,       //用户拥有的最小帖子数量限制
    maxPost: 10,      //用户拥有的最大帖子数量限制
    followerStatus: 0, // 粉丝数筛选开启状态
    followingStatus: 0, // 关注数筛选开启状态
    postTimeStatus: 0, // 对用户帖子时间筛选开启状态
    postTimeBefore: 1, // 对用户帖子时间筛选前多少条帖子
    postTimeDay: 1,   // 对用户帖子时间筛选前多少天以内的帖子
    postCommentStatus: 0, // 对用户帖子评论筛选开启状态
    postCommentBefore: 1, // 对用户帖子评论筛选前多少条帖子
    postCommentMinDay: 1,   // 对帖子评论数量筛选最小值
    postCommentMaxDay: 1,   // 对帖子评论数量筛选最大值
    skipFollowers: 1,  // 跳过已关注用户
    skipBussiness: 0,  // 跳过商业账户
    skipWebsite: 0,    // 跳过网站账户
    lanStatus: 0,     // 语言筛选开关状态
    language: 0,     // 语言 0=不筛选(默认) 1=中文 2=英文 3=中文+英文
    insUsers: {
      resource1: {
        status: 0,
        res: [],
        level: 3,
        // blackSecret: 0,
        // blackFollow: 0,
      },
      resource2: {
        status: 0,
        res: [],
        level: 2,
        // blackSecret: 0,
        // blackFollow: 0,
      },
      resource3: {
        status: 0,
        res: [],
        level: 1,
        // blackSecret: 0,
        // blackFollow: 0,
      },
    },
    minWait: 1,       // 最小行动等待时间
    maxWait: 1,       // 最大行动等待时间
    minDay: 500,         // 每天关注的最小总数
    maxDay: 800,         // 每天关注的最大总数
    addDay: 100,         // 每天自增长个数
    topDay: 200,         // 每天增长的顶值
    fullMinDay: 500,         // 每天自增长到顶后的最小范围值
    fullMaxDay: 800,         // 每天自增长到顶后的最大范围值
    optAfterInfo: { // 操作后关注设置信息
      optStatus: 0, //关注后操作总开关
      afterFollowStatus: false, // 关注后添加推荐用户
      afterFollowMin: 1, // 添加关注后推荐用户最小值
      afterFollowMax: 1, // 添加关注后推荐用户最大值
      afterViewStatus: false, // 关注后操作看故事开关 0=关 1=开
      afterViewMin: 1, // 看故事随机数最小值
      afterViewMax: 1, // 看故事随机数最大值
      afterThumbStatus: false, // 关注后操作点赞开关 0=关 1=开
      afterThumbMin: 1, // 点赞随机数最小值
      afterThumbMax: 1, // 点赞随机数最大值
      afterThumbTotal: 1, // 点赞操作前x条帖子
      afterThumbChoice: 1, // 点赞操作选择前y条帖子
      afterCommentStatus: false, // 关注后操作评论开关 0=关 1=开
      afterCommentMin: 1, // 评论随机数最小值
      afterCommentMax: 1, // 评论事随机数最大值
      afterCommentTotal: 1, // 评论操作前x条帖子
      afterCommentChoice: 1, // 评论操作随机选择y条帖子操作
      afterCommentTxt: '', // 评论操作的文字内容(旋转语法)
      afterMsgStatus: false, // 关注后操作私信开关 0=关 1=开
      afterMsgMin: 1, // 私信随机数最小值
      afterMsgMax: 1, // 私信随机数最大值
      afterMsgTxt: '' // 评论操作的文字内容(旋转语法)
    },
  })

  !unfollow && (unfollow = {
    status: 0,         // 开启状态
    isLock: 1,
    closeBack: 0,
    closeBackStatus: 1,
    checkSsr: 0,      // 是否检查ssr
    startInfo: {
      status: 0,       // 开启的状态
      startName: 'Instagram'    // 分身的名称
    },
    minWait: 1,         // 每组最小休眠时间(分钟)
    maxWait: 1,         // 每组最大休眠时间(分钟)
    minPerson: 10,      // 每组最小人数
    maxPerson: 20,      // 每组最大人数
    minDelay: 1,       // 最小间隔时间
    maxDelay: 5,       // 最大间隔时间
    minDay: 500,         // 每天关注的最小总数
    maxDay: 800,         // 每天关注的最大总数
    addDay: 100,         // 每天自增长个数
    topDay: 200,         // 每天增长的顶值
    fullMinDay: 500,     // 每天自增长到顶后的最小范围值
    fullMaxDay: 800,     // 每天自增长到顶后的最大范围值
    minPage: 3,         // 每页取关最小人数
    maxPage: 5,         // 每页取关最大人数
    minEnter: 1,        // 进入详情页操作最小范围
    maxEnter: 3,        // 进入详情页操作最大范围
    excute: {
      start: '00:00',
      end: '23:59'
    },        // 执行时间
    weekday: [1, 2, 3, 4, 5, 6, 0],       // 周
    //筛选配置
    rankType: 0,       // 排序方式
    nearZoneStatus: 0,   // 优先取关带最近动态的用户
    whitelist: {
      status: 0,       // 白名单开启状态
      list: ''         // 白名单列表
    },                  // 白名单
    reslist: {
      status: 0,
      list: ''
    }
  })

  !thumb && (thumb = {
    status: 0,         // 开启状态
    filtStatus: 0,     //筛选功能的开启状态
    minPerson: 0,      // 最小人数
    maxPerson: 0,      // 最大人数
    minDelay: 0,       // 最小间隔时间
    maxDelay: 0,       // 最大间隔时间
    excute: {
      start: '00:00',
      end: '23:59'
    },        // 执行时间
    weekday: [1, 2, 3, 4, 5, 6, 0],       // 周
    isLock: 1,
    closeBack: 0,
    closeBackStatus: 1,
    isTest: 0, // 是否开启测试模式 默认0 不开启
    checkSsr: 0, // 是否检查ssr
    startInfo: {
      status: 0,       // 开启的状态
      startName: 'Instagram'    // 分身的名称
    },
    skipNoNear: 0, // 跳过没有小圈圈的用户
    skipSecretAccount: 0, // 跳过私密用户
    hasProfile: 0,     // 有个人资料
    followingWords: {
      status: 0,       // 开启状态
      words: ''        // 单词
    },                 // 至少一个帖子包含以下内容
    minFollowers: 0,   // 最小粉丝数
    maxFollowers: 0,   // 最大粉丝数
    minFollowing: 0,   // 最小关注数
    maxFollowing: 0,   // 最大关注数
    postStatus: 0,     //对用户帖子数量的筛选
    minPost: 1,       //用户拥有的最小帖子数量限制
    maxPost: 10,      //用户拥有的最大帖子数量限制
    followerStatus: 0, // 粉丝数筛选开启状态
    followingStatus: 0, // 关注数筛选开启状态
    postTimeStatus: 0, // 对用户帖子时间筛选开启状态
    postTimeBefore: 1, // 对用户帖子时间筛选前多少条帖子
    postTimeDay: 1,   // 对用户帖子时间筛选前多少天以内的帖子
    postCommentStatus: 0, // 对用户帖子评论筛选开启状态
    postCommentBefore: 1, // 对用户帖子评论筛选前多少条帖子
    postCommentMinDay: 1,   // 对帖子评论数量筛选最小值
    postCommentMaxDay: 1,   // 对帖子评论数量筛选最大值
    skipFollowers: 0,  // 跳过跟随者
    skipBussiness: 0,  // 跳过商业账户
    skipWebsite: 0,    // 跳过网站账户
    lanStatus: 0,     // 语言筛选开关状态
    language: 1,     // 语言 1=中文 2=英文(两种选项)            // 只关注
    insUsers: {
      resource1: {
        status: 0,
        res: [],
        level: 3,
      },
      resource2: {
        status: 0,
        res: [],
        level: 2,
      },
      resource3: {
        status: 0,
        res: [],
        level: 1,
        // min: 0,
        // max: 0
      },
    },
    minWait: '',       // 最小行动等待时间
    maxWait: '',       // 最大行动等待时间
    minDay: 0,         // 每天关注的最小总数
    maxDay: 0,         // 每天关注的最大总数
    addDay: 0,         // 每天自增长个数
    topDay: 0,         // 每天增长的顶值
    fullMinDay: 0,         // 每天自增长到顶后的最小范围值
    fullMaxDay: 0,         // 每天自增长到顶后的最大范围值
  })

  !comment && (comment = {
    status: 0,         // 开启状态
    filtStatus: 0,     //筛选功能的开启状态
    minPerson: 0,      // 最小人数
    maxPerson: 0,      // 最大人数
    minDelay: 0,       // 最小间隔时间
    maxDelay: 0,       // 最大间隔时间
    excute: {
      start: '00:00',
      end: '23:59'
    },        // 执行时间
    weekday: [1, 2, 3, 4, 5, 6, 0],       // 周
    isLock: 1,
    closeBack: 0,
    closeBackStatus: 1,
    isTest: 0, // 是否开启测试模式 默认0 不开启
    checkSsr: 0, // 是否检查ssr
    startInfo: {
      status: 0,       // 开启的状态
      startName: 'Instagram'    // 分身的名称
    },
    skipNoNear: 0, // 跳过没有小圈圈的用户
    skipSecretAccount: 0, // 跳过私密用户
    hasProfile: 0,     // 有个人资料
    followingWords: {
      status: 0,       // 开启状态
      words: ''        // 单词
    },                 // 至少一个帖子包含以下内容
    minFollowers: 0,   // 最小粉丝数
    maxFollowers: 0,   // 最大粉丝数
    minFollowing: 0,   // 最小关注数
    maxFollowing: 0,   // 最大关注数
    postStatus: 0,     //对用户帖子数量的筛选
    minPost: 1,       //用户拥有的最小帖子数量限制
    maxPost: 10,      //用户拥有的最大帖子数量限制
    followerStatus: 0, // 粉丝数筛选开启状态
    followingStatus: 0, // 关注数筛选开启状态
    postTimeStatus: 0, // 对用户帖子时间筛选开启状态
    postTimeBefore: 1, // 对用户帖子时间筛选前多少条帖子
    postTimeDay: 1,   // 对用户帖子时间筛选前多少天以内的帖子
    postCommentStatus: 0, // 对用户帖子评论筛选开启状态
    postCommentBefore: 1, // 对用户帖子评论筛选前多少条帖子
    postCommentMinDay: 1,   // 对帖子评论数量筛选最小值
    postCommentMaxDay: 1,   // 对帖子评论数量筛选最大值
    skipFollowers: 0,  // 跳过跟随者
    skipBussiness: 0,  // 跳过商业账户
    skipWebsite: 0,    // 跳过网站账户
    lanStatus: 0,     // 语言筛选开关状态
    language: 1,     // 语言 1=中文 2=英文(两种选项)              // 只关注
    insUsers: {
      resource1: {
        status: 0,
        res: [],
        level: 3,
      },
      resource2: {
        status: 0,
        res: [],
        level: 2,
      },
      resource3: {
        status: 0,
        res: [],
        level: 1,
      },
    },
    minWait: '',       // 最小行动等待时间
    maxWait: '',       // 最大行动等待时间
    minDay: 0,         // 每天关注的最小总数
    maxDay: 0,         // 每天关注的最大总数
    addDay: 0,         // 每天自增长个数
    topDay: 0,         // 每天增长的顶值
    fullMinDay: 0,         // 每天自增长到顶后的最小范围值
    fullMaxDay: 0,         // 每天自增长到顶后的最大范围值
  })

  !message && (message = {
    status: 0,         // 开启状态
    filtStatus: 0,     //筛选功能的开启状态
    minPerson: 0,      // 最小人数
    maxPerson: 0,      // 最大人数
    minDelay: 0,       // 最小间隔时间
    maxDelay: 0,       // 最大间隔时间
    excute: {
      start: '00:00',
      end: '23:59'
    },        // 执行时间
    weekday: [1, 2, 3, 4, 5, 6, 0],       // 周
    isLock: 1,
    closeBack: 0,
    closeBackStatus: 1,
    isTest: 0, // 是否开启测试模式 默认0 不开启
    checkSsr: 0, // 是否检查ssr
    startInfo: {
      status: 0,       // 开启的状态
      startName: 'Instagram'    // 分身的名称
    },
    skipNoNear: 0, // 跳过没有小圈圈的用户
    skipSecretAccount: 0, // 跳过私密用户
    hasProfile: 0,     // 有个人资料
    followingWords: {
      status: 0,       // 开启状态
      words: ''        // 单词
    },                 // 至少一个帖子包含以下内容
    minFollowers: 0,   // 最小粉丝数
    maxFollowers: 0,   // 最大粉丝数
    minFollowing: 0,   // 最小关注数
    maxFollowing: 0,   // 最大关注数
    postStatus: 0,     //对用户帖子数量的筛选
    minPost: 1,       //用户拥有的最小帖子数量限制
    maxPost: 10,      //用户拥有的最大帖子数量限制
    followerStatus: 0, // 粉丝数筛选开启状态
    followingStatus: 0, // 关注数筛选开启状态
    postTimeStatus: 0, // 对用户帖子时间筛选开启状态
    postTimeBefore: 1, // 对用户帖子时间筛选前多少条帖子
    postTimeDay: 1,   // 对用户帖子时间筛选前多少天以内的帖子
    postCommentStatus: 0, // 对用户帖子评论筛选开启状态
    postCommentBefore: 1, // 对用户帖子评论筛选前多少条帖子
    postCommentMinDay: 1,   // 对帖子评论数量筛选最小值
    postCommentMaxDay: 1,   // 对帖子评论数量筛选最大值
    skipFollowers: 0,  // 跳过跟随者
    skipBussiness: 0,  // 跳过商业账户
    skipWebsite: 0,    // 跳过网站账户
    lanStatus: 0,     // 语言筛选开关状态
    language: 1,     // 语言 1=中文 2=英文(两种选项)              // 只关注
    insUsers: {
      resource1: {
        status: 0,
        res: [],
        level: 3,
      },
      resource2: {
        status: 0,
        res: [],
        level: 2,
      },
      resource3: {
        status: 0,
        res: [],
        level: 1,
      },
    },
    minWait: '',       // 最小行动等待时间
    maxWait: '',       // 最大行动等待时间
    minDay: 0,         // 每天关注的最小总数
    maxDay: 0,         // 每天关注的最大总数
    addDay: 0,         // 每天自增长个数
    topDay: 0,         // 每天增长的顶值
    fullMinDay: 0,         // 每天自增长到顶后的最小范围值
    fullMaxDay: 0,         // 每天自增长到顶后的最大范围值
  })

  !post && (post = {
    status: 0,
    postList: [],
    randomPost: {
      checkSsr: 0, // 是否检查ssr
      changePic: 0,
      startInfo: {
        status: 0,       // 开启的状态
        startName: 'Instagram'    // 分身的名称
      },
      locInfo: {
        status: 0,       // 开启的状态
        locName: '中国'    // 分身的名称
      },
      commentInfo: {
        status: 0,
        comment: ''
      },
      postDelay: {
        status: false, // 延时状态
        minDelay: 1, // 最小延时
        maxDelay: 1 // 最大延时
      },
      imgList: [],
      res: '',
      postTime: '',
      type: 1,
      start: 0,
      end: 0,
      usedImgList: []
    }
  })

  !browse && (browse = {
    status: 0,         // 开启状态
    isLock: 1,
    closeBack: 0,
    closeBackStatus: 1,
    checkSsr: 0,      // 是否检查ssr
    startInfo: {
      status: 0,       // 开启的状态
      startName: 'Instagram'    // 分身的名称
    },
    excute: {
      start: '00:00',
      end: '23:59'
    },        // 执行时间
    weekday: [1, 2, 3, 4, 5, 6, 0],       // 周
    followInfo: {  // 首页热身操作信息
      followStatus: false,
      minPost: 10,
      maxPost: 10,
      minRefresh: 5,
      maxRefresh: 5,
      viewInfoStatus: false,
      minViewInfo: 1,
      maxViewInfo: 1,
      viewPostStatus: false,
      minViewPost: 1,
      maxViewPost: 1,
      minViewNum: 1,
      maxViewNum: 8,
      viewLikeStatus: false,
      minViewLike: 1,
      maxViewLike: 1,
      minUsrListLike: 1,
      maxUsrListLike: 1,
      minUsrLike: 1,
      maxUsrLike: 1,
      thumbStatus: false,
      minThumb: 1,
      maxThumb: 1,
      minThumbNum: 1,
      maxThumbNum: 1,
      viewCommentStatus: false,
      minViewComment: 1,
      maxViewComment: 1,
      minUsrListComment: 1,
      maxUsrListComment: 1,
      minUsrComment: 1,
      maxUsrComment: 1,
      commentStatus: false,
      minComment: 1,
      maxComment: 1,
      minCommentNum: 1,
      maxCommentNum: 1,
      commentTxt: '',
      viewVideoStatus: false,
      minViewVideo: 1,
      maxViewVideo: 1,
      minVideoIn: 1,
      maxVideoIn: 1,
      minVideoTime: 3,
      maxVideoTime: 3,
      backType: 1
    },
    recommendInfo: {  // 推荐热身操作信息
      recommendStatus: false,
      minView: 10,
      maxView: 10,
      minPageChoice: 5,
      maxPageChoice: 5,
      minRefresh: 5,
      maxRefresh: 5,
      minPost: 5,
      maxPost: 5,
      viewInfoStatus: false,
      minViewInfo: 1,
      maxViewInfo: 1,
      viewPostStatus: false,
      minViewPost: 1,
      maxViewPost: 1,
      minViewNum: 1,
      maxViewNum: 8,
      viewLikeStatus: false,
      minViewLike: 1,
      maxViewLike: 1,
      minUsrListLike: 1,
      maxUsrListLike: 1,
      minUsrLike: 1,
      maxUsrLike: 1,
      thumbStatus: false,
      minThumb: 1,
      maxThumb: 1,
      minThumbNum: 1,
      maxThumbNum: 1,
      viewCommentStatus: false,
      minViewComment: 1,
      maxViewComment: 1,
      minUsrListComment: 1,
      maxUsrListComment: 1,
      minUsrComment: 1,
      maxUsrComment: 1,
      commentStatus: false,
      minComment: 1,
      maxComment: 1,
      minCommentNum: 1,
      maxCommentNum: 1,
      commentTxt: '',
      viewVideoStatus: false,
      minViewVideo: 1,
      maxViewVideo: 1,
      minVideoIn: 1,
      maxVideoIn: 1,
      minVideoTime: 3,
      maxVideoTime: 3,
      backType: 1
    }
  })

  !statistics && (
    statistics = {
      checkSsr: 0,      // 是否检查ssr
      startInfo: {
        status: 0,       // 开启的状态
        startName: 'Instagram'    // 分身的名称
      },
      excute: {
        start: '',
        end: ''
      },
      weekday: [1, 2, 3, 4, 5, 6, 0]
    }
  )

  return db.run(r.table('insAccount').insert({
    account,
    serial,
    config: {
      follow,
      unfollow,
      thumb,
      comment,
      message,
      post,
      browse,
      statistics
    },
    created: Date.now(),
  }))
}

dbapi.getAllInsAccount = function (page = 1, limit = 10, search) {
  return db.run(r.table('insAccount').filter(function (account) {
      return search ? account('account').eq(search) : true
    }).orderBy(r.asc('account'))
    // .skip((page - 1) * limit).limit(limit)
  )
}

dbapi.getInsAccountBySerial = function (serial) {
  return db.run(r.table('insAccount').filter({serial}))
}

dbapi.getInsAccountByAccount = function (account) {
  return db.run(r.table('insAccount').get(account))
}

dbapi.updateInsAccountSerialByAccount = function (account, serial) {
  return db.run(r.table('insAccount').get(account).update({
    serial
  }))
}

dbapi.updateInsAccountConfigByAccount = function (account, config) {
  return db.run(r.table('insAccount').get(account).update({
    config
  }))
}

dbapi.delInsAccountByAcccount = function (account) {
  return db.run(r.table('insAccount').get(account).delete())
}

dbapi.saveLog = function (log) {
  log.created = Date.now()
  return db.run(r.table('insLogs').insert(log))
}

dbapi.getAllLogs = function (page, limit) {
  return db.run(r.table('insLogs').orderBy({index: r.desc('created')})
    .skip((page - 1) * limit).limit(limit)
    .innerJoin(r.db('stf').table('devices'), function (marvelRow, dcRow) {
      return marvelRow('serial').eq(dcRow('serial'))
    }))
}

dbapi.getLogCount = function () {
  return db.run(r.table('insLogs').count())
}

dbapi.getAllLogsNoJoin = function (status, account, type) {
  let statusFilter = {}
  if (status) {
    statusFilter.status = status
  }
  if (type) {
    statusFilter.type = type
  }
  if (account) {
    statusFilter.account = account
  }
  return db.run(r.table('insLogs').orderBy({index: r.desc('created')})
    .filter(statusFilter))
}

dbapi.getLogsBySerial = function (serial, type) {
  return db.run(r.table('insLogs').orderBy({index: r.desc('created')})
    .filter({serial, type})
    .eqJoin(
      'serial',
      r.table('devices')
    ))
}

dbapi.getLogsByAccount = function (account, type) {
  let filter = {
    account
  }
  if (type) {
    filter.type = type
  }
  return db.run(r.table('insLogs')
    .orderBy({index: r.desc('created')})
    .filter(filter)
    .eqJoin(
      'serial',
      r.table('devices')
    ))
}

dbapi.getLogsByAccountData = function (account, status) {
  let statusFilter = {}
  if (status) {
    statusFilter.status = status
  }
  return db.run(r.table('insLogs')
    .filter({account})
    .filter(statusFilter))
}

dbapi.getLogsByAccountLimit = function (account, type, page, limit) {
  return db.run(r.table('insLogs')
    .orderBy({index: r.desc('created')})
    .filter({
      account,
      type
    })
    .skip((page - 1) * limit).limit(limit)
    .innerJoin(r.db('stf').table('devices'), function (marvelRow, dcRow) {
      return marvelRow('serial').eq(dcRow('serial'))
    }))
  // .eqJoin(
  //   'serial',
  //   r.table('devices')
  // ))
}

dbapi.getLogsByAccountLimitPage = function (account, type) {
  return db.run(r.table('insLogs')
    .filter({
      account,
      type
    }).count())
}

dbapi.getDeviceNameByAccount = function (account) {
  return db.run(r.table('insAccount').filter({account}).eqJoin(
    'serial',
    r.table('devices')
  ))
}

dbapi.createInsPost = function (title) {
  return db.run(r.table('insPost').insert({
    title,
    checkSsr: 1,
    startInfo: {
      status: 0,       // 开启的状态
      startName: 'Instagram'    // 分身的名称
    },
    locInfo: {
      status: 0,       // 开启的状态
      locName: '中国'    // 模拟位置名称
    },
    postDelay: {
      status: false, // 延时状态
      minDelay: 1, // 最小延时
      maxDelay: 1 // 最大延时
    },
    created: Date.now(),
    imgList: [],
    res: '',
    postTime: '',
    type: 1
  }))
}

dbapi.getInsPost = function () {
  return db.run(r.table('insPost'))
}

dbapi.updatePostById = function (id, post) {
  return db.run(r.table('insPost').get(id).update(post))
}

dbapi.getPostById = function (id) {
  return db.run(r.table('insPost').get(id))
}

dbapi.delPostById = function (id) {
  return db.run(r.table('insPost').get(id).delete())
}

dbapi.setMainDevice = function (serial) {
  return db.run(r.table('devices').get(serial).update({
    main: true
  }))
}

dbapi.cancelMainDevice = function (serial) {
  return db.run(r.table('devices').get(serial).update({
    main: false
  }))
}

dbapi.getInsDeviceConfig = function (serial) {
  return db.run(r.table('insDeviceConfig').get(serial))
}

dbapi.setInsDeviceConfig = function (serial, config) {
  return db.run(r.table('insDeviceConfig').get(serial).update(config))
    .then(function (stats) {
      if (stats.skipped) {
        return db.run(r.table('insDeviceConfig').insert({
          serial,
          ...config
        }))
      }
      return stats
    })
}

dbapi.delInsDeviceConfigBySerial = function (serial) {
  return db.run(r.table('insDeviceConfig').get(serial).delete())
}

dbapi.clearInsDeviceConfig = function () {
  return db.run(r.table('insDeviceConfig').delete())
}

dbapi.saveInsAccountNotes = function (account, notes) {
  return db.run(r.table('insAccountNotes').get(account).update({
    notes
  }))
    .then(function (stats) {
      if (stats.skipped) {
        return db.run(r.table('insAccountNotes').insert({
          account,
          notes
        }))
      }
      return stats
    })
}

dbapi.getInsAccountNotes = function (account) {
  return db.run(r.table('insAccountNotes').get(account))
}

dbapi.saveOrUpdateInsaccountRecord = function (account, type, date, record) {
  let id = `${account}_${date}_${type}`
  return db.run(r.table('insAccountRecord').get(id).update({
    account: account,
    created: date,
    record,
    type: type,
    updated: r.now()
  })).then(function (stats) {
    if (stats.skipped) {
      return db.run(r.table('insAccountRecord').insert({
        id,
        account,
        created: date,
        record,
        type: type,
        updated: r.now()
      }))
    }
    return stats
  })
}

dbapi.getInsAccountRecord = function (account, type) {
  let filter = {
    account
  }
  if (type) {
    filter.type = type
  }
  return db.run(r.table('insAccountRecord').filter(filter))
}

dbapi.clearInsAccountRecord = function (account, type, date) {
  return db.run(r.table('insAccountRecord').filter(function (record) {
    return record('created').lt(date).and(record('account').eq(account)).and(record('type').eq(type))
  }).delete())
}

dbapi.getAllInsAccountName = function () {
  return db.run(r.db('stf').table('insAccount').getField('account'))
}
module.exports = dbapi
