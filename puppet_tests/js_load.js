

/**
 * Test successful page loading.
 */
function testLoadSuccess() {
  // Test a successful page load.
  run(load, 'load_page.htm');
}


/**
 * Test unsuccessful page loading.
 */
function testLoadFail() {
  // Test an unsuccessful page load when the client calls puppet.initWindow.
  // This can only be caught if the browser supports window.onerror.
  if (SUPPORTS_WINDOW_ONERROR) {
    run(openAndExpectFail, 'load_fail.htm');
  }
}
