// Copyright 2011 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview UserAgent Library for Puppet.
 */

goog.provide('puppet.userAgent');

goog.require('goog.userAgent');
goog.require('goog.userAgent.platform');
goog.require('goog.userAgent.product');
goog.require('goog.userAgent.product.isVersion');
goog.require('puppet.logging');
goog.require('puppet.params');


/**
 * @type {{
 *   useragent: string
 * }}
 * @const
 */
puppet.userAgent.PARAMS = {
  // User-provided user agent string to override what the browser reports.
  useragent: puppet.params.declareString('useragent', '')
};


/**
 * Version on Android OS or null if not on Android.
 * @type {string}
 * @private
 */
puppet.userAgent.ANDROID_VERSION_;


/**
 * Whether we are on Blackberry.
 * @type {boolean}
 * @private
 */
puppet.userAgent.BLACKBERRY_;


/**
 * Whether we are on Blackberry Playbook.
 * @type {boolean}
 * @private
 */
puppet.userAgent.PLAYBOOK_;


/**
 * Whether we are on Dolfin.
 * This is a special case because goog.userAgent does not handle it.
 * @type {boolean}
 * @private
 */
puppet.userAgent.DOLFIN_;


/**
 * Whether we are on a version of Internet Explorer that has a touchscreen.
 * @type {boolean}
 * @private
 */
puppet.userAgent.IETOUCH_;


/**
 * Whether we are on a version of Internet Explorer using the WebView.
 * @type {boolean}
 * @private
 */
puppet.userAgent.IEWEBVIEW_;


/**
 * Whether we are on a version of UIWebView.
 * @type {boolean}
 * @private
 */
puppet.userAgent.UIWEBVIEW_;


/**
 * Initializes all the custom constants above using a given userAgent string.
 * This lives in a separate function, because it is called by init_() with a
 * spoofed userAgent for the purposes of testing.
 *
 * @param {string} userAgentString User agent string.
 * @private
 */
puppet.userAgent.initCustomConstants_ = function(userAgentString) {
  if (goog.userAgent.ANDROID) {
    var match = /Android\s+([0-9\.]+)/.exec(userAgentString);
    puppet.userAgent.ANDROID_VERSION_ = match ? match[1] : '0';
  } else {
    puppet.userAgent.ANDROID_VERSION_ = '';
  }
  puppet.userAgent.BLACKBERRY_ = /BlackBerry/.test(userAgentString);
  puppet.userAgent.PLAYBOOK_ = /PlayBook/.test(userAgentString);
  puppet.userAgent.DOLFIN_ = /Dolfin/.test(userAgentString);
  puppet.userAgent.IETOUCH_ = goog.userAgent.IE &&
                              /Touch/.test(userAgentString);
  puppet.userAgent.IEWEBVIEW_ = goog.userAgent.IE &&
                              /WebView/.test(userAgentString);
  puppet.userAgent.UIWEBVIEW_ = (goog.userAgent.product.IPHONE ||
                              goog.userAgent.product.IPAD) &&
                              !/Safari/.test(userAgentString);
};

// Initialize the above custom constants with the real user agent.
(function() {
  var userAgentString = goog.userAgent.getUserAgentString();
  if (!userAgentString) {
    puppet.logging.error('Null or empty useragent string');
    return;
  }
  puppet.userAgent.initCustomConstants_(userAgentString);
})();


/**
 * If running Firefox with specified versions.
 *
 * @param {(string|number)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if userAgent matches Firefox and matches the
 *   optional version parameters. False otherwise.
 */
puppet.userAgent.isFirefox = function(opt_min, opt_max) {
  return goog.userAgent.product.FIREFOX &&
         puppet.userAgent.checkProductVersion_(opt_min, opt_max);
};


/**
 * If running IE with specified versions.
 * IE refers to both the product and rendering engine.
 *
 * @param {(string|number)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if userAgent matches IE and matches the
 *   optional version parameters. False otherwise.
 */
