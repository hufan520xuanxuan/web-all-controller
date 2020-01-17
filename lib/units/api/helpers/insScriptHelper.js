const moment = require('moment')
const path = require('path')

const logger = require('../../../util/logger')
const log = logger.createLogger('api:helpers:schedule')
const adb = require('./adbHelper').create()
const golbalData = require('./golbalDataHelper')

/**
 * 判断是否需要立即执行脚本
 * @param account
 * @param serial
 * @param config
 * @param type
 */
function checkStartScript(account, serial, config, type = 1, isException = false) {
  let today = moment().format('YYYY-MM-DD ')
  let validTime,
    status
  switch (Number(type)) {
    case 1:
      validTime = moment()
        .isBetween(today + config.follow.excute.start, today + config.follow.excute.end)
      status = config.follow.status
      break
    case 2:
      validTime = moment()
        .isBetween(today + config.unfollow.excute.start, today + config.unfollow.excute.end)
      status = config.unfollow.status
      break
    case 3:
      validTime = moment()
        .isBetween(today + config.thumb.excute.start, today + config.thumb.excute.end)
      status = config.thumb.status
      break
    case 4:
      validTime = moment()
        .isBetween(today + config.comment.excute.start, today + config.comment.excute.end)
      status = config.comment.status
      break
    case 5:
      validTime = moment()
        .isBetween(today + config.message.excute.start, today + config.message.excute.end)
      status = config.message.status
      break
    case 6:
      // validTime = moment()
      //   .isBetween(today + config.post.excute.start, today + config.post.excute.end)
      status = config.post.status
      break
    case 7:
      validTime = moment()
        .isBetween(today + config.browse.excute.start, today + config.browse.excute.end)
      status = config.browse.status
      break
    case 8:
      validTime = moment()
        .isBetween(today + config.statistics.excute.start, today + config.statistics.excute.end)
      status = true
      break
  }
  if (validTime && serial && status) {
    log.info('有效时间范围内，立即执行脚本')
    switch (Number(type)) {
      case 1:
        startFollow(account, serial, config.follow, isException)
        break
      case 2:
        startUnfollow(account, serial, config.unfollow, isException)
        break
      case 3:
        startThumb(account, serial, config.thumb, isException)
        break
      case 4:
        startComment(account, serial, config.comment, isException)
        break
      case 5:
        startMessage(account, serial, config.message, isException)
        break
      case 6:
        // startPost(account, serial, config.post)
        break
      case 7:
        startBrowse(account, serial, config.browse, isException)
        break
      case 8:
        checkStatistics(account, serial)
        break
    }
  }
  else {
    log.info('不在有效时间范围内、状态未开启或未指定设备，不执行脚本')
  }
}

// 关注
function startFollow(account, serial, followConfig, isException = false) {
  let config = JSON.parse(JSON.stringify(followConfig))
  if (!config.status) {
    log.info(serial, '状态未开启，不启动关注脚本')
    return
  }
  log.info(serial, '启动关注脚本')
  config.account = account
  config.isException = isException
  golbalData.get(serial + '_follow', ['randomDay', 'record']).then(ret => {
    // let {
    let randomDay = Math.floor(Math.random() * (config.maxDay - config.minDay + 1)) + config.minDay
    //   record = 0
    // } = ret
    let {record = 0} = ret
    log.info({randomDay, record})
    // if (randomDay <= record) {
    //   log.info('record到达上限，不执行脚本')
    //   return
    // }
    // golbalData.set(serial + '_follow', {randomDay})

    config.randomDay = randomDay
    config.record = record

    let json = formatFollowShell(config)
    log.info(`adb shell ${serial} am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
    adb.shell(serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`).catch(err => {
      log.error(err)
    })
  })
}

// 取关
function startUnfollow(account, serial, unfollowConfig, isException = false) {
  let config = JSON.parse(JSON.stringify(unfollowConfig))
  if (!config.status) {
    log.info(serial, '状态未开启，不启动取注脚本')
    return
  }
  log.info(serial, '启动取注脚本')
  config.account = account
  config.isException = isException
  golbalData.get(serial + '_unfollow', ['randomDay', 'record']).then(ret => {
    let randomDay = Math.floor(Math.random() * (config.maxDay - config.minDay + 1)) + config.minDay
    let {record = 0} = ret
    log.info({randomDay, record})
    // if (randomDay <= record) {
    //   log.info('record到达上限，不执行脚本')
    //   return
    // }
    // golbalData.set(serial + '_unfollow', {randomDay})

    config.randomDay = randomDay
    config.record = record

    let json = formatUnfollowShell(config)
    log.info(`adb shell ${serial} am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsUnFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
    adb.shell(serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsUnFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`).catch(err => {
      log.error(err)
    })
  })
}

