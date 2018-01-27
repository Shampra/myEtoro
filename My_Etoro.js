// ==UserScript==
// @name        My_etoro
// @namespace   21onnet_etoro
// @include     https://www.etoro.com/*
// @version     1
// @require     https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @require     https://gist.github.com/raw/2625891/waitForKeyElements.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery-sheetrock/1.1.4/dist/sheetrock.min.js
// @noframes
// @grant    GM_addStyle
// ==/UserScript==



this.$ = this.jQuery = jQuery.noConflict(true);
// -----------------Paramétrage-----------------
var idSpreadsheet = "********************";
var SheetName = "YOURSHEETNAME";
// Nom des colonnes : NAME, ER, ALERT, LEVERAGE, TODO, OUT, NOTE
//-----------------------------------------------



var reqJson = "https://script.google.com/macros/s/AKfycbwDlJD_bcxGqXLK4rSpf0Yx-xBwtyGVeI3v4GipDFtlJiNWDIdU/exec?" +
  "id=" + idSpreadsheet +
  "&sheet=" + SheetName;
var sheetData;

// Séparation des détection pour mieux les gérer

waitForKeyElements("div.table-body.market", pageLoaded); // Favoris
waitForKeyElements("div.user-head-content-ph", pageLoaded); // Item
waitForKeyElements("portfolio-list-view", pageLoaded); // Porfolio complet par item ou par position
waitForKeyElements("div.portfolio-history-grid", pageLoaded); // Porfolio historique
waitForKeyElements("div.portfolio-table-view", pageLoaded); // Porfolio d'un item
//waitForKeyElements("div.user-head-content-ph, div.portfolio-table-view, div.table-wrapp",pageLoaded);


globalStyleSheet();


//Page chargé, on traite tout ce qui n'est fait qu'au premier lancement
function pageLoaded(jNode) {
  console.log("Lancement userscript Etoro");
  console.log(jNode);
  // Si on a déjà récup les données, on remets juste les éléments
  // TODO : prévoir une option "RESET"
  if (sheetData) {
    constructPage();
  }
  else {
    // Récup des données google Sheets
    var jqxhr = $.getJSON(reqJson, function () {
      console.log("Donnée Gsheets récupérée");
    })
      .fail(function () {
        console.log("ERREUR DE RECUPERATION");
      })
      .done(function (data) {
        sheetData = data; // stockage pour utilisation sans refaire l'appel AJAX
        constructPage(); // Puis on construit la page
      });

  }

}


// Fonction de mise en page, appelé une fois les données présentes
function constructPage() {
  insertData(sheetData);
  stylesheet();

}

