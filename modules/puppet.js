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
 * @fileoverview Defines the Puppet namespace and commands.
 */

goog.provide('puppet');

goog.require('bot');
goog.require('bot.Keyboard');
goog.require('bot.Mouse');
goog.require('bot.action');
goog.require('bot.dom');
goog.require('bot.events');
goog.require('bot.userAgent');
goog.require('bot.window');
goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.KeyCodes');
goog.require('goog.math.Coordinate');
goog.require('goog.math.Size');
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.uri.utils');
goog.require('goog.userAgent');
goog.require('goog.userAgent.product');
goog.require('puppet.Console');
goog.require('puppet.Executor');
goog.require('puppet.Mouse');
goog.require('puppet.State');
goog.require('puppet.TestCase');
goog.require('puppet.Touchscreen');
goog.require('puppet.elements');
goog.require('puppet.finalize');
goog.require('puppet.logging');
goog.require('puppet.params');
goog.require('puppet.userAgent');
goog.require('puppet.xpath');
goog.require('webdriver.stacktrace');

goog.setTestOnly('puppet');

// Firefox 4+ ignores focus and blur events if it is not the active application.
// Call the prototype focus() method because Puppet overrides the name focus.
if (puppet.userAgent.isFirefox(4, null) && !window.document.hasFocus()) {
  Window.prototype.focus.call(window);
}

// G_testRunner is the interface test runners use to access the result of the
// test. If the global variable G_testRunner already exists, assume Puppet
// itself is being tested, so don't overwrite it.
if (!goog.global['G_testRunner']) {
  goog.global['G_testRunner'] = {
    /**
     * Gets the test report.
     *
     * @return {string} Report.
     */
    'getReport': function() {
      return puppet.report_;
    },

    /**
     * Gets test finished boolean.
     *
     * @return {boolean} Whether or not the test is finished.
     */
    'isFinished': function() {
      return puppet.testStatus_ == puppet.TestStatus.FAILED ||
          puppet.testStatus_ == puppet.TestStatus.PASSED;
    },

    /**
     * Gets the test success boolean.
     *
     * @return {boolean} Whether or not the test succeeded.
     */
    'isSuccess': function() {
      return puppet.testStatus_ == puppet.TestStatus.PASSED;
    },

    'getTestResults': function() {
      return puppet.resultsByName_;
    }
  };
}

/**
 * Makes a GET/POST request via an XMLHttpRequest.
 *
 * @param {string} url URL to request.
 * @param {string=} opt_type Request type: 'GET' (default) or 'POST'.
 * @param {?string=} opt_body Request body; defaults to null.
 * @param {boolean=} opt_async Whether the request is asynchronous;
 *    defaults to false.
 * @param {Object=} opt_headers Request headers; defaults to null.
 * @return {?string} Response text; null if the HTTP response status
 *     code is not 200.
 */
puppet.request = function(url, opt_type, opt_body, opt_async, opt_headers) {
  if (!url) {
    return null;
  }

  // Make and open the request in a cross-browser compatible way.
  // The false argument makes the request synchronous.
  var request = window.XMLHttpRequest ?
      new XMLHttpRequest() :
      new ActiveXObject('Microsoft.XMLHTTP');
  var type = opt_type || 'GET';
  var async = opt_async || false;
  request.open(type, url, async);

  // Ensures that pages are not cached in Google Chrome and Firefox.
  request.setRequestHeader('cache-control', 'no-cache');
  request.setRequestHeader('pragma', 'no-cache');
  request.setRequestHeader('expires', '0');

  // IE6 erroneously returns HTTP 200 Found for cached HTTP 404 Not-found
  // requests. Neither setting 'Pragma=no-cache' nor 'Cache-Control=no-cache'
  // fixes the problem. Use a valid HTTPDate instead of '0' to support strict
  // HTTP servers. Setting this in Firefox will return unexpected results.
  // See: http://en.wikibooks.org/wiki/XMLHttpRequest#Caching
  if (/MSIE 6/.test(navigator.userAgent)) {
    request.setRequestHeader('If-Modified-Since',
        'Sat, 1 Jan 2000 00:00:00 GMT');
  }

  for (var key in opt_headers) {
    request.setRequestHeader(key, opt_headers[key]);
  }

  // Under some conditions (such as 204 responses in IE6), sending the
  // request can throw an error, in which case we return 'null'.
  try {
    request.send(opt_body || null);
  } catch (e) {
    return null;
  }

  // No response text if the request is asynchronous or if the (synchronous)
  // request does not have a 200 status.
  return async || request.status != 200 ? null : request.responseText;
};

/**
 * URL of the Puppet directory.
 *
 * @type {string}
 * @private
 * @const
 */
puppet.DIRECTORY_URL_ = window['PUPPET_DIRECTORY_URL'] || (function() {
  // Find the src of the script tag that includes puppet binary.
  // Throw an assertion error if there is more than one.
  var puppetDir = null;
  goog.array.forEach(document.getElementsByTagName('script'), function(s) {
    var src = s.src;
    var filenameIndex = src.lastIndexOf('/') + 1;
    var filename = src.substring(filenameIndex);
    if (filename == 'puppet.js' || filename == 'puppet-bundle.js') {
      var dir = filenameIndex > 0 ? src.substring(0, filenameIndex) : './';
      if (!!puppetDir) {
        throw Error('Malformed Puppet Test\n' +
            'Test contains more than one puppet base directory:\n' +
            puppetDir + '\nand\n' + dir);
      }
      puppetDir = dir;
    }
  });
  if (!puppetDir) {
    throw Error('Puppet is not used by test.');
  }
  return puppetDir;
})();

/**
 * Evaluates the JavaScript synchronously from the specified relative server
 * path. It is resolved relative to the location of this puppet.js file, NOT
 * relative to the file in which it is called and NOT relative to the test
 * itself. If the path has already been included, this is a noop.
 *
 * @param {string} path Relative path to the JavaScript file.
 * @return {boolean} Whether a non-empty JavaScript file was found.
 */
puppet.include = (function() {
  // Set of included JS files, to ensure none is included more than once.
  var includes = {};

  // Set the puppet.include function to the following closure.
  function includer(path) {
    // If already included, return.
    if (path in includes) {
      return true;
    }
    // Otherwise, request that absolute path to the file.
    var response = puppet.request(puppet.DIRECTORY_URL_ + path);
    if (!response) {
      return false;
    }
    // Make a script tag to include it and mark it as included.
    var script = document.createElement('script');
    script.text = response;
    // Do not use 'head' or 'body' elements, which may not exist yet.
    document.documentElement.firstChild.appendChild(script);
    includes[path] = null;
    return true;
  }
  return includer;
})();

//
// Puppet Layout & UI
//

/**
 * URL of the Puppet blank page.
 *
 * @const
 * @type {string}
 * @private
 */
puppet.BLANK_PAGE_URL_ = puppet.DIRECTORY_URL_ + 'blank.htm';

/**
 * Returns a relative url to the test file being run. E.g., if the window
 * location is "http://www.google.com/tests/mytest.html?time=100#a", the test
 * url would be "/tests/mytest.html?time=100#a".
 *
 * @return {string} Relative url to the test.
 */
puppet.testUrl = function() {
  var loc = window.location;
  return loc.pathname + loc.search + loc.hash;
};

/**
 * Gets the content window being tested.
 *
 * @return {!Window} Content window.
 */
puppet.window = function() {
  return bot.getWindow();
};

/**
 * Gets the content document being tested.
 *
 * @return {!Document} Content document.
 */
puppet.document = function() {
  return bot.getDocument();
};

/**
 * Gets the frameElement.
 *
 * @return {Element} frFrame element.
 * @private
 */
puppet.getFrame_ = function() {
  try {
    // On IE, accessing the frameElement of a popup window results in a "No Such
    // interface" exception.
    return bot.getWindow().frameElement;
  } catch (e) {
    return null;
  }
};

/**
 * Gets the content location being tested.
 *
 * @return {!Location} Location.
 */
puppet.location = function() {
  return puppet.window().location;
};

/**
 * String containing the test report log as plain text as opposed to html.
 *
 * @type {string}
 * @private
 */
puppet.report_ = 'Puppet Report Log:\n';

/**
 * Test results for each test that was run. The test name is always added
 * as the key in the map, and the array of strings is an optional list
 * of failure messages. If the array is empty, the test passed. Otherwise,
 * the test failed.
 *
 * @private {!Object.<string, !Array.<string>>}
 */
puppet.resultsByName_ = {};

/**
 * The Puppet console including the menu and log.
 *
 * @type {!puppet.Console}
 * @private
 */
puppet.console_ = new puppet.Console();

/**
 * Style and add content to the menu.
 *
 * @private
 */
puppet.buildMenu_ = function() {
  var docItem = {
    text: 'doc',
    title: 'Open the Puppet documentation.',
    href: 'javascript:window.open(\'http://code.google.com/p/puppeteer\')'};
  var pauseItem = {
    text: 'pause',
    title: 'Pause execution and wait for stepping',
    disabled: puppet.state_.isDebugMode(),
    onclick: function() {
      puppet.pause_();
      continueItem.disabled = pauseItem.disabled;
      pauseItem.disabled = !pauseItem.disabled;
    }};
  var continueItem = {
    text: 'continue',
    title: 'Continue execution through the rest of commands',
    disabled: !puppet.state_.isDebugMode(),
    onclick: function() {
      puppet.continue_();
      continueItem.disabled = pauseItem.disabled;
      pauseItem.disabled = !pauseItem.disabled;
    }};
  var stepItem = {
    text: 'step',
    title: 'Step through the next command and pause execution, ?step',
    onclick: puppet.step_};
  var cmdsItem = {
    text: 'cmds',
    title: 'Pause at the i-th numbers of commands, ?cmds=1,3',
    href: puppet.params.setUrlParam('cmds', '1,3')};
  var linesItem = {
    text: 'lines',
    title: 'Pause at the i-th numbers of source code lines' +
        ', ?line=10,13',
    href: puppet.params.setUrlParam('lines', '10,13'),
    disabled: !webdriver.stacktrace.BROWSER_SUPPORTED};
  var delayItem = {
    text: 'delay',
    title: 'Delay for 200 milliseconds between run() commands, ?delay=200',
    href: puppet.params.setUrlParam('delay', '200')};
  var verboseItem = {
    text: 'verbose',
    title: 'Run the test in verbose (debugging) mode',
    href: puppet.params.setUrlParam('verbose', '')};
  var toggleLogItem = (function() {
    var item = {};
    item.onclick = function() {
      var shown = puppet.console_.toggleLog();
      item.text = shown ? 'hide log' : 'show log';
      item.title = shown ? 'Hide the log' : 'Show the log';
    };
    // Toggle the item to initialize the text and title and then revert.
    item.onclick();
    item.onclick();
    return item;
  })();
  var sourceItem = {
    text: 'source',
    title: 'View source code',
    onclick: function() {
      var sourceWindow = window.open();
      var sourceCode = puppet.sourceCodeLines_(window.location.href);
      sourceWindow.document.write('<PLAINTEXT>' + sourceCode.join('\n'));
      sourceWindow.document.close();
    }};
  puppet.console_.addMenu('Menu', [
    docItem,
    pauseItem,
    continueItem,
    stepItem,
    cmdsItem,
    linesItem,
    delayItem,
    verboseItem,
    toggleLogItem,
    sourceItem
  ]);
};

/**
 * Add menu items to a project-specific menu.
 *
 * @param {!Array.<!puppet.Console.MenuItem>} items Menu items.
 */
puppet.addMenuItems = function(items) {
  puppet.console_.addMenu('Project Menu', items);
};

/**
 * Creates content and control elements, and starts execution.
 *
 * @private
 */
