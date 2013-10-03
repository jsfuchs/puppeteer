// Copyright 2013 Software Freedom Conservancy. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Defines a special test case that runs each test inside of
 * Puppet. This module is based on closure's testcase module, but does not
 * directly inherit because puppet.TestCase has a dependency on
 * goog.testing.asserts which is currently not compatible with Puppet.
 */

goog.provide('puppet.TestCase');

goog.require('puppet.Executor');
goog.require('puppet.finalize');
goog.require('webdriver.stacktrace');



/**
 * Constructs a test case that will auto discover tests and enqueue them on
 * Puppet's execution queue.
 *
 * @param {!puppet.Executor} executor The Puppet command executor.
 * @param {function(string=)} callback Callback function to signal end.
 * @constructor
 */
puppet.TestCase = function(executor, callback) {
  /**
   * The Puppet executor object.
   * @private {!puppet.Executor}
   */
  this.executor_ = executor;

  /**
   * Callback function that signals the end of the test.
   * @private {function(string=)}
   */
  this.callback_ = callback;

  /**
   * Array of test functions that can be executed.
   * @type {!Array.<!puppet.TestCase.Test_>}
   * @private
   */
  this.tests_ = [];

  /**
   * Set of test names and/or indices to execute, or null if all tests should
   * be executed.
   *
   * Indices are included to allow automation tools to run a subset of the
   * tests without knowing the exact contents of the test file.
   *
   * Indices should only be used with SORTED ordering.
   *
   * Example valid values:
   * <ul>
   * <li>[testName]
   * <li>[testName1, testName2]
   * <li>[2] - will run the 3rd test in the order specified
   * <li>[1,3,5]
   * <li>[testName1, testName2, 3, 5] - will work
   * <ul>
   * @private {Object}
   */
  this.testsToRun_ = null;


 /**
   * Object used to encapsulate the test results.
   * @private {puppet.TestCase.Result_}
   */
  this.result_ = new puppet.TestCase.Result_();

  var search = '';
  if (window.location) {
    search = window.location.search;
  }

  // Parse the 'runTests' query parameter into a set of test names and/or
  // test indices.
  var runTestsMatch = search.match(/(?:\?|&)runTests=([^?&]+)/i);
  if (runTestsMatch) {
    this.testsToRun_ = {};
    var arr = runTestsMatch[1].split(',');
    for (var i = 0, len = arr.length; i < len; i++) {
      this.testsToRun_[arr[i]] = 1;
    }
  }

  // Checks the URL for a valid order param.
  var orderMatch = search.match(/(?:\?|&)order=(natural|random|sorted)/i);
  if (orderMatch) {
    this.order_ = orderMatch[1];
  }
};


/**
 * A class representing an error thrown by the test
 * @param {string} source The name of the test which threw the error.
 * @param {string} message The error message.
 * @constructor
 * @private
 */
puppet.TestCase.Error_ = function(source, message) {
  /**
   * The name of the test which threw the error.
   * @type {string}
   */
  this.source = source;

  /**
   * Reference to the test function.
   * @type {string}
   */
  this.message = message;
};


/**
 * Returns a string representing the error object.
 * @return {string} A string representation of the error.
 */
puppet.TestCase.Error_.prototype.toString = function() {
  return 'ERROR in ' + this.source + '\n' + this.message;
};


/**
 * A class for representing test results.  A bag of public properties.
 * @constructor
 * @private
 */
puppet.TestCase.Result_ = function() {

  /**
   * Total number of tests that should have been run.
   * @type {number}
   */
  this.totalCount = 0;

  /**
   * Total number of tests that were actually run.
   * @type {number}
   */
  this.runCount = 0;

  /**
   * Number of successful tests.
   * @type {number}
   */
  this.successCount = 0;

  /**
   * The amount of time the tests took to run.
   * @type {number}
   */
  this.runTime = 0;

  /**
   * The number of files loaded to run this test.
   * @type {number}
   */
  this.numFilesLoaded = 0;

  /**
   * Whether this test case was suppressed by shouldRunTests() returning false.
   * @type {boolean}
   */
  this.testSuppressed = false;

  /**
   * Test results for each test that was run. The test name is always added
   * as the key in the map, and the array of strings is an optional list
   * of failure messages. If the array is empty, the test passed. Otherwise,
   * the test failed.
   * @type {!Object.<string, !Array.<string>>}
   */
  this.resultsByName = {};

  /**
   * Errors encountered while running the test.
   * @type {!Array.<!puppet.TestCase.Error_>}
   */
  this.errors = [];

  /**
   * Messages to show the user after running the test.
   * @type {!Array.<string>}
   */
  this.messages = [];
};


