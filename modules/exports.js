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

goog.require('bot.Keyboard');
goog.require('bot.Keyboard.Key');
goog.require('bot.Keyboard.Keys');
goog.require('bot.Mouse');
goog.require('bot.Mouse.Button');
goog.require('bot.Touchscreen');
goog.require('puppet');
goog.require('puppet.logging');
goog.require('puppet.userAgent');
goog.require('puppet.xpath');


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
goog.exportSymbol('bot.Mouse', bot.Mouse);
goog.exportProperty(bot.Mouse.prototype, 'pressButton',
                    bot.Mouse.prototype.pressButton);
goog.exportProperty(bot.Mouse.prototype, 'releaseButton',
                    bot.Mouse.prototype.releaseButton);
goog.exportProperty(bot.Mouse.prototype, 'move', bot.Mouse.prototype.move);
goog.exportProperty(bot.Mouse.prototype, 'scroll',
                    bot.Mouse.prototype.scroll);


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
//  bot.Touchscreen
//
//////////////////////////////////////////////////////////////////////////////
goog.exportSymbol('bot.Touchscreen', bot.Touchscreen);
goog.exportProperty(bot.Touchscreen.prototype, 'isPressed',
                    bot.Touchscreen.prototype.isPressed);
goog.exportProperty(bot.Touchscreen.prototype, 'move',
                    bot.Touchscreen.prototype.move);
goog.exportProperty(bot.Touchscreen.prototype, 'press',
                    bot.Touchscreen.prototype.press);
goog.exportProperty(bot.Touchscreen.prototype, 'release',
                    bot.Touchscreen.prototype.release);


//////////////////////////////////////////////////////////////////////////////
//
//  puppet
//
//////////////////////////////////////////////////////////////////////////////
goog.exportSymbol('all', all);
goog.exportSymbol('assert', assert);
goog.exportSymbol('assertEq', assertEq);
goog.exportSymbol('assertNotEq', assertNotEq);
goog.exportSymbol('attribute', attribute);
goog.exportSymbol('back', back);
goog.exportSymbol('blur', blur);
goog.exportSymbol('clear', clear);
goog.exportSymbol('click', click);
goog.exportSymbol('count', count);
goog.exportSymbol('dialog', dialog);
goog.exportSymbol('doubleclick', doubleclick);
goog.exportSymbol('drag', drag);
goog.exportSymbol('focus', focus);
goog.exportSymbol('follow', follow);
goog.exportSymbol('forward', forward);
goog.exportSymbol('input', input);
goog.exportSymbol('load', load);
goog.exportSymbol('mouse', mouse);
goog.exportSymbol('movemouse', movemouse);
goog.exportSymbol('none', none);
goog.exportSymbol('not', not);
goog.exportSymbol('opacity', opacity);
goog.exportSymbol('pinch', pinch);
goog.exportSymbol('present', present);
goog.exportSymbol('property', property);
goog.exportSymbol('reload', reload);
goog.exportSymbol('rightclick', rightclick);
goog.exportSymbol('rotate', rotate);
goog.exportSymbol('run', run);
goog.exportSymbol('scrollmouse', scrollmouse);
goog.exportSymbol('selected', selected);
goog.exportSymbol('select', select);
goog.exportSymbol('shown', shown);
goog.exportSymbol('sleep', sleep);
goog.exportSymbol('some', some);
goog.exportSymbol('stop', stop);
goog.exportSymbol('style', style);
goog.exportSymbol('text', text);
goog.exportSymbol('type', type);
goog.exportSymbol('puppet.addFinalizer', puppet.addFinalizer);
goog.exportSymbol('puppet.appendLoadParams', puppet.appendLoadParams);
goog.exportSymbol('puppet.assert', puppet.assert);
goog.exportSymbol('puppet.attribute', puppet.attribute);
goog.exportSymbol('puppet.call', puppet.call);
goog.exportSymbol('puppet.debug', puppet.debug);
goog.exportSymbol('puppet.define', puppet.define);
goog.exportSymbol('puppet.document', puppet.document);
goog.exportSymbol('puppet.echo', puppet.echo);
goog.exportSymbol('puppet.elem', puppet.elem);
goog.exportSymbol('puppet.elems', puppet.elems);
goog.exportSymbol('puppet.focus', puppet.focus);
goog.exportSymbol('puppet.include', puppet.include);
goog.exportSymbol('puppet.initWindow', puppet.initWindow);
goog.exportSymbol('puppet.keyboard', puppet.keyboard);
goog.exportSymbol('puppet.left', puppet.left);
goog.exportSymbol('puppet.location', puppet.location);
goog.exportSymbol('puppet.match', puppet.match);
goog.exportSymbol('puppet.matches', puppet.matches);
goog.exportSymbol('puppet.mouse', puppet.mouse);
goog.exportSymbol('puppet.resizeHeight', puppet.resizeHeight);
goog.exportSymbol('puppet.resizeWidth', puppet.resizeWidth);
goog.exportSymbol('puppet.setLastFinalizer', puppet.setLastFinalizer);
goog.exportSymbol('puppet.step', puppet.step);
goog.exportSymbol('puppet.style', puppet.style);
goog.exportSymbol('puppet.text', puppet.text);
goog.exportSymbol('puppet.top', puppet.top);
goog.exportSymbol('puppet.touchscreen', puppet.touchscreen);
goog.exportSymbol('puppet.window', puppet.window);


