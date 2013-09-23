

/**
 * Tests that tearDownPage runs even if test fails.
 */
function testTearDownPage() {
  run(openAndExpectFail, 'tearDownPage.htm', /tearDownPage ran/);
}
