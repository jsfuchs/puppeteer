/* Copyright 2011 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Author: joonlee@google.com (Joon Lee)
 *
 * The tests below are modeled after the closure user agent tests.
 */

goog.require('goog.testing.jsunit');
goog.require('goog.testing.MockUserAgent');
goog.require('puppet.userAgent');

goog.setTestOnly('puppet.userAgentTest');

var mockUserAgent;

function setUp() {
  mockUserAgent = new goog.testing.MockUserAgent();
  mockUserAgent.install();
}

function tearDown() {
  goog.dispose(mockUserAgent);
}

function testInternetExplorer() {
  var ua = 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; GTB6; ' +
           'chromeframe; .NET CLR 1.1.4322; InfoPath.1; ' +
           '.NET CLR 3.0.04506.30; .NET CLR 3.0.04506.648; ' +
           '.NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; .NET CLR 2.0.50727)';
  assertProduct(ua, 'IE');
  assertEquals(true, puppet.userAgent.isIE(7));
  assertEquals(true, puppet.userAgent.isIE('7.0'));
  assertEquals(true, puppet.userAgent.isIE('7.0', '9.0'));
  assertEquals(false, puppet.userAgent.isIE('6.9', '7'));
  assertEquals(false, puppet.userAgent.isIE(6, 7.0));
  assertEquals(false, puppet.userAgent.isIE(7, 7));
  assertEquals(true, puppet.userAgent.isIE(7, 8));
  assertEquals(true, puppet.userAgent.isIE('7', 7.1));
  assertEquals(true, puppet.userAgent.isIE(7, '7.1'));
  assertEquals(false, puppet.userAgent.isIE(6));
  assertEquals(false, puppet.userAgent.isIE(8));
  assertEquals(false, puppet.userAgent.isIE('7.1'));
  assertEquals(false, puppet.userAgent.isIE('8.0'));
}

function testOpera() {
  var ua = 'Opera/9.80 (Windows NT 5.1; U; en) Presto/2.2.15 Version/10.01';
  assertProduct(ua, 'Opera');
  assertEquals(false, puppet.userAgent.isOpera(9));
  assertEquals(true, puppet.userAgent.isOpera('10.1'));
  assertEquals(false, puppet.userAgent.isOpera('10.0'));
  assertEquals(false, puppet.userAgent.isOpera(11));
  assertEquals(true, puppet.userAgent.isOpera(9, 10.5));
}

function testFirefox() {
  var ua = 'Mozilla/6.0 (Macintosh; U; PPC Mac OS X Mach-O; en-US; ' +
           'rv:2.0.0.0) Gecko/20061028 Firefox/3.0';
  assertProduct(ua, 'Firefox');
  assertEquals(false, puppet.userAgent.isFirefox(1));
  assertEquals(true, puppet.userAgent.isFirefox('3.0'));
  assertEquals(false, puppet.userAgent.isFirefox('3.5.3'));

  ua = 'Mozilla/5.0 (Macintosh; U; PPC Mac OS X Mach-O; en-US; ' +
       'rv:1.8.1.4) Gecko/20070515 Firefox/2.0.4';
  assertProduct(ua, 'Firefox');
  assertEquals(true, puppet.userAgent.isFirefox('2'));
  assertEquals(true, puppet.userAgent.isFirefox(2, null));
  assertEquals(true, puppet.userAgent.isFirefox('2.0.4'));
  assertEquals(false, puppet.userAgent.isFirefox(3));
  assertEquals(false, puppet.userAgent.isFirefox('3.5.3'));
}

