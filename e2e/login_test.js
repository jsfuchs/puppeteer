/**
 * @fileoverview Tests GAIA login/logout functionality.
 */

var originalPuppetCall = puppet.call;

function tearDown() {
  puppet.call = originalPuppetCall;
  run(puppet.goog.logout);
}

function testBasic() {
  run(load, '/');
  run(text, 'id("welcome")', /Welcome new user/);

  run(puppet.goog.signin, 'foo@google.com', 'bar');
  run(load, '/');
  run(text, 'id("welcome")', /Welcome foo@google.com/);

  run(puppet.goog.logout);
  run(load, '/');
  run(text, 'id("welcome")', /Welcome new user/);

  run(puppet.goog.login);
  run(load, '/');
  run(text, 'id("welcome")', /Welcome puppet\d+@google.com/);
}

function testFailure() {
  // Mock a failure callback in the Puppet call and check that it retries.
  run(function() {
    var timesCalled = 0;
    puppet.call = function() {
      timesCalled++;
      if (timesCalled == 1) {
        puppet.goog.failureCallback('fake failure');
      } else if (timesCalled == 2) {
        puppet.goog.loginCallback('fake@fake.com', {});
      }
    };
  });
  run(puppet.goog.login);
}

function testLoginCallbackWithNullRetryFunction() {
  // Test that calling the login callback when the retry function is
  // goog.nullFunction does not raise an assertion failure.
  run(puppet.goog.loginCallback, 'fake@fake.com', {});
}
