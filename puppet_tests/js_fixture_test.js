/**
 * @fileoverview Tests that Puppet invokes the fixture commands.
 */

var sometimesShownElem;

function setUpPage() {
  run(function() {
    var doc = puppet.document();
    var alwaysShownElem = doc.createElement('DIV');
    doc.body.appendChild(alwaysShownElem);
    alwaysShownElem.id = 'alwaysShown';
    alwaysShownElem.style.display = 'block';
    alwaysShownElem.style.width = '30px';
    alwaysShownElem.style.height = '10px';

    sometimesShownElem = doc.createElement('DIV');
    doc.body.appendChild(sometimesShownElem);
    sometimesShownElem.id = 'sometimesShown';
    sometimesShownElem.style.display = 'none';
    sometimesShownElem.style.width = '30px';
    sometimesShownElem.style.height = '10px';
  });
}

function setUp() {
  run(function() {
    sometimesShownElem.style.display = 'block';
  });
}

function tearDown() {
  run(function() {
    sometimesShownElem.style.display = 'none';
  });
}

function test1() {
  run(shown, id('alwaysShown'));
  run(shown, id('sometimesShown'));
}

function test2() {
  run(shown, id('alwaysShown'));
  run(shown, id('sometimesShown'));
}
