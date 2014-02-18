/* Copyright 2011 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Author: zhaochao@google.com (Zhao Chao)
 */

goog.require('goog.testing.jsunit');
goog.require('puppet.logging');


function testLog() {
  var called = 0;
  puppet.logging.addLogListener(function(html, text) {
    if (called == 0) {
      assertEquals('test<br>', html);
      assertEquals('test\n', text);
      called++;
    }
  });

  var str = 'test';
  puppet.logging.log(str);
  assertEquals(1, called);
}

function testError() {
  var called = 0;
  puppet.logging.setErrorListener(function() {
    called++;
  });

  var str = 'test';
  puppet.logging.error(str);
  assertEquals(1, called);
}

function testDebugRecorder() {
  var called = 0;
  puppet.logging.addLogListener(function(html, text) {
    if (called == 0) {
      assertEquals('DEBUG: test<br>', html);
      assertEquals('DEBUG: test\n', text);
      called++;
    }
  });

  var str = 'test';
  for (var i = 0; i < 26; i++) {
    puppet.logging.maybeLogDebugMessages(false);
  }
  puppet.logging.debug(str);
  puppet.logging.maybeLogDebugMessages(false);

  assertEquals(1, called);
}
