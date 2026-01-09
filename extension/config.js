//- Default configuration
const defaultConfig = {
    debug: false,
    features: {
        shortTitle: {
            enabled: true,
            name: "Shorten page titles",
            description: "Shortens the page titles to be more concise."
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
