

/**
 * Tests that the puppet_test_suite deps are available.
 */
function testDateRange() {
  run(function() {
    new goog.date.DateRange();
  });
}
