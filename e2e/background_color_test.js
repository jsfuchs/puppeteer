/**
 * Tests that retrieving the background color style works in spite of the
 * element flashing when the command accesses it.
 */

function testBackgroundColor() {
  var div;
  run(function() {
    div = createElement('DIV');
    div.id = 'div';
    div.style.backgroundColor = 'blue';
    div.innerHTML = 'test my background color';
  });
  run(style, id('div'), 'background-color', 'rgba(0, 0, 255, 1)');

  // The background color change isn't always synchronous, so check
  // that this doesn't flash between blue and green (b/6789577).
  run(function() {
    div.style.backgroundColor = 'green';
  });
  run(style, id('div'), 'background-color', 'rgba(0, 128, 0, 1)');

  // Change the color to red and check again.
  run(function() {
    div.style.backgroundColor = 'red';
  });
  run(style, id('div'), 'background-color', 'rgba(255, 0, 0, 1)');
}
