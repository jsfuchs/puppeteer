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
 * @fileoverview A stack of queues.
 */

goog.provide('puppet.QueueStack');

/**
 * A class representing a stack of queues. The constructor initializes
 * the number of queues in the stack to one.
 *
 * @constructor
 */
puppet.QueueStack = function() {
  /**
   * Stack of queues with calls scheduled for execution.
   * @type {!Array.<!Array.<*>>}
   * @private
   */
  this.queueStack_ = [[]];
};

/**
 * Enqueues item in the top queue.
 *
 * @param {*} item Item to be enqueued.
 */
puppet.QueueStack.prototype.enqueue = function(item) {
  goog.array.peek(this.queueStack_).push(item);
};

/**
 * Dequeues the first call in the first non-empty queue.
 * Removes all empty queues on top and returns null if queue-stack
 * is empty.
 *
 * @return {*} The next call to be executed.
 */
puppet.QueueStack.prototype.dequeue = function() {
  while (true) {
    var topQueue = goog.array.peek(this.queueStack_);
    if (topQueue.length > 0) {
      return topQueue.shift();
    } else if (this.queueStack_.length > 1) {
      this.queueStack_.pop();
    } else {
      break;
    }
  }

  return null;
};

/**
 * Pushes a new queue on top of the stack.
 */
puppet.QueueStack.prototype.pushQueue = function() {
  this.queueStack_.push([]);
};

/**
 * Clears the stack of queues.
 */
puppet.QueueStack.prototype.clear = function() {
  this.queueStack_ = [[]];
};

/**
 * Returns the number of queues in the stack.
 *
 * @return {number} Number of queues in stack.
 */
puppet.QueueStack.prototype.numQueues = function() {
  return this.queueStack_.length;
};
