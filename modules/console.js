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
 * @fileoverview The Puppet Console UI.
 */

goog.provide('puppet.Console');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events');



/**
 * The Puppet Console that provides the test menu and log.
 *
 * @constructor
 */
puppet.Console = function() {
  /**
   * An array of the elements containing the console menus.
   * @type {!Array.<!Element>}
   * @private
   */
  this.menuElems_ = [];

  /**
   * The element containing the console log.
   * @type {!Element}
   * @private
   */
  this.logElem_ = document.createElement(goog.dom.TagName.DIV);

  // Style the console log. It is important the log id be stable, as it is
  // relied upon by scripts that launch Puppet tests and scrape the results.
  this.logElem_.id = 'log';
  this.logElem_.style.fontSize = '10pt';
  this.logElem_.style.fontFamily = 'monospace';
  this.toggleLog(true);
};


/**
 * Type definition of a menu item.
 *
 * @typedef {{title: string,
 *            href: string,
 *            text: string,
 *            disabled: boolean,
 *            onclick: function()}}
 */
puppet.Console.MenuItem;


/**
 * Returns the menu DOM elements.
 *
 * @return {!Array.<!Element>} Menu elements.
 */
puppet.Console.prototype.getMenuElements = function() {
  return this.menuElems_;
};


/**
 * Returns the log DOM element.
 *
 * @return {!Element} Log element.
 */
puppet.Console.prototype.getLogElement = function() {
  return this.logElem_;
};


/**
 * Adds a menu to the console.
 *
 * @param {string} name Menu name.
 * @param {!Array.<puppet.Console.MenuItem>} items Menu items.
 */
puppet.Console.prototype.addMenu = function(name, items) {
  var menuDiv = document.createElement(goog.dom.TagName.DIV);
  menuDiv.appendChild(document.createTextNode(name + ': '));
  menuDiv.style.fontFamily = 'monospace';
  menuDiv.style.fontSize = '10pt';
  this.menuElems_.push(menuDiv);

  var itemElems = [];
  goog.array.forEach(items, function() {
    var itemElem = document.createElement(goog.dom.TagName.A);
    itemElem.style.padding = '0px 10px 0px 10px';
    itemElem.style.textDecoration = 'none';
    itemElem.style.color = 'blue';
    menuDiv.appendChild(itemElem);
    itemElems.push(itemElem);
  });

  puppet.Console.renderMenu_(items, itemElems);
};


/**
 * Renders the specified menu items into the specified elements.
 *
 * @param {!Array.<puppet.Console.MenuItem>} items Menu items.
 * @param {!Array.<!Element>} itemElems Item DOM elements.
 * @private
 */
puppet.Console.renderMenu_ = function(items, itemElems) {
  goog.array.forEach(items, function(item, index) {
    var itemElem = itemElems[index];
    itemElem.innerHTML = item.text;
    itemElem.title = item.title;
    itemElem.href = goog.isDefAndNotNull(item.href) ? item.href :
                    'javascript:void(0)';
    itemElem.style.display = (item.disabled ? 'none' : '');
    goog.events.removeAll(itemElem, 'click');
    if (item.onclick) {
      var onclick = (function(it) {
        return function() {
          it.onclick();
          puppet.Console.renderMenu_(items, itemElems);
        };
      })(item);
      goog.events.listen(itemElem, 'click', onclick);
    }
  });
};


/**
 * Appends a line (in HTML) to the log.
 *
 * @param {string} htmlLine Line of html to append.
 */
puppet.Console.prototype.appendLogLine = function(htmlLine) {
  var line = document.createElement(goog.dom.TagName.SPAN);
  line.innerHTML = htmlLine;
  this.logElem_.appendChild(line);
  this.logElem_.scrollTop = this.logElem_.scrollHeight;
};


/**
 * Toggles the state of the log between shown and hidden.
 *
 * @param {boolean=} opt_show Show the log if true, hide if false.
 * @return {boolean} Whether the log is now shown.
 */
puppet.Console.prototype.toggleLog = function(opt_show) {
  var show = opt_show || this.logElem_.style.height.charAt(0) == '0';
  if (show) {
    this.logElem_.style.overflow = 'auto';
    this.logElem_.style.height = '18em';
    this.logElem_.style.lineHeight = '1.2em';
  } else {
    this.logElem_.style.overflow = 'hidden';
    this.logElem_.style.height = '0';
    this.logElem_.style.lineHeight = '0';
  }
  return show;
};
