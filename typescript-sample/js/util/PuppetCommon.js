/* ///////////////////////////////////////////////////

THIS FILE IS COMPILED BY TYPESCRIPT. ANY MODIFICATIONS WILL BE LOST UPON COMPILATION

///////////////////////////////////////////////////*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    /// <reference path="../../../puppet-all"/>
    // Common Puppet utilities.
    var PuppetCommon = (function () {
        function PuppetCommon() {
        }
        // Load a url with a healthy timeout because local servers can take a long time. Subsequent commands should be quick.
        PuppetCommon.load = function (url) {
            puppet.setCommandTimeoutSecs(PuppetCommon.PAGE_LOAD_TIMEOUT);
            run(load, url);
            run(puppet.setCommandTimeoutSecs, PuppetCommon.COMMAND_TIMEOUT);
        };
        // Define the test functions, prefix them with "test" for Puppet auto-discovery, export them into the global
        // namespace, and finally instruct Puppet to begin test execution.
        PuppetCommon.defineTests = function () {
            var testFunctions = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                testFunctions[_i - 0] = arguments[_i];
            }
            for (var i = 0; i < testFunctions.length; i++) {
                var testFunction = testFunctions[i];
                var functionName = testFunction.name;
                if (!functionName) {
                    throw 'Test functions cannot be anonymous';
                }
                if (functionName.indexOf('test') !== 0) {
                    functionName = 'test' + functionName;
                }
                window[functionName] = testFunction;
                puppet.beginDeferredExecution();
            }
        };
        PuppetCommon.PAGE_LOAD_TIMEOUT = 180;
        PuppetCommon.COMMAND_TIMEOUT = 5;
        return PuppetCommon;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = PuppetCommon;
});
