// Copyright 2012 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Configures which symbols should be part of the user-visible
 * Puppet API.
 */

goog.require('bot');
goog.require('bot.Keyboard');
goog.require('bot.Keyboard.Key');
goog.require('bot.Keyboard.Keys');
goog.require('bot.Mouse.Button');
goog.require('goog.userAgent');
goog.require('puppet');
goog.require('puppet.Mouse');
goog.require('puppet.Touchscreen');
goog.require('puppet.logging');
goog.require('puppet.userAgent');
goog.require('puppet.xpath');

goog.setTestOnly('puppet exports');

//////////////////////////////////////////////////////////////////////////////
//
//  bot.dom
//
//////////////////////////////////////////////////////////////////////////////
goog.exportSymbol('bot.dom.isShown', bot.dom.isShown);


//////////////////////////////////////////////////////////////////////////////
//
//  bot.events
//  DO NOT add any exports here as we plan to eliminate custom event firing
//  from the official API.
//
//////////////////////////////////////////////////////////////////////////////
goog.exportSymbol('bot.events', bot.events);
goog.exportSymbol('bot.events.fire', bot.events.fire);
goog.exportSymbol('bot.events.EventType', bot.events.EventType);
goog.exportSymbol('bot.events.EventType.CLICK',
                  bot.events.EventType.CLICK);
goog.exportSymbol('bot.events.EventType.FOCUSIN',
                  bot.events.EventType.FOCUSIN);
goog.exportSymbol('bot.events.EventType.FOCUSOUT',
                  bot.events.EventType.FOCUSOUT);
goog.exportSymbol('bot.events.EventType.MOUSEDOWN',
                  bot.events.EventType.MOUSEDOWN);
goog.exportSymbol('bot.events.EventType.MOUSEMOVE',
                  bot.events.EventType.MOUSEMOVE);
goog.exportSymbol('bot.events.EventType.MOUSEOVER',
                  bot.events.EventType.MOUSEOVER);
goog.exportSymbol('bot.events.EventType.MOUSEUP',
                  bot.events.EventType.MOUSEUP);
goog.exportSymbol('bot.events.EventType.TOUCHEND',
                  bot.events.EventType.TOUCHEND);
goog.exportSymbol('bot.events.EventType.TOUCHMOVE',
                  bot.events.EventType.TOUCHMOVE);
goog.exportSymbol('bot.events.EventType.TOUCHSTART',
                  bot.events.EventType.TOUCHSTART);


//////////////////////////////////////////////////////////////////////////////
//
//  bot.Keyboard
//
//////////////////////////////////////////////////////////////////////////////
goog.exportSymbol('bot.Keyboard', bot.Keyboard);
goog.exportProperty(bot.Keyboard.prototype, 'isPressed',
                    bot.Keyboard.prototype.isPressed);
goog.exportProperty(bot.Keyboard.prototype, 'moveCursor',
                    bot.Keyboard.prototype.moveCursor);
goog.exportProperty(bot.Keyboard.prototype, 'pressKey',
                    bot.Keyboard.prototype.pressKey);
goog.exportProperty(bot.Keyboard.prototype, 'releaseKey',
                    bot.Keyboard.prototype.releaseKey);


//////////////////////////////////////////////////////////////////////////////
//
//  bot.Keyboard.Key
//
//////////////////////////////////////////////////////////////////////////////
goog.exportSymbol('bot.Keyboard.Key', bot.Keyboard.Key);
goog.exportProperty(bot.Keyboard.Key, 'fromChar',
                    bot.Keyboard.Key.fromChar);


//////////////////////////////////////////////////////////////////////////////
//
//  bot.Keyboard.Keys
//
//////////////////////////////////////////////////////////////////////////////
goog.exportSymbol('bot.Keyboard.Keys', bot.Keyboard.Keys);
goog.exportProperty(bot.Keyboard.Keys, 'BACKSPACE',
                    bot.Keyboard.Keys.BACKSPACE);
goog.exportProperty(bot.Keyboard.Keys, 'TAB', bot.Keyboard.Keys.TAB);
goog.exportProperty(bot.Keyboard.Keys, 'ENTER', bot.Keyboard.Keys.ENTER);
goog.exportProperty(bot.Keyboard.Keys, 'SHIFT', bot.Keyboard.Keys.SHIFT);
goog.exportProperty(bot.Keyboard.Keys, 'CONTROL', bot.Keyboard.Keys.CONTROL);
goog.exportProperty(bot.Keyboard.Keys, 'ALT', bot.Keyboard.Keys.ALT);
goog.exportProperty(bot.Keyboard.Keys, 'PAUSE', bot.Keyboard.Keys.PAUSE);
goog.exportProperty(bot.Keyboard.Keys, 'CAPS_LOCK',
                    bot.Keyboard.Keys.CAPS_LOCK);
