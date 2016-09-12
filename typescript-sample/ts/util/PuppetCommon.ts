/// <reference path="../../../puppet"/>

// Needed because name is ES6 only.
interface PuppeteerTest extends Function {
    name : string;
}

// Common Puppet utilities.
export default class PuppetCommon {

    private static PAGE_LOAD_TIMEOUT: number = 180;
    private static COMMAND_TIMEOUT: number = 5;

    // Load a url with a healthy timeout because local servers can take a long time. Subsequent commands should be quick.
    public static load(url: string) {
        puppet.setCommandTimeoutSecs(PuppetCommon.PAGE_LOAD_TIMEOUT);
        run(load, url);
        run(puppet.setCommandTimeoutSecs, PuppetCommon.COMMAND_TIMEOUT);
    }

    // Define the test functions, prefix them with "test" for Puppet auto-discovery, export them into the global
    // namespace, and finally instruct Puppet to begin test execution.
    public static defineTests(...testFunctions: { () : void }[]) : void {
        for (let i = 0; i < testFunctions.length; i++) {
            const testFunction : PuppeteerTest = testFunctions[i] as Function as PuppeteerTest;
            let functionName : string = testFunction.name;
            if (!functionName) {
                throw 'Test functions cannot be anonymous';
            }
            if (functionName.indexOf('test') !== 0) {
                functionName = 'test' + functionName;
            }

            window[functionName] = testFunction;
            puppet.beginDeferredExecution();
        }
    }
}
