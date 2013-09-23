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
 * @fileoverview Puppet state module.
 */

goog.provide('puppet.State');

/**
 * A class representing Puppet's execution state.
 *
 * @param {boolean} debugMode Whether to execute in debug mode.
 * @constructor
 */
puppet.State = function(debugMode) {
  /**
   * @private {boolean}
   */
  this.finished_ = false;

 /**
   * The number of commands that have been queued thus far, not including
   * pauses. This is used by run() to match commands against the commands_
   *  parameter to determine which commands to precede with pauses. It is also
   *  used by puppet.start_ to test whether any commands have been queued yet.
   *
   * @private {number}
   */
  this.commandIndex_ = 0;


  /**
   * @private {boolean}
   */
  this.debugMode_ = debugMode;
};

/**
 * @return {number} The command index.
 */
puppet.State.prototype.getCommandIndex = function() {
  return this.commandIndex_;
};


/**
 * Increments the command index.
 */
puppet.State.prototype.incrementCommandIndex = function() {
  this.commandIndex_++;
};


/**
 * @return {boolean} Whether execution is in debug mode.
 */
puppet.State.prototype.isDebugMode = function() {
  return this.debugMode_;
};


/**
 * Pauses a Puppet command.
 */
puppet.State.prototype.enterDebugMode = function() {
  this.debugMode_ = true;
};


/**
 * Resumes Puppet.
 */
puppet.State.prototype.leaveDebugMode = function() {
  this.debugMode_ = false;
};


/**
 * @return {boolean} Whether execution is finished.
 */
puppet.State.prototype.isFinished = function() {
  return this.finished_;
};


/**
 * Sets whether execution is finished.
 *
 * @param {boolean} finished Whether execution is finished.
 */
puppet.State.prototype.setFinished = function(finished) {
  this.finished_ = finished;
};