puppet.initialize_ = function() {
  // Do not initialize if the Javascript unit test runner or Puppet
  // multi-test runner is present. Check during window.onload (when
  // puppet.initialize_ is called) to allow a late definition of
  // window['puppet']runner.
  if (window['puppet'].runner) {
    return;
  }
  document.title = puppet.testUrl();
  // To signal the test harness that the test is complete.
  document.body.id = 'puppet';
  document.body.style.margin = '0';

  function styleFullSize(elem) {
    var style = elem.style;
    style.height = '100%';
    style.minHeight = '100%';
    style.border = '0';
    style.margin = '0';
    style.padding = '0';
  }

  // Preserve Puppet's legacy Quirks Mode behavior.
  if (goog.dom.isCss1CompatMode()) {
    styleFullSize(document.documentElement);
    styleFullSize(document.body);
  }

  // Create table, row, and cell to hold the iframe.
  var table = document.createElement(goog.dom.TagName.TABLE);
  table.cellPadding = '0';
  table.cellSpacing = '0';
  styleFullSize(table);
  table.style.width = '100%';
  var contentRow = table.insertRow(-1);
  styleFullSize(contentRow);
  var contentCell = contentRow.insertCell(-1);

  // Create the Puppet iframe.
  var puppetIframe = document.createElement('iframe');
  var iframeOrContainer = puppetIframe;
  // TODO(user): See if iPhone needs similar logic.
  if (puppet.userAgent.isIPad()) {
    var iframeDiv = document.createElement('div');
    styleFullSize(iframeDiv);
    iframeDiv.style.overflow = 'auto';
    iframeDiv.style.WebkitOverflowScrolling = 'touch';
    iframeDiv.appendChild(puppetIframe);
    iframeOrContainer = iframeDiv;
  }

  contentCell.appendChild(iframeOrContainer);
  puppetIframe.id = 'content';
  puppetIframe.src = puppet.BLANK_PAGE_URL_;
  puppetIframe.frameBorder = '0';
  puppetIframe.marginWidth = '0';
  puppetIframe.marginHeight = '0';
  puppetIframe.height = '100%';

  // Preserve Puppet's legacy Quirks Mode behavior.
  if (goog.dom.isCss1CompatMode()) {
    styleFullSize(puppetIframe);
  }

  puppetIframe.width = puppet.PARAMS.width;
  puppetIframe.style.width = puppet.PARAMS.width;

  // For the first Puppet iframe load, call puppet.initWindow and then start
  // command execution.
  goog.events.listenOnce(puppetIframe, 'load', function() {
    puppet.initWindow();

    window.setTimeout(function() {
      // If jsunit testing is occuring, then do not execute anything.
      if (window['goog'] && window['goog']['testing'] &&
          window['goog']['testing']['jsunit']) {
        return;
      }
      // The canonical way to enqueue Puppet commands was to override
      // window.onload. If window.onload has not been overriden, then support
      // xUnit style tests.
      if (window.onload) {
        puppet.executor_.start(function(opt_errorMsg) {
          puppet.done_(opt_errorMsg);
        });
      } else {
        puppet.testCase_ = new puppet.TestCase(puppet.executor_, puppet.done_);
        puppet.testCase_.run();
      }
    }, 0);
  }, true);

  // For subsequent Puppet iframe loads, we potentially need to call
  // puppet.initWindow().
  goog.events.listen(puppetIframe, 'load', function() {
    // Opera doesn't fire the unload event on the Puppet iframe, so we don't
    // know for sure whether the window has been initialized. So we explicitly
    // set windowInitialized_ to false, so that the full initialization will
    // happen. This means the window may be initialized multiple time in Opera,
    // which is unnecessary, but should be a noop in terms of visible behavior.
    if (puppet.windowInitializedId_ || puppet.userAgent.isOpera()) {
      puppet.initWindow();
    }
  }, true);
  // If fullpage, always hide the log.
  // Otherwise, build the menu and hide the log only if requested.
  var menuRow = null;
  if (puppet.PARAMS.fullpage) {
    puppet.console_.toggleLog(false);
  } else {
    puppet.buildMenu_();
    menuRow = table.insertRow(-1);
    menuRow.style.height = 0;
    var menuCell = menuRow.insertCell(-1);
    goog.array.forEach(puppet.console_.getMenuElements(), function(elem) {
      menuCell.appendChild(elem);
    });
    menuCell.style.borderTop = '1px solid black';
    menuCell.style.marginBottom = '3px';
    puppet.console_.toggleLog(!puppet.PARAMS.hidelog);
  }

  var logElem = puppet.console_.getLogElement();
  var logRow = table.insertRow(-1);
  logRow.style.height = 0;
  logRow.insertCell(-1).appendChild(logElem);
  document.body.appendChild(table);

  // The iframe won't consume 100% of the row in IE or Opera standards mode,
  // so we need to set its height explicitly.
  if ((goog.userAgent.IE || goog.userAgent.OPERA) &&
      goog.dom.isCss1CompatMode()) {
    var maxHeight = document.documentElement.clientHeight;
    var menuHeight = menuRow ? menuRow.offsetHeight : 0;
    var logHeight = logRow.offsetHeight;
    var iframeHeight = (maxHeight - menuHeight - logHeight - 4) + 'px';
    contentRow.style.height = iframeHeight;
    contentCell.style.height = iframeHeight;
  }

  // Make the atoms consider the Puppet iframe to be the "top" window.
  bot.setWindow(/** @type {!Window} */ (goog.dom.getFrameContentWindow(
      /** @type {!HTMLIFrameElement} */ (puppetIframe))));

  // In case the test failed by now due to a syntax error, quit here.
  if (puppet.state_.isFinished()) {
    return;
  }

  puppet.echo('Running: <a href=' + puppet.testUrl() + ' target=_blank>' +
      puppet.testUrl() + '</a> ' +
      (puppet.PARAMS.verbose ? (new Date).toDateString() : ''));

  // Fix the width to the current width, so that horizontal overflow
  // always adds a scroll bar instead of stretching the log off screen.
  logElem.style.width = logElem.offsetWidth;

  // Configuring test to fail after the whole test timeout is reached,
  // unless we're in stepping mode.
  if (puppet.PARAMS.time > 0 && !puppet.state_.isDebugMode()) {
    window.setTimeout(function() {
      puppet.done_('Test failed: did not complete within ' +
          puppet.PARAMS.time + ' seconds.');
    }, puppet.PARAMS.time * 1000);
  }

  puppet.updateStatus_(puppet.TestStatus.LOADED);

  // Log an information message for IE if the userAgent version does not match
  // the document mode and warn the user. Starting in IE 10, one can only
  // intentionally cause a mismatch in browser version and document mode, so no
  // warning is given.
  if (goog.userAgent.IE) {
    var majorVersion = Math.floor(Number(goog.userAgent.VERSION));
    if (majorVersion < 10 && !bot.userAgent.isEngineVersion(majorVersion)) {
      puppet.echo('Warning: the IE document mode (' +
          goog.userAgent.DOCUMENT_MODE + ') does not match the major browser ' +
          'version (' + majorVersion + '). If this is not intentional, ' +
          'consider adding a &lt;!DOCTYPE html&gt; declaration to the top of ' +
          'the test file to ensure they match');
    }
  }
};

/**
 * Makes a test status object with the given message and color.
 *
 * @param {string} message Message.
 * @param {string} color Color.
 * @return {{message: string, color: string}} Status object.
 * @private
 */
puppet.makeTestStatus_ = function(message, color) {
  return {
    message: message,
    color: color,
    toString: function() {
      return message;
    }
  };
};

/**
 * Enum for the status of a test.
 * @enum {{message: string, color: string}}
 */
puppet.TestStatus = {
  LOADED: puppet.makeTestStatus_('loaded', 'cornsilk'),
  PASSED: puppet.makeTestStatus_('passed', 'palegreen'),
  FAILED: puppet.makeTestStatus_('failed', 'pink')
};

/**
 * Status of the test execution.
 *
 * @type {?puppet.TestStatus}
 * @private
 */
puppet.testStatus_ = null;

/**
 * Returns the status of the Puppet test execution.
 *
 * @return {?puppet.TestStatus} Status of the test execution.
 */
puppet.getStatus = function() {
  return puppet.testStatus_;
};

/**
 * The multi-runner object, if the test was opened by the multi-runner;
 * otherwise null.
 *
 * @type {{notifyStatus: function(!Window, !puppet.TestStatus),
           notifyDone: function(!Window)}}
 * @private
 */
puppet.runner_ = (function() {
  // Check for the runner inside a try-catch to avoid security exceptions.
  try {
    if (self.opener && self.opener['puppet'] &&
        self.opener['puppet']['runner']) {
      return self.opener['puppet']['runner'];
    }
  } catch (ignore) {}

  return null;
})();

/**
 * Updates the UI with the specified test status.
 *
 * @param {!puppet.TestStatus} status Status of the test.
 * @private
 */
puppet.updateStatus_ = function(status) {
  puppet.testStatus_ = status;

  // Display timestamps for the message status of the multitest runner.
  var message = status.message + ' #' + puppet.logging.time();
  puppet.echo('== ' + message);
  puppet.console_.getLogElement().style.backgroundColor = status.color;

  // Notify the multi-runner, if any.
  if (puppet.runner_) {
    puppet.runner_['notifyStatus'](window, status);
  }
};


//
// Puppet parameters.
//

/**
 * Parameters to control the behavior of Puppet.
 *
 * @type {{
 *   close: boolean,
 *   cmds: !Array.<string>,
 *   delay: number,
 *   fullpage: boolean,
 *   hidelog: boolean,
 *   hidemenu: boolean,
 *   lines: !Array.<string>,
 *   step: boolean,
 *   time: number,
 *   timeout: number,
 *   verbose: boolean,
 *   width: string
 * }}
 * @const
 */
puppet.PARAMS = {
  // Whether window.close should be called once the test is done.
  // Commonly used by automated Puppet test runners.
  close: puppet.params.declareBoolean('close'),
  // The i-th numbers of run() commands to pause, separated by comma,
  // e.g. ?cmds=3,6 to pause at the 3rd and the 6th commands. */
  cmds: puppet.params.declareMultistring('cmds', []),
  // Number of milliseconds to delay between commands.
  delay: puppet.params.declareNumber('delay', 0),
  // Whether the page under test should consume the entire window.
  fullpage: puppet.params.declareBoolean('fullpage'),
  // Whether the puppet log should be hidden.
  hidelog: puppet.params.declareBoolean('hidelog'),
  // Whether the puppet menu should be hidden.
  hidemenu: puppet.params.declareBoolean('hidemenu'),
  // The i-th numbers of soure code lines to pause, separated by comma,
  // e.g. ?lines=3,6 to pause at the 3rd and the 6th lines.
  // Only supported by browsers that support stack traces.
  lines: puppet.params.declareMultistring('lines', []),
  // Whether the test begins paused for stepping through and debugging.
  step: puppet.params.declareBoolean('step'),
  // The number of seconds before the whole test times out.
  // Zero means there is no limit; perhaps useful for debugging.
  time: puppet.params.declareNumber('time', 600),
  // The number of seconds before a command times out.
  // Zero means there is no limit; perhaps useful for debugging.
  // TODO(user): Remove conditional increase for ie9
  timeout: puppet.params.declareNumber('timeout',
      goog.userAgent.IE && bot.userAgent.isProductVersion(9) ? 60 : 30),
  // Whether to show extra debug output when the test runs.
  verbose: puppet.params.declareBoolean('verbose'),
  // Width of the Puppet iframe. Defaults to '100%'.
  width: puppet.params.declareString('width', '100%')
};


//
// Scheduling.
//

/**
 * Async id for Puppet iframe loads.
 * @private {?number}
 */
puppet.windowInitializedId_ = null;

/**
 * Type definition of a call to be executed. It includes the command to be
 * executed, the arguments to the command, and if they can be obtained,
 * the filename , source code line, and source code text of the call site.
 *
 * @typedef {{command: function(...) : *,
 *            args: !Array.<*>,
 *            file: ?string,
 *            line: ?number,
 *            code: ?string}}
 * @private
 */
puppet.QueuedCall_;

/**
 * The breakpoint id.
 *
 * @private {?number}
 */
puppet.pausedId_ = null;

/**
 * An command that waits indefinitely. This is used to create a breakpoint.
 * @private
 */
puppet.pause_ = function() {
  if (!puppet.executor_.isExecuting()) {
   return;
  }
  var originalTimeoutMs = puppet.executor_.getCommandTimeoutMs();
  puppet.executor_.setCommandTimeoutMs(0);
  puppet.pauseId_ = puppet.executor_.wait();
  puppet.executor_.setCommandTimeoutMs(originalTimeoutMs);
  puppet.state_.enterDebugMode();
};

/**
 * Resumes execution.
 * @private
 */
puppet.continue_ = function() {
  puppet.executor_.notify(puppet.pauseId_);
  puppet.pausedId_ = null;
  puppet.state_.leaveDebugMode();
};

/**
 * Queues a command to be executed.
 *
 * Calling run(command, arg1, arg2, ...) queues the call command(arg1,
 * arg2, ...) to be executed. If the return value of the call ===
 * false, then the command is retried after a wait period. The command
 * is continually retried until the return value !== false. Note that
 * a command that doesn't explicitly return has a return value of
 * undefined, which is !== false and, therefore, will not be retried.
 *
 * This function also inserts pause() based on ?cmds or ?lines.
 *
 * @param {(function(...) : *)=} command Command to be queued.
 * @param {...*} var_args Arguments to the function.
 */
