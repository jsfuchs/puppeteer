/**
 * Test the clear command.
 */

function testClear() {
  // Load a page with a textbox and checkbox. They cannot be created dynamically
  // here, because unfortunately IE doesn't allow the 'type' property to be set.
  var textbox, checkbox;
  run(load, 'clear_page.html');
  run(function() {
    textbox = puppet.elem(id('textbox'));
    checkbox = puppet.elem(id('checkbox'));
  });

  // Test a non-empty textbox can be cleared.
  run(function() {
    textbox.value = 'some text here';
    clear(textbox);
    assert(!textbox.value);
  });

  // Test an empty textbox can be cleared.
  run(function() {
    textbox.value = '';
    clear(textbox);
    assert(!textbox.value);
  });

  // Test a selected checkbox can be cleared.
  run(function() {
    checkbox.checked = true;
    clear(checkbox);
    assert(!checkbox.checked);
  });

  // Test an unselected checkbox can be cleared.
  run(function() {
    checkbox.checked = false;
    clear(checkbox);
    assert(!checkbox.checked);
  });

  // Test that clearing an unclearable element causes an error.
  run(openAndExpectFail, 'clear_fail.html');
}