puppet.userAgent.isIE = function(opt_min, opt_max) {
  return goog.userAgent.product.IE &&
         puppet.userAgent.checkProductVersion_(opt_min, opt_max);
};


/**
 * If running Chrome with specified versions.
 *
 * @param {(string|number)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if userAgent matches Chrome and matches the
 *   optional version parameters. False otherwise.
 */
puppet.userAgent.isChrome = function(opt_min, opt_max) {
  return goog.userAgent.product.CHROME &&
         puppet.userAgent.checkProductVersion_(opt_min, opt_max);
};


/**
 * If running Safari with specified versions.
 *
 * @param {(string|number)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if userAgent matches Safari and matches the
 *   optional version parameters. False otherwise.
 */
puppet.userAgent.isSafari = function(opt_min, opt_max) {
  return goog.userAgent.product.SAFARI &&
         puppet.userAgent.checkProductVersion_(opt_min, opt_max);
};


/**
 * If running Opera with specified versions.
 * Opera refers to both the product and rendering engine.
 *
 * @param {(string|number)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if userAgent matches Opera and matches the
 *   optional version parameters. False otherwise.
 */
puppet.userAgent.isOpera = function(opt_min, opt_max) {
  return goog.userAgent.product.OPERA &&
         puppet.userAgent.checkProductVersion_(opt_min, opt_max);
};


/**
 * If running iPad with specified versions.
 *
 * @param {(string|number)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if userAgent matches iPad and matches the
 *   optional version parameters. False otherwise.
 */
puppet.userAgent.isIPad = function(opt_min, opt_max) {
  return goog.userAgent.product.IPAD &&
         puppet.userAgent.checkProductVersion_(opt_min, opt_max);
};


/**
 * If running iPhone with specified versions.
 *
 * @param {(string|number)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if userAgent matches iPhone and matches the
 *   optional version parameters. False otherwise.
 */
puppet.userAgent.isIPhone = function(opt_min, opt_max) {
  return goog.userAgent.product.IPHONE &&
         puppet.userAgent.checkProductVersion_(opt_min, opt_max);
};


/**
 * If running Android with specified versions.
 *
 * @param {(string|number)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if userAgent matches Android and matches the
 *   optional version parameters. False otherwise.
 */
puppet.userAgent.isAndroid = function(opt_min, opt_max) {
  return goog.userAgent.ANDROID &&
         puppet.userAgent.checkVersion_(puppet.userAgent.ANDROID_VERSION_,
                                        opt_min, opt_max);
};


/**
 * If running Android Mobile with specified versions.
 *
 * @param {(string|number)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if userAgent matches Android Mobile and matches the
 *   optional version parameters. False otherwise.
 */
puppet.userAgent.isAndroidMobile = function(opt_min, opt_max) {
  return goog.userAgent.MOBILE &&
         puppet.userAgent.isAndroid(opt_min, opt_max);
};


/**
 * If running Android on Tablet with specified versions.
 *
 * @param {(string|number)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if userAgent matches Android Tablet and matches the
 *   optional version parameters. False otherwise.
 */
puppet.userAgent.isAndroidTablet = function(opt_min, opt_max) {
  return !goog.userAgent.MOBILE &&
         puppet.userAgent.isAndroid(opt_min, opt_max);
};


/**
 * If running Camino with specified versions.
 *
 * @param {(string|number)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if userAgent matches Camino and matches the
 *   optional version parameters. False otherwise.
 */
puppet.userAgent.isCamino = function(opt_min, opt_max) {
  return goog.userAgent.product.CAMINO &&
         puppet.userAgent.checkProductVersion_(opt_min, opt_max);
};


/**
 * If running on a mobile browser.
 *
 * @return {boolean} True if userAgent matches a mobile browser.
 */
puppet.userAgent.isMobile = function() {
  return puppet.userAgent.isAndroid() ||
         puppet.userAgent.isIPhone() ||
         puppet.userAgent.isIPad() ||
         puppet.userAgent.isBlackberry() ||
         puppet.userAgent.isPlaybook() ||
         puppet.userAgent.isDolfin() ||
         puppet.userAgent.isUIWebView() ||
         puppet.userAgent.isIETouch();
};


