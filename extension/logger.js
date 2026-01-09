//- Conditional Logger
const logger = (() => {
    let config = null;

    function init(loadedConfig) {
        config = loadedConfig;
    }

    function log(...args) {
        if (config && config.debug) {
            console.log(...args);
        }
    }

    return {
        init,
        log
    };
})();
