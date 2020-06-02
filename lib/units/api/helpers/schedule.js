const schedule = require('node-schedule')
const moment = require('moment')
const Promise = require('bluebird')

const logger = require('../../../util/logger')
let jobs = {}
var log = logger.createLogger('api:helpers:schedule')
let insAccountCtrl = require('../controllers/insAccount')
const insScript = require('./insScriptHelper')
const golbalData = require('./golbalDataHelper')
const dbapi = require('../../../db/api')
const _isEmpty = require('lodash/isEmpty')

let initInsSheduleStatus = false

/**
 * 初始化调度任务
 * @param accountlist
 */
function initInsShedule(accountlist = []) {
  if (initInsSheduleStatus) return
  initInsSheduleStatus = true
  accountlist.map(account => {
    let {config = {}, serial, account: insAccount} = account
    let {
      follow = {}, unfollow = {}, thumb = {}, comment = {}, message = {}, post = {},
      browse = {}
    } = config
    let {
      weekday: followWeekday = [],
      status: followStatus = 0,
      excute: followExcute = {},
    } = follow

    let {
      weekday: unfollowWeekday = [],
      status: unfollowStatus = 0,
      excute: unfollowExcute = {}
    } = unfollow

    let {
      weekday: thumbWeekday = [],
      status: thumbStatus = 0,
      excute: thumbExcute = {},
    } = thumb

    let {
      weekday: commentWeekday = [],
      status: commentStatus = 0,
      excute: commentExcute = {},
    } = comment

    let {
      weekday: messageWeekday = [],
      status: messageStatus = 0,
      excute: messageExcute = {},
    } = message

    let {
      postList = [],
      randomPost = {},
      status: postStatus = 0
    } = post

    let {
      weekday: browseWeekday = [],
      status: browseStatus = 0,
      excute: browseExcute = {},
    } = browse

    let job = {
      follow: {
        start: null,
        end: null
      },
      unfollow: {
        start: null,
        end: null
      },
      thumb: {
        start: null,
        end: null
      },
      comment: {
        start: null,
        end: null
      },
      message: {
        start: null,
        end: null
      },
      post: {
        postList: [],
        randomPost: null
      },
      browse: {
        start: null,
        end: null
      }
    }

    // 关注的定时器
    if (followStatus && (followExcute.start && followExcute.end) && serial) {
      let {start = '', end = ''} = followExcute
      if (start && end) job.follow = createFollowJob(start, end, followWeekday, insAccount, account)
    }

    // 取消关注的定时器
    if (unfollowStatus && (unfollowExcute.start && unfollowExcute.end) && serial) {
      let {start = '', end = ''} = unfollowExcute
      if (start && end) job.unfollow = createUnfollowJob(start, end, unfollowWeekday, insAccount, account)
    }

    // 点赞的定时器
    if (thumbStatus && (thumbExcute.start && thumbExcute.end) && serial) {
      let {start = '', end = ''} = thumbExcute
      if (start && end) job.thumb = createThumbJob(start, end, thumbWeekday, insAccount, account)
    }

    // 评论的定时器
    if (commentStatus && (commentExcute.start && commentExcute.end) && serial) {
      let {start = '', end = ''} = commentExcute
      if (start && end) job.comment = createCommentJob(start, end, commentWeekday, insAccount, account)
    }

    // 私信的定时器
    if (messageStatus && (messageExcute.start && messageExcute.end) && serial) {
      let {start = '', end = ''} = messageExcute
      if (start && end) job.message = createMessageJob(start, end, messageWeekday, insAccount, account)
    }

    // 发帖定时任务
    if (postStatus && serial) {
      postList.map(item => {
        // 判断帖子是否有效
        if (Number(moment(item.postTime)) > Date.now() && item.imgList.length) {
          job.post.postList.push(createPostJob(item.postTime, () => {
            insScript.startPost(account, serial, item)
          }))
        }
      })
      if (randomPost.postTime && Number(moment(randomPost.postTime)) > Date.now() && randomPost.imgList.length) {
        job.post.randomPost = createPostJob(randomPost.postTime, () => {
          insScript.startPost(account.account, serial, randomPost)
        })
      }
    }

    // 热身模式的定时器
    if (browseStatus && (browseExcute.start && browseExcute.end) && serial) {
      let {start = '', end = ''} = browseExcute
      if (start && end) job.browse = createBrowseJob(start, end, browseWeekday, insAccount, account)
    }

    jobs[account.account] = job
  })

  // 每天12.00的定时任务
  schedule.scheduleJob('0 0 0 * * *', () => {
    dbapi.getAllInsAccount().then(cursor => {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(list => {
          list.map(account => {
            let {config = {}, account: insAccount, serial} = account
            checkInsAccountCtrl()
            insAccountCtrl.updateInsAccountMinDayAndMaxDay(insAccount, config)
            // if (serial) {
            //   insScript.checkStatistics(insAccount, serial)
            // }
          })
        })
    })

    // 12点清空数据
    golbalData.clear()
  })
}

