[![bitHound Overalll Score](https://www.bithound.io/github/sematext/sematext-agent-nginx/badges/score.svg)](https://www.bithound.io/github/sematext/sematext-agent-nginx) [![Build Status](https://travis-ci.org/sematext/sematext-agent-nginx.svg?branch=master)](https://travis-ci.org/sematext/sematext-agent-nginx)

# WORK IN PROGRESS ...

This is the NGINX monitoring Agent for [SPM Performance Monitoring](http://sematext.com/spm/)


# Preparation 

1. Get a free account at [sematext.com/spm](https://apps.sematext.com/users-web/register.do)  

2. [Create an SPM App](https://apps.sematext.com/spm-reports/registerApplication.do) of type "Nginx" and copy the SPM Application Token - or execute the commands displayed in the Sematext UI (which are described here as well)

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

# Setup 
```sh
# Install sematext-agent-nginx 
npm i sematext/sematext-agent-nginx -g
# Install systemd or upstart service file for sematext-agent-nginx 
sematext-nginx-setup YOUR_SPM_TOKEN_HERE http://localhost/nginx_status
```
# Configuration 

The setup script will store your configuration in ```/etc/sematext/sematext-agent-nginx.config```

In case you like to change settings later edit ```/etc/sematext/sematext-agent-nginx.config```  
Then restart the Sematext Nginx Agent after config changes, depending on the init system:
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

TODO

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
| SPM_TOKEN            | your SPM Token for the Nginx SPM App |
| NGINX_STATS_URL      | the URL to Nginx server, delivering the stats (see Nginx configuration above). Please note the servername/ip must be reachable from the agent container. You might need to use --link nginx-container-name to create the network link. |
| HTTPS_PROXY          | Url to HTTPS proxy if the agent runs behind a firewall |

Example:
```
docker run --name sematext-agent-nginx -e SPM_TOKEN=YOUR_SPM_NGINX_TOKEN_HERE  \ 
-e NGINX_STATS_URL=http://nginx-server/nginx_status \ 
-d  sematext/sematext-agent-nginx
```

# Support 

- Twitter: [@sematext](http://www.twitter.com/sematext)
- Blog: [blog.sematext.com](http://blog.sematext.com)
- Homepage: [www.sematext.com](http://www.sematext.com)

