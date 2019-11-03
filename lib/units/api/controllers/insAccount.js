var util = require('util')

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
      .then(list => {
        return res.json({
          success: true,
          data: list
        })
      })
  })
}

function saveInsAccount(req, res) {
  let {account = ''} = req.body

  dbapi.getInsAccountByAccount(account).then(insAccount => {
    if (insAccount) {
      return res.status(404).json({
        success: false
        , msg: '该账号已存在'
      })
    }
    else {
      dbapi.saveInsAccount(account)
        .then(ret => {
          if(ret) {
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
  })
}

function updateFollowState(req, res) {
  let {account = '', status = 0} = req.body
  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      let config = ret.config
      config.follow.status = status
      dbapi.updateInsAccountConfigByAccount(account, config).then(updateRet => {
        if (updateRet) {
          schedule.updateInsJob(ret)
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

function updateUnFollowState(req, res) {
  let {account = '', status = 0} = req.body
  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      let config = ret.config
      config.unfollow.status = status
      dbapi.updateInsAccountConfigByAccount(account, config).then(updateRet => {
        if (updateRet) {
          schedule.updateInsJob(ret)
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
  dbapi.getInsAccountByAccount(account).then(ret => {
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

function updateInsAccountConfigByAccount(req, res) {
  let {account = '', config} = req.body
  dbapi.updateInsAccountConfigByAccount(account, config).then(ret => {
    if (ret) {
      dbapi.getInsAccountByAccount(account).then(ret => {
        if (ret) {
          schedule.updateInsJob(ret)
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
    status
  } = log

  dbapi.saveLog({
    type,
    serial,
    nickname,
    record,
    msg,
    status
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

  dbapi.getLogsBySerial(account, Number(type))
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

module.exports = {
  getAllInsAccount,
  saveInsAccount,
  updateFollowState,
  updateUnFollowState,
  getInsAccountByAccount,
  updateInsAccountConfigByAccount,
  getAllDevice,
  updateInsAccountSerialByAccount,
  delInsAccount,
  saveLog,
  getAllLogs,
  getLogsBySerial,
  getDeviceNameByAccount,
  getLogsByAccountLimit
}
