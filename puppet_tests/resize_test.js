

var popup;

function tearDownPage() {
  if (popup) {
    popup.close();
  }
}


function testResizeOnIframe() {
  run(load, 'load_page.htm');
  run(resize, {x: 500, y: 600});
  run(verifyIframeSize, 500, 600);
  run(resize, {y: 700});
  run(verifyIframeSize, 500, 700);
  run(resize, {x: 400});
  run(verifyIframeSize, 400, 700);

  function verifyIframeSize(width, height) {
    var frame = puppet.window().frameElement;
    assertEq(width, frame.offsetWidth);
    assertEq(height, frame.offsetHeight);
  }
}


function testResizeOnPopup() {
  if (POPUPS_BROKEN) {
    return;
  }

  run(function() {
    popup = window.open('', '', 'width=100,height=100');
    switchto(popup);
  });
  run(resize, {x: 200, y: 400});

  // OuterWidth and OuterHeight on mobile devices is not reliable for test
  // verification. See
  // http://www.quirksmode.org/blog/archives/2012/03/windowouterwidt.html.
  // Also, for popup windows, IE always reports 0.
  if (puppet.userAgent.isMobile() || puppet.userAgent.isIE()) {
    return;
  }

  run(function() {
    return 200 == popup.outerWidth && 400 == popup.outerHeight;
  });
}
