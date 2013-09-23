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
 * @fileoverview Puppet executor module.
 */

goog.provide('puppet.Executor');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('puppet.QueueStack');
goog.require('puppet.logging');



/**
 * Handles command execution.
 *
 * @param {number} delayMs Milliseconds between command executions.
 * @param {number} retryMs Milliseconds between command retries.
 * @param {number} timeoutMs Milliseconds until a command times out.
 * @param {boolean} isVerbose Whether to use verbose logging.
 * @constructor
 */
puppet.Executor = function(delayMs, retryMs, timeoutMs, isVerbose) {
  /**
   * Stack of queues with calls scheduled for execution.
   * @private {!puppet.QueueStack}
   */
  this.queueStack_ = new puppet.QueueStack();

  /**
   * Maps wait ids to setTimeout ids.
   * @private {!Object.<number, ?number>}
   */
  this.waitId2TimeoutId_ = {};

  /**
   * @private {?number}
   */
  this.pollingId_ = null;

  /**
   * Callback function to indicate that test is finished, accepts a non-null
   * error message when the test fails.
   * @private {?function(string=)}
   */
  this.doneCallback_ = null;

  /**
   * @private {number}
   */
  this.delayMs_ = delayMs;

  /**
   * @private {number}
   */
  this.retryMs_ = retryMs;

  /**
   * @private {number}
   */
  this.timeoutMs_ = timeoutMs;

  /**
   * TODO(user): Make this parameter unnecessary by augmenting the logging
   * api.
   * @private {boolean}
   */
  this.isVerbose_ = isVerbose;
};


/**
 * Global unique id counter for the asynchronous tasks.
 * @private {number}
 */
puppet.Executor.waitIdCount_ = 0;


/**
 * @param {number} delayMs The new command delay in milliseconds.
 */
puppet.Executor.prototype.setDelayMs = function(delayMs) {
  this.delayMs_ = delayMs;
};


/**
 * @return {number} The command timeout in milliseconds.
 */
puppet.Executor.prototype.getCommandTimeoutMs = function() {
  return this.timeoutMs_;
};


/**
 * @param {number} timeoutMs The new command timeout in milliseconds.
 */
puppet.Executor.prototype.setCommandTimeoutMs = function(timeoutMs) {
  this.timeoutMs_ = timeoutMs;
};


/**
 * @param {number} retryMs The new command retry in milliseconds.
 */
puppet.Executor.prototype.setRetryMs = function(retryMs) {
  this.retryMs_ = retryMs;
};


/**
 * Calls the function and then executes any commands it has enqueued.
 *
 * @param {function(string=)} callback Callback function to indicate that test
 *     is finished, accepts a non-null error message when the test fails.
 */
puppet.Executor.prototype.start = function(callback) {
  if (this.isExecuting()) {
    throw new Error('Cannot execute when execution is already in progress');
  }
  this.doneCallback_ = callback;
  this.maybeScheduleNextCommand_();
};


/**
 * Stops execution and invokes the current callback with the optional error
 * message.
 *
 * @param {string=} opt_errorMsg An error message that indicates failure.
 */
puppet.Executor.prototype.stop = function(opt_errorMsg) {
  if (!this.isExecuting()) {
    throw new Error('Cannot stop when execution is not in progress');
  }

  // Remove any scheduled commands.
  this.queueStack_.clear();

  // Stop waiting for any asynchronous tasks.
  for (var waitId in this.waitId2TimeoutId_) {
    var timeoutId = this.waitId2TimeoutId_[Number(waitId)];
    window.clearTimeout(timeoutId);
  }
  this.waitId2TimeoutId_ = {};

  // Stop polling for commands.
  window.clearTimeout(this.pollingId_);
  this.pollingId_ = null;

  // Call the doneCallback_ and clear it.
  var callback = this.doneCallback_;
  this.doneCallback_ = null;
  callback(opt_errorMsg);
};


/**
 * @return {boolean} Whether or not execution is occurring.
 */
puppet.Executor.prototype.isExecuting = function() {
  return !!this.doneCallback_;
};


/**
 * Blocks the next command while an asynchronous task is completing, and
 * returns an id that can be used to notify it is complete. If the optional
 * error message is provided, then the execution fails and the callback is
 * invoked with the error message if a notification that the task has completed
 * is not received before the timeout. If an error message is not provided and
 * a notification isn't received, the execution resumes after the timeout.
 *
 * @param {string=} opt_errorMsg Error message if task times out.
 * @return {number} Id to notify that the task has completed.
 */
