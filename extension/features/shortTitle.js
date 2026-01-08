//- Shorten page titles feature
const shortTitle = (() => {
    function init(config) {
        if (config.features.shortTitle.enabled && document.location.href.indexOf('markets') > -1) {
            logger.log("Initializing shortTitle feature...");
            setInterval(() => {
                const titre = $(".user-fullname").first().text();
                if (document.title !== titre) {
                    logger.log(`Shortening title to "${titre}"`);
                    document.title = titre;
                }
            }, 5000);
        }
    }

    return {
        init
    };
})();