/**
 * If running on a multitouch mobile browser.
 *
 * @return {boolean} True if userAgent matches a multi touch mobile browser.
 */
puppet.userAgent.isMultiTouch = function() {
  return puppet.userAgent.isIPad() ||
         puppet.userAgent.isIPhone() ||
         puppet.userAgent.isDolfin() ||
         puppet.userAgent.isPlaybook() ||
         puppet.userAgent.isAndroid(3, null) ||
         puppet.userAgent.isIETouch();
};


/**
 * Check User Agent version.
 *
 * @param {(string|number)} version Version to check against.
 * @param {(string|number)=} opt_min Min Lower bound on the version,
 *   inclusive. If not provided, return true. If null, no lower bound
 *   is checked.
 * @param {(string|number|null)=} opt_max Upper bound on the version,
 *   exclusive. If not provided, checks that the version is a prefix of
 *   opt_min. If null, no upper bound is checked.
 * @return {boolean} Whether the version is in the specified range.
 * @private
 */
puppet.userAgent.checkVersion_ = function(version, opt_min, opt_max) {
  if (!goog.isDef(opt_min)) {
    return true;
  } else if (goog.string.compareVersions(version, opt_min) < 0) {
    return false;
  } else if (goog.isNull(opt_max)) {
    return true;
  } else if (!goog.isDef(opt_max)) {
    // If no maximum is specified, we choose a default maximum that is the same
    // as the minimum, except with a last version component equal to the min's
    // last version component "plus one". When the last version component ends
    // in a string, this means appending a character with ascii value zero.
    var components = String(opt_min).split('.');
    var lastIndex = components.length - 1;
    var lastComponent = components[lastIndex];
    var match = /(\d*)(\D*)/.exec(lastComponent) || ['', '', ''];
    if (match[2]) {
      components[lastIndex] = match[1] + match[2] + String.fromCharCode(0);
    } else if (match[1]) {
      components[lastIndex] = String(Number(match[1]) + 1);
    }
    opt_max = components.join('.');
  }
  return goog.string.compareVersions(version, opt_max) < 0;
};


/**
 * Check Product version.
 *
 * @param {(string|number)=} opt_min Min Lower bound on the version,
 *   inclusive. If not provided, return true.
 * @param {(string|number|null)=} opt_max Upper bound on the version,
 *   exclusive. If not provided, checks that the version is a prefix of
 *   opt_min. If null, no upper bound is checked.
 * @return {boolean} Whether the version is in the specified range.
 * @private
 */
puppet.userAgent.checkProductVersion_ = function(opt_min, opt_max) {
  return puppet.userAgent.checkVersion_(goog.userAgent.product.VERSION,
                                        opt_min, opt_max);
};


/**
 * Check Rendering Engine version.
 *
 * @param {(string|number)=} opt_min Min Lower bound on the version,
 *   inclusive. If not provided, return true. If null, no lower bound
 *   is checked.
 * @param {(string|number|null)=} opt_max Upper bound on the version,
 *   exclusive. If not provided, checks that the version is a prefix of
 *   opt_min. If null, no upper bound is checked.
 * @return {boolean} Whether the version is in the specified range.
 * @private
 */
puppet.userAgent.checkEngineVersion_ = function(opt_min, opt_max) {
  return puppet.userAgent.checkVersion_(goog.userAgent.VERSION,
                                        opt_min, opt_max);
};


/**
 * Check Platform version.
 *
 * @param {(string|number)=} opt_min Min Lower bound on the version,
 *   inclusive. If not provided, return true.  If null, no lower bound
 *   is checked.
 * @param {(string|number|null)=} opt_max Upper bound on the version,
 *   exclusive. If not provided, checks that the version is a prefix of
 *   opt_min. If null, no upper bound is checked.
 * @return {boolean} Whether the version is in the specified range.
 * @private
 */
