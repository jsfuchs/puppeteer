/**
 * Test window scrolling.
 */


function testScroll() {
  run(load, 'scroll_page.htm');
  run(scroll, {x: 500, y: 600});
  run(verifyScroll, 500, 600);
  run(scroll, {y: 700});
  run(verifyScroll, 500, 700);
  run(scroll, {x: 400});
  run(verifyScroll, 400, 700);
  run(scroll, {x: 0, y: 0});

  // Verify scroll to an element.
  run(function() {
    scroll(puppet.elem(id('myDiv')));
  });
  run(function() {
    // Scrolling to an element is not precise.
    var scrollPosition = new goog.dom.DomHelper(
        puppet.document()).getDocumentScroll();
    assertEq(0, scrollPosition.x);
    if (puppet.userAgent.isAndroid(null, 4.1)) {
      assertEq(0, scrollPosition.y);
    } else {
      assert(scrollPosition.y > 1000);
    }
  });
}

function verifyScroll(left, top) {
  var scrollPosition = new goog.dom.DomHelper(
      puppet.document()).getDocumentScroll();
  if (puppet.userAgent.isAndroid(null, 4.1)) {
    // Android prior to jellybean  always returns zero.
    left = 0;
    top = 0;
  }
  assertEq(left, scrollPosition.x);
  assertEq(top, scrollPosition.y);
}
