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
          chain.push(getAccountDataService(item))
        })

        Promise.all(chain).then(() => {
          return res.json({
            success: true,
            data: accountList
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

function getAccountDataService(item) {
  console.time('logsItem' + item.account)
  return dbapi.getLogsByAccountData(item.account, 2).then(cursor => {
    console.timeEnd('logsItem' + item.account)
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
          list.map(device => {
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
          // let totalPage = Math.ceil(list.length / limit)
          // let list = list.splice((page - 1) * limit, limit)
          let logs = []
          list.map(item => {
            let msg = item.left.msg
            let created = item.left.created
            let nickname = item.left.nickname
            let notes = item.right.notes
            let serial = item.right.serial

            logs.push({
              msg,
              nickname,
              notes,
              created,
              serial
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

            logs.push({
              msg,
              nickname,
              notes,
              created,
              serial
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
          let logs = []
          list.map(item => {
            let msg = item.left.msg
            let created = item.left.created
            let nickname = item.left.nickname
            let notes = item.right.notes
            let serial = item.right.serial

            logs.push({
              msg,
              nickname,
              notes,
              created,
              serial
            })
          })
          res.json({
            success: true
            , data: logs
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
      let resList = ret.config[funcNameList[type - 1]].insUsers['resource' + resourceType].blackList || []
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
    resourceType
  } = req.body

  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      let config = ret.config

      let index = config[funcNameList[type - 1]].insUsers['resource' + resourceType].blackList.findIndex(item => item.res === resName && item.type === resType && item.blackName === blackName)
      config[funcNameList[type - 1]].insUsers['resource' + resourceType].blackList.splice(index, 1)
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
        let index = oldResList
          .findIndex(i => i.res === item.res && i.type === item.type)
        if (index < 0) {
          list.push(item)
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

  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      let config = ret.config

      let index = config[funcNameList[type - 1]].insUsers['resource' + resourceType].res.findIndex(item => item.res === resName && item.type === resType)
      config[funcNameList[type - 1]].insUsers['resource' + resourceType].res.splice(index, 1)
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

      insUsers.resource2.level = resource2.level
      insUsers.resource2.status = resource2.status

      insUsers.resource3.level = resource3.level
      insUsers.resource3.status = resource3.status
      dbapi.updateInsAccountConfigByAccount(account, config).then((updateRet) => {
        if (ret.serial) {
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
    blackName
  } = message

  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      log.info(`操作${funcNameList[type - 1]}的资源`)
      if (funcNameList[type - 1]) {
        let config = ret.config
        let resource = config[funcNameList[type - 1]].insUsers['resource' + resourceType]
        let blackList = resource.blackList || []

        // 该用户不存在黑名单中
        if (blackList.findIndex(i => i.blackName === blackName && i.res === resName && i.type === resType) < 0) {
          blackList.push({
            blackName,
            res: resName,
            type: resType
          })
          resource.blackList = blackList
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
  delUnfollowWhiteList
}
