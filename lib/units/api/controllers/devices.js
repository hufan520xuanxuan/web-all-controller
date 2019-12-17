var _ = require('lodash')
var Promise = require('bluebird')

var dbapi = require('../../../db/api')
var logger = require('../../../util/logger')
var datautil = require('../../../util/datautil')

var log = logger.createLogger('api:controllers:devices')

module.exports = {
  getDevices: getDevices
, getDeviceBySerial: getDeviceBySerial,
  setMainDevice,
  cancelMainDevice
}

function getDevices(req, res) {
  var fields = req.swagger.params.fields.value

  dbapi.loadDevices()
    .then(function(cursor) {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(async function(list) {
          var deviceList = []

          // await list.forEach(async function(device) {
          //   datautil.normalize(device, req.user)
          //   var responseDevice
          //   if((req.user.devices.length && req.user.devices.includes(device.serial)) ||
          //     req.user.admin) {
          //     let cursor = await dbapi.getUserBySerial(device.serial)
          //     let users = await Promise.promisify(cursor.toArray, cursor)()
          //     device.user = users.length ? users[0].email : ''
          //     console.log(device.user)
          //     responseDevice = device
          //   }
          //   if (fields) {
          //     responseDevice = _.pick(device, fields.split(','))
          //   }
          //   if (responseDevice) {
          //     console.log(responseDevice)
          //     deviceList.push(responseDevice)
          //   }
          // })

          for (let device of list) {
            datautil.normalize(device, req.user)
            var responseDevice
            if((req.user.devices.length && req.user.devices.includes(device.serial)) ||
              req.user.admin) {
              let cursor = await dbapi.getUserBySerial(device.serial)
              let users = await Promise.promisify(cursor.toArray, cursor)()
              device.user = users.length ? users[0].email : ''
              if (req.user.admin && (device.owner && device.owner.email !== req.user.email)) {
                device.owner.email = req.user.email
                device.owner.name = req.user.name
                device.owner.group = req.user.group
                device.using = true
                device.adminUsing = true
              }
              responseDevice = device
            }
            if (fields) {
              responseDevice = _.pick(device, fields.split(','))
            }
            if (responseDevice) {
              deviceList.push(responseDevice)
            }
          }

          console.log(deviceList)
          res.json({
            success: true
          , devices: deviceList
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

function getDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value
  var fields = req.swagger.params.fields.value

  dbapi.loadDevice(serial)
    .then(function(device) {
      if (!device) {
        return res.status(404).json({
          success: false
        , description: 'Device not found'
        })
      }

      datautil.normalize(device, req.user)
      var responseDevice = device

      if (fields) {
        responseDevice = _.pick(device, fields.split(','))
      }

      res.json({
        success: true
      , device: responseDevice
      })
    })
    .catch(function(err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function setMainDevice(req, res) {
  let {serial = '', oldSerial = ''} = req.body
  dbapi.setMainDevice(serial).then(ret => {
    if (ret) {
      dbapi.cancelMainDevice(oldSerial).then(ret => {
        if (ret) {
          return res.json({
            success: true
          })
        }
      })
    }
  })
}

function cancelMainDevice(req, res) {
  let {serial = ''} = req.body
  dbapi.cancelMainDevice(serial).then(ret => {
    if (ret) {
      return res.json({
        success: true
      })
    }
  })
}
