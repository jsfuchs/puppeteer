/**
 * Test that tests fail upon timeout.
 */

function testTimeout() {
  run(openAndExpectFail, 'timeout_fail.html', /0 passed, 1 failed/);
}