goog.exportProperty(bot.Keyboard.Keys, 'ESC', bot.Keyboard.Keys.ESC);
goog.exportProperty(bot.Keyboard.Keys, 'SPACE', bot.Keyboard.Keys.SPACE);
goog.exportProperty(bot.Keyboard.Keys, 'PAGE_UP', bot.Keyboard.Keys.PAGE_UP);
goog.exportProperty(bot.Keyboard.Keys, 'PAGE_DOWN',
                    bot.Keyboard.Keys.PAGE_DOWN);
goog.exportProperty(bot.Keyboard.Keys, 'END', bot.Keyboard.Keys.END);
goog.exportProperty(bot.Keyboard.Keys, 'HOME', bot.Keyboard.Keys.HOME);
goog.exportProperty(bot.Keyboard.Keys, 'LEFT', bot.Keyboard.Keys.LEFT);
goog.exportProperty(bot.Keyboard.Keys, 'UP', bot.Keyboard.Keys.UP);
goog.exportProperty(bot.Keyboard.Keys, 'RIGHT', bot.Keyboard.Keys.RIGHT);
goog.exportProperty(bot.Keyboard.Keys, 'DOWN', bot.Keyboard.Keys.DOWN);
goog.exportProperty(bot.Keyboard.Keys, 'PRINT_SCREEN',
                    bot.Keyboard.Keys.PRINT_SCREEN);
goog.exportProperty(bot.Keyboard.Keys, 'INSERT', bot.Keyboard.Keys.INSERT);
goog.exportProperty(bot.Keyboard.Keys, 'DELETE', bot.Keyboard.Keys.DELETE);
goog.exportProperty(bot.Keyboard.Keys, 'ZERO', bot.Keyboard.Keys.ZERO);
goog.exportProperty(bot.Keyboard.Keys, 'ONE', bot.Keyboard.Keys.ONE);
goog.exportProperty(bot.Keyboard.Keys, 'TWO', bot.Keyboard.Keys.TWO);
goog.exportProperty(bot.Keyboard.Keys, 'THREE', bot.Keyboard.Keys.THREE);
goog.exportProperty(bot.Keyboard.Keys, 'FOUR', bot.Keyboard.Keys.FOUR);
goog.exportProperty(bot.Keyboard.Keys, 'FIVE', bot.Keyboard.Keys.FIVE);
goog.exportProperty(bot.Keyboard.Keys, 'SIX', bot.Keyboard.Keys.SIX);
goog.exportProperty(bot.Keyboard.Keys, 'SEVEN', bot.Keyboard.Keys.SEVEN);
goog.exportProperty(bot.Keyboard.Keys, 'EIGHT', bot.Keyboard.Keys.EIGHT);
goog.exportProperty(bot.Keyboard.Keys, 'NINE', bot.Keyboard.Keys.NINE);
goog.exportProperty(bot.Keyboard.Keys, 'A', bot.Keyboard.Keys.A);
goog.exportProperty(bot.Keyboard.Keys, 'B', bot.Keyboard.Keys.B);
goog.exportProperty(bot.Keyboard.Keys, 'C', bot.Keyboard.Keys.C);
goog.exportProperty(bot.Keyboard.Keys, 'D', bot.Keyboard.Keys.D);
goog.exportProperty(bot.Keyboard.Keys, 'E', bot.Keyboard.Keys.E);
goog.exportProperty(bot.Keyboard.Keys, 'F', bot.Keyboard.Keys.F);
goog.exportProperty(bot.Keyboard.Keys, 'G', bot.Keyboard.Keys.G);
goog.exportProperty(bot.Keyboard.Keys, 'H', bot.Keyboard.Keys.H);
goog.exportProperty(bot.Keyboard.Keys, 'I', bot.Keyboard.Keys.I);
goog.exportProperty(bot.Keyboard.Keys, 'J', bot.Keyboard.Keys.J);
goog.exportProperty(bot.Keyboard.Keys, 'K', bot.Keyboard.Keys.K);
goog.exportProperty(bot.Keyboard.Keys, 'L', bot.Keyboard.Keys.L);
goog.exportProperty(bot.Keyboard.Keys, 'M', bot.Keyboard.Keys.M);
goog.exportProperty(bot.Keyboard.Keys, 'N', bot.Keyboard.Keys.N);
goog.exportProperty(bot.Keyboard.Keys, 'O', bot.Keyboard.Keys.O);
goog.exportProperty(bot.Keyboard.Keys, 'P', bot.Keyboard.Keys.P);
goog.exportProperty(bot.Keyboard.Keys, 'Q', bot.Keyboard.Keys.Q);
goog.exportProperty(bot.Keyboard.Keys, 'R', bot.Keyboard.Keys.R);
goog.exportProperty(bot.Keyboard.Keys, 'S', bot.Keyboard.Keys.S);
goog.exportProperty(bot.Keyboard.Keys, 'T', bot.Keyboard.Keys.T);
goog.exportProperty(bot.Keyboard.Keys, 'U', bot.Keyboard.Keys.U);
goog.exportProperty(bot.Keyboard.Keys, 'V', bot.Keyboard.Keys.V);
goog.exportProperty(bot.Keyboard.Keys, 'W', bot.Keyboard.Keys.W);
goog.exportProperty(bot.Keyboard.Keys, 'X', bot.Keyboard.Keys.X);
goog.exportProperty(bot.Keyboard.Keys, 'Y', bot.Keyboard.Keys.Y);
goog.exportProperty(bot.Keyboard.Keys, 'Z', bot.Keyboard.Keys.Z);
goog.exportProperty(bot.Keyboard.Keys, 'META', bot.Keyboard.Keys.META);
goog.exportProperty(bot.Keyboard.Keys, 'META_RIGHT',
                    bot.Keyboard.Keys.META_RIGHT);
