goog.require('goog.spell.SpellCheck');


/** Tests that goog.require makes goog.spell.spellCheck available. */
function testSpellCheckAvailable() {
  run(function() {
    new goog.spell.SpellCheck();
  });
}


/** Tests that goog.color is not available */
function testNoColor() {
  run(function() {
    assert(!goog.isDef(goog.color));
  });
}
