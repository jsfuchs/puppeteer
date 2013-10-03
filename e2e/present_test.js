/**
 * Test the present function works.
 */

function testPresent() {
  run(function() {
    var elem = createElement('DIV');
    elem.id = 'present';
  });
  run(present, id('present'));
  if (SUPPORTS_WINDOW_ONERROR) {
    run(openAndExpectFail, 'present_fail.html');
  }
}
