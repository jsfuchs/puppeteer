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
 * @fileoverview Web Puppeteer: a web-application testing framework.
 *
 */

/**
 * Bootstrapped behavior for requesting and including other files. These are
 * primitives for including other files upon which Puppet members may depend,
 * so they should not themselves have any dependencies on Puppet members.
 *
 * @type {!Object}
 * @private
 * @const
 */
var __BOOTSTRAP_ = {

  /**
   * @see puppet.request
   * @param {string} url URL to request.
   * @param {string=} opt_type Request type: 'GET' (default) or 'POST'.
   * @param {?string=} opt_body Request body; defaults to null.
   * @param {boolean=} opt_async Whether the request is asynchronous;
   *    defaults to false.
   * @return {?string} Response text; null if the HTTP response status
   *     code is not 200.
   */
  request: function(url, opt_type, opt_body, opt_async) {
    // Make and open the request in a cross-browser compatible way.
    // The false argument makes the request synchronous.
    var request = window.XMLHttpRequest ?
        new XMLHttpRequest() :
        new ActiveXObject('Microsoft.XMLHTTP');
    var type = opt_type || 'GET';
    var async = opt_async || false;
    request.open(type, url, async);

    // IE6 erroneously returns HTTP 200 Found for cached HTTP 404 Not-found
    // requests. Neither setting 'Pragma=no-cache' nor 'Cache-Control=no-cache'
    // fixes the problem. Use a valid HTTPDate instead of '0' to support strict
    // HTTP servers. Setting this in Firefox will return unexpected results.
    // See: http://en.wikibooks.org/wiki/XMLHttpRequest#Caching
    if (/MSIE 6/.test(navigator.userAgent)) {
      request.setRequestHeader('If-Modified-Since',
          'Sat, 1 Jan 2000 00:00:00 GMT');
    }

    // Under some conditions (such as 204 responses in IE6), sending the
    // request can throw an error, in which case we return 'null'.
    try {
      request.send(opt_body || null);
    } catch (e) {
      return null;
    }

    // No response text if the request is asynchronous or if the (synchronous)
    // request does not have a 200 status.
    return async || request.status != 200 ? null : request.responseText;
  },

  /**
   * @see puppet.DIRECTORY_URL_
   * @type {string}
   * @const
   */
  DIRECTORY_URL: (function() {
    // Find the src of the script tag that includes puppet.js
    // Throw an assertion error if there is more than one.
    var scriptElems = document.getElementsByTagName('script');
    var puppetJsSrcEnd = '/puppet.js';
    var puppetJsSrc = null;
    for (var i = 0; i < scriptElems.length; i++) {
      var src = scriptElems[i].src;
      src = (src == 'puppet.js') ? './puppet.js' : src;
      if (src.substring(src.length - puppetJsSrcEnd.length) == puppetJsSrcEnd) {
        if (!!puppetJsSrc) {
          var errorMessage = 'ERROR: Malformed Puppet Test\n' +
              'Test contains more than one puppet.js script tag:\n' +
              puppetJsSrc + '\nand\n' + src;
          alert(errorMessage);
          throw Error(errorMessage);
        }
        puppetJsSrc = src;
      }
    }

    // The URL of the directory in which puppet.js is located.
    return puppetJsSrc.substring(0,
        puppetJsSrc.length - puppetJsSrcEnd.length + 1);
  })(),

  /**
   * @see puppet.include
   * @param {string} path Relative path to the JavaScript file.
   * @return {boolean} Whether a non-empty JavaScript file was found.
   */
  include: (function() {
    // Set of included JS files, to ensure none is included more than once.
    var includes = {};

    // Set the puppet.include function to the following closure.
    function includer(path) {
      // If already included, return.
      if (path in includes) {
        return true;
      }
      // Otherwise, request that absolute path to the file.
      var response = __BOOTSTRAP_.request(__BOOTSTRAP_.DIRECTORY_URL + path);
      if (!response) {
        return false;
      }
      // Make a script tag to include it and mark it as included.
      var script = document.createElement('script');
      script.text = response;
      // Do not use 'head' or 'body' elements, which may not exist yet.
      document.documentElement.firstChild.appendChild(script);
      includes[path] = null;
      return true;
    }
    return includer;
  })()
};

/**
 * We manage our own dependencies, so no need for closure to manage
 * them. If this is not set then including closure/base.js will cause
 * a JS error when it tries to include it's own deps.js file.
 *
 * @type {boolean}
 */
window.CLOSURE_NO_DEPS = true;

// With __include bootstrapped, include Puppet modules.
__BOOTSTRAP_.include('modules.js');
