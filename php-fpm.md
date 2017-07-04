# Preparation for PHP-FPM monitoring

For [PHP-FPM](http://php.net/manual/en/install.fpm.php) status monitoring activate PHP-FPM status page in your php-fpm config by removing the leading semicolon in the ```;pm.status_path = /status``` entry:

```
sudo sed -i -e "s/^;pm.status_path/pm.status_path/" /etc/php-fpm.d/www.conf
```

Or edit the file ` /etc/php-fpm.d/www.conf` manually and add the line

```
pm.status_path = /status
``` 

Restart php-fpm e.g. for upstart
```
sudo service php-fpm restart 
```

or for systemd
```
sudo systemctl restart php-fpm.service
```

Make sure that Node.js > 4.x is installed: [https://nodejs.org/en/download/package-manager/](https://nodejs.org/en/download/package-manager/)

Install sematext-agent-httpd via npm (Node package manage)
```sh
# Install sematext-agent-httpd (assuming nodejs is already installed)
sudo npm i sematext-agent-httpd -g
```

# Setup Nginx Agent with php-fpm unix socket (recommended)

Run the service setup for the PHP-FPM monitoring agent. Pass the SPM Token, Nginx status URL, and the PHP-FPM status URL to the setup command:
```
sematext-nginx-setup -t YOUR_SPM_TOKEN_HERE -n http://localhost/nginx_status -p http://unix:/var/run/php-fpm.sock:/status
```

# Setup with PHP-FPM status page via HTTP

In some scenarios, e.g. in Docker containers, the monitoring agent might not have access to the local UNIX socket. In such cases the PHP-FPM status page needs to be exposed via Nginx. 
To expose the PHP-FPM status page via Nginx change the Nginx configuration ```/etc/nginx/sites-enabled/default```:

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

Then run the setup command using HTTP URLs for status pages:
```
sematext-nginx-setup -t YOUR_SPM_TOKEN_HERE -n http://localhost/nginx_status -p http://localhost/status
```
