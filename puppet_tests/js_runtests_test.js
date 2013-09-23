

/**
 * Load run_tests.htm and verify failure.
 */
function testFailure() {
  if (SUPPORTS_WINDOW_ONERROR) {
    run(openAndExpectFail, 'run_tests.htm');
  }
}


/**
 * Set runTests filter to run the only valid test which should pass.
 */
function testSuccessFilter() {
  run(load, 'run_tests.htm?runTests=testValid');
}
