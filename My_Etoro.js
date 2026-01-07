//- Main script
this.$ = this.jQuery = jQuery.noConflict(true);

(async () => {
    try {
        const config = await getConfig();
        let sheetData = null;

        //- Initialize Google Sheets module if enabled
        if (config.googleSheet.enabled && config.googleSheet.id && config.googleSheet.sheetName) {
            try {
                sheetData = await googleSheets.fetchData(config.googleSheet.id, config.googleSheet.sheetName);
                browser.runtime.sendMessage({ "action": "ok" });
            } catch (error) {
                browser.runtime.sendMessage({ "action": "error" });
            }
        } else {
            browser.runtime.sendMessage({ "action": "na" });
        }

        //- Initialize features
        shortTitle.init(config);
        portfolioEnhancements.init(config, sheetData);
        watchlistEnhancements.init(config, sheetData);
        marketPageEnhancements.init(config, sheetData);
        historyExport.init(config);
        manualTradesEnhancements.init(config, sheetData);

    } catch (error) {
        console.error(`Error during initialization: ${error}`);
    }
})();
