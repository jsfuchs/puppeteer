/**
 * Tests that the assert commands works.
 */

function testAssert() {
  // Test an assert that should succeed.
  run(assert, true);

  // Test an assert that should fail.
  run(openAndExpectFail, 'assert_fail.html');
}