// Insertion des données dans la page
function insertData(data) {

  /* Cibles à enrichir
  Page d'un marché
    div.market-page div.user-head-content div.user-head h1.user-nickname
    infos dans div.user-head
  Page des positions d'un marché
    a.i-portfolio-table-hat-cell p.i-portfolio-table-hat-symbol
  Page des favoris
    each div.table-name-cell div.user-nickname
  Page du portefeuille
    div.table-static-cell-info div.table-first-name


  */

  //--------------------------------------------------------------------------------------------
  // Traitement du Portefeuille (version "Aperçu"), url =  https://www.etoro.com/portfolio
  //--------------------------------------------------------------------------------------------
  if (window.location.href === "https://www.etoro.com/portfolio") {
    //enrichissement par ligne
    $("div.ui-table-static-cell").each(function (index) {
      if ($(this).find(".myData").length) return; // Il y a déjà l'élément, on arrête la boucle // TODO : A MODIFIER POUR MAJ

      // Récup de la valeur ciblée
      var currentItem = $(this).find("div.table-first-name").text();
      // Récup des infos
      var arrayCible = searchByNom(currentItem.toUpperCase(), data);
      if (arrayCible) {
        // Insertion hors infobulle de l'ER
        $(this).find("div.table-static-cell-info").append(prepareER(arrayCible));
        // On prépare le contenu
        var content = prepareContent(arrayCible);
        var tips = $("<div></div>").addClass("myData tooltip " + arrayCible.TYPE).append(content);
        //if (arrayCible.TYPE != "") tips.addClass=(arrayCible.TYPE);
        // On l'insère
        $(this).find("img.avatar").after(tips);
        // Gestion de la version tooltip
        $(this).hover(function () { $(this).next('.tooltip').css({ 'visibility': 'visible' }); },
          function () { $(this).next('.tooltip').css({ 'visibility': 'hidden' }); });

        // Mise en valeur si alerte
        if (arrayCible.ALERT == "x") $(this).find("div.table-first-name").css({ "color": "red" });
        // Mise en valeur si multiplicateur élevé
        if (arrayCible.LEVERAGE == "x") $(this).append("<span class=\"icon_leverage\">X10</span>");

      }
    });

    // Ajout des filtres par type et par action, si ce n'est déjà fait
    if ($("div.inner-header-buttons").find(".menuFilter").length) return;
    else {
      createFilter("All", "portfolio");
    }

    // Ajout Totaux par type
    if ($("div.inner-header-buttons").find(".viewTotaux").length) return;
    else {
      // Création de la liste des arrays possibles, avec la classe, le libellé, le GP et le total investi
      var aUS = new Array(".US", "Actions US", 0, 0);
      var aEU = new Array(".EU", "Actions EU", 0, 0);
      var aCR = new Array(".CR", "Crypto", 0, 0);
      var aMAT = new Array(".MAT", "Matériaux", 0, 0);
      var aUKN = new Array(".UKN", "Autres", 0, 0);
      var aList = new Array(aUS, aEU, aCR, aMAT, aUKN);

      var menuTotaux = "<div class=\"dropdown-menu menuFilter  ng-scope \" style=\" font-size:12px;\"><a class=\"icon\"><div class=\"filter spriteAction\">TOT</div></a><div class=\"drop-select-box myBoxFilter viewTotaux\"><div class=\"valueTotaux\" style=\"width:200px;\">";
      // Parcours des lignes avec calcul des sommes
      $("div.ui-table-row-container").each(function (index) {
        for (var x in aList) {
          if (aList[x][0] == ".UKN") // Si UKN, c'est le dernier array possible et pas réellement une classe, on traite sans chercher de classe
          {
            aList[x][2] = aList[x][2] + parseFloat($(this).find('[data-etoro-automation-id="portfolio-overview-table-body-cell-profit"]').text().replace('$', '').replace(',', ''));
            aList[x][3] = aList[x][3] + parseFloat($(this).find('[data-etoro-automation-id="portfolio-overview-table-body-cell-invested-value"]').text().replace('$', '').replace(',', ''));
          }
          else if ($(this).find(aList[x][0]).length) // Pour les autres valeurs, on cherche la classe et on arrête si trouvée
          {
            aList[x][2] = aList[x][2] + parseFloat($(this).find('[data-etoro-automation-id="portfolio-overview-table-body-cell-profit"]').text().replace('$', '').replace(',', ''));
            aList[x][3] = aList[x][3] + parseFloat($(this).find('[data-etoro-automation-id="portfolio-overview-table-body-cell-invested-value"]').text().replace('$', '').replace(',', ''));
            break;
          }
        }
      });

      // Création de l'insertion
      jQuery.each(aList, function (index, value) {
        if (value[2] > 0)
          menuTotaux = menuTotaux + "<div><label>" + value[1] + " = </label><span class=\"positive\">" + Math.round(value[2]).toLocaleString() + "</span> / " + Math.round(value[3]).toLocaleString() + "$ ("+ Math.round((value[2]/value[3])*100).toLocaleString() +"%)</div>";
        else
          menuTotaux = menuTotaux + "<div><label>" + value[1] + " = </label><span class=\"negative\">" + Math.round(value[2]).toLocaleString() + "</span> / " + Math.round(value[3]).toLocaleString() + "$ ("+ Math.round((value[2]/value[3])*100).toLocaleString() +"%)</div>";
      });
      // Insertion
      menuTotaux = menuTotaux + "</div><button class=\"updateTotaux\">Update</button></div></div>";
      $("div.inner-header-buttons").append(menuTotaux);

      // Refresh
      $(".updateTotaux").on('click', function (event) {
        $("div.valueTotaux").remove(); // On vire la div avec le résultat actuel
        // On le recalcul
        for (var x in aList){aList[x][2]=0; aList[x][3]=0;} // reset des sommes
        $("div.ui-table-row-container").each(function (index) {
          for (var x in aList) {
            if (aList[x][0] == ".UKN") // Si UKN, c'est le dernier array possible et pas réellement une classe, on traite sans chercher de classe
            {
              aList[x][2] = aList[x][2] + parseFloat($(this).find('[data-etoro-automation-id="portfolio-overview-table-body-cell-profit"]').text().replace('$', '').replace(',', ''));
              aList[x][3] = aList[x][3] + parseFloat($(this).find('[data-etoro-automation-id="portfolio-overview-table-body-cell-invested-value"]').text().replace('$', '').replace(',', ''));
            }
            else if ($(this).find(aList[x][0]).length) // Pour les autres valeurs, on cherche la classe et on arrête si trouvée
            {
              aList[x][2] = aList[x][2] + parseFloat($(this).find('[data-etoro-automation-id="portfolio-overview-table-body-cell-profit"]').text().replace('$', '').replace(',', ''));
              aList[x][3] = aList[x][3] + parseFloat($(this).find('[data-etoro-automation-id="portfolio-overview-table-body-cell-invested-value"]').text().replace('$', '').replace(',', ''));
              break;
            }
          }
        });

        menuTotaux = "<div class=\"valueTotaux\">";
        jQuery.each(aList, function (index, value) {
          if (value[2] > 0)
            menuTotaux = menuTotaux + "<div><label>" + value[1] + " = </label><span class=\"positive\">" + Math.round(value[2]).toLocaleString() + "</span> / " + Math.round(value[3]).toLocaleString() + "$ ("+ Math.round((value[2]/value[3])*100).toLocaleString() +"%)</div>";
          else
            menuTotaux = menuTotaux + "<div><label>" + value[1] + " = </label><span class=\"negative\">" + Math.round(value[2]).toLocaleString() + "</span> / " + Math.round(value[3]).toLocaleString() + "$ ("+ Math.round((value[2]/value[3])*100).toLocaleString() +"%)</div>";
        });
        menuTotaux = menuTotaux + "</div>";
        $("div.viewTotaux").append(menuTotaux);
      });
    }
  }
  //--------------------------------------------------------------------------------------------
  // Traitement sur l'historique, url = https://www.etoro.com/portfolio/history
  //--------------------------------------------------------------------------------------------
  else if (window.location.href == "https://www.etoro.com/portfolio/history") {
    // Ajout bouton d'export
    var menuExport = "<a class=\"icon actionExport mobile-off\"><div class=\"mode sprite list\"></div></a>";
    if ($("div.inner-header-buttons").find(".actionExport").length) return;
    else {
      $("div.inner-header-buttons").append(menuExport);

      $(".actionExport").on('click', function (event) {
        var titles = ['Titre complet', 'Fermeture complet', 'Ouvert', 'Fermé', 'Investi', 'Gain'];
        var data = [];
        data.push(titles);
        $('div.ui-table-row').each(function () {
          //var cItem =  $.trim($(this).find("div.i-portfolio-table-inner-name-symbol").clone().children().remove().end().text());
          var cItem = $.trim($(this).find("div.i-portfolio-table-inner-name-symbol").text());
          var cReason = $(this).find("div.i-history-close-reason ").attr('class');
          if (typeof cReason === "undefined") cReason = "Manuel";
          else if (cReason.indexOf("sl") > -1) cReason = "SL"; else if (cReason.indexOf("tp") > -1) cReason = "TP"; else if (cReason.indexOf("cr") > -1) cReason = "cr";
          var cOpenAt = $(this).find("p.i-portfolio-table-cell-inner-date").first().text();
          var cCloseAt = $(this).find("p.i-portfolio-table-cell-inner-date").first().text();
          var cInvesti = $(this).find("span.i-portfolio-table-marker-obj").first().text(); // Doit être le 1er... pas moyen de le reconnaitre hors position :(
          var cSorti = $(this).find("span.i-portfolio-table-marker-obj").eq(3).text();
          var cGain = $(this).find("span.i-portfolio-table-marker-obj").last().text(); // Doit être le 1er... pas moyen de le reconnaitre hors position :(
          var current = [cItem, cReason, cSorti, cOpenAt, cCloseAt, cInvesti, cGain];
          data.push(current);
        });
        let csv = "";
        data.forEach(function (rowArray) {
          let row = rowArray.join(";");
          csv += row + "\r\n"; // add carriage return
        });
        var csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);
        $(this)
          .attr({
            'download': "export.csv",
            'href': csvData,
            'target': '_blank'
          });
      });
    }

  }
  //--------------------------------------------------------------------------------------------
  // Traitement de l'ensemble des positions du portefeuille, url = https://www.etoro.com/portfolio/manual-trades
  //--------------------------------------------------------------------------------------------
  else if (window.location.href == "https://www.etoro.com/portfolio/manual-trades") {
    $("div.ui-table-row").each(function (index) {
      // Récup de la valeur ciblée
      var currentItem = $(this).find("div.table-first-name").children("span.ng-binding").last().text();
      // div.table-first-name span.ng-binding
      // Récup des infos
      var arrayCible = searchByNom(currentItem.toUpperCase(), data);
      if (arrayCible) {
        // On prépare le contenu
        var content = prepareContent(arrayCible);
        var tips = $("<div></div>").addClass("myData tooltip " + arrayCible.TYPE).append(content);
        //if (arrayCible.TYPE != "") tips.addClass=(arrayCible.TYPE);
        // On l'insère
        $(this).find("img.avatar").after(tips);
        // Gestion de la version tooltip
        $(this).hover(function () { $(this).next('.tooltip').css({ 'visibility': 'visible' }); },
          function () { $(this).next('.tooltip').css({ 'visibility': 'hidden' }); });

        // Mise en valeur si alerte
        if (arrayCible.ALERT == "x") $(this).find("div.table-first-name").css({ "color": "red" });
      }
    });

    // Ajout des filtres par type et par action, si ce n'est déjà fait
    if ($("div.inner-header-buttons").find(".menuFilter").length) return;
    else {
      createFilter("All", "portfolio");
    }

    // Ajout bouton d'export
    var menuExport = "<a class=\"icon actionExport mobile-off\"><div class=\"mode sprite list\"></div></a>";
    if ($("div.inner-header-buttons").find(".actionExport").length) return;
    else {
      $("div.inner-header-buttons").append(menuExport);


      $(".actionExport").on('click', function (event) {
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
          csv += row + "\r\n"; // add carriage return
        });
        var csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);
        $(this)
          .attr({
            'download': "export.csv",
            'href': csvData,
            'target': '_blank'
          });

      });


    }
  }
  //--------------------------------------------------------------------------------------------
  // Traitement d'un marché ex : https://www.etoro.com/markets/gddy
  //--------------------------------------------------------------------------------------------
  else if (document.location.href.indexOf('markets') > -1) {
    $("div.user-head-content-ph").each(function (index) {
      // Ajout des éléments vides
      if ($(this).find(".myData").length) return; // Il y a déjà l'élément, on arrête la boucle // TODO : A MODIFIER POUR MAJ

      // Récup de la valeur ciblée
      var currentItem = $(this).find("h1.user-nickname").text();
      // Récup des infos
      var arrayCible = searchByNom(currentItem.toUpperCase(), data);
      if (arrayCible) {

        // On prépare le contenu
        var content = prepareContent(arrayCible);
        var tips = $("<div></div>").addClass("myData").append(content);
        // On l'insère
        $(this).find("img.avatar").after(tips);
        // Gestion de la version tooltip
        // Mise en valeur si alerte
        if (arrayCible.ALERT == "x") $(this).find("h1.user-nickname").css({ "color": "red" });
        // Mise en valeur si multiplicateur élevé
        if (arrayCible.LEVERAGE == "x") $(this).append("<span class=\"icon_leverage\">X10</span>");

      }
    });
  }
  //--------------------------------------------------------------------------------------------
  // Traitement des favoris  https://www.etoro.com/watchlists ou https://www.etoro.com/watchlists/...
  //--------------------------------------------------------------------------------------------
  else if (document.location.href.indexOf('watchlists') > -1) {
    // Infos sur les favoris
    $("div.table-row").each(function (index) {
      // Ajout des éléments vides
      if ($(this).find(".myData").length) return; // Il y a déjà l'élément, on arrête la boucle // TODO : A MODIFIER POUR MAJ

      // Récup de la valeur ciblée
      var currentItem = $(this).find("span.user-nickname").text();
      // Récup des infos
      var arrayCible = searchByNom(currentItem.toUpperCase(), data);
      if (arrayCible) {

        // On prépare le contenu
        var content = prepareContent(arrayCible);
        var tips = $("<div></div>").addClass("myData tooltip " + arrayCible.TYPE).append(content);
        // On l'insère
        $(this).find("img.avatar").after(tips);
        // Gestion de la version tooltip
        $(this).hover(function () { $(this).next('.tooltip').css({ 'visibility': 'visible' }); },
          function () { $(this).next('.tooltip').css({ 'visibility': 'hidden' }); });

        // info ER
        $(this).find("div.table-info").before(prepareER(arrayCible));

        // Mise en valeur si alerte
        if (arrayCible.ALERT == "x") $(this).find("span.user-nickname").css({ "color": "red" });
        // Mise en valeur si multiplicateur élevé
        if (arrayCible.LEVERAGE == "x") $(this).append("<span class=\"icon_leverage\">X10</span>");

      }
    });

    // Ajout des filtres par type et par actions, si ce n'est déjà fait
    if ($("div.inner-header-buttons").find(".menuFilter").length) return;
    else {
      createFilter("All", "favori");
    }
  }
}

