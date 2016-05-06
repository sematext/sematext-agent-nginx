/*
 * @copyright Copyright (c) Sematext Group, Inc. - All Rights Reserved
 *
 * @licence Sematext Agent for Nginx is free-to-use, proprietary software.
 * THIS IS PROPRIETARY SOURCE CODE OF Sematext Group, Inc. (Sematext)
 * This source code may not be copied, reverse engineered, or altered for any purpose.
 * This source code is to be used exclusively by users and customers of Sematext.
 * Please see the full license (found in LICENSE in this distribution) for details on its license and the licenses of its dependencies.
 */
'use strict'
var Agent = require('spm-agent').Agent
var logger = require('spm-agent').Logger
var Aggregator = require('./aggregator')
var request = require('request')
var statsInterval = 2000
var emitMetricInterval = 15000
// regex to parse nginx stats output
var nginxRegex = /Active connections:\s(\d+)\s+server accept.+\s+(\d+)\s\d+\s\d+\s+Reading:\s(\d+)\sWriting:\s(\d+)\sWaiting:\s(\d+)/

var metricList = [
  'nginx_connections-active',
  'nginx_requests',
  'nginx_connections-reading',
  'nginx_connections-writing',
  'nginx_connections-waiting'
]
var metricsDefinition = {
  'nginx_connections-active': {calcDiff: false, agg: 'mean'},
  'nginx_requests': {calcDiff: true, agg: 'sum'},
  'nginx_connections-reading': {calcDiff: false, agg: 'mean'},
  'nginx_connections-writing': {calcDiff: false, agg: 'mean'},
  'nginx_connections-waiting': {calcDiff: false, agg: 'mean'}
}

function NginxAgent (url) {
  var u = require('url')
  var nginxCfg = u.parse(url)
  return new Agent({
    nginxStatusUrl: url,
    timers: [],
    start: function (agent) {
      // config.collectionInterval=Math.min(10000, config.collectionInterval)
      // config.transmitInterval=Math.max(15000, config.transmitInterval)
      var self = this
      this.init()
      logger.info('start nginx agent')
      var timerId = setInterval(function () {
        self.getNginxStats()
      }, statsInterval)
      this.timers.push(timerId)
      timerId = setInterval(function () {
        var aggMetrics = self.getAggregatedValues()
        var filters = [nginxCfg.host]
        var metrics = {type: 'nginx', filters: filters, name: 'stats', fieldInfo: aggMetrics.keys, value: aggMetrics.values, sct: 'APP'}
        agent.addMetrics(metrics)
        this.agg.reset()
      }.bind(this), emitMetricInterval)
      this.timers.push(timerId)
    },
    stop: function () {
      this.timers.forEach(function (tid) {
        clearInterval(tid)
      })
    },
    init: function () {
      this.agg = new Aggregator()
    },
    getNginxStats: function () {
      request(this.nginxStatusUrl, function (err, res) {
        if (err) {
          logger.error(err)
        } else {
          if (res.statusCode !== 200) {
            logger.error('No stats available, pls. check nginx stats URL. HTTP status: ' + res.statusCode + ' for ' + this.nginxStatusUrl)
            return
          }
          var values = res.body.match(nginxRegex)
          if (values && values.length > 5) {
            values = values.splice(1, 6)
          }
          for (var i = 0; i < 5; i++) {
            var key = metricList[i]
            var value = Number(values[i])
            this.agg.update(new Date().getTime(), key, value, metricsDefinition[key].calcDiff)
          }
        }
      }.bind(this))
    },
    getAggregatedValues: function () {
      var values = []
      var keys = []
      Object.keys(metricsDefinition).forEach(function (prop) {
        var val = this.agg.get(prop)
        values.push(val[metricsDefinition[prop].agg])
        keys.push(prop)
      }.bind(this))
      return {keys: keys, values: values}
    }
  })
}

module.exports = NginxAgent
