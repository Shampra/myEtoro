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
            enabled: true,
            name: "Shorten page titles",
            description: "Shortens the page titles to be more concise."
        },
        portfolioEnhancements: {
            enabled: true,
            name: "Portfolio Enhancements",
            description: "Adds extra information and filtering options to the portfolio page."
        },
        setDirectMarketAccess: {
            enabled: true,
            name: "Portfolio Enhancements - Link to market",
            description: "Adds direct access to market into the portfolio"
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
