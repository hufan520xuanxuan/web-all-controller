var util = require('util')
var events = require('events')

var syrup = require('stf-syrup')
var Promise = require('bluebird')

var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var devutil = require('../../../util/devutil')
var keyutil = require('../../../util/keyutil')
var streamutil = require('../../../util/streamutil')
var logger = require('../../../util/logger')
var ms = require('../../../wire/messagestream')
var lifecycle = require('../../../util/lifecycle')
const insAccountController = require('../../api/controllers/insAccount')
const insScript = require('../../api/helpers/insScriptHelper')
// const moment = require('moment')
const golbalData = require('../../api/helpers/golbalDataHelper')

// 处理移动端service的地方 交互都放在这里面
function MessageResolver() {
  this.resolvers = Object.create(null)

  this.await = function(id, resolver) {
    this.resolvers[id] = resolver
    return resolver.promise
  }

  this.resolve = function(id, value) {
    var resolver = this.resolvers[id]
    delete this.resolvers[id]
    resolver.resolve(value)
    return resolver.promise
  }
}

// 自动执行的这里？
module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('../resources/service'))
  .define(function(options, adb, router, push, apk) {
    var log = logger.createLogger('device:plugins:service')
    var messageResolver = new MessageResolver()
    var plugin = new events.EventEmitter()

    // 与移动端进行长连接(mhService中的Agent)
    var agent = {
      socket: null
      , writer: null
      , sock: 'localabstract:stfagent'
    }

    // 与移动端进行长连接(mhService)
    var service = {
      socket: null
      , writer: null
      , reader: null
      , sock: 'localabstract:mhservice'
    }

    // 与移动端进行长连接(InsService)
    var ins = {
      socket: null
      , writer: null
      , reader: null
      , sock: 'localabstract:InsService'
    }

    function stopAgent() {
      return devutil.killProcsByComm(
        adb
        , options.serial
        , 'stf.agent'
        , 'stf.agent'
      )
    }

    // 唤起service的地方呗
    function callService(intent) {
      return adb.shell(options.serial, util.format(
        'am startservice --user 0 %s'
        , intent
      ))
        .timeout(15000)
        .then(function(out) {
          return streamutil.findLine(out, /^Error/)
            .finally(function() {
              out.end()
            })
            .timeout(10000)
            .then(function(line) {
              if (line.indexOf('--user') !== -1) {
                return adb.shell(options.serial, util.format(
                  'am startservice %s'
                  , intent
                ))
                  .timeout(15000)
                  .then(function() {
                    return streamutil.findLine(out, /^Error/)
                      .finally(function() {
                        out.end()
                      })
                      .timeout(10000)
                      .then(function(line) {
                        log.info('第一个地方报错')
                        throw new Error(util.format(
                          'Service had an error: "%s"'
                          , line
                        ))
                      })
                      .catch(streamutil.NoSuchLineError, function() {
                        return true
                      })
                  })
              }
              else {
                log.info('第二个地方报错')
                //试试删掉应用
                // uninstallTry(intent)
                throw new Error(util.format(
                  'Service had an error: "%s"'
                  , line
                ))
              }
            })
            .catch(streamutil.NoSuchLineError, function() {
              return true
            })
        })
    }

    function prepareForServiceDeath(conn) {
      function endListener() {
        var startTime = Date.now()
        log.important('Service connection ended, attempting to relaunch')

        /* eslint no-use-before-define: 0 */
        openService()
          .timeout(5000)
          .then(function() {
            log.important('Service relaunched in %dms', Date.now() - startTime)
          })
          .catch(function(err) {
            log.fatal('Service connection could not be relaunched', err.stack)
            lifecycle.fatal()
          })
      }

      conn.once('end', endListener)

      conn.on('error', function(err) {
        log.fatal('Service connection had an error', err.stack)
        lifecycle.fatal()
      })
    }

    // 处理和移动端数据想通的地方
    function handleEnvelope(data) {
      var envelope = apk.wire.Envelope.decode(data)
      // log.error('服务端收到数据=' + envelope.id + '=' + envelope.type)

      var message
      if (envelope.id !== null) {
        messageResolver.resolve(envelope.id, envelope.message)
      }
      else {
        switch (envelope.type) {
          case apk.wire.MessageType.EVENT_SHELL_REPORT:
            let msg = apk.wire.ShellReportEvent.decode(envelope.message)
            message = JSON.parse(msg.msg)
            log.error('shoudaoshuju111', message)
            insAccountController.saveLog({
              ...message,
              serial: options.serial
            })
            log.error('shoudaoshuju')
            log.error('服务端收到客户端数据=' + options.resourceType + options.serial + message.type + '=' + message.serial + '=' + message.msg + '='
              + message.nickname + '=' + message.record + '=' + message.status)
            // 这里是手机端执行Shell指令传过来的反馈数据 要显示到日志里面去
            checkInsMessage(options.serial, message)
            break
          case apk.wire.MessageType.EVENT_AIRPLANE_MODE:
            message = apk.wire.AirplaneModeEvent.decode(envelope.message)
            push.send([
              wireutil.global
              , wireutil.envelope(new wire.AirplaneModeEvent(
                options.serial
                , message.enabled
              ))
            ])
            plugin.emit('airplaneModeChange', message)
            break
          case apk.wire.MessageType.EVENT_BATTERY:
            message = apk.wire.BatteryEvent.decode(envelope.message)
            push.send([
              wireutil.global
              , wireutil.envelope(new wire.BatteryEvent(
                options.serial
                , message.status
                , message.health
                , message.source
                , message.level
                , message.scale
                , message.temp
                , message.voltage
              ))
            ])
            plugin.emit('batteryChange', message)
            break
          case apk.wire.MessageType.EVENT_BROWSER_PACKAGE:
            message = apk.wire.BrowserPackageEvent.decode(envelope.message)
            plugin.emit('browserPackageChange', message)
            break
          case apk.wire.MessageType.EVENT_CONNECTIVITY:
            message = apk.wire.ConnectivityEvent.decode(envelope.message)
            push.send([
              wireutil.global
              , wireutil.envelope(new wire.ConnectivityEvent(
                options.serial
                , message.connected
                , message.type
                , message.subtype
                , message.failover
                , message.roaming
              ))
            ])
            plugin.emit('connectivityChange', message)
            break
          case apk.wire.MessageType.EVENT_PHONE_STATE:
            message = apk.wire.PhoneStateEvent.decode(envelope.message)
            push.send([
              wireutil.global
              , wireutil.envelope(new wire.PhoneStateEvent(
                options.serial
                , message.state
                , message.manual
                , message.operator
              ))
            ])
            plugin.emit('phoneStateChange', message)
            break
          case apk.wire.MessageType.EVENT_ROTATION:
            message = apk.wire.RotationEvent.decode(envelope.message)
            push.send([
              wireutil.global
              , wireutil.envelope(new wire.RotationEvent(
                options.serial
                , message.rotation
              ))
            ])
            plugin.emit('rotationChange', message)
            break
        }
      }
      console.log(message)
    }

    /**
     * 检查Ins消息数据
     * @param serial
     * @param message
     */
    function checkInsMessage(serial, message) {
      let {
        type,
        status,
        account,
        record,
      } = message

      // 判断脚本执行错误
      if (status === 5) {
        console.log('脚本错误------------->', message)
        insScript.stop(serial)
        let restart = () => {
          insAccountController.getInsAccountByAccountService(account).then(insAccount => {
            // switch (+type) {
            //   case 1:
            //     // 关注
            //     // console.log('时间范围', insAccount.config.follow.excute)
            //     // var validTime = moment().isBetween(today + insAccount.config.follow.excute.start, today + insAccount.config.follow.excute.end)
            //     // if (validTime) {
            //     //   log.info('有效时间范围内，重新执行脚本')
            //     //   insScript.startFollow(account, serial, insAccount.config.follow)
            //     // }
            //     // else {
            //     //   log.info('不在有效时间范围内，不重新执行脚本')
            //     // }
            //     insScript.checkStartScript(account, serial, insAccount.config, 1)
            //     break
            //   case 2:
            //     // 取关
            //     // var validTime = moment().isBetween(today + insAccount.config.unfollow.excute.start, today + insAccount.config.unfollow.excute.end)
            //     // if (validTime) {
            //     //   log.info('有效时间范围内，重新执行脚本')
            //     //   insScript.startUnfollow(account, serial, insAccount.config.unfollow)
            //     // }
            //     // else {
            //     //   log.info('不在有效时间范围内，不重新执行脚本')
            //     // }
            //     insScript.checkStartScript(account, serial, insAccount.config, 2)
            //     break
            //   case 3:
            //     // 点赞
            //     // console.log('时间范围', insAccount.config.thumb.excute)
            //     // var validTime = moment().isBetween(today + insAccount.config.thumb.excute.start, today + insAccount.config.thumb.excute.end)
            //     // if (validTime) {
            //     //   log.info('有效时间范围内，重新执行脚本')
            //     //   insScript.startThumb(account, serial, insAccount.config.thumb)
            //     // }
            //     // else {
            //     //   log.info('不在有效时间范围内，不重新执行脚本')
            //     // }
            //     insScript.checkStartScript(account, serial, insAccount.config, 3)
            //     break
            // }
            let funcType = ''
            switch(+type) {
              case 1:
                funcType = '_follow'
                break
              case 2:
                funcType = '_unfollow'
                break
              case 3:
                funcType = '_thumb'
                break
              case 4:
                funcType = '_comment'
                break
              case 5:
                funcType = '_message'
                break
            }
            if (funcType) {
              golbalData.set(serial + funcType, {record})
            }

            insScript.checkStartScript(account, serial, insAccount.config, type, true)
          })
        }

        // 随机5-10秒内重启脚本
        let timeout = Math.floor(Math.random() * (15 - 5 + 1)) + 5
        log.info(timeout, '秒后重启脚本')
        setTimeout(() => {
          restart()
        }, timeout * 1000)
      } else if(status === 4) {
        insAccountController.closeResource(serial, message)
      } else if(status === 7) {
        // 黑名单
        insAccountController.putBlackList(serial, message)
      } else if(type === 6 && status === 2) {
        // 发帖成功
        insAccountController.updatePostResource(serial, message)
      }
      // else if (status === 2) {
      //   // 脚本执行成功
      //   if (type < 8) {
      //     // 检查是否执行统计脚本
      //     insScript.checkStatistics(account, serial)
      //   }
      // }
    }

    // 在安装apk后会启动的意思
    function openService() {
      log.info('Launching service')
      return callService(util.format(
        '-a \'%s\' -n \'%s\''
        , apk.startIntent.action
        , apk.startIntent.component
      ))
        .then(function() {
          return devutil.waitForLocalSocket(adb, options.serial, service.sock)
            .timeout(15000)
        })
        .then(function(conn) {
          service.socket = conn
          service.reader = conn.pipe(new ms.DelimitedStream())
          service.reader.on('data', handleEnvelope)
          service.writer = new ms.DelimitingStream()
          service.writer.pipe(conn)
          return prepareForServiceDeath(conn)
        })
    }

    // 在安装apk后会启动的意思
    function openIns() {
      log.info('Launching ins')
      return callService(util.format(
        '-a \'%s\' -n \'%s\''
        , 'com.phone.mhzk.ACTION_START'
        , 'com.phone.mhzk/.InsService'
      ))
        .then(function() {
          return devutil.waitForLocalSocket(adb, options.serial, ins.sock)
            .timeout(15000)
        })
        .then(function(conn) {
          ins.socket = conn
          ins.reader = conn.pipe(new ms.DelimitedStream())
          log.error('连接上了 conn对象=')
          ins.reader.on('data', data => {
          })

          // todo 这里看能不能读取到我app里面发来的数据\

          return prepareForServiceDeath(conn)
        })
    }

    // 心跳包？
    function prepareForAgentDeath(conn) {
      function endListener() {
        var startTime = Date.now()
        log.important('Agent connection ended, attempting to relaunch')
        openService()
          .timeout(5000)
          .then(function() {
            log.important('Agent relaunched in %dms', Date.now() - startTime)
          })
          .catch(function(err) {
            log.fatal('Agent connection could not be relaunched', err.stack)
            lifecycle.fatal()
          })
      }

      conn.once('end', endListener)

      conn.on('error', function(err) {
        log.fatal('Agent connection had an error', err.stack)
        lifecycle.fatal()
      })
    }

    // 运行mhService中Agent(java main程序)
    function openAgent() {
      log.info('Launching agent')
      return stopAgent()
        .timeout(15000)
        .then(function() {
          return devutil.ensureUnusedLocalSocket(adb, options.serial, agent.sock)
            .timeout(10000)
        })
        .then(function() {
          return adb.shell(options.serial, util.format(
            'export CLASSPATH=\'%s\'; exec app_process /system/bin \'%s\''
            , apk.path
            , apk.main
          ))
            .timeout(10000)
        })
        .then(function(out) {
          streamutil.talk(log, 'Agent says: "%s"', out)
        })
        .then(function() {
          return devutil.waitForLocalSocket(adb, options.serial, agent.sock)
            .timeout(10000)
        })
        .then(function(conn) {
          agent.socket = conn
          agent.writer = new ms.DelimitingStream()
          agent.writer.pipe(conn)
          return prepareForAgentDeath(conn)
        })
    }

    function runAgentCommand(type, cmd) {
      agent.writer.write(new apk.wire.Envelope(
        null
        , type
        , cmd.encodeNB()
      ).encodeNB())
    }

    function keyEvent(data) {
      return runAgentCommand(
        apk.wire.MessageType.DO_KEYEVENT
        , new apk.wire.KeyEventRequest(data)
      )
    }

    plugin.type = function(text) {
      return runAgentCommand(
        apk.wire.MessageType.DO_TYPE
        , new apk.wire.DoTypeRequest(text)
      )
    }

    plugin.paste = function(text) {
      return plugin.setClipboard(text)
        .delay(500) // Give it a little bit of time to settle.
        .then(function() {
          keyEvent({
            event: apk.wire.KeyEvent.PRESS
            , keyCode: adb.Keycode.KEYCODE_V
            , ctrlKey: true
          })
        })
    }

    plugin.copy = function() {
      // @TODO Not sure how to force the device to copy the current selection
      // yet.
      return plugin.getClipboard()
    }

    // 执行命令
    function runServiceCommand(type, cmd) {
      var resolver = Promise.defer()
      var id = Math.floor(Math.random() * 0xFFFFFF)
      // log.error('传递了=' + new apk.wire.Envelope(
      //   id
      //   , type
      //   , cmd.encodeNB()
      // ))
      service.writer.write(new apk.wire.Envelope(
        id
        , type
        , cmd.encodeNB()
      ).encodeNB())
      return messageResolver.await(id, resolver)
    }

    // 获取屏幕数据
    plugin.getDisplay = function(id) {
      return runServiceCommand(
        apk.wire.MessageType.GET_DISPLAY
        , new apk.wire.GetDisplayRequest(id)
      )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.GetDisplayResponse.decode(data)
          if (response.success) {
            return {
              id: id
              , width: response.width
              , height: response.height
              , xdpi: response.xdpi
              , ydpi: response.ydpi
              , fps: response.fps
              , density: response.density
              , rotation: response.rotation
              , secure: response.secure
              , size: Math.sqrt(
                Math.pow(response.width / response.xdpi, 2) +
                Math.pow(response.height / response.ydpi, 2)
              )
            }
          }
          throw new Error('Unable to retrieve display information')
        })
    }

    plugin.wake = function() {
      return runAgentCommand(
        apk.wire.MessageType.DO_WAKE
        , new apk.wire.DoWakeRequest()
      )
    }

    plugin.rotate = function(rotation) {
      return runAgentCommand(
        apk.wire.MessageType.SET_ROTATION
        , new apk.wire.SetRotationRequest(rotation, options.lockRotation || false)
      )
    }

    plugin.freezeRotation = function(rotation) {
      return runAgentCommand(
        apk.wire.MessageType.SET_ROTATION
        , new apk.wire.SetRotationRequest(rotation, true)
      )
    }

    plugin.thawRotation = function() {
      return runAgentCommand(
        apk.wire.MessageType.SET_ROTATION
        , new apk.wire.SetRotationRequest(0, false)
      )
    }

    plugin.version = function() {
      return runServiceCommand(
        apk.wire.MessageType.GET_VERSION
        , new apk.wire.GetVersionRequest()
      )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.GetVersionResponse.decode(data)
          if (response.success) {
            return response.version
          }
          throw new Error('Unable to retrieve version')
        })
    }

    plugin.unlock = function() {
      return runServiceCommand(
        apk.wire.MessageType.SET_KEYGUARD_STATE
        , new apk.wire.SetKeyguardStateRequest(false)
      )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.SetKeyguardStateResponse.decode(data)
          if (!response.success) {
            throw new Error('Unable to unlock device')
          }
        })
    }

    plugin.lock = function() {
      return runServiceCommand(
        apk.wire.MessageType.SET_KEYGUARD_STATE
        , new apk.wire.SetKeyguardStateRequest(true)
      )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.SetKeyguardStateResponse.decode(data)
          if (!response.success) {
            throw new Error('Unable to lock device')
          }
        })
    }

    plugin.acquireWakeLock = function() {
      return runServiceCommand(
        apk.wire.MessageType.SET_WAKE_LOCK
        , new apk.wire.SetWakeLockRequest(true)
      )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.SetWakeLockResponse.decode(data)
          if (!response.success) {
            throw new Error('Unable to acquire WakeLock')
          }
        })
    }

    plugin.releaseWakeLock = function() {
      return runServiceCommand(
        apk.wire.MessageType.SET_WAKE_LOCK
        , new apk.wire.SetWakeLockRequest(false)
      )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.SetWakeLockResponse.decode(data)
          if (!response.success) {
            throw new Error('Unable to release WakeLock')
          }
        })
    }

    plugin.identity = function() {
      return runServiceCommand(
        apk.wire.MessageType.DO_IDENTIFY
        , new apk.wire.DoIdentifyRequest(options.serial)
      )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.DoIdentifyResponse.decode(data)
          if (!response.success) {
            throw new Error('Unable to identify device')
          }
        })
    }

    plugin.setClipboard = function(text) {
      return runServiceCommand(
        apk.wire.MessageType.SET_CLIPBOARD
        , new apk.wire.SetClipboardRequest(
          apk.wire.ClipboardType.TEXT
          , text
        )
      )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.SetClipboardResponse.decode(data)
          if (!response.success) {
            throw new Error('Unable to set clipboard')
          }
        })
    }

    plugin.getClipboard = function() {
      return runServiceCommand(
        apk.wire.MessageType.GET_CLIPBOARD
        , new apk.wire.GetClipboardRequest(
          apk.wire.ClipboardType.TEXT
        )
      )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.GetClipboardResponse.decode(data)
          if (response.success) {
            switch (response.type) {
              case apk.wire.ClipboardType.TEXT:
                log.error('获取剪切板文字=' + response.text)
                return response.text
            }
          }
          throw new Error('Unable to get clipboard')
        })
    }

    plugin.getBrowsers = function() {
      return runServiceCommand(
        apk.wire.MessageType.GET_BROWSERS
        , new apk.wire.GetBrowsersRequest()
      )
        .timeout(15000)
        .then(function(data) {
          var response = apk.wire.GetBrowsersResponse.decode(data)
          if (response.success) {
            delete response.success
            return response
          }
          throw new Error('Unable to get browser list')
        })
    }

    plugin.getProperties = function(properties) {
      return runServiceCommand(
        apk.wire.MessageType.GET_PROPERTIES
        , new apk.wire.GetPropertiesRequest(properties)
      )
        .timeout(15000)
        .then(function(data) {
          var response = apk.wire.GetPropertiesResponse.decode(data)
          if (response.success) {
            var mapped = Object.create(null)
            response.properties.forEach(function(property) {
              mapped[property.name] = property.value
            })
            return mapped
          }
          throw new Error('Unable to get properties')
        })
    }

    plugin.getAccounts = function(data) {
      return runServiceCommand(
        apk.wire.MessageType.GET_ACCOUNTS
        , new apk.wire.GetAccountsRequest({type: data.type})
      )
        .timeout(15000)
        .then(function(data) {
          var response = apk.wire.GetAccountsResponse.decode(data)
          if (response.success) {
            return response.accounts
          }
          throw new Error('No accounts returned')
        })
    }

    plugin.removeAccount = function(data) {
      return runServiceCommand(
        apk.wire.MessageType.DO_REMOVE_ACCOUNT
        , new apk.wire.DoRemoveAccountRequest({
          type: data.type
          , account: data.account
        })
      )
        .timeout(15000)
        .then(function(data) {
          var response = apk.wire.DoRemoveAccountResponse.decode(data)
          if (response.success) {
            return true
          }
          throw new Error('Unable to remove account')
        })
    }

    plugin.addAccountMenu = function() {
      return runServiceCommand(
        apk.wire.MessageType.DO_ADD_ACCOUNT_MENU
        , new apk.wire.DoAddAccountMenuRequest()
      )
        .timeout(15000)
        .then(function(data) {
          var response = apk.wire.DoAddAccountMenuResponse.decode(data)
          if (response.success) {
            return true
          }
          throw new Error('Unable to show add account menu')
        })
    }

    plugin.setRingerMode = function(mode) {
      return runServiceCommand(
        apk.wire.MessageType.SET_RINGER_MODE
        , new apk.wire.SetRingerModeRequest(mode)
      )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.SetRingerModeResponse.decode(data)
          if (!response.success) {
            throw new Error('Unable to set ringer mode')
          }
        })
    }

    plugin.getRingerMode = function() {
      return runServiceCommand(
        apk.wire.MessageType.GET_RINGER_MODE
        , new apk.wire.GetRingerModeRequest()
      )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.GetRingerModeResponse.decode(data)
          // Reflection to decode enums to their string values, otherwise
          // we only get an integer
          var ringerMode = apk.builder.lookup(
            'jp.co.cyberagent.stf.proto.RingerMode')
            .children[response.mode].name
          if (response.success) {
            return ringerMode
          }
          throw new Error('Unable to get ringer mode')
        })
    }

    plugin.setWifiEnabled = function(enabled) {
      return runServiceCommand(
        apk.wire.MessageType.SET_WIFI_ENABLED
        , new apk.wire.SetWifiEnabledRequest(enabled)
      )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.SetWifiEnabledResponse.decode(data)
          if (!response.success) {
            throw new Error('Unable to set Wifi')
          }
        })
    }

    plugin.getWifiStatus = function() {
      return runServiceCommand(
        apk.wire.MessageType.GET_WIFI_STATUS
        , new apk.wire.GetWifiStatusRequest()
      )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.GetWifiStatusResponse.decode(data)
          if (response.success) {
            return response.status
          }
          throw new Error('Unable to get Wifi status')
        })
    }

    plugin.getSdStatus = function() {
      return runServiceCommand(
        apk.wire.MessageType.GET_SD_STATUS
        , new apk.wire.GetSdStatusRequest()
      )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.GetSdStatusResponse.decode(data)
          if (response.success) {
            return response.mounted
          }
          throw new Error('Unable to get SD card status')
        })
    }

    plugin.pressKey = function(key) {
      keyEvent({event: apk.wire.KeyEvent.PRESS, keyCode: keyutil.namedKey(key)})
      return Promise.resolve(true)
    }

    plugin.setMasterMute = function(mode) {
      return runServiceCommand(
        apk.wire.MessageType.SET_MASTER_MUTE
        , new apk.wire.SetMasterMuteRequest(mode)
      )
        .timeout(10000)
        .then(function(data) {
          var response = apk.wire.SetMasterMuteResponse.decode(data)
          if (!response.success) {
            throw new Error('Unable to set master mute')
          }
        })
    }

    return openAgent()
      .then(openService)
      // 这里启动脚本执行的service
      // .then(openIns())
      .then(function() {
        router
          .on(wire.PhysicalIdentifyMessage, function(channel) {
            var reply = wireutil.reply(options.serial)
            plugin.identity()
            push.send([
              channel
              , reply.okay()
            ])
          })
          .on(wire.KeyDownMessage, function(channel, message) {
            try {
              keyEvent({
                event: apk.wire.KeyEvent.DOWN
                , keyCode: keyutil.namedKey(message.key)
              })
            } catch (e) {
              log.warn(e.message)
            }
          })
          .on(wire.KeyUpMessage, function(channel, message) {
            try {
              keyEvent({
                event: apk.wire.KeyEvent.UP
                , keyCode: keyutil.namedKey(message.key)
              })
            } catch (e) {
              log.warn(e.message)
            }
          })
          .on(wire.KeyPressMessage, function(channel, message) {
            try {
              keyEvent({
                event: apk.wire.KeyEvent.PRESS
                , keyCode: keyutil.namedKey(message.key)
              })
            } catch (e) {
              log.warn(e.message)
            }
          })
          .on(wire.TypeMessage, function(channel, message) {
            plugin.type(message.text)
          })
          .on(wire.RotateMessage, function(channel, message) {
            plugin.rotate(message.rotation)
          })
      })
      .return(plugin)
  })
