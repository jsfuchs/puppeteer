/**
 * Test page loading.
 */

function testNotifyDone() {
  var win;
  var notifyStatusCalled = false;
  var notifyDoneCalled = false;
  window.puppet.runner = {
    notifyStatus: function() {
      notifyStatusCalled = true;
    },
    notifyDone: function() {
      notifyDoneCalled = true;
    }
  };

  if (POPUPS_BROKEN) {
    run(stop);
  }

  // Start a puppet test.
  run(function() {
    win = window.open('load_fail.html');
  });

  // Verify callbacks.
  run(function() {
    return notifyStatusCalled && notifyDoneCalled;
  });

  // Cleanup.
  run(function() {
    win.close();
  });
}
