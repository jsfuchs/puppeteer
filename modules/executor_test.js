/* Copyright 2013 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Author: joonlee@google.com (Joon Lee)
 */

goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');
goog.require('puppet.Executor');

var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall();
asyncTestCase.stepTimeout = 5000;

var executor;
var eventsRecorded;
var delayMs = 1;
var retryMs = 20;
var timeoutMs = 110;

function setUp() {
  eventsRecorded = [];
  executor = new puppet.Executor(delayMs, retryMs, timeoutMs, true);
}

function tearDown() {
  if (executor.isExecuting()) {
    executor.stop();
  }
}

function testEnqueuingNoCommandSucceeds() {
  asyncTestCase.waitForAsync('waiting for execution');
  executor.start(function(opt_errorMsg) {
    assertUndefined(opt_errorMsg);
    asyncTestCase.continueTesting();
  });
}

function testFailingCommand() {
  asyncTestCase.waitForAsync('waiting for execution');
  executor.enqueue(recordEvent('A'));
  executor.enqueue(function failingCommand() {
    recordEvent('B')();
    return false;
  });
  executor.enqueue(recordEvent('C'));
  executor.start(function(opt_errorMsg) {
    var numEvents = eventsRecorded.length;
    assertNotUndefined(opt_errorMsg);
    assertEquals('A', eventsRecorded[0]);
    assertEquals('B', eventsRecorded[numEvents - 1]);
    // Check the number of events hasn't changed after a delay to be extra sure
    // that the failing command was not retried after execution stopped.
    window.setTimeout(function() {
      assertEquals(numEvents, eventsRecorded.length);
      asyncTestCase.continueTesting();
    }, retryMs * 2);
  });
}

function testRetryingCommandSucceeds() {
  asyncTestCase.waitForAsync('waiting for execution');
  var calledCount = 0;
  executor.enqueue(function() {
    calledCount++;
    return calledCount > 1;
  });
  executor.start(function(opt_errorMsg) {
    assertUndefined(opt_errorMsg);
    assertEquals(2, calledCount);
    asyncTestCase.continueTesting();
  });
}

function testExecutionStop() {
  asyncTestCase.waitForAsync('waiting for execution');
  executor.enqueue(recordEvent('A'));
  executor.enqueue(function() {
    executor.stop();
    return true;
  });
  executor.enqueue(recordEvent('B'));
  executor.start(function(opt_errorMsg) {
    assertUndefined(opt_errorMsg);
    assertArrayEquals(['A'], eventsRecorded);
    asyncTestCase.continueTesting();
  });
}

function testCannotStopWhenNotExecuting() {
  assertThrows(function() {
    executor.stop();
  });
}

function testEnqueueDefersExecution() {
  asyncTestCase.waitForAsync('waiting for execution');
  executor.enqueue(recordEvent('A'));
  executor.start(function(opt_errorMsg) {
    assertUndefined(opt_errorMsg);
    assertArrayEquals(['A'], eventsRecorded);
    asyncTestCase.continueTesting();
  });
  assertArrayEquals([], eventsRecorded);
}

function testMultipleCommands() {
  asyncTestCase.waitForAsync('waiting for execution');
  executor.enqueue(recordEvent('A'));
  executor.enqueue(recordEvent('B'));
  executor.enqueue(recordEvent('C'));
  executor.start(function(opt_errorMsg) {
    assertUndefined(opt_errorMsg);
    assertArrayEquals(['A', 'B', 'C'], eventsRecorded);
    asyncTestCase.continueTesting();
  });
}

function testCanCallStartFromACallback() {
  asyncTestCase.waitForAsync('waiting for exection');
  executor.enqueue(recordEvent('setUp'));
  executor.start(function(opt_errorMsg) {
    assertUndefined(opt_errorMsg);
    executor.enqueue(recordEvent('test'));
    executor.start(function(opt_errorMsg) {
      assertUndefined(opt_errorMsg);
      executor.enqueue(recordEvent('tearDown'));
      executor.start(function(opt_errorMcsg) {
        assertUndefined(opt_errorMcsg);
        assertArrayEquals(['setUp', 'test', 'tearDown'], eventsRecorded);
        asyncTestCase.continueTesting();
      });
    });
  });
}

function testNestedCommand() {
  asyncTestCase.waitForAsync('waiting for execution');
  executor.enqueue(function() {
    executor.enqueue(recordEvent('A'));
    return true;
  });
  executor.enqueue(recordEvent('B'));
  executor.start(function(opt_errorMsg) {
    assertUndefined(opt_errorMsg);
    assertArrayEquals(['A', 'B'], eventsRecorded);
    asyncTestCase.continueTesting();
  });
}

