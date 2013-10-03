/**
 * Test that focus and blur events can be received.
 */

function testFocus() {
  var blurReceived = false;
  var focusReceived = false;
  run(function() {
    var target = createElement('INPUT');
    goog.events.listen(target, 'focus', function() {
      focusReceived = true;
    });
    goog.events.listen(target, 'blur', function() {
      blurReceived = true;
    });
  });

  // Calling focus here tests that we correctly overwrote window.focus.
  run(focus, '//body');
  run(function() {
    return !focusReceived && !blurReceived;
  });

  run(focus, '//input');
  run(function() {
    return focusReceived;
  });
  run(blur, '//input');
  run(function() {
    return blurReceived;
  });
}
