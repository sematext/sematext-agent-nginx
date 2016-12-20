# Preparation for PHP FPM monitoring

For [PHP-FPM](http://php.net/manual/en/install.fpm.php) status monitoring activate PHP-FPM status page in your php-fpm config by removing the leading semicolon in this the entry ```;pm.status_path = /status```:

```
sed -i -e "s/^;pm.status_path/pm.status_path/" /etc/php5/php-fpm.conf
```

# Setup Nginx Agent

```sh
# Install sematext-agent-nginx (assuming nodejs is already installed)
npm i sematext-agent-nginx -g
```

Then run the service setup for the monitoring agent for PHP-FPM. Pass the SPM Token, Nginx status URL and the PHP-FPM status URL to the setup command:
```
sematext-nginx-setup YOUR_SPM_TOKEN_HERE http://localhost/nginx_status http://unix:/var/run/php-fpm.sock:/status
```

# Setup with PHP-FPM status page via http

In some scenarios, e.g. in Docker containers, the monitoring agent might not have access to the local unix socket. In such a case the PHP-FPM status page needs to be exposed via Nginx. 
To expose the PHP-FPM status page via nginx change the nginx configuration ```/etc/nginx/sites-enabled/default```:

```
location ~ ^/(status|ping)$ {
       # access_log off;
       allow all;
       # allow SPM-MONITOR-IP;
       # deny all;
       fastcgi_pass unix:/var/run/php-fpm.sock;
       fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
       fastcgi_param SCRIPT_NAME $fastcgi_script_name;
       include fastcgi_params;
}
```

Then run the setup command, using the http urls for the status pages: 
```
sematext-nginx-setup YOUR_SPM_TOKEN_HERE http://localhost/nginx_status http://localhost/status
```



