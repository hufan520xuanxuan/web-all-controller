var util = require('util')
var syrup = require('stf-syrup')
var ProtoBuf = require('protobufjs')
var semver = require('semver')
var pathutil = require('../../../util/pathutil')
var streamutil = require('../../../util/streamutil')
var promiseutil = require('../../../util/promiseutil')
var logger = require('../../../util/logger')

// 初始化安装必须的软件服务
module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .define(function (options, adb) {
    var log = logger.createLogger('device:resources:service')
    var builder = ProtoBuf.loadProtoFile(
      pathutil.vendor('MHService/wire.proto'))

    // 手机apk安装信息
    var resource = {
      zkPkg: 'com.phone.mhzk'
      , zkApk: pathutil.vendor('mhzk/mhzk.apk')
      , zkTestPkg: 'com.phone.mhzk.test'
      , zkTestApk: pathutil.vendor('mhzk/mhzk_test.apk')
      , dkVersion: '终结版'
      , dkPkg: 'com.bly.dkplat'
      , dkApk: pathutil.vendor('mhzk/dkfs.apk')
      , mhVersion: '2.4.3'
      , mhPkg: 'jp.co.cyberagent.stf'
      , main: 'jp.co.cyberagent.stf.Agent'
      , apk: pathutil.vendor('MHService/MHService.apk')
      , wire: builder.build().jp.co.cyberagent.stf.proto
      , builder: builder
      , startIntent: {
        action: 'jp.co.cyberagent.stf.ACTION_START'
        , component: 'jp.co.cyberagent.stf/.Service'
      }
    }

    // 返回一个地址(日志显示: /data/app/jp.co.cyberagent.stf-UkhQqKhqE5Nk2eH65Xq9IA==/base.apk)
    function getPath() {
      return adb.shell(options.serial, ['pm', 'path', resource.mhPkg])
        .timeout(10000)
        .then(function (out) {
          return streamutil.findLine(out, (/^package:/))
            .timeout(15000)
            .then(function (line) {
              return line.substr(8)
            })
        })
    }

    // 安装程序
    function install() {
      return getPath()
        .then(function (installedPath) {
          return adb.shell(options.serial, util.format(
            'export CLASSPATH=\'%s\'; exec app_process /system/bin \'%s\' --version 2>/dev/null'
            , installedPath
            , resource.main
          ))
            .timeout(10000)
            .then(function () {
              log.error('开始安装程序')
              // 安装分身软件
              adb.shell(options.serial, 'dumpsys package com.bly.dkplat | grep versionName')
                .timeout(5000)
                .then(function (out) {
                  streamutil.readAll(out)
                    .then(function (buffer) {
                      var version = buffer.toString().replace('versionName=', '').trim()
                      if (version !== resource.dkVersion) {
                        log.error('开始安装')
                        adb.uninstall(options.serial, resource.dkPkg)
                          .timeout(5 * 1000)
                          .then(function () {
                            adb.install(options.serial, resource.dkApk)
                          })
                      }
                    })
                })
              // 安装脚本软件
              adb.uninstall(options.serial, resource.zkPkg)
                .timeout(5 * 1000)
                .then(function () {
                  adb.install(options.serial, resource.zkApk)
                })
              adb.uninstall(options.serial, resource.zkTestPkg)
                .timeout(5 * 1000)
                .then(function () {
                  adb.install(options.serial, resource.zkTestApk)
                })
            })
            .then(function (out) {
              return streamutil.readAll(out)
                .timeout(10000)
                .then(function (buffer) {
                  // 设备上对应后台服务版本号
                  var version = buffer.toString()
                  log.error('冒号服务版本=' + version)
                  if (semver.satisfies(version, resource.mhVersion)) {
                    // 服务正常版本
                    log.error('版本一样=' + installedPath)
                    return installedPath
                  } else {
                    // 发现新版本需要更新
                    log.error('版本不一样=' + installedPath)
                    throw new Error(util.format('本地发现新版本 %s', resource.mhVersion
                    ))
                  }
                })
            })
        })
        .catch(function () {
          log.info('开始安装冒号相关服务')
          // 先卸载后安装冒号服务程序
          return adb.uninstall(options.serial, resource.pkg)
            .timeout(10000)
            .then(function () {
              return promiseutil.periodicNotify(adb.install(options.serial, resource.apk),
                20000).timeout(65000)
            })
            // 一直安装不上打印日志
            .progressed(function () {
              log.warn('程序安装不上 检查一下')
            })
            // 返回path
            .then(function () {
              return getPath()
            })
        })
    }

    // 返回path结果
    return install()
      .then(function (path) {
        log.info('冒号智控服务安装完毕!')
        resource.path = path
        return resource
      })
  })