// 点赞
function startThumb(account, serial, thumbConfig, isException = false) {
  let config = JSON.parse(JSON.stringify(thumbConfig))
  if (!config.status) {
    log.info(serial, '状态未开启，不启动点赞脚本')
    return
  }
  log.info(serial, '启动点赞脚本')
  config.account = account
  config.isException = isException
  golbalData.get(serial + '_thumb', ['randomDay', 'record']).then(ret => {
    let randomDay = Math.floor(Math.random() * (config.maxDay - config.minDay + 1)) + config.minDay
    let {record = 0} = ret
    log.info({randomDay, record})
    // log.info({randomDay, record})
    // if (randomDay <= record) {
    //   log.info('record到达上限，不执行脚本')
    //   return
    // }
    // golbalData.set(serial + '_thumb', {randomDay})

    config.randomDay = randomDay
    config.record = record

    let json = formatThumbShell(config)
    log.info(`adb shell ${serial} am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsLike' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
    adb.shell(serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsLike' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`).catch(err => {
      log.error(err)
    })
  })
}

// 评论
function startComment(account, serial, commentConfig, isException = false) {
  let config = JSON.parse(JSON.stringify(commentConfig))
  if (!config.status) {
    log.info(serial, '状态未开启，不启动评论脚本')
    return
  }
  log.info(serial, '启动评论脚本')
  config.account = account
  config.isException = isException
  golbalData.get(serial + '_comment', ['randomDay', 'record']).then(ret => {
    let randomDay = Math.floor(Math.random() * (config.maxDay - config.minDay + 1)) + config.minDay
    let {record = 0} = ret
    log.info({randomDay, record})
    // if (randomDay <= record) {
    //   log.info('record到达上限，不执行脚本')
    //   return
    // }
    // golbalData.set(serial + '_comment', {randomDay})

    config.randomDay = randomDay
    config.record = record

    let json = formatCommentShell(config)
    log.info(`adb shell ${serial} am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsComment' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
    adb.shell(serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsComment' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`).catch(err => {
      log.error(err)
    })
  })
}

// 私信
function startMessage(account, serial, messageConfig, isException = false) {
  let config = JSON.parse(JSON.stringify(messageConfig))
  if (!config.status) {
    log.info(serial, '状态未开启，不启动私信脚本')
    return
  }
  log.info(serial, '启动私信脚本')
  config.account = account
  config.isException = isException
  golbalData.get(serial + '_message', ['randomDay', 'record']).then(ret => {
    let randomDay = Math.floor(Math.random() * (config.maxDay - config.minDay + 1)) + config.minDay
    let {record = 0} = ret
    log.info({randomDay, record})
    // if (randomDay <= record) {
    //   log.info('record到达上限，不执行脚本')
    //   return
    // }
    // golbalData.set(serial + '_message', {randomDay})

    config.randomDay = randomDay
    config.record = record

    let json = formatMessageShell(config)
    log.info(`adb shell ${serial} am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsMsg' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
    adb.shell(serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsMsg' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`).catch(err => {
      log.error(err)
    })
  })
}

