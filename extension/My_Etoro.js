//- Main script
logger.log("My_Etoro extension loading...");
this.$ = this.jQuery = jQuery.noConflict(true);

(async () => {
    try {
        logger.log("Fetching configuration...");
        const config = await getConfig();
        let sheetData = null;

        logger.log("Google Sheets configured:", config.googleSheet.enabled);
        //- Initialize Google Sheets module if enabled
        if (config.googleSheet.enabled && config.googleSheet.id && config.googleSheet.sheetName) {
            try {
                logger.log("Fetching Google Sheets data...");
                sheetData = await googleSheets.fetchData(config.googleSheet.id, config.googleSheet.sheetName);
                browser.runtime.sendMessage({ "action": "ok" });
                logger.log("Google Sheets data fetched successfully.");
            } catch (error) {
                browser.runtime.sendMessage({ "action": "error" });
                logger.log("Error fetching Google Sheets data:", error);
            }
        } else {
            browser.runtime.sendMessage({ "action": "na" });
        }

        logger.log("Initializing features...");
        //- Initialize features
        shortTitle.init(config);
        portfolioEnhancements.init(config, sheetData);
        watchlistEnhancements.init(config, sheetData);
        marketPageEnhancements.init(config, sheetData);
        historyExport.init(config);
        manualTradesEnhancements.init(config, sheetData);
        logger.log("Features initialized.");

    } catch (error) {
        logger.log(`Error during initialization: ${error}`);
    }
})();