puppet.userAgent.checkPlatformVersion_ = function(opt_min, opt_max) {
  return puppet.userAgent.checkVersion_(goog.userAgent.platform.VERSION,
                                        opt_min, opt_max);
};


/**
 * If running WebKit.
 *
 * @param {(string|number)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if rendering engine matches WebKit and matches the
 *   optional version parameters. False otherwise.
 */
puppet.userAgent.isWebKit = function(opt_min, opt_max) {
  return goog.userAgent.WEBKIT &&
      puppet.userAgent.checkEngineVersion_(opt_min, opt_max);
};


/**
 * If running Mobile WebKit.
 *
 * @param {(string|number)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if rendering engine matches Mobile WebKit and
 *   matches the optional version parameters. False otherwise.
 */
puppet.userAgent.isMobileWebKit = function(opt_min, opt_max) {
  return goog.userAgent.MOBILE &&
      puppet.userAgent.checkEngineVersion_(opt_min, opt_max);
};


/**
 * If running Gecko.
 *
 * @param {(string|number)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if rendering engine matches Gecko and matches the
 *   optional version parameters. False otherwise.
 */
puppet.userAgent.isGecko = function(opt_min, opt_max) {
  return goog.userAgent.GECKO &&
      puppet.userAgent.checkEngineVersion_(opt_min, opt_max);
};


/**
 * If running Windows.
 * Only Windows and Mac support versions.
 *
 * @param {(string|number)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if platform matches Windows and matches the
 *   optional version parameters. False otherwise.
 */
puppet.userAgent.isWindows = function(opt_min, opt_max) {
  return goog.userAgent.WINDOWS &&
      puppet.userAgent.checkPlatformVersion_(opt_min, opt_max);
};


/**
 * If running Mac.
 * Only Windows and Mac support versions.
 *
 * @param {(string|number)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if platform matches Mac and matches the
 *   optional version parameters. False otherwise.
 */
puppet.userAgent.isMac = function(opt_min, opt_max) {
  return goog.userAgent.MAC &&
      puppet.userAgent.checkPlatformVersion_(opt_min, opt_max);
};


/**
 * If running Linux.
 *
 * @return {boolean} True if platform is Linux.
 */
puppet.userAgent.isLinux = function() {
  return goog.userAgent.LINUX;
};


/**
 * If running X11.
 *
 * @return {boolean} True if platform is X11.
 */
puppet.userAgent.isX11 = function() {
  return goog.userAgent.X11;
};


/**
 * If running Blackberry.
 *
 * @return {boolean} True if platform is Blackberry.
 */
puppet.userAgent.isBlackberry = function() {
  return puppet.userAgent.BLACKBERRY_;
};


/**
 * If running Blackberry Playbook.
 *
 * @return {boolean} True if platform is Playbook.
 */
puppet.userAgent.isPlaybook = function() {
  return puppet.userAgent.PLAYBOOK_;
};


/**
 * If running Dolfin.
 *
 * @return {boolean} True if platform is Dolfin.
 */
puppet.userAgent.isDolfin = function() {
  return puppet.userAgent.DOLFIN_;
};


/**
 * If running Internet Explorer on a device with a touchscreen.
 *
 * @return {boolean} True if IE with touchscreen.
 */
puppet.userAgent.isIETouch = function() {
  return puppet.userAgent.IETOUCH_;
};


/**
 * If running Internet Explorer on a device using WebView.
 *
 * @return {boolean} True if IE with WebView.
 */
puppet.userAgent.isIEWebView = function() {
  return puppet.userAgent.IEWEBVIEW_;
};


/**
 * If running UIWebView in IOS GSA.
 *
 * @return {boolean} True if UIWebView.
 */
puppet.userAgent.isUIWebView = function() {
  return puppet.userAgent.UIWEBVIEW_;
};


