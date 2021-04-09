/**
 * 根据时间生成唯一ID
 * @returns {string}
 */
function generateId () {
  return (Math.random() * 10000000).toString(16).substr(0, 4) + '-' + (new Date()).getTime() + '_' + window.performance.now() + '-' + Math.random().toString().substr(2, 5)
}
const StoreMap = new Map()
function Clock (autoStart) {
  this.autoStart = (autoStart !== undefined) ? autoStart : true

  this.startTime = 0
  this.oldTime = 0
  this.elapsedTime = 0

  this.running = false
}

Object.assign(Clock.prototype, {

  start: function () {
    this.startTime = (typeof performance === 'undefined' ? Date : performance).now() // see #10732

    this.oldTime = this.startTime
    this.elapsedTime = 0
    this.running = true
  },

  stop: function () {
    this.getElapsedTime()
    this.running = false
    this.autoStart = false
  },

  getElapsedTime: function () {
    this.getDelta()
    return this.elapsedTime
  },

  getDelta: function () {
    var diff = 0

    if (this.autoStart && !this.running) {
      this.start()
      return 0
    }

    if (this.running) {
      var newTime = (typeof performance === 'undefined' ? Date : performance).now()

      diff = (newTime - this.oldTime) / 1000
      this.oldTime = newTime

      this.elapsedTime += diff
    }

    return diff
  }

})
export {generateId, StoreMap, Clock}