goog.exportProperty(bot.Keyboard.Keys, 'CONTEXT_MENU',
                    bot.Keyboard.Keys.CONTEXT_MENU);
goog.exportProperty(bot.Keyboard.Keys, 'NUM_ZERO',
                    bot.Keyboard.Keys.NUM_ZERO);
goog.exportProperty(bot.Keyboard.Keys, 'NUM_ONE', bot.Keyboard.Keys.NUM_ONE);
goog.exportProperty(bot.Keyboard.Keys, 'NUM_TWO', bot.Keyboard.Keys.NUM_TWO);
goog.exportProperty(bot.Keyboard.Keys, 'NUM_THREE',
                    bot.Keyboard.Keys.NUM_THREE);
goog.exportProperty(bot.Keyboard.Keys, 'NUM_FOUR',
                    bot.Keyboard.Keys.NUM_FOUR);
goog.exportProperty(bot.Keyboard.Keys, 'NUM_FIVE',
                    bot.Keyboard.Keys.NUM_FIVE);
goog.exportProperty(bot.Keyboard.Keys, 'NUM_SIX', bot.Keyboard.Keys.NUM_SIX);
goog.exportProperty(bot.Keyboard.Keys, 'NUM_SEVEN',
                    bot.Keyboard.Keys.NUM_SEVEN);
goog.exportProperty(bot.Keyboard.Keys, 'NUM_EIGHT',
                    bot.Keyboard.Keys.NUM_EIGHT);
goog.exportProperty(bot.Keyboard.Keys, 'NUM_NINE',
                    bot.Keyboard.Keys.NUM_NINE);
goog.exportProperty(bot.Keyboard.Keys, 'NUM_MULTIPLY',
                    bot.Keyboard.Keys.NUM_MULTIPLY);
goog.exportProperty(bot.Keyboard.Keys, 'NUM_PLUS',
                    bot.Keyboard.Keys.NUM_PLUS);
goog.exportProperty(bot.Keyboard.Keys, 'NUM_MINUS',
                    bot.Keyboard.Keys.NUM_MINUS);
goog.exportProperty(bot.Keyboard.Keys, 'NUM_PERIOD',
                    bot.Keyboard.Keys.NUM_PERIOD);
goog.exportProperty(bot.Keyboard.Keys, 'NUM_DIVISION',
                    bot.Keyboard.Keys.NUM_DIVISION);
goog.exportProperty(bot.Keyboard.Keys, 'NUM_LOCK',
                    bot.Keyboard.Keys.NUM_LOCK);
