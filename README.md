[![Build Status](https://travis-ci.org/sematext/sematext-agent-nginx.svg?branch=master)](https://travis-ci.org/sematext/sematext-agent-nginx)

This is the NGINX monitoring Agent for [Sematext Cloud](https://sematext.com/cloud/)


# Preparation 

1. Get a free [Sematext account](https://apps.sematext.com/ui/registation)  

2. [Create a Monitoring App](https://apps.sematext.com/spm-reports/registerApplication.do) of type "Nginx" and copy the SPM App Token - or execute the commands displayed in the Sematext UI (which are described here as well)

3. [Install Node.js](https://nodejs.org/en/download/package-manager/) on your Nginx server

4. Activate Nginx ```stub_status``` module in the ```server``` section e.g. in ```/etc/nginx/sites-enabled/default```: 
```
location /nginx_status {
  # Turn on nginx stats
  stub_status on;
  # I do not need logs for stats
  access_log   off;
  # Security: Please use you local IP address instead ...
  allow all;
}
```

__Optional preparation for PHP FastCGI Process Manager (FPM):__ To add monitoring for PHP-FPM follow [these instructions](https://sematext.com/docs/integration/php/#integration-with-nginx).

# Setup 
```sh
# Install sematext-agent-nginx 
npm i sematext-agent-nginx -g
# If you use Sematext Cloud EU, set region for API endpoints
# sematext-nginx-setup -r EU
# Install systemd or upstart service file for sematext-agent-nginx 
sematext-nginx-setup -t YOUR_SPM_TOKEN_HERE -n http://localhost/nginx_status
```

# Configuration 

The setup script stores the configuration in ```/etc/sematext/sematext-agent-nginx.config```

In case you want to change settings later edit ```/etc/sematext/sematext-agent-nginx.config```. 
A typical case is to add receiver URL for On-Premises installation of SPM in the config file:

```
# default value for SaaS / Sematext Cloud: https://spm-receiver.sematext.com:443/receiver/v1/_bulk
spmSenderBulkInsertUrl: http://your-spm-server:8084/_bulk
# default value for SaaS / Sematext Cloud: https://event-receiver.sematext.com
eventsReceiverUrl:  http://your-spm-server:8083
```


Restart the Sematext Nginx Agent after config changes, depending on the init system:
- Upstart (Ubuntu):  
```
    sudo service sematext-agent-nginx restart 
```
- Systemd (Linux others):  
```
    sudo systemctl stop sematext-agent-nginx
    sudo systemctl start sematext-agent-nginx
```
- Launchd (Mac OS X): 
```
    sudo launchctl stop com.sematext.sematext-agent-nginx
    sudo launchctl stop com.sematext.sematext-agent-nginx
```

For tests you can just run the agent from command line:
```
sematext-agent-nginx --config /etc/sematext/sematext-agent-nginx.config
```

# Results

NGINX Metrics in Sematext: 
![](https://raw.githubusercontent.com/sematext/sematext-agent-nginx/master/nginx-report-screenshot.png)

# Docker 

Sematext Agent for Nginx includes a docker file and startup script to build a Docker image. 
```
git clone https://github.com/sematext/sematext-agent-nginx.git
cd sematext-agent-nginx
docker build -t sematext/sematext-agent-nginx .
```

The Sematext Nginx Agent supports following parameters on Docker: 

| Environment Variable | Description |
|----------------------|-------------|
| **Required parameters**  |         |
| SPM_TOKEN                | your SPM Token for the Nginx SPM App |
| NGINX_STATUS_URL          | the URL to Nginx server, delivering the stats (see Nginx configuration above). Please note the servername/ip must be reachable from the agent container. You might need to use --link nginx-container-name to create the network link. NGINX_STATUS_URL is not required with DOCKER_AUTO_DISCOVERY.|
|**Docker auto discovery** | Detect new nginx containers for monitoring! |
| DOCKER_AUTO_DISCOVERY | Enable auto discovery of containers e.g. DOCKER_AUTO_DISCOVERY=true |
| SPM_DOCKER_NETWORK | Name of the network to be used for HTTP queries to nginx. If this is set to "host" and docker run parameter ```--net=host``` the connection is made to the exposed ports. If this is not set or any other network name  (e.g. bridge) the connection is done via nginx container IP address and 'internal' port 80 (used inside the nginx container). This feature works only when the Docker socket is mounted with ```-v /var/run/docker.sock:/var/run/docker.sock```| 
| NGINX_STATUS_PATH  | Location of the nginx status page e.g. "/nginx_status" |
| PHP_FPM_STATUS_PATH | Location of the PHP FPM status page e.g. "/status" |
| IMAGE_NAME_PATTERN | Regular expression to match nginx image name. Default  value 'nginx'|
| **General parameters** | |
| HTTPS_PROXY              | Url to HTTPS proxy if the agent runs behind a firewall |
| SPM_RECEIVER_URL         | Optional for SPM On-Premises, default value: https://spm-receiver.sematext.com:443/receiver/v1/_bulk for On-Premises receiver use http://your-spm-server:8084|_bulk.  
| EVENTS_RECEIVER_URL      | Optional for SPM On-Premises, default value: https://event-receiver.sematext.com. For On-Premises use http://your-spm-server:8083|


Example:
```
docker run --name sematext-agent-nginx -e SPM_TOKEN=YOUR_SPM_NGINX_TOKEN_HERE  \ 
-e NGINX_STATUS_URL=http://nginx-server/nginx_status \ 
-d  sematext/sematext-agent-nginx
```

Example with auto discovery of nginx containers via Docker API: 
```
docker run --name sematext-agent-nginx \
-e SPM_TOKEN=YOUR_SPM_NGINX_TOKEN_HERE \
-e NGINX_STATUS_PATH=/nginx_Status \
-e DOCKER_AUTO_DISCOVERY=true \
--net=host -e SPM_DOCKER_NETWORK=host \
-v /var/run/docker.sock:/var/run/docker.sock -d \
sematext/sematext-agent-nginx
```


# Support 

- Twitter: [@sematext](https://www.twitter.com/sematext)
- Blog: [blog.sematext.com](https://blog.sematext.com)
- Homepage: [www.sematext.com](https://www.sematext.com)