function testCamino() {
  var ua = 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X; en; rv:1.8.1.11) ' +
           'Gecko/20071128 Camino/1.5.4';
  assertProduct(ua, 'Camino');
  assertEquals(true, puppet.userAgent.isCamino('1.5.4'));
  assertEquals(true, puppet.userAgent.isCamino(1, 2));
  assertEquals(false, puppet.userAgent.isCamino('2.0'));

  ua = 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X; en-US; rv:1.8.0.10) ' +
       'Gecko/20070228 Camino/1.0.4';
  assertProduct(ua, 'Camino');
  assertEquals(false, puppet.userAgent.isCamino('1.5.4'));
  assertEquals(true, puppet.userAgent.isCamino('1', '2'));
  assertEquals(false, puppet.userAgent.isCamino('2.0'));
}

function testChrome() {
  var ua = 'Mozilla/5.0 (Windows; U; Windows NT 6.0; en-US) ' +
           'AppleWebKit/525.19 (KHTML, like Gecko) Chrome/0.2.153.0 ' +
           'Safari/525.19';
  assertProduct(ua, 'Chrome');
  assertEquals(true, puppet.userAgent.isChrome('0.2.153'));
  assertEquals(false, puppet.userAgent.isChrome(1));
  assertEquals(true, puppet.userAgent.isWebKit('525.19'));
  assertEquals(false, puppet.userAgent.isWebKit('525.2'));

  ua = 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) ' +
       'AppleWebKit/532.3 (KHTML, like Gecko) Chrome/4.0.223.11 ' +
       'Safari/532.3';
  assertProduct(ua, 'Chrome');
  assertEquals(true, puppet.userAgent.isChrome(4, null));
  assertEquals(false, puppet.userAgent.isChrome('0.2.153'));
  assertEquals(false, puppet.userAgent.isChrome('4.1.223.13'));
  assertEquals(true, puppet.userAgent.isChrome('4.0.223.11'));
  assertEquals(true, puppet.userAgent.isWebKit(532.3));
  assertEquals(false, puppet.userAgent.isWebKit(532.4));
}

function testSafari() {
  var ua = 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_7; de-de) ' +
           'AppleWebKit/534.16+ (KHTML, like Gecko) Version/5.0.3 ' +
           'Safari/533.19.4';
  assertProduct(ua, 'Safari');
  assertEquals(true, puppet.userAgent.isSafari(5, null));
  assertEquals(true, puppet.userAgent.isSafari('5.0.3'));
  assertEquals(false, puppet.userAgent.isSafari('5.0.4'));
  assertEquals(false, puppet.userAgent.isSafari(503));
  assertEquals(true, puppet.userAgent.isWebKit('534', '535'));
  assertEquals(false, puppet.userAgent.isWebKit('535', null));

  ua = 'Mozilla/5.0 (Windows; U; Windows NT 6.0; pl-PL) ' +
       'AppleWebKit/525.19 (KHTML, like Gecko) Version/3.1.2 Safari/525.21';
  assertProduct(ua, 'Safari');
  assertEquals(true, puppet.userAgent.isSafari(3, 3.99));
  assertEquals(true, puppet.userAgent.isSafari('3.0', '3.2'));
  assertEquals(true, puppet.userAgent.isSafari('3.1.2'));
  assertEquals(true, puppet.userAgent.isWebKit('525.19'));

  ua = 'Mozilla/5.0 (Macintosh; U; PPC Mac OS X 10_5_3; en-us) ' +
       'AppleWebKit/525.18 (KHTML, like Gecko) Version/3.1.1 Safari/525.20';
  assertProduct(ua, 'Safari');
  assertEquals(true, puppet.userAgent.isSafari(3, 3.99));
  assertEquals(true, puppet.userAgent.isSafari('3.1.1'));
  assertEquals(false, puppet.userAgent.isSafari('3.1.2'));
  assertEquals(false, puppet.userAgent.isSafari('525.21'));
  assertEquals(true, puppet.userAgent.isWebKit('525.18'));

  // Safari 1 and 2 do not report product version numbers in their
  // user-agent strings. VERSION for these browsers will be set to ''.
  ua = 'Mozilla/5.0 (Macintosh; U; PPC Mac OS X; ja-jp) ' +
       'AppleWebKit/418.9.1 (KHTML, like Gecko) Safari/419.3';
  assertProduct(ua, 'Safari');
  assertEquals(true, puppet.userAgent.isSafari(0, null));
  assertEquals(false, puppet.userAgent.isSafari(1));
  assertEquals(false, puppet.userAgent.isSafari(2));
  assertEquals(false, puppet.userAgent.isSafari(3));
  assertEquals(true, puppet.userAgent.isSafari(0));
  assertEquals(true, puppet.userAgent.isSafari('0'));
  assertEquals(true, puppet.userAgent.isSafari());
  assertEquals(false, puppet.userAgent.isSafari('3.1.1'));
  assertEquals(true, puppet.userAgent.isWebKit('418.9.1'));
}

