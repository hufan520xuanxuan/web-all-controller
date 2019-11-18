const moment = require('moment')
const path = require('path')

const logger = require('../../../util/logger')
const log = logger.createLogger('api:helpers:schedule')
const adb = require('./adbHelper').create()

/**
 * 判断是否需要立即执行脚本
 * @param account
 * @param serial
 * @param config
 * @param type
 */
function checkStartScript(account, serial, config, type = 1) {
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
  }
  if (validTime && serial && status) {
    log.info('有效时间范围内，立即执行脚本')
    switch (Number(type)) {
      case 1:
        startFollow(account, serial, config.follow)
        break
      case 2:
        startUnfollow(account, serial, config.unfollow)
        break
      case 3:
        startThumb(account, serial, config.thumb)
        break
      case 4:
        startComment(account, serial, config.comment)
        break
      case 5:
        startMessage(account, serial, config.message)
        break
      case 6:
        // startPost(account, serial, config.post)
        break
      case 7:
        startBrowse(account, serial, config.message)
        break
    }
  }
  else {
    log.info('不在有效时间范围内、状态未开启或未指定设备，不执行脚本')
  }
}

// 关注
function startFollow(account, serial, followConfig) {
  log.info(serial, '启动关注脚本')
  let config = JSON.parse(JSON.stringify(followConfig))
  config.account = account
  let json = formatFollowShell(config)
  log.info(`adb shell ${serial} am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
  adb.shell(serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`).catch(err => {
    log.error(err)
  })
}

// 取关
function startUnfollow(account, serial, unfollowConfig) {
  log.info(serial, '启动取注脚本')
  let config = JSON.parse(JSON.stringify(unfollowConfig))
  config.account = account
  let json = formatUnfollowShell(config)
  log.info(`adb shell ${serial} am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsUnFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
  adb.shell(serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsUnFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`).catch(err => {
    log.error(err)
  })
}

// 点赞
function startThumb(account, serial, thumbConfig) {
  log.info(serial, '启动点赞脚本')
  let config = JSON.parse(JSON.stringify(thumbConfig))
  config.account = account
  let json = formatThumbShell(config)
  log.info(`adb shell ${serial} am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsLike' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
  adb.shell(serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsLike' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`).catch(err => {
    log.error(err)
  })
}

// 评论
function startComment(account, serial, commentConfig) {
  log.info(serial, '启动评论脚本')
  let config = JSON.parse(JSON.stringify(commentConfig))
  config.account = account
  let json = formatCommentShell(config)
  log.info(`adb shell ${serial} am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsComment' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
  adb.shell(serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsComment' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`).catch(err => {
    log.error(err)
  })
}

// 私信
function startMessage(account, serial, messageConfig) {
  log.info(serial, '启动私信脚本')
  let config = JSON.parse(JSON.stringify(messageConfig))
  config.account = account
  let json = formatMessageShell(config)
  log.info(`adb shell ${serial} am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsMsg' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
  adb.shell(serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsMsg' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`).catch(err => {
    log.error(err)
  })
}

// 发帖
function startPost(account, serial, postConfig) {
  log.info(serial, '启动发帖脚本')
  let config = JSON.parse(JSON.stringify(postConfig))
  config.account = account

  if (config.start !== undefined && config.end !== undefined) {
    let imgCount

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
          random = Math.round(Math.random() * config.imgList.length)
        }
        randomImg.push(random)
      }

      randomImg.map(i => {
        imgList.push(config.imgList[i])
      })

      config.imgList = imgList
    }
  }

  let json = formatPostShell(config)
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

  log.info(`adb shell ${serial} am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsPost' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
  adb.shell(serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsPost' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`).catch(err => {
    log.error(err)
  })
}