// Création d'un menu Filtre
// type de filtre =  Action ou Type
// Choix page : page source, Porfolio ou ...
function createFilter(choixFiltre, choixPage) {


  if (choixFiltre == "Type" || choixFiltre == "All") {
    var iconType = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAACXBIWXMAAAsTAAALEwEAmpwYAAAHJElEQVR42p3We1BTZxYA8IuLnWV22p3dndnpFtBaIBdBoTwEWhHlFR4xhABBkYCAa5Hy0laQgLqBJICCCBheEh4JIYhupdtaX+CiIAhIATVACCAPEQyICIrTmS3f2e8GGO1up68/ztyZ+/rdc75z7r0En88nfi5OffYZkb+Dqddo7RrXYbZNTm3PM0L/IA0JJ37J9T95UJScTBSFReu1WW6P71tvNa56bxNSrbdCAwYWaEDfQtPxoRP/bPD+P2ckJP16RBwVpfMli2Pf5uBaMEizmVGTNkhtYg1Pzn8B05evgZpmDXgfFWiQtFm8b+NYe4vO8CmIjV2bduzYTyMn4+N1WryZnvcdXZqGrRzQkO1WmEhMgfHoQzC8gw7Djq4wNzIKk7liGGFxYKqkDIYdnGDIcgsMWdmjQdutQ53OXpFno+J0fxTJTkwkunYyS0e2OqKHWx2BikdRUTCVlwfTdXUw290Nz/r74VlfH8y/fAnPNRqY4CXDzJWrMCUWw+o1OFC3i0tNfnz8/yOCI0eIpuCgfSOebpoxujMapTvD63CBMaYXTF+oBY1CBjNf1cH87FOYX1iAp023YIzNXD0XjdOdF1sDWRkneLzXSIJAQHBOSzf45F/c9unxct3siAO/7wjmxIz6e409YtPROJsO2vDFwXKFyX8cAU1FCTzazYSJ8F0wERZIHUMTbI+5Hm5gWk14yF/4/MA1e/O9Pvq72I/G5x8kCI/sy5bkWeW8qUSJLMqVw+7iGzGfnJTqlX6euLY5OmL3w1DfO5PBDPQ4mAH/G9T+8RCfoc59QYdqPw37Iz9z71uh5U4RflVkL0thgpjVtO+4pR6WhH3eLYFJYQ8iS+6BaakSzMp7kaW0b9Sj+NqBA8IivdwjPOJ6wi73wSjOV5pI34XpSDbC2+8nY1ldrQeDQsuSQ3STssLe2itxDA2sNh/wxTfHADDlJsCQ05bCirwTCbvcRpGxuAvRCnuALLkPGyVaCDZJVchCrp75qKwrLzSn2jCXl0BIPo/VVRyNffdcfPQ7pxMPE0nZYX8NL7PNDFSQk341Jsi32gRYOJjVWgC8MLK3yDuJsMv5t8gorxNhCGhFb0AVfRjqh83yAbBWqKfohddM32zL6LwQ/aBz5HCAwhhhAPzw0x+t54JPNW0VAM8q2lIohdhm3xBtOH0XGeV3gnFBN/heUAHv5hg41w4sQzIVWFSrwbZ2oD9EpNCjgKSMyN9x5ZZ3OBjwrzEGNgZCv3CA0dkR+LpfAZxaKwoAehW5FEIhNifrRe+fakcfS3rg4NUheL64CJr5FzD1/AWc650G2yrVKoToZbdTDp9IJcLFDvs5NRhQLAO7ai2gcegSNI/UQ2G7AFgKCwoANxm5xC3EiHXmddH6rDvISdINA5rnsLD4Cj75ZhBouGx5HY+BfXEQzCv7YDPGrKtV7RElKTqhlXZfrwKsamP4V68M6tVfgrfcCGdgAh4YcJeR4IqR4CJGEmGVcU20LrMVOWOkbewpPJpdgMuqabg0MA3+F3HJJA+0jWBeSa2PWsmVJOmESO0bKMBXu8Dr4PGzSVBplFDScQLSGmPAU76RAsAZI3sKMfKh8KrIIP022iK+CzfUGniCyxTzjRq8a3ohEmdEFlOt/WC147QIt9K+gQJ8tIgRyLpyYWh6EKYXZmEelzunlQ/OUhJ2SE2XgijEUnBFpC9sRobpt4FddQ9evHoFFd9OgHJyDti1/UAr7AZqhpY7rl+LBGPEB2eyE3eQ90onuck2aDOYe7kAqTcPYYAEp1XEjl8XrS9oQgbCZjDIaIHrA09AihHTM51gXtgFP2jtsl4tEoSRlWHTAnTZB1oktzUVHkz2gFuVGQZI2FZJol1ixj6CwSt/+73UW1P6aU1gIGqGzbnt+MQ5qFNOQdzlQdhY0AUmuLUpCL8RtMjuCoeG14AxXOo/D6NPx+AeBljn7GH7MgCOUtMX+8/s/hMRxxcS9scu7vkb/+bSKrTpdBtkNj6EloczEFGnAqP8b7UQWXxfyS1K0gnEyMqwYcgMsluOgrynGMq7xK+BSlPElGyP46UfXH7VRx/PIUyEdZk4I4RLh6HbgDsODE/egXXZ7fBB7l0wPoOhwh4ltyBJh4ORlWGjZgFcZDTwqdmyvA5agESeFXbFyRkJP/yeRKZlE3apF4IN05p69QXLjUBB67PaYEPOCiTu1iIB5Q4Nb8zCaidR64C2V5oP0UscIuMFMWt+9PObcjyViEzJWrNDWMMwFt64YpjR8h9qhpahDqpsD7gFiTr+5Q71bwAIZ/C9q8yyMbDIIyAuJUyXd5T3y/5WYvmZhE96qZFZ+vUCjLx6P7sd2WQ1lMSeEhA7c7aI3KpI5FJFfsc8+3HlnkyPTfsPh/22XyLteglzCB+B7F339H+6B5woX0vtC5D7rQnLYzv75zAMI4QRP3uP/wLMgjzhBfhiAwAAAABJRU5ErkJggg==";
    var menuFiltreType = "<div class=\"filter dropdown-menu menuFilter ng-scope \"><a class=\"icon\"><div class=\"filter spriteAction\"><img src=\"" + iconType + "\" width=\"22px\" /></div></a><div class=\"drop-select-box myBoxFilter typeFilter\">";
    menuFiltreType = menuFiltreType + "<label class=\"filter\" ><a class=\"drop-select-box-option\"><input type=\"checkbox\" value=\"TOUT\" checked>Tout</a></label>";
    menuFiltreType = menuFiltreType + "<label class=\"filter\" ><a class=\"drop-select-box-option\"><input type=\"checkbox\" value=\"US\" checked>US</a></label>";
    menuFiltreType = menuFiltreType + "<label class=\"filter\" ><a class=\"drop-select-box-option\"><input type=\"checkbox\" value=\"EU\" checked>Europe</a></label>";
    menuFiltreType = menuFiltreType + "<label class=\"filter\" ><a class=\"drop-select-box-option\"><input type=\"checkbox\" value=\"MAT\" checked>Matériel</a></label>";
    menuFiltreType = menuFiltreType + "<label class=\"filter\" ><a class=\"drop-select-box-option\"><input type=\"checkbox\" value=\"CR\" checked>Crypto</a></label>";
    menuFiltreType = menuFiltreType + "<label class=\"filter\" ><a class=\"drop-select-box-option\"><input type=\"checkbox\" value=\"UKN\" checked>Inconnnu</a></label>";
    menuFiltreType = menuFiltreType + "<button class=\"okFiltre\">OK</button></div></div>";

    $("div.inner-header-buttons").append(menuFiltreType);
    // Si on a des valeurs en mémoire...

  }
  // Filtre d'action
  if (choixFiltre == "Action" || choixFiltre == "All") {
    // On récupère dynamiquement la liste des actions présentes
    var arrayActions = [];
    $.each(sheetData.records, function (i, item) {
      if ($.inArray(item.TODO,arrayActions) === -1 && item.TODO != ""){
        arrayActions.push(item.TODO);
      }
    });

    var iconAction = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAMAAADzN3VRAAADAFBMVEX///8AAAACAgIDAwMEBAQFBQUGBgYHBwcICAgJCQkKCgoLCwsMDAwNDQ0ODg4PDw8QEBARERESEhITExMUFBQVFRUWFhYXFxcYGBgZGRkaGhobGxscHBwdHR0eHh4fHx8gICAhISEiIiIjIyMkJCQlJSUmJiYnJycoKCgpKSkqKiorKyssLCwtLS0uLi4vLy8wMDAxMTEyMjIzMzM0NDQ1NTU2NjY3Nzc4ODg5OTk6Ojo7Ozs8PDw9PT0+Pj4/Pz9AQEBBQUFCQkJDQ0NERERFRUVGRkZHR0dISEhJSUlKSkpLS0tMTExNTU1OTk5PT09QUFBRUVFSUlJTU1NUVFRVVVVWVlZXV1dYWFhZWVlaWlpbW1tcXFxdXV1eXl5fX19gYGBhYWFiYmJjY2NkZGRlZWVmZmZnZ2doaGhpaWlqampra2tsbGxtbW1ubm5vb29wcHBxcXFycnJzc3N0dHR1dXV2dnZ3d3d4eHh5eXl6enp7e3t8fHx9fX1+fn5/f3+AgICBgYGCgoKDg4OEhISFhYWGhoaHh4eIiIiJiYmKioqLi4uMjIyNjY2Ojo6Pj4+QkJCRkZGSkpKTk5OUlJSVlZWWlpaXl5eYmJiZmZmampqbm5ucnJydnZ2enp6fn5+goKChoaGioqKjo6OkpKSlpaWmpqanp6eoqKipqamqqqqrq6usrKytra2urq6vr6+wsLCxsbGysrKzs7O0tLS1tbW2tra3t7e4uLi5ubm6urq7u7u8vLy9vb2+vr6/v7/AwMDBwcHCwsLDw8PExMTFxcXGxsbHx8fIyMjJycnKysrLy8vMzMzNzc3Ozs7Pz8/Q0NDR0dHS0tLT09PU1NTV1dXW1tbX19fY2NjZ2dna2trb29vc3Nzd3d3e3t7f39/g4ODh4eHi4uLj4+Pk5OTl5eXm5ubn5+fo6Ojp6enq6urr6+vs7Ozt7e3u7u7v7+/w8PDx8fHy8vLz8/P09PT19fX29vb39/f4+Pj5+fn6+vr7+/v8/Pz9/f3+/v7///+VceJeAAAAAXRSTlMAQObYZgAAAAFiS0dE/6UH8sUAAAAJcEhZcwAACxMAAAsTAQCanBgAAABESURBVHjavZFBCgAgCASb/3+6QxCWDXiQ9qazKuoY7WLrBl5SJxjBarBu2BxKrhURAYePlAnGtAe6B3qVXyT89P3aBk1NzwBDB5qiYQAAAABJRU5ErkJggg==";
    var menuFiltreAction = "<div class=\"filter dropdown-menu menuFilter ng-scope \"><a class=\"icon\"><div class=\"filter spriteAction\"><img src=\"" + iconAction + "\" width=\"22px\" /></div></a><div class=\"drop-select-box myBoxFilter actionFilter\">";
    menuFiltreAction = menuFiltreAction + "<label class=\"filter\"><a class=\"drop-select-box-option\"><input type=\"radio\" name=\"actionFiltre\" value=\"TOUT\" checked>Tout voir</a></label>";
    $.each(arrayActions, function (index, value) {
      menuFiltreAction = menuFiltreAction + "<label class=\"filter\"><a class=\"drop-select-box-option\"><input type=\"radio\" name=\"actionFiltre\" value=\""+value+"\">"+value+"</a></label>";
    });
    menuFiltreAction = menuFiltreAction + "</div></div>";
    $("div.inner-header-buttons").append(menuFiltreAction);

    /// Mise à jour à partir des valeurs enregistrées
    arrayFiltreType = JSON.parse(sessionStorage.getItem("etatFiltreType_" + choixPage));
    arrayFiltreAction = JSON.parse(sessionStorage.getItem("etatFiltreAction_" + choixPage));
    // Si on a récupéré un array, on l'applique au menu filtre si présent
    if (arrayFiltreType != null && arrayFiltreType.length) {
      $('div.typeFilter input[type="checkbox"]').prop('checked', false);
      $.each(arrayFiltreType, function (index, value) {
        $('div.typeFilter input[value="' + value.replace(".", "") + '"]').prop('checked', true);
      });
    }

    if (arrayFiltreAction != null && arrayFiltreAction.length) {
      console.log('arrayFiltreAction: ', arrayFiltreAction[0].replace(".", ""));
      $('div.actionFilter input[value="' + arrayFiltreAction[0].replace(".", "") + '"]').prop('checked', true);

    }
    if (arrayFiltreAction != null || arrayFiltreType != null) allFiltresByType(choixPage);

    $('div.actionFilter input:radio[name="actionFiltre"]').change(function () {
      var value = ["." + $(this).val()];
      allFiltresByType(choixPage);
    });
  }
  // TRAITEMENT DES CHANGEMENTS
  // Sur clic du menu Type, on décoche les autres et on filtre sauf si CTRL maintenue (sélection multiple)
  $("div.typeFilter input").click(function (event) {
    if ($(this).val() == "TOUT") // TOUT = on coche tout de toute façon
    {
      $('div.typeFilter input[type="checkbox"]').prop('checked', true);
      allFiltresByType(choixPage);
    }
    else if (!event.ctrlKey) // Sinon sans CTRL, on coche que la case courant et on filtre aussitôt
    {
      $('div.typeFilter input[type="checkbox"]').not($(this)).prop('checked', false);
      $(this).prop('checked', true); // on clic sur un item = ça vire les autres, lui doit rester cocher du coup!
      allFiltresByType(choixPage);
    }
    else if ($(this).not(':checked')) // On décoche une case : on doit décocher aussi TOUT
      $('div.typeFilter input[value="TOUT"]').prop('checked', false);
  });
  // Clic sur le bouton OK
  $("div.typeFilter .okFiltre").click(function (event) {
    allFiltresByType(choixPage);
  });
}


