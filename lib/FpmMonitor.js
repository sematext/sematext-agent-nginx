// console.log(data)
var request = require('request')
var sql = require('alasql')

var sqlPoolMetrics = 'SELECT pool,MAX(start_since) as start_since,\
(MAX(accepted_conn) - MIN(accepted_conn)) as accepted_conn,\
AVG(listen_queue) as listen_queue,\
AVG(max_listen_queue) as max_listen_queue,\
AVG(listen_queue_len) as listen_queue_len,\
AVG(idle_processes) as idle_processes,\
AVG(active_processes) as active_processes,\
AVG(total_processes) as total_processes,\
AVG(max_active_processes) as max_active_processes,\
AVG(max_children_reached) as max_children_reached,\
AVG(slow_requests) as slow_requests \
FROM ? GROUP BY pool'

var sqlProcessMetrics = 'SELECT script, \
MAX(requests), \
MIN(requests), \
(MAX(requests) - MIN(requests)) AS requests,\
AVG(request_duration) AS request_duration,\
AVG(content_length) AS content_length,\
AVG(last_request_cpu) AS last_request_cpu,\
AVG(last_request_memory) AS last_request_memory \
FROM ? GROUP BY script'

var aggPoolSQL = sql.compile(sqlPoolMetrics)
var aggProcessSQL = sql.compile(sqlProcessMetrics)

function runQuery (query, data, cb) {
  var res = query([data])
  res.forEach(function (d, i) {
    cb(d)
  })
}

function FpmMonitor (options) {
  this.buffer = []
  this.opt = options
  this.opt.url = options.url + '?json&full'
  console.log('PHP FPM URL: ' + this.opt.url)
  setTimeout(this.start.bind(this), 200)
}

FpmMonitor.prototype.fetchMetrics = function () {
  var self = this
  request.get(self.opt.url, function (error, response, body) {
    var stats = {}
    if (!error && response.statusCode === 200) {
      try {
        // remove space in metric names
        stats = JSON.parse(body.replace(/"([\w\s]+)":/g, function (m) {
          return m.replace(/\s+/g, '_')
        }))
        self.buffer.push(stats)
      } catch (ex) {}
    }
  })
}

FpmMonitor.prototype.start = function () {
  console.log('start php monitor')
  this.tid = setInterval(this.fetchMetrics.bind(this), 5000)
  this.tid2 = setInterval(this.aggMetrics.bind(this), 20000)
  this.tid.unref()
  this.tid2.unref()
}

FpmMonitor.prototype.stop = function () {
  clearInterval(this.tid)
  clearInterval(this.tid2)
}

FpmMonitor.prototype.aggMetrics = function () {
  var self = this
  var tmpBuffer = self.buffer
  // we keep last record for diff calculation in next run
  if (tmpBuffer.length > 0) {
    self.buffer = [self.buffer[self.buffer.length - 1]]
  } else {
    // no data
    return
  }
  runQuery(aggPoolSQL, tmpBuffer, function (res) {
    var metrics = {
      name: 'php-fpm',
      filters: [
        res.pool
      ],
      value: [
        Number(res.start_since),
        Number(res.accepted_conn),
        Number(res.listen_queue),
        Number(res.max_listen_queue),
        Number(res.listen_queue_len),
        Number(res.active_processes),
        Number(res.total_processes),
        Number(res.max_active_processes),
        Number(res.max_children_reached),
        Number(res.slow_requests)
      ]
    }
    // console.log(metrics)
    self.opt.agent.addMetrics(metrics)
    self.aggProcessMetrics(tmpBuffer)
  })
}

FpmMonitor.prototype.aggProcessMetrics = function (data) {
  var self = this
  var processes = []
  data.forEach(function (item) {
    processes = processes.concat(item.processes)
  })
  runQuery(aggProcessSQL, processes, function (res) {
  	// console.log(res)
    var metrics = {
      name: 'php-fpm-ps',
      filters: [
        res.script
      ],
      value: [
        Number(res.requests),
        Number(res.request_duration),
        Number(res.content_length),
        Number(res.last_request_cpu),
        Number(res.last_request_memory)
      ]
    }
    // console.log(metrics)
    self.opt.agent.addMetrics(metrics)
  })
}

function test () {
  var fm = new FpmMonitor({
    agent: {addMetrics: console.log},
    url: 'http://localhost:9191/status'
  })
  setInterval(fm.fetchMetrics.bind(fm), 10000)
  setInterval(function () {
    fm.aggMetrics()
  }, 30000)
}
// test()
module.exports = FpmMonitor
