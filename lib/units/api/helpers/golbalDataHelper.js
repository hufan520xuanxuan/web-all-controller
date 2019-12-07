const _ = require('lodash')

const dbapi = require('../../../db/api')

// let globalData = {}

// module.exports = {
//
//   /**
//    * 读取数据
//    * @param key
//    * @param keys
//    */
//   get(key, keys = []) {
//     let currentState = this.getState(key)
//     let res = {}
//
//     if (_.isString(keys)) {
//       res = currentState[keys] === undefined ? '' : currentState[keys]
//     }
//     else if (keys.length) {
//       keys.map((item) => {
//         res[item] = currentState[item]
//       })
//     }
//
//     return res
//   },
//
//   /**
//    * 设置数据
//    * @param key
//    * @param value
//    * @returns {*}
//    */
//   set(key, val) {
//     let currentState = this.getState(key)
//
//     if (_.isPlainObject(val)) {
//       let state = {...currentState, ...val}
//       console.log('原由值', globalData)
//       console.log('拿到的值', currentState)
//       console.log('key', key)
//       console.log('设置值', state)
//       this.updateState(key, state)
//       console.log('当前值', globalData)
//     } else {
//       console.error('设置的Value必须是Object类型')
//     }
//   },
//
//   /**
//    * 删除Storage中指定值
//    * @param {String} key
//    * @param {String | Array} keys
//    */
//   remove(key, keys = []) {
//     let currentState =  this.getState(key)
//
//     try {
//       if (_.isString(keys)) {
//         delete currentState[keys]
//       } else if (keys.length) {
//         keys.map(item => {
//           if (_.isString(item)) {
//             delete currentState[item]
//           }
//         })
//       }
//       this.updateState(key, currentState)
//     } catch (e) {
//       return false
//     }
//     return true
//   },
//
//   /**
//    * 清空某一项数据
//    * @param key
//    * @returns {boolean}
//    */
//   clearItem: (key) => delete globalData[key],
//
//   /**
//    * 获取数据
//    * @param {String} key
//    */
//   getState: (key) => globalData[key] || {},
//
//   /**
//    * 更新数据
//    * @param key
//    * @param val
//    * @returns {*}
//    */
//   updateState: (key, val) => globalData[key] = val,
//
//   /**
//    * 清空所有数据
//    * @returns {{}}
//    */
//   clear: () => globalData = {}
// }

module.exports = {

  /**
   * 读取数据
   * @param key
   * @param keys
   */
  async get(key, keys = []) {
    let currentState = await this.getState(key)
    let res = {}

    if (_.isString(keys)) {
      res = currentState[keys] === undefined ? '' : currentState[keys]
    }
    else if (keys.length) {
      keys.map((item) => {
        res[item] = currentState[item]
      })
    }

    return res
  },

  /**
   * 设置数据
   * @param key
   * @param value
   * @returns {*}
   */
  async set(key, val) {
    let currentState = await this.getState(key)

    if (_.isPlainObject(val)) {
      let state = {...currentState, ...val}
      this.updateState(key, state)
    } else {
      console.error('设置的Value必须是Object类型')
    }
  },

  /**
   * 删除Storage中指定值
   * @param {String} key
   * @param {String | Array} keys
   */
  async remove(key, keys = []) {
    let currentState = await this.getState(key)

    try {
      if (_.isString(keys)) {
        delete currentState[keys]
      } else if (keys.length) {
        keys.map(item => {
          if (_.isString(item)) {
            delete currentState[item]
          }
        })
      }
      this.updateState(key, currentState)
    } catch (e) {
      return false
    }
    return true
  },

  /**
   * 清空某一项数据
   * @param key
   * @returns {boolean}
   */
  clearItem: (key) => {
    dbapi.delInsDeviceConfigBySerial(key)
  },

  /**
   * 获取数据
   * @param {String} key
   */
  getState: async (key) => {
    return await dbapi.getInsDeviceConfig(key) || {}
  },

  /**
   * 更新数据
   * @param key
   * @param val
   * @returns {*}
   */
  updateState: (key, val) => dbapi.setInsDeviceConfig(key, val),

  /**
   * 清空所有数据
   * @returns {{}}
   */
  clear: () => dbapi.clearInsDeviceConfig()
}