function run(command, var_args) {
  puppet.assert(goog.isFunction(command), 'command not a function: ' + command);
  command = /** @type {function(...[?]) : *} */ (command); // For the compiler.
  var caller = puppet.currentSourceCallSite_();
  var args = goog.array.slice(arguments, 1);
  var commandIndex = puppet.state_.getCommandIndex();
  function runCommand() {
    puppet.elements.clearCache();
    var commandResult = command.apply(null, args) !== false;
    puppet.logging.maybeLogDebugMessages(commandResult);
    if (commandResult) {
      var isBreakpoint = caller.line &&
          goog.array.contains(puppet.PARAMS.lines, String(caller.line)) ||
          goog.array.contains(puppet.PARAMS.cmds, String(commandIndex));
      if (puppet.state_.isDebugMode() || isBreakpoint) {
        puppet.pause_();
      }
      return true;
    } else {
      return false;
    }
  }
  // Build the call info to be printed.
  var callInfo = [];

  // Print the filename if it has changed.
  if (caller.file && caller.file != puppet.lastCallFile_) {
    puppet.lastCallFile_ = caller.file;
    callInfo.push('-- in ' + caller.file + ':');
  }

  // Print the source code if we have it and, if not, print the evaluation
  // of the call. Print both if the verbose parameter is set.
  var line = caller.line ? ('line ' + caller.line) : '';
  var prefix = line + ': ';
  if (caller.code) {
    callInfo.push(prefix + goog.string.htmlEscape(caller.code));
    prefix = goog.string.repeat(' ', line.length) + '> ';
  }
  if (!caller.code || puppet.PARAMS.verbose) {
    callInfo.push(prefix + puppet.logging.toString(command) +
        '(' + puppet.logging.toString(args) + ')');
  }

  var commandString = callInfo.join('<br>');
  runCommand.toString = function() {
    return commandString;
  };

  puppet.executor_.enqueue(runCommand);
  puppet.state_.incrementCommandIndex();
}

/**
 * Gets the command timeout.
 *
 * @return {number} Seconds to wait before command timeout.
 */
puppet.getCommandTimeoutSecs = function() {
  return puppet.executor_.getCommandTimeoutMs() / 1000;
};

/**
 * Sets the command timeout.
 *
 * @param {number} timeoutSecs Seconds to wait before command timeout.
 */
puppet.setCommandTimeoutSecs = function(timeoutSecs) {
  puppet.executor_.setCommandTimeoutMs(timeoutSecs * 1000);
};

/**
 * Sets the command delay.
 *
 * @param {number} delayMs Milliseconds to wait before command execution.
 */
puppet.setDelayMs = function(delayMs) {
  puppet.executor_.setDelayMs(delayMs);
};

/**
 * Default milliseconds to wait before retrying a failed command.
 *
 * @const
 * @private {number}
 */
puppet.DEFAULT_RETRY_MS_ = 200;

/**
 * Sets the command retry delay. Defaults to 200 milliseconds in case of a value
 * less than or equal to zero.
 *
 * @param {number} retryMs Milliseconds to wait before retrying a failed
 *     command.
 */
puppet.setRetryMs = function(retryMs) {
  puppet.executor_.setRetryMs(retryMs > 0 ? retryMs : puppet.DEFAULT_RETRY_MS_);
};

/**
 * Puppet execution state.
 *
 * @private {!puppet.State}
 */
puppet.state_ = new puppet.State(puppet.PARAMS.step);

/**
 * The executor objects controls command execution.
 *
 * @private {!puppet.Executor}
 */
puppet.executor_ = new puppet.Executor(puppet.PARAMS.delay,
    puppet.DEFAULT_RETRY_MS_, puppet.PARAMS.timeout * 1000,
    puppet.PARAMS.verbose);

/**
 * The test case object that is used for xUnit style tests.
 *
 * @private {puppet.TestCase}
 */
puppet.testCase_ = null;

/**
 * Name of the file where the last call was made.
 *
 * @type {string}
 * @private
 */
puppet.lastCallFile_ = window.location.pathname.
    substr(window.location.pathname.lastIndexOf('\/') + 1);

//
// Commands.
//

/**
 * The synthetic keyboard used by action commands.
 *
 * @type {!bot.Keyboard}
 * @private
 */
puppet.keyboard_ = new bot.Keyboard();

/**
 * Returns the {@link bot.Keyboard} used by action commands.
 *
 * @return {!bot.Keyboard} Keyboard used by Puppet.
 */
puppet.keyboard = function() {
  return puppet.keyboard_;
};

/**
 * The synthetic mouse used by action commands.
 *
 * @type {!puppet.Mouse}
 * @private
 */
puppet.mouse_ = new puppet.Mouse();

/**
 * Returns the {@link puppet.Mouse} used by action commands.
 *
 * @return {!puppet.Mouse} Mouse used by Puppet.
 */
puppet.mouse = function() {
  return puppet.mouse_;
};

/**
 * The synthetic touchscreen used by action commands.
 *
 * @type {!puppet.Touchscreen}
 * @private
 */
puppet.touchscreen_ = new puppet.Touchscreen();

/**
 * Returns the {@link puppet.Touchscreen} used by action commands.
 *
 * @return {!puppet.Touchscreen} Touchscreen used by Puppet.
 */
puppet.touchscreen = function() {
  return puppet.touchscreen_;
};

/**
 * Converts the given URL to a relative URL with an absolute server path.
 * Absolute URLs are made relative, and relative server paths are resolved to
 * absolute paths using the provided window. Prints a warning if the given URL
 * leads off-site, because Puppet will effectively keep it on-site.
 *
 * @param {string} url A URL.
 * @param {!(Window|Node)} node Node for resolving relative server paths.
 * @return {string} A relative URL.
 * @private
 */
puppet.toRelativeUrl_ = function(url, node) {
  // If this is a Javascript link, just return it.
  if (url.indexOf('javascript:') == 0) {
    return url;
  }

  var win = goog.dom.getWindow(goog.dom.getOwnerDocument(node));
  var loc = new goog.Uri(win.location.href);
  var uri = new goog.Uri(url);

  // Convert absolute URLs into absolute server paths.
  if (uri.hasDomain()) {
    // If the url is off-site, warn that Puppet only considers the relative URL.
    if (uri.getScheme() != loc.getScheme() ||
        uri.getDomain() != loc.getDomain() ||
        uri.getPort() != loc.getPort()) {
      puppet.echo('WARNING: the following link leads off-site and Puppet ' +
                  'will only use the relative portion of the URL:<br>' + url);
    }

    // Make the uri relative and return the string representation.
    uri.setScheme('');
    uri.setDomain('');
    uri.setPort(null);
    return uri.toString();

  // Convert relative URLs into absolute server paths.
  } else if (uri.getPath().charAt(0) != '/') {
    var lastSlashIndex = loc.getPath().lastIndexOf('/');
    return lastSlashIndex == -1 ? '/' + url :
        loc.getPath().substr(0, lastSlashIndex + 1) + url;

  // Otherwise, the url is already an absolute server path, so return.
  } else {
    return url;
  }
};

/**
 * Use this command whenever a new page is to be loaded. If given a
 * URL, it loads the URL and waits until the document is loaded. If
 * given a command, it returns a new command that performs the given
 * command and then waits for a document to be loaded.
 *
 * @param {string|function(...) : *} urlOrCommand URL of the
 *     document to be loaded or a command to performed before the
 *     new document is loaded.
 * @return {undefined|function(...[*]) : *} If given a command, this
 *     is the new command that also waits for the page to load.
 */
function load(urlOrCommand) {
  if (typeof urlOrCommand == 'string') {
    var relativeUrl = puppet.appendLoadParams(
        puppet.toRelativeUrl_(urlOrCommand, window));
    puppet.echo('-- loading: ' + '<a href=' + relativeUrl + ' target=_blank>' +
                relativeUrl + '</a>');

    // If only the url fragment (hash) is changing, load the blank page first,
    // so that the new url is fully loaded anew. Use location.replace() to load
    // the new url so the blank page is replaced in the browser history.
    var loc = puppet.location();
    var currRelativeNoHash = loc.pathname + loc.search;
    var newRelativeNoHash = goog.uri.utils.removeFragment(relativeUrl);
    if (currRelativeNoHash == newRelativeNoHash) {
      waitForLoad(function() {
        waitForLoad();
        puppet.location().replace(relativeUrl);
      });
      loc.href = puppet.BLANK_PAGE_URL_;
    } else {
      waitForLoad();
      loc.href = relativeUrl;
    }
  } else {
    puppet.assert(typeof urlOrCommand == 'function');
    var ret = function(var_args) {
      waitForLoad();
      var commandReturn = urlOrCommand.apply(null, arguments);
      if (commandReturn) {
        puppet.echo('-- waiting for a new page to load ...');
      }
      return commandReturn;
    };
    ret.toString = function() {
      return 'load(' + urlOrCommand.toString() + ')';
    };
    return ret;
  }

  function waitForLoad(opt_fn) {
    var asyncLoadId = puppet.executor_.wait('Page load failed: did not' +
        ' complete within ' + puppet.executor_.getCommandTimeoutMs() / 1000 +
        ' seconds. The javascript console may have more details.');

    puppet.addOnLoad_(puppet.getFrame_() || bot.getWindow(), function() {
      // After the window has loaded, wait another cycle for the page to enter
      // the browser history, so tests that use the browser history work.
      window.setTimeout(function() {
        if (opt_fn) {
          opt_fn();
        }
        puppet.executor_.notify(asyncLoadId);
      }, 0);
    });
  };
}

/**
 * Reloads the current page and waits until the document is fully
 * loaded.
 */
function reload() {
  load(puppet.location().href);
}

/**
 * Go back in the browser history. The number of pages to go back can
 * optionally be specified and defaults to 1.
 *
 * @param {number=} opt_numPages Number of pages to go back.
 */
function back(opt_numPages) {
  bot.window.back(opt_numPages);
}

/**
 * Go forward in the browser history. The number of pages to go forward can
 * optionally be specified and defaults to 1.
 *
 * @param {number=} opt_numPages Number of pages to go forward.
 */
function forward(opt_numPages) {
  bot.window.forward(opt_numPages);
}

/**
 * Switches the window under test.
 *
 * @param {!Window} win The new window for command execution.
 */
var switchto = function(win) {
  puppet.elements.clearCache();
  bot.setWindow(win);
  puppet.initWindow();
};

/**
 * A helper function for defining a Puppet command. It accepts two arguments:
 * a boolean, indicating whether this is an "action" command that should,
 * therefore check whether the element is in an interactable state; and a
 * continuation function to run if all the command preconditions are satisfied.
 *
 * The returned command function accepts as a first argument a xpath string or
 * an element, and if a string, evaluates it to an element. If it does not
 * resolve, the command function returns false immediately. If the action
 * argument is true, it additionally checks whether the element is in an
 * "interactable" state, meaning it is shown to the user and not disabled.
 * If these checks all pass, it calls the continuation function with the
 * element, a description of the element, followed by whatever additional
 * arguments it was passed, and it coerses return values !== false, to true.
 *
 * @param {boolean} action Whether this is used for an action command.
 * @param {function(!Element, string, ...) : *} fn Continuation function.
 * @return {function((string|!Element), ...) : boolean} Command function.
 */
puppet.command = function(action, fn) {
  return function(pathOrElem, var_args) {
    var elem = puppet.elem(pathOrElem);
    var desc = puppet.logging.toString(elem || pathOrElem);
    if (!elem) {
      puppet.debug('XPath ' + desc + ' does not resolve to an element.');
    } else if (action && !bot.dom.isShown(elem, /* ignore opacity */ true)) {
      puppet.debug('Element ' + desc + ' is not shown.');
    } else if (action && !bot.dom.isEnabled(elem)) {
      puppet.debug('Element ' + desc + ' is not enabled.');
    } else {
      var args = goog.array.concat(elem, desc, goog.array.slice(arguments, 1));
      return (fn.apply(null, args) !== false);
    }
    return false;
  };
};

/**
 * Returns whether the element is present in the DOM.
 *
 * @param {string|!Element} pathOrElem Xpath or the target element.
 * @return {boolean} Whether the element is present in the DOM.
 */
var present = puppet.command(false, goog.nullFunction);

/**
 * Returns whether the element is shown to the user.
 *
 * @param {string|!Element} pathOrElem XPath or element.
 * @return {boolean} Whether the element is shown.
 */
var shown = puppet.command(false, function(elem, desc) {
  var b = bot.dom.isShown(elem);
  puppet.debug(desc + ' is' + (b ? '' : ' not') + ' shown');
  return b;
});

/**
 * Returns true iff the element has the given opacity.
 *
 * @param {string|!Element} pathOrElem XPath or element.
 * @param {number} value Minimum expected opacity of the element.
 * @param {number=} opt_max Maximum expected opacity of the element.
 *     If not provided, defaults to the minimum value.
 * @return {boolean} Whether the element's opacity is within the given bounds.
 */
var opacity = puppet.command(false, function(elem, desc, value, opt_max) {
  var max = opt_max === undefined ? value : opt_max;
  var o = bot.dom.getOpacity(elem);
  var b = (o >= value && o <= max);
  puppet.debug(desc + ' has opacity (' + o + ') ' + (b ? '' : 'not') +
               ' in expected range: (' + value + ' to ' + max + ')');
  return b;
});

/**
 * Returns the effective style of the element for the given property.
 * Returns null if the value is never specified.
 *
 * @param {!Element} elem Element.
 * @param {!string} key The style property.
 * @return {?string} Effective style or null if not specified.
 */
puppet.style = function(elem, key) {
  // If looking up the background color and the flash is on, turn the flash off
  // first, but remember to turn it on after getting the effective style.
  var flashOnAfter = (key == 'background-color' || key == 'backgroundColor') &&
      puppet.elements.flash(elem, false);
  var value = bot.dom.getEffectiveStyle(elem, key);
  if (flashOnAfter) {
    puppet.elements.flash(elem, true);
  }
  return value;
};

