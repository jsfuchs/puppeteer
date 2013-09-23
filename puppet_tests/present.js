/**
 * Test the present function works.
 */


function testPresent() {
  run(function() {
    var elem = createElement('DIV');
    elem.id = 'present';
  });
  run(present, id('present'));
  run(openAndExpectFail, 'present_fail.htm');
}
