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

goog.require('goog.Uri');
goog.require('goog.math.Coordinate');
goog.require('puppet.QueueStack');
goog.require('puppet.logging');
goog.require('puppet.params');
goog.require('puppet.userAgent');
goog.require('puppet.xpath');

/**
 * @type {{request: function(string, string=, ?string=, boolean=): ?string,
 *         DIRECTORY_URL: string,
 *         include: function(string): boolean}}
 * @private
 * @const
 */
puppet.BOOTSTRAP_ = window['__BOOTSTRAP_'];

/**
 * Makes a GET/POST request via an XMLHttpRequest.
 *
 * @param {string} url URL to request.
 * @param {string=} opt_type Request type: 'GET' (default) or 'POST'.
 * @param {?string=} opt_body Request body; defaults to null.
 * @param {boolean=} opt_async Whether the request is asynchronous;
 *    defaults to false.
 * @return {?string} Response text; null if the HTTP response status
 *     code is not 200.
 */
puppet.request = puppet.BOOTSTRAP_.request;

/**
 * URL of the Puppet directory.
 *
 * @type {string}
 * @private
 * @const
 */
puppet.DIRECTORY_URL_ = puppet.BOOTSTRAP_.DIRECTORY_URL;

/**
 * Evaluates the JavaScript synchronously from the specified relative server
 * path. It is resolved relative to the location of this puppet.js file, NOT
 * relative to the file in which it is called and NOT relative to the test
 * itself. If the path has already been included, this is a noop.
 *
 * @param {string} path Relative path to the JavaScript file.
 * @return {boolean} Whether a non-empty JavaScript file was found.
 */
puppet.include = puppet.BOOTSTRAP_.include;


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
 * Iframe for the content document being tested.
 * It is added to the DOM by puppet.initialize_.
 *
 * @const
 * @type {!Element}
 * @private
 */
puppet.IFRAME_ = document.createElement('iframe');

/**
 * Gets the content window being tested.
 *
 * @return {!Window} Content window.
 */
puppet.window = function() {
  return /** @type {!Window} */ (goog.dom.getFrameContentWindow(
      /** @type {!HTMLIFrameElement} */ (puppet.IFRAME_)));
};

/**
 * Gets the content document being tested.
 *
 * @return {!Document} Content document.
 */
