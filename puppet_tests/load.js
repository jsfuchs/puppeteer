/**
 * Test page loading.
 */


function testLoad() {
  // Test a successful page load.
  run(load, 'load_page.htm');

  // Test an unsuccessful page load when the client calls puppet.initWindow.
  // This can only be caught if the browser supports window.onerror.
  if (SUPPORTS_WINDOW_ONERROR) {
    run(openAndExpectFail, 'load_fail.htm');
  }
}
