

/**
 * Load a Puppet test with a failure. The test should succeed should it also
 * defines a shouldRunTests that return false.
 */
function testLoadSuccess() {
  run(load, 'should_run.htm');
}
