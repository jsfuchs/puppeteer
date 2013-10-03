/**
 * Tests the test runner and fixture functions.
 */

var setUpPageCalls = 0, setUpCalls = 0,
    tearDownCalls = 0, tearDownPageCalls = 0;

function setUpPage() {
  run(assertEq, 0, setUpPageCalls);
  run(assertEq, 0, setUpCalls);
  run(assertEq, 0, tearDownCalls);
  run(assertEq, 0, tearDownPageCalls);
  run(function() {
    setUpPageCalls++;
  });
}

function setUp() {
  run(assertEq, 1, setUpPageCalls);
  run(assertEq, tearDownCalls, setUpCalls);
  run(assertEq, 0, tearDownPageCalls);
  run(function() {
    setUpCalls++;
  });
}

function tearDown() {
  run(assertEq, 1, setUpPageCalls);
  run(assertEq, setUpCalls - 1, tearDownCalls);
  run(assertEq, 0, tearDownPageCalls);
  run(function() {
    tearDownCalls++;
  });
}

function tearDownPage() {
  run(assertEq, 1, setUpPageCalls);
  run(assertEq, setUpCalls, tearDownCalls);
  run(assertEq, 0, tearDownPageCalls);
  run(function() {
    tearDownPageCalls++;
  });
}

function testFixturesExecutedInOrder() {
  run(assertEq, 1, setUpPageCalls);
  run(assertEq, setUpCalls - 1, tearDownCalls);
  run(assertEq, 0, tearDownPageCalls);
}

function testFixturesStillExecutedInOrder() {
  run(assertEq, 1, setUpPageCalls);
  run(assertEq, setUpCalls - 1, tearDownCalls);
  run(assertEq, 0, tearDownPageCalls);
}

function testShouldRunFixture() {
  run(load, 'should_run.html');
}

function testSetUpPageFailure() {
  run(openAndExpectFail, 'setuppage_fail.html', /3 failed/);
}

function testTearDownPageFailure() {
  run(openAndExpectFail, 'teardownpage_fail.html', /tearDownPage ran/);
}

function testRunTestsSuccess() {
  run(load, 'run_tests.html?runTests=testValid');
}

function testRunTestsFailure() {
  run(openAndExpectFail, 'run_tests.html');
}


function testMixedResultsReporting() {
  run(openAndExpectFail, 'mixed_results_fail.html', /1 passed, 1 failed/);
}