/**
 * 检查InsAccountCtrl
 */
function checkInsAccountCtrl() {
  if (_isEmpty(insAccountCtrl)) {
    insAccountCtrl = require('../controllers/insAccount')
  }
}

// 创建关注任务
function createFollowJob(start, end, followWeekday, insAccount, account) {
  console.log('创建关注脚本', start, end, followWeekday)
  return createInsJob(start, end, followWeekday, (time) => {
    log.info('start follow', account, time)
    insScript.stop(account.serial)
    insScript.startFollow(insAccount, account.serial, account.config.follow)
  }, (time) => {
    log.info('end follow', account, time)
    checkInsAccountCtrl()
    insAccountCtrl.saveLog({
      type: 1,
      serial: account.serial,
      msg: 'InsFollow>>>功能正常执行完成',
      record: 0,
      status: 3,
      account: account.account
    })
    insScript.stop(account.serial)
  })
}

/**
 * 创建取关任务
 * @param start
 * @param end
 * @returns {{start: *, end: *}}
 */
function createUnfollowJob(start, end, unfollowWeekday, insAccount, account) {
  console.log('创建取注脚本', start, end, unfollowWeekday)
  return createInsJob(start, end, unfollowWeekday, (time) => {
    log.info('start unfollow', account, time)
    // let config = JSON.parse(JSON.stringify(account.config.unfollow))
    // config.account = insAccount
    // let json = formatUnfollowShell(config)
    insScript.stop(account.serial)
    insScript.startUnfollow(insAccount, account.serial, account.config.unfollow)
    // console.log(`adb shell ${account.serial}am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsUnFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
    // adb.shell(account.serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsUnFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`).catch(err => {
    //   log.error(err)
    // })
  }, (time) => {
    log.info('end unfollow', account, time)
    checkInsAccountCtrl()
    insAccountCtrl.saveLog({
      type: 2,
      serial: account.serial,
      msg: 'InsUnFollow>>>功能正常执行完成',
      record: 0,
      status: 3,
      account: account.account
    })
    insScript.stop(account.serial)
    // adb.shell(account.serial, 'am force-stop com.phone.mhzk').catch(err => {
    //   log.error(err)
    // })
  })
}

/**
 * 创建点赞脚本
 * @param start
 * @param end
 * @param thumbWeekday
 * @param insAccount
 * @param account
 * @returns {{start: *, end: *}}
 */
function createThumbJob(start, end, thumbWeekday, insAccount, account) {
  console.log('创建点赞脚本', start, end, thumbWeekday)
  return createInsJob(start, end, thumbWeekday, (time) => {
    log.info('start thumb', account, time)
    insScript.stop(account.serial)
    insScript.startThumb(insAccount, account.serial, account.config.thumb)
  }, (time) => {
    log.info('end thumb', account, time)
    checkInsAccountCtrl()
    insAccountCtrl.saveLog({
      type: 3,
      serial: account.serial,
      msg: 'InsThumb>>>功能正常执行完成',
      record: 0,
      status: 3,
      account: account.account
    })
    insScript.stop(account.serial)
  })
}

