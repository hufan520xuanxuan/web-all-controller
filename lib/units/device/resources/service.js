var util = require('util')

var syrup = require('stf-syrup')
var ProtoBuf = require('protobufjs')
var semver = require('semver')

var pathutil = require('../../../util/pathutil')
var streamutil = require('../../../util/streamutil')
var promiseutil = require('../../../util/promiseutil')
var logger = require('../../../util/logger')

// 处理移动端服务
module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .define(function (options, adb) {
    var log = logger.createLogger('device:resources:service')
    var builder = ProtoBuf.loadProtoFile(
      pathutil.vendor('MHService/wire.proto'))

    var resource = {
      requiredVersion: '1.0.0'
      , pkg: 'jp.co.cyberagent.stf'
      , main: 'jp.co.cyberagent.stf.Agent'
      , apk: pathutil.vendor('MHService/MHService.apk')
      , zkVersion: '9.9' // 这里的版本要高于手机上的版本 才可以替换包安装
      , zkPkg: 'com.phone.mhzk'
      , zkApk: pathutil.vendor('mhzk/mhzk.apk')
      , zkTestPkg: 'com.phone.mhzk.test'
      , testApk: pathutil.vendor('mhzk/mhzk_test.apk')
      , dyVersion: '999.999' // 这里的版本要高于手机上的版本 才可以替换包安装
      , dyPkg: 'com.ss.android.ugc.aweme'
      , dyApk: pathutil.vendor('mhzk/dy.apk')
      , wire: builder.build().jp.co.cyberagent.stf.proto
      , builder: builder
      , startIntent: {
        action: 'jp.co.cyberagent.stf.ACTION_START'
        , component: 'jp.co.cyberagent.stf/.Service'
      }
    }

    function getPath() {
      return adb.shell(options.serial, ['pm', 'path', resource.pkg])
        .timeout(10000)
        .then(function (out) {
          return streamutil.findLine(out, (/^package:/))
            .timeout(15000)
            .then(function (line) {
              return line.substr(8)
            })
        })
    }

    function install() {
      log.info('Checking whether we need to install MHService')
      return getPath()
        .then(function (installedPath) {
          log.info('Running version check')
          return adb.shell(options.serial, util.format(
            'export CLASSPATH=\'%s\';' +
            ' exec app_process /system/bin \'%s\' --version 2>/dev/null'
            , installedPath
            , resource.main
          ))
            .timeout(10000)
            .then(function (out) {
              return streamutil.readAll(out)
                .timeout(10000)
                .then(function (buffer) {
                  var version = buffer.toString()
                  if (semver.satisfies(version, resource.requiredVersion)) {
                    return installedPath
                  } else {
                    throw new Error(util.format(
                      'Incompatible version %s'
                      , version
                    ))
                  }
                })
            })
        })
        .catch(function () {
          log.info('Installing MHService')
          // Uninstall first to make sure we don't have any certificate
          // issues.
          // return adb.uninstall(options.serial, resource.pkg)
          //   .timeout(15000)
          //   .then(function () {
          return promiseutil.periodicNotify(
            adb.install(options.serial, resource.apk)
            , 20000).timeout(65000)
            // })
            .then(function () {
              return adb.shell(options.serial, 'dumpsys package com.phone.mhzk | ' +
                'grep versionName')
            }).timeout(10000)
            .then(function (out) {
              streamutil.readAll(out)
                .then(function (buffer) {
                  log.error('获取到冒号智控=' + buffer.toString())
                  var version = buffer.toString().replace('versionName=', '').trim()
                  log.error(version, resource.zkVersion)
                  log.error('结果=' + version +
                    '对比一下结果=' + (resource.zkVersion > version))
                  if (resource.zkVersion > version) {
                    adb.uninstall(options.serial, resource.zkPkg)
                      .timeout(15000)
                      .then(function () {
                        promiseutil.periodicNotify(
                          adb.install(options.serial, resource.zkApk)
                          , 20000
                        ).timeout(65000)
                          .then(function () {
                            adb.uninstall(options.serial, resource.zkTestPkg)
                              .timeout(15000)
                              .then(function () {
                                promiseutil.periodicNotify(
                                  adb.install(options.serial, resource.testApk)
                                  , 20000).timeout(65000)
                              })
                          })
                      })
                  }
                })
            })
            .progressed(function () {
              log.warn(
                'MHService installation is taking a long time; ' +
                'perhaps you have to accept 3rd party app installation ' +
                'on the device?'
              )
            })
            .then(function () {
              return getPath()
            })
        })
    }

    return install()
      .then(function (path) {
        log.info('MHService up to date')
        resource.path = path
        return resource
      })
  })