goog.exportProperty(bot.Keyboard.Keys, 'F1', bot.Keyboard.Keys.F1);
goog.exportProperty(bot.Keyboard.Keys, 'F2', bot.Keyboard.Keys.F2);
goog.exportProperty(bot.Keyboard.Keys, 'F3', bot.Keyboard.Keys.F3);
goog.exportProperty(bot.Keyboard.Keys, 'F4', bot.Keyboard.Keys.F4);
goog.exportProperty(bot.Keyboard.Keys, 'F5', bot.Keyboard.Keys.F5);
goog.exportProperty(bot.Keyboard.Keys, 'F6', bot.Keyboard.Keys.F6);
goog.exportProperty(bot.Keyboard.Keys, 'F7', bot.Keyboard.Keys.F7);
goog.exportProperty(bot.Keyboard.Keys, 'F8', bot.Keyboard.Keys.F8);
goog.exportProperty(bot.Keyboard.Keys, 'F9', bot.Keyboard.Keys.F9);
goog.exportProperty(bot.Keyboard.Keys, 'F10', bot.Keyboard.Keys.F10);
goog.exportProperty(bot.Keyboard.Keys, 'F11', bot.Keyboard.Keys.F11);
goog.exportProperty(bot.Keyboard.Keys, 'F12', bot.Keyboard.Keys.F12);
goog.exportProperty(bot.Keyboard.Keys, 'EQUALS', bot.Keyboard.Keys.EQUALS);
goog.exportProperty(bot.Keyboard.Keys, 'HYPHEN', bot.Keyboard.Keys.HYPHEN);
goog.exportProperty(bot.Keyboard.Keys, 'COMMA', bot.Keyboard.Keys.COMMA);
goog.exportProperty(bot.Keyboard.Keys, 'PERIOD', bot.Keyboard.Keys.PERIOD);
goog.exportProperty(bot.Keyboard.Keys, 'SLASH', bot.Keyboard.Keys.SLASH);
goog.exportProperty(bot.Keyboard.Keys, 'BACKTICK',
                    bot.Keyboard.Keys.BACKTICK);
goog.exportProperty(bot.Keyboard.Keys, 'OPEN_BRACKET',
                    bot.Keyboard.Keys.OPEN_BRACKET);
goog.exportProperty(bot.Keyboard.Keys, 'BACKSLASH',
                    bot.Keyboard.Keys.BACKSLASH);
goog.exportProperty(bot.Keyboard.Keys, 'CLOSE_BRACKET',
                    bot.Keyboard.Keys.CLOSE_BRACKET);
goog.exportProperty(bot.Keyboard.Keys, 'SEMICOLON',
                    bot.Keyboard.Keys.SEMICOLON);
goog.exportProperty(bot.Keyboard.Keys, 'APOSTROPHE',
                    bot.Keyboard.Keys.APOSTROPHE);


//////////////////////////////////////////////////////////////////////////////
//
//  bot.Mouse
//
//////////////////////////////////////////////////////////////////////////////
goog.exportProperty(puppet.Mouse.prototype, 'pressButton',
                    puppet.Mouse.prototype.pressButton);
goog.exportProperty(puppet.Mouse.prototype, 'releaseButton',
                    puppet.Mouse.prototype.releaseButton);
goog.exportProperty(puppet.Mouse.prototype, 'move',
                    puppet.Mouse.prototype.move);
goog.exportProperty(puppet.Mouse.prototype, 'scroll',
                    puppet.Mouse.prototype.scroll);


//////////////////////////////////////////////////////////////////////////////
//
//  bot.Mouse.Button
//
//////////////////////////////////////////////////////////////////////////////
goog.exportSymbol('bot.Mouse.Button', bot.Mouse.Button);
goog.exportProperty(bot.Mouse.Button, 'LEFT', bot.Mouse.Button.LEFT);
goog.exportProperty(bot.Mouse.Button, 'MIDDLE', bot.Mouse.Button.MIDDLE);
goog.exportProperty(bot.Mouse.Button, 'RIGHT', bot.Mouse.Button.RIGHT);


//////////////////////////////////////////////////////////////////////////////
//
//  puppet.Touchscreen
//
//////////////////////////////////////////////////////////////////////////////
goog.exportProperty(puppet.Touchscreen.prototype, 'isPressed',
                    puppet.Touchscreen.prototype.isPressed);
