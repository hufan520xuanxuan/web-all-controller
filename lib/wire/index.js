var path = require('path')

var ProtoBuf = require('protobufjs')

// cp
var wire = ProtoBuf.loadProtoFile(path.join(__dirname, 'wire.proto')).build()
// mhzk
var mao = ProtoBuf.loadProtoFile(path.join(__dirname, 'mao.proto')).build()

wire.ReverseMessageType = Object.keys(wire.MessageType)
  .reduce(
    function(acc, type) {
      var code = wire.MessageType[type]
      if (!wire[type]) {
        throw new Error('wire.MessageType has unknown value "' + type + '"')
      }
      wire[type].$code = wire[type].prototype.$code = code
      acc[code] = type
      return acc
    }
    , Object.create(null)
  )

mao.ReverseMessageType = Object.keys(mao.MessageType)
  .reduce(
    function(acc, type) {
      var code = mao.MessageType[type]
      if (!mao[type]) {
        throw new Error('wire.MessageType has unknown value "' + type + '"')
      }
      mao[type].$code = mao[type].prototype.$code = code
      acc[code] = type
      return acc
    }
    , Object.create(null)
  )


module.exports = mao
module.exports = wire
