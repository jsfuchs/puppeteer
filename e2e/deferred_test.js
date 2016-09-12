function testPage() {
    run(load, '/deferred_test_iframe.html');
    run(function() {
        assert(!puppet.window().puppet.getStatus());
    });

    run(function() {
        puppet.window().puppet.beginDeferredExecution();
    });

    run(hasTestFailed, puppet.window());
}
