var syrup = require('stf-syrup')
var Promise = require('bluebird')
var _ = require('lodash')

var logger = require('../../../util/logger')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../resources/service'))
  .dependency(require('./group'))
  .define(function (options, adb, service, group) {
    var log = logger.createLogger('device:plugins:cleanup')
    var plugin = Object.create(null)

    if (!options.cleanup) {
      return plugin
    }

    function listPackages() {
      return adb.getPackages(options.serial)
    }

    // 有个不知道是不是bug的东西 每次通过系统安装app后 停止后再使用安装的app就没有 就是这里删除的
    function uninstallPackage(pkg) {
      log.info('Cleaning up package "%s"', pkg)
      return adb.uninstall(options.serial, pkg)
        .catch(function (err) {
          log.warn('Unable to clean up package "%s"', pkg, err)
          return true
        })
    }

    return listPackages()
      .then(function (initialPackages) {
        initialPackages.push(service.mhPkg)

        plugin.removePackages = function () {
          return true
          // 下面的逻辑是卸载与之前不一样的包信息
          // return listPackages()
          // .then(function(currentPackages) {
          //   var remove = _.difference(currentPackages, initialPackages)
          //   return Promise.map(remove, uninstallPackage)
          // })
        }

        group.on('leave', function () {
          plugin.removePackages()
        })
      })
      .return(plugin)
  })
