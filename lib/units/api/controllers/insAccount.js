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

module.exports = {
  getAllInsAccount,
  saveInsAccount
}

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

