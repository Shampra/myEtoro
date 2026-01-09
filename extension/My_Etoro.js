//- Main script
this.$ = this.jQuery = jQuery.noConflict(true);

let config = null;
let lastUrl = window.location.href;

function runFeatures() {
    logger.log("Running features for URL:", window.location.href);
    shortTitle.init(config);
    logger.log("Features executed.");
}

async function main() {
    try {
        const { config: loadedConfig, source } = await getConfig();
        config = loadedConfig;

        logger.init(config);
        logger.log("My_Etoro extension loading...");
        logger.log(`Configuration loaded from ${source}:`, config);

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
        console.error(`Error during initialization: ${error}`);
    }
}

main();