function testIPhone() {
  var ua = 'Mozilla/5.0 (iPhone; U; CPU like Mac OS X; en) AppleWebKit/420+ ' +
           '(KHTML, like Gecko) Version/3.0 Mobile/1A543a Safari/419.3';
  assertProduct(ua, 'IPhone');
  assertEquals(true, puppet.userAgent.isIPhone('3.0.1A543a'));
  assertEquals(true, puppet.userAgent.isIPhone('3.0', '3.5'));
  assertEquals(false, puppet.userAgent.isIPhone('3.0.1B543a'));
  assertEquals(false, puppet.userAgent.isIPhone('3.1.1A543a'));
  assertEquals(false, puppet.userAgent.isIPhone('3.1.1A320c', null));
  assertEquals(false, puppet.userAgent.isIPhone('3.0.3A100a'));
  assertEquals(true, puppet.userAgent.isWebKit('420+'));
  assertEquals(true, puppet.userAgent.isMobileWebKit('420+'));
  assertEquals(true, puppet.userAgent.isMobileWebKit('420+', null));
  assertEquals(false, puppet.userAgent.isMobileWebKit(421, 422));
  assertEquals(false, puppet.userAgent.isAndroidMobile());
  assertEquals(false, puppet.userAgent.isUIWebView());

  ua = 'Mozilla/5.0 (iPod; U; CPU like Mac OS X; en) AppleWebKit/420.1 ' +
       '(KHTML, like Gecko) Version/3.0 Mobile/3A100a Safari/419.3';
  assertProduct(ua, 'IPhone');
  assertEquals(true, puppet.userAgent.isIPhone('3.0.3A100a'));
  assertEquals(true, puppet.userAgent.isIPhone('3.0.1A543a', 4));
  assertEquals(true, puppet.userAgent.isWebKit('420.1'));
  assertEquals(true, puppet.userAgent.isMobileWebKit('420.1'));
  assertEquals(true, puppet.userAgent.isMobileWebKit('420'));
  assertEquals(false, puppet.userAgent.isUIWebView());

  ua = 'Mozilla/5.0 (iPhone; CPU like Mac OS X) AppleWebKit/536.26 ' +
       '(KHTML, like Gecko) GSA/3.2.1.25875 Mobile/11B554a ' +
       'Safari/8536.25';
  assertProduct(ua, 'IPhone');
  assertEquals(true, puppet.userAgent.isWebKit('536.26'));
  assertEquals(true, puppet.userAgent.isMobileWebKit('536.26'));
  assertEquals(true, puppet.userAgent.isUIWebView());
}