// Application des filtres
function allFiltresByType(listType) {
  var arrayFiltreType = []; var arrayFiltreAction = [];
  // Récup du filtre de type si présent
  if ($("div.inner-header-buttons").find("div.typeFilter").length) {
    if ($('div.typeFilter input[value="TOUT"]').is(':checked'))
      arrayFiltreType.push(".TOUT");
    else {
      $("div.typeFilter input").each(function (index) {
        if ($(this).is(':checked')) arrayFiltreType.push("." + $(this).val());
      });
    }
  }
  // Récup du filtre d'action si présent
  if ($("div.inner-header-buttons").find("div.actionFilter").length) {
    if ($('div.actionFilter input[value="TOUT"]').not(':checked')) {

      $('div.actionFilter input:radio[name="actionFiltre"]').each(function (index) {
        if ($(this).is(':checked')) arrayFiltreAction.push("." + $(this).val());
      });
    }
  }

  // Stockage temporaire pour les garder pendant la session
  sessionStorage.setItem("etatFiltreType_" + listType, JSON.stringify(arrayFiltreType));
  sessionStorage.setItem("etatFiltreAction_" + listType, JSON.stringify(arrayFiltreAction));

  // Puis on filtre
  var cibleElt = "";
  if (listType == "portfolio") cibleElt = "div.ui-table-row-container";
  else if (listType == "favori") cibleElt = "div.table-row";

  // On commence par tout afficher - RAZ
  $(cibleElt).show();

  // On traite chacun en cachant ce qui n'est pas listé (hors TOUT)
  // Les filtres induisent un "ET" : les items doivent avoir les deux class sinon ils sont cachés
  if (arrayFiltreType[0] != ".TOUT") {
    // Si on a coché UKN, on doit afficher les catégorie inconnues.... comment?
    // -> Si aucune des catégories existantes et si pas UKN, on cache
    // Sinon Si l'item n'a aucun des tags, on le cache
    $(cibleElt).each(function (index) {
      if ($(this).find(".US,.EU,.MAT,.CR").length) // Si l'élément a un tag connu
      {
        if (!$(this).find(arrayFiltreType.join()).length) $(this).hide(); // ... et que ce tag n'est pas dans la liste, on cache
      }
      else if (jQuery.inArray(".UKN", arrayFiltreType) < 0) // UKN pas sélectionné, on les cache
      {
        $(this).hide();
      }

    });
  }
  if (arrayFiltreAction[0] != ".TOUT") {
    // On cache si tag différent du filtre
    $(cibleElt).each(function (index) {
      if (!$(this).find(arrayFiltreAction.join()).length) $(this).hide(); // tag pas demandé, on le cache
    });
  }

}

