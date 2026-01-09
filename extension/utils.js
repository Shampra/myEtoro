function searchByNom(eltName, data) {
    if (!data) return null;
    var returnedData = $.grep(data.records, function (element, index) { return element.NAME == eltName; });
    if (returnedData) return returnedData[0];
    else return undefined;
}

function prepareContent(arrayCible) {
    var contenu = "";
    if (arrayCible.TODO) contenu = "<div class=\"dataTODO " + arrayCible.TODO + "\" style=\"font-weight:bold\">" + arrayCible.TODO + "</div>";
    else contenu += " <div>...</div>";
    if (arrayCible.OUT) contenu += "<div class=\"dataOUT\" >(sortie à " + arrayCible.OUT + ")</div>";
    if (arrayCible.NOTE) contenu += "<div class=\"dataACTION\" >" + arrayCible.NOTE + "</div>";
    contenu += "<div class=\"dataOBJECTIF\" >";
    if (arrayCible.TARGET) contenu += " " + browser.i18n.getMessage("infosMarket_Objectif") + " = " + arrayCible.TARGET; else contenu += "-";
    if (arrayCible.ESTIMATE) contenu += " (" + arrayCible.ESTIMATE + ")";
    contenu += " </div>";
    contenu += prepareER(arrayCible);
    return contenu;
}

function prepareER(arrayCible) {
    var divER = "";
    if (arrayCible.ER != "") {
        var dateRapport = new Date(arrayCible.ER);
        var formatDateRapport = dateRapport.getDate() + "/" + (dateRapport.getMonth() + 1);
        var stringRapport = "ER le " + ("0" + dateRapport.getDate()).slice(-2) + "/" + ("0" + (dateRapport.getMonth() + 1)).slice(-2);
        var currentDate = new Date(); var previousDate = new Date(); var myClass = "";
        previousDate.setDate(currentDate.getDate() - 1);
        var todayDate = currentDate.getDate() + "/" + (currentDate.getMonth() + 1);
        var tomorrowDate = (currentDate.getDate() + 1) + "/" + (currentDate.getMonth() + 1);
        var yesterdayDate = (currentDate.getDate() - 1) + "/" + (currentDate.getMonth() + 1);
        if (todayDate == formatDateRapport) myClass = "ER_ajd";
        else if (tomorrowDate == formatDateRapport) myClass = "ER_demain";
        else if (yesterdayDate == formatDateRapport) myClass = "ER_hier";
        else if (previousDate > dateRapport) myClass = "ER_past";
        divER = "<div class=\"dataER " + myClass + "\">" + stringRapport + "</div>";
    }
    return divER;
}

