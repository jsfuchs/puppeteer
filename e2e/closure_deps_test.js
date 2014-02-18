/**
 * Tests that Closure dependencies are available.
 */

goog.require('goog.color');

function testNamespaceRequiredIsAvailable() {
  run(function() {
    assert(goog.color.isValidColor('red'));
  });
}

function testNamespaceNotRequiredIsNotAvailable() {
  run(function() {
    assert(!goog.isDef(window['goog']['spellCheck']));
  });
}
