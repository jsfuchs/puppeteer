# Web Puppeteer Quick Start (Installation Guide) #

The following steps are based on the configurations listed below, please adjust accordingly to fit your scenario.

Consider the scenario that there is a web server which hosts some web applications and we have write access to the web server. **(Note: If you can't upload web pages to the web server, you should click [here](ProxyConfiguration.md) to see how to run your tests using a proxy.)**


  * Web server: http://localhost/
  * Web application to be tested: http://localhost/webApp/
  * Web server root: /var/www/
  * Directory to install Puppeteer: /var/www/puppeteer


## 1. Install puppeteer ##
Download and install puppeteer to /var/www/puppeteer/ .

```bash
cd /tmp/
git clone https://github.com/google/puppeteer.git
mkdir /var/www/puppeteer
cp /tmp/puppeteer/* /var/www/puppeteer/ -R
chmod 755 /var/www/puppeteer -R
```

Note that to run a puppeteer test, you only need the files directly under puppeteer's directory. All other files in the sub-directories (e.g., modules/) are source files that are already compiled into a bundle (modules.js). Editing the downloaded source files on you web server WILL NOT affect puppeteer.


## 2. Validate the installation ##
Now let's write a trivial puppeteer test to verify if puppeteer is installed successfully.

```bash
touch /var/www/puppeteer/helloPuppeteer.html
chmod 755 /var/www/puppeteer/helloPuppeteer.html
vi /var/www/puppeteer/helloPuppeteer.html
```

```html
<script src="./puppet.js"></script>

<script>
/**
 * My first Web Puppeteer test.
 */
window.onload = function() {
  run(load, '/webApp/');
};
</script>
```

Open the test on your browser ([http://localhost/puppeteer/helloPuppeteer.html](http://localhost/puppeteer/helloPuppeteer.html)) and you should see Web Puppeteer running.
