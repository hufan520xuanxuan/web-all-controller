const schedule = require('node-schedule')
const moment = require('moment')

const logger = require('../../../util/logger')
let jobs = {}
var log = logger.createLogger('api:helpers:schedule')

const insScript = require('./insScriptHelper')
const insAccountCtrl = require('../controllers/insAccount')
const golbalData = require('./golbalDataHelper')

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
      excute: followExcute = {}
    } = follow

    let {
      weekday: unfollowWeekday = [],
      status: unfollowStatus = 0,
      excute: unfollowExcute = {}
    } = unfollow

    let {
      weekday: thumbWeekday = [],
      status: thumbStatus = 0,
      excute: thumbExcute = {}
    } = thumb

    let {
      weekday: commentWeekday = [],
      status: commentStatus = 0,
      excute: commentExcute = {}
    } = comment

    let {
      weekday: messageWeekday = [],
      status: messageStatus = 0,
      excute: messageExcute = {}
    } = message

    let {
      postList = [],
      randomPost = {},
      status: postStatus = 0
    } = post

    let {
      weekday: browseWeekday = [],
      status: browseStatus = 0,
      excute: browseExcute = {}
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
    if (followStatus && followExcute.start && followExcute.end && serial) {
      let {start = '', end = ''} = followExcute
      // insScript.checkStartScript(insAccount, account.serial, account.config, 1)
      job.follow = createInsJob(start, end, followWeekday, (time) => {
        log.info('start follow', account, time)
        insScript.stop(account.serial)
        insScript.startFollow(insAccount, account.serial, account.config.follow)
        // let json = JSON.stringify(account.config.follow).replace(RegExp(':', 'g'), '\:').replace(RegExp(',', 'g'), '\,')
        // let config = JSON.parse(JSON.stringify(account.config.follow))
        // config.account = insAccount
        // let json = formatFollowShell(config)
        // insScript.startFollow(account.serial, json)
        // console.log(`adb shell ${account.serial}am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`)
        // adb.shell(account.serial, `am instrument -w -r -e json ${json} -e debug false -e class 'com.phone.mhzk.function.instagram.InsFollow' com.phone.mhzk.test/androidx.test.runner.AndroidJUnitRunner`).catch(err => {
        //   log.error(err)
        // })
      }, (time) => {
        log.info('end follow', account, time)
        insScript.stop(account.serial)
        // adb.shell(account.serial, 'am force-stop com.phone.mhzk').catch(err => {
        //   log.error(err)
        // })
      })
    }

    // 取消关注的定时器
    if (unfollowStatus && unfollowExcute.start && unfollowExcute.end && serial) {
      let {start = '', end = ''} = unfollowExcute
      // insScript.checkStartScript(insAccount, account.serial, account.config, 2)
      job.unfollow = createInsJob(start, end, unfollowWeekday, (time) => {
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
        insScript.stop(account.serial)
        // adb.shell(account.serial, 'am force-stop com.phone.mhzk').catch(err => {
        //   log.error(err)
        // })
      })
    }

    // 点赞的定时器
    if (thumbStatus && thumbExcute.start && thumbExcute.end && serial) {
      // insScript.checkStartScript(insAccount, account.serial, account.config, 3)
      let {start = '', end = ''} = thumbExcute
      job.thumb = createInsJob(start, end, thumbWeekday, (time) => {
        log.info('start thumb', account, time)
        insScript.stop(account.serial)
        insScript.startThumb(insAccount, account.serial, account.config.thumb)
      }, (time) => {
        log.info('end thumb', account, time)
        insScript.stop(account.serial)
      })
    }

    // 评论的定时器
    if (commentStatus && commentExcute.start && commentExcute.end && serial) {
      let {start = '', end = ''} = commentExcute
      // insScript.checkStartScript(insAccount, account.serial, account.config, 4)
      job.comment = createInsJob(start, end, commentWeekday, (time) => {
        log.info('start comment', account, time)
        insScript.stop(account.serial)
        insScript.startComment(insAccount, account.serial, account.config.comment)
      }, (time) => {
        log.info('end comment', account, time)
        insScript.stop(account.serial)
      })
    }

    // 私信的定时器
    if (messageStatus && messageExcute.start && messageExcute.end && serial) {
      let {start = '', end = ''} = messageExcute
      // insScript.checkStartScript(insAccount, account.serial, account.config, 5)
      job.message = createInsJob(start, end, messageWeekday, (time) => {
        log.info('start message', account, time)
        insScript.stop(account.serial)
        insScript.startMessage(insAccount, account.serial, account.config.message)
      }, (time) => {
        log.info('end message', account, time)
        insScript.stop(account.serial)
      })
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
    if (browseStatus && browseExcute.start && browseExcute.end && serial) {
      let {start = '', end = ''} = browseExcute
      // insScript.checkStartScript(insAccount, account.serial, account.config, 7)
      job.browse = createInsJob(start, end, browseWeekday, (time) => {
        log.info('start browse', account, time)
        insScript.stop(account.serial)
        insScript.startBrowse(insAccount, account.serial, account.config.browse)
      }, (time) => {
        log.info('end browse', account, time)
        insScript.stop(account.serial)
      })
    }

    jobs[account.account] = job
  })

  // 每天12.00的定时任务
  schedule.scheduleJob('0 0 0 * * *', () => {
    dbapi.getAllInsAccount().then(cursor => {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(list => {
          list.map(account => {
            let {config = {}, account: insAccount} = account
            insAccountCtrl.updateInsAccountMinDayAndMaxDay(insAccount, config)
          })
        })
    })

    // 12点清空数据
    golbalData.clear()
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
  let {follow = {}, unfollow = {}, thumb = {}, comment = {}, message = {}, post = {}, browse = {}} = config

  console.log('------->', browse.startInfo)
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

  let {
    weekday: thumbWeekday = [],
    status: thumbStatus = 0,
    excute: thumbExcute = {}
  } = thumb

  let {
    weekday: commentWeekday = [],
    status: commentStatus = 0,
    excute: commentExcute = {}
  } = comment

  let {
    weekday: messageWeekday = [],
    status: messageStatus = 0,
    excute: messageExcute = {}
  } = message

  let {
    postList = [],
    randomPost = {},
    status: postStatus = 0
  } = post

  let {
    weekday: browseWeekday = [],
    status: browseStatus = 0,
    excute: browseExcute = {}
  } = browse

  if (jobs[account.account]) {
    // 关注
    jobs[account.account].follow && jobs[account.account].follow.start && jobs[account.account].follow.start.cancel()
    jobs[account.account].follow && jobs[account.account].follow.end && jobs[account.account].follow.end.cancel()
    // 取关
    jobs[account.account].unfollow && jobs[account.account].unfollow.start && jobs[account.account].unfollow.start.cancel()
    jobs[account.account].unfollow && jobs[account.account].unfollow.end && jobs[account.account].unfollow.end.cancel()
    // 点赞
    jobs[account.account].thumb && jobs[account.account].thumb.start && jobs[account.account].thumb.start.cancel()
    jobs[account.account].thumb && jobs[account.account].thumb.end && jobs[account.account].thumb.end.cancel()
    // 评论
    jobs[account.account].comment && jobs[account.account].comment.start && jobs[account.account].comment.start.cancel()
    jobs[account.account].comment && jobs[account.account].comment.end && jobs[account.account].comment.end.cancel()
    // 私信
    jobs[account.account].message && jobs[account.account].message.start && jobs[account.account].message.start.cancel()
    jobs[account.account].message && jobs[account.account].message.end && jobs[account.account].message.end.cancel()
    // 热身
    jobs[account.account].browse && jobs[account.account].browse.start && jobs[account.account].browse.start.cancel()
    jobs[account.account].browse && jobs[account.account].browse.end && jobs[account.account].browse.end.cancel()

    // 发帖
    if (jobs[account.account].post) {
      jobs[account.account].post.postList.map(job => {
        job.cancel()
      })
    }
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
      insScript.stop(account.serial)
      insScript.startFollow(insAccount, account.serial, account.config.follow)
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
  }
  else {
    insScript.stop(account.serial)
  }

  // 取消关注的定时器
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
  }
  else {
    insScript.stop(account.serial)
  }

  // 点赞的定时器
  if (thumbStatus && thumbExcute.start && thumbExcute.end && serial) {
    let {start = '', end = ''} = thumbExcute
    job.thumb = createInsJob(start, end, thumbWeekday, (time) => {
      log.info('updateInsJob start', account, time)
      insScript.stop(account.serial)
      insScript.startThumb(insAccount, account.serial, account.config.thumb)
    }, (time) => {
      log.info('updateInsJob end', account, time)
      insScript.stop(account.serial)
    })
  }
  else {
    insScript.stop(account.serial)
  }

  // 评论的定时器
  if (commentStatus && commentExcute.start && commentExcute.end && serial) {
    let {start = '', end = ''} = commentExcute
    job.comment = createInsJob(start, end, commentWeekday, (time) => {
      log.info('start comment', account, time)
      insScript.stop(account.serial)
      insScript.startComment(insAccount, account.serial, account.config.comment)
    }, (time) => {
      log.info('end comment', account, time)
      insScript.stop(account.serial)
    })
  }
  else {
    insScript.stop(account.serial)
  }

  // 私信的定时器
  if (messageStatus && messageExcute.start && messageExcute.end && serial) {
    let {start = '', end = ''} = messageExcute
    job.message = createInsJob(start, end, messageWeekday, (time) => {
      log.info('start message', account, time)
      insScript.stop(account.serial)
      insScript.startMessage(insAccount, account.serial, account.config.message)
    }, (time) => {
      log.info('end message', account, time)
      insScript.stop(account.serial)
    })
  }
  else {
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
  if (browseStatus && browseExcute.start && browseExcute.end && serial) {

    let {start = '', end = ''} = browseExcute
    job.browse = createInsJob(start, end, browseWeekday, (time) => {
      log.info('updateInsJob browseStatus start', account, time)
      insScript.stop(account.serial)
      insScript.startBrowse(insAccount, account.serial, account.config.browse)
    }, (time) => {
      log.info('updateInsJob browseStatus end', account, time)
      insScript.stop(account.serial)
    })
  }
  else {
    insScript.stop(account.serial)
  }

  jobs[account.account] = job
}

module.exports = {
  initInsShedule,
  updateInsJob
}
