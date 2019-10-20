const schedule = require('node-schedule')
const logger = require('../../../util/logger')

let jobs = {}
var log = logger.createLogger('api:helpers:schedule')

/**
 * 初始化调度任务
 * @param accountlist
 */
function initInsShedule(accountlist = []) {
  accountlist.map(account => {
    let {config = {}} = account
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
    if (followStatus && followExcute.start && followExcute.end) {
      let {start = '', end = ''} = followExcute
      job.follow = createInsJob(start, end, followWeekday, (time) => {
        log.info('start follow', account, time)
      }, (time) => {
        log.info('end follow', account, time)
      })
    }

    // 取消关注的定时器
    if (unfollowStatus && unfollowExcute.start && unfollowExcute.end) {
      let {start = '', end = ''} = unfollowExcute
      job.unfollow = createInsJob(start, end, unfollowWeekday, (time) => {
        log.info('start unfollow', account, time)
      }, (time) => {
        log.info('end unfollow', account, time)
      })
    }
    jobs[account.account] = job
  })
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
  let startJob = schedule.scheduleJob(`0 ${startMinutes} ${startHours} * * ${weekday}`,
    startCallback)
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
  let {config = {}} = account
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
  if (followStatus && followExcute.start && followExcute.end) {
    let {start = '', end = ''} = followExcute
    job.follow = createInsJob(start, end, followWeekday, (time) => {
      log.info('updateInsJob start', account, time)
    }, (time) => {
      log.info('updateInsJob end', account, time)
    })
  }

  // 取消关注的定时器
  if (unfollowStatus && unfollowExcute.start && unfollowExcute.end) {
    let {start = '', end = ''} = unfollowExcute
    job.unfollow = createInsJob(start, end, unfollowWeekday, (time) => {
      log.info('updateInsJob start', account, time)
    }, (time) => {
      log.info('updateInsJob end', account, time)
    })
  }

  jobs[account.account] = job
}

module.exports = {
  initInsShedule,
  updateInsJob
}
