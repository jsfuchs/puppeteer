/// <reference path="../../puppet"/>

/**
 * Created by jlee on 7/22/16.
 */

import PuppetCommon from './util/PuppetCommon';

PuppetCommon.defineTests(function testCompare(): void {
    PuppetCommon.load('/compare');
    run(text, $('.adaptive-container > h1'), /Find your fit/i);

    run(click, $('.compare-list-item.-one'));
    run(text, $('.compare-table-device-name'), /One/);
});