/**
 * 创建评论脚本
 * @param start
 * @param end
 * @param commentWeekday
 * @param insAccount
 * @param account
 * @returns {{start: *, end: *}}
 */
function createCommentJob(start, end, commentWeekday, insAccount, account) {
  console.log('创建评论脚本', start, end, commentWeekday)
  return createInsJob(start, end, commentWeekday, (time) => {
    log.info('start comment', account, time)
    insScript.stop(account.serial)
    insScript.startComment(insAccount, account.serial, account.config.comment)
  }, (time) => {
    log.info('end comment', account, time)
    checkInsAccountCtrl()
    insAccountCtrl.saveLog({
      type: 4,
      serial: account.serial,
      msg: 'InsComment>>>功能正常执行完成',
      record: 0,
      status: 3,
      account: account.account
    })
    insScript.stop(account.serial)
  })
}

/**
 * 创建私信脚本
 * @param start
 * @param end
 * @param messageWeekday
 * @param insAccount
 * @param account
 * @returns {{start: *, end: *}}
 */
function createMessageJob(start, end, messageWeekday, insAccount, account) {
  console.log('创建私信脚本', start, end, messageWeekday)
  return createInsJob(start, end, messageWeekday, (time) => {
    log.info('start message', account, time)
    insScript.stop(account.serial)
    insScript.startMessage(insAccount, account.serial, account.config.message)
  }, (time) => {
    log.info('end message', account, time)
    checkInsAccountCtrl()
    insAccountCtrl.saveLog({
      type: 5,
      serial: account.serial,
      msg: 'InsMessage>>>功能正常执行完成',
      record: 0,
      status: 3,
      account: account.account
    })
    insScript.stop(account.serial)
  })
}

/**
 * 创建热身脚本
 * @param start
 * @param end
 * @param browseWeekday
 * @param insAccount
 * @param account
 * @returns {{start: *, end: *}}
 */