/**
 * Forces reinitialization of goog.userAgent.
 * Modeled after javascript/closure/useragent/product_test.html.
 * Suppress the visibility check, because this needs to access
 * private members of goog.userAgent.
 *
 * @suppress {visibility}
 * @param {string} ua String to simulate.
 */
puppet.userAgent.init = function(ua) {
  var fakeNavigator = goog.object.clone(navigator);
  fakeNavigator.userAgent = ua;
  // Special case for X11.
  fakeNavigator.appVersion = goog.string.contains(ua, 'X11') ? 'X11' : '';
  // Special case for gecko.
  fakeNavigator.product = /Gecko\//.test(ua) ? 'Gecko' : '';
  // Special case for Opera version.
  if (goog.string.contains(ua, 'Opera')) {
    if (!goog.global['opera']) {
      goog.global['opera'] = {};
    }
    goog.global['opera'].version = ua.substr(ua.lastIndexOf('/') + 1);
  }

  // Set navigator.platform to be the same as userAgent.
  // Though ugly, it should be good enough for our purposes.
  fakeNavigator.platform = ua;

  goog.userAgent.BROWSER_KNOWN_ = false;
  goog.userAgent.getUserAgentString = function() { return ua; };
  goog.userAgent.getNavigator = function() { return fakeNavigator; };
  // Forcibly disable getDocumentMode_ which will interfere with
  // user agent overrides on IE 8.
  goog.userAgent.getDocumentMode_ = function() { return undefined; };
  goog.userAgent.init_();

  // Unfortunately we can't isolate the useragent setting in a function
  // we can call, because things rely on it compiling to nothing when
  // one of the ASSUME flags is set, and the compiler isn't smart enough
  // to do that when the setting is done inside a function that's inlined.
  goog.userAgent.OPERA = goog.userAgent.detectedOpera_;
  goog.userAgent.IE = goog.userAgent.detectedIe_;
  goog.userAgent.GECKO = goog.userAgent.detectedGecko_;
  goog.userAgent.WEBKIT = goog.userAgent.detectedWebkit_;
  goog.userAgent.MOBILE = goog.userAgent.detectedMobile_;
  goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
  goog.userAgent.VERSION = goog.userAgent.determineVersion_();

  goog.userAgent.product.init_();
  // In an ideal world, this assignment would be just a function in
  // product.js that we could call, but putting it into a function causes
  // the compiler to fail to compile product.js to nothing when one of
  // the ASSUME flags is set.
  goog.userAgent.product.OPERA = goog.userAgent.OPERA;
  goog.userAgent.product.IE = goog.userAgent.IE;
  goog.userAgent.product.FIREFOX = goog.userAgent.product.detectedFirefox_;
  goog.userAgent.product.CAMINO = goog.userAgent.product.detectedCamino_;
  goog.userAgent.product.IPHONE = goog.userAgent.product.detectedIphone_;
  goog.userAgent.product.IPAD = goog.userAgent.product.detectedIpad_;
  goog.userAgent.product.ANDROID = goog.userAgent.product.detectedAndroid_;
  goog.userAgent.product.CHROME = goog.userAgent.product.detectedChrome_;
  goog.userAgent.product.SAFARI = goog.userAgent.product.detectedSafari_;
  goog.userAgent.product.VERSION = goog.userAgent.product.determineVersion_();

  goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
  goog.userAgent.initPlatform_();
  goog.userAgent.MAC = goog.userAgent.detectedMac_;
  goog.userAgent.WINDOWS = goog.userAgent.detectedWindows_;
  goog.userAgent.LINUX = goog.userAgent.detectedLinux_;
  goog.userAgent.X11 = goog.userAgent.detectedX11_;
  goog.userAgent.ANDROID = goog.userAgent.detectedAndroid_;
  goog.userAgent.platform.VERSION = goog.userAgent.platform.determineVersion_();

  puppet.userAgent.initCustomConstants_(ua);
};


// Initialize user agent settings based on puppet user agent parameter.
if (puppet.userAgent.PARAMS.useragent) {
  puppet.userAgent.init(puppet.userAgent.PARAMS.useragent);
}