/**
 * The order to run the auto-discovered tests.
 * @enum {string}
 * @private
 */
puppet.TestCase.Order_ = {
  /**
   * This is browser dependent and known to be different in FF and Safari
   * compared to others.
   */
  NATURAL: 'natural',

  /** Random order. */
  RANDOM: 'random',

  /** Sorted based on the name. */
  SORTED: 'sorted'
};


/**
 * The order to run the auto-discovered tests in.
 * @private {string}
 */
puppet.TestCase.prototype.order_ = puppet.TestCase.Order_.SORTED;


/**
 * Error string that is set if an error occurs in setUpPage.
 * @private {string}
 */
puppet.TestCase.prototype.errorBeforeTest_ = '';

/**
 * Pointer to the current test.
 * @private {number}
 */
puppet.TestCase.prototype.currentTestPointer_ = 0;


/**
 * Returns the current test and increments the pointer.
 * @return {puppet.TestCase.Test_} The current test case.
 * @private
 */
puppet.TestCase.prototype.next_ = function() {
  var test;
  while ((test = this.tests_[this.currentTestPointer_++])) {
    if (!this.testsToRun_ || this.testsToRun_[test.name] ||
        this.testsToRun_[this.currentTestPointer_ - 1]) {
      return test;
    }
  }
  return null;
};


/**
 * Reorders the tests depending on the {@code order} field.
 * @param {!Array.<puppet.TestCase.Test_>} tests An array of tests to
 *     reorder.
 * @private
 */
puppet.TestCase.prototype.orderTests_ = function(tests) {
  switch (this.order_) {
    case puppet.TestCase.Order_.RANDOM:
      // Fisher-Yates shuffle
      var i = tests.length;
      while (i > 1) {
        // goog.math.randomInt is inlined to reduce dependencies.
        var j = Math.floor(Math.random() * i); // exclusive
        i--;
        var tmp = tests[i];
        tests[i] = tests[j];
        tests[j] = tmp;
      }
      break;

    case puppet.TestCase.Order_.SORTED:
      tests.sort(function(t1, t2) {
        if (t1.name == t2.name) {
          return 0;
        }
        return t1.name < t2.name ? -1 : 1;
      });
      break;

      // Do nothing for NATURAL.
  }
};


/**
 * Gets the object with all globals.
 *
 * @return {Object} An object with all globals starting with the prefix.
 * @private
 */
puppet.TestCase.getGlobals_ = function() {
  // Look in the global scope for most browsers, on IE we use the little known
  // RuntimeObject which holds references to all globals. We reference this
  // via goog.global so that there isn't an aliasing that throws an exception
  // in Firefox.
  return typeof goog.global['RuntimeObject'] != 'undefined' ?
      goog.global['RuntimeObject'](('test' || '') + '*') : goog.global;
};


/**
 * Gets called before any tests are executed.  Can be overridden to set up the
 * environment for the whole test case.
 * @private
 */
puppet.TestCase.prototype.setUpPage_ = goog.nullFunction;


/**
 * Gets called after all tests have been executed.  Can be overridden to tear
 * down the entire test case.
 * @private
 */
puppet.TestCase.prototype.tearDownPage_ = goog.nullFunction;


/**
 * Gets called before every puppet.TestCase.Test_ is been executed. Can be
 * overridden to add set up functionality to each test.
 * @private
 */
puppet.TestCase.prototype.setUp_ = goog.nullFunction;


/**
 * Gets called after every puppet.TestCase.Test_ has been executed. Can be
 * overriden to add tear down functionality to each test.
 * @private
 */
puppet.TestCase.prototype.tearDown_ = goog.nullFunction;


/**
 * Returns a results for each test that was run.
 *
 * @return {!Object.<string, !Array.<string>>}
 */
puppet.TestCase.prototype.getResults = function() {
  return this.result_.resultsByName;
};


/**
 * Enqueues discovered tests onto Puppet's execution queue.
 */
