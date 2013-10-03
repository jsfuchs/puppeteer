/**
 * Test the MSPointer events.
 */

function shouldRunTests() {
  return puppet.userAgent.isIE(10);
}

function testMspointer() {
  var pointerUpFired = false;
  var mouseUpFired = false;

  run(load, 'pointer_page.html');

  run(function() {
    var container = puppet.elem(id('container'));
    container.addEventListener('MSPointerDown', function(e) {
      container.msSetPointerCapture(e.pointerId);
    });
    container.addEventListener('mouseup', function(e) {
      mouseUpFired = true;
    });
    container.addEventListener('MSPointerUp', function(e) {
      pointerUpFired = true;
    });
  });

  run(drag, id('first'), 25, 25);
  run(function() {
    return pointerUpFired && mouseUpFired;
  });
}
