/**
 * Test that malformed tests fail.
 */

function testMalformed() {
  // Test that a Puppet test with a syntax error fails.
  // This can only be caught if the browser supports window.onerror.
  if (SUPPORTS_WINDOW_ONERROR) {
    run(openAndExpectFail, 'malformed_fail.html');
  }
}
