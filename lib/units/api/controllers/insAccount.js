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

dbapi.getAllInsAccount().then(cursor => {
  return Promise.promisify(cursor.toArray, cursor)()
    .then(list => {
      schedule.initInsShedule(list)
    })
})

function getAllInsAccount(req, res) {
  dbapi.getAllInsAccount().then(cursor => {
    return Promise.promisify(cursor.toArray, cursor)()
      .then((list) => {
        let chain = []
        list.map((item) => {
          chain.push(getAccountDataService(item))
        })

        Promise.all(chain).then(() => {
          return res.json({
            success: true,
            data: list
          })
        })
      })
  })
}

function getAccountDataService(item) {
  return dbapi.getLogsByAccountData(item.account).then(cursor => {
    return Promise.promisify(cursor.toArray, cursor)()
      .then(logs => {
        let startTimestamp = Number(moment(moment().format('YYYY-MM-DD')))
        let endTimestamp = startTimestamp + 86400000

        // 关注
        let followLogs = logs.filter(item => item.type === 1 && item.status === 1)
        // eslint-disable-next-line max-len
        let todayFollow = followLogs.filter(item => item.created > startTimestamp && item.created < endTimestamp)

        // 取关
        let unfollowLogs = logs.filter(item => item.type === 2 && item.status === 1)
        // eslint-disable-next-line max-len
        let todayUnfollow = unfollowLogs.filter(item => item.created > startTimestamp && item.created < endTimestamp)

        // 点赞
        let thumbLogs = logs.filter(item => item.type === 3 && item.status === 1)
        // eslint-disable-next-line max-len
        let todayThumb = thumbLogs.filter(item => item.created > startTimestamp && item.created < endTimestamp)

        // 评论
        let commentLogs = logs.filter(item => item.type === 4 && item.status === 1)
        // eslint-disable-next-line max-len
        let todayComment = commentLogs.filter(item => item.created > startTimestamp && item.created < endTimestamp)

        // 私信
        let messageLogs = logs.filter(item => item.type === 5 && item.status === 1)
        // eslint-disable-next-line max-len
        let todayMessage = messageLogs.filter(item => item.created > startTimestamp && item.created < endTimestamp)

        // 发帖
        let postLogs = logs.filter(item => item.type === 6 && item.status === 1)
        // eslint-disable-next-line max-len
        let todayPost = postLogs.filter(item => item.created > startTimestamp && item.created < endTimestamp)

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
          schedule.updateInsJob(ret)
          insScript.checkStartScript(account, ret.serial, config, 1)
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
          schedule.updateInsJob(ret)
          insScript.checkStartScript(account, ret.serial, config, 2)
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
          schedule.updateInsJob(ret)
          insScript.checkStartScript(account, ret.serial, config, 3)
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
          schedule.updateInsJob(ret)
          insScript.checkStartScript(account, ret.serial, config, 4)
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
          schedule.updateInsJob(ret)
          insScript.checkStartScript(account, ret.serial, config, 5)
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

function getInsAccountByAccount(req, res) {
  let {account = ''} = req.params

  getInsAccountByAccountService(account).then(ret => {
    if (ret) {
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
  dbapi.updateInsAccountConfigByAccount(account, config).then(ret => {
    if (ret) {
      dbapi.getInsAccountByAccount(account).then(ret => {
        if (ret) {
          schedule.updateInsJob(ret)
          insScript.checkStartScript(account, ret.serial, config, type)
        }
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
              notes: device.notes
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
    nickname,
    msg,
    record,
    status,
    account
  } = log

  dbapi.saveLog({
    type,
    serial,
    nickname,
    record,
    msg,
    status,
    account
  })
}

function getAllLogs(req, res) {
  dbapi.getAllLogs()
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

  dbapi.getLogsByAccount(account, Number(type))
    .then(function(cursor) {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(function(list) {
          let totalPage = Math.ceil(list.length / limit)
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
                    , totalPage
                  })
                })
            })
            .catch(function(err) {
              log.error('Failed to get get logs by account limit: ', err.stack)
              res.status(500).json({
                success: false
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
    postTime,
    res: resText,
    title,
    type,
  } = req.body

  dbapi.updatePostById(id, {
    imgList,
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

module.exports = {
  getAllInsAccount,
  saveInsAccount,
  updateFollowState,
  updateUnFollowState,
  updateThumbState,
  updateCommentState,
  updateMessageState,
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
  delPostById
}
