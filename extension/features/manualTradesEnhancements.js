//- Manual Trades Enhancements feature
const manualTradesEnhancements = (() => {
    function init(config, sheetData) {
        if (config.features.manualTradesEnhancements.enabled) {
            if (window.location.href == "https://www.etoro.com/portfolio/manual-trades") {
                logger.log("Initializing manualTradesEnhancements feature...");
                enrichManualTrades(sheetData);
            }
        }
    }

    function enrichManualTrades(data) {
        logger.log("Enriching manual trades page...");
        $("div.ui-table-row").each(function (index) {
            var currentItem = $(this).find("div.table-first-name").children("span.ng-binding").last().text().trim();
            var arrayCible = searchByNom(currentItem.toUpperCase(), data);
            if (arrayCible) {
                logger.log(`Enriching ${currentItem}`);
                var content = prepareContent(arrayCible);
                var tips = $("<div></div>").addClass("myData tooltip " + arrayCible.TYPE).append(content);
                $(this).find("img.avatar").after(tips);
                $(this).hover(function () { $(this).next('.tooltip').css({ 'visibility': 'visible' }); },
                    function () { $(this).next('.tooltip').css({ 'visibility': 'hidden' }); });
                if (arrayCible.ALERT == "x") $(this).find("div.table-first-name").css({ "color": "red" });
            }
        });

        if (!$("div.inner-header-buttons").find(".menuFilter").length) {
            logger.log("Creating filters...");
            createFilter("All", "portfolio", data);
        }

        var menuExport = "<a class=\"icon actionExport customMenu mobile-off\"><div class=\"list\"><img class=\"bt_img\" src=\"" + browser.runtime.getURL('images/export-excel.png') + "\"/></div></a>";
        if (!$("div.inner-header-buttons").find(".actionExport").length) {
            logger.log("Adding export button...");
            $("div.inner-header-buttons").append(menuExport);
            $(".actionExport").on('click', function (event) {
                logger.log("Export button clicked.");
                var titles = ['Titre', 'Valeur', 'Levier', 'Etat'];
                var data = [];
                data.push(titles);
                $('div.ui-table-row').each(function () {
                    var cItem = $(this).find("div.table-first-name").children("span.ng-binding").last().text();
                    var cInvesti = $.trim($(this).find('span[data-etoro-automation-id="portfolio-manual-trades-table-body-invested-value"]').last().text());
                    var cLevier = $.trim($(this).find('span[data-etoro-automation-id="portfolio-manual-trades-table-body-leverage"]').last().text());
                    var cEtat = $.trim($(this).find('span[data-etoro-automation-id="portfolio-manual-trades-table-body-gain"]').last().text());
                    var current = [cItem, cInvesti, cLevier, cEtat];
                    data.push(current);
                });
                let csv = "";
                data.forEach(function (rowArray) {
                    let row = rowArray.join(";");
                    csv += row + "\r\n";
                });
                var csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);
                $(this).attr({ 'download': "export.csv", 'href': csvData, 'target': '_blank' });
                logger.log("Manual trades exported.");
            });
        }
    }

    return {
        init
    };
})();
