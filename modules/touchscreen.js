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
 * @fileoverview A wrapper over bot.Touchscreen.
 */

goog.provide('puppet.Touchscreen');

goog.require('bot.Touchscreen');
goog.require('goog.math.Coordinate');



/**
 * A class that wraps bot.Touchscreen so that Puppet's API can avoid exposing
 * browser automation atoms internals.
 *
 * @constructor
 */
puppet.Touchscreen = function() {
  /**
   * The browser automation touchscreen.
   * @type {bot.Touchscreen}
   * @private
   */
  this.touchscreen_ = new bot.Touchscreen();
};


/**
 * @return {bot.Touchscreen} The wrapped touchscreen.
 */
puppet.Touchscreen.prototype.getBotTouchscreen = function() {
  return this.touchscreen_;
};


/**
 * Press the touch screen.
 *
 * @param {boolean=} opt_press2 Whether or not press the second finger during
 *     the press.  If not defined or false, only the primary finger will be
 *     pressed.
 */
puppet.Touchscreen.prototype.press = function(opt_press2) {
  this.touchscreen_.press(opt_press2);
};


/**
 * Release the touch screen.
 */
puppet.Touchscreen.prototype.release = function() {
  this.touchscreen_.release();
};


/**
 * Moves finger along the touchscreen.
 *
 * @param {!Element} element Element that is being pressed.
 * @param {number} x1 The x coordinate for the first press.
 * @param {number} y1 The y coordinate for the first press.
 * @param {number=} opt_x2 The x coordinate for the second press, if any.
 * @param {number=} opt_y2 The y coordinate for the second press, if any.
 */
puppet.Touchscreen.prototype.move = function(element, x1, y1, opt_x2, opt_y2) {
  var coords1 = new goog.math.Coordinate(x1, y1);
  var coords2;
  if (goog.isDef(opt_x2) && goog.isDef(opt_y2)) {
    coords2 = new goog.math.Coordinate(opt_x2, opt_y2);
  }
  this.touchscreen_.move(element, coords1, coords2);
};


/**
 * Returns whether the touchscreen is currently pressed.
 *
 * @return {boolean} Whether the touchscreen is pressed.
 */
puppet.Touchscreen.prototype.isPressed = function() {
  return this.touchscreen_.isPressed();
};
