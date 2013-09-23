/**
 * Test that tests fail upon timeout.
 */


function testTimeout() {
  run(openAndExpectFail, 'timeout_fail.htm');
}
