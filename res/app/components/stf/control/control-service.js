module.exports = function ControlServiceFactory(
  $upload
  , $http
  , socket
  , TransactionService
  , $rootScope
  , gettext
  , KeycodesMapped
) {
  var controlService = {}

  // 一些定义方法的地方
  function ControlService(target, channel) {
    let sendOneWay = (action, data) => {
      if (typeof this.channel === 'string') {
        socket.emit(action, this.channel, data)
      } else {
        this.channel.map(item => {
          socket.emit(action, item, data)
        })
      }
    }

    // 很多指令在这里实现的
    function sendTwoWay(action, data) {
      if (target.length) {
        let promiseList = []
        target.map(device => {
          var tx = TransactionService.create(device)
          promiseList.push(tx.promise)
          socket.emit(action, device.channel, tx.channel, data)
        })

        return promiseList[0]
      } else {
        var tx = TransactionService.create(target)
        socket.emit(action, channel, tx.channel, data)
        return tx.promise
      }
    }

    function keySender(type, fixedKey) {
      return function (key) {
        if (typeof key === 'string') {
          sendOneWay(type, {
            key: key
          })
        } else {
          var mapped = fixedKey || KeycodesMapped[key]
          if (mapped) {
            sendOneWay(type, {
              key: mapped
            })
          }
        }
      }
    }

    this.channel = [channel]

    this.setChannel = (channel) => {
      this.channel = channel
    }

    this.gestureStart = function (seq) {
      sendOneWay('input.gestureStart', {
        seq: seq
      })
    }

    this.gestureStop = function (seq) {
      sendOneWay('input.gestureStop', {
        seq: seq
      })
    }

    this.touchDown = function (seq, contact, x, y, pressure) {
      sendOneWay('input.touchDown', {
        seq: seq
        , contact: contact
        , x: x
        , y: y
        , pressure: pressure
      })
    }

    this.touchMove = function (seq, contact, x, y, pressure) {
      sendOneWay('input.touchMove', {
        seq: seq
        , contact: contact
        , x: x
        , y: y
        , pressure: pressure
      })
    }

    this.touchUp = function (seq, contact) {
      sendOneWay('input.touchUp', {
        seq: seq
        , contact: contact
      })
    }

    this.touchCommit = function (seq) {
      sendOneWay('input.touchCommit', {
        seq: seq
      })
    }

    this.touchReset = function (seq) {
      sendOneWay('input.touchReset', {
        seq: seq
      })
    }

    this.keyDown = keySender('input.keyDown')
    this.keyUp = keySender('input.keyUp')
    this.keyPress = keySender('input.keyPress')

    this.home = keySender('input.keyPress', 'home')
    this.menu = keySender('input.keyPress', 'menu')
    this.back = keySender('input.keyPress', 'back')
    this.appSwitch = keySender('input.keyPress', 'app_switch')

    this.type = function (text) {
      return sendOneWay('input.type', {
        text: text
      })
    }

    this.paste = function (text) {
      console.log('text=' + text)
      return sendTwoWay('clipboard.paste', {
        text: text
      })
    }

    // 粘贴数据到手机输入框中
    this.setClipboardContent = function () {
      that.paste(that.clipboardContent).then(function (result) {
        $rootScope.$apply(function () {
          if (result.success) {
            if (result.lastData) {
              that.clipboardContent = ''
            }
          }
        })
      })
    }

    // 粘贴数据到手机输入框中
    this.setContent = function (content) {
      that.paste(content).then(function (result) {
        $rootScope.$apply(function () {
          if (result.success) {
            if (result.lastData) {
              // 粘贴 成功
            }
          }
        })
      })
    }

    this.copy = function () {
      return sendTwoWay('clipboard.copy')
    }

    //@TODO: 这里需要重构(就是有问题呗)
    var that = this
    this.getClipboardContent = function () {
      that.copy().then(function (result) {
        $rootScope.$apply(function () {
          if (result.success) {
            if (result.lastData) {
              that.clipboardContent = result.lastData
            } else {
              that.clipboardContent = gettext('No clipboard data')
            }
          } else {
            that.clipboardContent = gettext('Error while getting data')
          }
        })
      })
    }

    // 执行shell命令执行方法
    this.shell = function (command) {
      return sendTwoWay('shell.command', {
        command: command
        // 执行脚本的超时时间(执行功能的时候要给大一点 不然很快就超时了 原始值是10000)
        , timeout: 100000 * 60 * 1000
      })
    }

    this.identify = function () {
      return sendTwoWay('device.identify')
    }

    // 安装程序到手机中
    this.install = function (options) {
      return sendTwoWay('device.install', options)
    }

    // 导入图片到手机中
    this.push = function (options) {
      return sendTwoWay('device.push', options)
    }

    // 导入视频或者文件到手机中
    this.file = function (options) {
      return sendTwoWay('device.file', options)
    }

    this.uninstall = function (pkg) {
      return sendTwoWay('device.uninstall', {
        packageName: pkg
      })
    }

    this.reboot = function () {
      return sendTwoWay('device.reboot')
    }

    this.rotate = function (rotation, lock) {
      return sendOneWay('display.rotate', {
        rotation: rotation,
        lock: lock
      })
    }

    this.testForward = function (forward) {
      return sendTwoWay('forward.test', {
        targetHost: forward.targetHost
        , targetPort: Number(forward.targetPort)
      })
    }

    this.createForward = function (forward) {
      return sendTwoWay('forward.create', {
        id: forward.id
        , devicePort: Number(forward.devicePort)
        , targetHost: forward.targetHost
        , targetPort: Number(forward.targetPort)
      })
    }

    this.removeForward = function (forward) {
      return sendTwoWay('forward.remove', {
        id: forward.id
      })
    }

    this.startLogcat = function (filters) {
      return sendTwoWay('logcat.start', {
        filters: filters
      })
    }

    this.stopLogcat = function () {
      return sendTwoWay('logcat.stop')
    }

    this.startRemoteConnect = function () {
      return sendTwoWay('connect.start')
    }

    this.stopRemoteConnect = function () {
      return sendTwoWay('connect.stop')
    }

    this.openBrowser = function (url, browser) {
      return sendTwoWay('browser.open', {
        url: url
        , browser: browser ? browser.id : null
      })
    }

    this.clearBrowser = function (browser) {
      return sendTwoWay('browser.clear', {
        browser: browser.id
      })
    }

    this.openStore = function () {
      return sendTwoWay('store.open')
    }

    this.screenshot = function () {
      return sendTwoWay('screen.capture')
    }

    this.fsretrieve = function (file) {
      return sendTwoWay('fs.retrieve', {
        file: file
      })
    }

    this.fslist = function (dir) {
      return sendTwoWay('fs.list', {
        dir: dir
      })
    }

    this.checkAccount = function (type, account) {
      return sendTwoWay('account.check', {
        type: type
        , account: account
      })
    }

    this.removeAccount = function (type, account) {
      return sendTwoWay('account.remove', {
        type: type
        , account: account
      })
    }

    this.addAccountMenu = function () {
      return sendTwoWay('account.addmenu')
    }

    this.addAccount = function (user, password) {
      return sendTwoWay('account.add', {
        user: user
        , password: password
      })
    }

    this.getAccounts = function (type) {
      return sendTwoWay('account.get', {
        type: type
      })
    }

    this.getSdStatus = function () {
      return sendTwoWay('sd.status')
    }

    this.setRingerMode = function (mode) {
      return sendTwoWay('ringer.set', {
        mode: mode
      })
    }

    this.getRingerMode = function () {
      return sendTwoWay('ringer.get')
    }

    this.setWifiEnabled = function (enabled) {
      return sendTwoWay('wifi.set', {
        enabled: enabled
      })
    }

    this.getWifiStatus = function () {
      return sendTwoWay('wifi.get')
    }

    window.cc = this
  }

  controlService.create = function (target, channel) {
    let control = new ControlService(target, channel)
    control.setChannel(channel)
    return control
  }

  return controlService
}