/**
 * Returns true iff the element is present and has a style attribute
 * with the given key/value pair.
 *
 * @param {string|!Element} pathOrElem XPath or element.
 * @param {string} key Key of the style.
 * @param {string|!RegExp} value Value of the style.
 * @return {boolean} Whether the element's style has the key/value.
 */
var style = puppet.command(false, function(elem, desc, key, value) {
  var s = puppet.style(elem, key);
  var b = goog.isDefAndNotNull(s) && puppet.matches(s, value);
  puppet.debug(desc + ' has ' + key + ' style value (' + s + ') ' +
               (b ? '' : 'not ') + 'matching expectation (' + value + ')');
  return b;
});

/**
 * Returns whether the element is present, has an attribute with the given name,
 * and if opt_value is given, whether it matches the actual attribute value. If
 * the value is a RegExp, tests the actual value matches the RegExp pattern.
 *
 * @param {string|!Element} pathOrElem XPath or element.
 * @param {string} name Name of the attribute.
 * @param {(string|!RegExp)=} opt_value Value of the attribute.
 * @return {boolean} Whether the element has the attribute.
 */
var attribute = puppet.command(false, function(elem, desc, name, opt_value) {
  var a = puppet.attribute(elem, name);
  if (goog.isNull(a)) {
    puppet.debug(desc + ' does not have ' + name + ' attribute');
    return false;
  } else if (!goog.isDef(opt_value)) {
    puppet.debug(desc + ' has ' + name + ' attribute');
    return true;
  } else {
    var b = puppet.matches(a, opt_value);
    puppet.debug(desc + ' has ' + name + ' attribute value (' + a + ') ' +
        (b ? '' : 'not ') + 'matching expectation (' + opt_value + ')');
    return b;
  }
});

/**
 * Returns the value for the attribute with the given name, or null if the
 * element does not have an attribute with that name.
 *
 * @param {!Element} elem Element.
 * @param {string} name Name of the attribute.
 * @return {?string} The attribute value.
 */
puppet.attribute = function(elem, name) {
  return bot.dom.getAttribute(elem, name);
};

/**
 * Returns whether the element is present, has a property with the given name,
 * and if opt_value is given, whether it matches the actual property value. If
 * the value is a RegExp, tests the actual value matches the RegExp pattern.
 *
 * @param {string|!Element} pathOrElem XPath or element.
 * @param {string} name Name of the property.
 * @param {*=} opt_value Value of the property.
 * @return {boolean} Whether the element has the property.
 */
var property = puppet.command(false, function(elem, desc, name, opt_value) {
  var p = puppet.property(elem, name);
  if (!goog.isDef(p)) {
    puppet.debug(desc + ' does not have ' + name + ' property');
    return false;
  } else if (!goog.isDef(opt_value)) {
    puppet.debug(desc + ' has ' + name + ' property');
    return true;
  } else {
    var b = opt_value instanceof RegExp ? opt_value.test(String(p)) :
        opt_value === p;
    puppet.debug(desc + ' has ' + name + ' property value (' + p + ') ' +
        (b ? '' : 'not ') + 'matching expectation (' + opt_value + ')');
    return b;
  }
});

/**
 * Returns the value for the given property name, undefined if the element does
 * not have a property with that name.
 *
 * @param {!Element} elem Element.
 * @param {string} name Name of the property.
 * @return {*} The property value.
 */
puppet.property = function(elem, name) {
  return bot.dom.getProperty(elem, name);
};

/**
 * Returns the element's visible text as the user would see it in the browser.
 *
 * @param {!Element} elem Element.
 * @return {string} The element's text.
 */
puppet.text = function(elem) {
  return bot.dom.isTextual(elem) ?
      (shown(elem) ? elem.value : '') :
      bot.dom.getVisibleText(elem);
};

/**
 * Returns true iff the element is present and has the given visible text.
 *
 * @param {string|!Element} pathOrElem XPath or element.
 * @param {string|!RegExp} value Text value.
 * @return {boolean} Whether the element has that text.
 */
var text = puppet.command(false, function(elem, desc, value) {
  var t = puppet.text(elem);
  var b = puppet.matches(t, value);
  puppet.debug(desc + ' has visible text (' + t + ') ' +
               (b ? '' : 'not ') + 'matching expectation (' + value + ')');
  return b;
});

/**
 * Returns whether the given element is selected. Throws an exception
 * if the element is not an option, checkbox, or radio button.
 *
 * @param {string|!Element} pathOrElem XPath or element.
 * @return {boolean} Whether the element is selected.
 */
var selected = puppet.command(false, function(elem, desc) {
  var b = bot.dom.isSelected(elem);
  puppet.debug(desc + ' is ' + (b ? '' : 'not ') + 'selected');
  return b;
});

/**
 * Matches a string against another string or regular expression.
 *
 * If the pattern is a string, uses '==='; if it is a regular
 * expression, uses RegExp.test().
 *
 * @param {string} str String to be matched.
 * @param {string|!RegExp} pattern Regular expression pattern.
 * @return {boolean} Whether the string matches the pattern.
 */
puppet.matches = function(str, pattern) {
  return pattern instanceof RegExp ? pattern.test(str) : str === pattern;
};

/**
 * Matches a string against a regular expression and, if it matches,
 * returns the substring that matches the first parenthesized
 * expression in the pattern.
 *
 * @param {string} str String to be matched.
 * @param {!RegExp} pattern Regular expression pattern.
 * @return {?string} The matched subtring, or null if no match.
 */
puppet.match = function(str, pattern) {
  var match = pattern.exec(str);
  return match ? match[1] : null;
};

/**
 * Returns true iff the element is shown, and if it is, clears the user input
 * from the element. If the element contains text, clears the text. If it is
 * a selected checkbox, clicks it to deselect it.
 *
 * @param {string|!Element} pathOrElem XPath or element to clear.
 * @return {boolean} Whether the element is shown.
 */
var clear = puppet.command(true, function(elem, desc) {
  if (bot.dom.isTextual(elem)) {
    bot.action.clear(elem);
  } else if (bot.dom.isElement(elem, goog.dom.TagName.INPUT) &&
             elem.type.toLowerCase() == 'checkbox') {
    if (bot.dom.isSelected(elem)) {
      bot.action.click(elem, null, puppet.mouse_.getBotMouse());
    }
  } else {
    puppet.logging.error('Element cannot be cleared: ' +
                         puppet.logging.toString(elem));
  }
});

/**
 * Maps closure goog.events.KeyCodes values to bot.Keyboard.Key values.
 * There is a close to 1:1 correspondence in the name of the enum value
 * (thus the forEach loop), with a few exceptions listed explicitly.
 *
 * TODO(user): Replace all calls to type() that provide number keycodes
 * with instances of key.Keyboard.Key instead, then remove this map.
 *
 * @type {!Object.<number, !bot.Keyboard.Key>}
 * @private
 */
puppet.CLOSURE_KEYCODE_TO_KEY_ = (function() {
  var codeToKey = {};
  goog.object.forEach(bot.Keyboard.Keys, function(key, name) {
    if (name in goog.events.KeyCodes) {
      codeToKey[goog.events.KeyCodes[name]] = key;
    }
  });
  codeToKey[goog.events.KeyCodes.CTRL] = bot.Keyboard.Keys.CONTROL;
  codeToKey[goog.events.KeyCodes.MAC_FF_META] = bot.Keyboard.Keys.META;
  codeToKey[goog.events.KeyCodes.NUMLOCK] = bot.Keyboard.Keys.NUM_LOCK;
  codeToKey[goog.events.KeyCodes.OPEN_SQUARE_BRACKET] =
      bot.Keyboard.Keys.OPEN_BRACKET;
  codeToKey[goog.events.KeyCodes.CLOSE_SQUARE_BRACKET] =
      bot.Keyboard.Keys.CLOSE_BRACKET;
  codeToKey[goog.events.KeyCodes.WIN_KEY] = bot.Keyboard.Keys.META;
  codeToKey[goog.events.KeyCodes.WIN_KEY_RIGHT] = bot.Keyboard.Keys.META_RIGHT;
  return codeToKey;
})();

/**
 * Types a string, presses a key or key sequence to an element and
 * returns true iff the element is shown.
 *
 * The parameters after the element can be:
 * 1. A string, like:
 *    run(type, textbox, 'abc')
 * 2. A key code to be pressed, like:
 *    run(type, textbox, goog.events.KeyCodes.ENTER)
 * 3. An array of strings or keycodes, like:
 *    run(type, textbox, ['a', goog.events.KeyCodes.ENTER, 'b'])
 * 4. A variable number of any of the above, like:
 *    run(type, textbox, 'a', goog.events.KeyCodes.ENTER, ['b', 'c'])
 *
 * @param {string|!Element} pathOrElem XPath or element.
 * @param {...(string|bot.Keyboard.Key|!Array.<string|bot.Keyboard.Key>)
 *     } var_args The values to type into element.
 * @return {boolean} Whether the element is shown.
 */
var type = puppet.command(true, function(elem, desc, var_args) {
  var values = goog.array.slice(arguments, 2);
  var flattenedValues = goog.array.flatten(values);
  flattenedValues = goog.array.map(flattenedValues, function(v) {
    return goog.isNumber(v) ? puppet.CLOSURE_KEYCODE_TO_KEY_[v] : v;
  });
  bot.action.type(elem, flattenedValues, puppet.keyboard_);
});

/**
 * Returns true iff the element is shown, and if it is, moves the mouse to
 * the element, over the optional x and y coordinates relative to the element.
 *
 * @param {string|!Element} pathOrElem XPath or element to move the mouse to.
 * @param {number=} opt_x The x coordinate relative to the element.
 * @param {number=} opt_y The y coordinate relative to the element.
 * @return {boolean} Whether the element is shown.
 */
var movemouse = puppet.command(true, function(elem, desc, opt_x, opt_y) {
  if (puppet.userAgent.isMobile()) {
    puppet.logging.error('no movemouse on a mobile browser');
  }
  var coord = puppet.coordFromOptXY_(opt_x, opt_y);
  bot.action.moveMouse(elem, coord, puppet.mouse_.getBotMouse());
});

/**
 * The click and drag commands will issue touch actions on mobile devices. This
 * variable will force mouse actions instead of touch actions on mobile devices.
 *
 * @type {boolean}
 * @private
 */
puppet.forceMouseActions_ = false;

/**
 * By default, the click and drag commands will issue touch actions (tap and
 * swipe, respectively) when the test runs on a touch device. If mouse actions
 * are desired for click and drag, even when on a touch device, call this
 * function with true.
 *
 * @param {boolean} forceMouseActions Whether to always use mouse actions for
 *     click and drag commands.
 */
puppet.setForceMouseActions = function(forceMouseActions) {
  puppet.forceMouseActions_ = forceMouseActions;
};

/**
 * Rewrite the target URL of an ancestor link or form to be relative.
 *
 * @param {!Element} elem Element.
 * @private
 */
puppet.maybeRewriteTargetUrlOnSite_ = function(elem) {
  var target = /**@type {Element}*/(goog.dom.getAncestor(elem, function(e) {
    return bot.dom.isElement(e, goog.dom.TagName.A) ||
           bot.dom.isElement(e, goog.dom.TagName.FORM);
  }, true));

  if (target && target.tagName == goog.dom.TagName.A && target.href) {
    target.href = puppet.toRelativeUrl_(target.href, target);
  } else if (target && target.tagName == goog.dom.TagName.FORM &&
             target.action) {
    target.action = puppet.toRelativeUrl_(target.action, target);
  }
};

/**
 * Returns true iff the element is shown, and if it is clicks an element at the
 * optional x and y client coordinates, relative to the element. If this click
 * has a target URL, ensure the link is relative so it won't go off-site.
 *
 * @param {string|!Element} pathOrElem XPath or element to click.
 * @param {number=} opt_x The x coordinate relative to the element.
 * @param {number=} opt_y The y coordinate relative to the element.
 * @return {boolean} Whether the element is shown.
 */
var click = puppet.command(true, function(elem, desc, opt_x, opt_y) {
  puppet.maybeRewriteTargetUrlOnSite_(elem);
  var coord = puppet.coordFromOptXY_(opt_x, opt_y);
  if (puppet.userAgent.isMobile() && !puppet.forceMouseActions_) {
    bot.action.tap(elem, coord, puppet.touchscreen_.getBotTouchscreen());
  } else {
    bot.action.click(elem, coord, puppet.mouse_.getBotMouse());
  }
});

/**
 * Returns true iff the element is shown, and if it is taps an element at the
 * optional x and y client coordinates, relative to the element. If this tap
 * has a target URL, ensure the link is relative so it won't go off-site.
 *
 * @param {string|!Element} pathOrElem XPath or element to tap.
 * @param {number=} opt_x The x coordinate relative to the element.
 * @param {number=} opt_y The y coordinate relative to the element.
 * @return {boolean} Whether the element is shown.
 */
var tap = puppet.command(true, function(elem, desc, opt_x, opt_y) {
  puppet.maybeRewriteTargetUrlOnSite_(elem);
  var coord = puppet.coordFromOptXY_(opt_x, opt_y);
  bot.action.tap(elem, coord, puppet.touchscreen_.getBotTouchscreen());
});

