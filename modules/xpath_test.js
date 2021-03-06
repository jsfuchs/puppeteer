/* Copyright 2011 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * 
 */

goog.require('goog.testing.jsunit');
goog.require('puppet.logging');
goog.require('puppet.xpath');
goog.require('wgxpath');

function setUpPage() {
  // Generate the initial html page for testing.
  // <html><body>
  // <div id="div1"></div>
  // <iframe id="iframe1">
  //   <div id="div2">
  //   <iframe id="iframe2">
  //     <div id="div3"></div>
  //   </iframe>
  // </iframe>
  // <iframe id="iframe3">
  // </body></html>
  createElement(document, 'DIV', 'div1');
  var iframe1Doc = createElement(document, 'IFRAME', 'iframe1');
  createElement(iframe1Doc, 'DIV', 'div2');
  var iframe2Doc = createElement(iframe1Doc, 'IFRAME', 'iframe2');
  createElement(iframe2Doc, 'DIV', 'div3');
  createElement(document, 'IFRAME', 'iframe3');
  puppet.logging.setErrorListener(function() {
    throw new Error('XPath evaluation error.');
  });
  wgxpath.install();
}

/**
 * Create an element in the given document of the given tagName with
 * the given id. If its an iframe element, return the iframe document.
 */
function createElement(doc, tagName, id) {
  var elem = doc.createElement(tagName);
  elem.id = id;
  doc.body.appendChild(elem);

  if (tagName == 'IFRAME') {
    var iframeDoc = goog.dom.getFrameContentDocument(elem);
    if (!iframeDoc.body) {
      iframeDoc.appendChild(iframeDoc.createElement('BODY'));
    }
    return iframeDoc;
  }
}

function testXpathQuote() {
  var str = 'foo';
  var res = puppet.xpath.quote(str);
  assertEquals('"foo"', res);

  str = 'foo\'bar';
  res = puppet.xpath.quote(str);
  assertEquals('"foo\'bar"', res);

  str = 'foo"bar';
  res = puppet.xpath.quote(str);
  assertEquals('\'foo"bar\'', res);

  str = 'foo"bar\'';
  res = puppet.xpath.quote(str);
  assertEquals('concat("foo", \'"\', "bar\'")', res);
}

function testXpathLowerCase() {
  var str = 'foo';
  var res = puppet.xpath.lowerCase(str);
  assertEquals(
    'translate(foo,"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")',
    res);
}

function assertXPathResolvesTo(path, ids) {
  var iter = puppet.xpath.resolveXPath(path, window);
  for (var i = 0; i < ids.length; i++) {
    assertEquals(ids[i], iter.iterateNext().id);
  }
  assertEvaluatesToFalse(iter.iterateNext());
}

function testInvalidXpathResolve() {
  var path = 'id("invalid")';
  assertXPathResolvesTo(path, []);
}

function testSingleXpathResolve() {
  var path = 'id("div1")';
  assertXPathResolvesTo(path, ['div1']);
}

function testMultiXpathResolve() {
  var path = 'id("div1")|id("iframe1")';
  assertXPathResolvesTo(path, ['div1', 'iframe1']);
}

function testIframeContentXpathResolve() {
  var path = 'id("iframe1")/content:id("div2")';
  assertXPathResolvesTo(path, ['div2']);
}

function testIframeWithinIframeXpathResolve() {
  var path = 'id("iframe1")/content:id("iframe2")/content:id("div3")';
  assertXPathResolvesTo(path, ['div3']);
}

function testMultiIframeContentXPathResolveRaisesError() {
  var path = '//iframe/content:id("div1")';
  assertThrows(goog.partial(puppet.xpath.resolveXPath, path, window));
}

function testIdXpath() {
  var xpath = /** @type function(?string=, string=) : string*/(xid)();
  assertEquals('//*[@id]', xpath);
}

function testIdWithValueXpath() {
  var xpath = (/** @type function(?string=, string=) : string*/(xid))('He-Man');
  assertEquals('//*[@id="He-Man"]', xpath);
}

function testIdWithContextXpath() {
  var xpath = (/** @type function(?string=, string=) : string*/(xid)
    (null, '//dd'));
  assertEquals('//dd[@id]', xpath);
}

function testTextWithContextXpath() {
  var xpath = (/** @type function(?string=, string=) : string*/(xtext)
    ('Zodiac', '/table//tr/td'));
  assertEquals('/table//tr/td[text()="Zodiac"]', xpath);
}

function testClassWithEmptyStringValue() {
  var xpath = (/** @type function(?string=, string=) : string*/(xclass))('');
  assertEquals('//*[@class=""]', xpath);
}

function testContainsClassXpath() {
  var xpath = xclass.c('Skeletor');
  assertEquals('//*[contains(@class,"Skeletor")]', xpath);
}