goog.exportProperty(puppet.Touchscreen.prototype, 'move',
                    puppet.Touchscreen.prototype.move);
goog.exportProperty(puppet.Touchscreen.prototype, 'press',
                    puppet.Touchscreen.prototype.press);
goog.exportProperty(puppet.Touchscreen.prototype, 'release',
                    puppet.Touchscreen.prototype.release);


/**
 * A wrapper for goog.exportSymbol that overrides the function's toString method
 * so that puppet logging is more readable.
 *
 * @param {string} name Unobfuscated name to export.
 * @param {*} object Object the name should point to.
 */
puppet.exportSymbol = function(name, object) {
  if (!goog.isDefAndNotNull(object)) {
    throw new Error(name);
  }
  object.toString = function() {
    return name;
  };
  goog.exportSymbol(name, object);

  // To export window properties in IE9 standards mode, we need to use
  // Object.defineProperty; goog.exportSymbol('focus', focus) does not work.
  if (name in window && goog.userAgent.IE &&
      goog.userAgent.isVersionOrHigher(9) && 'defineProperty' in Object) {
    Object.defineProperty(window, name, {
      value: object,
      writable: true
    });
  }
};


//////////////////////////////////////////////////////////////////////////////
//
//  puppet
//
//////////////////////////////////////////////////////////////////////////////


puppet.exportSymbol('all', all);
puppet.exportSymbol('assert', assert);
puppet.exportSymbol('assertEq', assertEq);
puppet.exportSymbol('assertNotEq', assertNotEq);
puppet.exportSymbol('attribute', attribute);
puppet.exportSymbol('back', back);
puppet.exportSymbol('blur', blur);
puppet.exportSymbol('clear', clear);
puppet.exportSymbol('click', click);
puppet.exportSymbol('count', count);
puppet.exportSymbol('dialog', dialog);
puppet.exportSymbol('doubleclick', doubleclick);
puppet.exportSymbol('drag', drag);
puppet.exportSymbol('focus', focus);
puppet.exportSymbol('follow', follow);
puppet.exportSymbol('forward', forward);
puppet.exportSymbol('input', input);
puppet.exportSymbol('load', load);
puppet.exportSymbol('mouse', mouse);
puppet.exportSymbol('movemouse', movemouse);
puppet.exportSymbol('none', none);
puppet.exportSymbol('not', not);
puppet.exportSymbol('opacity', opacity);
puppet.exportSymbol('orient', orient);
puppet.exportSymbol('pinch', pinch);
puppet.exportSymbol('present', present);
puppet.exportSymbol('property', property);
puppet.exportSymbol('reload', reload);
puppet.exportSymbol('resize', resize);
puppet.exportSymbol('rightclick', rightclick);
puppet.exportSymbol('rotate', rotate);
puppet.exportSymbol('run', run);
puppet.exportSymbol('scroll', scroll);
puppet.exportSymbol('scrollmouse', scrollmouse);
puppet.exportSymbol('selected', selected);
puppet.exportSymbol('select', select);
puppet.exportSymbol('shown', shown);
puppet.exportSymbol('sleep', sleep);
puppet.exportSymbol('some', some);
puppet.exportSymbol('stop', stop);
puppet.exportSymbol('style', style);
puppet.exportSymbol('swipe', swipe);
puppet.exportSymbol('switchto', switchto);
puppet.exportSymbol('tap', tap);
puppet.exportSymbol('text', text);
puppet.exportSymbol('type', type);
puppet.exportSymbol('puppet', puppet);
puppet.exportSymbol('puppet.PARAMS', puppet.PARAMS);
puppet.exportSymbol('puppet.PARAMS.fullpage', puppet.PARAMS.fullpage);
puppet.exportSymbol('puppet.PARAMS.time', puppet.PARAMS.time);
puppet.exportSymbol('puppet.TestStatus', puppet.TestStatus);
puppet.exportSymbol('puppet.addElemListener', puppet.addElemListener);
puppet.exportSymbol('puppet.addFinalizer', puppet.finalize.addFinalizer);
puppet.exportSymbol('puppet.addMenuItems', puppet.addMenuItems);
puppet.exportSymbol('puppet.appendLoadParams', puppet.appendLoadParams);
puppet.exportSymbol('puppet.assert', puppet.assert);
puppet.exportSymbol('puppet.attribute', puppet.attribute);
puppet.exportSymbol('puppet.call', puppet.call);
puppet.exportSymbol('puppet.clientRect', puppet.clientRect);
puppet.exportSymbol('puppet.command', puppet.command);
puppet.exportSymbol('puppet.debug', puppet.debug);
puppet.exportSymbol('puppet.define', puppet.define);
puppet.exportSymbol('puppet.document', puppet.document);
puppet.exportSymbol('puppet.echo', puppet.echo);
puppet.exportSymbol('puppet.elem', puppet.elem);
puppet.exportSymbol('puppet.elems', puppet.elems);
puppet.exportSymbol('puppet.focus', puppet.focus);
puppet.exportSymbol('puppet.getCommandTimeoutSecs',
                    puppet.getCommandTimeoutSecs);