puppet.document = function() {
  return goog.dom.getFrameContentDocument(puppet.IFRAME_);
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
 * Div for the testing log. It is attached to the DOM by
 * puppet.initialize_.
 *
 * It is important that the log's id be stable, as it it is relied upon by
 * scripts that automatically launch Puppet tests and scrape the results.
 *
 * @type {!Element}
 * @private
 */
puppet.log_ = (function() {
  var log = document.createElement(goog.dom.TagName.DIV);
  log.id = 'log';
  log.style.fontSize = '10pt';
  log.style.fontFamily = 'monospace';
  return log;
})();

/**
 * Toggles the state of the log between shown and hidden.
 *
 * @param {boolean} opt_show Show the log if true, hide if false.
 * @private
 */
puppet.toggleLog_ = function(opt_show) {
  var show = opt_show || puppet.log_.style.height.charAt(0) == '0';
  if (show) {
    puppet.log_.style.overflow = 'auto';
    puppet.log_.style.height = '18em';
    puppet.log_.style.lineHeight = '1.2em';
  } else {
    puppet.log_.style.overflow = 'hidden';
    puppet.log_.style.height = '0';
    puppet.log_.style.lineHeight = '0';
  }
};

/**
 * Menu class. Contains menu items and elements for the puppet menu.
 *
 * @private
 * @constructor
 */
puppet.Menu_ = function() {
  /**
   * The menu div element
   * @type {!Element}
   */
  this.menuDiv = document.createElement('div');
  /**
   * Array of menu items.
   * @type {!Array.<!puppet.MenuItem>}
   * @private
   */
  this.menuItems_ = [];
  /**
   * Array of menu elements, corresponding to menu items.
   * @type {!Array.<!Element>}
   * @private
   */
  this.menuElements_ = [];
  /**
   * The project specific menu div element
   * @type {!Element}
   */
  this.projectMenuDiv = document.createElement('div');
  /**
   * Array of project specific menu items.
   * @type {!Array.<!puppet.MenuItem>}
   * @private
   */
  this.projectMenuItems_ = [];
  /**
   * Array of project specific menu elements.
   * @type {!Array.<!Element>}
   * @private
   */
  this.projectMenuElements_ = [];
};
// Instance of Menu_ referenced by puppet.Menu_.getInstance().
goog.addSingletonGetter(puppet.Menu_);

/**
 * Adds a menu item to the menu. Use puppet.Menu_.addItems.
 *
 * @param {!puppet.MenuItem} item Item to be added.
 * @param {boolean=} opt_project Add item to project specific menu.
 * @private
 */
puppet.Menu_.prototype.addItem_ = function(item, opt_project) {
  var element = document.createElement('a');
  element.style.padding = '0px 10px 0px 10px';
  element.style.textDecoration = 'none';
  element.style.color = 'blue';
  if (opt_project) {
    this.projectMenuItems_.push(item);
    this.projectMenuElements_.push(element);
    this.projectMenuDiv.appendChild(element);
  } else {
    this.menuItems_.push(item);
    this.menuElements_.push(element);
    this.menuDiv.appendChild(element);
  }
};

/**
 * Adds menu items to the menu.
 *
 * @param {!Array.<!puppet.MenuItem>} items Items to be added.
 * @param {boolean=} opt_project Add items to project specific menu.
 */
puppet.Menu_.prototype.addItems = function(items, opt_project) {
  for (var i = 0; i < items.length; i++) {
    this.addItem_(items[i], opt_project);
  }
  this.render();
};

/**
 * Sets properties of the menu elements to correspond with the menu items.
 */
puppet.Menu_.prototype.render = function() {
  for (var i = 0; i < this.menuItems_.length; i++) {
    this.renderItem_(this.menuItems_[i], this.menuElements_[i]);
  }
  for (var j = 0; j < this.projectMenuItems_.length; j++) {
    this.renderItem_(this.projectMenuItems_[j], this.projectMenuElements_[j]);
  }
  if (this.projectMenuItems_.length == 0) {
    this.projectMenuDiv.style.display = 'none';
  } else {
    this.projectMenuDiv.style.display = '';
  }
};

/**
 * Sets properties of element to correspond with menu item.
 *
 * @param {!puppet.MenuItem} item Item to render.
 * @param {!Element} element Element to render to.
 * @private
 */
puppet.Menu_.prototype.renderItem_ = function(item, element) {
  element.innerHTML = item.text;
  element.title = item.title;
  element.href = goog.isDefAndNotNull(item.href) ? item.href :
      'javascript:void(0)';
  element.style.display = (item.disabled ? 'none' : '');
  goog.events.removeAll(element, 'click');
  if (item.onclick) {
    var onclick = (function(it) {
      return function() {
        it.onclick();
        puppet.Menu_.getInstance().render();
      };
    })(item);
    goog.events.listen(element, 'click', onclick);
  }
};

/**
 * Style and add content to the menu.
 *
 * @private
 */
puppet.buildMenu_ = function() {
  var menu = puppet.Menu_.getInstance().menuDiv;
  menu.appendChild(document.createTextNode('Menu: '));
  menu.style.fontFamily = 'monospace';
  menu.style.fontSize = '10pt';
  var projectMenu = puppet.Menu_.getInstance().projectMenuDiv;
  projectMenu.insertBefore(document.createTextNode('Project Menu: '),
      projectMenu.firstChild);
  projectMenu.style.fontFamily = 'monospace';
  projectMenu.style.fontSize = '10pt';

  var docItem = {
    text: 'doc',
    title: 'Open the Puppet documentation.',
    href: 'javascript:window.open(\'http://code.google.com/p/puppeteer\')'};
  var pauseItem = {
    text: 'pause',
    title: 'Pause execution and wait for stepping',
    disabled: puppet.PARAMS.step,
    onclick: function() {
      puppet.PARAMS.step = true;
      continueItem.disabled = pauseItem.disabled;
      pauseItem.disabled = !pauseItem.disabled;
    }};
  var continueItem = {
    text: 'continue',
    title: 'Continue execution through the rest of commands',
    disabled: !puppet.PARAMS.step,
    onclick: function() {
      puppet.PARAMS.step = false;
      continueItem.disabled = pauseItem.disabled;
      pauseItem.disabled = !pauseItem.disabled;
    }};
  var stepItem = {
    text: 'step',
    title: 'Step through the next command and pause execution, ?step',
    href: 'javascript:puppet.step(1)'};
  var cmdsItem = {
    text: 'cmds',
    title: 'Pause at the i-th numbers of commands, ?cmds=1,3',
    href: puppet.params.setUrlParam('cmds', '1,3')};
  var linesItem = {
    text: 'lines',
    title: 'Pause at the i-th numbers of source code lines' +
        ', ?line=10,13',
    href: puppet.params.setUrlParam('lines', '10,13'),
    disabled: !puppet.SUPPORTS_STACK_TRACE_};
  var delayItem = {
    text: 'delay',
    title: 'Delay for 200 milliseconds between run() commands, ?delay=200',
    href: puppet.params.setUrlParam('delay', '200')};
  var firebugItem = {
    text: 'firebug',
    title: 'Firebug lite for debugging, ?firebug',
    href: 'javascript:puppet.firebug_()'};
  var verboseItem = {
    text: 'verbose',
    title: 'Run the test in verbose (debugging) mode',
    href: puppet.params.setUrlParam('verbose', '')};
  var toggleLogItem = {
    text: puppet.log_.style.display == '' ? 'hide log' :
        'show log',
    title: puppet.log_.style.display == '' ? 'Hide the log' :
        'Show the log',
    onclick: function() {
      puppet.toggleLog_();
      toggleLogItem.text = puppet.log_.style.display == '' ? 'hide log' :
          'show log';
      toggleLogItem.title = puppet.log_.style.display == '' ?
          'Hide the log' : 'Show the log';
    }};
  var sourceItem = {
    text: 'source',
    title: 'View source code',
    onclick: function() {
      var sourceWindow = window.open();
      var sourceCode = puppet.sourceCodeLines_(window.location.href);
      sourceWindow.document.write('<PLAINTEXT>' + sourceCode.join('\n'));
      sourceWindow.document.close();
    }};
  puppet.Menu_.getInstance().addItems([
    docItem,
    pauseItem,
    continueItem,
    stepItem,
    cmdsItem,
    linesItem,
    delayItem,
    firebugItem,
    verboseItem,
    toggleLogItem,
    sourceItem
  ]);
};

/**
 * JSCompiler type definition of a MenuItem.
 * @typedef {{title: string, href: string, text: string, disabled: boolean,
 *     onclick: function()}}
 */
puppet.MenuItem;

/**
 * Add menu items to a project-specific menu.
 *
 * @param {!Array.<!puppet.MenuItem>} menuItems An array of puppet.MenuItem.
 */
puppet.addMenuItems = function(menuItems) {
  puppet.Menu_.getInstance().addItems(menuItems, true);
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
  // window.puppet.runner.
  if (window.puppet.runner) {
    return;
  }
  var testName = puppet.name().substr(puppet.name().lastIndexOf('/') + 1)
      .replace('.html', '');
  document.title = testName + ' - Puppet test: ' + puppet.name();
  // To signal the test harness that the test is complete.
  document.body.id = 'puppet';
  document.body.style.margin = '0';
  if (puppet.userAgent.isFirefox()) {
    puppet.control_ = document.createElement('iframe');
    puppet.control_.style.display = 'none';
    puppet.addOnLoad_(puppet.control_, puppet.start);
    document.body.appendChild(puppet.control_);
  } else {
    puppet.start();
  }

  // Create table and content.
  var table = document.createElement(goog.dom.TagName.TABLE);
  table.style.height = '100%';
  table.style.width = '100%';
  table.style.border = '0';
  table.cellPadding = '0';
  table.cellSpacing = '0';
  var contentRow = table.insertRow(-1);
  contentRow.style.height = '100%';
  contentRow.insertCell(-1).appendChild(puppet.IFRAME_);

  puppet.IFRAME_.id = 'content';
  puppet.IFRAME_.src = puppet.BLANK_PAGE_URL_;
  puppet.IFRAME_.frameBorder = '0';
  puppet.IFRAME_.marginWidth = '0';
  puppet.IFRAME_.marginHeight = '0';
  puppet.IFRAME_.height = '100%';
  puppet.IFRAME_.width = '100%';
  // Do not run commands until the iframe is loaded.
  puppet.waitForLoad_();

  // If fullpage, always hide the log.
  // Otherwise, build the menu and hide the log only if requested.
  if (puppet.PARAMS.fullpage) {
    puppet.toggleLog_(false);
  } else {
    puppet.buildMenu_();
    var menuCell = table.insertRow(-1).insertCell(-1);
    menuCell.appendChild(puppet.Menu_.getInstance().menuDiv);
    menuCell.appendChild(puppet.Menu_.getInstance().projectMenuDiv);
    menuCell.style.borderTop = '1px solid black';
    menuCell.style.marginBottom = '3px';
    puppet.toggleLog_(!puppet.PARAMS.hidelog);
  }

  puppet.echo('Running: <a href=/' + puppet.name() +
      ' target=_blank>' + puppet.name() + '</a> ' +
      (puppet.PARAMS.verbose ? (new Date).toDateString() : ''));
  table.insertRow(-1).insertCell(-1).appendChild(puppet.log_);
  document.body.appendChild(table);

  // Fix the width to the current width, so that horizontal overflow
  // always adds a scroll bar instead of stretching the log off screen.
  puppet.log_.style.width = puppet.log_.offsetWidth;

  // Configuring test to fail after the whole test timeout is reached,
  // unless we're in stepping mode.
  if (puppet.PARAMS.time > 0 && !puppet.PARAMS.step) {
    window.setTimeout(function() {
      puppet.done_('Test timed out after ' + puppet.PARAMS.time + ' seconds.');
    }, puppet.PARAMS.time * 1000);
  }

  puppet.updateStatus_(puppet.TestStatus.LOADED);
  puppet.ready_ = true;
};

/**
 * Loads Firebug lite.
 *
 * @private
 */
puppet.firebug_ = function() {
  if (!window['Firebug']) {
    var script = document.createElement('SCRIPT');
    script.setAttribute('src', 'http://getfirebug.com/firebug-lite.js');
    document.body.appendChild(script);
  }
};

/**
 * Enum for the status of a test.
 * @enum {{message: string, color: string}}
 */
puppet.TestStatus = {
  LOADED: {
    message: 'loaded',
    color: 'cornsilk'
  },
  PASSED: {
    message: 'passed',
    color: 'palegreen'
  },
  FAILED: {
    message: 'failed',
    color: 'pink'
  }
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
    if (self.opener && self.opener.puppet && self.opener.puppet.runner) {
      return self.opener.puppet.runner;
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
  // Display timestamps for the message status of the multitest runner.
  var message = status.message + ' #' + puppet.time_();
  puppet.echo('== ' + message);
  puppet.log_.style.backgroundColor = status.color;

  // Notify the multi-runner, if any.
  if (puppet.runner_) {
    puppet.runner_.notifyStatus(window, status);
  }
};


//
// Browsers/OS.
// See: http://www.zytrax.com/tech/web/browser_ids.htm
//

/**
 * Tests if the user agent contains the given regular expression.
 *
 * @private
 * @param {!RegExp} regexp Regular expression.
 * @return {boolean} True if the user agents matches.
 */
puppet.testUserAgent_ = function(regexp) {
  return regexp.test(navigator.userAgent);
};

/**
 * If running under Firefox or any Gecko rendering engine.
 *
 * Note that beta versions of Firefox are called 'Minefield' or
 * 'Shiretoko', not 'Firefox'; hence checking for Gecko version in
 * addition. Must match 'Gecko\/', not 'Gecko', because Webkit-based
 * browsers contains 'like Gecko'. Example user agents:
 *
 * 3.0.1 for Mozilla/5.0 (X11; U; Linux i686 (x86_64); en-US;
 * rv:1.9.0.1) Gecko/2008070206 Firefox/3.0.1
 *
 * 2.0.0.16 for Mozilla/5.0 (X11; U; Linux i686 (x86_64); en-US;
 * rv:1.8.1.16) Gecko/20080716 Firefox/2.0.0.16
 *
 * 2008032902 for Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US;
 * rv:2.0a1pre) Gecko/2008032902 Minefield/4.0a1pre.
 *
 * 20080829071937 for Mozilla/5.0 (X11; U; Linux i686; en-US;
 * rv:1.9.1a2) Gecko/20080829071937 Shiretoko/3.1a2.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.firefox = puppet.testUserAgent_(/Firefox\/|Gecko\//);

/**
 * If running under Firefox 2.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.firefox2 = puppet.testUserAgent_(/Firefox\/2/);

/**
 * If running under Firefox 3.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.firefox3 = puppet.testUserAgent_(/Firefox\/3/);

/**
 * If running under Firefox 4.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.firefox4 = puppet.testUserAgent_(/Firefox\/4/);

/**
 * If running under Firefox 5.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.firefox5 = puppet.testUserAgent_(/Firefox\/5/);

/**
 * If running under Internet Explorer. Example user agents:
 *
 * 7.0 for Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1;
 * Trident/4.0; .NET CLR 1.1.4322; .NET CLR 2.0.50727)
 *
 * 6.0 for Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1;
 * GoogleT5; .NET CLR 1.1.4322; .NET CLR 2.0.50727)
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.explorer = puppet.testUserAgent_(/MSIE/);

/**
 * If running under Internet Explorer 6.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.explorer6 = puppet.testUserAgent_(/MSIE 6/);

/**
 * If running under Internet Explorer 7.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.explorer7 = puppet.testUserAgent_(/MSIE 7/);

/**
 * If running under Microsoft Internet Explorer 8.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.explorer8 = puppet.testUserAgent_(/MSIE 8/);

/**
 * If running under Microsoft Internet Explorer 9.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.explorer9 = puppet.testUserAgent_(/MSIE 9/);

/**
 * If running under WebKit. Example user agents:
 *
 * 525.13 for Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US)
 * AppleWebKit/525.13 (KHTML, like Gecko) Version/3.1 Safari/525.13
 *
 * 525.13 for Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US)
 * AppleWebKit/525.13 (KHTML, like Gecko) Chrome/0.2.149.29
 * Safari/525.13
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.webkit = puppet.testUserAgent_(/AppleWebKit\//);

/**
 * If running under Chrome. Example user agents:
 *
 * 0.2.149.29 for Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US)
 * AppleWebKit/525.13 (KHTML, like Gecko) Chrome/0.2.149.29
 * Safari/525.13
 *
 * 3.0.195.6 for Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US)
 * AppleWebKit/532.0 (KHTML, like Gecko) Chrome/3.0.195.6 Safari/532.0
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.chrome = puppet.testUserAgent_(/Chrome\//);

/**
 * If running under Chrome 2.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.chrome2 = puppet.testUserAgent_(/Chrome\/2/);

/**
 * If running under Chrome 3.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.chrome3 = puppet.testUserAgent_(/Chrome\/3/);

/**
 * If running under Chrome 4.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.chrome4 = puppet.testUserAgent_(/Chrome\/4/);

/**
 * If running under Chrome 5.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.chrome5 = puppet.testUserAgent_(/Chrome\/5/);

/**
 * If running under Chrome 6.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.chrome6 = puppet.testUserAgent_(/Chrome\/6/);

/**
 * If running under mobile webkit.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.mobileWebKit = puppet.testUserAgent_(/WebKit\/.*Mobile\//);

/**
 * If running under Safari. Example user agents:
 *
 * 525.13 for Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US)
 * AppleWebKit/525.13 (KHTML, like Gecko) Version/3.1 Safari/525.13
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.safari = puppet.testUserAgent_(/Safari\//) && !puppet.chrome;

/**
 * If running under Safari 3.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.safari3 = puppet.testUserAgent_(/Version\/3\..+\sSafari\//);

/**
 * If running under Safari 4.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.safari4 = puppet.testUserAgent_(/Version\/4\..+\sSafari\//);

/**
 * If running under Safari 5.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.safari5 = puppet.testUserAgent_(/Version\/5\..+\sSafari\//);

/**
 * If running under Opera. Example user agents:
 *
 * Opera/9.80 (Macintosh; Intel Mac OS X; U; en) Presto/2.6.30 Version/10.62
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.opera = puppet.testUserAgent_(/Opera\//);

/**
 * If running under Opera 10.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.opera10 = puppet.testUserAgent_(/Opera\/.*Version\/10\./);

/**
 * If running under iPad.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.iPad = puppet.testUserAgent_(/iPad/) && puppet.mobileWebKit;

/**
 * Tests if the platform contains the given regular expression.
 *
 * @private
 * @param {RegExp} regexp Regular expression.
 * @return {boolean} True if the platform matches.
 */
puppet.testPlatform_ = function(regexp) {
  return regexp.test(navigator.platform);
};

/**
 * If running on Windows.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.windows = puppet.testPlatform_(/Win/);


/**
 * If running on Linux.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.linux = puppet.testPlatform_(/Linux/);


/**
 * If running on Mac OS.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.mac = puppet.testPlatform_(/Mac/);


/**
 * If running on iPhone. Checks platform or useragent, to account for
 * iPhone simulators running on OSX.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.iphone = puppet.testPlatform_(/iPhone/) ||
    puppet.testUserAgent_(/iPhone/);


/**
 * If running on Android. Checks platform or useragent, to account for
 * Android emulators running on a different OS.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.android = puppet.testPlatform_(/Android/) ||
    puppet.testUserAgent_(/Android/);

/**
 * Check if running on Blackberry
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.blackberry = puppet.testUserAgent_(/BlackBerry/);

/**
 * Check if running on Dolfin (Samsung Bada OS browser)
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.dolfin = puppet.testUserAgent_(/Dolfin/);

/**
 * If running on a mobile browser.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.mobile = puppet.android || puppet.iphone || puppet.iPad ||
                puppet.blackberry || puppet.dolfin;

/**
 * If running on a multitouch mobile browser.
 *
 * @type {boolean}
 * @deprecated use puppet.userAgent.
 */
puppet.isMultiTouch = puppet.iPad || puppet.iphone || puppet.dolfin ||
    (puppet.android && (!puppet.testUserAgent_(/Android [12]\./)));

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
 *   noflash: boolean,
 *   step: boolean,
 *   time: number,
 *   timeout: number,
 *   verbose: boolean
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
  // Whether to turn off the red flash.
  noflash: puppet.params.declareBoolean('noflash'),
  // Whether the test begins paused for stepping through and debugging.
  step: puppet.params.declareBoolean('step'),
  // The number of seconds before the whole test times out.
  // Zero means there is no limit; perhaps useful for debugging.
  time: puppet.params.declareNumber('time', 600),
  // The number of seconds before a command times out.
  // Zero means there is no limit; perhaps useful for debugging.
  timeout: puppet.params.declareNumber('timeout', 30),
  // Whether to show extra debug output when the test runs.
  verbose: puppet.params.declareBoolean('verbose')
};


//
// Scheduling.
//

/**
 * Whether execution is ready for the next command.
 *
 * @type {boolean}
 * @private
 */
puppet.ready_ = false;

/**
 * Whether the current document is loaded.
 *
 * @type {boolean}
 * @private
 */
puppet.loaded_ = false;

/**
 * Whether the window in the test iframe has been set up.
 * @type {boolean}
 * @private
 */
puppet.windowInitialized_ = false;

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
 * Stack of queues with calls scheduled for execution.
 * @type {!puppet.QueueStack}
 * @private
 */
puppet.queueStack_ = new puppet.QueueStack();

/**
 * The number of commands that have been queued via run() thus far,
 * not including pauses. This is used by run() to match commands
 * against the commands_ parameter to determine which commands to
 * precede with pauses. It is also used by puppet.start to test
 * whether any commands have been queued yet.
 *
 * @private
 * @type {number}
 */
puppet.commandIndex_ = 0;

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
  command = (/** @type {function(...) : *} */ command); // For the compiler.
  var caller = puppet.currentSourceCallSite_();

  // Insert pause based on ?cmds or ?lines. Do not use the length of
  // puppet.queue_ to check against ?cmds because the added pause
  // commands change the numbers of functions in puppet.queue_.
  if (caller.line && puppet.member_(String(caller.line), puppet.PARAMS.lines) ||
      puppet.member_(String(puppet.commandIndex_), puppet.PARAMS.cmds)) {
    puppet.queueStack_.enqueue({
      // TODO(user): make a public pause() command.
      command: function() { puppet.PARAMS.step = true },
      args: [],
      file: null,
      line: caller.line,
      // TODO(user): specify the URL parameter and value of the call site.
      code: 'pause() from URL ?cmds or ?lines'
    });
  }

  // Enqueue the command passed to run.
  puppet.queueStack_.enqueue({
    command: command,
    args: goog.array.slice(arguments, 1),
    file: caller.file,
    line: caller.line,
    code: caller.code
  });
  puppet.commandIndex_++;
}