function testIPad() {
  var ua = 'Mozilla/5.0 (iPad; U; CPU OS 3_2 like Mac OS X; en-us) ' +
           'AppleWebKit/531.21.10 (KHTML, like Gecko) Version/4.0.4 ' +
           'Mobile/7B334b Safari/531.21.10';
  assertProduct(ua, 'IPad');
  assertEquals(true, puppet.userAgent.isIPad('4.0.4.7B334b'));
  assertEquals(true, puppet.userAgent.isIPad('4.0', '4.1'));
  assertEquals(false, puppet.userAgent.isIPad('4.0.4.7C334b'));
  assertEquals(false, puppet.userAgent.isIPad('4.1.4.7B334b'));
  assertEquals(true, puppet.userAgent.isIPad('4.0.4.7B320c', null));
  assertEquals(false, puppet.userAgent.isIPad('4.0.4.8B334b'));
  assertEquals(true, puppet.userAgent.isWebKit('531.21.10'));
  assertEquals(true, puppet.userAgent.isMobileWebKit('531.21.10'));
  assertEquals(false, puppet.userAgent.isUIWebView());

  ua = 'Mozilla/5.0 (iPad; CPU like Mac OS X) AppleWebKit/536.26 ' +
       '(KHTML, like Gecko) GSA/3.2.0.25255 Mobile/11A465 ' +
       'Safari/8536.25';
  assertProduct(ua, 'IPad');
  assertEquals(true, puppet.userAgent.isWebKit('536.26'));
  assertEquals(true, puppet.userAgent.isMobileWebKit('536.26'));
  assertEquals(true, puppet.userAgent.isUIWebView());
}

function testAndroid() {
  var ua = 'Mozilla/5.0 (Linux; U; Android 0.5; en-us) AppleWebKit/522+ ' +
           '(KHTML, like Gecko) Safari/419.3';
  assertProduct(ua, 'Android');
  assertEquals(true, puppet.userAgent.isAndroid(0.5));
  assertEquals(true, puppet.userAgent.isAndroid(0.5, 1));
  assertEquals(true, puppet.userAgent.isAndroid(0.5, null));
  assertEquals(false, puppet.userAgent.isAndroid(1, 2));
  assertEquals(true, puppet.userAgent.isWebKit('522+'));
  assertEquals(false, puppet.userAgent.isMobileWebKit('522+'));
  assertEquals(false, puppet.userAgent.isAndroidMobile());
  assertEquals(true, puppet.userAgent.isAndroidTablet());
  assertEquals(true, puppet.userAgent.isAndroidTablet(0.5));

  ua = 'Mozilla/5.0 (Linux; U; Android 1.0; en-us; dream) ' +
       'AppleWebKit/525.10+ (KHTML, like Gecko) Version/3.0.4 Mobile ' +
       'Safari/523.12.2';
  assertProduct(ua, 'Android');
  assertEquals(true, puppet.userAgent.isAndroid(0.5, null));
  assertEquals(false, puppet.userAgent.isAndroid(3, 4));
  assertEquals(false, puppet.userAgent.isAndroid('3.0.4'));
  assertEquals(false, puppet.userAgent.isAndroid('3.0.12'));
  assertEquals(true, puppet.userAgent.isAndroid('1'));
  assertEquals(true, puppet.userAgent.isWebKit('525.10+'));
  assertEquals(true, puppet.userAgent.isMobileWebKit('525.10+'));
  assertEquals(true, puppet.userAgent.isAndroidMobile());
  assertEquals(true, puppet.userAgent.isAndroidMobile(1, 2));
  assertEquals(false, puppet.userAgent.isAndroidMobile(3, null));
  assertEquals(false, puppet.userAgent.isAndroidTablet());
}

