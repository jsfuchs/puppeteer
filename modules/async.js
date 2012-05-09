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
 * @fileoverview An async task manager.
 */

goog.provide('puppet.async');

goog.require('puppet.logging');


/**
 * Unique id counter for the asynchronous tasks.
 * @type {number}
 * @private
 */
puppet.async.idCount_ = 0;


/**
 * Maps task ids to a timeout id or null.
 * @type {!Object.<number, ?number>}
 * @private
 */
puppet.async.id2TimeoutId_ = {};


/**
 * Whether execution of the next Puppet command is waiting for asynchronous
 * tasks to complete.
 *
 * @return {boolean} Whether Puppet is waiting on asynchronous tasks.
 */
puppet.async.isWaiting = function() {
  for (var id in puppet.async.id2TimeoutId_) {
    return true;
  }
  return false;
};


/**
 * Informs Puppet not to execute the next command until an asynchronous task
 * has completed. Puppet waits indefinitely for the task to complete. Note that
 * the user must call puppet.async.done with the returned ID to signal the task
 * has completed.
 *
 * @return {number} Unique id for the asynchronous task.
 */
puppet.async.wait = function() {
  return puppet.async.waitFor_(null);
};


/**
 * Informs Puppet not to execute the next command until an asynchronous task
 * has completed or the specified timeout has expired. If the timeout expires,
 * the test fails with the given error message.  Note that the user must call
 * puppet.async.done with the returned ID to signal the task has completed.
 *
 * @param {number} timeout Number of seconds to wait for the task.
 * @param {string} errorMsg Error message if the timeout expires.
 * @return {number} Unique id for the asynchronous task.
 */
puppet.async.waitUntilTimeout = function(timeout, errorMsg) {
  if (timeout <= 0) {
    puppet.logging.error('timeout must be positive: ' + timeout);
  }
  var timeoutId = window.setTimeout(function() {
    puppet.logging.error(errorMsg);
  }, 1000 * timeout);
  return puppet.async.waitFor_(timeoutId);
};


/**
 * Generates and returns a unique id for the task, associating it with the
 * (possibly null) window timeout id.
 *
 * @param {?number} timeoutId Id of the window timeout or null if none.
 * @return {number} Unique id for the asynchronous task.
 * @private
 */
puppet.async.waitFor_ = function(timeoutId) {
  var id = puppet.async.idCount_++;
  puppet.async.id2TimeoutId_[id] = timeoutId;
  return id;
};


/**
 * Informs Puppet that the asynchronous task with the given id has completed.
 *
 * @param {number} id Unique id for the asynchronous task.
 */
puppet.async.done = function(id) {
  if (!(id in puppet.async.id2TimeoutId_)) {
    puppet.logging.error('no such task id: ' + id);
  }
  var timeoutId = puppet.async.id2TimeoutId_[id];
  if (!goog.isNull(timeoutId)) {
    window.clearTimeout(timeoutId);
  }
  delete puppet.async.id2TimeoutId_[id];
};


/**
 * Informs Puppet to no longer wait for any task to complete.
 */
puppet.async.reset = function() {
  for (var id in puppet.async.id2TimeoutId_) {
    puppet.async.done(Number(id));
  }
};
