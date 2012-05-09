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
 * @fileoverview Puppet stack trace module.
 */

goog.provide('puppet.stacktrace');
goog.provide('puppet.stacktrace.Frame');

goog.require('goog.userAgent.product');

// NOTE(user): Frustratingly, Opera returns the line number within the
// <script> tag in which the error occurred instead of the line number
// within the enclosing HTML file itself. So for now, we don't support Opera.
//
// TODO(user): Improve line number calculation for Opera, by extracting
// the source code of the frame URLs to calculate the correct line number.


/**
 * True if the browser supports stack traces.
 *
 * @type {boolean}
 * @const
 */
puppet.stacktrace.BROWSER_SUPPORTED = goog.userAgent.product.CHROME ||
    goog.userAgent.product.FIREFOX;


/**
 * Regexp matching the url and line number in a line of the stacktrace.
 *
 * @type {!RegExp}
 * @private
 * @const
 */
puppet.stacktrace.URL_LINE_REGEXP_ = /([a-z]+:\/\/[^\/@]*\/[^:@]*):(\d*)/;


/**
 * A location (url and line) in the stack trace.
 *
 * @typedef {{url: string, line: number}}
 */
puppet.stacktrace.Frame;


/**
 * Extract and returns a stack trace starting from the current line of code.
 * If the browser does not support stack traces, returns an empty stack trace.
 *
 * @return {!Array.<puppet.stacktrace.Frame>} Frames of the stacktrace.
 */
puppet.stacktrace.get = function() {
  if (!puppet.stacktrace.BROWSER_SUPPORTED) {
    return [];
  }

  var frames = [];
  var stackLines = new Error().stack.split('\n');

  for (var i = 0; i < stackLines.length; i++) {
    var match = puppet.stacktrace.URL_LINE_REGEXP_.exec(stackLines[i]);
    if (match) {
      var frame = {url: match[1], line: Number(match[2])};
      frame.toString = goog.bind(function() {
        return this.url + ' @ ' + this.line;
      }, frame);
      frames.push(frame);
    }
  }

  return frames;
};
