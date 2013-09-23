/**
 * Test css selectors.
 *
 * The sibling operator '+' and nth operators are not tested because the Sizzle
 * library does not support them.
 */


function setUpPage() {
  run(load, 'css_page.htm');
}

function testBasic() {
  run(shown, $('body'));
  run(shown, $('body>ul>p'));
}

function testAttribute() {
  run(shown, $('input[name="continue"][type="button"]'));
}

function testClass() {
  run(count, 3, $('.animal'));
  run(text, $('.animal.feline'), 'Cat');
  run(count, 0, $('.anima'));
  run(shown, $('input.username'));
}

function testId() {
  run(shown, $('ul#recordlist'));
  run(shown, $('#PrefixGoogle'));
}

function testSubStringMatches() {
  run(text, $('a[id^="Prefix"]'), 'google');
  run(text, $('a[id$="Suffix"]'), 'yahoo');
  run(text, $('a[id*="Middle"]'), 'facebook');
  run(shown, $('li:contains("Car")'));
}

function testArrayMatches() {
  run(count, 4, $('li'));
  run(count, 3, $('a'));
}
