/**
 * Test the stop function makes the test pass.
 */

function testStop() {
  run(stop);
  run(assert, false);  // This statement is unreachable.
}