// 发帖
function startPost(account, serial, postConfig) {
  let config = JSON.parse(JSON.stringify(postConfig))
  // if(!config.status) {
  //   log.info(serial, '状态未开启，不启动发帖脚本')
  //   return
  // }
  log.info(serial, '启动发帖脚本')
  config.account = account

  let postType = 1

  if (config.start !== undefined && config.end !== undefined) {
    let imgCount

    postType = 2

    // 如果end大于等于start才正常random出一个随机数,否则使用start
    if (config.end >= config.start) {
      imgCount = Math.floor(Math.random() * (config.end - config.start + 1)) + config.start
    }
    else {
      imgCount = config.start
    }

    // 如果使用的随机图片数比图片的数量多，那就使用图片数量
    if (imgCount > config.imgList.length) {
      imgCount = config.imgList.length
    }

    // 随机图片数小于图片数才会执行以下操作，否则不更改imgList
    if (imgCount < config.imgList.length) {
      let randomImg = []
      let imgList = []
      for (let i = 0; i < imgCount; i++) {
        let random = -1
        while (random < 0 || randomImg.includes(random)) {
          random = Math.floor(Math.random() * config.imgList.length)
        }
        randomImg.push(random)
      }

      randomImg.map(i => {
        console.log(i)
        imgList.push(config.imgList[i])
      })

      config.imgList = imgList
    }
  }

  config.postType = postType

  let target = '/storage/emulated/0/DCIM/insRes'
  config.imgList.map(img => {
    console.log(path.resolve(__dirname, `../../../../uploads${img}`))
    adb.push(serial, path.resolve(__dirname, `../../../../uploads${img}`), target + img)
      .then(function() {
        log.info('图片', img, 'push成功')
      }).catch(function() {
      log.error('图片', img, 'push失败')
    })
  })

  let json = formatPostShell(config)

  log.info(`adb shell ${serial} am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsPost' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
  adb.shell(serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsPost' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`).catch(err => {
    log.error(err)
  })
}

// 热身
function startBrowse(account, serial, browseConfig, isException = false) {
  let config = JSON.parse(JSON.stringify(browseConfig))
  if (!config.status) {
    log.info(serial, '状态未开启，不启动热身脚本')
    return
  }
  log.info(serial, '启动热身脚本')
  config.account = account
  config.isException = isException
  let json = formatBrowseShell(config)
  log.info(`adb shell ${serial} am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsBrowse' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
  adb.shell(serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsBrowse' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`).catch(err => {
    log.error(err)
  })
}

/**
 * 检查是否需要执行统计脚本
 * @param account
 * @param serial
 */
function checkStatistics(account, serial) {
  // golbalData.get(serial + '_statistics', 'isTotal').then(isTotal => {
  // if (!isTotal) {
  let {getInsAccountStatisticsByAccount} = require('../controllers/insAccount')

  getInsAccountStatisticsByAccount(account).then(statistics => {
    statistics.checkSsr = statistics.checkSsr ? 1 : 0

    statistics.startInfo.status = statistics.startInfo.status ? 1 : 0
    statistics.account = account

    let json = encodeURI(`${JSON.stringify(statistics)}`)
    log.info('开始执行统计脚本')
    log.info(`adb shell ${serial} am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsTotal' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
    adb.shell(serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsTotal' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`).catch(err => {
      log.error(err)
    })
    // isTotal = true
    // golbalData.set(serial + '_statistics', {isTotal})
    // })
    // }
  })
}

function stop(serial) {
  log.info(serial, '停止脚本')
  log.info(`adb shell ${serial}am force-stop com.phone.mhzk`)
  adb.shell(serial, 'am force-stop com.phone.mhzk').catch(err => {
    log.error(err)
  })
}

