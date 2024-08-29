module.exports = function (config) {
    config.set({
        browsers: ['Chrome'],
        // The directory where the output file lives
        basePath: 'static/rtc-e2e-test',
        // The file itself
        files: ['main.js'],
        frameworks: ['cljs-test'],
        plugins: ['karma-cljs-test', 'karma-chrome-launcher'],
        colors: true,
        logLevel: config.LOG_INFO,
        client: {
            args: ["shadow.test.karma.init"],
            singleRun: true,
	    testvar: config.testvar,
	    seed: config.seed
        }
    })
};
