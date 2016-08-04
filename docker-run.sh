#!/bin/sh
export SPM_AGENT_CONFIG_FILE=/etc/sematext/sematext-agent-nginx.config
export SPM_RECEIVER_URL=${SPM_RECEIVER_URL:-https://spm-receiver.sematext.com:443/receiver/v1/_bulk}
export EVENTS_RECEIVER_URL=${EVENTS_RECEIVER_URL:-https://event-receiver.sematext.com}
export NGINX_STATUS_URL=${NGINX_STATUS_URL:-empty}
export SPM_LOG_TO_CONSOLE=${SPM_LOG_TO_CONSOLE:-true}
export SPM_LOG_LEVEL=${SPM_LOG_LEVEL:-error}
export DOCKER_AUTO_DISCOVERY=${DOCKER_AUTO_DISCOVERY:-'true'}

mkdir -p $(dirname $SPM_AGENT_CONFIG_FILE)
printf '{
	"tokens": {
		"spm": "%s"
	},
	"nginx": {
		"url": "%s"
	},
	"spmSenderBulkInsertUrl": "%s"
}' ${SPM_TOKEN} ${NGINX_STATUS_URL} ${SPM_RECEIVER_URL} > $SPM_AGENT_CONFIG_FILE
 
export SPM_REPORTED_HOSTNAME=$(docker-info Name)
echo "Docker Hostname: ${SPM_REPORTED_HOSTNAME}"
sematext-agent-nginx --config /etc/sematext/sematext-agent-nginx.config 