/**
 * Returns true iff the element is shown, and if it is right-clicks an element
 * at the optional x and y client coordinates, relative to the element.
 *
 * @param {string|!Element} pathOrElem XPath or element to right-click.
 * @param {number=} opt_x The x coordinate relative to the element.
 * @param {number=} opt_y The y coordinate relative to the element.
 * @return {boolean} Whether the element is shown.
 */
var rightclick = puppet.command(true, function(elem, desc, opt_x, opt_y) {
  if (puppet.userAgent.isMobile()) {
    puppet.logging.error('no rightclick on a mobile browser');
  }
  var coord = puppet.coordFromOptXY_(opt_x, opt_y);
  bot.action.rightClick(elem, coord, puppet.mouse_.getBotMouse());
});

/**
 * Returns true iff the element is shown, and if it is double-clicks an element
 * at the optional x and y client coordinates, relative to the element.
 *
 * @param {string|!Element} pathOrElem XPath or element to double-click.
 * @param {number=} opt_x The x coordinate relative to the element.
 * @param {number=} opt_y The y coordinate relative to the element.
 * @return {boolean} Whether the element is shown.
 */
var doubleclick = puppet.command(true, function(elem, desc, opt_x, opt_y) {
  var coord = puppet.coordFromOptXY_(opt_x, opt_y);
  if (puppet.userAgent.isMobile()) {
    bot.action.tap(elem, coord);
    bot.action.tap(elem, coord);
  } else {
    bot.action.doubleClick(elem, coord, puppet.mouse_.getBotMouse());
  }
});

/**
 * Returns true iff the element is shown, and if it is, scrolls the mouse wheel
 * by the specified number of ticks on the element at the optional x and y
 * coordinates relative to the element. A positive number of ticks scrolls
 * downward and a negative number scrolls upward.
 *
 * @param {string|!Element} pathOrElem XPath or element to move the mouse to.
 * @param {number} ticks The number of ticks to scroll the mouse wheel.
 * @param {number=} opt_x The x coordinate relative to the element.
 * @param {number=} opt_y The y coordinate relative to the element.
 * @return {boolean} Whether the element is shown.
 */
var scrollmouse = puppet.command(true,
    function(elem, desc, ticks, opt_x, opt_y) {
      if (puppet.userAgent.isMobile()) {
        puppet.logging.error('no scrollmouse on a mobile browser');
      }
      var coord = puppet.coordFromOptXY_(opt_x, opt_y);
      bot.action.scrollMouse(elem, ticks, coord, puppet.mouse_.getBotMouse());
    });

/**
 * Converts optional x and y values to a coordinate or null. Signals an error if
 * an x coordinate is provided and not a y coordinate.
 *
 * @param {number=} opt_x Optional x coordinate.
 * @param {number=} opt_y Optional y coordinate.
 * @return {goog.math.Coordinate} Coordinate or null.
 * @private
 */
puppet.coordFromOptXY_ = function(opt_x, opt_y) {
  if (goog.isDef(opt_x) && goog.isDef(opt_y)) {
    return new goog.math.Coordinate(opt_x, opt_y);
  } else if (goog.isDef(opt_x)) {
    puppet.logging.error('x coordinate provided but no y coordinate');
  }
  return null;
};

/**
 * Returns true if the element is shown, and if it is follow's the link of the
 * given anchor element.
 *
 * Do not use follow() to simulate left-clicking a link: use click()
 * instead. Use follow() only to simulate opening a link in a new
 * window/tab.
 *
 * @param {string|!Element} pathOrElem XPath or element to follow.
 * @return {boolean} Whether the element is shown.
 */
var follow = puppet.command(true, function(elem, desc) {
  var link = elem.href;
  puppet.assert(link, 'elem has no href property');
  puppet.location().href = puppet.toRelativeUrl_(link, elem);
});

/**
 * Returns true iff the element is shown, and if it is, fires a mouse event to
 * the element at the optional x and y coordinates, relative to the element.
 *
 * No action if the element is null (to make it easier to trigger
 * multiple mouse events in sequence).
 *
 * @param {string|!Element} pathOrElem XPath or element.
 * @param {string} type event type.
 * @param {number=} opt_x The x coordinate relative to the element.
 * @param {number=} opt_y The y coordinate relative to the element.
 * @param {number=} opt_button The mouse button based on the DOM Level 2 event
 *     model: 0 = left, 1 = middle, 2 = right.
 * @param {number=} opt_detail The scrollwheel amount.
 * @return {boolean} Whether the element is shown.
 */
var mouse = puppet.command(true,
    function(elem, desc, type, opt_x, opt_y, opt_button, opt_detail) {
      if (puppet.userAgent.isMobile()) {
        var x = opt_x || 0;
        var y = opt_y || 0;
        switch (type) {
          case 'mousedown':
            puppet.touch_(elem, bot.events.EventType.TOUCHSTART, x, y);
            return;
          case 'mousemove':
            puppet.touch_(elem, bot.events.EventType.TOUCHMOVE, x, y);
            return;
          case 'mouseup':
            puppet.touch_(elem, bot.events.EventType.TOUCHEND, x, y);
            return;
        }
      }

      var clientRect = bot.dom.getClientRect(elem);
      var eventType;
      if (type == 'click') {
        eventType = bot.events.EventType.CLICK;
      } else if (type == 'contextmenu') {
        eventType = bot.events.EventType.CONTEXTMENU;
      } else if (type == 'dblclick') {
        eventType = bot.events.EventType.DBLCLICK;
      } else if (type == 'mousedown') {
        eventType = bot.events.EventType.MOUSEDOWN;
      } else if (type == 'mousemove') {
        eventType = bot.events.EventType.MOUSEMOVE;
      } else if (type == 'mouseout') {
        eventType = bot.events.EventType.MOUSEOUT;
      } else if (type == 'mouseover') {
        eventType = bot.events.EventType.MOUSEOVER;
      } else if (type == 'mouseup') {
        eventType = bot.events.EventType.MOUSEUP;
      } else if (type == 'mousewheel' || type == 'DOMMouseScroll') {
        eventType = bot.events.EventType.MOUSEWHEEL;
      } else if (type == 'MozMousePixelScroll') {
        eventType = bot.events.EventType.MOUSEPIXELSCROLL;
      } else {
        throw 'Event type not supported by mouse()';
      }

      bot.events.fire(elem, eventType, {
        clientX: clientRect.left + (opt_x || 0),
        clientY: clientRect.top + (opt_y || 0),
        button: puppet.mouseButton_(type, opt_button || 0),
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        wheelDelta: opt_detail || 0,
        relatedTarget: null
      });
    });

/**
 * Gets the effective offset from the left of an element.
 *
 * @param {!Element} elem Element.
 * @return {number} offset.
 * @deprecated Use puppet.clientRect instead.
 */
puppet.left = function(elem) {
  return elem.offsetParent ?
      elem.offsetLeft + puppet.left(elem.offsetParent) : elem.offsetLeft;
};

/**
 * Gets the effective offset from the top of an element.
 *
 * @param {!Element} elem Element.
 * @return {number} Offset from the top of the element.
 * @deprecated Use puppet.clientRect instead.
 */
puppet.top = function(elem) {
  return elem.offsetParent ?
      elem.offsetTop + puppet.top(elem.offsetParent) : elem.offsetTop;
};

/**
 * Gets the client rectange of a DOM element relative to the client viewport.
 *
 * @param {!Element} elem Element.
 * @return {{height: number, left: number, top: number, width: number}} The
 *     client rectangle of the element relative to the client viewport.
 */
puppet.clientRect = function(elem) {
  var rect = bot.dom.getClientRect(elem);
  return {
    'height': rect.height,
    'left': rect.left,
    'top': rect.top,
    'width': rect.width
  };
};

/**
 * Given an event type and a mouse button, DOM Level 2 mouse button number,
 * returns the mouse button value used for that event on the current browser.
 *
 * Mouseup and mousedown events always specify the mouse button of the event;
 * whether other mouse events specify the button is browser-dependent. When
 * they don't specify, the mouse button number defaults to zero.
 *
 * Internet Explorer numbers mouse buttons differently than browsers supporting
 * the DOM Level 2 event model.
 *
 * DOM Level 2 |  IE |  Mouse button
 * ---------------------------------
 *       0     |  1  |  Left
 *       1     |  4  |  Middle
 *       2     |  2  |  Right
 *
 * NOTE(user): Right now, Puppet tests only deal with events
 * involving one button at a time. If we need to deal with multiple
 * buttons at a time, keep in mind that DOM Level 2 and IE treat these
 * events differently. DOM Level 2 browsers will only indicate one
 * button per event fired, while IE will add the button numbers
 * together (hence the numbering system: 1, 2, 4).
 *
 * @private
 * @param {string} eventType Type of mouse event.
 * @param {number} button The mouse button number under the DOM Level
 *     2 event model.
 * @return {number} The mouse button number equivalent for the current browser.
 */
puppet.mouseButton_ = function(eventType, button) {
  // Firefox and Opera provide the mouse numbers on mouse{down, up}.
  if (puppet.userAgent.isFirefox() || puppet.userAgent.isOpera()) {
    if (eventType == 'mousedown' || eventType == 'mouseup') {
      return button;
    }
  }

  // IE provides mouse numbers on mouse{down, up, move}, see:
  // http://msdn.microsoft.com/en-us/library/ms533544(v=vs.85).aspx
  else if (puppet.userAgent.isIE()) {
    if (eventType == 'mousedown' ||
        eventType == 'mouseup' ||
        eventType == 'mousemove') {
      switch (button) {
        case 0:
          return 1;
        case 1:
          return 4;
        case 2:
          return 2;
      }
    }
  }

  // WebKit provides mouse numbers on mouse{down, up, over, out, move}.
  else if (puppet.userAgent.isWebKit()) {
    if (eventType == 'mousedown' || eventType == 'mouseup' ||
        eventType == 'mouseover' || eventType == 'mouseout' ||
        eventType == 'mousemove') {
      return button;
    }
  }

  return 0;
};

/**
 * Returns true if the element is shown, and if it is, drags the
 * element by (dx, dy).
 *
 * @param {string|!Element} pathOrElem XPath or element.
 * @param {number} dx increment in x coordinate.
 * @param {number} dy increment in y coordinate.
 * @param {number=} opt_x The x coordinate relative to the element.
 * @param {number=} opt_y The y coordinate relative to the element.
 * @param {number=} opt_steps The number of steps that should occur as part of
 *     the drag, default is 2.
 * @return {boolean} Whether the element is shown.
 */
var drag = puppet.command(true, function(elem, desc, dx, dy, opt_x, opt_y,
    opt_steps) {
  var coord = new goog.math.Coordinate(opt_x || 0, opt_y || 0);
  if (puppet.userAgent.isMobile() && !puppet.forceMouseActions_) {
    bot.action.swipe(elem, dx, dy, opt_steps, coord,
        puppet.touchscreen_.getBotTouchscreen());
  } else {
    bot.action.drag(elem, dx, dy, opt_steps, coord,
        puppet.mouse_.getBotMouse());
  }
});

/**
 * Returns true if the element is shown, and if it is, swipes the element by
 * (dx, dy).
 *
 * @param {string|!Element} pathOrElem XPath or element.
 * @param {number} dx increment in x coordinate.
 * @param {number} dy increment in y coordinate.
 * @param {number=} opt_x The x coordinate relative to the element.
 * @param {number=} opt_y The y coordinate relative to the element.
 * @param {number=} opt_steps The number of steps that should occur as part of
 *     the swipe, default is 2.
 * @return {boolean} Whether the element is shown.
 */
var swipe = puppet.command(true, function(elem, desc, dx, dy, opt_x, opt_y,
     opt_steps) {
  var coord = new goog.math.Coordinate(opt_x || 0, opt_y || 0);
  bot.action.swipe(elem, dx, dy, opt_steps, coord,
      puppet.touchscreen_.getBotTouchscreen());
});

/**
 * Returns true if the element is shown, and if it is, inputs a value
 * to the given text or password input element or textarea.
 *
 * @param {string|!Element} pathOrElem XPath or element.
 * @param {string} value Value to be inputted.
 * @return {boolean} Whether the element is shown.
 * @deprecated Use type or clear instead.
 */
var input = puppet.command(true, function(elem, desc, value) {
  puppet.input_(elem, value);
});

/**
 * Inputs a value to a text input, password input, or textarea.
 *
 * @param {!Element} elem Text input, password input, or textarea.
 * @param {string} value Value to input.
 * @private
 */
puppet.input_ = function(elem, value) {
  puppet.assert(bot.dom.isTextual(elem),
      'element not a text input, password input, or textarea');
  if (elem.value != value) {
    elem.value = value;
    bot.events.fire(elem, bot.events.EventType.CHANGE);
  }
};

/**
 * Returns true if the element is shown, and if it is, selects the
 * given option element, checkbox, or radio button.
 *
 * @param {string|!Element} pathOrElem XPath or element.
 * @return {boolean} Whether the element is shown.
 * @deprecated Use click() instead.
 */