// 关注
function formatFollowShell(params = {}) {
  let data = JSON.parse(JSON.stringify(params))

  Object.keys(data).map(key => {
    if (typeof data[key] === 'boolean') {
      data[key] = data[key] ? 1 : 0
    }
  })

  data.startInfo.status = data.startInfo.status ? 1 : 0

  let {
    filtStatus = 0,
    minWait = 1,
    maxWait = 1,
    minPerson = 20,
    maxPerson = 100,
    minDelay = 1,
    maxDelay = 5,
    // minDay = 100,
    // maxDay = 500,
    record,
    randomDay,
    fullMinDay = 500,
    fullMaxDay = 800,
    optAfterInfo,
    isTest = 0,
    isLock = 1,
    closeBack = 0,
    closeBackStatus = 1,
    checkSsr = 0,
    startInfo,
    skipNoNear = 0,
    skipSecretAccount,
    postTimeStatus = 0,
    postTimeBefore = 1,
    postTimeDay = 1,
    postCommentStatus = 0,
    postCommentBefore = 1,
    postCommentMinDay = 1,
    postCommentMaxDay = 1,
    hasProfile,
    followingWords,
    minFollowers,
    maxFollowers,
    minFollowing,
    maxFollowing,
    followerStatus,
    followingStatus,
    postStatus,
    minPost,
    maxPost,
    skipFollowers,
    skipBussiness,
    skipWebsite,
    lanStatus = 0,
    language = 1,
    insUsers,
    account,
    isException
  } = data

  let newInsUsers = []

  let res
  let resourceType = ''

  Object.keys(insUsers).map(key => {
    if (Number(insUsers[key].status) === 1) {
      if (!res || res.level < insUsers[key].level) {
        res = insUsers[key]
        resourceType = key.split('resource')[1]
      }
    }
  })

  let blackSecret = res ? (res.blackSecret ? 1 : 0) : 0
  let blackFollow = res ? (res.blackFollow ? 1 : 0) : 0
  newInsUsers = res ? res.res || [] : []

  let originBlackList = res ? res.blackList || [] : []

  let blackList = []

  originBlackList.map(item => {
    let insUser = newInsUsers.find(i => i.res === item.res && i.type === item.type)
    if (insUser) {
      let index = blackList.findIndex(i => i.res === item.res && i.type === item.type)
      if (index >= 0) {
        blackList[index].list.push(item.blackName)
      }
      else {
        blackList.push({
          res: insUser.res,
          type: insUser.type,
          list: [item.blackName]
        })
      }
    }
  })

  resourceType = resourceType ? Number(resourceType) : 0
  newInsUsers.map(item => {
    delete item.created
  })

  newInsUsers = newInsUsers.filter(item => item.status)
  newInsUsers.sort((a, b) => b.level - a.level)

  followingWords.words = followingWords.words.split('\n')
  followingWords.status = followingWords.status ? 1 : 0

  return encodeURI(`${JSON.stringify({
    filtStatus,
    account,
    minWait,
    maxWait,
    minPerson,
    maxPerson,
    minDelay,
    maxDelay,
    // minDay,
    // maxDay,
    recordNum: record,
    randomDay,
    fullMinDay,
    fullMaxDay,
    optAfterInfo,
    isTest,
    isLock,
    closeBack,
    closeBackStatus,
    checkSsr,
    startInfo,
    skipNoNear,
    skipSecretAccount,
    postTimeStatus,
    postTimeBefore,
    postTimeDay,
    postCommentStatus,
    postCommentBefore,
    postCommentMinDay,
    postCommentMaxDay,
    hasProfile,
    followingWords,
    minFollowers,
    maxFollowers,
    minFollowing,
    maxFollowing,
    followerStatus,
    followingStatus,
    postStatus,
    minPost,
    maxPost,
    skipFollowers,
    skipBussiness,
    skipWebsite,
    lanStatus,
    language,
    insUsers: newInsUsers,
    blackFollow,
    blackSecret,
    resourceType,
    isException,
    blackList
  })}`)
}

// 取关
function formatUnfollowShell(params = {}) {
  let data = JSON.parse(JSON.stringify(params))
  Object.keys(data).map(key => {
    if (typeof data[key] === 'boolean') {
      data[key] = data[key] ? 1 : 0
    }
  })

  data.startInfo.status = data.startInfo.status ? 1 : 0

  let {
    account,
    isLock = 1,
    closeBack = 0,
    closeBackStatus = 1,
    checkSsr = 0,
    startInfo,
    rankType = 0,
    randomDay,
    record,
    minWait = 1,
    maxWait = 1,
    minPerson = 10,
    maxPerson = 20,
    minDelay = 1,
    maxDelay = 10,
    minPage = 3,
    maxPage = 5,
    minEnter = 1,
    maxEnter = 3,
    nearZoneStatus = 0,
    whitelist,
    isException
  } = data

  whitelist.list = whitelist.list ? whitelist.list.split(',') : []
  whitelist.status = whitelist.status ? 1 : 0

  return encodeURI(`${JSON.stringify({
    account,
    isLock,
    closeBack,
    closeBackStatus,
    checkSsr,
    startInfo,
    rankType,
    randomDay,
    recordNum: record,
    minWait,
    maxWait,
    minPerson,
    maxPerson,
    minDelay,
    maxDelay,
    minPage,
    maxPage,
    minEnter,
    maxEnter,
    nearZoneStatus,
    whitelist,
    isException
  })}`)
}

