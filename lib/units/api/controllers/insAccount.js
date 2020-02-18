var util = require('util')
var moment = require('moment')

var _ = require('lodash')
var Promise = require('bluebird')
var uuid = require('uuid')
var dbapi = require('../../../db/api')
var logger = require('../../../util/logger')
var datautil = require('../../../util/datautil')
var deviceutil = require('../../../util/deviceutil')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var wirerouter = require('../../../wire/router')
const schedule = require('../helpers/schedule')
const insScript = require('../../api/helpers/insScriptHelper')

var log = logger.createLogger('api:controllers:insAccount')

const funcNameList = ['follow', 'unfollow', 'thumb', 'comment', 'message', 'post', 'browse']

function getAllInsAccount(req, res) {
  let {page, limit = 10, search = ''} = req.body

  dbapi.getAllInsAccount(page, limit, search).then(cursor => {
    return Promise.promisify(cursor.toArray, cursor)()
      .then((list) => {
        // console.time('getAllLogsNoJoin')
        // dbapi.getAllLogsNoJoin().then(cursor => {
        //   return Promise.promisify(cursor.toArray, cursor)()
        //     .then((logs) => {
        //       console.timeEnd('getAllLogsNoJoin')
        //       list.map((item) => {
        //         getAccountDataService2(item, logs)
        //       })
        //       return res.json({
        //         success: true,
        //         data: list
        //       })
        //     })
        // })
        let chain = []
        let accountList = list.filter(item => req.user.devices.includes(item.serial) || !item.serial || req.user.admin)
        accountList.map((item) => {
          chain.push(getInsAccountRecord(item))
        })

        Promise.all(chain).then(() => {
          let newAccountList = _.sortBy(accountList,  (o) =>  Number(o.account))
          // accountList.sort((a, b) => b.account - a.account)
          return res.json({
            success: true,
            data: newAccountList.slice((page - 1) * limit, page * limit)
          })
        })
      })
  })
}

function getAccountDataService2(item, logs) {
  let newLogs = logs.filter(i => i.account === item.account && i.status === 1)
  let startTimestamp = Number(moment(moment().format('YYYY-MM-DD')))
  let endTimestamp = startTimestamp + 86400000

  // 关注
  let followLogs = newLogs.filter(item => item.type === 1)
  // eslint-disable-next-line max-len
  let todayFollow = followLogs.filter(item => item.created > startTimestamp && item.created < endTimestamp)

  // 取关
  let unfollowLogs = newLogs.filter(item => item.type === 2)
  // eslint-disable-next-line max-len
  let todayUnfollow = unfollowLogs.filter(item => item.created > startTimestamp && item.created < endTimestamp)

  // 点赞
  let thumbLogs = newLogs.filter(item => item.type === 3)
  // eslint-disable-next-line max-len
  let todayThumb = thumbLogs.filter(item => item.created > startTimestamp && item.created < endTimestamp)

  // 评论
  let commentLogs = newLogs.filter(item => item.type === 4)
  // eslint-disable-next-line max-len
  let todayComment = commentLogs.filter(item => item.created > startTimestamp && item.created < endTimestamp)

  // 私信
  let messageLogs = newLogs.filter(item => item.type === 5)
  // eslint-disable-next-line max-len
  let todayMessage = messageLogs.filter(item => item.created > startTimestamp && item.created < endTimestamp)

  // 发帖
  let postLogs = newLogs.filter(item => item.type === 6)
  // eslint-disable-next-line max-len
  let todayPost = postLogs.filter(item => item.created > startTimestamp && item.created < endTimestamp)

  // 热身
  let browseLogs = logs.filter(item => item.type === 7 && item.status === 1)
  // eslint-disable-next-line max-len
  let todayBrowse = browseLogs.filter(item => item.created > startTimestamp && item.created < endTimestamp)

  item.todayFollow = todayFollow.length
  item.totalFollow = followLogs.length

  item.todayUnfollow = todayUnfollow.length
  item.totalUnfollow = unfollowLogs.length

  item.todayThumb = todayThumb.length
  item.totalThumb = thumbLogs.length

  item.todayComment = todayComment.length
  item.totalComment = commentLogs.length

  item.todayMessage = todayMessage.length
  item.totalMessage = messageLogs.length

  item.todayPost = todayPost.length
  item.totalPost = postLogs.length

  item.todayBrowse = todayBrowse.length
  item.totalBrowse = browseLogs.length

  item.config.follow = {status: item.config.follow.status}
  item.config.unfollow = {status: item.config.unfollow.status}
  item.config.comment = {status: item.config.comment.status}
  item.config.message = {status: item.config.message.status}
  item.config.post = {status: item.config.post.status}
  item.config.thumb = {status: item.config.thumb.status}
}

function getInsAccountRecord(item) {
  return dbapi.getInsAccountRecord(item.account).then(cursor => {
    return Promise.promisify(cursor.toArray, cursor)()
      .then(records => {
        let today = moment().format('YYYY-MM-DD')

        let followRecords = records.filter(item => item.type === 1)
        let todayFollowRecord = followRecords.find(item => item.created === today)

        let unfollowRecords = records.filter(item => item.type === 2)
        let todayUnfollowRecord = unfollowRecords.find(item => item.created === today)

        let thumbRecords = records.filter(item => item.type === 3)
        let todayThumbRecord = thumbRecords.find(item => item.created === today)

        let commentRecords = records.filter(item => item.type === 4)
        let todayCommentRecord = commentRecords.find(item => item.created === today)

        let messageRecords = records.filter(item => item.type === 5)
        let todayMessageRecord = messageRecords.find(item => item.created === today)

        let postRecords = records.filter(item => item.type === 6)
        let todayPostRecord = postRecords.find(item => item.created === today)

        let browseRecords = records.filter(item => item.type === 7)
        let todayBrowseRecord = browseRecords.find(item => item.created === today)

        item.todayFollow = todayFollowRecord ? todayFollowRecord.record : 0
        item.totalFollow = 0
        followRecords.forEach(record => {
          item.totalFollow += record.record
        })

        item.todayUnfollow = todayUnfollowRecord ? todayUnfollowRecord.record : 0
        item.totalUnfollow = 0
        unfollowRecords.forEach(record => {
          item.totalUnfollow += record.record
        })

        item.todayThumb = todayThumbRecord ? todayThumbRecord.record : 0
        item.totalThumb = 0
        thumbRecords.forEach(record => {
          item.totalThumb += record.record
        })

        item.todayComment = todayCommentRecord ? todayCommentRecord.record : 0
        item.totalComment = 0
        commentRecords.forEach(record => {
          item.totalComment += record.record
        })

        item.todayMessage = todayMessageRecord ? todayMessageRecord.record : 0
        item.totalMessage = 0
        messageRecords.forEach(record => {
          item.totalMessage += record.record
        })

        item.todayPost = todayPostRecord ? todayPostRecord.record : 0
        item.totalPost = 0
        postRecords.forEach(record => {
          item.totalPost += record.record
        })

        item.todayBrowse = todayBrowseRecord ? todayBrowseRecord.record : 0
        item.totalBrowse = 0
        browseRecords.forEach(record => {
          item.totalBrowse += record.record
        })

        item.config.follow = {status: item.config.follow.status}
        item.config.unfollow = {status: item.config.unfollow.status}
        item.config.comment = {status: item.config.comment.status}
        item.config.message = {status: item.config.message.status}
        item.config.post = {status: item.config.post.status}
        item.config.thumb = {status: item.config.thumb.status}
        item.config.browse = {status: item.config.browse ? item.config.browse.status : 0}

      })
  })
}