function createFilter(choixFiltre, choixPage, sheetData) {
    if (choixFiltre == "Type" || choixFiltre == "All") {
        var menuFiltreType = "<div class=\"filter dropdown-menu menuFilter customMenu ng-scope \"><a class=\"icon\"><div class=\"filter\"><img class=\"bt_img\" src=\"" + browser.runtime.getURL('images/filtretype.png') + "\"/></div></a>" +
            "<div class=\"drop-select-box myBoxFilter typeFilter\">";
        menuFiltreType = menuFiltreType + "<label class=\"filter\" ><a class=\"drop-select-box-option\"><input type=\"checkbox\" value=\"TOUT\" checked>Tout</a></label>";
        menuFiltreType = menuFiltreType + "<label class=\"filter\" ><a class=\"drop-select-box-option\"><input type=\"checkbox\" value=\"US\" checked>US</a></label>";
        menuFiltreType = menuFiltreType + "<label class=\"filter\" ><a class=\"drop-select-box-option\"><input type=\"checkbox\" value=\"EU\" checked>Europe</a></label>";
        menuFiltreType = menuFiltreType + "<label class=\"filter\" ><a class=\"drop-select-box-option\"><input type=\"checkbox\" value=\"MAT\" checked>Matériel</a></label>";
        menuFiltreType = menuFiltreType + "<label class=\"filter\" ><a class=\"drop-select-box-option\"><input type=\"checkbox\" value=\"IND\" checked>Indices</a></label>";
        menuFiltreType = menuFiltreType + "<label class=\"filter\" ><a class=\"drop-select-box-option\"><input type=\"checkbox\" value=\"CR\" checked>Crypto</a></label>";
        menuFiltreType = menuFiltreType + "<label class=\"filter\" ><a class=\"drop-select-box-option\"><input type=\"checkbox\" value=\"UKN\" checked>Inconnu</a></label>";
        menuFiltreType = menuFiltreType + "</div></div>";

        $("div.inner-header-buttons").append(menuFiltreType);
        $("div.watch-list-buttons").append(menuFiltreType);
    }

    if ((choixFiltre == "Action" || choixFiltre == "All") && sheetData) {
        var arrayActions = [];
        $.each(sheetData.records, function (i, item) {
            if (item.TODO != "") {
                if (item.TODO.trim().indexOf(" ") != -1) {
                    var allitem = item.TODO.split(" ");
                    allitem.forEach(function (element) {
                        if ($.inArray(element, arrayActions) === -1 && element != "") {
                            arrayActions.push(element);
                        }
                    });
                }
                else {
                    if ($.inArray(item.TODO, arrayActions) === -1) {
                        arrayActions.push(item.TODO);
                    }
                }
            }
        });

        var menuFiltreAction = "<div class=\"filter dropdown-menu customMenu menuFilter ng-scope \"><a class=\"icon\"><div class=\"filter\"><img class=\"bt_img\" src=\"" + browser.runtime.getURL('images/filtreaction.png') + "\" width=\"22px\" /></div></a><div class=\"drop-select-box myBoxFilter actionFilter\">";
        menuFiltreAction = menuFiltreAction + "<label class=\"filter\"><a class=\"drop-select-box-option\"><input type=\"radio\" name=\"actionFiltre\" value=\"TOUT\" checked>Tout voir</a></label>";
        $.each(arrayActions, function (index, value) {
            menuFiltreAction = menuFiltreAction + "<label class=\"filter\"><a class=\"drop-select-box-option\"><input type=\"radio\" name=\"actionFiltre\" value=\"" + value + "\">" + value + "</a></label>";
        });
        menuFiltreAction = menuFiltreAction + "</div></div>";
        $("div.inner-header-buttons").append(menuFiltreAction);

        $('div.actionFilter input:radio[name="actionFiltre"]').change(function () {
            allFiltresByType(choixPage);
        });
    }

    $("div.typeFilter input").click(function (event) {
        if ($(this).val() == "TOUT") {
            $('div.typeFilter input[type="checkbox"]').prop('checked', true);
        }
        else if (!event.ctrlKey) {
            $('div.typeFilter input[type="checkbox"]').not($(this)).prop('checked', false);
            $(this).prop('checked', true);
        }
        else if ($(this).not(':checked')) {
            $('div.typeFilter input[value="TOUT"]').prop('checked', false);
        }
        allFiltresByType(choixPage);
    });
}

function allFiltresByType(listType) {
    var arrayFiltreType = [];
    var arrayFiltreAction = [];

    if ($("div.inner-header-buttons").find("div.typeFilter").length) {
        if ($('div.typeFilter input[value="TOUT"]').is(':checked'))
            arrayFiltreType.push(".TOUT");
        else {
            $("div.typeFilter input").each(function (index) {
                if ($(this).is(':checked')) arrayFiltreType.push("." + $(this).val());
            });
        }
    }

    if ($("div.inner-header-buttons").find("div.actionFilter").length) {
        if ($('div.actionFilter input[value="TOUT"]').not(':checked')) {
            $('div.actionFilter input:radio[name="actionFiltre"]').each(function (index) {
                if ($(this).is(':checked')) arrayFiltreAction.push("." + $(this).val());
            });
        }
    }

    var cibleElt = "";
    if (listType == "portfolio") cibleElt = "div.ui-table-row-container";
    else if (listType == "favori") cibleElt = "div.table-row";

    $(cibleElt).show();

    if (arrayFiltreType[0] != ".TOUT") {
        $(cibleElt).each(function (index) {
            if ($(this).find(".US,.EU,.MAT,.CR,.IND").length) {
                if (!$(this).find(arrayFiltreType.join()).length) $(this).hide();
            }
            else if (jQuery.inArray(".UKN", arrayFiltreType) < 0) {
                $(this).hide();
            }
        });
    }
    if (arrayFiltreAction.length > 0 && arrayFiltreAction[0] != ".TOUT") {
        $(cibleElt).each(function (index) {
            if (!$(this).find(arrayFiltreAction.join()).length) $(this).hide();
        });
    }
}
