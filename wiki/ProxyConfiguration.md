# Introduction #
### 1. Hosting Web Puppeteer tests directly on the testing web server ###
Ideally, if you have access to the web server that hosts the web application you'd like to test, you can simply upload your Web Puppeteer tests (html files) to the same web server and run the tests directly on the client's browser (as shown in the figure below).
Congratulation, you don't need a proxy in this scenario. An example configuration of your scenario can be found in QuickStart.

<img src='http://puppeteer.googlecode.com/svn/wiki/image/architecture_simple.png' width='400'>


<h3>2. Running Web Puppeteer tests via a proxy server</h3>
If you are unable to host your Web Puppeteer tests on the testing web server, you will need to setup a proxy server to overcome the limitations of JavaScript cross-domain communications. For example, your testing environment might looks like:<br>
<br>
<img src='http://puppeteer.googlecode.com/svn/wiki/image/architecture_proxy.png' width='400'>

You can follow the steps below to setup a proxy using Apache2 (on Ubuntu).<br>
<br>
<h1>Running a Reverse Proxy with Apache2</h1>
In this example, we demonstrate how to configure a proxy server such that we can run tests on Wikipedia (<a href='http://en.wikipedia.org/'>http://en.wikipedia.org/</a>).<br>
<br>
<h4>1. Install apache2</h4>
<pre><code>sudo apt-get install apache2<br>
</code></pre>

<h4>2. Enable proxy modules</h4>
<pre><code>cd /etc/apache2/mods-enabled<br>
sudo ln -s ../mods-available/proxy.*<br>
# Note: you probably don't need to enable all proxy modules.<br>
sudo ln -s ../mods-available/proxy_* ./<br>
</code></pre>

<h4>3. Configuring the proxy</h4>
<pre><code>sudo vi /etc/apache2/httpd.conf<br>
</code></pre>

<pre><code>Listen 5566<br>
&lt;VirtualHost *:5566&gt;<br>
  DocumentRoot /var/www<br>
<br>
  # Reversed proxy<br>
  # See: http://httpd.apache.org/docs/2.2/mod/mod_proxy.html<br>
  ProxyRequests Off<br>
<br>
  # Do NOT proxy URLs under /puppeteer to the remote site.<br>
  # You should put your Web Puppeteer files/tests under /var/www/puppeteer<br>
  ProxyPass /puppeteer !  <br>
<br>
  # Map http://&lt;proxy's host name&gt;:8080/ to http://en.wikipedia.org/<br>
  ProxyPass / http://en.wikipedia.org/<br>
  ProxyPassReverse / http://en.wikipedia.org/<br>
&lt;/VirtualHost&gt;<br>
<br>
&lt;Proxy *&gt;<br>
  Order Deny,Allow<br>
  Deny from all<br>
  # Allow proxy access from these domains.<br>
  Allow from localhost<br>
  Allow from google.com<br>
&lt;/Proxy&gt;<br>
<br>
</code></pre>

<h4>4. Restart apache2</h4>
<pre><code>sudo apache2ctl restart<br>
</code></pre>

<h4>5. Install Web Puppeteer</h4>
<pre><code>cd /tmp/ <br>
svn checkout http://puppeteer.googlecode.com/svn/trunk/ puppeteer-read-only<br>
mkdir /var/www/puppeteer<br>
cp /tmp/puppeteer-read-only/* /var/www/puppeteer/ -R<br>
chmod 755 /var/www/puppeteer -R<br>
</code></pre>

<h4>6. Write a Web Puppeteer test for Wikipedia</h4>
<pre><code>touch /var/www/puppeteer/wiki_test.html<br>
chmod 755 /var/www/puppeteer/wiki_test.html<br>
vi /var/www/puppeteer/wiki_test.html<br>
</code></pre>

<pre><code>&lt;script src="./puppet.js"&gt;&lt;/script&gt;<br>
<br>
&lt;script&gt;<br>
/**<br>
 * Test searching wikipedia for "boston", then "Fenway park"<br>
 */<br>
window.onload = function() {<br>
  var wiki = {<br>
    searchBox: id('searchInput'),<br>
    searchButton: id('searchButton'),<br>
    sugResults: xclass('suggestions-result', '//div'),<br>
    pageHeading: id('firstHeading'),<br>
    toc: id('toc')<br>
  };<br>
<br>
  // Load wikipedia (through the proxy)<br>
  run(load, '/');<br>
<br>
  // Test searching "boston" in wikipedia <br>
  run(type, wiki.searchBox, 'boston');<br>
<br>
  // Make sure there are some suggestions in the search box.<br>
  run(some(shown), wiki.sugResults);<br>
<br>
  // Click the search button.<br>
  run(click, wiki.searchButton);<br>
<br>
  // Verify the result page have "Boston" in its title. <br>
  run(text, wiki.pageHeading, /Boston/);<br>
<br>
  // Check if there are some "Fenway Park" links in the page.<br>
  run(some(shown), xtitle("Fenway Park", '//a'));<br>
<br>
  // Click the first "Fenway park" link in the page.<br>
  run(click, at(xtitle("Fenway Park", '//a'), 1));<br>
<br>
  // Verify the loaded page have "Park" in its title.<br>
  run(text, wiki.pageHeading, /Park/);<br>
};<br>
&lt;/script&gt;<br>
</code></pre>

<h4>7. Run the Web Puppeteer test</h4>
Open the test page in your browser and the watch puppet runs!<br>
<br>
For example: <a href='http://localhost:5566/puppeteer/wiki_test.html'>http://localhost:5566/puppeteer/wiki_test.html</a>

<h3>Note</h3>
<ul><li>If you got a 502/503 error, you might want to check your firewall configuration.<br>
<pre><code>#For example, disable firewall on Ubuntu<br>
$sudo ufw status<br>
$sudo ufw disable<br>
</code></pre>