// Restauration des filtres d'après SessionStorage
function restoreFiltresByType(listType) {
  var arrayFiltreType = []; var arrayFiltreAction = [];
  arrayFiltreType = JSON.parse(sessionStorage.getItem("etatFiltreType_" + listType));
  arrayFiltreAction = JSON.parse(sessionStorage.getItem("etatFiltreAction_" + listType));
  console.log('arrayFiltreType: ', arrayFiltreType);
  console.log('arrayFiltreAction: ', arrayFiltreAction);

  // Si on a récupéré un array, on l'applique au menu filtre si présent
  if (arrayFiltreType.length && $("div.inner-header-buttons").find(".typeFilter").length) {
    $('div.typeFilter input[type="checkbox"]').each(function (index) {
      if (jQuery.inArray("." + $(this).val(), arrayFiltreType) < 0) $(this).prop('checked', false);
      else $(this).prop('checked', true);
    });
  }
  if (arrayFiltreAction.length && $("div.inner-header-buttons").find(".actionFilter").length) {
    $('div.actionFilter input[type="radio"]').each(function (index) {
      if (jQuery.inArray("." + $(this).val(), arrayFiltreAction) > -1) $(this).prop("checked", true).trigger("click");
    });
  }
}


// Prépare le html du contenu à insérer
function prepareContent(arrayCible) {
  // On insère la tooltip
  /*
  TODO ou -
  (sortie à OUT)
  Objectif = Obj (To)
  Action
  */
  var contenu = "";

  ////// TODO
  if (arrayCible.TODO) contenu = "<div class=\"dataTODO " + arrayCible.TODO + "\" style=\"font-weight:bold\">" + arrayCible.TODO + "</div>";
  else contenu = contenu + " <div>...</div>";

  if (arrayCible.OUT) contenu = contenu + "<div class=\"dataOUT\" >(sortie à " + arrayCible.OUT + ")</div>";
  if (arrayCible.NOTE) contenu = contenu + "<div class=\"dataACTION\" >" + arrayCible.NOTE + "</div>";

  ////// OBJECTIF
  contenu = contenu + "<div class=\"dataOBJECTIF\" >";
  if (arrayCible.TARGET) contenu = contenu + " Objectif = " + arrayCible.TARGET; else contenu = contenu + "-";
  if (arrayCible.ESTIMATE) contenu = contenu + " (" + arrayCible.ESTIMATE + ")";
  contenu = contenu + " </div>";


  ////////// DATE ER
  contenu = contenu + prepareER(arrayCible);
  return contenu;
}