puppet.TestCase.prototype.run = function() {
  this.autoDiscoverTests_();
  if (!this.shouldRunTests_()) {
    puppet.logging.log(
        'shouldRunTests() returned false, skipping these tests.');
    this.result_.testSuppressed = true;
    this.callback_();
    return;
  }
  this.result_.totalCount = this.tests_.length;
  if (!this.result_.totalCount) {
    throw new Error('No tests auto discovered!');
  }

  var testCase = this;
  puppet.logging.setErrorListener(function() {
    var stack = webdriver.stacktrace.get().join('\n');
    testCase.errorBeforeTest_ = stack || 'Unknown error';
  });
  try {
    this.setUpPage_();
    this.executor_.start(function(opt_errorMsg) {
      if (goog.isDef(opt_errorMsg)) {
        testCase.errorBeforeTest_ = opt_errorMsg;
      }
      testCase.executeNextTest_();
    });
  } catch (e) {
    this.errorBeforeTest_ = e.toString();
  }
};


/**
 * Executes the individual test cases.
 * @private
 */
puppet.TestCase.prototype.executeNextTest_ = function() {
  var currentTest = this.next_();
  var testCase = this;
  puppet.logging.setErrorListener(function() {
    var stack = webdriver.stacktrace.get().join('\n');
    handleError(stack || 'Unknown error');
  });
  if (currentTest) {
    this.result_.resultsByName[currentTest.name] = [];
    this.result_.runCount++;
    if (this.maybeFailTestEarly_(currentTest)) {
      this.executeNextTest_();
    } else {
      try {
        setupTest.call(this);
      } catch (e) {
        handleError(e.toString());
      }
    }
  } else {
    this.endTest_();
  }

  var hasError = false;
  function handleError(errorMsg) {
    hasError = true;
    testCase.doError_(currentTest, errorMsg);
    if (testCase.executor_.isExecuting()) {
      testCase.executor_.stop();
    }
  }

  function setupTest() {
    this.setUp_();
    this.executor_.start(function(opt_errorMsg) {
      if (goog.isDef(opt_errorMsg)) {
        handleError(opt_errorMsg);
        return;
      } else {
        runTest.call(testCase);
      }
    });
  }

  function runTest() {
    currentTest.ref();
    this.executor_.start(function(opt_errorMsg) {
      if (goog.isDef(opt_errorMsg)) {
        handleError(opt_errorMsg);
      }
      tearDownTest.call(testCase);
    });
  }

  function tearDownTest() {
    this.tearDown_();
    this.executor_.start(function(opt_errorMsg) {
      if (goog.isDef(opt_errorMsg)) {
        handleError(opt_errorMsg);
      } else if (!hasError) {
        testCase.doSuccess_(currentTest);
      }
      testCase.executeNextTest_();
    });
  }
};


/**
 * Calls tearDownPage and ends test execution.
 * @private
 */
puppet.TestCase.prototype.endTest_ = function() {
  var testCase = this;
  try {
    this.tearDownPage_();
    this.executor_.start(function(opt_errorMsg) {
      testCase.result_.logSummary();
      if (testCase.result_.runCount == testCase.result_.successCount &&
          testCase.result_.errors.length == 0) {
        testCase.callback_();
      } else {
        testCase.callback_('Not all tests passed.');
      }
    });
  } catch (ignore) {}
};


/**
 * Checks to see if the test should be marked as failed before it is run.
 *
 * If there was an error in setUpPage, we treat that as a failure for all tests
 * and mark them all as having failed.
 *
 * @param {puppet.TestCase.Test_} testCase The current test case.
 * @return {boolean} Whether the test was marked as failed.
 * @private
 */
puppet.TestCase.prototype.maybeFailTestEarly_ = function(testCase) {
  if (this.errorBeforeTest_) {
    this.doError_(testCase, this.errorBeforeTest_);
    return true;
  }
  return false;
};


/**
 * Handles a test that passed.
 * @param {puppet.TestCase.Test_} test The test that passed.
 * @private
 */
puppet.TestCase.prototype.doSuccess_ = function(test) {
  this.result_.successCount++;
  var message = '*** ' + test.name + ' : PASSED ***';
  this.saveMessage_(message);
  puppet.logging.log(message);
};


/**
 * Handles a test that failed.
 * @param {puppet.TestCase.Test_} test The test that failed.
 * @param {string=} opt_errorMsg The error messsage associated with the test.
 * @private
 */
puppet.TestCase.prototype.doError_ = function(test, opt_errorMsg) {
  var message = '*** ' + test.name + ' : FAILED ***';
  puppet.logging.log(message);
  this.saveMessage_(message);
  this.result_.errors.push(this.logError_(test.name, opt_errorMsg));
  var errorMsg = opt_errorMsg || 'Unknown error';
  this.result_.resultsByName[test.name].push(errorMsg);
};


