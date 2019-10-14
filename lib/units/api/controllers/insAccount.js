var util = require('util')

var _ = require('lodash')
var Promise = require('bluebird')
var uuid = require('uuid')
var adbkit = require('adbkit')
var dbapi = require('../../../db/api')
var logger = require('../../../util/logger')
var datautil = require('../../../util/datautil')
var deviceutil = require('../../../util/deviceutil')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var wirerouter = require('../../../wire/router')

var log = logger.createLogger('api:controllers:insAccount')

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
    console.log(insAccount)
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
      dbapi.updateInsAccountConfigByAccount(account, config).then(ret => {
        if (ret) {
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
}

function updateUnFollowState(req, res) {
  let {account = '', status = 0} = req.body
  dbapi.getInsAccountByAccount(account).then(ret => {
    if (ret) {
      let config = ret.config
      config.unfollow.status = status
      dbapi.updateInsAccountConfigByAccount(account, config).then(ret => {
        if (ret) {
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
}

module.exports = {
  getAllInsAccount,
  saveInsAccount,
  updateFollowState,
  updateUnFollowState,
  getInsAccountByAccount
}