// Mise en forme de la date ER
function prepareER(arrayCible){
  var divER ="";
  if (arrayCible.ER != "") {
    var dateRapport = new Date(arrayCible.ER);
    var formatDateRapport = dateRapport.getDate() + "/" + (dateRapport.getMonth() + 1);
    var stringRapport = "ER le " + ("0" + dateRapport.getDate()).slice(-2) + "/" + ("0" + (dateRapport.getMonth() + 1)).slice(-2);

    // mise en forme suivant date
    var currentDate = new Date(); var myClass = "";
    var todayDate = currentDate.getDate() + "/" + (currentDate.getMonth() + 1);
    var tomorrowDate = (currentDate.getDate() + 1) + "/" + (currentDate.getMonth() + 1);
    var yesterdayDate = (currentDate.getDate() - 1) + "/" + (currentDate.getMonth() + 1);
    if (todayDate == formatDateRapport) myClass = "ER_ajd";
    else if (tomorrowDate == formatDateRapport) myClass = "ER_demain";
    else if (yesterdayDate == formatDateRapport) myClass = "ER_hier";

    divER = "<div class=\"dataER " + myClass + "\">" + stringRapport + "</div>";
  }
return divER;

}

// Fonction de recherche dans l'array Json
function searchByNom(eltName, data) {
  var returnedData = $.grep(data.records, function (element, index) { return element.NAME == eltName; });
  if (returnedData) return returnedData[0];
  else return undefined;
}


