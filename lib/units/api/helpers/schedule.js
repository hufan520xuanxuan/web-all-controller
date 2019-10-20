const schedule = require('node-schedule')
const adbkit = require('adbkit')

const logger = require('../../../util/logger')
let jobs = {}
var log = logger.createLogger('api:helpers:schedule')
let adb

/**
 * 初始化调度任务
 * @param accountlist
 */
function initInsShedule(accountlist = []) {
  adb = adbkit.createClient({
    host: '127.0.0.1'
    , port: '5037'
  })
  adb.Keycode = adbkit.Keycode

  accountlist.map(account => {
    let {config = {}, serial} = account
    let {follow = {}, unfollow = {}} = config
    let {
      weekday: followWeekday = [],
      status: followStatus = 0,
      excute: followExcute = {}
    } = follow

    let {
      weekday: unfollowWeekday = [],
      status: unfollowStatus = 0,
      excute: unfollowExcute = {}
    } = unfollow

    let job = {
      follow: {
        start: null,
        end: null
      },
      unfollow: {
        start: null,
        end: null
      },
    }

    // 关注的定时器
    if (followStatus && followExcute.start && followExcute.end && serial) {
      let {start = '', end = ''} = followExcute
      job.follow = createInsJob(start, end, followWeekday, (time) => {
        log.info('start follow', account, time)
        // let json = JSON.stringify(account.config.follow).replace(RegExp(':', 'g'), '\:').replace(RegExp(',', 'g'), '\,')
        let json = formatAdbShell(account.config.follow)
        console.log(`adb shell ${account.serial}am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
        adb.shell(account.serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
      }, (time) => {
        log.info('end follow', account, time)
        adb.shell(account.serial, 'am force-stop com.phone.mhzk')
      })
    }

    // 取消关注的定时器
    if (unfollowStatus && unfollowExcute.start && unfollowExcute.end && serial) {
      let {start = '', end = ''} = unfollowExcute
      job.unfollow = createInsJob(start, end, unfollowWeekday, (time) => {
        log.info('start unfollow', account, time)
      }, (time) => {
        log.info('end unfollow', account, time)
        adb.shell(account.serial, 'am force-stop com.phone.mhzk')
      })
    }
    jobs[account.account] = job
  })
}

function formatAdbShell(params = {}) {
  let data = JSON.parse(JSON.stringify(params))

  Object.keys(data).map(key => {
    if (typeof data[key] === 'boolean') {
      data[key] = data[key] ? 1 : 0
    }
  })

  let {
    minWait = 0,
    maxWait = 0,
    minPerson,
    maxPerson,
    minDelay = 0,
    maxDelay = 0,
    minDay = 0,
    maxDay = 0,
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
  } = data

  insUsers.users = insUsers.users.split('\n')
  followingWords.words = followingWords.words.split('\n')


  return `"${JSON.stringify({
    minWait,
    maxWait,
    minPerson,
    maxPerson,
    minDelay,
    maxDelay,
    minDay,
    maxDay,
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
  }).replace(RegExp(':', 'g'), '\\:').replace(RegExp(',', 'g'), '\\,')}"`
}

/**
 * 创建调度任务
 * @param start
 * @param end
 * @param weekday
 * @param startCallback
 * @param endCallback
 * @returns {{start: *, end: *}}
 */
function createInsJob(start, end, weekday, startCallback, endCallback) {
  let startHours = start.split(':')[0]
  let startMinutes = start.split(':')[1]
  let endHours = end.split(':')[0]
  let endMinutes = end.split(':')[1]
  console.log('启动startJob定时脚本', `0 ${startMinutes} ${startHours} * * ${weekday}`)
  let startJob = schedule.scheduleJob(`0 ${startMinutes} ${startHours} * * ${weekday}`,
    startCallback)
  console.log('启动endJob定时脚本', `0 ${endMinutes} ${endHours} * * ${weekday}`)
  let endJob = schedule.scheduleJob(`0 ${endMinutes} ${endHours} * * ${weekday}`,
    endCallback)

  return {
    start: startJob,
    end: endJob
  }
}

function createJob(second, minute, hour, day, month, week, callback) {
  return schedule.scheduleJob(`${second} ${minute} ${hour} ${day} ${month} ${week}`, callback)
}

function updateInsJob(account = {}) {
  console.log(account)
  let {config = {}, serial} = account
  let {follow = {}, unfollow = {}} = config
  let {
    weekday: followWeekday = [],
    status: followStatus = 0,
    excute: followExcute = {}
  } = follow

  let {
    weekday: unfollowWeekday = [],
    status: unfollowStatus = 0,
    excute: unfollowExcute = {}
  } = unfollow

  if(jobs[account.account]) {
    jobs[account.account].follow && jobs[account.account].follow.start && jobs[account.account].follow.start.cancel()
    jobs[account.account].follow && jobs[account.account].follow.end && jobs[account.account].follow.end.cancel()
    jobs[account.account].unfollow && jobs[account.account].unfollow.start && jobs[account.account].unfollow.start.cancel()
    jobs[account.account].unfollow && jobs[account.account].unfollow.end && jobs[account.account].unfollow.end.cancel()
  }

  let job = {}

  // 关注的定时器
  if (followStatus && followExcute.start && followExcute.end && serial) {
    let {start = '', end = ''} = followExcute
    job.follow = createInsJob(start, end, followWeekday, (time) => {
      log.info('updateInsJob start', account, time)
      // let adb = getAdb()
      // console.log(adb.shell)
      // formatAdbShell(account.config.follow)
      // let json = JSON.stringify(account.config.follow).replace(RegExp(':', 'g'), '/:').replace(RegExp(',', 'g'), '/,')
      let json = formatAdbShell(account.config.follow)
      console.log(`${account.serial} am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
      adb.shell(account.serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
    }, (time) => {
      log.info('updateInsJob end', account, time)
      adb.shell(account.serial, 'am force-stop com.phone.mhzk')
      // let adb = getAdb()
      // console.log(adb.shell)
    })
  }

  // 取消关注的定时器
  if (unfollowStatus && unfollowExcute.start && unfollowExcute.end && serial) {
    let {start = '', end = ''} = unfollowExcute
    job.unfollow = createInsJob(start, end, unfollowWeekday, (time) => {
      log.info('updateInsJob start', account, time)
    }, (time) => {
      log.info('updateInsJob end', account, time)
      adb.shell(account.serial, 'am force-stop com.phone.mhzk')
    })
  }

  jobs[account.account] = job
}

module.exports = {
  initInsShedule,
  updateInsJob
}