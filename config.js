//- Default configuration
const defaultConfig = {
    googleSheet: {
        id: null,
        sheetName: null,
        enabled: false
    },
    features: {
        shortTitle: {
            enabled: true,
            name: "Shorten page titles",
            description: "Shortens the page titles to be more concise."
        },
        portfolioEnhancements: {
            enabled: true,
            name: "Portfolio Enhancements",
            description: "Adds extra information and filtering options to the portfolio page."
        },
        watchlistEnhancements: {
            enabled: true,
            name: "Watchlist Enhancements",
            description: "Adds extra information and sorting options to the watchlist page."
        },
        marketPageEnhancements: {
            enabled: true,
            name: "Market Page Enhancements",
            description: "Adds extra information to market pages."
        },
        historyExport: {
            enabled: true,
            name: "History Export",
            description: "Adds a button to export the portfolio history to a CSV file."
        },
        manualTradesEnhancements: {
            enabled: true,
            name: "Manual Trades Enhancements",
            description: "Adds extra information and export options to the manual trades page."
        }
    }
};

//- Configuration management
function getConfig() {
    return new Promise((resolve, reject) => {
        browser.storage.local.get("config").then(result => {
            if (result.config) {
                resolve(result.config);
            } else {
                resolve(defaultConfig);
            }
        }, error => {
            reject(error);
        });
    });
}

function saveConfig(config) {
    return browser.storage.local.set({ config: config });
}