function getAccountDataService(item) {
  return dbapi.getLogsByAccountData(item.account, 2).then(cursor => {
    return Promise.promisify(cursor.toArray, cursor)()
      .then(logs => {
        let startTimestamp = Number(moment(moment().format('YYYY-MM-DD')))
        let endTimestamp = startTimestamp + 86400000

        // 关注
        let followLogs = logs.filter(item => item.type === 1)
        // eslint-disable-next-line max-len
        let todayFollow = followLogs.filter(item => item.created > startTimestamp && item.created < endTimestamp)

        // 取关
        let unfollowLogs = logs.filter(item => item.type === 2)
        // eslint-disable-next-line max-len
        let todayUnfollow = unfollowLogs.filter(item => item.created > startTimestamp && item.created < endTimestamp)

        // 点赞
        let thumbLogs = logs.filter(item => item.type === 3)
        // eslint-disable-next-line max-len
        let todayThumb = thumbLogs.filter(item => item.created > startTimestamp && item.created < endTimestamp)

        // 评论
        let commentLogs = logs.filter(item => item.type === 4)
        // eslint-disable-next-line max-len
        let todayComment = commentLogs.filter(item => item.created > startTimestamp && item.created < endTimestamp)

        // 私信
        let messageLogs = logs.filter(item => item.type === 5)
        // eslint-disable-next-line max-len
        let todayMessage = messageLogs.filter(item => item.created > startTimestamp && item.created < endTimestamp)

        // 发帖
        let postLogs = logs.filter(item => item.type === 6)
        // eslint-disable-next-line max-len
        let todayPost = postLogs.filter(item => item.created > startTimestamp && item.created < endTimestamp)

        // 热身
        let browseLogs = logs.filter(item => item.type === 7)
        // eslint-disable-next-line max-len
        let todayBrowse = browseLogs.filter(item => item.created > startTimestamp && item.created < endTimestamp)

        item.todayFollow = todayFollow.length
        item.totalFollow = followLogs.length

        item.todayUnfollow = todayUnfollow.length
        item.totalUnfollow = unfollowLogs.length

        item.todayThumb = todayThumb.length
        item.totalThumb = thumbLogs.length

        item.todayComment = todayComment.length
        item.totalComment = commentLogs.length

        item.todayMessage = todayMessage.length
        item.totalMessage = messageLogs.length

        item.todayPost = todayPost.length
        item.totalPost = postLogs.length

        item.todayBrowse = todayBrowse.length
        item.totalBrowse = browseLogs.length

        item.config.follow = {status: item.config.follow.status}
        item.config.unfollow = {status: item.config.unfollow.status}
        item.config.comment = {status: item.config.comment.status}
        item.config.message = {status: item.config.message.status}
        item.config.post = {status: item.config.post.status}
        item.config.thumb = {status: item.config.thumb.status}
        item.config.browse = {status: item.config.browse ? item.config.browse.status : 0}

        return logs
      })
  })
}


function saveInsAccount(req, res) {
  let {account = '', copyAccount, copyList = []} = req.body

  function saveAccount(account, config) {
    return dbapi.saveInsAccount(account, config)
      .then(ret => {
        if (ret) {
          return res.json({
            success: true
          })
        }
        else {
          log.error('账号保存失败')
          return res.status(404).json({
            success: false
            , msg: '账号保存失败'
          })
        }
      })
  }

  dbapi.getInsAccountByAccount(account).then(insAccount => {
    if (insAccount) {
      return res.status(404).json({
        success: false
        , msg: '该账号已存在'
      })
    }
    else {
      if (copyAccount) {
        dbapi.getInsAccountByAccount(copyAccount).then(insAccount => {
          let config = {}
          copyList.map(key => {
            config[key] = insAccount.config[key]

            // 不copy配置的insUsers
            if(config[key].insUsers) {
              config[key].insUsers = {
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
              }
            }
          })
          return saveAccount(account, config)
        })
      }
      else {
        return saveAccount(account)
      }
    }
  })
}

