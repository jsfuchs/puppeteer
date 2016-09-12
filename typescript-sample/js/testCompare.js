/* ///////////////////////////////////////////////////

THIS FILE IS COMPILED BY TYPESCRIPT. ANY MODIFICATIONS WILL BE LOST UPON COMPILATION

///////////////////////////////////////////////////*/
define(["require", "exports", './util/PuppetCommon'], function (require, exports, PuppetCommon_1) {
    "use strict";
    PuppetCommon_1.default.defineTests(function testCompare() {
        PuppetCommon_1.default.load('/compare');
        run(text, $('.adaptive-container > h1'), /Find your fit/i);
        run(click, $('.compare-list-item.-one'));
        run(text, $('.compare-table-device-name'), /One/);
    });
});
