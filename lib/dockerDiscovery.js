'use strict'
var DockerEvents = require('docker-events')
var Dockerode = require('dockerode')
var dockerInspect = require('./dockerInspect')

function DockerDiscovery (options) {
  var self = this
  this.options = options
  this.emitter = new DockerEvents({
    docker: new Dockerode(),
  })
  this.emitter.on('start', function (event) {
    if (this.options && options.image && (options.image instanceof RegExp && this.options.startFunction) && options.image.test(event.from)) {
      dockerInspect.inspect(event.id, function (err, info) {
        this.options.startFunction(event, info)
      }.bind(this))
    }
  }.bind(this))
  this.emitter.on('stop', function (event) {
    if (this.options && options.image && (options.image instanceof RegExp && this.options.stopFunction) && options.image.test(event.from)) {
      this.options.stopFunction(event)
    }
  }.bind(this))
  this.emitter.start()
}
module.exports = DockerDiscovery
