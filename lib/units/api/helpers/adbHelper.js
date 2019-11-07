const adbkit = require('adbkit')
let adb

module.exports = {
  create() {
    if (!adb) {
      adb = adbkit.createClient({
        host: '127.0.0.1'
        , port: '5037'
      })
      adb.Keycode = adbkit.Keycode
    }
    return adb
  }
}
