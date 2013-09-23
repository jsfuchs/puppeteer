/**
 * Test the switchto command replaces the puppet window and will not overwrite
 * dialog functions if they have already been mocked.
 */


function testSwitchto() {
  run(function() {
    switchto(window);
  });
  run(function() {
    assertEq(window, puppet.window());
    assertEq(window.document, puppet.document());
  });

  var alertMessage;
  // Mock out alert();
  run(function() {
    window.alert = function(message) {
      alertMessage = message;
    };
  });
  run(function() {
    switchto(window);
  });
  run(function() {
    window.alert('foo');
  });
  run(function() {
    assertEq('foo', alertMessage);
  });
}
