// Copyright 2012 Google Inc. All Rights Reserved.
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
 * @fileoverview Common Puppet UI test for any document mode.
 */

window.onload = function() {
  run(load, 'load_page.htm');

  var MIN_FRAME_HEIGHT = 300;
  var testFrame, frameContainer;
  run(function() {
    testFrame = document.getElementById('content');
    frameContainer = testFrame.parentNode;
  });

  // Test that the iframe did not render too short on desktop browsers.
  if (!puppet.userAgent.isMobile()) {
    run(function() {
      assert(testFrame.offsetHeight > MIN_FRAME_HEIGHT,
          'iframe too short: ' + testFrame.offsetHeight + 'px');
      puppet.echo(frameContainer.offsetHeight);
      assert(frameContainer.offsetHeight > MIN_FRAME_HEIGHT,
          'container too short: ' + frameContainer.offsetHeight + 'px');
    });
  }

  // Uncomment this and run locally to test the iframe is not too tall.
  // TODO(user): See if we can test this on Forge with the console on.
  /*
  run(function() {
    var maxHeight = (document.compatMode == 'CSS1Compat' ?
        document.documentElement : document.body).clientHeight;
    assert(testFrame.offsetHeight < maxHeight,
        'iframe too tall: ' + testFrame.offsetHeight + 'px');
    assert(frameContainer.offsetHeight < maxHeight,
        'container too tall: ' + frameContainer.offsetHeight + 'px');
  });
  */
};