function createBrowseJob(start, end, browseWeekday, insAccount, account) {
  console.log('创建热身脚本', start, end, browseWeekday)
  return createInsJob(start, end, browseWeekday, (time) => {
    log.info('start browse', account, time)
    insScript.stop(account.serial)
    insScript.startBrowse(insAccount, account.serial, account.config.browse)
  }, (time) => {
    log.info('end browse', account, time)
    checkInsAccountCtrl()
    insAccountCtrl.saveLog({
      type: 6,
      serial: account.serial,
      msg: 'InsBrowse>>>功能正常执行完成',
      record: 0,
      status: 3,
      account: account.account
    })
    insScript.stop(account.serial)
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

/**
 * 创建发帖任务
 * @param postTime
 * @param callback
 * @returns {*|*}
 */
function createPostJob(postTime, callback) {
  let momentTime = moment(postTime)
  let month = momentTime.month() + 1
  let day = momentTime.date()
  let hour = momentTime.hour()
  let minute = momentTime.minute()
  let second = momentTime.second()
  let week = momentTime.day()
  log.info('创建发帖任务，发帖时间', momentTime.format('YYYY-MM-DD HH:mm:ss'))
  let postJob = schedule.scheduleJob(`${second} ${minute} ${hour} ${day} ${month} ${week}`, callback)
  return postJob
}

function createJob(second, minute, hour, day, month, week, callback) {
  return schedule.scheduleJob(`${second} ${minute} ${hour} ${day} ${month} ${week}`, callback)
}

function updateInsJob(account = {}) {
  let {config = {}, serial, account: insAccount} = account
  let {follow = {}, unfollow = {}, thumb = {}, comment = {}, message = {}, post = {}, browse = {}, statistics = {}} = config

  let {
    weekday: followWeekday = [],
    status: followStatus = 0,
    excute: followExcute = {},
  } = follow

  let {
    weekday: unfollowWeekday = [],
    status: unfollowStatus = 0,
    excute: unfollowExcute = {}
  } = unfollow

  let {
    weekday: thumbWeekday = [],
    status: thumbStatus = 0,
    excute: thumbExcute = {},
  } = thumb

  let {
    weekday: commentWeekday = [],
    status: commentStatus = 0,
    excute: commentExcute = {},
  } = comment

  let {
    weekday: messageWeekday = [],
    status: messageStatus = 0,
    excute: messageExcute = {},
  } = message

  let {
    postList = [],
    randomPost = {},
    status: postStatus = 0
  } = post

  let {
    weekday: browseWeekday = [],
    status: browseStatus = 0,
    excute: browseExcute = {},
  } = browse

  let {
    weekday: statisticsWeekday = [],
    excute: statisticsExcute = {}
  } = statistics

  if (jobs[account.account]) {
    // 关注
    jobs[account.account].follow && jobs[account.account].follow.start && jobs[account.account].follow.start.cancel() && (jobs[account.account].follow.start = null)
    jobs[account.account].follow && jobs[account.account].follow.end && jobs[account.account].follow.end.cancel() && (jobs[account.account].follow.end = null)
    jobs[account.account].follow2 && jobs[account.account].follow2.start && jobs[account.account].follow2.start.cancel() && (jobs[account.account].follow2.start = null)
    jobs[account.account].follow2 && jobs[account.account].follow2.end && jobs[account.account].follow2.end.cancel() && (jobs[account.account].follow2.end = null)
    jobs[account.account].follow3 && jobs[account.account].follow3.start && jobs[account.account].follow3.start.cancel() && (jobs[account.account].follow3.start = null)
    jobs[account.account].follow3 && jobs[account.account].follow3.end && jobs[account.account].follow3.end.cancel() && (jobs[account.account].follow3.end = null)
    // 取关
    jobs[account.account].unfollow && jobs[account.account].unfollow.start && jobs[account.account].unfollow.start.cancel() && (jobs[account.account].unfollow.start = null)
    jobs[account.account].unfollow && jobs[account.account].unfollow.end && jobs[account.account].unfollow.end.cancel() && (jobs[account.account].unfollow.end = null)
    jobs[account.account].unfollow2 && jobs[account.account].unfollow2.start && jobs[account.account].unfollow2.start.cancel() && (jobs[account.account].unfollow2.start = null)
    jobs[account.account].unfollow2 && jobs[account.account].unfollow2.end && jobs[account.account].unfollow2.end.cancel() && (jobs[account.account].unfollow2.end = null)
    jobs[account.account].unfollow3 && jobs[account.account].unfollow3.start && jobs[account.account].unfollow3.start.cancel() && (jobs[account.account].unfollow3.start = null)
    jobs[account.account].unfollow3 && jobs[account.account].unfollow3.end && jobs[account.account].unfollow3.end.cancel() && (jobs[account.account].unfollow3.end = null)
    // 点赞
    jobs[account.account].thumb && jobs[account.account].thumb.start && jobs[account.account].thumb.start.cancel() && (jobs[account.account].thumb.start = null)
    jobs[account.account].thumb && jobs[account.account].thumb.end && jobs[account.account].thumb.end.cancel() && (jobs[account.account].thumb.end = null)
    jobs[account.account].thumb2 && jobs[account.account].thumb2.start && jobs[account.account].thumb2.start.cancel() && (jobs[account.account].thumb2.start = null)
    jobs[account.account].thumb2 && jobs[account.account].thumb2.end && jobs[account.account].thumb2.end.cancel() && (jobs[account.account].thumb2.end = null)
    jobs[account.account].thumb3 && jobs[account.account].thumb3.start && jobs[account.account].thumb3.start.cancel() && (jobs[account.account].thumb3.start = null)
    jobs[account.account].thumb3 && jobs[account.account].thumb3.end && jobs[account.account].thumb3.end.cancel() && (jobs[account.account].thumb3.end = null)
    // 评论
    jobs[account.account].comment && jobs[account.account].comment.start && jobs[account.account].comment.start.cancel() && (jobs[account.account].comment.start = null)
    jobs[account.account].comment && jobs[account.account].comment.end && jobs[account.account].comment.end.cancel() && (jobs[account.account].comment.end = null)
    jobs[account.account].comment2 && jobs[account.account].comment2.start && jobs[account.account].comment2.start.cancel() && (jobs[account.account].comment2.start = null)
    jobs[account.account].comment2 && jobs[account.account].comment2.end && jobs[account.account].comment2.end.cancel() && (jobs[account.account].comment2.end = null)
    jobs[account.account].comment3 && jobs[account.account].comment3.start && jobs[account.account].comment3.start.cancel() && (jobs[account.account].comment3.start = null)
    jobs[account.account].comment3 && jobs[account.account].comment3.end && jobs[account.account].comment3.end.cancel() && (jobs[account.account].comment3.end = null)
    // 私信
    jobs[account.account].message && jobs[account.account].message.start && jobs[account.account].message.start.cancel() && (jobs[account.account].message.start = null)
    jobs[account.account].message && jobs[account.account].message.end && jobs[account.account].message.end.cancel() && (jobs[account.account].message.end = null)
    jobs[account.account].message2 && jobs[account.account].message2.start && jobs[account.account].message2.start.cancel() && (jobs[account.account].message2.start = null)
    jobs[account.account].message2 && jobs[account.account].message2.end && jobs[account.account].message2.end.cancel() && (jobs[account.account].message2.end = null)
    jobs[account.account].message3 && jobs[account.account].message3.start && jobs[account.account].message3.start.cancel() && (jobs[account.account].message3.start = null)
    jobs[account.account].message3 && jobs[account.account].message3.end && jobs[account.account].message3.end.cancel() && (jobs[account.account].message3.end = null)
    // 热身
    jobs[account.account].browse && jobs[account.account].browse.start && jobs[account.account].browse.start.cancel() && (jobs[account.account].browse.start = null)
    jobs[account.account].browse && jobs[account.account].browse.end && jobs[account.account].browse.end.cancel() && (jobs[account.account].browse.end = null)
    jobs[account.account].browse2 && jobs[account.account].browse2.start && jobs[account.account].browse2.start.cancel() && (jobs[account.account].browse2.start = null)
    jobs[account.account].browse2 && jobs[account.account].browse2.end && jobs[account.account].browse2.end.cancel() && (jobs[account.account].browse2.end = null)
    jobs[account.account].browse3 && jobs[account.account].browse3.start && jobs[account.account].browse3.start.cancel() && (jobs[account.account].browse3.start = null)
    jobs[account.account].browse3 && jobs[account.account].browse3.end && jobs[account.account].browse3.end.cancel() && (jobs[account.account].browse3.end = null)

    // 发帖
    if (jobs[account.account].post) {
      jobs[account.account].post.postList.map(job => {
        job.cancel()
      })
    }

    // 统计
    jobs[account.account].statistics && jobs[account.account].statistics.start && jobs[account.account].statistics.start.cancel() && (jobs[account.account].statistics.start = null)
    jobs[account.account].statistics && jobs[account.account].statistics.end && jobs[account.account].statistics.end.cancel() && (jobs[account.account].statistics.end = null)
  }

  if (!serial) {
    log.info(`设备已与${account.account}账号解除关联，取消定时任务`)
    return
  }

  let job = {}

  // 关注的定时器
  if (followStatus && (followExcute.start && followExcute.end) && serial) {
    let {start = '', end = ''} = followExcute
    if (start && end) job.follow = createFollowJob(start, end, followWeekday, insAccount, account)
  } else {
    insScript.stop(account.serial)
  }

  // 取消关注的定时器
  if (unfollowStatus && ((unfollowExcute.start && unfollowExcute.end) && serial)) {
    let {start = '', end = ''} = unfollowExcute
    if (start && end) job.unfollow = createUnfollowJob(start, end, unfollowWeekday, insAccount, account)
  } else {
    insScript.stop(account.serial)
  }

  // 点赞的定时器
  if (thumbStatus && (thumbExcute.start && thumbExcute.end) && serial) {
    let {start = '', end = ''} = thumbExcute
    if (start && end) job.thumb = createThumbJob(start, end, thumbWeekday, insAccount, account)
  } else {
    insScript.stop(account.serial)
  }

  // 评论的定时器
  if (commentStatus && (commentExcute.start && commentExcute.end) && serial) {
    let {start = '', end = ''} = commentExcute
    if (start && end) job.comment = createCommentJob(start, end, commentWeekday, insAccount, account)
  } else {
    insScript.stop(account.serial)
  }

  // 私信的定时器
  if (messageStatus && (messageExcute.start && messageExcute.end) && serial) {
    let {start = '', end = ''} = messageExcute
    if (start && end) job.message = createMessageJob(start, end, messageWeekday, insAccount, account)
  } else {
    insScript.stop(account.serial)
  }

  // 发帖定时任务
  if (postStatus && serial) {
    if (!job.post) {
      job.post = {
        postList: [],
        randomPost: null
      }
    }
    postList.map(item => {
      // 判断帖子是否有效
      if (Number(moment(item.postTime)) > Date.now() && item.imgList.length) {
        job.post.postList.push(createPostJob(item.postTime, () => {
          insScript.startPost(account.account, serial, item)
        }))
      }
    })
    if (randomPost.postTime && Number(moment(randomPost.postTime)) > Date.now() && randomPost.imgList.length) {
      job.post.randomPost = createPostJob(randomPost.postTime, () => {
        insScript.startPost(account.account, serial, randomPost)
      })
    }
  }

  // 热身模式的定时器
  if (browseStatus && (browseExcute.start && browseExcute.end) && serial) {
    let {start = '', end = ''} = browseExcute
    if (start && end) job.browse = createBrowseJob(start, end, browseWeekday, insAccount, account)
  } else {
    insScript.stop(account.serial)
  }

  // 统计的定时器
  if (statisticsExcute.start && statisticsExcute.end && serial) {
    let {start = '', end = ''} = statisticsExcute
    console.log('统计脚本定时器已开启，开启时间', start, end, statisticsWeekday)
    job.follow = createInsJob(start, end, statisticsWeekday, (time) => {
      log.info('updateInsJob start', account, time)
      // let adb = getAdb()
      // console.log(adb.shell)
      // formatAdbShell(account.config.follow)
      // let json = JSON.stringify(account.config.follow).replace(RegExp(':', 'g'), '/:').replace(RegExp(',', 'g'), '/,')
      insScript.stop(account.serial)
      insScript.checkStatistics(insAccount, account.serial)
      // let config = JSON.parse(JSON.stringify(account.config.follow))
      // config.account = insAccount
      // let json = formatFollowShell(config)
      // insScript.startFollow(account.serial, json)
      // console.log(`${account.serial} am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
      // adb.shell(account.serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`).catch(err => {
      //   log.error(err)
      // })
    }, (time) => {
      log.info('updateInsJob end', account, time)
      insScript.stop(account.serial)
      // adb.shell(account.serial, 'am force-stop com.phone.mhzk').catch(err => {
      //   log.error(err)
      // })
    })
  } else {
    insScript.stop(account.serial)
  }

  // 取消统计的定时器
  if (unfollowStatus && unfollowExcute.start && unfollowExcute.end && serial) {
    let {start = '', end = ''} = unfollowExcute
    job.unfollow = createInsJob(start, end, unfollowWeekday, (time) => {
      log.info('updateInsJob unfollowStatus start', account, time)
      insScript.stop(account.serial)
      insScript.startUnfollow(insAccount, account.serial, account.config.unfollow)
      // let config = JSON.parse(JSON.stringify(account.config.unfollow))
      // config.account = insAccount
      // let json = formatUnfollowShell(config)
      // insScript.startUnfollow(account.serial, json)
      // console.log(`adb shell ${account.serial}am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsUnFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
      // adb.shell(account.serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsUnFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`).catch(err => {
      //   log.error(err)
      // })
    }, (time) => {
      log.info('updateInsJob unfollowStatus end', account, time)
      insScript.stop(account.serial)
      // adb.shell(account.serial, 'am force-stop com.phone.mhzk').catch(err => {
      //   log.error(err)
      // })
    })
  } else {
    insScript.stop(account.serial)
  }

  jobs[account.account] = job
}

module.exports = {
  initInsShedule,
  updateInsJob
}