/**
 * Default value of puppet.waitInterval_.
 *
 * @const
 * @private
 * @type {number}
 */
puppet.DEFAULT_WAIT_INTERVAL_ = 200;

/**
 * The number of milliseconds to wait for stuff to happen, used for a
 * variety of purposes in Puppet, including the time to wait before
 * retrying failed commands.
 *
 * @private
 * @type {number}
 */
puppet.waitInterval_ = puppet.DEFAULT_WAIT_INTERVAL_;

/**
 * Sets the value of puppet.waitInterval_. If the argument is not
 * positive, resets it to DEFAULT_WAIT_INTERVAL.
 *
 * @param {number} waitInterval Number of milliseconds to wait.
 */
puppet.setWaitInterval = function(waitInterval) {
  puppet.waitInterval_ = waitInterval > 0 ? waitInterval :
      puppet.DEFAULT_WAIT_INTERVAL_;
};

/**
 * Name of the file where the last call was made.
 *
 * @type {string}
 * @private
 */
puppet.lastCallFile_ = window.location.pathname.
    substr(window.location.pathname.lastIndexOf('\/') + 1);

/**
 * Execute a queued call.
 *
 * @private
 * @param {?puppet.QueuedCall_} call Call to be executed, or null if
 *     no more calls in the queue.
 */
puppet.execute_ = function(call) {
  if (call) {
    // Allow this call to execute its own runs before others.
    puppet.queueStack_.pushQueue();

    // Build the call info to be printed.
    var callInfo = [];
    // Print the filename if it has changed.
    if (call.file && call.file != puppet.lastCallFile_) {
      puppet.lastCallFile_ = call.file;
      callInfo.push('-- in ' + call.file + ':');
    }
    // Print the source code if we have it.
    if (call.code) {
      var line = call.line ? 'line ' + call.line : '';
      callInfo.push(line + ': ' + goog.string.htmlEscape(call.code));
    }
    // If we do not have the source code or if the verbose parameter is set,
    // then we will also print the evaluation of the call.
    if (!call.code || puppet.PARAMS.verbose) {
      var line = call.line ? 'line ' + call.line : '';
      callInfo.push(line + ': ' + puppet.logging.toString(call.command) +
                    '(' + puppet.logging.toString(call.args) + ')');
    }
    // Also print the time if the verbose parameter is set.
    if (puppet.PARAMS.verbose) {
      callInfo.push('time: ' + puppet.time_());
    }
    // Print the call info.
    puppet.echo(callInfo.join('<br>'));

    var timeoutId = null;
    if (puppet.PARAMS.timeout > 0) {
      timeoutId = window.setTimeout(function() {
        puppet.done_('Command timed out after ' + puppet.PARAMS.timeout +
                     ' seconds.');
      }, puppet.PARAMS.timeout * 1000);
    }

    // Make and execute a "retry function" that schedules the command to be
    // retried until it does not return false or the test has ended.
    var retryFunc = function() {
      if (!puppet.batch_) {
        return;
      }
      puppet.ready_ = (call.command.apply(null, call.args) !== false);
      if (puppet.ready_) {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
        puppet.setTimeout_(puppet.start, puppet.PARAMS.delay);
      } else {
        puppet.setTimeout_(retryFunc, puppet.waitInterval_);
      }
      puppet.elemCache_ = {};
      puppet.logging.maybeLogDebugMessages(puppet.ready_);
    };
    retryFunc();

  } else {
    // NOTE(user): use the timer in the main frame (instead of calling
    // done() directly or use the timer in the control frame) so that
    // firebug will block the time out during debugger's breakpoint to
    // allow more puppet commands from run().
    window.setTimeout(function() { puppet.done_(); }, 0);

    // Wait for user to add new commands via run(), unless this
    // test is run via the multi-test runner in which case no new
    // commands should be taken.
    //
    // Note that:
    // 1. To use debugger breakpoints in Firebug, puppet must
    //   be continuously called below because new commands can be
    //   added via stepping through run() commands.
    // 2. To conserve thread resources in IE when using multi-test
    //   runner, puppet.start() must _not_ be called after a test is
    //   done to avoid busy-waiting when a test window is not properly
    //   closed.
    if (!puppet.runner_) {
      puppet.setTimeout_(puppet.start, puppet.waitInterval_);
    }
  }
};

/**
 * Iframe for the control thread of testing; useful for Firebug's
 * debugger in Firefox.
 *
 * This is initialized by puppet.initialize_. It is not necessary for
 * browsers without Firebug's debugger, and can even be harmful. For
 * example, in Safari, calling XMLHttpRequest (as in puppet.request)
 * from the iframe's thread throws a permission error.
 *
 * @type {Element}
 * @private
 */
puppet.control_ = null;

/**
 * Sets timeout with the control iframe or the main window.
 *
 * TODO(user): Figure out if all window.setTimeout calls in this
 * file can be replaced with calls to puppet.setTimeout_.
 *
 * @param {function() : *} func Callback function.
 * @param {number} delay Delay in milliseconds.
 * @return {number} Timer id.
 * @private
 */
puppet.setTimeout_ = function(func, delay) {
  var win = puppet.control_ ? puppet.control_.contentWindow : window;
  return win.setTimeout(func, delay);
};

/**
 * Initialization hooks to execute before the test begins.
 *
 * @type {Array.<function()>}
 * @private
 */
puppet.initializers_ = [];

/**
 * Adds an initializer to be executed before the test ends.
 *
 * @param {function()} initializer Initializer function.
 */
puppet.addInitializer = function(initializer) {
  puppet.initializers_.push(initializer);
};


/**
 * Finalization hooks to execute once the test ends.
 *
 * @type {!Array.<function(boolean)>}
 * @private
 */
puppet.finalizers_ = [];

/**
 * The last finalization hook to execute once the test ends.
 *
 * @type {?function(boolean)}
 * @private
 */
puppet.lastFinalizer_ = null;

/**
 * Adds a finalizer to be executed once the test ends. The finalizer
 * is given a boolean that indicates whether the test passed.
 *
 * @param {function(boolean)} finalizer Finalizer function.
 */
puppet.addFinalizer = function(finalizer) {
  puppet.finalizers_.push(finalizer);
};

