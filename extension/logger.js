//- Conditional Logger
const logger = (() => {
    let config = null;

    async function init() {
        config = await getConfig();
    }

    function log(...args) {
        if (config && config.debug) {
            console.log(...args);
        }
    }

    init();

    return {
        log
    };
})();
