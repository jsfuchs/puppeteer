goog.require('goog.color');


/** Tests that goog.require makes goog.color available. */
function testColorAvailable() {
  run(function() {
    assert(goog.color.isValidColor('red'));
  });
}


/** Tests that goog.spellCheck is not available */
function testNoSpellCheck() {
  run(function() {
    assert(!goog.isDef(goog.spellCheck));
  });
}
