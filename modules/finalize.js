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
 * @fileoverview Puppet finalizer module.
 */

goog.provide('puppet.finalize');


/**
 * Finalization hooks to execute once the test ends.
 *
 * @type {!Array.<function(boolean)>}
 * @private
 */
puppet.finalize.finalizers_ = [];


/**
 * The last finalization hook to execute once the test ends.
 *
 * @type {?function(boolean)}
 * @private
 */
puppet.finalize.lastFinalizer_ = null;


/**
 * Adds a finalizer to be executed once the test ends. The finalizer
 * is given a boolean that indicates whether the test passed.
 *
 * @param {function(boolean)} finalizer Finalizer function.
 */
puppet.finalize.addFinalizer = function(finalizer) {
  puppet.finalize.finalizers_.push(finalizer);
};


/**
 * Sets the last finalizer to be executed once the test ends. The finalizer
 * is given a boolean that indicates whether the test passed.
 *
 * @param {function(boolean)} finalizer Finalizer function.
 */
puppet.finalize.setLastFinalizer = function(finalizer) {
  if (puppet.finalize.lastFinalizer_) {
    throw 'puppet.finalize.lastFinalizer_ already defined. You can only set ' +
        'the last finalizer once.';
  }
  puppet.finalize.lastFinalizer_ = finalizer;
};


/**
 * Invokes all the finalizers.
 *
 * @param {boolean} passed Whether the test passed.
 */
puppet.finalize.callFinalizers = function(passed) {
  for (var i = 0; i < puppet.finalize.finalizers_.length; i++) {
    puppet.finalize.finalizers_[i](passed);
  }

  if (puppet.finalize.lastFinalizer_) {
    puppet.finalize.lastFinalizer_(passed);
  }
};