function stylesheet() {

  // CSS du mydata générique
  $('.myData').css({
    'position': 'absolute',
    'height': '100%',
    'white-space': 'nowrap',
    'border': '1px solid #aaa',
    'border-radius': '5px',
    'display': 'inline-block',
    'background-color': '#F8F8F8',
    'padding': '0 5px',
    'box-shadow': ' 1px 1px 3px #aaa'
  });

  // Spécifique porfolio
  $('div.ui-table-static-cell div.myData, div.table-row div.myData').css({
    'font-size': '10px',
    'height': 'calc(100% + 12px)',
    'margin': '-6px 0px -6px 5px'
  });
  $('div.ui-table-static-cell div.myData div.dataER, div.table-row div.myData div.dataER').css({
    'display': 'none',
    'height': 'calc(100% + 12px)',
    'margin': '-6px 0px -6px 5px'
  });

  // Spécifique market
  $('div.user-head-content-ph div.myData').css({
    'font-size': '10px',
    'height': 'calc(100% + 12px)',
    'margin': '-6px 0px -6px 400px',
    'min-width': '200px'
  });

// Spécifique favoris
$('div[ng-model="watchlist.Instruments"] .dataER').css({
    'font-size': '10px',
    'position':'absolute',
    'display':'inline',
    'margin':'12px',
    'font-weight':'normal',
    'color':'grey'
  });



  // Date de rapport
  $('.dataER').css({
    'font-size': '10px'
  });
  $('.ER_hier').css({
    'background-color': 'beige'
  });
  $('.ER_ajd').css({
    'font-weight': 'bold',
    'color': 'red',
    'font-size': '12px',
    'background-color': 'beige'
  });
  $('.ER_demain').css({
    'font-weight': 'bold',
    'background-color': 'beige'
  });

  // TOOLTIP
  $("img.avatar, img.i-portfolio-table-hat-avatar").hover(function () { $(this).next('.tooltip').css({ 'visibility': 'visible' }); },
    function () { $(this).next('.tooltip').css({ 'visibility': 'hidden' }); });


  $('div.tooltip').css({
    'visibility': 'hidden',
  });

  $('.icon_leverage').css({
    'vertical-align': 'sub',
    'font-size': '8px',
    'font-weight': 'bold',
    'position': 'absolute',
    'left': '5px',
    'top': '0'
  });

  // Filtres
  $("div.menuFilter, div.myBoxFilter").hover(function () { $(this).find('div.myBoxFilter').show(); },
    function () { $(this).find('.myBoxFilter').hide(); });

  $('.myBoxFilter').css({
    'top': '60px',
    'min-width': '150px',
    'padding': '5px'
  });

  $('.myBoxFilter input').css({
    'margin-right': '5px',
    'margin-left': '-5px'
  });

  $('.myBoxFilter .okFiltre, .myBoxFilter .updateTotaux').css({
    'width': 'calc(100% + 8px)',
    'margin': '-4px',
    'border': '1px solid black'
  });

  $('.spriteAction').css({
    'background-position': 'inherit'
  });

}

function globalStyleSheet() {
  $('body').css({
    '-moz-user-select': 'auto',
    '-webkit-user-select': 'auto',
    'user-select': 'auto'
  });

}