puppet.exportSymbol('puppet.getStatus', puppet.getStatus);
puppet.exportSymbol('puppet.include', puppet.include);
puppet.exportSymbol('puppet.initWindow', puppet.initWindow);
puppet.exportSymbol('puppet.keyboard', puppet.keyboard);
puppet.exportSymbol('puppet.left', puppet.left);
puppet.exportSymbol('puppet.location', puppet.location);
puppet.exportSymbol('puppet.match', puppet.match);
puppet.exportSymbol('puppet.matches', puppet.matches);
puppet.exportSymbol('puppet.mouse', puppet.mouse);
puppet.exportSymbol('puppet.request', puppet.request);
puppet.exportSymbol('puppet.resizeHeight', puppet.resizeHeight);
puppet.exportSymbol('puppet.resizeWidth', puppet.resizeWidth);
puppet.exportSymbol('puppet.setCommandTimeoutSecs',
                    puppet.setCommandTimeoutSecs);
puppet.exportSymbol('puppet.setDelayMs', puppet.setDelayMs);
puppet.exportSymbol('puppet.setForceMouseActions', puppet.setForceMouseActions);
puppet.exportSymbol('puppet.setRetryMs', puppet.setRetryMs);
puppet.exportSymbol('puppet.style', puppet.style);
puppet.exportSymbol('puppet.testUrl', puppet.testUrl);
puppet.exportSymbol('puppet.text', puppet.text);
puppet.exportSymbol('puppet.top', puppet.top);
puppet.exportSymbol('puppet.touchscreen', puppet.touchscreen);
puppet.exportSymbol('puppet.window', puppet.window);
goog.exportProperty(puppet.TestStatus, 'FAILED', puppet.TestStatus.FAILED);
goog.exportProperty(puppet.TestStatus, 'LOADED', puppet.TestStatus.LOADED);
goog.exportProperty(puppet.TestStatus, 'PASSED', puppet.TestStatus.PASSED);


//////////////////////////////////////////////////////////////////////////////
//
//  puppet.logging
//
//////////////////////////////////////////////////////////////////////////////
puppet.exportSymbol('puppet.logging.addLogListener',
                    puppet.logging.addLogListener);
puppet.exportSymbol('puppet.logging.debug', puppet.logging.debug);
puppet.exportSymbol('puppet.logging.log', puppet.logging.log);
puppet.exportSymbol('puppet.logging.error', puppet.logging.error);
puppet.exportSymbol('puppet.logging.toString', puppet.logging.toString);


//////////////////////////////////////////////////////////////////////////////
//
//  puppet.params
//
//////////////////////////////////////////////////////////////////////////////
puppet.exportSymbol('puppet.params.declareBoolean',
                    puppet.params.declareBoolean);
puppet.exportSymbol('puppet.params.declareNumber', puppet.params.declareNumber);
puppet.exportSymbol('puppet.params.declareString', puppet.params.declareString);
puppet.exportSymbol('puppet.params.declareMultistring',
                    puppet.params.declareMultistring);
puppet.exportSymbol('puppet.params.declareRegExp', puppet.params.declareRegExp);
puppet.exportSymbol('puppet.params.getAll', puppet.params.getAll);
puppet.exportSymbol('puppet.params.getUndeclared', puppet.params.getUndeclared);
puppet.exportSymbol('puppet.params.getUrlParam', puppet.params.getUrlParam);
puppet.exportSymbol('puppet.params.setUrlParam', puppet.params.setUrlParam);
puppet.exportSymbol('puppet.params.removeUrlParam',
                    puppet.params.removeUrlParam);


