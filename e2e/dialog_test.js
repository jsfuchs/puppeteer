/**
 * Tests the commands for responding to dialogs (alerts, confirms, and prompts).
 */

function testDialog() {
  // Test responding to alert dialogs.
  run(dialog(function() {
    puppet.window().alert('foo');
  }));
  run(dialog(function() {
    puppet.window().alert('foo');
  }, undefined, 'foo'));
  run(dialog(function() {
    puppet.window().alert('foo');
  }, undefined, /fo/));

  // Test responding to confirm dialogs.
  run(dialog(function() {
    assert(puppet.window().confirm('foo'));
  }, true, 'foo'));
  run(dialog(function() {
    assert(!puppet.window().confirm('foo'));
  }, false, /fo/));

  // Test responding to prompt dialogs.
  run(dialog(function() {
    assertEq('', puppet.window().prompt('foo'));
  }, '', 'foo'));
  run(dialog(function() {
    assertEq('bar', puppet.window().prompt('foo'));
  }, 'bar', /fo/));

  // Test that dialog works after page load without load() call (b/5405271).
  run(function() {
    puppet.location().href = '../blank.htm';
  });
  run(dialog(function() {
    puppet.window().alert('foo');
  }));

  // Test that the test fails when an expected dialog doesn't appear.
  run(openAndExpectFail, 'dialog_expected_fail.html?dialog=alert');
  run(openAndExpectFail, 'dialog_expected_fail.html?dialog=confirm');
  run(openAndExpectFail, 'dialog_expected_fail.html?dialog=prompt');

  // Test that the test fails when an unexpected dialog appears.
  run(openAndExpectFail, 'dialog_unexpected_fail.html?dialog=alert');
  run(openAndExpectFail, 'dialog_unexpected_fail.html?dialog=confirm');
  run(openAndExpectFail, 'dialog_unexpected_fail.html?dialog=prompt');

  // Test that the test fails when a dialog does not have the expected message.
  run(openAndExpectFail, 'dialog_message_fail.html?dialog=alert');
  run(openAndExpectFail, 'dialog_message_fail.html?dialog=confirm');
  run(openAndExpectFail, 'dialog_message_fail.html?dialog=prompt');
}