var select = puppet.command(true, function(elem, desc) {
  if (!bot.dom.isSelected(elem)) {
    bot.action.click(elem, null, puppet.mouse_.getBotMouse());
  }
});

/**
 * Focuses on the given element if it is not already the active element. If
 * a focus change is required, the active element will be blurred before
 * focusing on the given element.
 *
 * @param {!Element} elem The element to focus on.
 */
puppet.focus = function(elem) {
  bot.action.focusOnElement(elem);
};

/**
 * Returns true if the element is shown, and if it is, focuses it.
 *
 * @param {string|!Element} pathOrElem XPath or element.
 * @return {boolean} Whether the element is shown.
 */
var focus = puppet.command(true, function(elem, desc) {
  puppet.focus(elem);
});

/**
 * Returns true if the element is shown, and if it is, blurs it.
 *
 * @param {string|!Element} pathOrElem XPath or element.
 * @return {boolean} Whether the element is shown.
 */
var blur = puppet.command(true, function(elem, desc) {
  elem.blur();
  // Calling blur() not sufficient when the tab is not in foregroud.
  bot.events.fire(elem, bot.events.EventType.BLUR);
});

/**
 * Returns a multi-element command that returns true iff the specified
 * number of elements matching an xpath satisfy the given command.
 *
 * The multi-element commands accepts an xpath and a variable number
 * of arguments and returns true if the number of elements that both
 * match the xpath and satisfy the command applied to those
 * arguments is in the given range.
 *
 * If the opt_max is not provided, it defaults to num. If it is
 * provided, but null, there is no maximum number. Examples:
 * - run(count(shown, 3) '//a');
 * waits until exactly 3 'a' elements are shown on the page
 * - run(count(shown, 3, 5), '//a');
 * waits until between 3 and 5 (inclusive) a's are shown on the page
 * - run(count(shown, 0, 3), '//a');
 * waits until 3 or less a's are shown on the page
 * - run(count(shown, 3, null), '//a');
 * waits until 3 or more a's are shown on the page
 *
 * @param {function((string|!Element), ...) : *} command
 *     Single-element command.
 * @param {number} num Minimum number of times the command is expected
 *     to not return false.
 * @param {?number=} opt_max Maximum number of times the command is
 *     expected to not return false. If not provided, defaults to
 *     opt_min. If provided but null, there is no maximum limit.
 * @return {function((string|!Array.<!Element>), ...[*]) : boolean}
 *     Multi-element command.
 */
function count(command, num, opt_max) {
  var max = opt_max === undefined ? num : opt_max;
  return function(pathOrElems, var_args) {
    var elems = puppet.elems(pathOrElems);
    var args = goog.array.concat(null, goog.array.slice(arguments, 1));
    var n = 0;
    for (var i = 0; i < elems.length; i++) {
      args[0] = elems[i];
      if (command.apply(null, args) !== false) n++;
    }
    puppet.debug('Counted ' + n + ', expected ' + num +
        (max !== null && max > num ? ' to ' + max : '') +
        (max === null ? ' or more' : ''));
    return n >= num && (max === null || n <= max);
  };
}

/**
 * Returns a multi-element command that is true if all elements that
 * match an xpath satisfy the given command.
 *
 * The multi-element command accepts an xpath and a variable number
 * of arguments and returns true if all elements that match the xpath
 * satisfy the command applied to those arguments.
 *
 * Example:
 * - run(all(text), '//a', 'hello');
 * waits until all 'a' elements have text equal to 'hello'
 *
 * @param {function((string|!Element), ...) : *} command
 *     Single-element command.
 * @return {function((string|!Array.<!Element>), ...[*]) : boolean}
 *     Multi-element command.
 */
function all(command) {
  return function(pathOrElems, var_args) {
    var elems = puppet.elems(pathOrElems);
    var args = goog.array.concat(null, goog.array.slice(arguments, 1));
    for (var i = 0; i < elems.length; i++) {
      args[0] = elems[i];
      if (command.apply(null, args) === false) return false;
    }
    return true;
  };
}

/**
 * Returns a multi-element command that is true if there exists an
 * element that matches an xpath that satisfied the given command.
 *
 * The multi-element command accepts an xpath and a variable number
 * of arguments and returns true if an element that matches the xpath
 * satisfies the command applied to those arguments.
 *
 * Example:
 * - run(some(text), '//a', 'hello');
 * waits until some 'a' element has text equal to 'hello'
 *
 * @param {function((string|!Element), ...) : *} command
 *     Single-element command.
 * @return {function((string|!Array.<!Element>), ...[*]) : boolean}
 *     Multi-element command.
 */
function some(command) {
  return function(pathOrElems, var_args) {
    var elems = puppet.elems(pathOrElems);
    var args = goog.array.concat(null, goog.array.slice(arguments, 1));
    for (var i = 0; i < elems.length; i++) {
      args[0] = elems[i];
      if (command.apply(null, args) !== false) return true;
    }
    return false;
  };
}

/**
 * Returns a multi-element command that is true if none of the
 * elements that match an xpath satisfy the given predicate.
 *
 * The multi-element command accepts an xpath and a variable number
 * of arguments and returns true if none of the elements that match
 * the xpath satisfy the predicate applied to those arguments.
 *
 * Example:
 * - run(none(text), '//a', 'hello');
 * waits until none of the 'a' elements has text equal to 'hello'
 *
 * @param {function((string|!Element), ...) : *} command
 *     Single-element command.
 * @return {function((string|!Array.<!Element>), ...[*]) : boolean}
 *     Multi-element command.
 */
function none(command) {
  var ret = function(pathOrElems, var_args) {
    var elems = puppet.elems(pathOrElems);
    var args = goog.array.concat(null, goog.array.slice(arguments, 1));
    for (var i = 0; i < elems.length; i++) {
      args[0] = elems[i];
      if (command.apply(null, args) !== false) return false;
    }
    return true;
  };
  ret.toString = function() {
    return 'none(' + command.toString() + ')';
  };
  return ret;
}

/**
 * Negates the given command.
 *
 * @param {function(...) : *} command Command.
 * @return {function(...[*]) : boolean} Negated command.
 */
function not(command) {
  var ret = function(var_args) {
    return command.apply(null, arguments) === false;
  };
  ret.toString = function() {
    return 'not(' + command.toString() + ')';
  };
  return ret;
}

/**
 * Stops the test execution, skipping the rest of the commands.
 *
 * Useful for disabling parts of tests that require certain browsers
 * or operating systems.
 */
function stop() {
  var params = window.location.search;
  if (params && (/[?&]nostop\b/.test(params))) {
    puppet.echo('stop is skipped due to ?nostop in URL.');
    return;
  }
  puppet.echo('stopping test execution');
  var url = window.location.href;
  if (url) {
    puppet.echo('-- use [?&]nostop in URL to override.');
    // http://code.google.com/p/closure-library/issues/detail?id=322,
    // see the bug for why we need to html escape the url.
    puppet.echo('-- use <a href=' +
        goog.string.htmlEscape(url + (url.indexOf('?') > 0 ? '&' : '?') +
                               'nostop') +
        '>?nostop</a> in URL to override.');
    puppet.executor_.stop();
  }
}

/**
 * Sleeps the test execution for the specified number of seconds.
 *
 * Please avoid using this command if at all possible. It should be
 * used only as a last resort, when waiting for any other changes on
 * the page does not suffice. It is better to add hooks into the page
 * being tested that a test can wait for than to use sleep commands.
 *
 * This command has no effect if the execution is paused.
 *
 * @param {number} sec Number of seconds to sleep.
 */
function sleep(sec) {
  if (puppet.state_.isDebugMode()) {
    puppet.echo('sleep() is skipped due to stepping.');
    return;
  }

  var asyncSleepId = puppet.executor_.wait();
  window.setTimeout(function() {
    puppet.executor_.notify(asyncSleepId);
  }, sec * 1000);
}

/**
 * Responds to prompt/confirm/alert dialog boxes. Given a command, returns a new
 * command that performs the new command and waits for a dialog box to appear.
 * When the dialog appears, responds to it with the given response value.
 *
 * <p>A 'prompt' dialog must be given a response of type string, a 'confirm'
 * dialog must be given a response of type boolean, and for an 'alert' dialog,
 * a response type must not be provided.
 *
 * <p>Note that the dialog() function will not work when the page under test
 * aliases and calls its window's alert, confirm, or prompt functions. Example
 * code in a page under test in which the dialog() function will not work:
 * <pre>
 *   var x = window.alert;
 *   x('Hello, world!');
 * </pre>
 * If Puppet's setup phase has not stubbed out the function prior to the alias
 * assignment, then the invocation of x will cause a dialog to appear, and the
 * test will hang and fail when it eventually reaches the whole test timeout.
 * If Puppet's setup phase has stubbed out the function, this dialog() command
 * will nevertheless be unable to set an expectation that an alert will appear,
 * and the invocation of x will fail immediately due to an "unexpected" dialog.
 * If x is accessible from the page's window object, both problems can be
 * avoided if the test stubs out x itself before the page invokes it.
 *
 * @param {function(...):*} command Command expected to trigger the dialog box.
 * @param {(string|boolean)=} opt_response Response to the dialog box.
 * @param {(string|!RegExp)=} opt_message Value to match against dialog message.
 * @return {function(...):*} Command that also expects a dialog box.
 */
function dialog(command, opt_response, opt_message) {
  var savedDialogFunction, dialogAsyncId;
  var dialogType = !goog.isDef(opt_response) ? 'alert' :
      (goog.isBoolean(opt_response) ? 'confirm' : 'prompt');
  function cleanupDialogHandlers() {
    puppet.window()[dialogType] = savedDialogFunction;
    puppet.executor_.notify(dialogAsyncId);
  }

  var ret = function(var_args) {
    savedDialogFunction = puppet.window()[dialogType];
    puppet.window()[dialogType] = function(msg) {
      if (opt_message) {
        puppet.assert(puppet.matches(msg, opt_message));
      }
      cleanupDialogHandlers();
      return opt_response;
    };
    dialogAsyncId = puppet.executor_.wait(
        'expected ' + dialogType + ' dialog never appeared');
    var commandReturn = command.apply(null, arguments);
    if (commandReturn !== false) {
      puppet.echo('-- waiting for a ' + dialogType + ' dialog ...');
    } else {
      cleanupDialogHandlers();
    }
    return commandReturn;
  };
  ret.toString = function() {
    return 'dialog(' + command.toString() + ')';
  };
  return ret;
}

/**
 * Setup the dialog handlers.
 *
 * @private
 */
puppet.setupDialogs_ = function() {

  function setDialogFunctionToError(dialogType) {
    var win = puppet.window();
    var originalFunc = win[dialogType];
    // Don't overwrite the dialog if it has already been overwritten.
    if (bot.userAgent.IE_DOC_PRE10 || goog.userAgent.OPERA ||
        (goog.userAgent.product.ANDROID &&
         !bot.userAgent.isProductVersion(4))) {
      var functionRe = new RegExp('\s*function ' + dialogType +
                                  '\(\).*\[native code\]');
      if (!functionRe.test(String(originalFunc))) {
        return;
      }
    } else {
      var prototypeFunc = win.constructor && win.constructor.prototype &&
          win.constructor.prototype[dialogType];
      if (prototypeFunc && originalFunc != prototypeFunc) {
        return;
      }
    }
    win[dialogType] = function(message) {
      if (puppet.state_.isFinished()) {
        return originalFunc(message);
      }
      puppet.logging.error('Unexpected ' + dialogType +
                           ' dialog with message "' + message + '"');
    };
  }

  // Set the alert, confirm, and prompt dialogs to produce an error by default.
  // The user must use the dialog() function to override this behavior.
  setDialogFunctionToError('alert');
  setDialogFunctionToError('confirm');
  setDialogFunctionToError('prompt');

  // Disable print dialog boxes.
  puppet.window().print = function() {};
};


//
// Utilities.
//

// Called when an error occur during assert.
puppet.logging.setErrorListener(function() {
  // Throws exception and stops the test, called when assert function fails.
  var stack = webdriver.stacktrace.get().join('<br>');
  puppet.done_(stack);
  throw stack;
});

// Echo HTML to the Puppet log and text to the puppet.report_ variable.
puppet.logging.addLogListener(function(html, text) {
  puppet.console_.appendLogLine(html);
  puppet.report_ += text;
});

// Echo text to the Unix terminal for Firefox, if available.
if (window.dump) {
  puppet.logging.addLogListener(function(html, text) {
    window.dump(text);
  });
}

/**
 * Echos a string to the command log. If the argument is a string, it
 * is expected to be HTML, with proper character escaping and may
 * include links and other HTML text formatting.
 *
 * This function also echos to the Firebug console if it's available,
 * and to the standard output of the Unix terminal for Firefox if the
 * browser.dom.window.dump.enabled is set to true in about:config.
 *
 * @param {*} x Anything, but assumes strings are HTML.
 */
