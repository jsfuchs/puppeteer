

/**
 * Tests that result reporting is correct.
 */
function testResultsReporting() {
  run(openAndExpectFail, 'halfPass.htm', /1 passed, 1 failed/);
}