/**
 * Sets the last finalizer to be executed once the test ends. The finalizer
 * is given a boolean that indicates whether the test passed.
 *
 * @param {function(boolean)} finalizer Finalizer function.
 */
puppet.setLastFinalizer = function(finalizer) {
  if (puppet.lastFinalizer_) {
    throw 'puppet.lastFinalizer_ already defined. You can only set the last ' +
        'finalizer once.';
  }
  puppet.lastFinalizer_ = finalizer;
};


//
// Commands.
//

/**
 * In version 1 of Puppet, there was a find() command, but in this
 * version, there is not. However unless we define find(), if a test
 * refers to it by mistake, it will resolve to the Javascript function
 * window.find(), and the resulting test may pass or fail when it
 * should not. We define find() here to prevent it from resolving to
 * window.find and to instruct the user to use shown() instead.
 * TODO(user): Remove this once all tests are migrated to v2.
 * @deprecated Probably use shown() instead.
 */
function find() {
  throw 'The find() command is no longer supported by Puppet. ' +
      'You probably need to use shown() instead.';
}

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
                relativeUrl + '</a> ...');

    // If only the url fragment (hash) is changing, load the blank page first,
    // so that the new url is fully loaded anew. Use location.replace() to load
    // the new url so the blank page is replaced in the browser history.
    var loc = puppet.location();
    var currRelativeNoHash = loc.pathname + loc.search;
    var newRelativeNoHash = goog.uri.utils.removeFragment(relativeUrl);
    if (currRelativeNoHash == newRelativeNoHash) {
      puppet.waitForLoad_(function() {
        puppet.waitForLoad_();
        puppet.location().replace(relativeUrl);
      });
      loc.href = puppet.BLANK_PAGE_URL_;
    } else {
      puppet.waitForLoad_();
      loc.href = relativeUrl;
    }
  } else {
    puppet.assert(typeof urlOrCommand == 'function');
    return function(var_args) {
      puppet.waitForLoad_();
      var commandReturn = urlOrCommand.apply(null, arguments);
      if (commandReturn) {
        puppet.echo('-- waiting for a new page to load ...');
      }
      return commandReturn;
    };
  }
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
 * @param {function(!Element, string) : *} fn Continuation function.
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
  var flashOnAfter = key == 'background-color' && puppet.flash_(elem, false);
  var value = bot.dom.getEffectiveStyle(elem, key);
  if (flashOnAfter) {
    puppet.flash_(elem, true);
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
 * Returns true iff the element is present and has the given attribute
 * key/value pair.
 *
 * Since the name of the attribute specifying the element's class is
 * either called 'class' or 'className', depending on the browser, use
 * clazz() instead of this function for testing the value of the class
 * with cross-browser compatibility.
 *
 * @param {string|!Element} pathOrElem XPath or element.
 * @param {string} key Key of the attribute.
 * @param {string|!RegExp} value Value of the attribute.
 * @return {boolean} Whether the element has the attribute.
 */
var attribute = puppet.command(false, function(elem, desc, key, value) {
  var a = puppet.attribute(elem, key);
  var b = goog.isDefAndNotNull(a) && puppet.matches(a, value);
  puppet.debug(desc + ' has ' + key + ' attribute value (' + a + ') ' +
               (b ? '' : 'not ') + 'matching expectation (' + value + ')');
  return b;
});

/**
 * Returns the attribute value for the given attribute key, or null
 * if the element does not have that attribute.
 *
 * @param {!Element} elem Element.
 * @param {string} key Key of the attribute.
 * @return {?string} The attribute value.
 */
puppet.attribute = function(elem, key) {
  var attr = bot.dom.getAttribute(elem, key);
  return goog.isNull(attr) ? null : '' + attr;
};

/**
 * Returns true iff the element is present and has the given property
 * key/value pair.
 *
 * Since the name of the property specifying the element's inner text
 * is either called 'innerText' or 'textContent', depending on the
 * browser, use text() instead of this function for testing the value
 * of the text with cross-browser compatibility.
 *
 * @param {string|!Element} pathOrElem XPath or element.
 * @param {string} key Key of the property.
 * @param {string|!RegExp} value Value of the property.
 * @return {boolean} Whether the element has the property.
 */
var property = puppet.command(false, function(elem, desc, key, value) {
  var p = elem[key];
  var b = goog.isDefAndNotNull(p) && puppet.matches(p, value);
  puppet.debug(desc + ' has ' + key + ' property value (' + p + ') ' +
               (b ? '' : 'not ') + 'matching expectation (' + value + ')');
  return b;
});

/**
 * Returns the element's visible text, the text of the element as the user
 * would see it in the browser.
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
  var b = bot.action.isSelected(elem);
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
  bot.action.type.apply(null, goog.array.concat(elem, flattenedValues));
});

/**
 * Returns true iff the element is shown, and if it is clicks an
 * element at the optional x and y client coordinates, coordinates
 * relative to the element.
 *
 * For GWT (Google Web Toolkit), use mouse(pathOrElem, 'click') instead
 * because the href of its buttons should not be followed.
 *
 * @param {string|!Element} pathOrElem XPath or element to click.
 * @param {number=} opt_x The x coordinate in the client space.
 * @param {number=} opt_y The y coordinate of the client space.
 * @return {boolean} Whether the element is shown.
 */
var click = puppet.command(true, function(elem, desc, opt_x, opt_y) {
  if (puppet.userAgent.isMobile()) {
    var clientPos = goog.style.getClientPosition(elem);
    var clientX = clientPos.x + (opt_x || 0);
    var clientY = clientPos.y + (opt_y || 0);
    var startTouches = puppet.createTouchList(elem, clientX, clientY);
    var defaultNotCanceled = puppet.touch_(elem, 'touchstart', startTouches);

    // The touch devices trigger a mousedown/mouseup/click events after they
    // trigger touch events.
    if (defaultNotCanceled) {
      puppet.click_(elem, opt_x, opt_y);
    }

    var endTouches = puppet.createTouchList(elem);
    puppet.touch_(elem, 'touchend', endTouches, startTouches);
  } else {
    puppet.click_(elem, opt_x, opt_y);
  }
});

/**
 * Simulates the mouse events for a click, at the optional x and y client
 * coordinates relative to the element. If this click has a target URL, ensure
 * the link is relative so it won't go off-site.
 *
 * @param {!Element} elem Element to click.
 * @param {number=} opt_x The x coordinate relative to the element.
 * @param {number=} opt_y The y coordinate relative to the element.
 * @private
 */
puppet.click_ = function(elem, opt_x, opt_y) {
  // Rewrite the target URL of an ancestor link or form to be relative.
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

  // Click element using the browser automation library
  if (goog.isDef(opt_x) && goog.isDef(opt_y)) {
    bot.action.click(elem, new goog.math.Coordinate(opt_x, opt_y));
  } else if (goog.isDef(opt_x)) {
    puppet.logging.error('x coordinate provided but no y coordinate');
  } else {
    bot.action.click(elem);
  }
};

/**
 * Returns true if the element is shown, and if it is follow's the
 * link of the given anchor element.
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
 * Returns true iff the element is shown, and if it is, fires a mouse
 * event to the given element at the optional x and y coordinates,
 * coordinates relative to the element.
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
        switch (type) {
          case 'mousedown':
            var touches = puppet.createTouchList(elem, opt_x, opt_y);
            puppet.touch_(elem, 'touchstart', touches);
            return;
          case 'mousemove':
            var touches = puppet.createTouchList(elem, opt_x, opt_y);
            puppet.touch_(elem, 'touchmove', touches);
            return;
          case 'mouseup':
            var touches = puppet.createTouchList(elem);
            var changedTouches = puppet.createTouchList(elem, opt_x, opt_y);
            puppet.touch_(elem, 'touchend', touches, changedTouches);
            return;
        }
      }
      puppet.mouse(elem, type, opt_x, opt_y, opt_button, opt_detail);
    });

/**
 * Fires a mouse event to an element at the optional x and y client
 * coordinates, coordinates relative to the element.
 *
 * No action if the element is null (to make it easier to trigger
 * multiple mouse events in sequence).
 *
 * @param {!Element} elem Target element.
 * @param {string} type event type.
 * @param {number=} opt_x The x coordinate relative to the element.
 * @param {number=} opt_y The y coordinate relative to the element.
 * @param {number=} opt_button The mouse button based on the DOM Level 2 event
 *     model: 0 = left, 1 = middle, 2 = right.
 * @param {number=} opt_detail The scrollwheel amount.
 * @return {boolean} Whether the event succeeded, and therefore, the
 *     default action of the event may be performed.
 */
puppet.mouse = function(elem, type, opt_x, opt_y, opt_button, opt_detail) {
  var x = opt_x || 0;
  var y = opt_y || 0;

  var clientPos = goog.style.getClientPosition(elem);
  var clientX = clientPos.x + x;
  var clientY = clientPos.y + y;

  var button = puppet.mouseButton_(type, opt_button || 0);
  var detail = opt_detail || 1;
  if (elem.ownerDocument.createEvent) {
    var event = elem.ownerDocument.createEvent('MouseEvents');
    // Gecko browsers use DOMMouseScroll, not mousewheel.
    if (type == 'mousewheel') {
      if (puppet.userAgent.isFirefox()) {
        type = 'DOMMouseScroll';
        detail *= -1;
      }
      event.wheelDelta = detail;
    }
    // screenX=0 and screenY=0 are ignored
    event.initMouseEvent(
        type, true, true, puppet.window(), detail, 0, 0, clientX, clientY,
        false, false, false, false, button, null);
    if (!('isTrusted' in event)) {
      event.isTrusted = false;
    }
    return elem.dispatchEvent(event);
  } else {
    var event = elem.ownerDocument.createEventObject();
    // NOTE: ie8 does a strange thing with the coordinates passed in the event:
    // - if offset{X,Y} coordinates are specified, they are also used for
    //   client{X,Y}, event if client{X,Y} are also specified.
    // - if only client{X,Y} are specified, they are also used for offset{x,y}
    // Thus, for ie8, it is impossible to set both offset and client
    // and have them be correct when they come out on the other side.
    event.clientX = clientX;
    event.clientY = clientY;
    event.button = button;
    event.detail = detail;
    if (!('isTrusted' in event)) {
      event.isTrusted = false;
    }
    return elem.fireEvent('on' + type, event);
  }
};

/**
 * Gets the effective offset from the left of an element.
 *
 * @param {!Element} elem Element.
 * @return {number} offset.
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
 */
puppet.top = function(elem) {
  return elem.offsetParent ?
      elem.offsetTop + puppet.top(elem.offsetParent) : elem.offsetTop;
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
 * @return {number|undefined} The mouse button number equivalent for
 *     the current browser.
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
  else if (puppet.userAgent.isWebkit()) {
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
 * @return {boolean} Whether the element is shown.
 */
var drag = puppet.command(true, function(elem, desc, dx, dy) {
  return (mouse(elem, 'mousedown', 0, 0) &&
          mouse(elem, 'mousemove', dx, dy) &&
          mouse(elem, 'mouseup', dx, dy));
});

/**
 * Returns true if the element is shown, and if it is, inputs a value
 * to the given text or password input element or textarea.
 *
 * @param {string|!Element} pathOrElem XPath or element.
 * @param {string} value Value to be inputted.
 * @return {boolean} Whether the element is shown.
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
    bot.events.fire(elem, 'change');
  }
};

/**
 * Returns true if the element is shown, and if it is, selects the
 * given option element, checkbox, or radio button.
 *
 * @param {string|!Element} pathOrElem XPath or element.
 * @return {boolean} Whether the element is shown.
 */
var select = puppet.command(true, function(elem, desc) {
  bot.action.setSelected(elem, true);
});

/**
 * Returns true if the element is shown, and if it is, deselects the
 * given option element, checkbox, or radio button.
 *
 * @param {string|!Element} pathOrElem XPath or element.
 * @return {boolean} Whether the element is shown.
 */
var deselect = puppet.command(true, function(elem, desc) {
  bot.action.setSelected(elem, false);
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
  bot.events.fire(elem, 'blur');
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
  return function(pathOrElems, var_args) {
    var elems = puppet.elems(pathOrElems);
    var args = goog.array.concat(null, goog.array.slice(arguments, 1));
    for (var i = 0; i < elems.length; i++) {
      args[0] = elems[i];
      if (command.apply(null, args) !== false) return false;
    }
    return true;
  };
}

/**
 * Negates the given command.
 *
 * @param {function(...) : *} command Command.
 * @return {function(...[*]) : boolean} Negated command.
 */
function not(command) {
  return function(var_args) {
    return command.apply(null, arguments) === false;
  };
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
    puppet.queueStack_.clear();
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
 * @return {boolean} True if the specified seconds have elapsed or if
 *     the execution is paused.
 */
function sleep(sec) {
  if (puppet.PARAMS.step) {
    puppet.echo('sleep() is skipped due to stepping.');
    return true;
  }

  if (puppet.sleepElapsed_ == null) {
    puppet.sleepElapsed_ = 0;
  } else {
    puppet.sleepElapsed_ += puppet.waitInterval_;
  }

  var done = (puppet.sleepElapsed_ >= sec * 1000);
  if (done) {
    puppet.sleepElapsed_ = null;
  }
  return done;
}

/**
 * Number of milliseconds elapsed since the sleep began. Null if the
 * execution is not currently sleeping.
 *
 * @type {?number}
 * @private
 */
puppet.sleepElapsed_ = null;

/**
 * Dialog response queue.
 *
 * @type {!Array.<string|boolean|undefined>}
 * @private
 */
puppet.responses_ = [];

/**
 * Responds to prompt/confirm/alert dialog boxes.
 *
 * A 'prompt' dialog must be given a response of type string, a
 * 'confirm' dialog must be given a response of type boolean, and for
 * an alert box, a response type must not be provided.
 *
 * @param {string|boolean=} opt_response Response to the dialog box.
 */
function dialog(opt_response) {
  // TODO(user): support checking the content of the dialog.
  puppet.responses_.push(opt_response);
}

/**
 * Setup the dialog handlers.
 *
 * @private
 */
puppet.setupDialogs_ = function() {

  /**
   * Handler to respond to any dialog box. if the test is running,
   * it checks that there is a response in the queue of the type
   * expected by the dialog and returns that response. If the test is
   * not running, it uses a given manual respond function to respond.
   *
   * @param {string} message Message in the dialog box.
   * @param {string} expectedType Response type expected by dialog.
   * @param {function(string) : *} manualResponder Manual respond function.
   * @return {*} Response to the dialog box.
   */
  function respond(message, expectedType, manualResponder) {
    if (!puppet.batch_) {
      return manualResponder(message);
    }
    puppet.assert(puppet.responses_.length > 0,
        'Unexpected confirmation dialog box: use dialog() command.');
    var response = puppet.responses_.shift();
    var responseType = typeof response;
    puppet.assert(responseType === expectedType,
        'Dialog expected response of type ' + expectedType + ' but received ' +
        puppet.logging.toString(response) + ' of type ' + responseType);
    return response;
  }

  puppet.window().prompt = function(message) {
    return respond(message, 'string', window.prompt);
  };
  puppet.window().confirm = function(message) {
    return respond(message, 'boolean', window.confirm);
  };
  puppet.window().alert = function(message) {
    respond(message, 'undefined', window.alert);
  };
  puppet.window().print = function() {};  // disable printing
};

/**
 * Checks if all dialogs have been displayed.
 *
 * @private
 */
puppet.checkDialogs_ = function() {
  puppet.assert(puppet.responses_.length == 0,
      'No dialogs were displayed to receive the following responses: ' +
      puppet.logging.toString(puppet.responses_));
};


//
// Utilities.
//

// Called when an error occur during assert.
puppet.logging.setErrorListener(function() {
  // Throws exception and stops the test, called when assert function fails.
  puppet.ready_ = false;
  var stack = puppet.trim_(puppet.currentStackTrace_());
  puppet.done_(stack);
  throw stack;
});

// Echo HTML to the Puppet log.
puppet.logging.addLogListener(function(html, text) {
  var line = document.createElement('span');
  line.innerHTML = html;
  puppet.log_.appendChild(line);
  puppet.log_.scrollTop = puppet.log_.scrollHeight;
});

// Echo text to the Firebug console, if available.
if (window.console) {
  puppet.logging.addLogListener(function(html, text) {
    window.console.log(text);
  });
}

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
    flashWasOn = puppet.flash_((/** @type {!Element} */ x), false);
  }

  puppet.logging.log(x);

  if (flashWasOn) {
    puppet.flash_((/** @type {!Element} */ x), true);
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
  if (!value) {
    puppet.logging.error('Assertion failure: ' + (opt_comment || value));
  }
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
 * Asserts that both arguments are defined.
 *
 * @param {*} x Any object.
 * @param {*} y Any object.
 * @param {string=} opt_comment Comment on the assertion.
 * @private
 */
puppet.assertDefined_ = function(x, y, opt_comment) {
  var undef1 = typeof x === 'undefined';
  var undef2 = typeof y === 'undefined';
  if (undef1) {
    puppet.logging.log('First argument undefined');
  }

  if (undef2) {
    puppet.logging.log('Second argument undefined');
  }

  puppet.assert(!undef1 && !undef2, opt_comment);
};

/**
 * Asserts that both arguments are defined and equal.
 *
 * This simple function should not be inlined so that the stack trace
 * shows the arguments during debugging.
 *
 * @param {*} x Any object.
 * @param {*} y Any object.
 * @param {string=} opt_comment Comment on the equality.
 */
function assertEq(x, y, opt_comment) {
  puppet.assertDefined_(x, y, opt_comment);

  if (x != y) {
    puppet.logging.log('Expected: ' + x + '\nActual:   ' + y);
  }

  puppet.assert(x == y, opt_comment);
}

/**
 * Asserts that both arguments are defined and not equal.
 *
 * This simple function should not be inlined so that the stack trace
 * shows the arguments during debugging.
 *
 * @param {*} x Any object.
 * @param {*} y Any object.
 * @param {string=} opt_comment Comment on the inequality.
 */
function assertNotEq(x, y, opt_comment) {
  puppet.assertDefined_(x, y, opt_comment);

  if (x == y) {
    puppet.logging.log('Same: ' + x);
  }
  puppet.assert(x != y, opt_comment);
}

/**
 * The number of milliseconds that the tested item is highlighted in red.
 *
 * @const
 * @private
 * @type {number}
 */
puppet.FLASH_INTERVAL_ = 500;

/**
 * XPath resolved to elem cache.
 * @type {Object}
 * @private
 */
puppet.elemCache_ = {};

/**
 * Computes the path through the DOM to the given element, expressed
 * in CSS selector like syntax using element names, class names, and
 * id values. The returned value is used for diagnostic output, not
 * for actual evaluation.
 *
 * @param {!Element} element The element.
 * @return {string} A CSS selector starting at #document that selects
 *     the element and includes all nodes on the way from the document
 *     to the element. If element is null, the selector is empty.
 * @private
 */
puppet.describeElementLocation_ = function(element) {
  var path = [];
  for (var elem = element; elem; elem = puppet.parentElement_(elem)) {
    var selector = elem.nodeName;
    if (elem.id) {
      selector += '#' + elem.id;
    }
    // Interestingly, SVG DOM nodes do have a className property but
    // that's not a string, i.e. it doesn't have a split() method.
    if (goog.isString(elem.className) && elem.className) {
      var c = elem.className.split(/\s+/);
      selector += '.' + c.join('.');
    }
    path.unshift(selector);
  }
  return path.join(' > ');
};

/**
 * Gets the single element matching an XPath expression.
 *
 * Returns null if no such element matches the expression and throws
 * an exception if multiple elements match it.
 *
 * @param {string|!Element} pathOrElem XPath or element.
 * @return {Element} The element or null if none at that path.
 */
puppet.elem = function(pathOrElem) {
  puppet.assert(pathOrElem, 'Null or undefined xpath/element.');
  var elem;
  var type = typeof pathOrElem;

  // If the argument is an XPath, resolve it to an element.
  if (type == 'string') {
    var cached = puppet.elemCache_[pathOrElem];
    if (cached) {
      return cached;
    }
    var nodes = puppet.xpath.resolveXPath(
        (/** @type {string} */ pathOrElem), puppet.window());
    elem = puppet.nodeToElement_(nodes.iterateNext());
    if (elem) {
      var nextElem = nodes.iterateNext();
      puppet.assert(nextElem == null,
                    'XPath matches multiple elements: ' +
                    pathOrElem +
                    '; first matching element: ' +
                    puppet.describeElementLocation_(elem) +
                    '; second matching element: ' +
                    puppet.describeElementLocation_(
                        /** @type {!Element} */(nextElem)));
    }
    puppet.elemCache_[pathOrElem] = elem;

  // Otherwise, presume it is an element.
  } else {
    puppet.assert(goog.typeOf(pathOrElem) == 'object');
    elem = (/** @type {!Element} */ pathOrElem);
  }

  // Unless noflash is set, flash the element on and schedule it to flash off.
  if (elem && !puppet.PARAMS.noflash) {
    puppet.flash_(elem, true);
    window.setTimeout(function() {
      puppet.flash_((/** @type {!Element} */ elem), false);
    }, puppet.FLASH_INTERVAL_);
  }

  return elem;
};

/**
 * Gets all elements by an XPath expression.
 *
 * @param {string|!Array.<!Element>} pathOrElems XPath or array of
 *     elements.
 * @return {!Array.<!Element>} Elements at the given path.
 */
puppet.elems = function(pathOrElems) {
  puppet.assert(pathOrElems, 'Null or undefined xpath/element array.');
  var elems;
  if (typeof pathOrElems == 'string') {
    var nodes = puppet.xpath.resolveXPath(pathOrElems, puppet.window());
    elems = [];
    // Firefox/Safari uses 'null' while xpath.js (for IE) uses
    // 'undefined' to indicate the end of iteration.
    for (var e = nodes.iterateNext(); e; e = nodes.iterateNext()) {
      var elem = puppet.nodeToElement_(e);
      if (elem) {
        elems.push(elem);
      }
    }
  } else {
    puppet.assert(pathOrElems instanceof Array);
    elems = pathOrElems;  // Already an array of HTML elements.
  }
  return elems;
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
 * Resize the content iframe window to a given width.
 *
 * @param {string} width Width of the window (e.g. 800px or 100%).
 */
puppet.resizeWidth = function(width) {
  puppet.IFRAME_.width = width;
};

/**
 * Resize the content iframe window to a given height.
 *
 * @param {string} height Height of the window (e.g. 800px or 100%).
 */
puppet.resizeHeight = function(height) {
  puppet.IFRAME_.height = height;
  // Resizing only the height will not generate an EVENT_resize in IE.
  // To generate the event in IE, we also set the width to itself.
  if (puppet.userAgent.isIE()) {
    puppet.IFRAME_.width = puppet.IFRAME_.width;
  }
};

/**
 * Submits a form.
 *
 * @param {string} html HTML of the form.
 */
puppet.submit = function(html) {
  puppet.document().body.innerHTML = html;

  // Loop until the form is added.
  (function() {
    var form = puppet.document().getElementsByTagName('form')[0];
    if (form) {
      form.submit();
    } else {
      window.setTimeout(arguments.callee, 0);
    }
  })();
};

/**
 * Returns the node cast to an Element, if it is an element; otherwise
 * returns null.
 *
 * @private
 * @param {Node} node Node.
 * @return {Element} The node cast to an element or null.
 */
puppet.nodeToElement_ = function(node) {
  if (!node) return null;
  return node.nodeType == 1 ? (/** @type {!Element} */ node) : null;
};

/**
 * Returns the parent of the element if the parent is itself an element;
 * otherwise, returns null.
 *
 * @private
 * @param {!Element} elem Element.
 * @return {Element} Parent node if it exists and if it is an element.
 */
puppet.parentElement_ = function(elem) {
  var parent = elem.parentNode;
  return puppet.nodeToElement_(parent);
};

/**
 * If given element is === to a member of the given array.
 *
 * @private
 * @param {*} x Element.
 * @param {Array.<*>} a Array.
 * @return {boolean} Whether e is a member of a.
 */
puppet.member_ = function(x, a) {
  for (var i = 0; i < a.length; i++) {
    if (a[i] === x) return true;
  }
  return false;
};


//
// Xpath.
//

/**
 * Optimized XPath predicate for the 'id' attribute for unique
 * identifiers.
 *
 * 'id' should uniquely identify an element, hence the usual prefix
 * path such as //* is not a parameter. It returns expressions of the
 * form 'id("foo")' For performance, do not use expression such as
 * '//*[@id = "foo"]' unless the identifier is not unique, in which
 * case the function idx() below can be used.
 *
 * @param {string} value Id value.
 * @return {string} XPath.
 */
function id(value) {
  return 'id("' + value + '")';
}

// TODO(user): JsDoc.
function at(path, index) {
  return '(' + path + ')[' + (index + 1) + ']';
}

/**
 * Generates a function which accepts an xpath attribute value and an
 * optional xpath context, and returns the xpath representation.
 *
 * @param {string} key Attribute key.
 * @param {boolean} ignoreCase Should the xpath expression ignore case?
 * @param {boolean} negate Should the xpath expression be wrapped in the not()
 *     function?
 * @param {function(string, string=): string} predFunc A closure which returns
 *     the predicate value of the xpath expression.
 * @return {function(?string=, string=): string} Function to generate xpaths
 *     for a matching attribute value.
 * @private
 */
puppet.makeAttrFunc_ = function(key, ignoreCase, negate, predFunc) {
  var attr = ignoreCase ? puppet.xpath.lowerCase(key) : key;
  return function(opt_value, opt_context) {
    var context = goog.isDef(opt_context) ? opt_context : '//*';
    var value = undefined;
    if (goog.isDefAndNotNull(opt_value)) {
      value = puppet.xpath.quote(opt_value);
      if (ignoreCase) {
        value = puppet.xpath.lowerCase(value);
      }
    }
    var predicate = predFunc(attr, value);
    predicate = negate ? 'not(' + predicate + ')' : predicate;
    return context + '[' + predicate + ']';
  };
};

/**
 * Returns an function that: given a value and an optional context
 * returns an xpath prefixed by that context that matches an element
 * where the given key equals that value. If no context is provided to
 * the function, the default context '//*' (any element) is used.
 *
 * @param {string} key Attribute key.
 * @return {function(?string=, string=) : string} Function to generate
 *     xpaths for a matching attribute value.
 */
puppet.xAttributeFunction = function(key) {
  var attrEqualsFunc = puppet.makeAttrFunc_(key, false, false,
      function(attr, opt_value) {
        return opt_value ? attr + '=' + opt_value : attr;
      });
  attrEqualsFunc.i = puppet.makeAttrFunc_(key, true, false,
      function(attr, value) {
        return attr + '=' + value;
      });
  attrEqualsFunc.c = puppet.makeAttrFunc_(key, false, false,
      function(attr, value) {
        return 'contains(' + attr + ',' + value + ')';
      });
  attrEqualsFunc.ic = puppet.makeAttrFunc_(key, true, false,
      function(attr, value) {
        return 'contains(' + attr + ',' + value + ')';
      });
  attrEqualsFunc.n = puppet.makeAttrFunc_(key, false, true,
      function(attr, opt_value) {
        return opt_value ? attr + '=' + opt_value : attr;
      });
  attrEqualsFunc.nc = puppet.makeAttrFunc_(key, false, true,
      function(attr, value) {
        return 'contains(' + attr + ',' + value + ')';
      });
  attrEqualsFunc.ni = puppet.makeAttrFunc_(key, true, true,
      function(attr, value) {
        return attr + '=' + value;
      });
  attrEqualsFunc.nic = puppet.makeAttrFunc_(key, true, true,
      function(attr, value) {
        return 'contains(' + attr + ',' + value + ')';
      });
  return attrEqualsFunc;
};

/**
 * Generates XPaths to match elements with a given non-unique 'id'
 * attribute.
 *
 * Useful for combining XPath expressions such as id('foo') +
 * idx('bar') = id("foo")//*[@id = "bar"], and for xpaths such
 * as //*[@id = "bar"][2] for selecting the second match.
 *
 * If the id is expected to be unique, always use id() instead.
 *
 * @type {function(string, string=):string}
 * @see id
 */
var xid = puppet.xAttributeFunction('@id');

/**
 * Generates XPaths to match elements with a given 'class' attribute.
 *
 * @type {function(string, string=):string}
 */
var xclass = puppet.xAttributeFunction('@class');

/**
 * Generates XPaths to match elements with a given 'name' attribute.
 *
 * Note that 'window.name' is predefined. In WebKit, window.name is
 * special and cannot even be reassigned.
 *
 * @type {function(string, string=):string}
 */
var xname = puppet.xAttributeFunction('@name');

/**
 * Generates XPaths to match elements with a given 'title' attribute.
 *
 * @type {function(string, string=):string}
 * @see puppet.pred
 */
var xtitle = puppet.xAttributeFunction('@title');

/**
 * Generates XPaths to match elements with a given 'style' attribute.
 *
 * @type {function(string, string=):string}
 */
var xstyle = puppet.xAttributeFunction('@style');

/**
 * Generates XPaths to match elements with a given 'href' attribute.
 *
 * @type {function(string, string=):string}
 */
var xhref = puppet.xAttributeFunction('@href');

/**
 * Generates XPaths to match elements with a given 'type' attribute.
 *
 * @type {function(string, string=):string}
 */
var xtype = puppet.xAttributeFunction('@type');

/**
 * Generates XPaths to match elements with a given 'src' attribute.
 *
 * @type {function(string, string=):string}
 */
var xvalue = puppet.xAttributeFunction('@value');

/**
 * Generates XPaths to match elements with a given 'src' attribute.
 *
 * @type {function(string, string=):string}
 */
var xsrc = puppet.xAttributeFunction('@src');

/**
 * Generates XPaths to match elements with a given 'text()' subnode.
 *
 * @type {function(string, string=):string}
 * @see puppet.pred
 */
var xtext = puppet.xAttributeFunction('text()');

//
// Debugging.
//

/**
 * True if error stack trace is supported by browser.
 *
 * @type {boolean}
 * @const
 * @private
 */
puppet.SUPPORTS_STACK_TRACE_ = goog.isDefAndNotNull(new Error().stack);

/**
 * Gets the current stack trace.
 *
 * @return {string} Stack trace.
 * @private
 */
puppet.currentStackTrace_ = function() {
  var stack = new Error().stack;
  if (stack) {
    // Assume the puppet test file is a .htm (or .html) file, which is usually
    // the last entry (or the first in rare cases).
    var stackArrays = stack.split('\n');
    for (var i = stackArrays.length - 1; i >= 0; i--) {
      if (stackArrays[i].indexOf('.htm') >= 0) {
        return stackArrays[i].replace(/@:0/g, '');
      }
    }
  }
  return '';
};

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
  var urlEnd = 0;

  var stack = puppet.currentStackTrace_();
  if (!stack) {
    return callSite;
  }

  // Get url, line number and filename from stack trace.
  // Cut the first two puppet.js lines.
  var urlStart = stack.indexOf('http://', stack.indexOf('puppet.js',
      stack.indexOf('puppet.js') + 1));
  if (urlStart == -1) {
    urlStart = stack.indexOf('https://', stack.indexOf('puppet.js',
        stack.indexOf('puppet.js') + 1));
    if (urlStart == -1) {
      // First line will be completely useless as url.
      return callSite;
    }
    // Skip https://
    urlEnd = stack.indexOf(':', stack.indexOf('/', urlStart + 8));
  } else {
    // Skip http://
    urlEnd = stack.indexOf(':', stack.indexOf('/', urlStart + 7));
  }
  var url = stack.substring(urlStart, urlEnd);
  var line = Number(/[0-9]*/.exec(stack.substr(urlEnd + 1))[0]);
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
 * Flashes/highlight the element in action. Returns whether the flash state
 * changed as a result of this call.
 *
 * The highlight may not be cleared properly if the element is copied
 * during highlight such as during infowindow resizing.
 *
 * @param {!Element} elem The target element.
 * @param {boolean} on True turns flash on, false turns it off.
 * @return {boolean} Whether the flash state changed.
 * @private
 */
puppet.flash_ = function(elem, on) {
  try {
    var savedColor = puppet.getPuppetProperty_(elem, 'backgroundColor');

    // The backgroundColor Puppet property is present iff the flash is on.
    if (on == goog.isDefAndNotNull(savedColor)) {
      return false;
    }

    // Otherwise, turn the flash on or off, as given.
    // NOTE(user): It is important that the style be set with
    //   elem.style['background-color'] = ...
    // and not
    //   elem.style['backgroundColor'] = ...
    // nor
    //   elem.style.backgroundColor = ...
    // because the latter two don't complete synchronously on IE and may
    // transiently make the element disappear while it is in process!
    if (on) {
      puppet.setPuppetProperty_(elem, 'backgroundColor',
                                elem.style.backgroundColor);
      elem.style['background-color'] = 'red';
    } else if (!on) {
      elem.style['background-color'] = (/** @type {string} */ savedColor);
      puppet.setPuppetProperty_(elem, 'backgroundColor', null);
    }
    return true;
  } catch (e) {
    // In IE, accessing an element after a new document is loaded
    // can cause 'Permission denied' exception. Ignore the exception.
    return false;
  }
};

/**
 * If execution is in batch mode (not interactive).
 *
 * @private
 * @type {boolean}
 */
puppet.batch_ = true;

/**
 * Starting time.
 *
 * @private
 * @type {Date}
 */
puppet.startTime_ = new Date;

/**
 * The number of remaining commands to step through.
 *
 * @private
 * @type {number}
 */
puppet.steps_ = 1;

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
 * If command execution is paused.
 *
 * @private
 * @type {boolean}
 */
puppet.paused_ = false;

/**
 * Starts (and resumes if stopped) the execution of commands.
 */
puppet.start = function() {
  var next = puppet.ready_ && puppet.loaded_ && puppet.batch_ &&
      puppet.commandIndex_ > 0;
  var step = !puppet.PARAMS.step || puppet.steps_ > 0;
  if (!puppet.paused_ && next && !step) {
    puppet.paused_ = true;
    puppet.echo('Paused; click \'continue\' or \'step\' to resume.');
  }

  // The execution order of onload handlers on different documents is
  // not guaranteed: The onload handler in this file on the document
  // of the control iframe may be executed before the onload handler
  // in the test file on the main document; that is, this function may
  // be called before any command has been queued. Hence the checking
  // of puppet.commandIndex_; otherwise, a test can pass trivially.
  if (next && step) {
    puppet.paused_ = false;
    puppet.steps_--;
    try {
      var call =
          /** @type {puppet.QueuedCall_} */(puppet.queueStack_.dequeue());
      puppet.execute_(call);
    } catch (e) {
      var stack = puppet.trim_(e.stack || '');
      var message = 'Error: ' + (e.message || e) + stack;
      puppet.done_(message);
      throw e;  // Rethrow the same exception.
    }
    // Wait for network and js evaluation.
  } else {
    puppet.setTimeout_(puppet.start, puppet.waitInterval_);
  }
};

/**
 * Finishes execution of commands.
 *
 * @param {string=} opt_message A summary message to be displayed when
 *     the test has failed. No message means the test passed.
 * @private
 */
puppet.done_ = function(opt_message) {
  if (!puppet.batch_) {
    return;
  }
  puppet.batch_ = false;

  var status;
  if (opt_message === undefined) {
    status = puppet.TestStatus.PASSED;

    // The test did not actually pass unless all the expected dialog
    // responses were consumed. Check that they were here:
    puppet.checkDialogs_();
  } else {
    status = puppet.TestStatus.FAILED;
    puppet.echo(opt_message);
  }
  puppet.updateStatus_(status);

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
    puppet.runner_.notifyDone(window);
  }
};

/**
 * Runs the finalizers and closes the window.
 *
 * @param {boolean} passed Whether the test passed.
 * @private
 */
puppet.finalize_ = function(passed) {
  for (var i = 0; i < puppet.finalizers_.length; i++) {
    puppet.finalizers_[i](passed);
  }

  if (puppet.lastFinalizer_) {
    puppet.lastFinalizer_(passed);
  }

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
 * Gets the elapsed seconds since the loading of the document.
 *
 * @private
 * @return {string} the elapsed seconds.
 */
puppet.time_ = function() {
  function pad(x) { return ('' + x).length < 2 ? '0' + x : '' + x; }
  var now = new Date;
  var hour = pad(now.getHours());
  var min = pad(now.getMinutes());
  var sec = pad(now.getSeconds());
  var elapsed = (now - puppet.startTime_) / 1000.0;
  return hour + ':' + min + ':' + sec + ' (' + elapsed + 's)';
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
 * @param {number} count The number of steps.
 */
puppet.step = function(count) {
  // If the test is under progress (puppet.batch_) and not waiting for
  // some condition (puppet.ready_), then switch to stepping mode and
  // keep the URL. This allows switching to stepping mode in the
  // middle of a test without restarting the whole test.
  if (puppet.batch_ && puppet.ready_) {
    puppet.PARAMS.step = true;
    puppet.steps_ = count;
  } else if (!puppet.PARAMS.step) {
    window.location.href = puppet.params.setUrlParam('step', '');
  }
};

/**
 * Trims paths about directory prefix, protocol and host, or query
 * parameters of an URL.
 *
 * For example, return puppet/basic/basic.html for
 * http://google.com:6342/puppet/basic/basic.html?time=100,
 *
 * or, return puppet/basic/basic.html:25 for
 * http://google.com:9099/filez/some/path/basic.html?time=100:25
 *
 * @param {string} url Original URL.
 * @return {string} Trimmed URL.
 * @private
 */
puppet.trim_ = function(url) {
  var prefix = document.location.protocol + '//' + document.location.host + '/';
  return url
      .replace(RegExp(prefix, 'g'), '')
      .replace(/@/g, ' @')
      .replace(/\?[^:]*/g, '');  // keep line number after colon
};

/**
 * Name of the test, trimmed from the URL.
 *
 * @return {string} The name of the test.
 */
puppet.name = (function() {
  var name = puppet.trim_(document.URL);
  return function() {
    return name;
  }
})();

/**
 * Stops the command executation and waits for the next Puppet page load,
 * at which point, the specified optional continuation function is called.
 *
 * @param {function()=} opt_fn Continuation function.
 * @private
 */
puppet.waitForLoad_ = function(opt_fn) {
  puppet.windowInitialized_ = false;
  puppet.loaded_ = false;

  // Schedule the load to fail after the timeout.
  var timeoutId = null;
  if (puppet.PARAMS.timeout > 0) {
    timeoutId = window.setTimeout(function() {
      puppet.done_(
          'Page failed to load after ' + puppet.PARAMS.timeout + ' seconds.');
    }, puppet.PARAMS.timeout * 1000);
  }

  puppet.addOnLoad_(puppet.IFRAME_, function() {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
    puppet.initWindow();
    // After the window has loaded, wait another cycle for the page to enter
    // the browser history, so tests that use the browser history work.
    window.setTimeout(function() {
      puppet.loaded_ = true;
      if (opt_fn) {
        opt_fn();
      }
    }, 0);
  });
};

/**
 * Initializes the window object for the new document.
 */
puppet.initWindow = function() {
  if (puppet.windowInitialized_) {
    return;
  }

  // Make the atoms consider the Puppet iframe to be the "top" window.
  bot.setWindow(puppet.window());

  for (var i = 0; i < puppet.initializers_.length; i++) {
    puppet.initializers_[i]();
  }
  puppet.setupDialogs_();

  // See the explanation at puppet.openArgs.
  puppet.window().open = function(url) {
    puppet.openArgs = goog.array.clone(arguments);
    puppet.echo('-- window.open() is mocked: <a href=' + url +
        ' target=_blank>' + url + '</a>');
    return null;
  };

  // A dummy onunload event ensures the browser will not cache the page
  // and will fire a load event when on history.back() and forward(), see:
  // http://www.webkit.org/blog/516/webkit-page-cache-ii-the-unload-event/
  // This helps tests wait for back() and forward() actions to complete.
  if (!puppet.window().onunload) {
    puppet.window().onunload = goog.nullFunction;
  }

  // Verify with puppet/load.html.
  puppet.window().onerror = function(msg, url, line) {
    if (typeof msg == 'string') {
      // Skip checking 'Error loading script' because clicking to load
      // a new page (such as in textview or mapshop profile) will
      // interrupt script loadings of asynchronous modules. Ideally,
      // disable this check only for clicking or new page loading
      // instead of for all commands.
      if (msg.indexOf('Error loading script') == 0) return;

      // Some event handlers do not handle reloading of pages, when
      // some DOM elements will becoming null during reloading.
      if (msg.indexOf('nsIDOMEventTarget.removeEventListener') > 0) return;
    }

    // Sometimes "msg" is an event object. We skip error events from
    // interrupted script loads, for same reason as described just above.
    // TODO(user): Figure out when/why this happens.
    else {
      return;
    }

    puppet.assert(false, 'error from server: ' + msg + '  @' +
        url + ', line ' + line);
  };

  // Ignore non-synthetic mousemove events (real events generated by the browser
  // in response to live user actions) while the test is running, so the mouse
  // can be rested or move over the Puppet frame and not affect the application.
  var mouseMoveIgnored = false;
  var mouseMoveEvents = ['mousemove', 'mouseover', 'mouseout',
                         'mouseenter', 'mouseleave', 'touchmove'];
  goog.events.listen(puppet.document(), mouseMoveEvents, function(e) {
    if (puppet.batch_ && !bot.events.isSynthetic(e)) {
      // It's useful to have a note in the log that an event has been
      // ignored, but we get MANY of these, so we just log once.
      if (!mouseMoveIgnored) {
        puppet.echo('Ignoring non-synthetic mouse move events.');
        mouseMoveIgnored = true;
      }
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);

  puppet.windowInitialized_ = true;
};

/**
 * Sets up Puppet's global state.
 *
 * @private
 */
puppet.setup_ = function() {
  // Function split() returns [''] for the empty split, hence the array
  // always contains at least one element.
  if (!puppet.SUPPORTS_STACK_TRACE_ && Number(puppet.PARAMS.lines[0])) {
    alert('Param ?lines is not supported for this browser;' +
        ' use ?cmds instead.');
  }

  puppet.addOnLoad_(window, puppet.initialize_);
  document.onkeypress = function(event) {
    if (puppet.userAgent.isIE()) event = window.event;
    var target = event.target || event.srcElement;

    // Avoid input fields such as Firebug lite.
    if (target != document.documentElement && // in Firefox
        target != document.body) return;  // in Webkit or Internet Explorer

    if (event.altKey || event.ctrlKey) return;
    var code = String.fromCharCode(event.keyCode || event.which);
    switch (code) {
      case 'c': puppet.PARAMS.step = false; break;  // c (continiue)
      case 's': puppet.step(1); break;  // s (one step)
      case 'S': puppet.step(3); break;  // S (three steps)
    }
  };

  // Skip setting window.onerror and auto-loading if Javascript unittest
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
      puppet.ready_ = false;
      var message = 'error from test: ' + msg + '  @' +
          puppet.trim_(url) + ', line ' + line;
      puppet.done_(message);
      throw message;  // Rethrow the same exception.
    };
  }

  // Include the XPath library if no document.evaluate() function.
  if (!window.document.evaluate) {
    /** To export window.install() from the XPath library.
     *
     * @type {Object}
     */
    window.jsxpath = { exportInstaller: true };

    // TODO(user): Check for updates; the current version is 0.1.11 in 2007.
    // http://coderepos.org/share/wiki/JavaScript-XPath
    puppet.include('./xpath/main.js');
  }

  /**
   * Removes the control frame and thus its associated timer
   * Otherwise, the browser will not terminate the associated timer
   * that runs puppet.start() and will complain that 'puppet' is
   * undefined at the entrance of puppet.start(), because its
   * definition in the main document has already been removed.
   *
   * Safari and Chrome do not support 'window.onunload'.
   */
  window.onunload = function() {
    // Sometimes Firefox throws unknown errors during document unload.
    try {
      // Skip if document.body is already deleted.
      if (puppet.control_ && document.body) {
        document.body.removeChild(puppet.control_);
      }
    } catch (e) {}

    // Ideally, close the window to terminate a test early in the
    // multi-test runner but in conflicts with window.close in run.html.
  };

  // Assign names to anonymous functions, see puppet.logging.toString.
  for (var key in puppet) {
    if (goog.typeOf(puppet[key]) == 'function') {
      puppet[key].name = 'puppet.' + key;
    }
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
 * Returns the value of a custom, Puppet property on the given object.
 * These are properties Puppet has attached to user-visible objects.
 *
 * @param {!Object} x An object.
 * @param {string} name The name of a property.
 * @return {*} The value of the property.
 * @private
 */
puppet.getPuppetProperty_ = function(x, name) {
  return x._puppet ? x._puppet[name] : undefined;
};

/**
 * Sets the value of a custom, Puppet property on the given object.
 * These are properties Puppet has attached to user-visible objects.
 *
 * @param {!Object} x An object.
 * @param {string} name The name of a property.
 * @param {*} value The value of the property.
 * @private
 */
puppet.setPuppetProperty_ = function(x, name, value) {
  if (goog.isDef(value)) {
    x._puppet = x._puppet || {};
    x._puppet[name] = value;
  }
};

/**
 * Creates a TouchList with 0, 1, or 2 fingers.
 *
 * @param {string|!Element} pathOrElem XPath predicate or the target element.
 * @param {number=} opt_x1 The x coordinate for the first touch in the list.
 * @param {number=} opt_y1 The y coordinate for the first touch in the list.
 * @param {number=} opt_x2 The x coordinate for the second touch in the list.
 * @param {number=} opt_y2 The y coordinate for the second touch in the list.
 * @return {!TouchList} A TouchList containing touches for each of the specified
 *     coords objects.
 */
puppet.createTouchList = function(pathOrElem, opt_x1, opt_y1, opt_x2, opt_y2) {
  var elem = puppet.elem(pathOrElem);
  var doc = puppet.document();

  function createTouch(x, y) {
    if (doc.createTouch) {
      return doc.createTouch(
          puppet.window(), elem, (new Date).getTime(), x, y, x, y);
    } else {
      return {
        clientX: x,
        clientY: y,
        screenX: x,
        screenY: y,
        pageX: x,
        pageY: y,
        target: elem,
        identifier: (new Date).getTime()
      };
    }
  }

  function createTouchListImpl(var_args) {
    if (doc.createTouchList) {
      var list = doc.createTouchList.apply(
          puppet.document(), arguments);
      // On Android 2.3 createTouchList always returns empty list
      if (list.length == arguments.length) {
        return list;
      }
    }

    /* Generic implementation */
    var list = arguments;
    list.item = function(i) {
      return list[i];
    };
    return list;
  }

  if (elem && goog.isNumber(opt_x1) && goog.isNumber(opt_y1)) {
    var clientPos = goog.style.getClientPosition(elem);
    var clientX1 = clientPos.x + opt_x1;
    var clientY1 = clientPos.y + opt_y1;

    if (goog.isNumber(opt_x2) && goog.isNumber(opt_y2)) {
      var clientX2 = clientPos.x + opt_x2;
      var clientY2 = clientPos.y + opt_y2;
      return createTouchListImpl(
          createTouch(clientX1, clientY1), createTouch(clientX2, clientY2));
    } else {
      return createTouchListImpl(createTouch(clientX1, clientY1));
    }
  } else {
    return createTouchListImpl();
  }
};

/**
 * Returns true if the element is shown, and if it is touches an
 * element.
 *
 * @param {string|!Element} pathOrElem XPath predicate or the target element.
 * @param {string} type Event type. One of touchstart, touchend, touchmove, or
 *     touchcancel.
 * @param {!TouchList} touches A TouchList containing the Touch objects for this
 *     event.
 * @param {TouchList=} opt_changedTouches A TouchList containing the changed
 *     touch events. Defaults to touches.
 * @param {TouchList=} opt_targetTouches A TouchList containing the changed
 *     touch events for the target. Defaults to touches.
 * @return {boolean} Whether the element is shown.
 */
var touch = puppet.command(true,
    function(elem, desc, type, touches, opt_changedTouches, opt_targetTouches) {
      puppet.touch_(elem, type, touches, opt_changedTouches);
    });

/**
 * Fires a touch event with the given sets of TouchLists.
 *
 * This attempts to simulate touch events on the touch devices as closely as
 * possible.
 *
 * @private
 * @param {string|!Element} pathOrElem XPath predicate or the target element.
 * @param {string} type Event type. One of touchstart, touchend, touchmove, or
 *     touchcancel.
 * @param {!TouchList} touches A TouchList containing the Touch objects for this
 *     event.
 * @param {TouchList=} opt_changedTouches A TouchList containing the changed
 *     touch events. Defaults to touches.
 * @param {TouchList=} opt_targetTouches A TouchList containing the changed
 *     touch events for the target. Defaults to touches.
 * @return {boolean} Whether the default action was canceled.
 */
puppet.touch_ = function(pathOrElem, type, touches, opt_changedTouches,
    opt_targetTouches) {
  // TODO: Port to the atoms library.
  var elem = puppet.elem(pathOrElem);
  var changedTouches = opt_changedTouches || touches;
  var targetTouches = opt_targetTouches || touches;

  var event;
  if (puppet.userAgent.isAndroid() || puppet.userAgent.isBlackberry() ||
      puppet.userAgent.isDolfin()) {
    event = puppet.document().createEvent('MouseEvents');
    event.initTouchEvent =
        function(type, canBubble, cancelable, view, detail, screenX, screenY,
                 clientX, clientY, ctrlKey, altKey, shiftKey, metaKey,
                 touches, targetTouches, changedTouches, scale, rotation) {
      event.initEvent(type, canBubble, cancelable);
      event.touches = touches;
      event.targetTouches = targetTouches;
      event.changedTouches = changedTouches;
    };
  } else {  // Assume puppet.iphone.
    event = puppet.document().createEvent('TouchEvent');
  }
  event.initTouchEvent(
      type, true, true, puppet.window(), 0, 0, 0, 0, 0,
      false, false, false, false,
      touches, targetTouches, changedTouches, null, null);
  if (!('isTrusted' in event)) {
    event.isTrusted = false;
  }
  return elem.dispatchEvent(event);
};

/**
 * Pinches the target, triggering touch events for the multi-touch browsers.
 *
 * @param {string|!Element} pathOrElem XPath predicate or the target element.
 * @param {number} x1 The x coordinate of the first finger in the client space.
 * @param {number} y1 The y coordinate of the first finger in the client space.
 * @param {number} x2 The x coordinate of the second finger in the client space.
 * @param {number} y2 The y coordinate of the second finger in the client space.
 * @param {number} dx The change in the x direction of each finger.  Finger one
 *     moves left if dx is positive.  Finger two moves right if dx is positive.
 * @param {number} dy The change in the y direction of each finger.  Finger one
 *     moves up if dy is positive.  Finger two moves down if dy is positive.
 * @return {boolean} Whether the pinched element is shown; cf. function touch().
 */
var pinch = puppet.command(true, function(elem, desc, x1, y1, x2, y2, dx, dy) {
  if (puppet.userAgent.isMultiTouch()) {
    var startTouches = puppet.createTouchList(elem, x1, y1, x2, y2);
    touch(elem, 'touchstart', startTouches);
    var moveTouches = puppet.createTouchList(elem, x1 - dx, y1 - dy,
                                             x2 + dx, y2 + dy);
    touch(elem, 'touchmove', moveTouches);

    var endTouches = puppet.createTouchList(elem);  // empty touch list
    return touch(elem, 'touchend', endTouches, moveTouches);
  } else {
    throw new Error('Pinch is not supported on this browser');
  }
});

// Don't set up Puppet if we are in a testing environment.
if (!puppet['runner']) {
  puppet.setup_();
}
