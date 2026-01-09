//- Main script
logger.log("My_Etoro extension loading...");
this.$ = this.jQuery = jQuery.noConflict(true);

let config = null;
let lastUrl = window.location.href;

async function runFeatures() {
    logger.log("Running features for URL:", window.location.href);
    shortTitle.init(config);
    logger.log("Features executed.");
}

async function main() {
    try {
        logger.log("Fetching configuration...");
        config = await getConfig();

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
