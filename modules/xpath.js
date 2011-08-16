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
 * @fileoverview Puppet xpath module.
 */

goog.provide('puppet.xpath');

goog.require('goog.dom');
goog.require('puppet.logging');


/**
 * XPath namespace resolver.
 *
 * @param {string} prefix The prefix.
 * @return {?string} The namespace.
 * @private
 */
puppet.xpath.resolver_ = (function() {
  var namespaces = { svg: 'http://www.w3.org/2000/svg' };
  return function(prefix) {
    return namespaces[prefix] || null;
  };
})();


/**
 * An empty node set iterator. It is defined in this awkward way
 * because the compiler didn't let me cast an object literal.
 *
 * @const
 * @type {!XPathResult}
 * @private
 */
puppet.xpath.EMPTY_XPATH_RESULT_ = (/** @type {!XPathResult} */ (function() {
  return {
    iterateNext: function() { return null; }
  };
})());


/**
 * Resolves an XPath to a set of DOM nodes.
 *
 * This function handles xpath expressions across frames and iframes by
 * requiring explicit '/content:' annotations and evaluating trailing paths in
 * the (i)frame's document. For example, 'foo/content:/bar' will get the
 * (i)frame element 'foo', then get the element 'bar' inside the document of
 * 'foo'. Use a colon to separate for cases such as 'foo/content:id("bar")'.
 *
 * @param {string} path XPath.
 * @param {!Window} win Document window.
 * @return {!XPathResult} Node set iterator.
 */
puppet.xpath.resolveXPath = function(path, win) {
  var exp = path;

  // Recurse from the right to support nested frames.
  var index1 = path.lastIndexOf('/content:');
  if (index1 >= 0) {
    var index2 = index1 + '/content:'.length;
    if (index2 < path.length) {
      var nodeIter = puppet.xpath.resolveXPath(path.substr(0, index1), win);
      var node = nodeIter.iterateNext();
      if (!node) {
        return puppet.xpath.EMPTY_XPATH_RESULT_;
      } else if (nodeIter.iterateNext()) {
        puppet.logging.error('Frame XPath resolves to multiple elements.');
      } else if (!bot.dom.isElement(node, goog.dom.TagName.FRAME) &&
                 !bot.dom.isElement(node, goog.dom.TagName.IFRAME)) {
        puppet.logging.error('Frame XPath resolves to a non-frame element.');
      }
      var frame = (/** @type {!(HTMLFrameElement|HTMLIFrameElement)} */ node);
      win = (/** @type {!Window} */ goog.dom.getFrameContentWindow(frame));
      exp = path.substr(index2);
    }
  }

  // The window.install() function is provided by the third party
  // XPath library to install itself. We call install() on demand,
  // not just once, so that it is installed for each new document
  // loaded over the course of the test and for documents inside
  // iframes from extending xpath expressions with '/content:'.
  var xPathInstalled = goog.isFunction(win.document.evaluate);
  if (!xPathInstalled) {
    try {
      window['install'](win);
      xPathInstalled = goog.isFunction(win.document.evaluate);
    } catch (e) {}
    if (!xPathInstalled) {
      puppet.logging.error('Failure to install XPath library');
    }
  }

  // Evaluate the XPath, but save and restore the all() command, because
  // the XPath library sometimes overwrites a global variable named 'all'.
  // TODO(user): Perform this saving in puppet.js, where all() is defined.
  var allSaved = window['all'];
  var res = win.document.evaluate(
      exp, win.document, puppet.xpath.resolver_, 0, null);
  window['all'] = allSaved;

  // 0 = XPathResult.ANY_TYPE
  return res;
};


/**
 * Make a quoted XPath value.
 *
 * E.g.:
 *   foo       becomes  "foo"
 *   foo'bar   becomes  "foo'bar"
 *   foo"bar   becomes  'foo"bar'
 *   foo"bar'  becomes  concat("foo", '"', "bar'")
 *
 * @param {string} str Input.
 * @return {string} Quoted value.
 */
puppet.xpath.quote = function(str) {
  var hasDoubleQuote = str.indexOf('"') >= 0;
  var hasSingleQuote = str.indexOf('\'') >= 0;
  if (hasDoubleQuote && hasSingleQuote) {
    return 'concat("' + str.split('"').join('", \'"\', "') + '")';
  } else if (hasDoubleQuote) {
    return '\'' + str + '\'';
  } else {
    // Has single quotes or no quotes.
    return '"' + str + '"';
  }
};


/**
 * Generates an Xpath expression translating a string to lower-case.
 *
 * @param {string} str A string.
 * @return {string} An Xpath expression of the string in lower-case.
 */
puppet.xpath.lowerCase = function(str) {
  return 'translate(' + str +
      ',"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")';
};
