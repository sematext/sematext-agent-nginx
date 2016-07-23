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
	this.emitter.on("start", function (event) {
		if (this.options && options.image && (options.image instanceof RegExp && this.options.startFunction) && options.image.test(event.from)) {
			//console.log("container started: %j", event)
				dockerInspect.inspect(event.id, function (err, info) {
				this.options.startFunction(event, info)
			}.bind(this))
		}
	}.bind(this))
	this.emitter.on("stop", function(event) {
	  if (this.options && options.image && (options.image instanceof RegExp && this.options.stopunction) && options.image.test(event.from)) {
		options.stopFunction(event)
	  }
	})
	this.emitter.start()
}


module.exports = DockerDiscovery

setInterval(console.log, 10000)




