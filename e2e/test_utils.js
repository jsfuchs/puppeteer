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
 * @fileoverview Utilities to assist with Puppet's self tests.
 */


/**
 * Whether the browser supports window.onerror.
 *
 * @type {boolean}
 */
var SUPPORTS_WINDOW_ONERROR = !puppet.userAgent.isWebKit(0, 534.7) &&
    !puppet.userAgent.isOpera(0, 12);


/**
 * Creates an element of the given type, appends it to the body, and returns it.
 *
 * @param {string} tagName Tag name of the element to create.
 * @return {!Element} Element created.
 */
function createElement(tagName) {
  var doc = puppet.document();
  var elem = doc.createElement(tagName);
  doc.body.appendChild(elem);
  return elem;
}


/**
 * OperaDriver incorrectly injects scripts in popup windows (b/7684695).
 * TODO(user): Remove this constant once this bug is fixed.
 *
 * @type {boolean}
 */
var POPUPS_BROKEN = puppet.userAgent.isOpera();


/**
 * Loads a Puppet test within the Puppet test and waits for it to fail.
 *
 * @param {string} relativeUrl Relative URL to load.
 * @param {!RegExp=} opt_reportValidator A regex to validate against the test
 *     report.
 */
function openAndExpectFail(relativeUrl, opt_reportValidator) {
  if (POPUPS_BROKEN) {
    return;
  }

  // Open a popup window with the test that is expected to fail.
  var loc = window.location.href;
  var url = loc.substring(0, loc.lastIndexOf('/') + 1) + relativeUrl;
  var win = window.open(url, 'fail');
  puppet.assert(!!win, 'Window failed to open: pop-up blocker enabled?');

  // Wait for the test to fail, in which case this function succeeds.
  // On IE, the pop-up window can sometimes load in a borked state, in which the
  // Puppet functions are available, but calling them raises permission errors,
  // and there is no alternative that works other than opening a new window.
  run(function() {
    try {
      return hasTestFailed();
    } catch (e) {
      openAndExpectFail(relativeUrl);
    }
  });

  // Return whether the test failed, closing the window if it has.
  function hasTestFailed() {
    if (!(win['puppet'] && win['puppet']['getStatus'] &&
        win['puppet']['TestStatus'] && win['G_testRunner']['getReport'])) {
      return false;
    }
    var status = win['puppet']['getStatus']();
    puppet.debug('Test should fail but has status: ' + status);
    assert(status != win['puppet']['TestStatus']['PASSED']);
    var success = (status == win['puppet']['TestStatus']['FAILED']);
    if (success && opt_reportValidator) {
      puppet.debug('The test report: ' + win['G_testRunner']['getReport']() +
          ' did not match the expectation (' + opt_reportValidator + ')');
      success = success &&
          opt_reportValidator.test(win['G_testRunner']['getReport']());
    }
    if (success) {
      win.close();
    }
    return success;
  }
}
