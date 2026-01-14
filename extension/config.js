//- Default configuration
const defaultConfig = {
    debug: false,
    googleSheet: {
        id: null,
        sheetName: null,
        enabled: false
    },
    features: {
        shortTitle: {
            enabled: true
        },
        portfolioEnhancements: {
            enabled: true
        },
        watchlistEnhancements: {
            enabled: true
        },
        marketPageEnhancements: {
            enabled: true
        },
        historyExport: {
            enabled: true
        },
        manualTradesEnhancements: {
            enabled: true
        },
        directMarketAccess: {
            enabled: false
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
