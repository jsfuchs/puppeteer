

/**
 * Tests that a setUpPage failure marks all tests as failed.
 */
function testSetUpPage() {
  run(openAndExpectFail, 'setUpPage.htm', /3 failed/);
}
