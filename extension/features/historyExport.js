//- History Export feature
const historyExport = (() => {
    function init(config) {
        if (config.features.historyExport.enabled) {
            if (window.location.href == "https://www.etoro.com/portfolio/history") {
                console.log("Initializing historyExport feature...");
                addExportButton();
            }
        }
    }

    function addExportButton() {
        console.log("Adding export button...");
        var menuExport = "<a class=\"icon actionExport customMenu mobile-off\"><div class=\"list\"><img class=\"bt_img\" src=\"" + browser.runtime.getURL('images/export-excel.png') + "\"/></div></a>";
        if (!$("div.inner-header-buttons").find(".actionExport").length) {
            $("div.inner-header-buttons").append(menuExport);
            $(".actionExport").on('click', function (event) {
                console.log("Export button clicked.");
                // On déplie toute la liste
                var checkExist = setInterval(function () {
                    if ($('button.more-info-button').length) {
                        console.log("Expanding history...");
                        $('button.more-info-button').click();
                    }
                    else {
                        clearInterval(checkExist);
                        exportHistory();
                    }
                }, 500);
            });
        }
    }

    function exportHistory() {
        console.log("Exporting history...");
        var titles = ['Titre complet', 'Levier', 'Type fermeture', 'Prix fermeture', 'Date ouverture', 'Date fermeture', 'Investi', 'Gain', 'Frais'];
        var data = [];
        data.push(titles);
        $('div.ui-table-row').each(function () {
            if ($(this).find("span.i-portfolio-table-marker-obj").last().text() != "") {
                var cTitre = $.trim($(this).find("div.i-portfolio-table-inner-name-symbol").text());
                var cLevier = $(this).find('ui-table-cell[name=leverage] span.i-portfolio-table-marker-obj').text();
                var cReason = $(this).find("div.i-history-close-reason ").attr('class');
                if (typeof cReason === "undefined") cReason = "Manuel"; else if (cReason.indexOf("sl") > -1) cReason = "SL"; else if (cReason.indexOf("tp") > -1) cReason = "TP"; else if (cReason.indexOf("cr") > -1) cReason = "cr";
                var cSorti = $(this).find('ui-table-cell[name=close] span.i-portfolio-table-marker-obj').text().replace('.', ',');
                var cDateOpen = $(this).find("p.i-portfolio-table-cell-inner-date").first().text();
                var cDateClose = $(this).find("p.i-portfolio-table-cell-inner-date").eq(2).text();
                var cInvesti = $(this).find('ui-table-cell[name=invested] span.i-portfolio-table-marker-obj').text().replace('.', ',').replace('$', '');
                var cGain = $(this).find('ui-table-cell[name=plPercentage] span.i-portfolio-table-marker-obj').text().replace('.', ',');
                var cFrais = $(this).find('ui-table-cell[name=Fees]').text().replace('.', ',').replace('$', '').replace(/\s/g, '');
                var current = [cTitre, cLevier, cReason, cSorti, cDateOpen, cDateClose, cInvesti, cGain, cFrais];
                data.push(current);
            }
        });
        let csv = "";
        data.forEach(function (rowArray) {
            let row = rowArray.join(";");
            csv += row + "\r\n";
        });
        var csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);
        $(".actionExport").attr({ 'download': "export.csv", 'href': csvData, 'target': '_blank' });
        console.log("History exported.");
    }

    return {
        init
    };
})();
