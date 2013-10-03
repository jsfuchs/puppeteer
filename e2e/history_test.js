/**
 * Test the history commands and how they interact with load.
 */

function testHistory() {
  // Load the first history page and check an element.
  run(load, 'history_page1.html');
  run(shown, id('div1'));

  // Load the second history page and check an element.
  run(load, 'history_page2.html');
  run(shown, id('div2'));

  // Changing only the hash still forces a page load.
  run(load, 'history_page2.html#a');
  run(shown, id('div2'));
  run(function() {
    return puppet.location().hash == '#a';
  });

  // Step back to no hash.
  run(back);
  run(shown, id('div2'));
  run(function() {
    return puppet.location().hash != '#a';
  });

  // Step back to first page.
  run(load(back));
  run(shown, id('div1'));

  // Step forward to second page.
  run(load(forward));
  run(shown, id('div2'));
  run(function() {
    return puppet.location().hash != '#a';
  });

  // Step forward to hash.
  run(forward);
  run(shown, id('div2'));
  run(function() {
    return puppet.location().hash == '#a';
  });
}
