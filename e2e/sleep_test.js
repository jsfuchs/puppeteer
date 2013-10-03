/**
 * Test that the sleep command is not subject to a timeout.
 */

function testSleep() {
  // Set the command timeout shorter so this test runs quickly.
  puppet.setCommandTimeoutSecs(5);
  run(sleep, 10);
}
