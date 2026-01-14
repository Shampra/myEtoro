//- Portfolio Enhancements feature
const portfolioEnhancements = (() => {
    function init(config, sheetData) {
        if (window.location.href.includes("https://www.etoro.com/portfolio")) {
            if (config.features.portfolioEnhancements.enabled) {
                logger.log("Initializing portfolioEnhancements feature...");
                enrichPortfolio(sheetData);
                addDirectMarketAccessLink();
            }
            if (config.features.setDirectMarketAccess.enabled) {
                logger.log("Initializing portfolioEnhancements Direct Access Market feature...");
                enrichPortfolio(sheetData);
                addDirectMarketAccessLink();
            }
        }
    }

    function addDirectMarketAccessLink() {
        logger.log("Lien direct?");
        waitForKeyElements(
            '[automation-id="portfolio-position-list-row-instrument-url"]',
            (element) => {
                element.on("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const instrument = $(e.currentTarget).find("img").attr("alt");
                    window.location.href = `https://www.etoro.com/markets/${instrument}`;
                });
            }
        );
    }


    function enrichPortfolio(data) {
        logger.log("Enriching portfolio...");
        // - Enrichissement par ligne
        $("div.ui-table-static-cell").each(function (index) {
            if ($(this).find(".myData").length) return;

            var currentItem = $(this).find("div.table-first-name").text().trim();
            var arrayCible = searchByNom(currentItem.toUpperCase(), data);
            if (arrayCible) {
                logger.log(`Enriching ${currentItem}`);
                $(this).find("div.table-static-cell-info").append(prepareER(arrayCible));
                var content = prepareContent(arrayCible);
                var tips = $("<div></div>").addClass("myData tooltip " + arrayCible.TYPE).append(content);
                $(this).find("img.avatar").after(tips);
                $(this).hover(function () { $(this).next('.tooltip').css({ 'visibility': 'visible' }); },
                    function () { $(this).next('.tooltip').css({ 'visibility': 'hidden' }); });
                if (arrayCible.ALERT == "x") $(this).find("div.table-first-name").css({ "color": "red" });
                if (arrayCible.LEVERAGE == "x") $(this).append("<span class=\"icon_leverage\">X10</span>");
            }
        });

        // - Ajout des filtres
        if (!$("div.inner-header-buttons").find(".menuFilter").length) {
            logger.log("Creating filters...");
            createFilter("All", "portfolio", data);
        }

        // - Ajout Totaux par type
        if (!$("div.inner-header-buttons").find(".viewTotaux").length) {
            logger.log("Adding totals...");
            var aUS = new Array(".US", "Actions US", 0, 0);
            var aEU = new Array(".EU", "Actions EU", 0, 0);
            var aCR = new Array(".CR", "Crypto", 0, 0);
            var aMAT = new Array(".MAT", "Matériaux", 0, 0);
            var aIND = new Array(".IND", "Indices", 0, 0);
            var aUKN = new Array(".UKN", "Autres", 0, 0);
            var aList = new Array(aUS, aEU, aCR, aMAT, aIND, aUKN);
            var menuTotaux = "<div class=\"dropdown-menu customMenu menuFilter  ng-scope \" style=\" font-size:12px;\"><a class=\"icon\"><div class=\"filter\"><img class=\"bt_img\" src=\"" + browser.runtime.getURL('images/percentage.png') + "\"/></div></a><div class=\"drop-select-box myBoxFilter viewTotaux\"><div class=\"valueTotaux\" style=\"width:200px;\">";

            $("div.ui-table-row-container").each(function (index) {
                for (var x in aList) {
                    if (aList[x][0] == ".UKN") {
                        aList[x][2] += parseFloat($(this).find('[data-etoro-automation-id="portfolio-overview-table-body-cell-profit"]').text().replace('$', '').replace(',', ''));
                        aList[x][3] += parseFloat($(this).find('[data-etoro-automation-id="portfolio-overview-table-body-cell-invested-value"]').text().replace('$', '').replace(',', ''));
                    }
                    else if ($(this).find(aList[x][0]).length) {
                        aList[x][2] += parseFloat($(this).find('[data-etoro-automation-id="portfolio-overview-table-body-cell-profit"]').text().replace('$', '').replace(',', ''));
                        aList[x][3] += parseFloat($(this).find('[data-etoro-automation-id="portfolio-overview-table-body-cell-invested-value"]').text().replace('$', '').replace(',', ''));
                        break;
                    }
                }
            });

            jQuery.each(aList, function (index, value) {
                if (value[2] > 0)
                    menuTotaux += "<div><label>" + value[1] + " = </label><span class=\"positive\">" + Math.round(value[2]).toLocaleString() + "</span> / " + Math.round(value[3]).toLocaleString() + "$ (" + Math.round((value[2] / value[3]) * 100).toLocaleString() + "%)</div>";
                else
                    menuTotaux += "<div><label>" + value[1] + " = </label><span class=\"negative\">" + Math.round(value[2]).toLocaleString() + "</span> / " + Math.round(value[3]).toLocaleString() + "$ (" + Math.round((value[2] / value[3]) * 100).toLocaleString() + "%)</div>";
            });
            menuTotaux += "</div><button class=\"updateTotaux\">" + browser.i18n.getMessage("boutonUpdate") + "</button></div></div>";
            $("div.inner-header-buttons").append(menuTotaux);
        }
    }

    return {
        init
    };
})();