// 点赞
function formatThumbShell(params = {}) {
  let data = JSON.parse(JSON.stringify(params))

  Object.keys(data).map(key => {
    if (typeof data[key] === 'boolean') {
      data[key] = data[key] ? 1 : 0
    }
  })

  data.startInfo.status = data.startInfo.status ? 1 : 0

  let {
    filtStatus = 0,
    minWait = 0,
    maxWait = 0,
    minPerson,
    maxPerson,
    minDelay = 0,
    maxDelay = 0,
    // minDay = 0,
    // maxDay = 0,
    randomDay,
    record,
    fullMinDay = 0,
    fullMaxDay = 0,
    isLock = 1,
    closeBack = 0,
    closeBackStatus = 1,
    isTest = 0,
    checkSsr = 0,
    startInfo,
    skipSecretAccount,
    postTimeStatus = 0,
    postTimeBefore = 1,
    postTimeDay = 1,
    postCommentStatus = 0,
    postCommentBefore = 1,
    postCommentMinDay = 1,
    postCommentMaxDay = 1,
    hasProfile,
    followingWords,
    minFollowers,
    maxFollowers,
    minFollowing,
    maxFollowing,
    followerStatus,
    followingStatus,
    postStatus,
    minPost,
    maxPost,
    skipNoNear = 0,
    skipFollowers,
    skipBussiness,
    skipWebsite,
    lanStatus = 0,
    language = 1,
    insUsers,
    account,
    isException
  } = data

  let newInsUsers = []

  let res

  let resourceType = ''

  Object.keys(insUsers).map(key => {
    if (Number(insUsers[key].status) === 1) {
      if (!res || res.level < insUsers[key].level) {
        res = insUsers[key]
        resourceType = key.split('resource')[1]
      }
    }
  })

  newInsUsers = res ? res.res || [] : []

  let originBlackList = res ? res.blackList || [] : []

  let blackList = []

  originBlackList.map(item => {
    let insUser = newInsUsers.find(i => i.res === item.res && i.type === item.type)
    if (insUser) {
      let index = blackList.findIndex(i => i.res === item.res && i.type === item.type)
      if (index >= 0) {
        blackList[index].list.push(item.blackName)
      }
      else {
        blackList.push({
          res: insUser.res,
          type: insUser.type,
          list: [item.blackName]
        })
      }
    }
  })

  resourceType = resourceType ? Number(resourceType) : 0
  newInsUsers.map(item => {
    delete item.created
  })

  newInsUsers = newInsUsers.filter(item => item.status)
  newInsUsers.sort((a, b) => b.level - a.level)

  followingWords.words = followingWords.words.split('\n')
  followingWords.status = followingWords.status ? 1 : 0

  return encodeURI(`${JSON.stringify({
    filtStatus,
    account,
    minWait,
    maxWait,
    minPerson,
    maxPerson,
    minDelay,
    maxDelay,
    // minDay,
    // maxDay,
    randomDay,
    recordNum: record,
    fullMinDay,
    fullMaxDay,
    isLock,
    closeBack,
    closeBackStatus,
    isTest,
    checkSsr,
    startInfo,
    skipSecretAccount,
    postTimeStatus,
    postTimeBefore,
    postTimeDay,
    postCommentStatus,
    postCommentBefore,
    postCommentMinDay,
    postCommentMaxDay,
    hasProfile,
    followingWords,
    minFollowers,
    maxFollowers,
    minFollowing,
    maxFollowing,
    followerStatus,
    followingStatus,
    skipFollowers,
    postStatus,
    minPost,
    maxPost,
    skipNoNear,
    skipBussiness,
    skipWebsite,
    lanStatus,
    language,
    insUsers: newInsUsers,
    resourceType,
    isException,
    blackList
  })}`)
}

