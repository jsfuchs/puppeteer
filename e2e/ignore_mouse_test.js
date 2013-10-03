/**
 * Test that an idle page doesn't receive mousemove events.
 */

function testIgnoreMouse() {
  function failListener(e) {
    assert(false, 'event type: ' + e.type);
  }
  var mouseMoveEvents = ['mousemove', 'mouseover', 'mouseout', 'mouseenter',
    'mouseleave', 'touchmove'];
  var div;

  // Make a large div where the mouse will land if it's in the browser window.
  // Listen for 5 seconds and fail immediately if any mouse events occur.
  run(function() {
    div = createElement('DIV');
    div.style.height = '800px';
    div.style.width = '100%';
    goog.events.listen(div, mouseMoveEvents, failListener);
  });
  run(sleep, 5);

  // No mouse events by now so no longer fail immediately.
  run(function() {
    goog.events.unlisten(div, mouseMoveEvents, failListener);
  });

  // Deliberately synthetic mouse events should be heard.
  var mouseMoved = false;
  run(function() {
    goog.events.listen(div, mouseMoveEvents, function(e) {
      mouseMoved = true;
    });
    mouse(div, 'mousemove');
  });
  run(function() {
    return mouseMoved;
  });
}
