

/**
 * Test that the present function works.
 */
function testPresent() {
  run(function() {
    var doc = puppet.document();
    var elem = doc.createElement('DIV');
    doc.body.appendChild(elem);
    elem.id = 'present';
  });
  run(present, id('present'));
}