//////////////////////////////////////////////////////////////////////////////
//
//  puppet.logging
//
//////////////////////////////////////////////////////////////////////////////
goog.exportSymbol('puppet.logging.addLogListener',
                  puppet.logging.addLogListener);
goog.exportSymbol('puppet.logging.debug', puppet.logging.debug);
goog.exportSymbol('puppet.logging.log', puppet.logging.log);
goog.exportSymbol('puppet.logging.error', puppet.logging.error);
goog.exportSymbol('puppet.logging.toString', puppet.logging.toString);


//////////////////////////////////////////////////////////////////////////////
//
//  puppet.userAgent
//
//////////////////////////////////////////////////////////////////////////////
goog.exportSymbol('puppet.userAgent.isAndroid', puppet.userAgent.isAndroid);
goog.exportSymbol('puppet.userAgent.isAndroidMobile',
                  puppet.userAgent.isAndroidMobile);
goog.exportSymbol('puppet.userAgent.isAndroidTablet',
                  puppet.userAgent.isAndroidTablet);
goog.exportSymbol('puppet.userAgent.isBlackberry',
                  puppet.userAgent.isBlackberry);
goog.exportSymbol('puppet.userAgent.isCamino', puppet.userAgent.isCamino);
goog.exportSymbol('puppet.userAgent.isChrome', puppet.userAgent.isChrome);
goog.exportSymbol('puppet.userAgent.isDolfin', puppet.userAgent.isDolfin);
goog.exportSymbol('puppet.userAgent.isFirefox', puppet.userAgent.isFirefox);
goog.exportSymbol('puppet.userAgent.isGecko', puppet.userAgent.isGecko);
goog.exportSymbol('puppet.userAgent.isIE', puppet.userAgent.isIE);
goog.exportSymbol('puppet.userAgent.isIPad', puppet.userAgent.isIPad);
goog.exportSymbol('puppet.userAgent.isIPhone', puppet.userAgent.isIPhone);
goog.exportSymbol('puppet.userAgent.isLinux', puppet.userAgent.isLinux);
goog.exportSymbol('puppet.userAgent.isMac', puppet.userAgent.isMac);
goog.exportSymbol('puppet.userAgent.isMobile', puppet.userAgent.isMobile);
goog.exportSymbol('puppet.userAgent.isMobileWebKit',
                  puppet.userAgent.isMobileWebKit);
goog.exportSymbol('puppet.userAgent.isMultiTouch',
                  puppet.userAgent.isMultiTouch);
goog.exportSymbol('puppet.userAgent.isOpera', puppet.userAgent.isOpera);
goog.exportSymbol('puppet.userAgent.isPlaybook', puppet.userAgent.isPlaybook);
goog.exportSymbol('puppet.userAgent.isSafari', puppet.userAgent.isSafari);
goog.exportSymbol('puppet.userAgent.isWebKit', puppet.userAgent.isWebKit);
goog.exportSymbol('puppet.userAgent.isWindows', puppet.userAgent.isWindows);
goog.exportSymbol('puppet.userAgent.isX11', puppet.userAgent.isX11);


//////////////////////////////////////////////////////////////////////////////
//
//  puppet.xpath
//
//////////////////////////////////////////////////////////////////////////////
goog.exportSymbol('at', at);
goog.exportSymbol('id', id);
goog.exportSymbol('xclass', xclass);
goog.exportSymbol('xhref', xhref);
goog.exportSymbol('xid', xid);
goog.exportSymbol('xname', xname);
goog.exportSymbol('xsrc', xsrc);
goog.exportSymbol('xstyle', xstyle);
goog.exportSymbol('xtext', xtext);
goog.exportSymbol('xtitle', xtitle);
goog.exportSymbol('xtype', xtype);
goog.exportSymbol('xvalue', xvalue);
goog.exportSymbol('puppet.xpath.lowerCase', puppet.xpath.lowerCase);
goog.exportSymbol('puppet.xpath.makeAttributeFunction',
                  puppet.xpath.makeAttributeFunction);
goog.exportSymbol('puppet.xpath.quote', puppet.xpath.quote);
goog.exportSymbol('puppet.xpath.resolveXPath', puppet.xpath.resolveXPath);
