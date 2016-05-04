[![bitHound Overalll Score](https://www.bithound.io/github/sematext/sematext-agent-nginx/badges/score.svg)](https://www.bithound.io/github/sematext/sematext-agent-nginx) [![Build Status](https://travis-ci.org/sematext/sematext-agent-nginx.svg?branch=master)](https://travis-ci.org/sematext/sematext-agent-nginx)

# WORK IN PROGRESS ...

This is the NGINX monitoring Agent for [SPM Performance Monitoring](http://sematext.com/spm/)


# Preparation 

1. Get a free account at [sematext.com/spm](https://apps.sematext.com/users-web/register.do)  

2. [Create an SPM App](https://apps.sematext.com/spm-reports/registerApplication.do) of type "Nginx" and copy the SPM Application Token - or execute the commands displayed in the Sematext UI (which are described here as well)

3. [Install Node.js](https://nodejs.org/en/download/package-manager/) on your Nginx server

4. Activate stats interface in the ```server``` section in your Nginx config e.g. in ```/etc/nginx/sites-enabled/default```: 
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

# Support 

- Twitter: [@sematext](http://www.twitter.com/sematext)
- Blog: [blog.sematext.com](http://blog.sematext.com)
- Homepage: [www.sematext.com](http://www.sematext.com)