puppet.echo = function(x) {
  var flashWasOn = false;
  if (goog.typeOf(x) == 'object' && x.nodeType && x.tagName) {
    flashWasOn = puppet.elements.flash(/** @type {!Element} */ (x), false);
  }

  puppet.logging.log(x);

  if (flashWasOn) {
    puppet.elements.flash(/** @type {!Element} */ (x), true);
  }
};

/**
 * Asserts a value is true. Evaluates !value and throws an exception
 * and stops testing if it is false.
 *
 * @param {*} value Anything.
 * @param {string=} opt_comment Comment to echo if false.
 */
puppet.assert = function(value, opt_comment) {
  puppet.logging.check(value, 'Assertion failure: ' + (opt_comment || value));
};

/**
 * Asserts a value or return value of predicate.
 * Throws an exception and stops testing if it is false.
 *
 * @param {*} value Value or function to evaluate.
 * @param {string=} opt_comment Comment to echo if false.
 */
function assert(value, opt_comment) {
  if (goog.isFunction(value)) {
    puppet.assert(value(), opt_comment);
  } else {
    puppet.assert(value, opt_comment);
  }
}

/**
 * Asserts that the arguments are equal (===).
 *
 * @param {*} x Any object.
 * @param {*} y Any object.
 * @param {string=} opt_comment Comment on the equality.
 */
function assertEq(x, y, opt_comment) {
  var comment = (goog.isDef(opt_comment) ? opt_comment + '. ' : '') +
      ('Expected: ' + x + '; Actual:   ' + y);
  puppet.assert(x === y, comment);
}

/**
 * Asserts that the arguments are not equal (!==).
 *
 * @param {*} x Any object.
 * @param {*} y Any object.
 * @param {string=} opt_comment Comment on the inequality.
 */
function assertNotEq(x, y, opt_comment) {
  var comment = (goog.isDef(opt_comment) ? opt_comment + '. ' : '') +
      ('Unexpectedly equal: ' + x);
  puppet.assert(x !== y, comment);
}

/**
 * Gets the single element matching an XPath expression.
 *
 * Returns null if no such element matches the expression and throws
 * an exception if multiple elements match it.
 *
 * @param {string|!Element|function(): !Array.<!Element>} pathOrElem XPath
 *     or element or function that returns an array of elements.
 * @return {Element} The element or null if none at that path.
 */
puppet.elem = function(pathOrElem) {
  return puppet.elements.get(pathOrElem, puppet.window(), puppet.state_);
};

/**
 * Gets all elements by an XPath expression.
 *
 * @param {string|!Array.<!Element>|function(): !Array.<!Element>} pathOrElems
 *    XPath or array of elements or function that an array of elements.
 * @return {!Array.<!Element>} Elements at the given path.
 */
puppet.elems = function(pathOrElems) {
  return puppet.elements.getAll(pathOrElems, puppet.window());
};

/**
 * Adds a listener this is called whenever an element is located, excluding
 * cached elements.
 *
 * @param {function((!Element|!Array.<!Element>),
 *     (string|!Element|!Array.<!Element>|function(): !Array.<!Element>))}
 *     listener Listener function.
 */
puppet.addElemListener = function(listener) {
  puppet.elements.addListener(listener);
};

/**
 * Defines recursive objects. For example:
 *   puppet.define({ x: 1 }, function(me) { return { y: me.x + 2 };})
 * gives { x: 1, y: 3 }
 *
 * @param {!Object} x An initial object.
 * @param {...[function(!Object) : !Object]} var_args Variable length
 *   number of functions that take the base object and returns an
 *   extended object.
 * @return {!Object} The recursively defined object.
 */
puppet.define = function(x, var_args) {
  for (var i = 1; i < arguments.length; i++) {
    var y = arguments[i](x);
    for (var key in y) x[key] = y[key];
  }
  return x;
};

/**
 * @param {{x: number, y:number}} arg The window command argument.
 * @return {boolean} Whether a default value needs to be supplied.
 * @private
 */
puppet.checkWindowCommand_ = function(arg) {
  var x, y;
  for (var dimension in arg) {
    if (dimension == 'x') {
      x = arg[dimension];
    } else if (dimension == 'y') {
      y = arg[dimension];
    } else {
      throw Error('The window argument value, ' + dimension +
          ', was unexpected. Must be x or y.');
    }
  }
  if (!goog.isDef(x) && !goog.isDef(y)) {
    throw Error('No x or y values were specified.');
  }
  return !goog.isDef(x) || !goog.isDef(y);
};

/**
 * Resize the content iframe window to a given width and/or height.
 * Usage:
 *   resize({x: 15}); // Resize to 15 pixels on the x-axis
 *   resize({y: 25}); // Resize to 25 pixels on the y-axis
 *   resize({x: 10, y: 20}); // Resize to 10 x 15 pixels on x and y axis
 *                           // respectively.
 *
 * @param {{x: number, y: number}} dimensions The new window dimensions. The
 *    valid keys for this object are 'x' and 'y'.
 */
var resize = function(dimensions) {
  var size;
  var needDefaultValue = puppet.checkWindowCommand_(dimensions);
  if (needDefaultValue) {
    size = bot.window.getSize();
  }
  bot.window.setSize(new goog.math.Size(
      goog.isDef(dimensions['x']) ? dimensions['x'] : size.width,
      goog.isDef(dimensions['y']) ? dimensions['y'] : size.height));
};

/**
 * Resize the content iframe window to a given width.
 *
 * @param {string} width Width of the window (e.g. 800px or 100%).
 * @deprecated Use resize instead.
 */
puppet.resizeWidth = function(width) {
  var size = bot.window.getSize();
  size.width = parseInt(width, 10);
  bot.window.setSize(size);
};

/**
 * Resize the content iframe window to a given height.
 *
 * @param {string} height Height of the window (e.g. 800px or 100%).
 * @deprecated Use resize instead.
 */
puppet.resizeHeight = function(height) {
  var size = bot.window.getSize();
  size.height = parseInt(height, 10);
  bot.window.setSize(size);
};

/**
 * Scroll the content iframe window to a given width/height or to an element.
 * Usage:
 *   scroll({x: 15}); // Scroll to 15 pixels on the x-axis
 *   scroll({y: 25}); // Scroll to 25 pixels on the y-axis
 *   scroll({x: 10, y: 20}); // Scroll to 10 x 15 pixels on x and y axis
 *                           // respectively.
 *   scroll(puppet.elem(id('a'))); // Scroll to the element with id 'a'.
 *
 * @param {{x: number, y:number}|string|!Element} positionOrPathOrElem An XPath
 *     or element to be scrolled into view or the dimensions that indicate the
 *     new scroll position (valid keys for this object are 'x' and 'y').
 */
var scroll = function(positionOrPathOrElem) {
  if (goog.isString(positionOrPathOrElem) ||
      goog.dom.isElement(positionOrPathOrElem)) {
    var pathOrElem = /** @type {string|!Element} */ (positionOrPathOrElem);
    puppet.scrollToElem_(pathOrElem);
  } else {
    var coord;
    var position = /** @type {{x: number, y: number}} */ (positionOrPathOrElem);
    var needDefaultValue = puppet.checkWindowCommand_(position);
    if (needDefaultValue) {
      coord = bot.window.getScroll();
    }
    bot.window.setScroll(new goog.math.Coordinate(
        goog.isDef(position['x']) ? position['x'] : coord.x,
        goog.isDef(position['y']) ? position['y'] : coord.y));
  }
};

/**
 * Scrolls the given element into view.
 *
 * @param {string|!Element} pathOrElem XPath or element to scroll to.
 * @private
 */
puppet.scrollToElem_ = puppet.command(false, function(elem, desc) {
  bot.action.scrollIntoView(elem);
});


//
// Debugging.
//

/**
 * Gets the source code lines of the given URL. If the source cannot be
 * retrieved, an empty array is returned.
 *
 * @param {string} url A URL.
 * @return {!Array.<string>} Source code lines.
 * @private
 */
puppet.sourceCodeLines_ = (function() {
  var sourceCache = {};
  return function(url) {
    var lines = sourceCache[url];
    if (!lines) {
      var source = puppet.request(url);
      if (!source) {
        return [];
      }
      lines = source.split('\n');
      sourceCache[url] = lines;
    }
    return lines;
  };
})();

/**
 * Gets the currently executing source line of code, or null if it cannot be
 * obtained.
 *
 * @return {{file: ?string, line: ?number, code: ?string}}
 *   Source code file, line number, and source code.
 * @private
 */
puppet.currentSourceCallSite_ = function() {
  // We will populate the call site as much as we can.
  var callSite = {file: null, line: null, code: null};

  // Get the stack trace. The first two frames are in Puppet code. The third
  // frame is the first that enters user's codes.
  var stack = webdriver.stacktrace.get();
  if (stack.length < 3) {
    return callSite;
  }
  var url = stack[2].getUrl();
  var line = stack[2].getLine();
  var parametersIndex = url.indexOf('\?');
  var filename = parametersIndex == -1 ?
      url.substring(url.lastIndexOf('\/') + 1) :
      url.substring(url.lastIndexOf('\/') + 1, parametersIndex);

  // If the line is not valid, assume the line and/or filename is incorrect;
  // otherwise, we populate the call site with that information.
  var source = puppet.sourceCodeLines_(url);
  if (line <= 0 || line > source.length) {
    return callSite;
  }
  callSite.file = filename;
  callSite.line = line;

  // Counts number of left minus the number of right parentheses in source[i].
  function netParens(i) {
    var lefts = source[i].match(/\(/g);
    var rights = source[i].match(/\)/g);
    return (lefts ? lefts.length : 0) - (rights ? rights.length : 0);
  }

  // Initialize start and end lines of the run call to the reported line,
  // minus 1 because array is zero-indexed.
  var startLine = line - 1;
  var endLine = startLine;
  var numParens = netParens(startLine);
  if (source[startLine].indexOf('run(') != -1) {
    while (numParens != 0) {
      endLine++;
      if (endLine == source.length) {
        return callSite;
      }
      numParens += netParens(endLine);
    }
  } else if (source[startLine].indexOf(');') != -1) {
    while (numParens != 0) {
      startLine--;
      if (startLine == 0) {
        return callSite;
      }
      numParens += netParens(startLine);
    }
  } else {
    return callSite;
  }

  // Concatinate line of source code. Trim code outside the run.
  var code = source.slice(startLine, endLine + 1).join(' ');
  code = code.substring(code.indexOf('run('), code.lastIndexOf(');') + 1);
  callSite.code = code.replace(/\s+/g, ' ');
  return callSite;
};


/**
 * Adds a debug message to be displayed when the run-command returns false.
 *
 * @param {string} msg Message to be added.
 */
puppet.debug = function(msg) {
  puppet.logging.debug(msg);
};

/**
 * The arguments in the last call of window.open.
 *
 * Puppet cannot control or check elements in new windows opened by
 * the test applications via window.open(). Mock window.open() and
 * save the arguments (URL, window name, and properties) such that the
 * test can load the URL manually.
 *
 * @type {Array}
 */
puppet.openArgs = null;

/**
 * Finishes execution of commands.
 *
 * @param {string=} opt_message A summary message to be displayed when
 *     the test has failed. No message means the test passed.
 * @private
 */
puppet.done_ = function(opt_message) {
  if (puppet.state_.isFinished()) {
    return;
  }

  var status;
  if (goog.isDef(opt_message)) {
    status = puppet.TestStatus.FAILED;
    puppet.echo(opt_message);
  } else {
    status = puppet.TestStatus.PASSED;
  }
  puppet.updateStatus_(status);
  puppet.state_.setFinished(true);
  if (puppet.executor_.isExecuting()) {
    puppet.executor_.stop();
  }

  if (puppet.testCase_) {
    var resultsByName = puppet.testCase_.getResults();
    for (var key in resultsByName) {
      puppet.resultsByName_[key] = resultsByName[key];
      // Puppet users are used to seeing the entire test report. On a failure,
      // add an error object so that the user can see both the error that
      // triggered the test failure as well as the test report.
      if (puppet.resultsByName_[key].length > 0) {
        puppet.resultsByName_[key].push(puppet.report_);
      }
    }
  }

  var elem = document.createElement('div');
  // Do not use 'result' as the DOM identifier: the identifier is
  // already used by 'Error console' in Safari. The append operation
  // itself succeeds but any subsequent Javascript evaluation in
  // 'Error console' will return 'undefined'.
  // Do not use innerHTML as getText() of a hidden element is deprecated in
  // Selenium.
  // FIXME(meghnasharma): set attribute on /html instead.
  elem.id = 'puppet.result';
  elem.setAttribute('result', status.message);
  elem.style.display = 'none';
  if (document.body) document.body.appendChild(elem);

  // Call puppet.finalize_() via a timer so that DOM updates from
  // puppet.updateStatus_() are finished before finalizers that
  // perform XHR requests are called.
  window.setTimeout(function() {
    puppet.finalize_(status == puppet.TestStatus.PASSED);
  }, 0);

  // Notify the multi-runner, if any.
  if (puppet.runner_) {
    puppet.runner_['notifyDone'](window);
  }
};

/**
 * Runs the finalizers and closes the window.
 *
 * @param {boolean} passed Whether the test passed.
 * @private
 */
