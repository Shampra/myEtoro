//- Watchlist Enhancements feature
const watchlistEnhancements = (() => {
    function init(config, sheetData) {
        if (config.features.watchlistEnhancements.enabled) {
            if (document.location.href.indexOf('watchlists') > -1) {
                logger.log("Initializing watchlistEnhancements feature...");
                enrichWatchlist(sheetData);
            }
        }
    }

    function enrichWatchlist(data) {
        logger.log("Enriching watchlist...");
        $("div.row-wrap").each(function (index) {
            if ($(this).find(".myData").length) return;

            var currentItem = $(this).find("div.symbol").text();
            var arrayCible = searchByNom(currentItem.toUpperCase(), data);
            if (arrayCible) {
                logger.log(`Enriching ${currentItem}`);
                var content = prepareContent(arrayCible);
                var tips = $("<div></div>").addClass("myData tooltip " + arrayCible.TYPE).append(content);
                $(this).find("a.card-avatar-wrap").after(tips);
                $(this).hover(function () { $(this).find('.tooltip').css({ 'visibility': 'visible' }); },
                    function () { $(this).find('.tooltip').css({ 'visibility': 'hidden' }); });
                $(this).find("div.table-info").before(prepareER(arrayCible));
                if (arrayCible.ALERT == "x") $(this).find("div.symbol").css({ "color": "red" });
                if (arrayCible.LEVERAGE != "") $(this).append("<span class=\"icon_leverage\">" + arrayCible.LEVERAGE + "</span>");
            }

            var EltPro = $(this).find(".instrument-pro");
            var EltNum = $(this).find(".instrument-num");
            EltNum.after(EltPro);
            EltPro.wrap($('<div style="margin: -8px 0;"></div>'));
            EltPro.toggleClass("instrument-pro instrument-num");
            EltNum.toggleClass("instrument-pro instrument-num");
        });

        if (!$("div.watch-list-buttons").find(".menuOrder").length) {
            logger.log("Adding sorting menu...");
            var menuOrder = "<div class=\"filter dropdown-menu menuFilter ng-scope customMenu \"><a class=\"icon\"><div class=\"filter\"><img class=\"bt_img\" src=\"" + browser.runtime.getURL('images/order.png') + "\"/></div></a><div class=\"drop-select-box myBoxFilter menuTri\">";
            menuOrder += "<label class=\"order\" ><a class=\"drop-select-box-option NoOrder\"><input type=\"radio\" name=\"tri\" value=\"aucun\">" + browser.i18n.getMessage("order_ByDefault") + "</a></label>";
            menuOrder += "<label class=\"order\" ><a class=\"drop-select-box-option OrderByName\"><input type=\"radio\" name=\"tri\" value=\"nom\">" + browser.i18n.getMessage("order_ByName") + "</a></label>";
            menuOrder += "<label class=\"order\" ><a class=\"drop-select-box-option OrderByER\"><input type=\"radio\" name=\"tri\" value=\"er\">" + browser.i18n.getMessage("order_ByER") + "</a></label>";
            menuOrder += "<label class=\"order\" ><a class=\"drop-select-box-option OrderByGain\"><input type=\"radio\" name=\"tri\" value=\"gain\">" + browser.i18n.getMessage("order_ByGP") + "</a></label>";
            $("div.watch-list-buttons").append(menuOrder);

            var currentTri = JSON.parse(sessionStorage.getItem("etatTri"));
            if (currentTri != null) {
                $('div.menuTri input[value="' + currentTri + '"]').prop("checked", true);
                Trier(currentTri);
            }
            else
                $('div.menuTri input[value="aucun"]').prop("checked", true);

            $('div.menuTri input:radio[name="tri"]').change(function () {
                var value = $(this).val();
                Trier(value);
            });
        }
    }

    function Trier(value) {
        logger.log(`Sorting by ${value}`);
        if (value == "nom") {
            $("div.table-row:not(.empty)").sort(function (a, b) {
                a = $("span.user-nickname", a).text();
                b = $("span.user-nickname", b).text();
                return a.localeCompare(b);
            }).prependTo('div.table-body:first');
        }
        else if (value == "er") {
            $("div.table-row:not(.empty)").sort(function (a, b) {
                a = $("div.dataER", a).text();
                b = $("div.dataER", b).text();
                return a.localeCompare(b);
            }).prependTo('div.table-body:first');
        }
        else if (value == "gain") {
            $("div.table-row:not(.empty)").sort(function (a, b) {
                a = $("span.gain-num-amount", a).text();
                b = $("span.gain-num-amount", b).text();
                return a.localeCompare(b);
            }).prependTo('div.table-body:first');
        }
        if (value == "aucun") {
            sessionStorage.removeItem("etatTri");
            location.reload();
        }
        else
            sessionStorage.setItem("etatTri", JSON.stringify(value));
    }


    return {
        init
    };
})();
