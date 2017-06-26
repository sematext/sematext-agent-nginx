#!/usr/bin/env node
/*
 * @copyright Copyright (c) Sematext Group, Inc. - All Rights Reserved
 *
 * @licence SPM for Nginx is free-to-use, proprietary software.
 * THIS IS PROPRIETARY SOURCE CODE OF Sematext Group, Inc. (Sematext)
 * This source code may not be copied, reverse engineered, or altered for any purpose.
 * This source code is to be used exclusively by users and customers of Sematext.
 * Please see the full license (found in LICENSE in this distribution) for details on its license and the licenses of its dependencies.
 */
var fs = require('fs')
var ZipZipTop = require('zip-zip-top')
var zip = new ZipZipTop()
var config = require('spm-agent').Config
var util = require('util')
var os = require('os')
var path = require('path')

var systemInfo = {
  operatingSystem: os.type() + ', ' + os.platform() + ', ' + os.release() + ', ' + os.arch(),
  processVersions: process.versions,
  processEnvironment: process.env
}

// load ENV like Logsene receivers from file containing
// env vars e.g. SPM_RECEIVER_URL, EVENTS_RECEIVER_URL, LOGSENE_RECEIVER_URL
// the file overwrites the actual environment
// and is used by Sematext Enterprise or multi-region setups to
// setup receiver URLs
function loadEnvFromFile (fileName) {
  try {
    var receivers = fs.readFileSync(fileName).toString()
    if (receivers) {
      var lines = receivers.split('\n')
    }
    systemInfo.receiverConfigFileUsed = fileName
    systemInfo.receivers = receivers
    console.log('Reading receivers.config: ' + fileName)
    lines.forEach(function (line) {
      var kv = line.split('=')
      if (kv.length === 2 && kv[1].length > 0) {
        process.env[kv[0].trim()] = kv[1].trim()
        console.log(kv[0].trim() + ' = ' + kv[1].trim())
      }
    })
  } catch (error) {}
}
var envFileName = '/etc/sematext/receivers.config'
/**
  if (/win/.test(os.platform()) {
    envFileName = process.env.ProgramData + '\\Sematext\\receivers.config'
  }
**/
loadEnvFromFile(envFileName)

// var cfgDumpFileName = path.join (os.tmpdir(), 'spm-cfg-dump.txt')
// fs.writeFileSync(cfgDumpFileName, util.inspect(config).toString() + '\nSystem-Info:\n' + util.inspect(systemInfo))
zip.file('systemInfo.txt',
  util.inspect(config).toString() + '\nSystem-Info:\n' + util.inspect(systemInfo))
zip.zipFolder(config.logger.dir, function (err, data) {
  if (err) {
    return console.log(err)
  }
  zip.zipFolder('/etc/sematext', function (err, data) {
    if (err) {
      return console.log(err)
    }
    var archFileName = path.join(os.tmpdir(), 'spm-diagnose.zip')
    zip.writeToFile(archFileName)
    console.log('Sematext diagnostics info is in  ' + archFileName)
    console.log('Please e-mail the file to support@sematext.com')
  // fs.unlink(cfgDumpFileName, function () {})
  })
})
