var r = require('rethinkdb')

module.exports = {
  users: {
    primaryKey: 'email'
  , indexes: {
      adbKeys: {
        indexFunction: function(user) {
          return user('adbKeys')('fingerprint')
        }
      , options: {
          multi: true
        }
      }
    }
  }
, accessTokens: {
    primaryKey: 'id'
  , indexes: {
      email: null
    }
  }
, vncauth: {
    primaryKey: 'password'
  , indexes: {
      response: null
    , responsePerDevice: {
        indexFunction: function(row) {
          return [row('response'), row('deviceId')]
        }
      }
    }
  }
, devices: {
    primaryKey: 'serial'
  , indexes: {
      owner: {
        indexFunction: function(device) {
          return r.branch(
            device('present')
          , device('owner')('email')
          , r.literal()
          )
        }
      }
    , present: null
    , providerChannel: {
        indexFunction: function(device) {
          return device('provider')('channel')
        }
      }
    }
  }
, logs: {
    primaryKey: 'id'
  },
  insAccount: {
    primaryKey: 'account',
    indexes: {
      created: {
        indexFunction: function(account) {
          return account('created')
        }
      }
    }
  },
  insLogs: {
    primaryKey: 'id',
    indexes: {
      created: {
        indexFunction: function(logs) {
          return logs('created')
        }
      },
      status: {
        indexFunction: function(logs) {
          return logs('status')
        }
      }
    }
  },
  insDeviceConfig: {
    primaryKey: 'serial',
  },
  insAccountNotes: {
    primaryKey: 'account',
  },
  insAccountRecord: {
    primaryKey: 'id',
    indexes: {
      created: {
        indexFunction: function(records) {
          return records('created')
        }
      }
    }
  }
}
