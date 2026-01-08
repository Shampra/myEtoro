//- Market Page Enhancements feature
const marketPageEnhancements = (() => {
    function init(config, sheetData) {
        if (config.features.marketPageEnhancements.enabled) {
            if (document.location.href.indexOf('markets') > -1) {
                logger.log("Initializing marketPageEnhancements feature...");
                enrichMarketPage(sheetData);
            }
        }
    }

    function enrichMarketPage(data) {
        logger.log("Enriching market page...");
        var currentItem;
        $("div.user-head-content-ph").each(function (index) {
            if ($(this).find(".myData").length) return;
            currentItem = $(this).find("h1.user-nickname").text();
            var arrayCible = searchByNom(currentItem.toUpperCase(), data);
            if (arrayCible) {
                logger.log(`Enriching ${currentItem}`);
                var content = prepareContent(arrayCible);
                var tips = $("<div></div>").addClass("myData").append(content);
                $(this).find("img.avatar").after(tips);
                if (arrayCible.ALERT == "x") $(this).find("h1.user-nickname").css({ "color": "red" });
                if (arrayCible.LEVERAGE != "") $(this).find(".myData").append("<span class=\"icon_leverage_market\">" + arrayCible.LEVERAGE + "</span>");
            }
        });
        if (!$("body").find("#customHisto").length) {
            logger.log("Adding history link...");
            $("tabstitles.w-instrument-navigation").append('<tabtitle id="customHisto"><a href="/portfolio/history/market/' + currentItem + '"><span class="i-instrument-navigation-item e-link pointer stats-list">' +
                '<span class="sprite"><img class="bt_img" src="' + browser.runtime.getURL('images/history.png') + '"/></span>' +
                '<span class="i-instrument-navigation-item-label ng-scope">Historique</span> </span></a></tabtitle>');
        }
    }

    return {
        init
    };
})();
