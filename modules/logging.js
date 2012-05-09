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
 * @fileoverview Puppet log module.
 */

goog.provide('puppet.logging');

goog.require('goog.array');
goog.require('goog.string');


/**
 * List of callbacks to send echo'ed strings to.
 *
 * @type {!Array.<function(string, string)>}
 * @private
 */
puppet.logging.logListeners_ = [];


/**
 * Maximum length of a string representation of a function.
 *
 * @type {number}
 * @const
 * @private
 */
puppet.logging.MAX_FUNCTION_STRING_LENGTH_ = 50;


/**
 * Registers a log listener to be notified of log'ed strings.
 * When, notified, the listener is given two strings arguments,
 * the first HTML formatted and the second in plain text.
 *
 * @param {function(string, string)} listener The listener.
 */
puppet.logging.addLogListener = function(listener) {
  puppet.logging.logListeners_.push(listener);
};


/**
 * Converts anything to string, outputting functions by names not
 * definitions, and outputting strings with enclosing quotes.
 *
 * @param {*} x Anything.
 * @return {string} String representation.
 */
puppet.logging.toString = function(x) {
  var type = goog.typeOf(x);

  // Sniff out DOM elements and return their opening tag.
  if (type == 'object' && x.tagName) {
    var elem = (/** @type {!Element} */ x);

    // Use a cloneNode() workaround for browsers that don't support outerHTML.
    var outerHTML = elem.outerHTML;
    if (!outerHTML) {
      var e = (/** @type {!Element} */ elem.cloneNode(false));
      var dummy = e.ownerDocument.createElement('div');
      dummy.appendChild(e);
      outerHTML = dummy.innerHTML;
    }

    var tag = outerHTML.substring(0, outerHTML.indexOf('>') + 1);
    return goog.string.htmlEscape(tag);

  // Try to return the name of functions but fall back to the code.
  } else if (type == 'function') {
    x = (/** @type {!Object} */ x);  // Make compiler happy.

    // In some browsers, named functions have a 'name' member; also some Puppet
    // functions have their named stored in the Puppet 'name' property.
    if (x.name) {
      return x.name;
    }

    // If no name member, try to capture a name from the string representation.
    var str = String(x);
    var match = /^function ([a-zA-Z_]+)\(/.exec(str);
    if (match) {
      return match[1];
    }

    // Replace any multiple whitespaces with a single space.
    var code = str.replace(/\s{2,}/g, ' ');
    return code.length < puppet.logging.MAX_FUNCTION_STRING_LENGTH_ ? code :
        code.substr(0, puppet.logging.MAX_FUNCTION_STRING_LENGTH_) + ' ...}';

  // For arrays, concatenate the string representation of their elements.
  } else if (type == 'array') {
    var strArray = [];
    for (var i = 0; i < x.length; i++) {
      strArray[i] = puppet.logging.toString(x[i]);
    }
    return strArray.join(', ');

  // For strings, show quotes around it.
  } else if (type == 'string') {
    return '\'' + x + '\'';

  // Convert anything else to a string.
  } else {
    return String(x);
  }
};


/**
 * Logs a string by notifying each of the log listeners.
 *
 * @param {*} x Anything, but assumes strings are HTML.
 */
puppet.logging.log = function(x) {
  var text, html;
  if (typeof x == 'string') {
    // Assume HTML and convert to plain text.
    html = x;
    text = goog.string.unescapeEntities(html.replace(/<br>/ig, '\n'));
  } else {
    // Convert plain text string to HTML.
    text = puppet.logging.toString(x);
    html = goog.string.htmlEscape(text.replace(/\n/g, '<br>'));
  }
  html += '<br>';
  text += '\n';

  // Echo to all the listeners.
  for (var i = 0; i < puppet.logging.logListeners_.length; i++) {
    puppet.logging.logListeners_[i](html, text);
  }
};


/**
 * Logs a string by notifying error listener.
 *
 * @param {*} x Anything, but assumes strings are HTML.
 */
puppet.logging.error = function(x) {
  // Show pending debug messages immediately when an error occurs.
  puppet.logging.DebugRecorder_.getInstance().echoMessages();
  puppet.logging.log(x);
  if (puppet.logging.errorListener_) {
    puppet.logging.errorListener_();
  } else {
    window.alert(puppet.logging.toString(x));
  }
};


/**
 * Listener to notify when there is an error.
 *
 * @type {function()|null}
 * @private
 */
puppet.logging.errorListener_ = null;


/**
 * Sets an error listener to be notified when there is an error
 * during assert.
 *
 * @param {function()} listener The listener.
 */
puppet.logging.setErrorListener = function(listener) {
  if (puppet.logging.errorListener_) {
    puppet.logging.error('error listener already set');
  } else {
    puppet.logging.errorListener_ = listener;
  }
};


/**
 * Adds a debug message to be displayed.
 *
 * @param {string} msg Message to be added.
 */
puppet.logging.debug = function(msg) {
  puppet.logging.DebugRecorder_.getInstance().addMessage(msg);
};


/**
 * Log debug messages.
 *
 * @param {boolean} commandIsTrue The command returned true.
 */
puppet.logging.maybeLogDebugMessages = function(commandIsTrue) {
  puppet.logging.DebugRecorder_.getInstance().maybeEchoMessages(commandIsTrue);
};



/**
 * DebugRecorder class. Contains debug message lists for display when
 * run-commands or assertions return false, and has functions to clear and echo
 * these.
 * To add a debug message from a command, use puppet.debug(message).
 *
 * @private
 * @constructor
 */
puppet.logging.DebugRecorder_ = function() {
  /**
   * List of messages to be displayed when a command returns false.
   *
   * @type {!Array.<string>}
   * @private
   */
  this.debugMessages_ = [];
  /**
   * List of messages last time maybeEchoMessages was called.
   *
   * @type {!Array.<string>}
   * @private
   */
  this.prevDebugMessages_ = [];
  /**
   * Number of times the current command has returned false.
   *
   * @type {number}
   * @private
   */
  this.falseCounter_ = 0;
  /**
   * Number of times a command has to return false before a debug message
   * is displayed.
   *
   * @const
   * @type {number}
   * @private
   */
  this.FALSE_THRESHOLD_ = 25;
};


// Instance of DebugRecorder_ referenced by DebugRecorder_.getInstance().
goog.addSingletonGetter(puppet.logging.DebugRecorder_);


/**
 * Logs debug messages if:
 * A command has returned false for a period of time and messages are new
 * or have changed.
 * A command has returned false for this period of time and then becomes true.
 *
 * @param {boolean} commandIsTrue The command returned true.
 */
puppet.logging.DebugRecorder_.prototype.maybeEchoMessages =
    function(commandIsTrue) {
  if (commandIsTrue) {
    this.resetMessages_();
  } else {
    this.falseCounter_++;
    if (this.falseCounter_ > this.FALSE_THRESHOLD_ &&
        !goog.array.equals(this.debugMessages_, this.prevDebugMessages_)) {
      this.logDebugMessages_();
      this.prevDebugMessages_ = this.debugMessages_;
    }
    this.debugMessages_ = [];
  }
};


/**
 * Logs debug messages. The messages are logged immediately and then discarded,
 * so they are never shown by maybeEchoMessages.
 */
puppet.logging.DebugRecorder_.prototype.echoMessages = function() {
  this.logDebugMessages_();
  this.resetMessages_();
};


/**
 * Sends this recorder's debug messages to the Puppet log.
 * @private
 */
puppet.logging.DebugRecorder_.prototype.logDebugMessages_ = function() {
  puppet.logging.log('DEBUG: ' + this.debugMessages_.join('<br>DEBUG: '));
};


/**
 * Clears the messages from this recorder and resets the timers for determining
 * when to show a message.
 * @private
 */
puppet.logging.DebugRecorder_.prototype.resetMessages_ = function() {
  this.debugMessages_ = [];
  this.prevDebugMessages_ = [];
  this.falseCounter_ = 0;
};


/**
 * Adds a debug message to be displayed when the run-command returns false.
 *
 * @param {string} msg Message to be added.
 */
puppet.logging.DebugRecorder_.prototype.addMessage = function(msg) {
  this.debugMessages_.push(msg);
};
