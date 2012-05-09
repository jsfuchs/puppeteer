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
 * Loads a Puppet test within the Puppet test and waits for it to fail.
 *
 * @param {string} relativeUrl Relative URL to load.
 */
function openAndExpectFail(relativeUrl) {
  // Open a popup window with the test that is expected to fail.
  var loc = window.location.href;
  var url = loc.substring(0, loc.lastIndexOf('/') + 1) + relativeUrl;
  var win = window.open(url, 'fail');
  puppet.assert(!!win, 'Window failed to open: pop-up blocker enabled?');

  // Wait for the test to fail, in which case this function succeeds.
  run(function() {
    if (!(win.puppet && win.puppet.getStatus && win.puppet.TestStatus)) {
      return false;
    }
    var status = win.puppet.getStatus();
    puppet.debug('Test should fail but has status: ' + status);
    assert(status != win.puppet.TestStatus.PASSED);
    var success = (status == win.puppet.TestStatus.FAILED);
    if (success) {
      win.close();
    }
    return success;
  });
}