function testWindows() {
  var win98 = 'Mozilla/4.0 (compatible; MSIE 6.0b; Windows 98; Win 9x 4.90)';
  var win2k = 'Mozilla/5.0 (Windows; U; MSIE 7.0; Windows NT 5.0; en-US)';
  var xp = 'Mozilla/5.0 (Windows; U; MSIE 7.0; Windows NT 5.1; en-US)';
  var vista = 'Mozilla/5.0 (Windows; U; MSIE 7.0; Windows NT 6.0; en-US)';
  var win7 = 'Mozilla/5.0 (Windows; U; MSIE 7.0; Windows NT 6.1; en-US)';

  assertPlatform(win98, 'Windows');
  assertEquals(true, puppet.userAgent.isWindows('0'));

  assertPlatform(win2k, 'Windows');
  assertEquals(true, puppet.userAgent.isWindows('5.0'));
  assertEquals(false, puppet.userAgent.isWindows('5.1'));
  assertEquals(false, puppet.userAgent.isWindows(5.1));
  assertEquals(true, puppet.userAgent.isWindows(5, 6));

  assertPlatform(xp, 'Windows');
  assertEquals(true, puppet.userAgent.isWindows('5.1'));
  assertEquals(true, puppet.userAgent.isWindows('5.1', null));
  assertEquals(true, puppet.userAgent.isWindows(5));
  assertEquals(false, puppet.userAgent.isWindows(5.11));

  assertPlatform(vista, 'Windows');
  assertEquals(true, puppet.userAgent.isWindows('6.0'));
  assertEquals(true, puppet.userAgent.isWindows(0, 7));

  assertPlatform(win7, 'Windows');
  assertEquals(true, puppet.userAgent.isWindows('6.1'));
  assertEquals(true, puppet.userAgent.isWindows(6));
  assertEquals(false, puppet.userAgent.isWindows(6.2));
}

function testMac() {
  var chrome = 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_5_8; en-US)' +
               'AppleWebKit/532.5 (KHTML, like Gecko)' +
               'Chrome/4.0.249.49 Safari/532.5';
  var ff = 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.5; en-US;' +
           'rv:1.9.1.7) Gecko/20091221 Firefox/3.5.7 GTB6';

  assertPlatform(chrome, 'Mac');
  assertEquals(true, puppet.userAgent.isMac('10.5.8'));
  assertEquals(false, puppet.userAgent.isMac('10.5.9'));
  assertEquals(true, puppet.userAgent.isMac(10, 11));

  assertPlatform(ff, 'Mac');
  assertEquals(true, puppet.userAgent.isMac('10.5'));
  assertEquals(true, puppet.userAgent.isMac(10.5));
  assertEquals(false, puppet.userAgent.isMac(10.6));
}

function testLinux() {
  var chrome = 'Mozilla/5.0 (Linux x86_64) AppleWebKit/535.1' +
               '(KHTML, like Gecko) Chrome/13.0.782.41 Safari/535.1';
  var ff = 'Mozilla/5.0 (X11; U; FreeBSD i386; ja-JP; rv:1.9.1.8)' +
           'Gecko/20100305 Firefox/3.5.8';

  assertPlatform(chrome, 'Linux');
  assertPlatform(ff, 'X11');
}

function testBlackberry() {
  var ua = 'Mozilla/5.0 (BlackBerry; U; BlackBerry 9800; en-US) ' +
           'AppleWebKit/534.1+ (KHTML, like Gecko) Version/6.0.0.246 ' +
           ' Mobile Safari/534.1+';
  assertPlatform(ua, 'Blackberry');
}

function testPlaybook() {
  var ua = 'Mozilla/5.0 (PlayBook; U; RIM Tablet OS 1.0.0; en-US) ' +
           'AppleWebKit/534.11+';
  assertPlatform(ua, 'PlayBook');
}

function testDolfin() {
  var ua = 'Mozilla/5.0 (SCH-F859/F859DG12;U;NUCLEUS/2.1;Profile/MIDP-2.1 ' +
           'Configuration/CLDC-1.1;480*800;CTC/2.0) Dolfin/2.0';
  assertPlatform(ua, 'Dolfin');
}

