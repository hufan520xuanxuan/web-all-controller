const _ = require('lodash')

const globalData = {}

module.exports = {

  /**
   * 读取数据
   * @param key
   * @param keys
   */
  get(key, keys = []) {
    let currentState = this.getState(key)
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
  set(key, val) {
    let currentState = this.getState(key)

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
  remove(key, keys = []) {
    let currentState =  this.getState(key)

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
  clearItem: (key) => delete globalData[key],

  /**
   * 获取数据
   * @param {String} key
   */
  getState: (key) => globalData[key] || {},

  /**
   * 更新数据
   * @param key
   * @param val
   * @returns {*}
   */
  updateState: (key, val) => globalData[key] = val
}
