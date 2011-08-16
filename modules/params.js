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
 * @fileoverview Parameters for Puppet.
 */

goog.provide('puppet.params');

goog.require('goog.Uri');
goog.require('goog.object');
goog.require('goog.structs.Set');
goog.require('puppet.logging');


/**
 * Set of parameter names that have been declared.
 *
 * @const
 * @type {!goog.structs.Set.<string>}
 * @private
 */
puppet.params.DECLARED_ = new goog.structs.Set();


/**
 * Returns the current windows's URL. Provided so tests can override it
 * to test the functions that rely on the current window URL.
 *
 * @return {string} The curren window URL.
 * @private
 */
puppet.params.windowUrl_ = function() {
  return window.location.href;
};


/**
 * Declare a boolean parameter and return its value.
 *
 * @param {string} name Name of the parameter.
 * @return {boolean} Whether the parameter is present in the URL.
 */
puppet.params.declareBoolean = function(name) {
  puppet.params.declare_(name);
  var value = !goog.isNull(puppet.params.getUrlParam(name));
  return value;
};


/**
 * Declare a number parameter and return its value.
 *
 * @param {string} name Name of the parameter.
 * @param {number} defaultValue Default value of the parameter.
 * @return {number} Number value of the parameter in the URL if present;
 *     the default value if not present.
 */
puppet.params.declareNumber = function(name, defaultValue) {
  puppet.params.declare_(name);
  var value = puppet.params.getUrlParam(name);
  return !goog.isNull(value) ? Number(value) : defaultValue;
};


/**
 * Declare a string parameter and return its value.
 *
 * @param {string} name Name of the parameter.
 * @param {string} defaultValue Default value of the parameter.
 * @return {string} String value of the parameter in the URL if present;
 *     the default value if not present.
 */
puppet.params.declareString = function(name, defaultValue) {
  puppet.params.declare_(name);
  var value = puppet.params.getUrlParam(name);
  return !goog.isNull(value) ? value : defaultValue;
};


/**
 * Declare a multistring parameter, where comma is the string delimiter,
 * and return its value.
 *
 * @param {string} name Name of the parameter.
 * @param {!Array.<string>} defaultValue Default value of the parameter.
 * @return {!Array.<string>} Array value of the parameter in the URL if present;
 *     the default value if not present.
 */
puppet.params.declareMultistring = function(name, defaultValue) {
  puppet.params.declare_(name);
  var value = puppet.params.getUrlParam(name);
  return !goog.isNull(value) ? value.split(',') : defaultValue;
};


/**
 * Declare a RegExp parameter and return its value.
 *
 * @param {!string} name Name of the parameter.
 * @param {string|!RegExp} defaultValue Default value of the parameter.
 * @return {!RegExp} RegExp value of the parameter in the URL if present;
 *     the default value if not present.
 */
puppet.params.declareRegExp = function(name, defaultValue) {
  puppet.params.declare_(name);
  var value = puppet.params.getUrlParam(name);
  return !goog.isNull(value) ? new RegExp(value) :
      (goog.isString(defaultValue) ? new RegExp(defaultValue) : defaultValue);
};


/**
 * Returns a map object of all key, value pairs in the test URL.
 *
 * @return {!Object.<string,string>} All key, value pairs in the URL.
 */
puppet.params.getAll = function() {
  var queryData = new goog.Uri(puppet.params.windowUrl_()).getQueryData();

  // Return every key, value pair.
  var allParams = {};
  var names = queryData.getKeys();
  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    var value = queryData.get(name);
    allParams[name] = value;
  }
  return allParams;
};


/**
 * Returns a map object of all key, value pairs in the test URL that
 * were not explicitly declared.
 *
 * @return {!Object.<string,string>} Undeclared key, value pairs in the URL.
 */
puppet.params.getUndeclared = function() {
  return goog.object.filter(puppet.params.getAll(), function(value, name) {
    return !puppet.params.DECLARED_.contains(name);
  });
};


/**
 * Gets the value for the given parameter in the URL, or null if the
 * parameter is not in the URL. If no URL is given,
 * window.location.href is used.
 *
 * @param {string} name Parameter name.
 * @param {string=} opt_url A URL; defaults to window.location.href.
 * @return {?string} The value of the parameter name in the URL.
 */
puppet.params.getUrlParam = function(name, opt_url) {
  var url = opt_url || puppet.params.windowUrl_();
  var value = new goog.Uri(url).getParameterValue(name);
  return value === undefined ? null : (/** @type {string} */ value);
};


/**
 * Returns a URL the same as the given URL, but with the given
 * parameter name set to the given value. If no URL is given,
 * window.location.href is used.
 *
 * @param {string} name Parameter name.
 * @param {string} value Parameter value.
 * @param {string=} opt_url A URL; defaults to window.location.href.
 * @return {string} URL overwritten with the name/value pair.
 */
puppet.params.setUrlParam = function(name, value, opt_url) {
  var url = opt_url || puppet.params.windowUrl_();

  // NOTE(user): A bit of a hack. We modify and set the encoded query
  // directly to compensate for goog.Uri incorrectly encoding the slash, colon,
  // and question mark in its toString method, and to undo the encoding of
  // percent, because we don't want deliberate encodings re-encoded. See
  // params_test.js for the unit tests keeping this implementation in check.
  var uri = new goog.Uri(url.replace(/%25/g, '%2525'));
  var query = uri.setParameterValue(name, value).getEncodedQuery();
  query = query.replace(/%2F/g, '/').replace(/%3F/g, '?');
  query = query.replace(/%3A/g, ':').replace(/%25/g, '%');
  uri.setQuery(query, true);

  return uri.toString();
};


/**
 * Returns a URL the same as the given URL, but with the
 * parameter of the given name removed. If no URL is given,
 * window.location.href is used.
 *
 * @param {string} name Parameter name.
 * @param {string=} opt_url A URL; defaults to window.location.href.
 * @return {string} URL with the parameter removed.
 */
puppet.params.removeUrlParam = function(name, opt_url) {
  var url = opt_url || puppet.params.windowUrl_();
  return new goog.Uri(url).removeParameter(name).toString();
};


/**
 * Adds the given string to set of declared parameters and reports an error if
 * it has already been declared.
 *
 * @param {string} name Parameter name.
 * @private
 */
puppet.params.declare_ = function(name) {
  if (puppet.params.DECLARED_.contains(name)) {
    puppet.logging.error('Parameter "' + name + '" is already declared');
  }
  puppet.params.DECLARED_.add(name);
};
