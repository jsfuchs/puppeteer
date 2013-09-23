// Copyright 2012 Google Inc. All Rights Reserved.
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
 * @fileoverview Functions for retrieving and manipulating elements on the page.
 */

goog.provide('puppet.elements');

goog.require('bot.dom');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.NodeType');
goog.require('puppet.State');
goog.require('puppet.logging');
goog.require('puppet.params');
goog.require('puppet.xpath');


/**
 * Param controlling whether to flash elements when located.
 *
 * @const
 * @type {boolean}
 * @private
 */
puppet.elements.NO_FLASH_ = puppet.params.declareBoolean('noflash');


/**
 * The number of milliseconds that the tested item is highlighted when flashed.
 *
 * @const
 * @private
 * @type {number}
 */
puppet.elements.FLASH_INTERVAL_ = 500;


/**
 * Color of the flash.
 *
 * When turning the flash off, Puppet will not revert the element's background
 * color back to its original value if the background is not currently the flash
 * color. This avoids reverting the color back to the original if the page under
 * test changed the element's color while it was flashed on. However, if the
 * page under test deliberately changes the color to the flash color, Puppet
 * will be unable to detect this and incorrectly revert it back. To reduce the
 * likelihood of this event, we choose an uncommon color value for the flash.
 *
 * @private
 */
puppet.elements.FLASH_COLOR_ = 'rgb(255,0,1)';


/**
 * Listener that fires when an element or array of elements is located,
 * excluding cached elements.
 *
 * @type {!Array.<function((!Element|!Array.<!Element>),
 *     (string|!Element|!Array.<!Element>|function(): !Array.<!Element>))>}
 * @private
 */
puppet.elements.listeners_ = [];


/**
 * XPath resolved to elem cache.
 * @type {!Object.<string, Element>}
 * @private
 */
puppet.elements.elemCache_ = {};


/**
 * Adds a listener that fires when an element or array of elements is located,
 * excluding cached elements.
 *
 * @param {function((!Element|!Array.<!Element>),
 *     (string|!Element|!Array.<!Element>|function(): !Array.<!Element>))}
 *     listener Listener function.
 */
puppet.elements.addListener = function(listener) {
  puppet.elements.listeners_.push(listener);
};


/**
 * Clears the cache used by the get() method.
 */
puppet.elements.clearCache = function() {
  puppet.elements.elemCache_ = {};
};


/**
 * Gets the single element matching an XPath expression.
 *
 * Returns null if no such element matches the expression and throws
 * an exception if multiple elements match it.
 *
 * @param {string|!Element|function(): !Array.<!Element>} pathOrElem XPath or
 *     element or function that returns an array of elements.
 * @param {!Window} win Window in which to resolve the xpath.
 * @param {!puppet.State} state The Puppet execution state..
 * @return {Element} The element or null if none at that path.
 */
puppet.elements.get = function(pathOrElem, win, state) {
  puppet.logging.check(pathOrElem, 'Null or undefined xpath/element.');
  var elem;

  // If the argument is an XPath, resolve it to an element.
  if (goog.isString(pathOrElem)) {
    // Only look for a cached element while the test is running so that
    // ad-hoc actions in the console always reference fresh elements.
    if (!state.isDebugMode() && !state.isFinished()) {
      elem = puppet.elements.elemCache_[pathOrElem];
      if (elem) {
        return elem;
      }
    }
    var nodes = puppet.xpath.resolveXPath(pathOrElem, win);
    elem = puppet.elements.nodeToElement_(nodes.iterateNext());
    if (elem) {
      var nextElem = puppet.elements.nodeToElement_(nodes.iterateNext());
      puppet.logging.check(nextElem == null,
          'XPath matches multiple elements: ' + pathOrElem +
          '; first matching element: ' + describeLocation(elem) +
          '; second matching element: ' + describeLocation(nextElem));
    }
    puppet.elements.elemCache_[pathOrElem] = elem;

  // Otherwise, presume it is an element.
  } else {
    // If the argument is a function, resolve it to an array of elements.
    if (goog.isFunction(pathOrElem)) {
      var result = pathOrElem();
      puppet.logging.check(goog.isArray(result), 'Locator function returned' +
          ' result of type ' + goog.typeOf(result) + ' instead an array.');
      if (result.length == 0) {
        return null;
      }
      puppet.logging.check(result.length <= 1, 'Locator matches multiple ' +
          'elements: first matching element: ' + result[0] +
          '; second matching element: ' + result[1]);
      elem = result[0];
    } else {
      elem = /** @type {!Element} */ (pathOrElem);
    }
    puppet.logging.check(bot.dom.isElement(elem), 'not an element');
  }

  // Unless noflash is set, flash the element on and schedule it to flash off.
  if (elem && !puppet.elements.NO_FLASH_) {
    puppet.elements.flash(elem, true);
    window.setTimeout(function() {
      puppet.elements.flash(/** @type {!Element} */ (elem), false);
    }, puppet.elements.FLASH_INTERVAL_);
  }

  if (elem) {
    goog.array.forEach(puppet.elements.listeners_, function(listener) {
      listener(/** @type {!Element} */ (elem), pathOrElem);
    });
  }
  return elem;

  function describeLocation(e) {
    var path = [];
    for (var elem = e; elem; elem = puppet.elements.parentElement_(elem)) {
      var selector = elem.nodeName;
      if (elem.id) {
        selector += '#' + elem.id;
      }
      // Interestingly, SVG DOM nodes do have a className property but
      // that's not a string, i.e. it doesn't have a split() method.
      if (goog.isString(elem.className) && elem.className) {
        var c = elem.className.split(/\s+/);
        selector += '.' + c.join('.');
      }
      path.unshift(selector);
    }
    return path.join(' > ');
  }
};


