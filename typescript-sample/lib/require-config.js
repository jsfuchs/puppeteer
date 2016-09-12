requirejs.config({
    //we need to overwrite the baseUrl, as it wouldn't be relative to test-js
    baseUrl: '/typescript-sample',
    paths: {
        //if we have any module mocks or data mocks we want to setup, include them here.
    },

    shim: {
        // Required for files that don't export a module
        'puppet': {
            exports: 'puppet'
        }
    }
});
