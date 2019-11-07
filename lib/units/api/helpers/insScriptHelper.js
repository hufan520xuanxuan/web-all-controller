const logger = require('../../../util/logger')

const log = logger.createLogger('api:helpers:schedule')
const adb = require('./adbHelper').create()

function startFollow(account, serial, followConfig) {
  log.info(serial, '启动关注脚本')
  let config = JSON.parse(JSON.stringify(followConfig))
  config.account = account
  let json = formatFollowShell(config)
  log.info(`adb shell ${serial}am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsUnFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
  adb.shell(serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsUnFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`).catch(err => {
    log.error(err)
  })
}

function startUnfollow(account, serial, unfollowConfig) {
  log.info(serial, '启动取注脚本')
  let config = JSON.parse(JSON.stringify(unfollowConfig))
  config.account = account
  let json = formatUnfollowShell(config)
  log.info(`adb shell ${serial}am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsUnFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
  adb.shell(serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsUnFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`).catch(err => {
    log.error(err)
  })
}

function stop(serial) {
  log.info(serial, '停止脚本')
  adb.shell(serial, 'am force-stop com.phone.mhzk').catch(err => {
    log.error(err)
  })
}

function formatFollowShell(params = {}) {
  let data = JSON.parse(JSON.stringify(params))

  Object.keys(data).map(key => {
    if (typeof data[key] === 'boolean') {
      data[key] = data[key] ? 1 : 0
    }
  })

  data.startInfo.status = data.startInfo.status ? 1 : 0

  let {
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

  if (!insUsers.length) {
    insUsers = []
  }
  insUsers.map(item => {
    delete item.created
  })
  followingWords.words = followingWords.words.split('\n')
  followingWords.status = followingWords.status ? 1 : 0

  return `"${JSON.stringify({
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
    insUsers,
  })}"`
}

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


module.exports = {
  startFollow,
  stop,
  startUnfollow
}