//////////////////////////////////////////////////////////////////////////////
//
//  puppet.userAgent
//
//////////////////////////////////////////////////////////////////////////////
puppet.exportSymbol('puppet.userAgent.init', puppet.userAgent.init);
puppet.exportSymbol('puppet.userAgent.isAndroid', puppet.userAgent.isAndroid);
puppet.exportSymbol('puppet.userAgent.isAndroidMobile',
                    puppet.userAgent.isAndroidMobile);
puppet.exportSymbol('puppet.userAgent.isAndroidTablet',
                    puppet.userAgent.isAndroidTablet);
puppet.exportSymbol('puppet.userAgent.isBlackberry',
                    puppet.userAgent.isBlackberry);
puppet.exportSymbol('puppet.userAgent.isCamino', puppet.userAgent.isCamino);
puppet.exportSymbol('puppet.userAgent.isChrome', puppet.userAgent.isChrome);
puppet.exportSymbol('puppet.userAgent.isDolfin', puppet.userAgent.isDolfin);
puppet.exportSymbol('puppet.userAgent.isFirefox', puppet.userAgent.isFirefox);
puppet.exportSymbol('puppet.userAgent.isGecko', puppet.userAgent.isGecko);
puppet.exportSymbol('puppet.userAgent.isIE', puppet.userAgent.isIE);
puppet.exportSymbol('puppet.userAgent.isIETouch', puppet.userAgent.isIETouch);
puppet.exportSymbol('puppet.userAgent.isIEWebView',
                    puppet.userAgent.isIEWebView);
puppet.exportSymbol('puppet.userAgent.isUIWebView',
                    puppet.userAgent.isUIWebView);
puppet.exportSymbol('puppet.userAgent.isIPad', puppet.userAgent.isIPad);
puppet.exportSymbol('puppet.userAgent.isIPhone', puppet.userAgent.isIPhone);
puppet.exportSymbol('puppet.userAgent.isLinux', puppet.userAgent.isLinux);
puppet.exportSymbol('puppet.userAgent.isMac', puppet.userAgent.isMac);
puppet.exportSymbol('puppet.userAgent.isMobile', puppet.userAgent.isMobile);
puppet.exportSymbol('puppet.userAgent.isMobileWebKit',
                    puppet.userAgent.isMobileWebKit);
puppet.exportSymbol('puppet.userAgent.isMultiTouch',
                    puppet.userAgent.isMultiTouch);
puppet.exportSymbol('puppet.userAgent.isOpera', puppet.userAgent.isOpera);
puppet.exportSymbol('puppet.userAgent.isPlaybook', puppet.userAgent.isPlaybook);
puppet.exportSymbol('puppet.userAgent.isSafari', puppet.userAgent.isSafari);
puppet.exportSymbol('puppet.userAgent.isWebKit', puppet.userAgent.isWebKit);
puppet.exportSymbol('puppet.userAgent.isWindows', puppet.userAgent.isWindows);
puppet.exportSymbol('puppet.userAgent.isX11', puppet.userAgent.isX11);


