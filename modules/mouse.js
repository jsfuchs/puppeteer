// Copyright 2013 Google Inc. All Rights Reserved.
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
 * @fileoverview A wrapper over bot.Mouse.
 */

goog.provide('puppet.Mouse');

goog.require('bot.Mouse');
goog.require('goog.math.Coordinate');



/**
 * A class that wraps bot.Mouse so that Puppet's API can avoid exposing
 * browser automation atoms internals.
 *
 * @constructor
 */
puppet.Mouse = function() {
  /**
   * The browser automation mouse.
   * @private {!bot.Mouse}
   */
  this.mouse_ = new bot.Mouse();
};


/**
 * @return {!bot.Mouse} The wrapped mouse.
 */
puppet.Mouse.prototype.getBotMouse = function() {
  return this.mouse_;
};


/**
 * Press a mouse button on an element that the mouse is interacting with.
 *
 * @param {!bot.Mouse.Button} button Button.
 */
puppet.Mouse.prototype.pressButton = function(button) {
  this.mouse_.pressButton(button);
};


/**
 * Release the mouse button.
 */
puppet.Mouse.prototype.releaseButton = function() {
  this.mouse_.releaseButton();
};


/**
 * Given a coordinates (x,y) related to an element, move mouse to (x,y) of the
 * element. The top-left point of the element is (0,0).
 *
 * @param {!Element} element The destination element.
 * @param {number} x The x coordinate for the mouse position.
 * @param {number} y The y coordinate for the mouse position.
 * have been modified.
 *
 */
puppet.Mouse.prototype.move = function(element, x, y) {
  this.mouse_.move(element, new goog.math.Coordinate(x, y));
};


/**
 * Scrolls the wheel of the mouse by the given number of ticks, where a positive
 * number indicates a downward scroll and a negative is upward scroll.
 *
 * @param {number} ticks Number of ticks to scroll the mouse wheel.
 */
puppet.Mouse.prototype.scroll = function(ticks) {
  this.mouse_.scroll(ticks);
};
