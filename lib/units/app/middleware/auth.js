var jwtutil = require('../../../util/jwtutil')
var urlutil = require('../../../util/urlutil')

var dbapi = require('../../../db/api')

module.exports = function(options) {
  return function(req, res, next) {
    if (req.query.jwt) {
      // Coming from auth client
      var data = jwtutil.decode(req.query.jwt, options.secret)
      var redir = urlutil.removeParam(req.url, 'jwt')
      if (data) {
        let success = () => {
          data.token = req.query.jwt
          req.session.jwt = data
          res.redirect(redir)
        }

        // Redirect once to get rid of the token
        dbapi.getUserByEmail(data.email).then(ret => {
          let user = {
            name: data.name
            , email: data.email
            , ip: req.ip
          }
          if (ret.devices !== undefined) {
            dbapi.saveUserAfterLogin(user).then(() => {
              success()
            })
              .catch(next)
          }
          else {
            dbapi.initUserByName(user)
              .then(() => {
                success()
              })
              .catch(next)
          }
        })
      }
      else {
        // Invalid token, forward to auth client
        res.redirect(options.authUrl)
      }
    }
    else if (req.session && req.session.jwt) {
      let token = req.session.jwt.token
      let data = jwtutil.decode(token, options.secret)

      if (data) {
        dbapi.loadUser(data.email)
          .then(function(user) {
            if (user) {
              // Continue existing session
              req.user = user
              next()
            }
            else {
              // We no longer have the user in the database
              res.redirect(options.authUrl)
            }
          })
          .catch(next)
      }
      else {
        res.redirect(options.authUrl)
      }
    }
    else {
      // No session, forward to auth client
      res.redirect(options.authUrl)
    }
  }
}
