#!/bin/sh
':' // ; export MAX_MEM="--max-old-space-size=60"; exec "$(command -v node || command -v nodejs)" "${NODE_OPTIONS:-$MAX_MEM}" "$0" "$@"

/*
 * @copyright Copyright (c) Sematext Group, Inc. - All Rights Reserved
 *
 * @licence Sematext Agent for Nginx is free-to-use, proprietary software.
 * THIS IS PROPRIETARY SOURCE CODE OF Sematext Group, Inc. (Sematext)
 * This source code may not be copied, reverse engineered, or altered for any purpose.
 * This source code is to be used exclusively by users and customers of Sematext.
 * Please see the full license (found in LICENSE in this distribution) for details on its license and the licenses of its dependencies.
 */
// this requires are here to compile with enclose.js
// var packageJson = require('../package.json')
// var packageJson2 = require('spm-agent/package.json')
var autodiscovery = process.env.DOCKER_AUTO_DISCOVERY === 'true' || process.env.DOCKER_AUTO_DISCOVERY === '1' || false
var runningNginxAgents = {}
var statusPath = process.env.NGINX_STATUS_PATH || '/nginx_status'

function NginxMonitor () {
  var SpmAgent = require('spm-agent')
  var OsAgent = require('spm-agent-os')
  var NginxAgent = require('./nginx-agent')
  console.log('SPM Token: ' + (SpmAgent.Config.get('tokens.spm') || '').slice(0, 16) + ' ...')
  var nginxUrl = null
  var njsAgent = new SpmAgent()
  if (SpmAgent.Config.get('tokens.spm')) {
    try {
      njsAgent.createAgent(new OsAgent())
      if (!autodiscovery) {
        nginxUrl = SpmAgent.Config.get('nginx.url') || ''
        if (SpmAgent.Config.get('nginx.url') && nginxUrl !== '' && nginxUrl !== 'empty') {
          var secureUrl = nginxUrl.replace(/:.*@/i, ' ')
          console.log('NGINX url: ' + secureUrl)
          njsAgent.createAgent(new NginxAgent(nginxUrl, null, {phpFpmUrl: SpmAgent.Config.get('phpFpm.url')}))
        } else {
          console.error('Missing nginx status url in config ' + SpmAgent.Config.config)
          process.exit(1)
        }
      }
    } catch (err) {
      console.log(err)
      SpmAgent.Logger.error('Error loading agent ' + err)
    }
  } else {
    process.exit(1)
    nginxUrl = null
  }
  if (autodiscovery) {
    var DockerDiscovery = require('./dockerDiscovery')
    SpmAgent.Logger.info('Watching Docker Events for nginx containers')
    var dockerDiscovery = new DockerDiscovery({
      image: new RegExp(process.env.IMAGE_NAME_PATTERN || 'nginx'),
      startFunction: function (dockerEvent, containerInfo) {
        // console.log(containerInfo.NetworkSettings.IPAddress)
        // console.log(containerInfo.NetworkSettings.Ports['80/tcp'])
        var host = containerInfo.NetworkSettings.IPAddress
        var filterValue = dockerEvent.id.substring(0, 12) // + '/' + containerInfo.NetworkSettings.IPAddress
        var port = 0
        var useSSL = false
        var httpPort = process.env.NGINX_HTTP_PORT || '80/tcp'
        var httpsPort = process.env.NGINX_HTTPS_PORT || '443/tcp'
        var dockerNginxUrl = 'http://' + host + ':' + port + statusPath

        if (process.env.SPM_DOCKER_NETWORK === 'host') {
          SpmAgent.Logger.info('using host network: ' + process.env.SPM_DOCKER_NETWORK)
          if (containerInfo.NetworkSettings.Ports && containerInfo.NetworkSettings.Ports[httpsPort] && containerInfo.NetworkSettings.Ports[httpPort].length > 0) {
            host = containerInfo.NetworkSettings.Ports[httpsPort][0].HostIp
            port = containerInfo.NetworkSettings.Ports[httpsPort][0].HostPort
            useSSL = true
          }
          if (containerInfo.NetworkSettings.Ports && containerInfo.NetworkSettings.Ports[httpPort] && containerInfo.NetworkSettings.Ports[httpPort].length > 0) {
            host = containerInfo.NetworkSettings.Ports[httpPort][0].HostIp
            port = containerInfo.NetworkSettings.Ports[httpPort][0].HostPort
          }
        } else {
          // connect via container network e.g. bridge
          SpmAgent.Logger.info('using container network (' + (process.env.SPM_DOCKER_NETWORK||'default/bridge') + ')')
          port = (process.env.NGINX_HTTP_PORT || '80/tcp').replace('/tcp', '')
          host = containerInfo.NetworkSettings.IPAddress
        }
        if (useSSL) {
          dockerNginxUrl = 'https://' + host + ':' + port + statusPath
        } else {
          dockerNginxUrl = 'http://' + host + ':' + port + statusPath
        }
        if (port > 0) {
          filterValue = filterValue + '_' + host + ':' + port + statusPath
          SpmAgent.Logger.info('start monitoring: ' + dockerNginxUrl + ' container: ' + filterValue)
          var na = new NginxAgent(dockerNginxUrl, filterValue) // TODO ADD PHP_FPM
          na = njsAgent.createAgent(na)
          runningNginxAgents[dockerEvent.id] = na
        }
      },
      stopFunction: function (dockerEvent) {
        var na = runningNginxAgents[dockerEvent.id]
        if (na) {
          SpmAgent.Logger.info('stop monitoring for container ' + dockerEvent.id)
          na.stop()
        }
        delete runningNginxAgents[dockerEvent.id]
      }
    })
  }
  return njsAgent
}
NginxMonitor()

process.on('uncaughtException', function (err) {
  console.error((new Date()).toUTCString() + ' uncaughtException:', err.message)
  console.error(err.stack)
  process.exit(1)
})