/**
 * Gets all elements by an XPath expression.
 *
 * @param {string|!Array.<!Element>|function(): !Array.<!Element>} pathOrElems
 *     XPath or array of elements or function that returns an array of elements.
 * @param {!Window} win Window in which to resolve the xpath.
 * @return {!Array.<!Element>} Elements at the given path.
 */
puppet.elements.getAll = function(pathOrElems, win) {
  puppet.logging.check(pathOrElems, 'Null or undefined xpath/element array.');
  var elems;
  if (typeof pathOrElems == 'string') {
    var nodes = puppet.xpath.resolveXPath(pathOrElems, win);
    elems = [];
    // Firefox/Safari uses 'null' while xpath.js (for IE) uses
    // 'undefined' to indicate the end of iteration.
    for (var e = nodes.iterateNext(); e; e = nodes.iterateNext()) {
      var elem = puppet.elements.nodeToElement_(e);
      if (elem) {
        elems.push(elem);
      }
    }
  } else {
    if (goog.isFunction(pathOrElems)) {
      elems = pathOrElems();
    } else {
      elems = /** @type {!Array.<!Element>} */ (pathOrElems);
    }
    puppet.logging.check(goog.isArray(elems));
  }
  if (elems.length) {
    goog.array.forEach(puppet.elements.listeners_, function(listener) {
      listener(elems, pathOrElems);
    });
  }
  return elems;
};


/**
 * Flashes/highlight the element in action. Returns whether the flash state
 * changed as a result of this call.
 *
 * The highlight may not be cleared properly if the element is copied
 * during highlight such as during infowindow resizing.
 *
 * @param {!Element} elem The target element.
 * @param {boolean} on True turns flash on, false turns it off.
 * @return {boolean} Whether the flash state changed.
 */
puppet.elements.flash = function(elem, on) {
  try {
    var savedColor = puppet.elements.getPuppetProperty_(elem,
        'backgroundColor');

    // The backgroundColor Puppet property is present iff the flash is on.
    if (on == goog.isDefAndNotNull(savedColor)) {
      return false;
    }

    // Otherwise, turn the flash on or off, as given.
    // NOTE(user): It is important that the style be set with
    //   elem.style['background-color'] = ...
    // and not
    //   elem.style['backgroundColor'] = ...
    // nor
    //   elem.style.backgroundColor = ...
    // because the latter two don't complete synchronously on IE and may
    // transiently make the element disappear while it is in process!
    var currentColor = (elem.style['background-color'] || '').replace(/ /g, '');
    if (on) {
      puppet.elements.setPuppetProperty_(elem, 'backgroundColor', currentColor);
      elem.style['background-color'] = puppet.elements.FLASH_COLOR_;
    } else {
      if (currentColor == puppet.elements.FLASH_COLOR_) {
        elem.style['background-color'] = /** @type {string} */ (savedColor);
      }
      puppet.elements.setPuppetProperty_(elem, 'backgroundColor', null);
    }
    return true;
  } catch (e) {
    // In IE, accessing an element after a new document is loaded
    // can cause 'Permission denied' exception. Ignore the exception.
    return false;
  }
};


/**
 * Returns the node cast to an Element, if it is an element; otherwise
 * returns null.
 *
 * @param {Node} node Node.
 * @return {Element} The node cast to an element or null.
 * @private
 */
puppet.elements.nodeToElement_ = function(node) {
  return bot.dom.isElement(node) ? /** @type {!Element} */ (node) : null;
};


/**
 * Returns the parent of the element if the parent is itself an element;
 * otherwise, returns null.
 *
 * @param {!Element} elem Element.
 * @return {Element} Parent node if it exists and if it is an element.
 * @private
 */
puppet.elements.parentElement_ = function(elem) {
  return puppet.elements.nodeToElement_(elem.parentNode);
};


/**
 * Name of the property that is an object containing custom puppet properties.
 *
 * @const
 * @type {string}
 * @private
 */
puppet.elements.PUPPET_PROPERTY_OBJECT_STRING_ = '_puppet';


/**
 * Returns the value of a custom, Puppet property on an element.
 * These are properties Puppet has attached to user-visible elements.
 *
 * @param {!Element} e An element.
 * @param {string} name The name of a property.
 * @return {*} The value of the property.
 * @private
 */
puppet.elements.getPuppetProperty_ = function(e, name) {
  return puppet.elements.PUPPET_PROPERTY_OBJECT_STRING_ in e ?
      e[puppet.elements.PUPPET_PROPERTY_OBJECT_STRING_][name] : undefined;
};


/**
 * Sets the value of a custom, Puppet property on an element.
 * These are properties Puppet has attached to user-visible elements.
 *
 * @param {!Element} e An element.
 * @param {string} name The name of a property.
 * @param {*} value The value of the property.
 * @private
 */
puppet.elements.setPuppetProperty_ = function(e, name, value) {
  if (!(puppet.elements.PUPPET_PROPERTY_OBJECT_STRING_ in e)) {
    e[puppet.elements.PUPPET_PROPERTY_OBJECT_STRING_] = {};
  }
  e[puppet.elements.PUPPET_PROPERTY_OBJECT_STRING_][name] = value;
};