function testGecko() {
  assertEngine('Mozilla/5.0 (Windows; U; Windows NT 5.1; nl-NL; ' +
      'rv:1.7.5) Gecko/20041202 Gecko/1.0', 'Gecko');
  assertEquals(true, puppet.userAgent.isGecko('1.7.5'));

  assertEngine('Mozilla/5.0 (X11; U; Linux x86_64; en-US; ' +
      'rv:1.7.6) Gecko/20050512 Gecko', 'Gecko');
  assertEquals(true, puppet.userAgent.isGecko('1.7.6'));

  assertEngine('Mozilla/5.0 (X11; U; FreeBSD i386; en-US; ' +
      'rv:1.7.8) Gecko/20050609 Gecko/1.0.4', 'Gecko');
  assertEquals(true, puppet.userAgent.isGecko('1.7.8'));

  assertEngine('Mozilla/5.0 (X11; U; Linux i686; en-US;' +
      'rv:1.7.9) Gecko/20050711 Gecko/1.0.5', 'Gecko');
  assertEquals(true, puppet.userAgent.isGecko('1.7.9'));

  assertEngine('Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; ' +
      'rv:1.7.10) Gecko/20050716 Gecko/1.0.6', 'Gecko');
  assertEquals(true, puppet.userAgent.isGecko('1.7.10'));

  assertEngine('Mozilla/5.0 (Macintosh; U; PPC Mac OS X Mach-O; ' +
      ' en-GB; rv:1.7.10) Gecko/20050717 Gecko/1.0.6', 'Gecko');
  assertEquals(true, puppet.userAgent.isGecko('1.7.10'));

  assertEngine('Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; ' +
      'rv:1.7.12) Gecko/20050915 Gecko/1.0.7', 'Gecko');
  assertEquals(true, puppet.userAgent.isGecko('1.7.12'));

  assertEngine('Mozilla/5.0 (Macintosh; U; PPC Mac OS X Mach-O; ' +
      'en-US; rv:1.7.12) Gecko/20050915 Gecko/1.0.7', 'Gecko');
  assertEquals(true, puppet.userAgent.isGecko('1.7.12'));

  assertEngine('Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; ' +
      'rv:1.8b4) Gecko/20050908 Gecko/1.4', 'Gecko');
  assertEquals(true, puppet.userAgent.isGecko('1.8b4'));

  assertEngine('Mozilla/5.0 (Windows; U; Windows NT 5.1; nl; ' +
      'rv:1.8) Gecko/20051107 Gecko/1.5', 'Gecko');
  assertEquals(true, puppet.userAgent.isGecko('1.8'));

  assertEngine('Mozilla/5.0 (Windows; U; Windows NT 5.1; en-GB; ' +
      'rv:1.8.0.1) Gecko/20060111 Gecko/1.5.0.1', 'Gecko');
  assertEquals(true, puppet.userAgent.isGecko('1.8.0.1'));

  assertEngine('Mozilla/5.0 (Windows; U; Windows NT 6.0; en-US; ' +
      'rv:1.8.0.1) Gecko/20060111 Gecko/1.5.0.1', 'Gecko');
  assertEquals(true, puppet.userAgent.isGecko('1.8.0.1'));

  assertEngine('Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.8.0.2)' +
      'Gecko/20060308 Gecko/1.5.0.2', 'Gecko');
  assertEquals(true, puppet.userAgent.isGecko('1.8.0.2'));

  assertEngine('Mozilla/5.0 (Macintosh; U; PPC Mac OS X Mach-O; ' +
       'en-US; rv:1.8.0.3) Gecko/20060426 Gecko/1.5.0.3', 'Gecko');
  assertEquals(true, puppet.userAgent.isGecko('1.8.0.3'));

  assertEngine('Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.8.0.3)' +
      'Gecko/20060426 Gecko/1.5.0.3', 'Gecko');
  assertEquals(true, puppet.userAgent.isGecko('1.8.0.3'));

  assertEngine('Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.8.0.4)' +
      'Gecko/20060508 Gecko/1.5.0.4', 'Gecko');
  assertEquals(true, puppet.userAgent.isGecko('1.8.0.4'));

  assertEngine('Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; ' +
      'rv:1.8.0.4) Gecko/20060508 Gecko/1.5.0.4', 'Gecko');
  assertEquals(true, puppet.userAgent.isGecko('1.8.0.4'));

  assertEngine('Mozilla/5.0 (Windows; U; Windows NT 6.0; en-US; ' +
      'rv:1.8.0.4) Gecko/20060508 Gecko/1.5.0.4', 'Gecko');
  assertEquals(true, puppet.userAgent.isGecko('1.8.0.4'));

  assertEngine('Mozilla/5.0 (Windows; U; Windows NT 5.1; es-ES; ' +
      'rv:1.8.0.6) Gecko/20060728 Gecko/1.5.0.6', 'Gecko');
  assertEquals(true, puppet.userAgent.isGecko('1.8.0.6'));

  assertEngine('Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.8.0.6)' +
      ' Gecko/20060808 Fedora/1.5.0.6-2.fc5 Gecko/1.5.0.6 ' +
      ' pango-text', 'Gecko');
  assertEquals(true, puppet.userAgent.isGecko('1.8.0.6'));

  assertEngine('Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; ' +
      'rv:1.8) Gecko/20060321 Gecko/2.0a1', 'Gecko');
  assertEquals(true, puppet.userAgent.isGecko('1.8'));
}