//////////////////////////////////////////////////////////////////////////////
//
//  puppet.xpath
//
//////////////////////////////////////////////////////////////////////////////
puppet.exportSymbol('at', at);
puppet.exportSymbol('id', id);
puppet.exportSymbol('xclass', xclass);
puppet.exportSymbol('xclass.c', xclass['c']);
puppet.exportSymbol('xclass.i', xclass['i']);
puppet.exportSymbol('xclass.ic', xclass['ic']);
puppet.exportSymbol('xclass.n', xclass['n']);
puppet.exportSymbol('xclass.nc', xclass['nc']);
puppet.exportSymbol('xclass.ni', xclass['ni']);
puppet.exportSymbol('xclass.nic', xclass['nic']);
puppet.exportSymbol('xhref', xhref);
puppet.exportSymbol('xhref.c', xhref['c']);
puppet.exportSymbol('xhref.i', xhref['i']);
puppet.exportSymbol('xhref.ic', xhref['ic']);
puppet.exportSymbol('xhref.n', xhref['n']);
puppet.exportSymbol('xhref.nc', xhref['nc']);
puppet.exportSymbol('xhref.ni', xhref['ni']);
puppet.exportSymbol('xhref.nic', xhref['nic']);
puppet.exportSymbol('xid', xid);
puppet.exportSymbol('xid.c', xid['c']);
puppet.exportSymbol('xid.i', xid['i']);
puppet.exportSymbol('xid.ic', xid['ic']);
puppet.exportSymbol('xid.n', xid['n']);
puppet.exportSymbol('xid.nc', xid['nc']);
puppet.exportSymbol('xid.ni', xid['ni']);
puppet.exportSymbol('xid.nic', xid['nic']);
puppet.exportSymbol('xname', xname);
puppet.exportSymbol('xname.c', xname['c']);
puppet.exportSymbol('xname.i', xname['i']);
puppet.exportSymbol('xname.ic', xname['ic']);
puppet.exportSymbol('xname.n', xname['n']);
puppet.exportSymbol('xname.nc', xname['nc']);
puppet.exportSymbol('xname.ni', xname['ni']);
puppet.exportSymbol('xname.nic', xname['nic']);
puppet.exportSymbol('xsrc', xsrc);
puppet.exportSymbol('xsrc.c', xsrc['c']);
puppet.exportSymbol('xsrc.i', xsrc['i']);
puppet.exportSymbol('xsrc.ic', xsrc['ic']);
puppet.exportSymbol('xsrc.n', xsrc['n']);
puppet.exportSymbol('xsrc.nc', xsrc['nc']);
puppet.exportSymbol('xsrc.ni', xsrc['ni']);
puppet.exportSymbol('xsrc.nic', xsrc['nic']);
puppet.exportSymbol('xstyle', xstyle);
puppet.exportSymbol('xstyle.c', xstyle['c']);
puppet.exportSymbol('xstyle.i', xstyle['i']);
puppet.exportSymbol('xstyle.ic', xstyle['ic']);
puppet.exportSymbol('xstyle.n', xstyle['n']);
puppet.exportSymbol('xstyle.nc', xstyle['nc']);
puppet.exportSymbol('xstyle.ni', xstyle['ni']);
puppet.exportSymbol('xstyle.nic', xstyle['nic']);
puppet.exportSymbol('xtext', xtext);
puppet.exportSymbol('xtext.c', xtext['c']);
puppet.exportSymbol('xtext.i', xtext['i']);
puppet.exportSymbol('xtext.ic', xtext['ic']);
puppet.exportSymbol('xtext.n', xtext['n']);
puppet.exportSymbol('xtext.nc', xtext['nc']);
puppet.exportSymbol('xtext.ni', xtext['ni']);
puppet.exportSymbol('xtext.nic', xtext['nic']);
puppet.exportSymbol('xtitle', xtitle);
puppet.exportSymbol('xtitle.c', xtitle['c']);
puppet.exportSymbol('xtitle.i', xtitle['i']);
puppet.exportSymbol('xtitle.ic', xtitle['ic']);
puppet.exportSymbol('xtitle.n', xtitle['n']);
puppet.exportSymbol('xtitle.nc', xtitle['nc']);
puppet.exportSymbol('xtitle.ni', xtitle['ni']);
puppet.exportSymbol('xtitle.nic', xtitle['nic']);
puppet.exportSymbol('xtype', xtype);
puppet.exportSymbol('xtype.c', xtype['c']);
puppet.exportSymbol('xtype.i', xtype['i']);
puppet.exportSymbol('xtype.ic', xtype['ic']);
puppet.exportSymbol('xtype.n', xtype['n']);
puppet.exportSymbol('xtype.nc', xtype['nc']);
puppet.exportSymbol('xtype.ni', xtype['ni']);
puppet.exportSymbol('xtype.nic', xtype['nic']);
puppet.exportSymbol('xvalue', xvalue);
puppet.exportSymbol('xvalue.c', xvalue['c']);
puppet.exportSymbol('xvalue.i', xvalue['i']);
puppet.exportSymbol('xvalue.ic', xvalue['ic']);
puppet.exportSymbol('xvalue.n', xvalue['n']);
puppet.exportSymbol('xvalue.nc', xvalue['nc']);
puppet.exportSymbol('xvalue.ni', xvalue['ni']);
puppet.exportSymbol('xvalue.nic', xvalue['nic']);
puppet.exportSymbol('puppet.xpath.lowerCase', puppet.xpath.lowerCase);
puppet.exportSymbol('puppet.xpath.makeAttributeFunction',
                    puppet.xpath.makeAttributeFunction);
puppet.exportSymbol('puppet.xpath.quote', puppet.xpath.quote);
puppet.exportSymbol('puppet.xpath.resolveXPath', puppet.xpath.resolveXPath);
