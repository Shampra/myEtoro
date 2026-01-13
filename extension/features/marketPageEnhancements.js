//- Market Page Enhancements feature
const marketPageEnhancements = (() => {
    function init(config, sheetData) {
        if (config.features.marketPageEnhancements.enabled) {
            if (document.location.href.indexOf('markets') > -1) {
                logger.log("Initializing marketPageEnhancements feature...");
                enrichMarketPage(sheetData);
            }
        }
    }

    function enrichMarketPage(data) {
        logger.log("Enriching market page...");
        logger.log("Nothing to do for now...");
    }

    return {
        init
    };
})();