function testIEEngine() {
  assertEngine('Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0)', 'IE');
  assertEquals(true, puppet.userAgent.isIE('5.01'));

  assertEngine('Mozilla/4.0 (compatible; MSIE 5.17; Mac_PowerPC)', 'IE');
  assertEquals(true, puppet.userAgent.isIE('5.17'));

  assertEngine('Mozilla/4.0 (compatible; MSIE 5.23; Mac_PowerPC)', 'IE');
  assertEquals(true, puppet.userAgent.isIE('5.23'));

  assertEngine('Mozilla/4.0 (compatible; MSIE 5.5; Windows NT 5.0)', 'IE');
  assertEquals(true, puppet.userAgent.isIE('5.5'));

  assertEngine('Mozilla/4.0 (compatible; MSIE 6.0; MSN 2.5; ' +
       'Windows 98)', 'IE');
  assertEquals(true, puppet.userAgent.isIE('6.0'));

  assertEngine('Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; ' +
       'SV1)', 'IE');
  assertEquals(true, puppet.userAgent.isIE('6.0'));

  assertEngine('Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; ' +
      'SV1; .NET CLR 1.1.4322)', 'IE');
  assertEquals(true, puppet.userAgent.isIE('6.0'));

  assertEngine('Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; ' +
      'SV1; .NET CLR 2.0.50727)', 'IE');
  assertEquals(true, puppet.userAgent.isIE('6.0'));

  assertEngine('Mozilla/4.0 (compatible; MSIE 7.0b; Windows NT 5.1)', 'IE');
  assertEquals(true, puppet.userAgent.isIE('7.0b'));

  assertEngine('Mozilla/4.0 (compatible; MSIE 7.0b; Win32)', 'IE');
  assertEquals(true, puppet.userAgent.isIE('7.0b'));

  assertEngine('Mozilla/4.0 (compatible; MSIE 7.0b; Windows NT 6.0)', 'IE');
  assertEquals(true, puppet.userAgent.isIE('7.0b'));

  assertEngine('Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; ' +
      'SV1; Arcor 5.005; .NET CLR 1.0.3705; .NET CLR 1.1.4322)', 'IE');
  assertEquals(true, puppet.userAgent.isIE('7.0'));
  assertEquals(false, puppet.userAgent.isIETouch());

  assertEngine('Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; WOW64;' +
      ' Trident/6.0; Touch)', 'IE');
  assertEquals(true, puppet.userAgent.isIE('10.0'));
  assertEquals(true, puppet.userAgent.isIETouch());

  assertEngine('Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; WOW64;' +
      ' Trident/6.0; .NET4.0E; .NET4.0C)', 'IE');
  assertEquals(true, puppet.userAgent.isIE('10.0'));
  assertEquals(false, puppet.userAgent.isIETouch());
  assertEquals(false, puppet.userAgent.isIEWebView());

  assertEngine('Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Win64;' +
      ' x64; Trident/6.0; Touch; WebView/1.0)', 'IE');
  assertEquals(true, puppet.userAgent.isIE('10.0'));
  assertEquals(true, puppet.userAgent.isIEWebView());
}