function testContainsNameWithContextXpath() {
  var xpath = xname.c('Beast Man', '/ol//li');
  assertEquals('/ol//li[contains(@name,"Beast Man")]', xpath);
}

function testCaseInsensitiveTitleXpath() {
  var xpath = xtitle.i('She-Ra');
  assertEquals('//*[translate(@title,"ABCDEFGHIJKLMNOPQRSTUVWXYZ",' +
               '"abcdefghijklmnopqrstuvwxyz")=translate("She-Ra",' +
               '"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")]',
               xpath);
}

function testCaseInsensitiveStyleWithContextXpath() {
  var xpath = xstyle.i('Mer-Man', '//input');
  assertEquals('//input[translate(@style,"ABCDEFGHIJKLMNOPQRSTUVWXYZ",' +
               '"abcdefghijklmnopqrstuvwxyz")=translate("Mer-Man",' +
               '"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")]',
               xpath);
}

function testContainsCaseInsensitiveHrefXpath() {
  var xpath = xhref.ic('Man-At-Arms/Teela');
  assertEquals('//*[contains(translate(@href,"ABCDEFGHIJKLMNOPQRSTUVWXYZ",' +
               '"abcdefghijklmnopqrstuvwxyz"),translate("Man-At-Arms/Teela",' +
               '"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz"))]',
               xpath);
}

function testContainsCaseInsensitiveTypeWithContextXpath() {
  var xpath = xtype.ic('Tri-Klops', '//script');
  assertEquals('//script[contains(translate(@type,"ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
               '","abcdefghijklmnopqrstuvwxyz"),translate("Tri-Klops",' +
               '"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz"))]',
               xpath);
}

function testNotIdXpath() {
  var xpath = xid.n();
  assertEquals('//*[not(@id)]', xpath);
}

function testNotClassWithValueXpath() {
  var xpath = xclass.n('Lion-O');
  assertEquals('//*[not(@class="Lion-O")]', xpath);
}

function testNotNameWithNullAndContextXpath() {
  var xpath = xname.n(null, '//div');
  assertEquals('//div[not(@name)]', xpath);
}

function testNotTitleWithUndefinedAndContextXpath() {
  var xpath = xtitle.n(undefined, '/body');
  assertEquals('/body[not(@title)]', xpath);
}

function testNotHrefWithEmptyStringAndContextXpath() {
  var xpath = xhref.n('', '//a');
  assertEquals('//a[not(@href="")]', xpath);
}

function testNotValueWithValueAndContextXpath() {
  var xpath = xvalue.n('Jaga', '//textarea');
  assertEquals('//textarea[not(@value="Jaga")]', xpath);
}

function testNotContainsSrcXpath() {
  var xpath = xsrc.nc('Tygra');
  assertEquals('//*[not(contains(@src,"Tygra"))]', xpath);
}

function testNotContainsTextWithContextXpath() {
  var xpath = xtext.nc('Panthro', '//ul');
  assertEquals('//ul[not(contains(text(),"Panthro"))]', xpath);
}

function testNotCaseInsensitiveClassWithValueXpath() {
  var xpath = xclass.ni('Cheetara');
  assertEquals('//*[not(translate(@class,"ABCDEFGHIJKLMNOPQRSTUVWXYZ",' +
               '"abcdefghijklmnopqrstuvwxyz")=translate("Cheetara",' +
               '"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz"))]',
               xpath);
}

function testNotCaseInsensitiveTitleWithValueAndContextXpath() {
  var xpath = xtitle.ni('Pumyra', '//blockquote');
  assertEquals('//blockquote[not(translate(@title,"ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
               '","abcdefghijklmnopqrstuvwxyz")=translate("Pumyra",' +
               '"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz"))]',
               xpath);
}

function testNotCaseInsensitiveContainsHrefXpath() {
  var xpath = xhref.nic('Mumm-Ra');
  assertEquals('//*[not(contains(translate(@href,"ABCDEFGHIJKLMNOPQRSTUVWXYZ"' +
               ',"abcdefghijklmnopqrstuvwxyz"),translate("Mumm-Ra",' +
               '"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")))]',
               xpath);
}

function testNotContainsCaseInsensitiveStyleWithContextXpath() {
  var xpath = xstyle.nic('Zaxx', '//code');
  assertEquals('//code[not(contains(translate(@style,"ABCDEFGHIJKLMNOPQRSTUVW' +
               'XYZ","abcdefghijklmnopqrstuvwxyz"),translate("Zaxx",' +
               '"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")))]',
               xpath);
}

function testAtXpathResolve() {
  var path = at('somePath', 0);
  assertEquals('(somePath)[1]', path);

  path = at('somePath', -1);
  assertEquals('(somePath)[last()]', path);

  path = at('somePath', -2);
  assertEquals('(somePath)[last()-1]', path);
}
