var http = require('http')

var express = require('express')
var validator = require('express-validator')
var cookieSession = require('cookie-session')
var bodyParser = require('body-parser')
var serveStatic = require('serve-static')
var csrf = require('csurf')
var Promise = require('bluebird')
var basicAuth = require('basic-auth')

var logger = require('../../util/logger')
var requtil = require('../../util/requtil')
var jwtutil = require('../../util/jwtutil')
var pathutil = require('../../util/pathutil')
var urlutil = require('../../util/urlutil')
var lifecycle = require('../../util/lifecycle')
var dbapi = require('../../db/api')


module.exports = function(options) {
  var log = logger.createLogger('auth-mock')
  var app = express()
  var server = Promise.promisifyAll(http.createServer(app))

  lifecycle.observe(function() {
    log.info('Waiting for client connections to end')
    return server.closeAsync()
      .catch(function() {
        // Okay
      })
  })

  // BasicAuth Middleware
  var basicAuthMiddleware = function(req, res, next) {
    function unauthorized(res) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required')
      return res.send(401)
    }

    var user = basicAuth(req)

    if (!user || !user.name || !user.pass) {
      return unauthorized(res)
    }

    if (user.name === options.mock.basicAuth.username &&
      user.pass === options.mock.basicAuth.password) {
      return next()
    }
    else {
      return unauthorized(res)
    }
  }

  app.set('view engine', 'pug')
  app.set('views', pathutil.resource('auth/mock/views'))
  app.set('strict routing', true)
  app.set('case sensitive routing', true)

  app.use(cookieSession({
    name: options.ssid
    , keys: [options.secret]
  }))
  app.use(bodyParser.json())
  app.use(csrf())
  app.use(validator())
  app.use('/static/bower_components',
    serveStatic(pathutil.resource('bower_components')))
  app.use('/static/auth/mock', serveStatic(pathutil.resource('auth/mock')))

  app.use(function(req, res, next) {
    res.cookie('XSRF-TOKEN', req.csrfToken())
    next()
  })

  if (options.mock.useBasicAuth) {
    app.use(basicAuthMiddleware)
  }

  app.get('/', function(req, res) {
    res.redirect('/auth/mock/')
  })

  app.get('/auth/mock/', function(req, res) {
    res.render('index')
  })

  // 新增 登陆接口
  app.post('/user/login', function(req, res) {
    var log = logger.createLogger('user-login')
    log.setLocalIdentifier(req.ip)
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function() {
          req.checkBody('username').notEmpty()
          req.checkBody('password').notEmpty()
        })
          .then(function() {
            log.info('用户 "%s" 登陆', req.body.username)
            // 登陆生成的token
            var token = jwtutil.encode({
              payload: {
                id: req.body.id
                , username: req.body.username
                , password: req.body.password
              }
              , secret: options.secret
              , header: {
                // token失效的时间
                exp: Date.now() + 60 * 1000
              }
            })
            res.status(200)
              .json({
                success: true
                , redirect: urlutil.addParams(options.appUrl, {
                  jwt: token
                })
              })
          })
          // 错误信息
          .catch(requtil.ValidationError, function(err) {
            res.status(400)
              .json({
                success: false
                , error: '未知错误'
                , validationErrors: err.errors
              })
          })
          // 错误信息
          .catch(function(err) {
            log.error('Unexpected error', err.stack)
            res.status(500)
              .json({
                success: false
                , error: '服务器错误'
              })
          })
        break
      default:
        res.send(406)
        break
    }
  })

  // 原始内部登陆接口解读 里面有获取token的代码
  app.post('/auth/api/v1/mock', function(req, res) {
    var log = logger.createLogger('auth-mock')
    log.setLocalIdentifier(req.ip)
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function() {
          req.checkBody('name').notEmpty()
          req.checkBody('email').isEmail()
        })
          .then(function() {
            let {
              email,
              name,
              password
            } = req.body
            dbapi.getUserByEmail(email)
              .then(function(ret) {
                console.log(ret)
                if (ret && ret.password === password) {
                  log.info('Authenticated "%s"', email)
                  var token = jwtutil.encode({
                    payload: {
                      email
                      , name
                      , admin: ret.admin
                    }
                    , secret: options.secret
                    , header: {
                      // token 设置失效的时间(基数单位:秒)
                      exp: Date.now() + 60 * 12 * 60 * 1000
                    }
                  })
                  res.status(200)
                    .json({
                      success: true
                      , redirect: urlutil.addParams(options.appUrl, {
                        jwt: token
                      })
                    })
                }
                else {
                  res.status(400)
                    .json({
                      success: false
                      , error: 'AccountError'
                    })
                }
              })
          })
          .catch(requtil.ValidationError, function(err) {
            res.status(400)
              .json({
                success: false
                , error: 'ValidationError'
                , validationErrors: err.errors
              })
          })
          .catch(function(err) {
            log.error('Unexpected error', err.stack)
            res.status(500)
              .json({
                success: false
                , error: 'ServerError'
              })
          })
        break
      default:
        res.send(406)
        break
    }
  })

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