puppet.finalize_ = function(passed) {
  puppet.finalize.callFinalizers(passed);

  if (puppet.PARAMS.close) {
    window.close();
  }
};


/**
 * Appends all load parameters specified in the test URL to the given URL.
 * Load parameters are those that are prefixed with "load:".
 *
 * @param {string} url A URL.
 * @return {string} The URL with additional load parameters.
 */
puppet.appendLoadParams = function(url) {
  // Start with all undeclared parameters and append only those that start
  // with "load:" in the key name.
  var undeclared = puppet.params.getUndeclared();
  for (var p in undeclared) {
    if (/^load:/.test(p)) {
      var value = undeclared[p];
      var name = p.substring(5);
      url = puppet.params.setUrlParam(name, value, url);
    }
  }
  return url;
};

/**
 * Adds an event listener for 'load'.
 *
 * @param {!(Window|Element)} target Target to listen on.
 * @param {function()} listener Callback function.
 * @private
 */
puppet.addOnLoad_ = function(target, listener) {
  goog.events.listenOnce(target, 'load', listener);
};

/**
 * Steps through a number of commands if the test is running, or
 * restart the test if the test has finished.
 *
 * @private
 */
puppet.step_ = function() {
  // If the test is under progress (!puppet.state_.isFinished), then switch
  // to stepping mode and keep the URL. This allows switching to stepping mode
  // in the middle of a test without restarting the whole test.
  if (!puppet.state_.isFinished()) {
    puppet.continue_();
    puppet.state_.enterDebugMode();
  } else if (!puppet.state_.isDebugMode()) {
    window.location.href = puppet.params.setUrlParam('step', '');
  }
};

/**
 * Initializes the window object for the new document.
 */
puppet.initWindow = function() {
  // Save the Puppet window and document here for listeners to refer to them.
  // Unfortunately, some frameworks hack Puppet to change the window under
  // test, which can cause problems if listeners then refer to them.
  var puppetWin = puppet.window();
  var puppetDoc;
  try {
    puppetDoc = puppet.document();
  } catch (e) {}

  puppet.assert(puppetDoc, 'The page under test is not accessible. ' +
      'Either the page failed to load or the test has gone cross-domain.');

  // A dummy onunload event handler ensures the browser will not cache the page
  // and will fire a load event when on history.back() and forward(), see:
  // http://www.webkit.org/blog/516/webkit-page-cache-ii-the-unload-event/
  // This helps tests wait for back() and forward() actions to complete.
  puppetWin.onunload = goog.nullFunction;

  // Setup the dialog box handlers.
  puppet.setupDialogs_();

  // See the explanation at puppet.openArgs.
  puppetWin.open = function(opt_url) {
    puppet['openArgs'] = goog.array.clone(arguments);
    puppet.echo('-- window.open() is mocked: <a href=' + opt_url +
        ' target=_blank>' + opt_url + '</a>');
    return null;
  };

  // Set the Puppet window's onerror handler. On older versions of IE, setting
  // onerror on puppet.window(), doesn't actually set the handler, so we
  // unfortunately have to use event listening which provides fewer error
  // details.
  var errorMsg = 'Uncaught JavaScript error in application under test';
  if (goog.userAgent.IE && puppetWin.attachEvent) {
    puppetWin.attachEvent('onerror', function() {
      puppet.assert(false, errorMsg);
    });
  } else {
    puppetWin.onerror = function(message, url, line) {
      if (goog.typeOf(message) == 'string') {
        // Ignore a couple of spurious Firefox errors.
        //
        // Ignore 'Error loading script' errors, because clicking to load a new
        // page will interrupt script loadings of asynchronous modules. Ideally,
        // disable this check only for page loading instead of for all commands.
        //
        // Also, some event handlers do not handle reloading of pages, when
        // some DOM elements will becoming null during reloading.
        if (goog.userAgent.GECKO && (
            message.indexOf('Error loading script') == 0 ||
            message.indexOf('nsIDOMEventTarget.removeEventListener') > 0)) {
          return;
        }
      } else {
        // Sometimes "msg" is an event object. We skip error events from
        // interrupted script loads, for same reason as described just above.
        // TODO(user): Figure out when/why this happens.
        return;
      }

      puppet.assert(
         false, errorMsg + ': ' + message + ' at line ' + line + ' of ' + url);
    };
  }

  // Ignore non-synthetic mousemove events (real events generated by the browser
  // in response to live user actions) while the test is running, so the mouse
  // can be rested or move over the Puppet frame and not affect the application.
  var mouseMoveIgnored = false;
  var wasLastEventTouchMove = false;
  var mouseMoveEvents = ['mousemove', 'mouseover', 'mouseout',
                         'mouseenter', 'mouseleave', 'touchmove'];
  goog.events.listen(puppet.document(), mouseMoveEvents, function(e) {
    // For touch browsers, a synthetic touchmove can trigger a trusted mousemove
    // event, so don't ignore mousemove in that case.
    if (!puppet.state_.isFinished() && !bot.events.isSynthetic(e) &&
        !(wasLastEventTouchMove && e.type == 'mousemove')) {
      // It's useful to have a note in the log that an event has been
      // ignored, but we get MANY of these, so we just log once.
      if (!mouseMoveIgnored) {
        puppet.echo('Ignoring non-synthetic mouse move events.');
        mouseMoveIgnored = true;
      }
      e.stopPropagation();
      e.preventDefault();
    }
    wasLastEventTouchMove = e.type == 'touchmove';
  }, true);

  // Make sure the window is marked not initialized on an unload event.
  // And clean up any listeners attached to the window above.
  goog.events.listenOnce(puppetWin, 'unload', function() {
    if (puppet.executor_.isExecuting() && !puppet.windowInitializedId_) {
      puppet.windowInitializedId_ = puppet.executor_.wait();
    }

    // Remove the listener that ignores mousemove events.
    goog.events.removeAll(puppetDoc);
  });

  // Proxying the puppet.window().console object. This is needed so that
  // console.logs made from the app are passed through to puppet.
  if (puppetWin['console']) {
    puppet.logging.hijackConsole(puppetWin['console']);
  }

  if (puppet.windowInitializedId_) {
    puppet.executor_.notify(puppet.windowInitializedId_);
    puppet.windowInitializedId_ = null;
  }
};

/**
 * Sets up Puppet's global state.
 *
 * @private
 */
puppet.setup_ = function() {
  // Function split() returns [''] for the empty split, hence the array
  // always contains at least one element.
  if (!webdriver.stacktrace.BROWSER_SUPPORTED &&
      Number(puppet.PARAMS.lines[0])) {
    alert('Param ?lines is not supported for this browser;' +
        ' use ?cmds instead.');
  }

  puppet.addOnLoad_(window, puppet.initialize_);
  goog.events.listen(document, goog.events.EventType.KEYDOWN, function(event) {
    var target = event.target;

    // Avoid input fields such as Firebug lite.
    if (target != document.documentElement && target != document.body) {
      return;
    }

    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    switch (event.keyCode) {
      case goog.events.KeyCodes.C:  // c (continue)
        puppet.continue_();
        break;
      case goog.events.KeyCodes.S:  // s (one step)
        puppet.step_();
        break;
    }
  });

  // Skip setting window.onerror and auto-loading if JavaScript unittest
  // framework is in place (window.onerror is already set).
  if (!window.onerror) {
    /**
     * Stops execution and prints error messages.
     *
     * Safari and Chrome do not support 'window.onerror'.
     *
     * @override
     */
    window.onerror = function(msg, url, line) {
      // Ignore missing scripts from auto-loading (see below).
      if (msg == 'Error loading script' &&
          (url.indexOf('/main.js') > 0 || url.indexOf('/site.js') > 0)) return;
      var message = 'Uncaught JavaScript error in test: ' +
          msg + ' at line ' + line + ' of ' + url;
      puppet.done_(message);
      throw message;  // Rethrow the same exception.
    };
  }
};

/**
 * Makes an asynchronous call to a Javascript file. The evaluation of
 * that Javascript may complete after this function returns.
 *
 * @param {string} url URL of the Javascript file to call.
 */
puppet.call = function(url) {
  puppet.echo('== calling: ' + url);
  var script = document.createElement('script');
  script.src = url;
  // Do not use 'head' or 'body' elements, which may not exist yet.
  document.documentElement.firstChild.appendChild(script);
};

/**
 * Fires a touch event.
 *
 * This attempts to simulate touch events on the touch devices as closely as
 * possible.
 *
 * @private
 * @param {!Element} elem Path or Target element.
 * @param {bot.events.EventType} type Event type. One of touchstart, touchend,
 *     touchmove, or touchcancel.
 * @param {number} x The x coordinate value of the touch.
 * @param {number} y The y coordinate value of the touch.
 * @param {number=} opt_x The x coordinate value of the second finger touch.
 * @param {number=} opt_y The y coordinate value of the second finger touch.
 * @return {boolean} Whether the default action was canceled.
 */
puppet.touch_ = function(elem, type, x, y, opt_x, opt_y) {
  var args = {
    touches: [],
    targetTouches: [],
    changedTouches: [],
    altKey: false,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
    relatedTarget: null,
    scale: 0,
    rotation: 0
  };

  function addTouch(x, y) {
    var clientRect = bot.dom.getClientRect(elem);
    var clientX = clientRect.left + x;
    var clientY = clientRect.top + y;

    var touch = {
      identifier: goog.now(),
      screenX: clientX,
      screenY: clientY,
      clientX: clientX,
      clientY: clientY,
      pageX: clientX,
      pageY: clientY
    };
    args.changedTouches.push(touch);
    if (type == bot.events.EventType.TOUCHSTART ||
        type == bot.events.EventType.TOUCHMOVE) {
      args.touches.push(touch);
      args.targetTouches.push(touch);
    }
  }

  addTouch(x, y);

  if (goog.isDef(opt_x) && goog.isDef(opt_y)) {
    addTouch(opt_x, opt_y);
  }

  return bot.events.fire(elem, type, args);
};

/**
 * Pinches the target by the given distance on multitouch browsers. A positive
 * distance makes the fingers move inwards towards each other and a negative
 * distance makes them move outward away from each other. The optional
 * coordinate is the point the fingers move towards, and if not provided,
 * defaults to the center of the element.
 *
 * @param {string|!Element} pathOrElem XPath predicate of the target element.
 * @param {number} distance Distance to pinch the element.
 * @param {number=} opt_x The x coordinate relative to the element.
 * @param {number=} opt_y The y coordinate relative to the element.
 * @return {boolean} Whether the pinched element is shown.
 */
var pinch = puppet.command(true, function(elem, desc, distance, opt_x, opt_y) {
  if (!puppet.userAgent.isMultiTouch()) {
    throw new Error('Pinch is not supported on this browser');
  }
  var coord = puppet.coordFromOptXY_(opt_x, opt_y);
  bot.action.pinch(elem, distance, coord,
      puppet.touchscreen_.getBotTouchscreen());
  return true;
});


/**
 * Rotates the target by the given angle for multitouch browsers. A positive
 * angle indicates a clockwise rotation and a positive value indicates a
 * counter-clockwise rotation. The optional coordinate is the point the fingers
 * rotate around.
 *
 * @param {string|!Element} pathOrElem XPath predicate of the target element.
 * @param {number} degrees The degrees of rotation.
 * @param {number=} opt_x The x coordinate relative to the element.
 * @param {number=} opt_y The y coordinate relative to the element.
 * @return {boolean} Whether the rotated element is shown.
 */
var rotate = puppet.command(true, function(elem, desc, degrees, opt_x, opt_y) {
  if (!puppet.userAgent.isMultiTouch()) {
    throw new Error('Zoom is not supported on this browser');
  }
  var coord = puppet.coordFromOptXY_(opt_x, opt_y);
  bot.action.rotate(elem, degrees, coord,
      puppet.touchscreen_.getBotTouchscreen());
  return true;
});

/**
 * Changes the screen orientation. The mode argument must be one of 'portrait',
 * 'landscape', 'portrait-secondary', or 'landscape-secondary'. Throws an
 * exception on non-mobile browsers because their orientation cannot change.
 *
 * @param {string} mode The orientation mode.
 */
var orient = function(mode) {
  if (!puppet.userAgent.isMobile()) {
    throw new Error('orient is not supported on this browser');
  }
  var orientation;
  switch (mode) {
    case 'portrait':
      orientation = bot.window.Orientation.PORTRAIT;
      break;
    case 'landscape':
      orientation = bot.window.Orientation.LANDSCAPE;
      break;
    case 'portrait-secondary':
      orientation = bot.window.Orientation.PORTRAIT_SECONDARY;
      break;
    case 'landscape-secondary':
      orientation = bot.window.Orientation.LANDSCAPE_SECONDARY;
      break;
    default:
      puppet.assert(false, 'Orientation must be portrait, landscape, ' +
          'portrait-secondary, or landscape-secondary');
      return;
  }
  bot.window.changeOrientation(orientation);
};

// Don't set up Puppet if we are in a testing environment.
if (!puppet['runner']) {
  puppet.setup_();
}
