var Docker = require('dockerode')
var docker = new Docker()
var flat = require('flat')
var cache = {}

function DockerInspect (options) {
  this.options = options
}

DockerInspect.prototype.inspectHandler = function (err, info) {
  var token = null
  if (!err) {
    /* if (info.Config && info.Config.Labels && info.Config.Labels.LOGSENE_TOKEN) {
      token = info.Config.Labels.LOGSENE_TOKEN
      info.LOGSENE_TOKEN = token
    } else {
      token = getEnvVar('SPM_TOKEN', info.Config.Env)
    }*/
  }
  if (info) {
    info.SPM_TOKEN = token || process.env.LOGSENE_TOKEN
    this.callback(null, info)
  } else {
    this.callback(null, {
      SPM_TOKEN: process.env.SPM_TOKEN,
      id: this.container
    })
  }
}

DockerInspect.prototype.inspect = function (id, cb) {
  docker.getContainer(id).inspect(this.inspectHandler.bind({
    callback: cb,
    container: id
  }))
}
module.exports = new DockerInspect()
