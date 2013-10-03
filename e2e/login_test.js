/**
 * @fileoverview Tests GAIA login/logout functionality.
 */

puppet.include('google.js');

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
  // Mock a call failure in the Puppet call and check that it retries.
  run(function() {
    var timesCalled = 0;
    puppet.call = function() {
      timesCalled++;
      if (timesCalled == 1) {
        throw Error('fake failure');
      } else if (timesCalled == 2) {
        puppet.goog.loginCallback('fake@fake.com', {});
      }
    };
  });
  run(puppet.goog.login);

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
