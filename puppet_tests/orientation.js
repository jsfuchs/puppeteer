/**
 * Test orientation change.
 */


var androidUserAgent =
    'Mozilla/5.0%20(Linux;%20U;%20Android%204.0.1;%20en-us;' +
    '%20Galaxy%20Nexus%20Build/ICL40)%20AppleWebKit/534.30%20' +
    '(KHTML,%20like%20Gecko)%20Version/4.0%20Mobile%20Safari/534.30';
var orientationChangeFired = false;

function testOrientation() {
  if (puppet.userAgent.isChrome()) {
    // Puppet users sometimes spoof user agents; verify this case works.
    puppet.userAgent.init(androidUserAgent);
  }
  if (!puppet.userAgent.isMobile()) {
    run(stop);
  }
  run(puppet.resizeWidth, '360px');
  run(puppet.resizeHeight, '480px');
  run(load, 'load_page.htm');

  run(orient, 'portrait');
  run(isPortrait);

  run(expectOrientationChangeFire);
  run(orient, 'landscape');
  run(not(isPortrait));
  run(didOrientationChangeFire);

  // Older versions of android have limited orientation support, so stop the
  // test after one orientation change.
  if (puppet.userAgent.isAndroid() && puppet.userAgent.isAndroid(2, 3)) {
    run(stop);
  }

  run(expectOrientationChangeFire);
  run(orient, 'portrait');
  run(isPortrait);
  run(didOrientationChangeFire);

  run(expectOrientationChangeFire);
  run(orient, 'landscape-secondary');
  run(not(isPortrait));
  run(didOrientationChangeFire);
}

function isPortrait() {
  var height = puppet.window().frameElement.clientHeight;
  var width = puppet.window().frameElement.clientWidth;
  return height > width;
}

function expectOrientationChangeFire() {
  orientationChangeFired = false;
  goog.events.listenOnce(puppet.window(), 'orientationchange', function() {
    orientationChangeFired = true;
  });
}

function didOrientationChangeFire() {
  return orientationChangeFired == true;
}