// 关注
function updateFollowState(req, res) {
  let {account = '', status = 0} = req.body
  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      let config = ret.config
      config.follow.status = status
      dbapi.updateInsAccountConfigByAccount(account, config).then(updateRet => {
        if (updateRet) {
          if (ret.serial) {
            ret.config = config
            schedule.updateInsJob(ret)
            insScript.checkStartScript(account, ret.serial, config, 1)
          }
          return res.json({
            success: true
          })
        }
        else {
          log.error('insAccount更新失败')

          return res.status(404).json({
            success: false
            , msg: '更新失败'
          })
        }
      })
    }
    else {
      log.error('insAccount更新失败')
      return res.status(404).json({
        success: false
        , msg: '更新失败'
      })
    }
  })
    .catch(function(err) {
      log.error('updateFollowState操作失败', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

// 取关
function updateUnFollowState(req, res) {
  let {account = '', status = 0} = req.body
  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      let config = ret.config
      config.unfollow.status = status
      dbapi.updateInsAccountConfigByAccount(account, config).then(updateRet => {
        if (updateRet) {
          if (ret.serial) {
            ret.config = config
            schedule.updateInsJob(ret)
            insScript.checkStartScript(account, ret.serial, config, 2)
          }
          return res.json({
            success: true
          })
        }
        else {
          return res.status(404).json({
            success: false
            , msg: '更新失败'
          })
        }
      })
    }
    else {
      return res.status(404).json({
        success: false
        , msg: '更新失败'
      })
    }
  })
    .catch(function(err) {
      log.error('updateUnFollowState操作失败', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

// 点赞
function updateThumbState(req, res) {
  let {account = '', status = 0} = req.body
  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      let config = ret.config
      config.thumb.status = status
      dbapi.updateInsAccountConfigByAccount(account, config).then(updateRet => {
        if (updateRet) {
          if (ret.serial) {
            ret.confif = config
            schedule.updateInsJob(ret)
            insScript.checkStartScript(account, ret.serial, config, 3)
          }
          return res.json({
            success: true
          })
        }
        else {
          log.error('insAccount更新失败')

          return res.status(404).json({
            success: false
            , msg: '更新失败'
          })
        }
      })
    }
    else {
      log.error('insAccount更新失败')
      return res.status(404).json({
        success: false
        , msg: '更新失败'
      })
    }
  })
    .catch(function(err) {
      log.error('updateThumbState操作失败', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

// 评论
function updateCommentState(req, res) {
  let {account = '', status = 0} = req.body
  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      let config = ret.config
      config.comment.status = status
      dbapi.updateInsAccountConfigByAccount(account, config).then(updateRet => {
        if (updateRet) {
          if (ret.serial) {
            ret.config = config
            schedule.updateInsJob(ret)
            insScript.checkStartScript(account, ret.serial, config, 4)
          }
          return res.json({
            success: true
          })
        }
        else {
          log.error('insAccount更新失败')

          return res.status(404).json({
            success: false
            , msg: '更新失败'
          })
        }
      })
    }
    else {
      log.error('insAccount更新失败')
      return res.status(404).json({
        success: false
        , msg: '更新失败'
      })
    }
  })
    .catch(function(err) {
      log.error('updateCommentState操作失败', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

// 私信
function updateMessageState(req, res) {
  let {account = '', status = 0} = req.body
  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      let config = ret.config
      config.message.status = status
      dbapi.updateInsAccountConfigByAccount(account, config).then(updateRet => {
        if (updateRet) {
          if (ret.serial) {
            ret.config = config
            schedule.updateInsJob(ret)
            insScript.checkStartScript(account, ret.serial, config, 5)
          }
          return res.json({
            success: true
          })
        }
        else {
          log.error('insAccount更新失败')

          return res.status(404).json({
            success: false
            , msg: '更新失败'
          })
        }
      })
    }
    else {
      log.error('insAccount更新失败')
      return res.status(404).json({
        success: false
        , msg: '更新失败'
      })
    }
  })
    .catch(function(err) {
      log.error('updateMessageState操作失败', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

// 发帖
function updatePostState(req, res) {
  let {account = '', status = 0} = req.body
  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      let config = ret.config
      config.post.status = status
      dbapi.updateInsAccountConfigByAccount(account, config).then(updateRet => {
        if (updateRet) {
          if (ret.serial) {
            ret.config = config
            schedule.updateInsJob(ret)
            insScript.checkStartScript(account, ret.serial, config, 6)
          }
          return res.json({
            success: true
          })
        }
        else {
          log.error('insAccount更新失败')

          return res.status(404).json({
            success: false
            , msg: '更新失败'
          })
        }
      })
    }
    else {
      log.error('insAccount更新失败')
      return res.status(404).json({
        success: false
        , msg: '更新失败'
      })
    }
  })
    .catch(function(err) {
      log.error('updatePostState操作失败', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

// 热身
function updateBrowseState(req, res) {
  let {account = '', status = 0} = req.body
  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      let config = ret.config
      config.browse.status = status
      dbapi.updateInsAccountConfigByAccount(account, config).then(updateRet => {
        if (updateRet) {
          if (ret.serial) {
            ret.config = config
            schedule.updateInsJob(ret)
            insScript.checkStartScript(account, ret.serial, config, 7)
          }
          return res.json({
            success: true
          })
        }
        else {
          return res.status(404).json({
            success: false
            , msg: '更新失败'
          })
        }
      })
    }
    else {
      return res.status(404).json({
        success: false
        , msg: '更新失败'
      })
    }
  })
    .catch(function(err) {
      log.error('updateUnFollowState操作失败', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function getInsAccountByAccount(req, res) {
  let {account = ''} = req.params

  getInsAccountByAccountService(account).then(ret => {
    if (ret) {
      delete ret.config.follow.insUsers
      delete ret.config.thumb.insUsers
      delete ret.config.comment.insUsers
      delete ret.config.message.insUsers
      delete ret.config.unfollow.whitelist
      return res.json({
        success: true,
        data: ret
      })
    }
    else {
      return res.status(404).json({
        success: false
        , msg: '未找到账号详情'
      })
    }
  })
    .catch(function(err) {
      log.error('getInsAccountByAccount操作失败', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function getInsAccountByAccountService(account) {
  return dbapi.getInsAccountByAccount(account).then(ret => {
    return ret
  }).catch(function(err) {
    return err
  })
}

function updateInsAccountConfigByAccount(req, res) {
  let {account = '', config, type = 1} = req.body
  dbapi.getInsAccountByAccount(account).then(ret => {
    config.follow.insUsers = ret.config.follow.insUsers
    config.thumb.insUsers = ret.config.thumb.insUsers
    config.comment.insUsers = ret.config.comment.insUsers
    config.message.insUsers = ret.config.message.insUsers
    config.unfollow.whitelist = ret.config.unfollow.whitelist
    dbapi.updateInsAccountConfigByAccount(account, config).then(updateRet => {
      if (updateRet) {
        if (ret && ret.serial) {
          ret.config = config
          schedule.updateInsJob(ret)
          insScript.checkStartScript(account, ret.serial, config, type)
        }
        return res.json({
          success: true
        })
      }
      else {
        return res.status(404).json({
          success: false
          , msg: '操作失败'
        })
      }
    })
      .catch(function(err) {
        log.error('updateInsAccountConfigByAccount操作失败', err.stack)
        res.status(500).json({
          success: false
        })
      })
  })
    .catch(function(err) {
      log.error('updateInsAccountConfigByAccount操作失败', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function updateInsAccountSerialByAccount(req, res) {
  let {account = '', serial = ''} = req.body

  dbapi.updateInsAccountSerialByAccount(account, serial).then(ret => {
    if (ret) {
      dbapi.getInsAccountByAccount(account).then(insAccount => {
        schedule.updateInsJob(insAccount)
        insScript.checkStartScript(account, insAccount.serial, insAccount.config, 1)
        insScript.checkStartScript(account, insAccount.serial, insAccount.config, 2)
        insScript.checkStartScript(account, insAccount.serial, insAccount.config, 3)
        insScript.checkStartScript(account, insAccount.serial, insAccount.config, 4)
        insScript.checkStartScript(account, insAccount.serial, insAccount.config, 5)
        insScript.checkStartScript(account, insAccount.serial, insAccount.config, 6)
        insScript.checkStartScript(account, insAccount.serial, insAccount.config, 7)
        insScript.checkStartScript(account, insAccount.serial, insAccount.config, 8)
      })
      return res.json({
        success: true
      })
    }
    else {
      return res.status(404).json({
        success: false
        , msg: '操作失败'
      })
    }
  })
    .catch(function(err) {
      log.error('updateInsAccountSerialByAccount操作失败', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function getAllDevice(req, res) {
  dbapi.loadDevices()
    .then(function(cursor) {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(function(list) {
          let devices = []
          list.forEach(device => {
            devices.push({
              serial: device.serial,
              model: device.model,
              notes: device.notes,
              isOwner: req.user.devices.includes(device.serial) || req.user.admin
            })
          })
          res.json({
            success: true
            , data: devices
          })
        })
    })
    .catch(function(err) {
      log.error('Failed to load device list: ', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function delInsAccount(req, res) {
  let {account = ''} = req.body

  dbapi.delInsAccountByAcccount(account).then(ret => {
    if (ret) {
      return res.json({
        success: true
      })
    }
    else {
      return res.status(404).json({
        success: false
        , msg: '删除失败'
      })
    }
  })
    .catch(function(err) {
      log.error('Failed to load device list: ', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function saveLog(log) {
  let {
    type,
    serial,
    msg,
    record,
    status,
    account
  } = log

  dbapi.saveLog({
    type,
    serial,
    record,
    msg,
    status,
    account
  })
}

function getAllLogs(req, res) {
  let {page, limit = 10} = req.body
  dbapi.getAllLogs(page, limit)
    .then(function(cursor) {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(function(list) {
          dbapi.getLogCount().then((count) => {
            // let totalPage = Math.ceil(list.length / limit)
            // let list = list.splice((page - 1) * limit, limit)
            let logs = []
            list.map(item => {
              let msg = item.left.msg
              let created = item.left.created
              let nickname = item.left.nickname
              let notes = item.right.notes
              let serial = item.right.serial
              let status = item.left.status

              logs.push({
                msg,
                nickname,
                notes,
                created,
                serial,
                status
              })
            })
            res.json({
              success: true,
              data: logs,
              total: Math.ceil(count / limit)
            })
          })
        })
    })
    .catch(function(err) {
      log.error('Failed to get all logs: ', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function getLogsBySerial(req, res) {
  let {serial} = req.params
  let {type} = req.query
  dbapi.getLogsBySerial(serial, Number(type))
    .then(function(cursor) {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(function(list) {
          let logs = []
          list.map(item => {
            let msg = item.left.msg
            let created = item.left.created
            let nickname = item.left.nickname
            let notes = item.right.notes
            let serial = item.right.serial
            let status = item.left.status

            logs.push({
              msg,
              nickname,
              notes,
              created,
              serial,
              status
            })
          })
          res.json({
            success: true
            , data: logs
          })
        })
    })
    .catch(function(err) {
      log.error('Failed to get all logs: ', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function getDeviceNameByAccount(req, res) {
  let {account} = req.query
  dbapi.getDeviceNameByAccount(account)
    .then(function(cursor) {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(function(list) {
          if (list.length) {
            let data = list[0]
            let device = {
              notes: data.right.notes,
              serial: data.right.serial
            }
            res.json({
              success: true
              , data: device
            })
          }
          else {
            res.json({
              success: true
              , data: null
            })
          }
        })
    })
    .catch(function(err) {
      log.error('Failed to get device name by serial: ', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function getLogsByAccountLimit(req, res) {
  let {account, page, limit = 10, type} = req.body

  // dbapi.getLogsByAccount(account, Number(type), page, limit)
  dbapi.getLogsByAccountLimit(account, type, page, limit)
    .then(function(cursor) {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(function(list) {
          dbapi.getLogsByAccountLimitPage(account, type).then(count => {
            let logs = []
            list.map(item => {
              let msg = item.left.msg
              let created = item.left.created
              let nickname = item.left.nickname
              let notes = item.right.notes
              let serial = item.right.serial
              let status = item.left.status

              logs.push({
                msg,
                nickname,
                notes,
                created,
                serial,
                status
              })
            })
            res.json({
              success: true,
              data: logs,
              total: Math.ceil(count / limit)
            })
          })
        })
    })
    .catch(function(err) {
      log.error('Failed to get get logs by account limit: ', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function savePost(req, res) {
  let {title} = req.body

  dbapi.createInsPost(title).then(ret => {
    if (ret) {
      return res.json({
        success: true
      })
    }
    else {
      log.error('帖子保存失败')
      return res.status(404).json({
        success: false
        , msg: '帖子保存失败'
      })
    }
  })
    .catch(function(err) {
      log.error('Failed to save post: ', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function getPostList(req, res) {
  dbapi.getInsPost().then(function(cursor) {
    return Promise.promisify(cursor.toArray, cursor)()
      .then(function(list) {
        return res.json({
          data: list,
          success: true
        })
      })
  })
    .catch(function(err) {
      log.error('Failed to get all posts: ', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function getPostById(req, res) {
  let {id} = req.body
  dbapi.getPostById(id).then(ret => {
    return res.json({
      data: ret,
      success: true
    })
  })
    .catch(function(err) {
      log.error('Failed to get post: ', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function updatePostById(req, res) {
  let {
    id,
    imgList,
    checkSsr,
    startInfo,
    locInfo,
    postDelay,
    postTime,
    res: resText,
    title,
    type,
  } = req.body

  dbapi.updatePostById(id, {
    imgList,
    checkSsr,
    startInfo,
    locInfo,
    postDelay,
    postTime,
    res: resText,
    title,
    type
  }).then(ret => {
    if (ret) {
      return res.json({
        success: true
      })
    }
    else {
      log.error('post更新失败')

      return res.status(404).json({
        success: false
        , msg: '更新失败'
      })
    }
  })
}

function delPostById(req, res) {
  let {id} = req.body
  dbapi.delPostById(id).then(ret => {
    if (ret) {
      return res.json({
        success: true
      })
    }
  })
}

function updatePostResource(serial, message) {
  let {
    account,
    id,
    postType,
    imgList
  } = message

  dbapi.getInsAccountByAccount(account).then(ret => {
    let post = ret.config.post
    if (Number(postType) === 1) {
      let postItemIndex = post.postList.findIndex(item => item.id === id)
      if (post.postList[postItemIndex].type === 1) {
        post.postList.splice(postItemIndex, 1)
      }
      else {
        post.postList[postItemIndex].used = true
      }
    }
    else if (Number(postType) === 2) {
      let usedImgList = post.randomPost.usedImgList || []
      let imgArray = JSON.parse(imgList) || []

      if(post.randomPost.type === 1) {
        imgArray.map(img => {
          let index = post.randomPost.imgList.findIndex(item => item === img)
          post.randomPost.imgList.splice(index, 1)
        })
      }
      else {
        post.randomPost.usedImgList = [...usedImgList, ...imgArray]
      }
    }

    dbapi.updateInsAccountConfigByAccount(account, ret.config)
  })
}

function getResource(req, res) {
  let {
    account,
    resourceType,
    type,
    page = 1,
    limit = 10,
    search
  } = req.body

  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      let resList = ret.config[funcNameList[type - 1]].insUsers['resource' + resourceType].res
      if (search) {
        resList = _.filter(resList, (item) => item.res.includes(search))
      }
      return res.json({
        success: true,
        data: resList.slice((page - 1) * limit, page * limit)
      })
    }
  })
}

function getResourceBlackList(req, res) {
  let {
    account,
    resourceType,
    type,
    page = 1,
    limit = 10,
    search
  } = req.body

  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      let blackList = ret.config[funcNameList[type - 1]].insUsers['resource' + resourceType].blackList || []
      let privateBlackList = ret.config[funcNameList[type - 1]].insUsers['resource' + resourceType].privateBlackList || []
      let resList = [...blackList, ...privateBlackList]
      if (search) {
        resList = _.filter(resList, (item) => item.blackName.includes(search))
      }
      return res.json({
        success: true,
        data: resList.slice((page - 1) * limit, page * limit)
      })
    }
  })
}

function delResourceBlackList(req, res) {
  let {
    blackName,
    resName,
    account,
    type,
    resType,
    resourceType,
    status
  } = req.body

  let blackNameList = Array.isArray(blackName) ? blackName : [{
    blackName,
    resName,
    resType,
    status
  }]

  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      let config = ret.config

      blackNameList.forEach(blackItem => {
        if (blackItem.status === 9) {
          let index = config[funcNameList[type - 1]].insUsers['resource' + resourceType].privateBlackList.findIndex(item => item.res === blackItem.resName && item.type === blackItem.resType && item.blackName === blackItem.blackName && item.status === 9)
          if (index >= 0) config[funcNameList[type - 1]].insUsers['resource' + resourceType].privateBlackList.splice(index, 1)
        } else {
          let index = config[funcNameList[type - 1]].insUsers['resource' + resourceType].blackList.findIndex(item => item.res === blackItem.resName && item.type === blackItem.resType && item.blackName === blackItem.blackName)
          if (index >= 0) config[funcNameList[type - 1]].insUsers['resource' + resourceType].blackList.splice(index, 1)
        }
      })
      dbapi.updateInsAccountConfigByAccount(account, config).then(ret => {
        return res.json({
          success: true,
          msg: '操作成功'
        })
      })
    } else {
      return res.json({
        success: false,
        msg: '未找到该账号'
      })
    }
  })
}

function clearBlackResource(req, res) {
  let {
    type,
    resType,
    resourceType,
    account
  } = req.body

  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      let config = ret.config
      if (resType === 0) config[funcNameList[type - 1]].insUsers['resource' + resourceType].privateBlackList = []
      else {
        let blackList = config[funcNameList[type - 1]].insUsers['resource' + resourceType].blackList.filter(item => item.type !== resType)
        config[funcNameList[type - 1]].insUsers['resource' + resourceType].blackList = blackList
      }
      dbapi.updateInsAccountConfigByAccount(account, config).then(ret => {
        return res.json({
          success: true,
          msg: '操作成功'
        })
      })
    } else {
      return res.json({
        success: false,
        msg: '未找到该账号'
      })
    }
  })
}

function addResource(req, res) {
  let {
    resList,
    account,
    type,
    resourceType
  } = req.body

  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      let config = ret.config
      let oldResList = config[funcNameList[type - 1]].insUsers['resource' + resourceType].res
      let list = []
      resList.map(item => {
        if (item.res.trim()) {
          let index = oldResList
            .findIndex(i => i.res === item.res && i.type === item.type)
          if (index < 0) {
            list.push(item)
          }
        }
      })
      list.map(item => {
        item.status = 1
        item.level = 1
        item.record = 0
        item.created = moment().format('YYYY-MM-DD HH:mm')
      })
      config[funcNameList[type - 1]].insUsers['resource' + resourceType].res.unshift(...list)

      dbapi.updateInsAccountConfigByAccount(account, config).then(ret => {
        return res.json({
          success: true,
          msg: '操作成功'
        })
      })
    } else {
      return res.json({
        success: false,
        msg: '未找到该账号'
      })
    }
  })
}

function delResource(req, res) {
  let {
    resName,
    account,
    type,
    resType,
    resourceType
  } = req.body

  let resNameList = Array.isArray(resName) ? resName : [{
    resName,
    resType
  }]

  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      let config = ret.config

      resNameList.forEach(resItem => {
        let index = config[funcNameList[type - 1]].insUsers['resource' + resourceType].res.findIndex(item => item.res === resItem.resName && item.type === resItem.resType)
        config[funcNameList[type - 1]].insUsers['resource' + resourceType].res.splice(index, 1)
      })

      dbapi.updateInsAccountConfigByAccount(account, config).then(ret => {
        return res.json({
          success: true,
          msg: '操作成功'
        })
      })
    } else {
      return res.json({
        success: false,
        msg: '未找到该账号'
      })
    }
  })
}

function updateResource(req, res) {
  let {
    account,
    type,
    resource,
    resourceType,
  } = req.body

  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      let config = ret.config

      let index = config[funcNameList[type - 1]].insUsers['resource' + resourceType].res.findIndex(item => item.res === resource.res && item.type === resource.type)

      config[funcNameList[type - 1]].insUsers['resource' + resourceType].res.splice(index, 1, resource)
      dbapi.updateInsAccountConfigByAccount(account, config).then(ret => {
        return res.json({
          success: true,
          msg: '操作成功'
        })
      })
    } else {
      return res.json({
        success: false,
        msg: '未找到该账号'
      })
    }
  })
}

function updateReourceStatus(req, res) {
  let {
    account,
    type = 1,
    resource1,
    resource2,
    resource3,
  } = req.body

  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      let config = ret.config
      let insUsers = config[funcNameList[type - 1]].insUsers

      insUsers.resource1.level = resource1.level
      insUsers.resource1.status = resource1.status
      insUsers.resource1.upperLimit = resource1.upperLimit
      let {
        privateBlackList: privateBlackList1,
        blackList: blackList1
      } = formatBlackList(insUsers.resource1.privateBlackList, insUsers.resource1.blackList, insUsers.resource1.upperLimit)
      insUsers.resource1.privateBlackList = privateBlackList1
      insUsers.resource1.blackList = blackList1
      insUsers.resource1.blackSecret = resource1.blackSecret
      insUsers.resource1.blackFollow = resource1.blackFollow

      insUsers.resource2.level = resource2.level
      insUsers.resource2.status = resource2.status
      insUsers.resource2.upperLimit = resource2.upperLimit
      let {
        privateBlackList: privateBlackList2,
        blackList: blackList2
      } = formatBlackList(insUsers.resource2.privateBlackList, insUsers.resource2.blackList, insUsers.resource2.upperLimit)
      insUsers.resource2.privateBlackList = privateBlackList2
      insUsers.resource2.blackList = blackList2
      insUsers.resource2.blackSecret = resource2.blackSecret
      insUsers.resource2.blackFollow = resource2.blackFollow

      insUsers.resource3.level = resource3.level
      insUsers.resource3.status = resource3.status
      insUsers.resource3.upperLimit = resource3.upperLimit
      let {
        privateBlackList: privateBlackList3,
        blackList: blackList3
      } = formatBlackList(insUsers.resource3.privateBlackList, insUsers.resource3.blackList, insUsers.resource3.upperLimit)
      insUsers.resource3.privateBlackList = privateBlackList3
      insUsers.resource3.blackList = blackList3
      insUsers.resource3.blackSecret = resource3.blackSecret
      insUsers.resource3.blackFollow = resource3.blackFollow

      dbapi.updateInsAccountConfigByAccount(account, config).then((updateRet) => {
        if (ret.serial) {
          ret.config = config
          schedule.updateInsJob(ret)
          insScript.checkStartScript(account, ret.serial, config, type)
        }
        return res.json({
          success: true,
          msg: '操作成功'
        })
      })
    } else {
      return res.json({
        success: false,
        msg: '未找到该账号'
      })
    }
  })
}

/**
 * 根据黑名单上限处理黑名单数据
 * @param privateBlackList
 * @param blackList
 * @param upperLimit
 */
function formatBlackList(privateBlackList = [], blackList = [], upperLimit) {
  let list = [...privateBlackList, ...blackList]
  console.log(list)
  if (upperLimit && upperLimit <= list.length) {
    list.sort((a, b) => b.created - a.created)
    let newList = list.splice(0, +upperLimit)
    let newPrivateBlackList = []
    let newBlackList = []
    newList.forEach(item => {
      if (item.status === 9) {
        newPrivateBlackList.push(item)
      } else {
        newBlackList.push(item)
      }
    })

    return {
      privateBlackList: newPrivateBlackList,
      blackList: newBlackList
    }
  } else {
    return {
      privateBlackList,
      blackList
    }
  }
}

function updateInsAccountMinDayAndMaxDay(account, config) {
  // 关注
  let followAddDay = Number(config.follow.addDay)
  let followTopDay = Number(config.follow.topDay)
  if (followAddDay && config.follow.maxDay < followTopDay) {
    config.follow.minDay += followAddDay
    config.follow.maxDay += followAddDay
  }
  if (config.follow.minDay > followTopDay) config.follow.minDay = followTopDay
  if (config.follow.maxDay > followTopDay) config.follow.maxDay = followTopDay

  // 取关
  let unfollowAddDay = Number(config.unfollow.addDay)
  let unfollowTopDay = Number(config.unfollow.topDay)
  if (unfollowAddDay && config.unfollow.maxDay < unfollowTopDay) {
    config.unfollow.minDay += unfollowAddDay
    config.unfollow.maxDay += unfollowAddDay
  }
  if (config.unfollow.minDay > unfollowTopDay) config.unfollow.minDay = unfollowTopDay
  if (config.unfollow.maxDay > unfollowTopDay) config.unfollow.maxDay = unfollowTopDay

  // 点赞
  let thumbAddDay = Number(config.thumb.addDay)
  let thumbTopDay = Number(config.thumb.topDay)
  if (thumbAddDay && config.thumb.minDay < thumbTopDay) {
    // let random = Math.floor(Math.random() * (thumbTopDay - thumbAddDay + 1)) + thumbAddDay
    config.thumb.minDay += thumbAddDay
    config.thumb.maxDay += thumbAddDay
  }
  if (config.thumb.minDay > thumbTopDay) config.thumb.minDay = thumbTopDay
  if (config.thumb.maxDay > thumbTopDay) config.thumb.maxDay = thumbTopDay

  // 评论
  let commentAddDay = Number(config.comment.addDay)
  let commentTopDay = Number(config.comment.topDay)
  if (commentAddDay && config.comment.maxDay < commentTopDay) {
    // let random = Math.floor(Math.random() * (commentTopDay - commentAddDay + 1)) + commentAddDay
    config.comment.minDay += commentAddDay
    config.comment.maxDay += commentAddDay
  }
  if (config.comment.minDay > commentTopDay) config.comment.minDay = commentTopDay
  if (config.comment.maxDay > commentTopDay) config.comment.maxDay = commentTopDay

  // 私信
  let messageAddDay = Number(config.message.addDay)
  let messageTopDay = Number(config.message.topDay)
  if (messageAddDay && config.message.maxDay < messageTopDay) {
    // let random = Math.floor(Math.random() * (messageTopDay - messageAddDay + 1)) + messageAddDay
    config.message.minDay += messageAddDay
    config.message.maxDay += messageAddDay
  }
  if (config.message.minDay > messageTopDay) config.message.minDay = messageTopDay
  if (config.message.maxDay > messageTopDay) config.message.maxDay = messageTopDay

  dbapi.updateInsAccountConfigByAccount(account, config)
}

function closeResource(serial, message) {
  let {
    resName,
    resourceType,
    account,
    type,
    resType
  } = message

  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {

      log.info(`操作${funcNameList[type - 1]}的资源`)
      if (funcNameList[type - 1]) {
        let config = ret.config
        let resource = config[funcNameList[type - 1]].insUsers['resource' + resourceType].res.find(item => item.res === resName && item.type === resType)
        resource.status = 0
        log.info(resource)
        dbapi.updateInsAccountConfigByAccount(account, config)
      }
    }
  })
}

function putBlackList(serial, message) {
  let {
    resName,
    resourceType,
    resType,
    account,
    type,
    blackName,
    status
  } = message

  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      log.info(`操作${funcNameList[type - 1]}的资源`)
      if (funcNameList[type - 1]) {
        let config = ret.config
        let resource = config[funcNameList[type - 1]].insUsers['resource' + resourceType]
        let blackList
        if (status === 9) blackList = resource.privateBlackList || []
        else blackList = resource.blackList || []
        // 该用户不存在黑名单中
        if (blackList.findIndex(i => i.blackName === blackName && i.res === resName && i.type === resType) < 0) {
          let list = [...(resource.privateBlackList || []), ...(resource.blackList || [])]
          if(resource.upperLimit && resource.upperLimit <= list.length) {
            list.sort((a, b) => b.created - a.created)
            let targetBlack = list[list.length - 1]
            if (targetBlack.status === 9) {
              let index = resource.privateBlackList.findIndex(item => item.created === targetBlack.created)
              resource.privateBlackList.splice(index, 1)
            } else {
              let index = resource.blackList.findIndex(item => item.created === targetBlack.created)
              resource.blackList.splice(index, 1)
            }
          }
          blackList.unshift({
            blackName,
            res: resName,
            type: resType,
            status,
            created: Date.now()
          })
          if (status === 9) resource.privateBlackList = blackList
          else resource.blackList = blackList
          log.info(resource)
          dbapi.updateInsAccountConfigByAccount(account, config)
        }
      }
    }
  })
}

function getInsUsersStatusByAccount(req, res) {
  let {
    account,
    type
  } = req.body

  dbapi.getInsAccountByAccount(account).then(ret => {

    let insUsers = ret.config[funcNameList[type - 1]].insUsers
    let {
      resource1,
      resource2,
      resource3
    } = insUsers

    delete resource1.res
    delete resource2.res
    delete resource3.res

    return res.json({
      success: true,
      data: {
        resource1,
        resource2,
        resource3
      }
    })
  })
    .catch(function(err) {
      log.error('Failed to get insUsers status by account: ', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function getUnfollowWhiteList(req, res) {
  let {account = '', search = '', page = 1, limit = 10} = req.body

  getInsAccountByAccountService(account).then(ret => {
    if (ret) {
      let whitelist = ret.config.unfollow.whitelist.list ? ret.config.unfollow.whitelist.list.split(',') : []
      if (search) {
        whitelist = _.filter(whitelist, (item) => item.includes(search))
      }
      return res.json({
        success: true,
        data: whitelist.slice((page - 1) * limit, page * limit)
      })
    }
    else {
      return res.status(404).json({
        success: false
        , msg: '未找到账号详情'
      })
    }
  })
    .catch(function(err) {
      log.error('getUnfollowWhiteList操作失败', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function updateUnfollowWhiteList(req, res) {
  let {account = '', list = []} = req.body

  getInsAccountByAccountService(account).then(ret => {
    if (ret) {
      let config = ret.config

      let oldWhitelist = config.unfollow.whitelist.list ? config.unfollow.whitelist.list.split(',') : []
      let whitelist = []
      list.map(item => {
        if (!oldWhitelist.includes(item)) {
          whitelist.push(item)
        }
      })
      whitelist.push(...oldWhitelist)
      config.unfollow.whitelist.list = whitelist.join(',')
      dbapi.updateInsAccountConfigByAccount(account, config).then(updateRet => {
        if (updateRet) {
          if (ret && ret.serial) {
            ret.config = config
            schedule.updateInsJob(ret)
            insScript.checkStartScript(account, ret.serial, config, 2)
          }
          return res.json({
            success: true
          })
        }
        else {
          return res.status(404).json({
            success: false
            , msg: '操作失败'
          })
        }
      })
        .catch(function(err) {
          log.error('updateInsAccountConfigByAccount操作失败', err.stack)
          res.status(500).json({
            success: false
          })
        })
    }
    else {
      return res.status(404).json({
        success: false
        , msg: '未找到账号详情'
      })
    }
  })
    .catch(function(err) {
      log.error('getUnfollowWhiteList操作失败', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function getUnfollowWhiteListStatus(req, res) {
  let {account = ''} = req.body

  getInsAccountByAccountService(account).then(ret => {
    if (ret) {
      let status = ret.config.unfollow.whitelist.status
      return res.json({
        success: true,
        data: status
      })
    }
    else {
      return res.status(404).json({
        success: false
        , msg: '未找到账号详情'
      })
    }
  })
    .catch(function(err) {
      log.error('getUnfollowWhiteList操作失败', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function updateUnfollowWhiteListStatus(req, res) {
  let {account = '', status = 0} = req.body

  getInsAccountByAccountService(account).then(ret => {
    if (ret) {
      let config = ret.config

      config.unfollow.whitelist.status = status
      dbapi.updateInsAccountConfigByAccount(account, config).then(updateRet => {
        if (updateRet) {
          if (ret && ret.serial) {
            ret.config = config
            schedule.updateInsJob(ret)
            insScript.checkStartScript(account, ret.serial, config, 2)
          }
          return res.json({
            success: true
          })
        }
        else {
          return res.status(404).json({
            success: false
            , msg: '操作失败'
          })
        }
      })
        .catch(function(err) {
          log.error('updateUnfollowWhiteListStatus操作失败', err.stack)
          res.status(500).json({
            success: false
          })
        })
    }
    else {
      return res.status(404).json({
        success: false
        , msg: '未找到账号详情'
      })
    }
  })
    .catch(function(err) {
      log.error('updateUnfollowWhiteListStatus操作失败', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function delUnfollowWhiteList(req, res) {
  let {
    resName,
    account
  } = req.body

  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      let config = ret.config
      let list = config.unfollow.whitelist.list ? config.unfollow.whitelist.list.split(',') : []

      let index = list.findIndex(item => item === resName)
      list.splice(index, 1)
      config.unfollow.whitelist.list = list.join(',')
      dbapi.updateInsAccountConfigByAccount(account, config).then(ret => {
        return res.json({
          success: true,
          msg: '操作成功'
        })
      })
    } else {
      return res.json({
        success: false,
        msg: '未找到该账号'
      })
    }
  })
}

function getInsAccountNotes(req, res) {
  let {
    account
  } = req.body
  dbapi.getInsAccountNotes(account).then(ret => {
    return res.json({
      success: true,
      data: ret ? ret.notes : ''
    })
  })
}

function saveOrUpdateInsAccountNotes(req, res) {
  let {
    notes,
    account
  } = req.body
  dbapi.saveInsAccountNotes(account, notes).then(ret => {
    if (ret) {
      return res.json({
        success: true,
        msg: '操作成功'
      })
    } else {
      return res.json({
        success: false,
        msg: '保存失败'
      })
    }
  })
}

function saveInsAccountStatistics(req, res) {
  let {
    checkSsr = 0,      // 是否检查ssr
    startInfo = {},
    account,
    excute,
    weekday
  } = req.body
  let {
    status = 0,       // 开启的状态
    startName = 'Instagram'    // 分身的名称
  } = startInfo

  let {
    start = '00:00',
    end = '00:00'
  } = excute

  dbapi.getInsAccountByAccount(account).then(ret => {
    let config = ret.config
    let serial = ret.serial

    config.statistics = {
      checkSsr,
      startInfo: {
        status,
        startName
      },
      excute: {
        start,
        end
      },
      weekday
    }

    dbapi.updateInsAccountConfigByAccount(account, config).then(updateRet => {
      if (updateRet) {
        ret.config = config
        schedule.updateInsJob(ret)
        insScript.checkStartScript(account, serial, config, 8)
        return res.json({
          success: true,
          msg: '操作成功'
        })
      } else {}
      return res.json({
        success: false,
        msg: '操作失败'
      })
    })
  })
}

function getInsAccountStatistics(req, res) {
  let {
    account
  } = req.body

  getInsAccountStatisticsByAccount(account).then(statistics => {
    return res.json({
      data: statistics,
      success: true
    })
  })
}

function getInsAccountStatisticsByAccount(account) {
  return dbapi.getInsAccountByAccount(account).then(ret => {
    let {config} = ret
    return config.statistics || {
      checkSsr: 0,
      startInfo: {
        status: 0,       // 开启的状态
        startName: 'Instagram'    // 分身的名称
      }
    }
  })
}

function getStatisticsLogs(req, res) {
  let {
    account,
    page = 1,
    limit = 10,
    start,
    end,
  } = req.body

  dbapi.getAllLogsNoJoin(8, account, 8).then(cursor => {
    return Promise.promisify(cursor.toArray, cursor)()
      .then((logs) => {
        let filterLogs = logs.filter(item => moment(item.created).isBetween(start, end) || moment(item.created).isSame(end, 'day'))
        let limitLogs = filterLogs.slice((page - 1) * limit, page * limit)
        limitLogs.map(log => {
          let date = moment(log.created).subtract(30, 'day')
          let index = logs.findIndex(item => moment(item.created).format('YYYY-MM-DD') === date.format('YYYY-MM-DD'))
          let targetVal = ''
          if (index < 0) {
          // 找不到符合的日期
            targetVal = JSON.parse(logs[logs.length - 1].msg).followerNum
          } else {
            targetVal = JSON.parse(logs[index].msg).followerNum
          }
          let msg = JSON.parse(log.msg)
          log.monthGrowth = Math.round(((msg.followerNum - targetVal) / targetVal) * 10000) / 100
        })
        return res.json({
          success: true,
          data: filterLogs.slice((page - 1) * limit, page * limit)
        })
      })
  })
}

function getDataAnalysis(req, res) {
  let {
    account,
    start,
    end,
    type = 1,
  } = req.body

  dbapi.getAllLogsNoJoin(8, account, 8).then(cursor => {
    return Promise.promisify(cursor.toArray, cursor)()
      .then((logs) => {
        // 时间段筛选
        let filterLogs = logs.filter(item => moment(item.created).isBetween(start, end) || moment(item.created).isSame(end, 'day'))
        // 时间升序
        filterLogs.sort((a, b) => a.created - b.created)
        let data = {}
        filterLogs.forEach(item => {
          let msg = JSON.parse(item.msg)
          if (+type === 1) {
            let date = [moment(item.created).format('YYYY-MM-DD')]
            data[date] = msg.followerNum
          } else {
            let date = [moment(item.created).format('YYYY-MM')]
            let followerNum = data[date] || 0
            data[date] = followerNum + msg.followerNum
          }
        })
        return res.json({
          success: true,
          data: data
        })
      })
  })
}

function getSourceAnalysis(req, res) {
  let {
    account,
    start,
    end
  } = req.body

  dbapi.getAllLogsNoJoin(8, account, 8).then(cursor => {
    return Promise.promisify(cursor.toArray, cursor)()
      .then((logs) => {
        // 时间段筛选
        let filterLogs = logs.filter(item => moment(item.created).isBetween(start, end) || moment(item.created).isSame(end, 'day'))
        let list = []
        dbapi.getAllLogsNoJoin(2, account).then(cursor => {
          return Promise.promisify(cursor.toArray, cursor)()
            .then(allLogs => {
              filterLogs.forEach(item => {
                let msg = JSON.parse(item.msg)
                msg.followerNicks.forEach(follower => {
                  let followNum = 0
                  let thumbNum = 0
                  let commentNum = 0
                  let messageNum = 0
                  let targetLogs = allLogs.filter(item => item.msg.includes(follower))
                  targetLogs.forEach(item => {
                    switch(item.type) {
                      case 1: ++followNum
                            break
                      case 3: ++thumbNum
                            break
                      case 4: ++commentNum
                            break
                      case 5: ++messageNum
                            break
                    }
                  })
                  list.push({
                    follower,
                    followNum,
                    thumbNum,
                    commentNum,
                    messageNum
                  })
                })
              })
              return res.json({
                success: true,
                data: list
              })
            })
        })
      })
  })
}

function getInsAccountBySerial(req, res) {
  let {
    serial = ''
  } = req.body

  if (serial) {
    dbapi.getInsAccountBySerial(serial).then(cursor => {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(list => {
          let accountList = []
          list.map(account => {
            let config = {
              follow: {status: account.config.follow.status},
              unfollow: {status: account.config.unfollow.status},
              comment: {status: account.config.comment.status},
              message: {status: account.config.message.status},
              post: {status: account.config.post.status},
              thumb: {status: account.config.thumb.status},
              browse: {status: account.config.browse ? account.config.browse.status : 0}
            }
            accountList.push({
              account: account.account,
              config
            })
          })
          return res.json({
            success: true,
            data: accountList
          })
        })
    })
  } else {
    return res.json({
      success: true,
      data: null,
      msg: 'serial为空'
    })
  }
}

function setInsAccountRecord(serial, message) {
  let {
    record,
    account,
    type
  } = message
  let date = moment().format('YYYY-MM-DD')

  dbapi.saveOrUpdateInsaccountRecord(account, type, date, record).then(ret => {
    log.info('save Record', account, type, date, record)
  })
}

function clearInsAccountRecord(req, res) {
  let {
    type,
    account
  } = req.body

  dbapi.clearInsAccountRecord(account, type, moment().format('YYYY-MM-DD')).then(ret => {
    return res.json({
      success: true
    })
  })
}

function copyInsAccount(req, res) {
  let {account = '', copyAccount, copyList = []} = req.body

  function updateAccount(account, config) {
    return dbapi.updateInsAccountConfigByAccount(account, config)
      .then(ret => {
        if (ret) {
          return res.json({
            success: true
          })
        }
        else {
          log.error('更新保存失败')
          return res.status(404).json({
            success: false
            , msg: '更新保存失败'
          })
        }
      })
  }

  if (copyAccount) {
    dbapi.getInsAccountByAccount(copyAccount).then(insAccount => {
      let config = {}
      copyList.map(key => {
        let insUsers = config[key]
        config[key] = insAccount.config[key]

        // 不copy配置的insUsers
        if(insUsers) {
          config[key].insUsers = insUsers
        }
      })
      return updateAccount(account, config)
    })
  }
}

function getAllInsAccountName(req, res) {
  dbapi.getAllInsAccount().then(cursor => {
    return Promise.promisify(cursor.toArray, cursor)()
      .then((list) => {
        let chain = []
        let accountList = list.filter(item => req.user.devices.includes(item.serial) || !item.serial || req.user.admin)
        accountList.map((item) => {
          chain.push(getInsAccountRecord (item))
        })

        Promise.all(chain).then(() => {
          let newAccountList = _.sortBy(accountList,  (o) =>  Number(o.account))
          let nameList = []
          newAccountList.map(item => {
            nameList.push(item.account)
          })
          // accountList.sort((a, b) => b.account - a.account)
          return res.json({
            success: true,
            data: nameList
          })
        })
        // return res.json({
        //   success: true,
        //   data: list
        // })
      })
  })
}

function getInsAccountStatus(account, type) {
  return dbapi.getInsAccountByAccount(account).then(insAccount => {
    let config = insAccount.config
    let status = false
    switch(+type) {
      case 1: status = !!config.follow.status
          break;
      case 2: status = !!config.unfollow.status
        break;
      case 3: status = !!config.thumb.status
        break;
      case 4: status = !!config.comment.status
        break;
      case 5: status = !!config.message.status
        break;
      case 6: status = !!config.post.status
        break;
      case 7: status = !!config.browse.status
        break;
    }

    return status
  })
}

module.exports = {
  getAllInsAccount,
  saveInsAccount,
  updateFollowState,
  updateUnFollowState,
  updateThumbState,
  updateCommentState,
  updateMessageState,
  updatePostState,
  updateBrowseState,
  getInsAccountByAccount,
  updateInsAccountConfigByAccount,
  getAllDevice,
  updateInsAccountSerialByAccount,
  delInsAccount,
  saveLog,
  getAllLogs,
  getLogsBySerial,
  getDeviceNameByAccount,
  getLogsByAccountLimit,
  getInsAccountByAccountService,
  savePost,
  getPostList,
  getPostById,
  updatePostById,
  delPostById,
  updatePostResource,
  updateInsAccountMinDayAndMaxDay,
  closeResource,
  putBlackList,
  getInsUsersStatusByAccount,
  getResource,
  addResource,
  delResource,
  updateResource,
  updateReourceStatus,
  getResourceBlackList,
  delResourceBlackList,
  getUnfollowWhiteList,
  updateUnfollowWhiteList,
  getUnfollowWhiteListStatus,
  updateUnfollowWhiteListStatus,
  delUnfollowWhiteList,
  saveOrUpdateInsAccountNotes,
  getInsAccountNotes,
  saveInsAccountStatistics,
  getInsAccountStatistics,
  getInsAccountStatisticsByAccount,
  getStatisticsLogs,
  getDataAnalysis,
  getSourceAnalysis,
  getInsAccountBySerial,
  clearBlackResource,
  setInsAccountRecord,
  clearInsAccountRecord,
  copyInsAccount,
  getAllInsAccountName,
  getInsAccountStatus
}
