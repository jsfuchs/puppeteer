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

goog.require('bot.dom');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('puppet.logging');
goog.require('wgxpath');


/**
 * XPath namespace resolver.
 *
 * @param {string} prefix The prefix.
 * @return {?string} The namespace.
 * @private
 */
puppet.xpath.resolver_ = (function() {
  var namespaces = { 'svg': 'http://www.w3.org/2000/svg' };
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
puppet.xpath.EMPTY_XPATH_RESULT_ = /** @type {!XPathResult} */ ((function() {
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
      var frame = /** @type {!(HTMLFrameElement|HTMLIFrameElement)} */ (node);
      win = /** @type {!Window} */ (goog.dom.getFrameContentWindow(frame));
      exp = path.substr(index2);
    }
  }

  try {
    wgxpath.install(win);
  } catch (e) {
    puppet.logging.error('Exception during XPath library install: ' + e);
  }

  // 0 = XPathResult.ANY_TYPE
  return win.document.evaluate(
      exp, win.document, puppet.xpath.resolver_, 0, null);
};


/**
 * Optimized XPath predicate for the 'id' attribute for unique
 * identifiers.
 *
 * 'id' should uniquely identify an element, hence the usual prefix
 * path such as //* is not a parameter. It returns expressions of the
 * form 'id("foo")' For performance, do not use expression such as
 * '//*[@id = "foo"]' unless the identifier is not unique, in which
 * case the function idx() below can be used.
 *
 * @param {string} value Id value.
 * @return {string} XPath that resolves to the element with the id.
 */
function id(value) {
  return 'id("' + value + '")';
}


/**
 * Returns an xpath that resolves to the element at the given zero-based index
 * in the list of elements to which the given xpath resolves.
 *
 * @param {string} path XPath.
 * @param {number} index Zero-based index where negative indices are treated
 *     like python negative indices to indicate relative position from the end
 *     of the array where -1 indicates the last element.
 * @return {string} XPath that resolves to the element at the index.
 */
function at(path, index) {
  if (index >= 0) {
    return '(' + path + ')[' + (index + 1) + ']';
  } else {
    return '(' + path + ')[last()' +
        (index == -1 ? '' : String(index + 1)) + ']';
  }
}


/**
 * Needed for the xpaths generator below.
 * @typedef {
 *     function(?string=, string=) : string | {
 *       i: (function(?string=, string=) : string),
 *       c: (function(?string=, string=) : string),
 *       ic: (function(?string=, string=) : string),
 *       n: (function(?string=, string=) : string),
 *       nc: (function(?string=, string=) : string),
 *       ni: (function(?string=, string=) : string),
 *       nic: (function(?string=, string=) : string)
 *     }}
 */
puppet.xpath.AttributeFunction;


/**
 * Returns an function that: given a value and an optional context
 * returns an xpath prefixed by that context that matches an element
 * where the given key equals that value. If no context is provided to
 * the function, the default context '//*' (any element) is used.
 *
 * @param {string} key Attribute key.
 * @return {puppet.xpath.AttributeFunction} Function to generate
 *     xpaths for a matching attribute value.
 */
puppet.xpath.makeAttributeFunction = function(key) {
  var attrEqualsFunc = puppet.xpath.attributeFunction_(key, false, false,
      function(attr, opt_value) {
        return opt_value ? attr + '=' + opt_value : attr;
      });
  attrEqualsFunc['i'] = puppet.xpath.attributeFunction_(key, true, false,
      function(attr, value) {
        return attr + '=' + value;
      });
  attrEqualsFunc['c'] = puppet.xpath.attributeFunction_(key, false, false,
      function(attr, value) {
        return 'contains(' + attr + ',' + value + ')';
      });
  attrEqualsFunc['ic'] = puppet.xpath.attributeFunction_(key, true, false,
      function(attr, value) {
        return 'contains(' + attr + ',' + value + ')';
      });
  attrEqualsFunc['n'] = puppet.xpath.attributeFunction_(key, false, true,
      function(attr, opt_value) {
        return opt_value ? attr + '=' + opt_value : attr;
      });
  attrEqualsFunc['nc'] = puppet.xpath.attributeFunction_(key, false, true,
      function(attr, value) {
        return 'contains(' + attr + ',' + value + ')';
      });
  attrEqualsFunc['ni'] = puppet.xpath.attributeFunction_(key, true, true,
      function(attr, value) {
        return attr + '=' + value;
      });
  attrEqualsFunc['nic'] = puppet.xpath.attributeFunction_(key, true, true,
      function(attr, value) {
        return 'contains(' + attr + ',' + value + ')';
      });
  return attrEqualsFunc;
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


/**
 * Generates a function which accepts an xpath attribute value and an
 * optional xpath context, and returns the xpath representation.
 *
 * @param {string} key Attribute key.
 * @param {boolean} ignoreCase Should the xpath expression ignore case?
 * @param {boolean} negate Should the xpath expression be wrapped in the not()
 *     function?
 * @param {function(string, string=): string} predFunc A closure which returns
 *     the predicate value of the xpath expression.
 * @return {function(?string=, string=): string} Function to generate xpaths
 *     for a matching attribute value.
 * @private
 */
puppet.xpath.attributeFunction_ = function(key, ignoreCase, negate, predFunc) {
  var attr = ignoreCase ? puppet.xpath.lowerCase(key) : key;
  return function(opt_value, opt_context) {
    var context = goog.isDef(opt_context) ? opt_context : '//*';
    var value = undefined;
    if (goog.isDefAndNotNull(opt_value)) {
      value = puppet.xpath.quote(opt_value);
      if (ignoreCase) {
        value = puppet.xpath.lowerCase(value);
      }
    }
    var predicate = predFunc(attr, value);
    predicate = negate ? 'not(' + predicate + ')' : predicate;
    return context + '[' + predicate + ']';
  };
};


/**
 * Generates XPaths to match elements with a given non-unique 'id'
 * attribute.
 *
 * Useful for combining XPath expressions such as id('foo') +
 * idx('bar') = id("foo")//*[@id = "bar"], and for xpaths such
 * as //*[@id = "bar"][2] for selecting the second match.
 *
 * If the id is expected to be unique, always use id() instead.
 *
 * @type {puppet.xpath.AttributeFunction}
 * @see id
 */
var xid = puppet.xpath.makeAttributeFunction('@id');


/**
 * Generates XPaths to match elements with a given 'class' attribute.
 *
 * @type {puppet.xpath.AttributeFunction}
 */
var xclass = puppet.xpath.makeAttributeFunction('@class');


/**
 * Generates XPaths to match elements with a given 'name' attribute.
 *
 * Note that 'window.name' is predefined. In WebKit, window.name is
 * special and cannot even be reassigned.
 *
 * @type {puppet.xpath.AttributeFunction}
 */
var xname = puppet.xpath.makeAttributeFunction('@name');


/**
 * Generates XPaths to match elements with a given 'title' attribute.
 *
 * @type {puppet.xpath.AttributeFunction}
 * @see puppet.pred
 */
var xtitle = puppet.xpath.makeAttributeFunction('@title');


/**
 * Generates XPaths to match elements with a given 'style' attribute.
 *
 * @type {puppet.xpath.AttributeFunction}
 */
var xstyle = puppet.xpath.makeAttributeFunction('@style');


/**
 * Generates XPaths to match elements with a given 'href' attribute.
 *
 * @type {puppet.xpath.AttributeFunction}
 */
var xhref = puppet.xpath.makeAttributeFunction('@href');


/**
 * Generates XPaths to match elements with a given 'type' attribute.
 *
 * @type {puppet.xpath.AttributeFunction}
 */
var xtype = puppet.xpath.makeAttributeFunction('@type');


/**
 * Generates XPaths to match elements with a given 'src' attribute.
 *
 * @type {puppet.xpath.AttributeFunction}
 */
var xvalue = puppet.xpath.makeAttributeFunction('@value');


/**
 * Generates XPaths to match elements with a given 'src' attribute.
 *
 * @type {puppet.xpath.AttributeFunction}
 */
var xsrc = puppet.xpath.makeAttributeFunction('@src');


/**
 * Generates XPaths to match elements with a given 'text()' subnode.
 *
 * @type {puppet.xpath.AttributeFunction}
 * @see puppet.pred
 */
var xtext = puppet.xpath.makeAttributeFunction('text()');