// 评论
function formatCommentShell(params = {}) {
  let data = JSON.parse(JSON.stringify(params))

  Object.keys(data).map(key => {
    if (typeof data[key] === 'boolean') {
      data[key] = data[key] ? 1 : 0
    }
  })

  data.startInfo.status = data.startInfo.status ? 1 : 0

  let {
    filtStatus = 0,
    minWait = 0,
    maxWait = 0,
    minPerson,
    maxPerson,
    minDelay = 0,
    maxDelay = 0,
    // minDay = 0,
    // maxDay = 0,
    randomDay,
    record,
    fullMinDay = 0,
    fullMaxDay = 0,
    isLock = 1,
    closeBack = 0,
    closeBackStatus = 1,
    isTest = 0,
    checkSsr = 0,
    startInfo,
    skipSecretAccount,
    postTimeStatus = 0,
    postTimeBefore = 1,
    postTimeDay = 1,
    postCommentStatus = 0,
    postCommentBefore = 1,
    postCommentMinDay = 1,
    postCommentMaxDay = 1,
    hasProfile,
    followingWords,
    minFollowers,
    maxFollowers,
    minFollowing,
    maxFollowing,
    followerStatus,
    followingStatus,
    postStatus,
    minPost,
    maxPost,
    skipNoNear = 0,
    skipFollowers,
    skipBussiness,
    skipWebsite,
    lanStatus = 0,
    language = 1,
    insUsers,
    account,
    isException
  } = data

  let newInsUsers = []

  let res

  let resourceType = ''

  Object.keys(insUsers).map(key => {
    if (Number(insUsers[key].status) === 1) {
      if (!res || res.level < insUsers[key].level) {
        res = insUsers[key]
        resourceType = key.split('resource')[1]
      }
    }
  })

  newInsUsers = res ? res.res || [] : []

  let originBlackList = res ? res.blackList || [] : []

  let blackList = []

  originBlackList.map(item => {
    let insUser = newInsUsers.find(i => i.res === item.res && i.type === item.type)
    if (insUser) {
      let index = blackList.findIndex(i => i.res === item.res && i.type === item.type)
      if (index >= 0) {
        blackList[index].list.push(item.blackName)
      }
      else {
        blackList.push({
          res: insUser.res,
          type: insUser.type,
          list: [item.blackName]
        })
      }
    }
  })
  resourceType = resourceType ? Number(resourceType) : 0
  newInsUsers.map(item => {
    delete item.created
  })

  newInsUsers = newInsUsers.filter(item => item.status)
  newInsUsers.sort((a, b) => b.level - a.level)

  followingWords.words = followingWords.words.split('\n')
  followingWords.status = followingWords.status ? 1 : 0

  return encodeURI(`${JSON.stringify({
    filtStatus,
    account,
    minWait,
    maxWait,
    minPerson,
    maxPerson,
    minDelay,
    maxDelay,
    // minDay,
    // maxDay,
    randomDay,
    recordNum: record,
    fullMinDay,
    fullMaxDay,
    isLock,
    closeBack,
    closeBackStatus,
    isTest,
    checkSsr,
    startInfo,
    skipSecretAccount,
    postTimeStatus,
    postTimeBefore,
    postTimeDay,
    postCommentStatus,
    postCommentBefore,
    postCommentMinDay,
    postCommentMaxDay,
    hasProfile,
    followingWords,
    minFollowers,
    maxFollowers,
    minFollowing,
    maxFollowing,
    followerStatus,
    followingStatus,
    postStatus,
    minPost,
    maxPost,
    skipNoNear,
    skipFollowers,
    skipBussiness,
    skipWebsite,
    lanStatus,
    language,
    insUsers: newInsUsers,
    resourceType,
    isException,
    blackList
  })}`)
}