/**
 * @param {string} name Failed test name.
 * @param {string=} opt_errorMsg The exception object associated with the
 *     failure or a string.
 * @return {!puppet.TestCase.Error_} Error object.
 * @private
 */
puppet.TestCase.prototype.logError_ = function(name, opt_errorMsg) {
  var errMsg = opt_errorMsg || '';
  if (errMsg) {
    puppet.logging.log(errMsg);
  }
  var err = new puppet.TestCase.Error_(name, errMsg);
  this.saveMessage_(err.toString());
  return err;
};


/**
 * Saves a message to the result set.
 * @param {string} message The message to save.
 * @private
 */
puppet.TestCase.prototype.saveMessage_ = function(message) {
  this.result_.messages.push(puppet.logging.time() + '  ' + message);
};


/**
 * Logs a summary of test results.
 */
puppet.TestCase.Result_.prototype.logSummary = function() {
  var summary = this.runCount + ' of ' + this.totalCount + ' tests run. ';
  if (this.testSuppressed) {
    summary += 'Tests not run because shouldRunTests() returned false.';
  } else {
    var failures = this.totalCount - this.successCount;
    var suppressionMessage = '';

    var countOfRunTests = this.runCount;
    if (countOfRunTests) {
      failures = countOfRunTests - this.successCount;
      suppressionMessage = ', ' +
          (this.totalCount - countOfRunTests) + ' suppressed by querystring';
    }
    summary += this.successCount + ' passed, ' +
        failures + ' failed' + suppressionMessage + '.\n' +
        Math.round(this.runTime / this.runCount) + ' ms/test. ' +
        this.numFilesLoaded + ' files loaded.';
  }

  puppet.logging.log(summary);
};


/**
 * Can be overridden in test classes to indicate whether the tests in a case
 * should be run in that particular situation.  For example, this could be used
 * to stop tests running in a particular browser, where browser support for
 * the class under test was absent.
 * @return {boolean} Whether any of the tests in the case should be run.
 * @private
 */
puppet.TestCase.prototype.shouldRunTests_ = function() {
  return true;
};


/**
 * Adds any functions defined in the global scope that are prefixed with "test"
 * to the test case.  Also overrides setUp, tearDown, setUpPage, tearDownPage
 * and runTests if they are defined.
 * @private
 */
puppet.TestCase.prototype.autoDiscoverTests_ = function() {
  var testSource = puppet.TestCase.getGlobals_();

  var foundTests = [];

  for (var name in testSource) {

    try {
      var ref = testSource[name];
    } catch (ex) {
      // NOTE(brenneman): When running tests from a file:// URL on Firefox 3.5
      // for Windows, any reference to goog.global.sessionStorage raises
      // an "Operation is not supported" exception. Ignore any exceptions raised
      // by simply accessing global properties.
    }

    if ((new RegExp('^test')).test(name) && goog.isFunction(ref)) {
      foundTests.push(new puppet.TestCase.Test_(name, ref));
    }
  }

  this.orderTests_(foundTests);

  for (var i = 0; i < foundTests.length; i++) {
    this.tests_.push(foundTests[i]);
  }

  if (goog.global['setUp']) {
    this.setUp_ = goog.bind(goog.global['setUp'], goog.global);
  }
  if (goog.global['tearDown']) {
    this.tearDown_ = goog.bind(goog.global['tearDown'], goog.global);
  }
  if (goog.global['setUpPage']) {
    this.setUpPage_ = goog.bind(goog.global['setUpPage'], goog.global);
  }
  if (goog.global['tearDownPage']) {
    this.tearDownPage_ = goog.bind(goog.global['tearDownPage'], goog.global);
  }
  if (goog.global['shouldRunTests']) {
    this.shouldRunTests_ =
        goog.bind(goog.global['shouldRunTests'], goog.global);
  }
};


/**
 * Queues a test fixture command to be executed, e.g., setUpPage, setUp,
 * tearDown, or any test functions themselves.
 *
 * @param {function()} command Test fixture command to be queued.
 * @private
 */
puppet.TestCase.prototype.runFixtureCommand_ = function(command) {
  function fixtureCommand() {
    command();
    return true;
  }
  this.executor_.enqueue(fixtureCommand);
};


/**
 * A class representing a single test function.
 * @param {string} name The test name.
 * @param {function()} ref Reference to the test function.
 * @constructor
 * @private
 */
puppet.TestCase.Test_ = function(name, ref) {
  /**
   * The name of the test.
   * @type {string}
   */
  this.name = name;

  /**
   * Reference to the test function.
   * @type {Function}
   */
  this.ref = ref;
};
