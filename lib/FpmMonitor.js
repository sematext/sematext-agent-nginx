var request = require('request')

// monkey patch for https://github.com/request/request/issues/2900#issuecomment-377061422
request.prototype.enableUnixSocket = function () {
  // Get the socket & request paths from the URL
  var unixParts = this.uri.path.split(':')
  var host = unixParts[0]
  var path = unixParts[1]
  // Apply unix properties to request
  this.socketPath = host
  this.uri.pathname = path
  this.uri.path = path
  // this.uri.host = host
  this.uri.hostname = host
  this.uri.isUnix = true
  delete this.uri.port
}

function FpmMonitor (options) {
  this.opt = options
  if (!(options.url instanceof Array)) {
    this.opt.url = options.url.split(',')
  } 
  console.log('PHP FPM URL: ' + this.opt.url)
  setTimeout(this.start.bind(this), 200)
}

FpmMonitor.prototype.fetchMetricsByUrl = function (url) {
  var self = this
  request.get(url, function (error, response, body) {
    var stats = {}
    if (!error && response.statusCode === 200) {
      try {
        // remove space in metric names
        stats = JSON.parse(body.replace(/"([\w\s]+)":/g, function (m) {
          return m.replace(/\s+/g, '_')
        }))
        self.aggMetrics(stats)
      } catch (ex) {

      }
    }
  })
}

FpmMonitor.prototype.fetchMetrics = function () {
  var self = this
  var urlParameters = '?json&full'
  self.opt.url.forEach(function (url) {
    self.fetchMetricsByUrl(url + urlParameters)
  })
}

FpmMonitor.prototype.start = function () {
  console.log('start php monitor: ' + this.opt.url)
  this.tid = setInterval(this.fetchMetrics.bind(this), 10000)
  this.tid.unref()
}

FpmMonitor.prototype.stop = function () {
  clearInterval(this.tid)
  clearInterval(this.tid2)
}

FpmMonitor.prototype.aggMetrics = function (res) {
  var self = this
  if(!self.lastRes) {
    self.lastRes = res
  }
  self.pool = res.pool
  var metrics = {
    name: 'php-fpm',
    filters: [
      self.opt.filterValue,
      res.pool
    ],
    value: [
      Math.max(0, Number(res.accepted_conn) - Number(self.lastRes.accepted_conn)),
      Number(res.listen_queue),
      Number(res.max_listen_queue),
      Number(res.listen_queue_len),
      Number(res.idle_processes),
      Number(res.active_processes),
      Number(res.total_processes),
      Number(res.max_active_processes),
      Math.max(0, Number(res.max_children_reached) - Number(self.lastRes.max_children_reached)),
      Math.max(0, Number(res.slow_requests) - Number(self.lastRes.slow_requests))
    ]
  }
  // console.log(metrics)
  self.opt.agent.addMetrics(metrics)
  self.lastRes = res
}

function test () {
  var fm = new FpmMonitor({
    agent: {addMetrics: console.log},
    url: 'http://localhost:9191/status'
  })
  setInterval(fm.fetchMetrics.bind(fm), 10000)
}
// test()
module.exports = FpmMonitor