// 私信
function formatMessageShell(params = {}) {
  let data = JSON.parse(JSON.stringify(params))

  Object.keys(data).map(key => {
    if (typeof data[key] === 'boolean') {
      data[key] = data[key] ? 1 : 0
    }
  })

  data.startInfo.status = data.startInfo.status ? 1 : 0

  let {
    filtStatus = 0,
    minWait = 0,
    maxWait = 0,
    minPerson,
    maxPerson,
    minDelay = 0,
    maxDelay = 0,
    // minDay = 0,
    // maxDay = 0,
    randomDay,
    record,
    fullMinDay = 0,
    fullMaxDay = 0,
    isLock = 1,
    closeBack = 0,
    closeBackStatus = 1,
    isTest = 0,
    checkSsr = 0,
    startInfo,
    skipSecretAccount,
    postTimeStatus = 0,
    postTimeBefore = 1,
    postTimeDay = 1,
    postCommentStatus = 0,
    postCommentBefore = 1,
    postCommentMinDay = 1,
    postCommentMaxDay = 1,
    hasProfile,
    followingWords,
    minFollowers,
    maxFollowers,
    minFollowing,
    maxFollowing,
    followerStatus,
    followingStatus,
    postStatus,
    minPost,
    maxPost,
    skipNoNear = 0,
    skipFollowers,
    skipBussiness,
    skipWebsite,
    lanStatus = 0,
    language = 1,
    insUsers,
    account,
    isException
  } = data

  let newInsUsers = []

  let res

  let resourceType = ''

  Object.keys(insUsers).map(key => {
    if (Number(insUsers[key].status) === 1) {
      if (!res || res.level < insUsers[key].level) {
        res = insUsers[key]
        resourceType = key.split('resource')[1]
      }
    }
  })

  newInsUsers = res ? res.res || [] : []

  let originBlackList = res ? res.blackList || [] : []

  let blackList = []

  originBlackList.map(item => {
    let insUser = newInsUsers.find(i => i.res === item.res && i.type === item.type)
    if (insUser) {
      let index = blackList.findIndex(i => i.res === item.res && i.type === item.type)
      if (index >= 0) {
        blackList[index].list.push(item.blackName)
      }
      else {
        blackList.push({
          res: insUser.res,
          type: insUser.type,
          list: [item.blackName]
        })
      }
    }
  })
  resourceType = resourceType ? Number(resourceType) : 0
  newInsUsers.map(item => {
    delete item.created
  })

  newInsUsers = newInsUsers.filter(item => item.status)
  newInsUsers.sort((a, b) => b.level - a.level)

  followingWords.words = followingWords.words.split('\n')
  followingWords.status = followingWords.status ? 1 : 0

  return encodeURI(`${JSON.stringify({
    filtStatus,
    account,
    minWait,
    maxWait,
    minPerson,
    maxPerson,
    minDelay,
    maxDelay,
    // minDay,
    // maxDay,
    randomDay,
    recordNum: record,
    fullMinDay,
    fullMaxDay,
    isLock,
    closeBack,
    closeBackStatus,
    isTest,
    checkSsr,
    startInfo,
    skipSecretAccount,
    postTimeStatus,
    postTimeBefore,
    postTimeDay,
    postCommentStatus,
    postCommentBefore,
    postCommentMinDay,
    postCommentMaxDay,
    hasProfile,
    followingWords,
    minFollowers,
    maxFollowers,
    minFollowing,
    maxFollowing,
    followerStatus,
    followingStatus,
    postStatus,
    minPost,
    maxPost,
    skipNoNear,
    skipFollowers,
    skipBussiness,
    skipWebsite,
    lanStatus,
    language,
    insUsers: newInsUsers,
    resourceType,
    isException,
    blackList,
  })}`)
}

// 发帖
function formatPostShell(config) {
  let data = JSON.parse(JSON.stringify(config))

  Object.keys(data).map(key => {
    if (typeof data[key] === 'boolean') {
      data[key] = data[key] ? 1 : 0
    }
  })

  if (data.startInfo) {
    data.startInfo.status = data.startInfo.status ? 1 : 0
  }
  if (data.locInfo) {
    data.locInfo.status = data.locInfo.status ? 1 : 0
  }
  if (data.commentInfo) {
    data.commentInfo.status = data.commentInfo.status ? 1 : 0
  }

  let {
    account = '',
    res = '',
    checkSsr,
    changePic,
    imgList = [],
    startInfo,
    locInfo,
    commentInfo,
    postDelay,
    postType,
    id = '',
  } = data

  return encodeURI(`${JSON.stringify({
    account,
    checkSsr,
    changePic,
    postMsg: res,
    postNum: imgList.length,
    imgList,
    startInfo,
    locInfo,
    commentInfo,
    postDelay,
    postType,
    id,
  })}`)
}

// 热身
function formatBrowseShell(params = {}) {
  let data = JSON.parse(JSON.stringify(params))
  Object.keys(data).map(key => {
    if (typeof data[key] === 'boolean') {
      data[key] = data[key] ? 1 : 0
    }
  })

  data.startInfo.status = data.startInfo.status ? 1 : 0

  let {
    account,
    isLock = 1,
    closeBack = 0,
    closeBackStatus = 1,
    checkSsr = 0,
    startInfo,
    followInfo,
    recommendInfo,
    isException
  } = data

  return encodeURI(`${JSON.stringify({
    isLock,
    closeBack,
    closeBackStatus,
    account,
    checkSsr,
    startInfo,
    followInfo,
    recommendInfo,
    isException
  })}`)
}

module.exports = {
  startFollow,
  stop,
  startUnfollow,
  startThumb,
  startComment,
  startMessage,
  checkStartScript,
  startPost,
  startBrowse,
  checkStatistics
}
