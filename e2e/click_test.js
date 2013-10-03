/**
 * Test the click command.
 */

function testClick() {
  function setUrlOffsite(xpath, property) {
    var loc = puppet.location();
    var dir = loc.pathname.substr(0, loc.pathname.lastIndexOf('/'));
    var offsiteUrl = 'http://www.cnn.com' + dir + '/click_page2.html';
    puppet.elem(xpath)[property] = offsiteUrl;
  }

  // Click an offsite link.
  run(load, 'click_page1.html');
  run(setUrlOffsite, id('url1'), 'href');
  run(click, id('url1'));
  run(shown, id('div1'));

  // Click an element inside an offsite link.
  run(load, 'click_page1.html');
  run(setUrlOffsite, id('url2'), 'href');
  run(click, id('linkText'));
  run(shown, id('div1'));

  // Click a form <input type=submit> button.
  run(load, 'click_page1.html');
  run(setUrlOffsite, id('form1'), 'action');
  run(click, id('formInputButton'));
  run(shown, id('div1'));

  // Click a form <input type=image> button.
  run(load, 'click_page1.html');
  run(setUrlOffsite, id('form2'), 'action');
  run(click, id('formInputImage'));
  run(shown, id('div1'));

  // Click a form <button> button
  run(load, 'click_page1.html');
  run(setUrlOffsite, id('form3'), 'action');
  run(click, id('formButton'));
  run(shown, id('div1'));

  // Click an element inside a form <button> button.
  run(load, 'click_page1.html');
  run(setUrlOffsite, id('form3'), 'action');
  run(click, id('text1'));
  run(shown, id('div1'));
}