puppet.Executor.prototype.wait = function(opt_errorMsg) {
  if (!this.isExecuting()) {
    throw new Error('Cannot wait when execution is not in progress');
  }
  var waitId = puppet.Executor.waitIdCount_++;
  var onTimeout = goog.isDef(opt_errorMsg) ?
      goog.bind(this.stop, this, opt_errorMsg) :
      goog.bind(this.notify, this, waitId);
  var timeoutId = this.timeoutMs_ > 0 ?
      this.schedule_(onTimeout, this.timeoutMs_) : null;
  this.waitId2TimeoutId_[waitId] = timeoutId;
  return waitId;
};


/**
 * Notifies the executor that it can stop waiting for the asynchronous task with
 * this given id. This is a noop if the id is invalid or already complete.
 *
 * @param {number} waitId Id of the completed task.
 */
puppet.Executor.prototype.notify = function(waitId) {
  // Intentionally ignore notify calls that occur when not executing.
  var timeoutId = this.waitId2TimeoutId_[waitId];
  if (goog.isDef(timeoutId)) {
    window.clearTimeout(timeoutId);
    delete this.waitId2TimeoutId_[waitId];
    if (!this.isWaiting_() && !this.pollingId_) {
      this.maybeScheduleNextCommand_();
    }
  }
};


/**
 * Whether the executor is waiting for an asychronous task to complete.
 *
 * @return {boolean} Whether the executor is waiting.
 * @private
 */
puppet.Executor.prototype.isWaiting_ = function() {
  for (var waitId in this.waitId2TimeoutId_) {
    return true;
  }
  return false;
};


/**
 * Dequeue and execute all the test commands.
 *
 * @private
 */
puppet.Executor.prototype.maybeScheduleNextCommand_ = function() {
  goog.asserts.assert(this.isExecuting());
  goog.asserts.assert(!this.isWaiting_());

  var command = /** @type {function(): boolean} */(this.queueStack_.dequeue());
  if (command) {
    this.pollingId_ = this.schedule_(
        goog.partial(this.executeCommand_, command), this.delayMs_);
  } else {
    this.stop();
  }
};


/**
 * Executes the command with retry.
 *
 * @param {function():boolean} command Command to be executed.
 * @private
 */
puppet.Executor.prototype.executeCommand_ = function(command) {
  goog.asserts.assert(this.isExecuting());

  // Push a new stack on the queue.
  this.queueStack_.pushQueue();

  // Let the executor know we are waiting for the command to complete.
  var errorMsg = 'Command failed: no attempts passed for ' +
      (this.timeoutMs_ / 1000) + ' seconds. Failing command: <br> ' +
      command.toString();
  var commandWaitId = this.wait(errorMsg);

  // The command's toString method should have been overriden.
  puppet.logging.log(command.toString());

  var startTime = goog.now();
  // Retry the command until it passes or times out.
  retryFunc.call(this);

  function logTimingInfo() {
    if (this.isVerbose_) {
      var timeString = 'time: ' + puppet.logging.time() + '; duration: ' +
          (goog.now() - startTime) + ' ms';
      puppet.logging.log(timeString);
    }
  }

  function retryFunc() {
    if (command()) {
      // Command passed so notify.
      logTimingInfo.call(this);
      this.pollingId_ = null;
      this.notify(commandWaitId);
    } else {
      // Command failed so retry.
      this.pollingId_ = this.schedule_(retryFunc, this.retryMs_);
    }
  }
};


/**
 * Uses setTimeout to schedule the given function to run after the given delay,
 * providing the executor is still executing, with the function bound to 'this',
 * and returns the value of the setTimeout call.
 *
 * @param {function()} fn Function to schedule.
 * @param {number} delay Milliseconds after which to execute the function.
 * @return {number} The setTimeout id of the scheduled function.
 * @private
 */
puppet.Executor.prototype.schedule_ = function(fn, delay) {
  // Checking isExecuting() first shouldn't be necessary according to spec,
  // because stop() clears the pollind id timeout. However, IE < 9 does not
  // always obey clearTimeout if the function has already been queued up. See:
  // stackoverflow.com/questions/5853571/clarifying-cleartimeout-behavior-in-ie
  function pollIfExecuting() {
    if (this.isExecuting()) {
      fn.call(this);
    }
  }
  return window.setTimeout(goog.bind(pollIfExecuting, this), delay);
};


/**
 * Enqueue command.
 * @param {(function() : boolean)} command Command to be queued.
 */
puppet.Executor.prototype.enqueue = function(command) {
  this.queueStack_.enqueue(command);
};