function testOperaEngine() {
  assertEngine('Opera/7.23 (Windows 98; U) [en]', 'Opera');
  assertEngine('Opera/8.00 (Windows NT 5.1; U; en)', 'Opera');
  assertEngine('Opera/8.0 (X11; Linux i686; U; cs)', 'Opera');
  assertEngine('Opera/8.02 (Windows NT 5.1; U; en)', 'Opera');
  assertEngine('Opera/8.50 (Windows NT 5.1; U; en)', 'Opera');
  assertEngine('Opera/8.5 (X11; Linux i686; U; cs)', 'Opera');
  assertEngine('Opera/8.51 (Windows NT 5.1; U; en)', 'Opera');
  assertEngine('Opera/9.0 (Windows NT 5.0; U; en)', 'Opera');
  assertEngine('Opera/9.00 (Macintosh; PPC Mac OS X; U; en)', 'Opera');
  assertEngine('Opera/9.00 (Windows NT 5.1; U; en)', 'Opera');
  assertEngine('Opera/9.00 (Windows NT 5.2; U; en)', 'Opera');
  assertEngine('Opera/9.00 (Windows NT 6.0; U; en)', 'Opera');
}

function assertProduct(ua, product) {
  initializeUserAgent(ua);
  assertEquals(product == 'Chrome', puppet.userAgent.isChrome());
  assertEquals(product == 'Firefox', puppet.userAgent.isFirefox());
  assertEquals(product == 'Opera', puppet.userAgent.isOpera());
  assertEquals(product == 'Camino', puppet.userAgent.isCamino());
  assertEquals(product == 'Safari', puppet.userAgent.isSafari());
  assertEquals(product == 'IPhone', puppet.userAgent.isIPhone());
  assertEquals(product == 'IPad', puppet.userAgent.isIPad());
  assertEquals(product == 'Android', puppet.userAgent.isAndroid());
  assertEquals(product == 'IE', puppet.userAgent.isIE());
  assertEquals(product == 'Blackberry', puppet.userAgent.isBlackberry());
  assertEquals(product == 'Dolfin', puppet.userAgent.isDolfin());
}

function assertEngine(ua, engine) {
  initializeUserAgent(ua);
  assertEquals(engine == 'IE', puppet.userAgent.isIE());
  assertEquals(engine == 'Gecko', puppet.userAgent.isGecko());
  assertEquals(engine == 'WebKit', puppet.userAgent.isWebKit());
  assertEquals(engine == 'MobileWebKit', puppet.userAgent.isMobileWebKit());
  assertEquals(engine == 'Opera', puppet.userAgent.isOpera());
}

function assertPlatform(ua, platform) {
  initializeUserAgent(ua);
  assertEquals(platform == 'Windows', puppet.userAgent.isWindows());
  assertEquals(platform == 'Mac', puppet.userAgent.isMac());
  assertEquals(platform == 'Linux', puppet.userAgent.isLinux());
  assertEquals(platform == 'X11', puppet.userAgent.isX11());
  assertEquals(platform == 'Blackberry', puppet.userAgent.isBlackberry());
  assertEquals(platform == 'Dolfin', puppet.userAgent.isDolfin());
}

function initializeUserAgent(ua) {
  mockUserAgent.setUserAgentString(ua);
  goog.userAgentTestUtil.reinitializeUserAgent();
  puppet.userAgent.init(ua);
}
