/**
 * Some sanity checks of the Puppet type() function API.
 * The underlying browser automation atom is tested thoroughly.
 */


var textarea;


/**
 * Types a value into the textarea and verifies it appears as expected.
 *
 * @param {string} expectedValue Expected value of text box after typing.
 * @param {...(string|goog.events.KeyCodes)} var_args Values to type.
 *
 */
function checkTyping(expectedValue, var_args) {
  var typeArgs = Array.prototype.slice.call(arguments, 1);
  typeArgs.unshift(textarea);
  run(input, textarea, '');
  run(function() {
    type.apply(null, typeArgs);
  });
  run(text, textarea, expectedValue);
}


function testType() {
  // Create a textarea for typing.
  run(function() {
    textarea = puppet.document().createElement('TEXTAREA');
    puppet.document().body.appendChild(textarea);
  });

  // Make sure typing does nothing when the element is not shown.
  run(function() {
    textarea.style.visibility = 'hidden';
    assert(!type(textarea, 'abc'));
    textarea.style.visibility = 'visible';
  });

  // Test some typing argument combinations.
  run(checkTyping, 'abc', 'abc');
  run(checkTyping, 'abc', 'a', 'bc');
  run(checkTyping, 'abc', ['a', 'bc']);
  var newline = puppet.userAgent.isIE(null, 9) ? '\r\n' : '\n';
  run(checkTyping, 'ab' + newline + 'c', 'ab', bot.Keyboard.Keys.ENTER, 'c');
  run(checkTyping, 'acd', 'ab', bot.Keyboard.Keys.BACKSPACE, ['c', 'd']);

  // The next two commands are regression tests for b/5109217.
  run(checkTyping, '<script>', '<script>');
  run(function() {
    checkTyping('<script>', '<script>');
  });
}
