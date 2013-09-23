/**
 * Override the window's '$' selector to give us a lazy version for puppet.
 *
 * @param {string} selector A CSS selector.
 * @return {function(): !Array.<!Element>} A function that returns an array of
 *     elements that matches the selector.
 */
window.$ = function(selector) {
  var fn = function() {
    return Sizzle(selector, puppet.document());
  };
  // Override toString for better error messages in the puppet runner.
  fn.toString = function() {
    return '$(\'' + selector + '\')';
  };
  return fn;
};