// 热身
function startBrowse(account, serial, browseConfig) {
  log.info(serial, '启动热身脚本')
  let config = JSON.parse(JSON.stringify(browseConfig))
  config.account = account
  let json = formatBrowseShell(config)
  log.info(`adb shell ${serial} am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsBrowse' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
  adb.shell(serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsBrowse' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`).catch(err => {
    log.error(err)
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
    minWait = 0,
    maxWait = 0,
    minPerson,
    maxPerson,
    minDelay = 0,
    maxDelay = 0,
    minDay = 0,
    maxDay = 0,
    fullMinDay = 0,
    fullMaxDay = 0,
    afterViewStatus = 0,
    afterViewMin = 1,
    afterViewMax = 1,
    afterThumbStatus = 0,
    afterThumbTotal = 1,
    afterThumbChoice = 1,
    afterCommentStatus = 0,
    afterCommentTotal = 1,
    afterCommentChoice = 1,
    afterCommentTxt,
    afterMsgStatus = 0,
    afterMsgMin = 1,
    afterMsgMax = 1,
    afterMsgTxt,
    isTest = 0,
    checkSsr = 0,
    startInfo,
    skipSecretAccount,
    zoneChoiceStatus = 0,
    zoneBefore = 0,
    zoneTime = 0,
    zoneComment = 0,
    skipNonEnglish,
    hasProfile,
    followingWords,
    minFollowers,
    maxFollowers,
    minFollowing,
    maxFollowing,
    followerStatus,
    skipFollowers,
    skipBussiness,
    skipWebsite,
    skipPhone,
    followOnly,
    skipWaitTime,
    insUsers,
    account
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

  resourceType = resourceType ? Number(resourceType) : 0
  newInsUsers.map(item => {
    delete item.created
  })

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
    minDay,
    maxDay,
    fullMinDay,
    fullMaxDay,
    afterViewStatus,
    afterViewMin,
    afterViewMax,
    afterThumbStatus,
    afterThumbTotal,
    afterThumbChoice,
    afterCommentStatus,
    afterCommentTotal,
    afterCommentChoice,
    afterCommentTxt,
    afterMsgStatus,
    afterMsgMin,
    afterMsgMax,
    afterMsgTxt,
    isTest,
    checkSsr,
    startInfo,
    skipSecretAccount,
    zoneChoiceStatus,
    zoneBefore,
    zoneTime,
    zoneComment,
    skipNonEnglish,
    hasProfile,
    followingWords,
    minFollowers,
    maxFollowers,
    minFollowing,
    maxFollowing,
    followerStatus,
    skipFollowers,
    skipBussiness,
    skipWebsite,
    skipPhone,
    followOnly,
    skipWaitTime,
    insUsers: newInsUsers,
    resourceType
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
    checkSsr = 0,
    startInfo,
    rankType = 2,
    minPerson,
    maxPerson,
    minDelay,
    maxDelay,
    minPage = 0,
    maxPage = 7,
    minEnter,
    maxEnter,
    whitelist
  } = data

  whitelist.list = whitelist.list.split(',')
  whitelist.status = whitelist.status ? 1 : 0

  return `"${JSON.stringify({
    account,
    checkSsr,
    startInfo,
    rankType,
    minPerson,
    maxPerson,
    minDelay,
    maxDelay,
    minPage,
    maxPage,
    minEnter,
    maxEnter,
    whitelist
  })}"`
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
    minDay = 0,
    maxDay = 0,
    fullMinDay = 0,
    fullMaxDay = 0,
    isTest = 0,
    checkSsr = 0,
    startInfo,
    skipSecretAccount,
    zoneChoiceStatus = 0,
    zoneBefore = 0,
    zoneTime = 0,
    zoneComment = 0,
    skipNonEnglish,
    hasProfile,
    followingWords,
    minFollowers,
    maxFollowers,
    minFollowing,
    maxFollowing,
    followerStatus,
    skipFollowers,
    skipBussiness,
    skipWebsite,
    skipPhone,
    followOnly,
    skipWaitTime,
    insUsers,
    account
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

  resourceType = resourceType ? Number(resourceType) : 0
  newInsUsers.map(item => {
    delete item.created
  })

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
    minDay,
    maxDay,
    fullMinDay,
    fullMaxDay,
    isTest,
    checkSsr,
    startInfo,
    skipSecretAccount,
    zoneChoiceStatus,
    zoneBefore,
    zoneTime,
    zoneComment,
    skipNonEnglish,
    hasProfile,
    followingWords,
    minFollowers,
    maxFollowers,
    minFollowing,
    maxFollowing,
    followerStatus,
    skipFollowers,
    skipBussiness,
    skipWebsite,
    skipPhone,
    followOnly,
    skipWaitTime,
    insUsers: newInsUsers,
    resourceType
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
    minDay = 0,
    maxDay = 0,
    fullMinDay = 0,
    fullMaxDay = 0,
    isTest = 0,
    checkSsr = 0,
    startInfo,
    skipSecretAccount,
    zoneChoiceStatus = 0,
    zoneBefore = 0,
    zoneTime = 0,
    zoneComment = 0,
    skipNonEnglish,
    hasProfile,
    followingWords,
    minFollowers,
    maxFollowers,
    minFollowing,
    maxFollowing,
    followerStatus,
    skipFollowers,
    skipBussiness,
    skipWebsite,
    skipPhone,
    followOnly,
    skipWaitTime,
    insUsers,
    account
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

  resourceType = resourceType ? Number(resourceType) : 0
  newInsUsers.map(item => {
    delete item.created
  })

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
    minDay,
    maxDay,
    fullMinDay,
    fullMaxDay,
    isTest,
    checkSsr,
    startInfo,
    skipSecretAccount,
    zoneChoiceStatus,
    zoneBefore,
    zoneTime,
    zoneComment,
    skipNonEnglish,
    hasProfile,
    followingWords,
    minFollowers,
    maxFollowers,
    minFollowing,
    maxFollowing,
    followerStatus,
    skipFollowers,
    skipBussiness,
    skipWebsite,
    skipPhone,
    followOnly,
    skipWaitTime,
    insUsers: newInsUsers,
    resourceType
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
    minDay = 0,
    maxDay = 0,
    fullMinDay = 0,
    fullMaxDay = 0,
    isTest = 0,
    checkSsr = 0,
    startInfo,
    skipSecretAccount,
    zoneChoiceStatus = 0,
    zoneBefore = 0,
    zoneTime = 0,
    zoneComment = 0,
    skipNonEnglish,
    hasProfile,
    followingWords,
    minFollowers,
    maxFollowers,
    minFollowing,
    maxFollowing,
    followerStatus,
    skipFollowers,
    skipBussiness,
    skipWebsite,
    skipPhone,
    followOnly,
    skipWaitTime,
    insUsers,
    account
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

  resourceType = resourceType ? Number(resourceType) : 0
  newInsUsers.map(item => {
    delete item.created
  })

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
    minDay,
    maxDay,
    fullMinDay,
    fullMaxDay,
    isTest,
    checkSsr,
    startInfo,
    skipSecretAccount,
    zoneChoiceStatus,
    zoneBefore,
    zoneTime,
    zoneComment,
    skipNonEnglish,
    hasProfile,
    followingWords,
    minFollowers,
    maxFollowers,
    minFollowing,
    maxFollowing,
    followerStatus,
    skipFollowers,
    skipBussiness,
    skipWebsite,
    skipPhone,
    followOnly,
    skipWaitTime,
    insUsers: newInsUsers,
    resourceType
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

  let {
    account = '',
    res = '',
    checkSsr,
    imgList = [],
    startInfo
  } = data

  data.startInfo.status = data.startInfo.status ? 1 : 0

  return encodeURI(`${JSON.stringify({
    account,
    checkSsr,
    postMsg: res,
    postNum: imgList.length,
    startInfo
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
    checkSsr = 0,
    startInfo,
    rankType = 2,
    minPerson,
    maxPerson,
    minDelay,
    maxDelay,
    minPage = 0,
    maxPage = 7,
    minEnter,
    maxEnter,
    whitelist
  } = data

  whitelist.list = whitelist.list.split(',')
  whitelist.status = whitelist.status ? 1 : 0

  return `"${JSON.stringify({
    account,
    checkSsr,
    startInfo,
    rankType,
    minPerson,
    maxPerson,
    minDelay,
    maxDelay,
    minPage,
    maxPage,
    minEnter,
    maxEnter,
    whitelist
  })}"`
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
  startBrowse
}
