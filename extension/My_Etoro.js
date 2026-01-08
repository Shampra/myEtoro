//- Main script
logger.log("My_Etoro extension loading...");
this.$ = this.jQuery = jQuery.noConflict(true);

let config = null;
let sheetData = null;
let lastUrl = window.location.href;

async function runFeatures() {
    logger.log("Running features for URL:", window.location.href);
    shortTitle.init(config);
    portfolioEnhancements.init(config, sheetData);
    watchlistEnhancements.init(config, sheetData);
    marketPageEnhancements.init(config, sheetData);
    historyExport.init(config);
    manualTradesEnhancements.init(config, sheetData);
    logger.log("Features executed.");
}

async function main() {
    try {
        logger.log("Fetching configuration...");
        config = await getConfig();

        logger.log("Google Sheets configured:", config.googleSheet.enabled);
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

        runFeatures();

        const observer = new MutationObserver((mutations) => {
            if (window.location.href !== lastUrl) {
                lastUrl = window.location.href;
                runFeatures();
            }
        });

        const targetNode = document.querySelector('body');
        const observerConfig = { childList: true, subtree: true };
        observer.observe(targetNode, observerConfig);

    } catch (error) {
        logger.log(`Error during initialization: ${error}`);
    }
}

main();
