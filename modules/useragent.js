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
 * If running Firefox with specified versions.
 *
 * @param {(string|number|null)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if userAgent matches firefox and matches the
 *   optional version parameters.  False otherwise.
 */
puppet.userAgent.isFirefox = function(opt_min, opt_max) {
  return goog.userAgent.product.FIREFOX &&
         puppet.userAgent.checkProductVersion_(opt_min, opt_max);
};


/**
 * If running IE with specified versions.
 * IE refers to both the product and rendering engine.
 *
 * @param {(string|number|null)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if userAgent matches IE and matches the
 *   optional version parameters.  False otherwise.
 */
puppet.userAgent.isIE = function(opt_min, opt_max) {
  return goog.userAgent.product.IE &&
         puppet.userAgent.checkProductVersion_(opt_min, opt_max);
};


/**
 * If running Chrome with specified versions.
 *
 * @param {(string|number|null)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if userAgent matches chrome and matches the
 *   optional version parameters.  False otherwise.
 */
puppet.userAgent.isChrome = function(opt_min, opt_max) {
  return goog.userAgent.product.CHROME &&
         puppet.userAgent.checkProductVersion_(opt_min, opt_max);
};


/**
 * If running Safari with specified versions.
 *
 * @param {(string|number|null)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if userAgent matches safari and matches the
 *   optional version parameters.  False otherwise.
 */
puppet.userAgent.isSafari = function(opt_min, opt_max) {
  return goog.userAgent.product.SAFARI &&
         puppet.userAgent.checkProductVersion_(opt_min, opt_max);
};


/**
 * If running Opera with specified versions.
 * Opera refers to both the product and rendering engine.
 *
 * @param {(string|number|null)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if userAgent matches opera and matches the
 *   optional version parameters.  False otherwise.
 */
puppet.userAgent.isOpera = function(opt_min, opt_max) {
  return goog.userAgent.product.OPERA &&
         puppet.userAgent.checkProductVersion_(opt_min, opt_max);
};


/**
 * If running iPad with specified versions.
 *
 * @param {(string|number|null)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if userAgent matches ipad and matches the
 *   optional version parameters.  False otherwise.
 */
puppet.userAgent.isIPad = function(opt_min, opt_max) {
  return goog.userAgent.product.IPAD &&
         puppet.userAgent.checkProductVersion_(opt_min, opt_max);
};


/**
 * If running iPhone with specified versions.
 *
 * @param {(string|number|null)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if userAgent matches iphone and matches the
 *   optional version parameters.  False otherwise.
 */
puppet.userAgent.isIPhone = function(opt_min, opt_max) {
  return goog.userAgent.product.IPHONE &&
         puppet.userAgent.checkProductVersion_(opt_min, opt_max);
};


/**
 * If running Android with specified versions.
 *
 * @param {(string|number|null)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if userAgent matches android and matches the
 *   optional version parameters.  False otherwise.
 */
puppet.userAgent.isAndroid = function(opt_min, opt_max) {
  return goog.userAgent.product.ANDROID &&
         puppet.userAgent.checkProductVersion_(opt_min, opt_max);
};


/**
 * If running Camino with specified versions.
 *
 * @param {(string|number|null)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if userAgent matches camino and matches the
 *   optional version parameters.  False otherwise.
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
         puppet.userAgent.isDolfin();
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
         puppet.userAgent.isAndroid(3, null);
};


/**
 * Check User Agent version.
 *
 * @param {(string|number)} version Version to check against.
 * @param {(string|number|null)=} opt_min Min Lower bound on the version,
 *   inclusive. If not provided, return true.  If null, no lower bound
 *   is checked.
 * @param {(string|number|null)=} opt_max Upper bound on the version,
 *   exclusive. If not provided, checks that the version is exactly equal to
 *   opt_min.  If null, no upper bound is checked..
 * @return {boolean} Whether the version is in the specified range.
 * @private
 */
puppet.userAgent.checkVersion_ = function(version, opt_min, opt_max) {
  if (!goog.isDef(opt_min)) {
    return true;
  } else {
    if (!goog.isNull(opt_min)) {
      var compareToMin = goog.string.compareVersions(version, opt_min);
      if (compareToMin < 0) {
        return false;
      } else if (!goog.isDef(opt_max)) {
        return compareToMin == 0;
      }
    }
    return !goog.isDef(opt_max) || goog.isNull(opt_max) ||
        goog.string.compareVersions(version, opt_max) < 0;
  }
};


/**
 * Check Product version.
 *
 * @param {(string|number|null)=} opt_min Min Lower bound on the version,
 *   inclusive. If not provided, return true.  If null, no lower bound
 *   is checked.
 * @param {(string|number|null)=} opt_max Upper bound on the version,
 *   exclusive. If not provided, checks that the version is exactly equal to
 *   opt_min.  If null, no upper bound is checked..
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
 * @param {(string|number|null)=} opt_min Min Lower bound on the version,
 *   inclusive. If not provided, return true.  If null, no lower bound
 *   is checked.
 * @param {(string|number|null)=} opt_max Upper bound on the version,
 *   exclusive. If not provided, checks that the version is exactly equal to
 *   opt_min.  If null, no upper bound is checked..
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
 * @param {(string|number|null)=} opt_min Min Lower bound on the version,
 *   inclusive. If not provided, return true.  If null, no lower bound
 *   is checked.
 * @param {(string|number|null)=} opt_max Upper bound on the version,
 *   exclusive. If not provided, checks that the version is exactly equal to
 *   opt_min.  If null, no upper bound is checked..
 * @return {boolean} Whether the version is in the specified range.
 * @private
 */
puppet.userAgent.checkPlatformVersion_ = function(opt_min, opt_max) {
  return puppet.userAgent.checkVersion_(goog.userAgent.platform.VERSION,
                                        opt_min, opt_max);
};


/**
 * If running Webkit.
 *
 * @param {(string|number|null)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if renderotoing engine matches Webkit and matches the
 *   optional version parameters.  False otherwise.
 */
puppet.userAgent.isWebkit = function(opt_min, opt_max) {
  return goog.userAgent.WEBKIT &&
      puppet.userAgent.checkEngineVersion_(opt_min, opt_max);
};


/**
 * If running Mobile Webkit.
 *
 * @param {(string|number|null)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if renderotoing engine matchebile Webkit and
 * matches the optional version parameters.  False otherwise.
 */
puppet.userAgent.isMobileWebkit = function(opt_min, opt_max) {
  return goog.userAgent.MOBILE &&
      puppet.userAgent.checkEngineVersion_(opt_min, opt_max);
};


/**
 * If running Gecko.
 *
 * @param {(string|number|null)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if rendering engine matches Gecko and matches the
 *   optional version parameters.  False otherwise.
 */
puppet.userAgent.isGecko = function(opt_min, opt_max) {
  return goog.userAgent.GECKO &&
      puppet.userAgent.checkEngineVersion_(opt_min, opt_max);
};


/**
 * If running Windows.
 * Only Windows and Mac support versions.
 *
 * @param {(string|number|null)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if platform matches Windows and matches the
 *   optional version parameters.  False otherwise.
 */
puppet.userAgent.isWindows = function(opt_min, opt_max) {
  return goog.userAgent.WINDOWS &&
      puppet.userAgent.checkPlatformVersion_(opt_min, opt_max);
};


/**
 * If running Mac.
 * Only Windows and Mac support versions.
 *
 * @param {(string|number|null)=} opt_min Min version.
 * @param {(string|number|null)=} opt_max Max version.
 * @return {boolean} True if platform matches Mac and matches the
 *   optional version parameters.  False otherwise.
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
 * If running Dolfin.
 *
 * @return {boolean} True if platform is Dolfin.
 */
puppet.userAgent.isDolfin = function() {
  return puppet.userAgent.DOLFIN_;
};


/**
 * Forces reinitialization of goog.userAgent.
 * Modeled after javascript/closure/useragent/product_test.html.
 * Suppress the visibility check, because this needs to access
 * private members of goog.userAgent.
 *
 * @suppress {visibility}
 * @param {string} ua String to simulate.
 * @private
 */
puppet.userAgent.init_ = function(ua) {
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
  puppet.userAgent.BLACKBERRY_ = puppet.userAgent.REGEX_BLACKBERRY_.test(ua);
  puppet.userAgent.DOLFIN_ = puppet.userAgent.REGEX_DOLFIN_.test(ua);

  goog.userAgent.platform.VERSION =
      goog.userAgent.platform.determineVersion_();
};


/**
 * A Regular expression used to detect Blackberry.
 * @type {RegExp}
 * @const
 * @private
 */
puppet.userAgent.REGEX_BLACKBERRY_ = /BlackBerry/;


/**
 * A Regular expression used to detect Dolfin.
 * @type {RegExp}
 * @const
 * @private
 */
puppet.userAgent.REGEX_DOLFIN_ = /Dolfin/;


/**
 * Whether we are on Blackberry or not.
 * This is a special case because goog.userAgent does not handle it.
 * @type {boolean}
 * @private
 */
puppet.userAgent.BLACKBERRY_ = puppet.userAgent.REGEX_BLACKBERRY_.test(
    goog.userAgent.getUserAgentString());


/**
 * Whether we are on Dolfin or not.
 * This is a special case because goog.userAgent does not handle it.
 * @type {boolean}
 * @private
 */
puppet.userAgent.DOLFIN_ = puppet.userAgent.REGEX_DOLFIN_.test(
    goog.userAgent.getUserAgentString());


// Initialize user agent settings based on puppet user agent parameter.
if (puppet.userAgent.PARAMS.useragent) {
  puppet.userAgent.init_(puppet.userAgent.PARAMS.useragent);
}
