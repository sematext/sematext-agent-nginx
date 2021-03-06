'use strict'
var dockerInspect = require('./dockerInspect')
var allContainer = require('docker-allcontainers')

function DockerDiscovery (options) {
  this.options = options
  this.emitter = allContainer({
    preheat: true, // emit starts event for all already running containers
    docker: null, // options to Dockerode
    matchByImage: options.image,
    skipByImage: /sematext-agent-nginx/
  })
  this.emitter.on('start', function (event) {
    if (this.options && options.image && (options.image instanceof RegExp && this.options.startFunction) && options.image.test(event.image)) {
      dockerInspect.inspect(event.id, function (err, info) {
        if (!err) {
          this.options.startFunction(event, info)
        }
      }.bind(this))
    }
  }.bind(this))
  this.emitter.on('stop', function (event) {
    if (this.options && options.image && (options.image instanceof RegExp && this.options.stopFunction) && options.image.test(event.image)) {
      this.options.stopFunction(event)
    }
  }.bind(this))
}
module.exports = DockerDiscovery
