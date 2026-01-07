//- Shorten page titles feature
const shortTitle = (() => {
    function init(config) {
        if (config.features.shortTitle.enabled && document.location.href.indexOf('markets') > -1) {
            setInterval(() => {
                const titre = $(".user-fullname").first().text();
                if (document.title !== titre) {
                    document.title = titre;
                }
            }, 5000);
        }
    }

    return {
        init
    };
})();
