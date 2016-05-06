#!/bin/sh
export SPM_AGENT_CONFIG_FILE=/etc/sematext/sematext-agent-nginx.config
mkdir -p $(dirname $SPM_AGENT_CONFIG_FILE)
printf '{
	"tokens": {
		"spm": "%s"
	},
	"nginx": {
		"url": "%s"
	}
}' ${SPM_TOKEN} ${NGINX_STATS_URL} > $SPM_AGENT_CONFIG_FILE
 
sematext-agent-nginx --config /etc/sematext/sematext-agent-nginx.config 