function testCanEnqueueWhileNotExecuting() {
  assertFalse(executor.isExecuting());
  executor.enqueue(function() { return true; });
  assertFalse(executor.isExecuting());
}

function testCanEnqueueDuringCallback() {
  asyncTestCase.waitForAsync('waiting for execution');
  executor.enqueue(recordEvent('A'));
  executor.start(function(opt_errorMsg) {
    assertUndefined(opt_errorMsg);
    executor.enqueue(recordEvent('B'));
    executor.start(function(opt_errorMsg) {
      assertUndefined(opt_errorMsg);
      assertArrayEquals(['A', 'B'], eventsRecorded);
      asyncTestCase.continueTesting();
    });
  });
}

function testZeroDelayForRetry() {
  asyncTestCase.waitForAsync('waiting for execution');
  executor.setDelayMs(0);
  executor.enqueue(recordEvent('A'));
  executor.start(function(opt_errorMsg) {
    assertUndefined(opt_errorMsg);
    assertArrayEquals(['A'], eventsRecorded);
    asyncTestCase.continueTesting();
  });
}

function testWaitWithSuccessfulNotify() {
  asyncTestCase.waitForAsync('waiting for execution');
  executor.enqueue(function() {
    var waitId = executor.wait('not expected');
    window.setTimeout(function() {
      recordEvent('A')();
      executor.notify(waitId);
    }, retryMs * 2);
    return true;
  });
  executor.enqueue(recordEvent('B'));
  executor.start(function(opt_errorMsg) {
    assertUndefined(opt_errorMsg);
    assertArrayEquals(['A', 'B'], eventsRecorded);
    asyncTestCase.continueTesting();
  });
}

function testWaitWithLateNotifyAndError() {
  asyncTestCase.waitForAsync('waiting for execution');
  var timeoutId;
  executor.enqueue(function() {
    var waitId = executor.wait('expected');
    timeoutId = window.setTimeout(function() {
      recordEvent('A')();
      executor.notify(waitId);
    }, timeoutMs * 10);
    return true;
  });
  executor.enqueue(recordEvent('B'));
  executor.start(function(opt_errorMsg) {
    assertEquals('expected', opt_errorMsg);
    assertArrayEquals([], eventsRecorded);
    asyncTestCase.continueTesting();
    window.clearTimeout(timeoutId);
  });
}

function testWaitWithLateNotifyAndNoError() {
  asyncTestCase.waitForAsync('waiting for execution');
  var timeoutId;
  executor.enqueue(function() {
    var waitId = executor.wait();
    timeoutId = window.setTimeout(function() {
      recordEvent('A')();
      executor.notify(waitId);
    }, timeoutMs * 10);
    return true;
  });
  executor.enqueue(recordEvent('B'));
  executor.start(function(opt_errorMsg) {
    assertUndefined(opt_errorMsg);
    assertArrayEquals(['B'], eventsRecorded);
    asyncTestCase.continueTesting();
    window.clearTimeout(timeoutId);
  });
}

function testInfiniteWait() {
  asyncTestCase.waitForAsync('waiting for execution');
  executor.setCommandTimeoutMs(0);
  executor.enqueue(function() {
    var waitId = executor.wait('unexpected');
    window.setTimeout(function() {
      recordEvent('A')();
      executor.notify(waitId);
    }, 2 * timeoutMs);
    return true;
  });
  executor.enqueue(recordEvent('B'));
  executor.start(function(opt_errorMsg) {
    assertUndefined(opt_errorMsg);
    assertArrayEquals(['A', 'B'], eventsRecorded);
    asyncTestCase.continueTesting();
  });
}

function testDoubleNotifyDoesNotScheduleTwoCommands() {
  asyncTestCase.waitForAsync('waiting for execution');

  // This first command is crafted so that when it finishes,
  // maybeScheduleNextCommand_ is called which will cause the next command to
  // run 1 ms later. However, this command will also calls notify on the next
  // event loop. This test verifies that maybeScheduleNextCommand_ is NOT called
  // because of that notify. If maybeScheduleNextCommand is called again, then
  // execution will stop and the callback will be called before the second
  // command runs.
  executor.enqueue(function() {
    window.setTimeout(function() {
      recordEvent('A')();
      var waitId = executor.wait();
      executor.notify(waitId);
    }, 0);
    return true;
  });
  executor.enqueue(recordEvent('B'));
  executor.start(function(opt_errorMsg) {
    assertUndefined(opt_errorMsg);
    assertArrayEquals(['A', 'B'], eventsRecorded);
    asyncTestCase.continueTesting();
  });
}


function recordEvent(name) {
  return function() {
    eventsRecorded.push(name);
    return true;
  };
}
