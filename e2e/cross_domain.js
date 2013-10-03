/**
 * Test the pushHost/popHost cross-domain functionality.
 */

function testCrossDomain() {
  var imageSearchIdentifier =
      xtitle('Google Images') + '|' + xsrc.c('images_logo');

  // Test that the Image Search logo is not on the page.
  run(not(shown), imageSearchIdentifier);

  // Push images.google.com, load it, and check for the homepage logo.
  run(puppet.goog.pushHost, 'images.google.com');
  run(load, '/');
  run(shown, imageSearchIdentifier);

  // Pop images.google.com and check the homepage logo is gone.
  run(puppet.goog.popHost);
  run(load, '/');
  run(not(shown), imageSearchIdentifier);

  // When navigating off domain, WebKit browsers never fire the page load
  // event. Hence, skipping this test for WebKit since there are already page
  // load failure tests.
  if (!puppet.userAgent.isWebKit()) {
    run(openAndExpectFail, 'cross_domain_fail.htm', /cross-domain/);
  }
}
