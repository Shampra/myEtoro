//- Main script
console.log("My_Etoro extension loading...");
this.$ = this.jQuery = jQuery.noConflict(true);

(async () => {
    try {
        console.log("Fetching configuration...");
        const config = await getConfig();
        let sheetData = null;

        console.log("Google Sheets configured:", config.googleSheet.enabled);
        //- Initialize Google Sheets module if enabled
        if (config.googleSheet.enabled && config.googleSheet.id && config.googleSheet.sheetName) {
            try {
                console.log("Fetching Google Sheets data...");
                sheetData = await googleSheets.fetchData(config.googleSheet.id, config.googleSheet.sheetName);
                browser.runtime.sendMessage({ "action": "ok" });
                console.log("Google Sheets data fetched successfully.");
            } catch (error) {
                browser.runtime.sendMessage({ "action": "error" });
                console.error("Error fetching Google Sheets data:", error);
            }
        } else {
            browser.runtime.sendMessage({ "action": "na" });
        }

        console.log("Initializing features...");
        //- Initialize features
        shortTitle.init(config);
        portfolioEnhancements.init(config, sheetData);
        watchlistEnhancements.init(config, sheetData);
        marketPageEnhancements.init(config, sheetData);
        historyExport.init(config);
        manualTradesEnhancements.init(config, sheetData);
        console.log("Features initialized.");

    } catch (error) {
        console.error(`Error during initialization: ${error}`);
    }
})();
