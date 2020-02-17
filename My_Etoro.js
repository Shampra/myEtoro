this.$ = this.jQuery = jQuery.noConflict(true);

browser.runtime.sendMessage({"action": "off"});
// Variables globales
// Définition des images
var imgURL_Export = chrome.extension.getURL("images/export-excel.png");
var imgURL_Stats = chrome.extension.getURL("images/percentage.png");
var imgURL_Filtretype = chrome.extension.getURL("images/filtretype.png");
var imgURL_Filtreaction = chrome.extension.getURL("images/filtreaction.png");
var imgURL_Order = chrome.extension.getURL("images/order.png");
var imgURL_History = chrome.extension.getURL("images/history.png");
var imgURL_AlertOff = chrome.extension.getURL("images/alert_off.png");
var imgURL_AlertOn = chrome.extension.getURL("images/alert_on.png");


var sheetData;
var reqJson;




// Récupération du paramétrage
var gettingItem = browser.storage.local.get();
gettingItem.then(onGot, onError);
// erreur sur promise
function onError(error) {
  console.log(`Error: ${error}`);
}

// Retour ok et affectation : on lance My_Etoro
function onGot(item) {
  console.log("Récupération paramétrage");
  console.log(item);
  
  // Modification des titres de pages, plus concis
	if (item.MyEtoro_setShortTitle && document.location.href.indexOf('markets') > -1) 
	{
		setInterval(function(){
			var titre = $(".user-fullname").first().text();
			if (document.title != titre) document.title = titre;
		},5000);			
	}	

  
  var idSpreadsheet = item.MyEtoro_idSpreadsheet;
  var SheetName = item.MyEtoro_SheetName;

  if (SheetName && idSpreadsheet)
    reqJson = "https://script.google.com/macros/s/AKfycbwDlJD_bcxGqXLK4rSpf0Yx-xBwtyGVeI3v4GipDFtlJiNWDIdU/exec?" +
    "id=" + idSpreadsheet +
    "&sheet=" + SheetName;
  if (SheetName && idSpreadsheet)
    {
      browser.runtime.sendMessage({"action": "waiting"});
        // Séparation des détection pour mieux les gérer
      waitForKeyElements("div.watchlist-body", pageLoaded); // Favoris
      waitForKeyElements("div.user-head-content-ph", pageLoaded); // Item
      waitForKeyElements("portfolio-list-view", pageLoaded); // Porfolio complet par item ou par position
      waitForKeyElements("div.portfolio-history-grid", pageLoaded); // Porfolio historique
      waitForKeyElements("div.portfolio-table-view", pageLoaded); // Porfolio d'un item
      waitForKeyElements("div.notification-modal__container", pageLoaded_Design); // Notification
      
      //waitForKeyElements("div.user-head-content-ph, div.portfolio-table-view, div.table-wrapp",pageLoaded);
      
      globalStyleSheet();
    }
    else
    {
      browser.runtime.sendMessage({"action": "na"});
    }
    
}

// Detection d'un élément à customiser
// Fonction séparé de pageLoaded car pas besoin de data, on zappe tout ce qui les concerne...
function pageLoaded_Design(jNode){
  $("div.notification-item__avatar img").each(function (index) {
    var item = $(this).attr("alt");
    $(this).wrap($('<a href="/markets/'+item+'"></a>'));
  });
  // Corrige les images trop grande pour certaines notif à cause de l'injection du a
  $('.notification-item__avatar a img').css({
  'width': '50px'
});

}


//Page chargé, on traite tout ce qui n'est fait qu'au premier lancement
function pageLoaded(jNode) {
  console.log("Lancement userscript Etoro");
  // Si on a déjà récup les données, on remets juste les éléments
  // TODO : prévoir une option "RESET"
  // On regarde si les données sont dans le session storage
  let Expiration_data = sessionStorage.getItem("dataMyEtoro_expiration");
  let now = new Date().getTime(); 
    
  var tmpSheetData = JSON.parse(sessionStorage.getItem("dataMyEtoro"));
  var reload_data  = "first";
  // Si on a les data quelques part, on charge
  if (sheetData) {
    reload_data = "no";
    console.log("data déjà en mémoire");
    browser.runtime.sendMessage({"action": "ok"});
    constructPage();
  }
  else if (tmpSheetData)
  {
    reload_data = "no";
    console.log("chargement data depuis storage");
    browser.runtime.sendMessage({"action": "ok"});
    sheetData = tmpSheetData; 
    constructPage();
  }
 
  // Rafraichissement des data à expiration
  if (now > Expiration_data)
  {
    reload_data = "refresh";
    sessionStorage.removeItem("dataMyEtoro");
    browser.runtime.sendMessage({"action": "update"});
    console.log("reset");
  }
  
// Si rien en mémoire et rien en stockage session storage ou si mise à jour, on récup (donc pas de else, on peut charger puis mettre à jour)
  if (reload_data != "no")
  {
    console.log("load");
    if (reload_data == "refresh")
    {
      browser.runtime.sendMessage({"action": "update"});
      console.log("refresh")
    }
    else
      browser.runtime.sendMessage({"action": "lancement"});
    // Récup des données google Sheets, si configuré
    if (reqJson)
    {
      var jqxhr = $.getJSON(reqJson, function () {
        console.log("Donnée Gsheets récupérée");
      })
        .fail(function (result) {
          console.log("ERREUR DE RECUPERATION : ");
          console.log(result);
          browser.runtime.sendMessage({"action": "error"});
        })
        .done(function (data) {
          browser.runtime.sendMessage({"action": "ok"});
          sheetData = data; // stockage pour utilisation sans refaire l'appel AJAX
          sessionStorage.setItem("dataMyEtoro", JSON.stringify(data));
          let expiration = new Date().getTime() + (1000*60*30); // expiration à 30mn
          sessionStorage.setItem("dataMyEtoro_expiration", expiration);
          constructPage(); // Puis on construit la page
        });
    }
   

  }

}


// Fonction de mise en page, appelé une fois les données présentes
function constructPage() {
  insertData(sheetData);
  stylesheet();

}

// Insertion des données dans la page
function insertData(data) {

  //--------------------------------------------------------------------------------------------
  // Traitement du Portefeuille (version "Aperçu"), url =  https://www.etoro.com/portfolio
  //--------------------------------------------------------------------------------------------
  if (window.location.href === "https://www.etoro.com/portfolio") {
    //enrichissement par ligne
    $("div.ui-table-static-cell").each(function (index) {
      if ($(this).find(".myData").length) return; // Il y a déjà l'élément, on arrête la boucle // TODO : A MODIFIER POUR MAJ

      // Récup de la valeur ciblée
      var currentItem = $(this).find("div.table-first-name").text().trim();
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
      var aIND = new Array(".IND", "Indices", 0, 0);
      var aUKN = new Array(".UKN", "Autres", 0, 0);
      var aList = new Array(aUS, aEU, aCR, aMAT, aIND, aUKN);

      var menuTotaux = "<div class=\"dropdown-menu customMenu menuFilter  ng-scope \" style=\" font-size:12px;\"><a class=\"icon\"><div class=\"filter\"><img class=\"bt_img\" src=\""+imgURL_Stats+"\"/></div></a><div class=\"drop-select-box myBoxFilter viewTotaux\"><div class=\"valueTotaux\" style=\"width:200px;\">";
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
          menuTotaux = menuTotaux + "<div><label>" + value[1] + " = </label><span class=\"positive\">" + Math.round(value[2]).toLocaleString() + "</span> / " + Math.round(value[3]).toLocaleString() + "$ (" + Math.round((value[2] / value[3]) * 100).toLocaleString() + "%)</div>";
        else
          menuTotaux = menuTotaux + "<div><label>" + value[1] + " = </label><span class=\"negative\">" + Math.round(value[2]).toLocaleString() + "</span> / " + Math.round(value[3]).toLocaleString() + "$ (" + Math.round((value[2] / value[3]) * 100).toLocaleString() + "%)</div>";
      });
      // Insertion
      menuTotaux = menuTotaux + "</div><button class=\"updateTotaux\">" + browser.i18n.getMessage("boutonUpdate") + "</button></div></div>";
      $("div.inner-header-buttons").append(menuTotaux);

      // Refresh
      $(".updateTotaux").on('click', function (event) {
        $("div.valueTotaux").remove(); // On vire la div avec le résultat actuel
        // On le recalcul
        for (var x in aList) { aList[x][2] = 0; aList[x][3] = 0; } // reset des sommes
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
            menuTotaux = menuTotaux + "<div><label>" + value[1] + " = </label><span class=\"positive\">" + Math.round(value[2]).toLocaleString() + "</span> / " + Math.round(value[3]).toLocaleString() + "$ (" + Math.round((value[2] / value[3]) * 100).toLocaleString() + "%)</div>";
          else
            menuTotaux = menuTotaux + "<div><label>" + value[1] + " = </label><span class=\"negative\">" + Math.round(value[2]).toLocaleString() + "</span> / " + Math.round(value[3]).toLocaleString() + "$ (" + Math.round((value[2] / value[3]) * 100).toLocaleString() + "%)</div>";
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
    var menuExport = "<a class=\"icon actionExport customMenu mobile-off\"><div class=\"list\"><img class=\"bt_img\" src=\""+imgURL_Export+"\"/></div></a>";
    if ($("div.inner-header-buttons").find(".actionExport").length) return;
    else {
      $("div.inner-header-buttons").append(menuExport);

      $(".actionExport").on('click', function (event) {
        // On déplie toute la liste
        var checkExist = setInterval(function () {
          if ($('button.more-info-button').length) {
            console.log("Exists!");
            $('button.more-info-button').click();
          }
          else {
            // C'est déplié, on poursuit

            clearInterval(checkExist);
          }
        }, 500);

        var titles = ['Titre complet', 'Levier', 'Type fermeture', 'Prix fermeture', 'Date ouverture', 'Date fermeture', 'Investi', 'Gain', 'Frais'];
        var data = [];
        data.push(titles);

        // Pour améliorer le process : chercher le titre ui-table-head-slot ui-table-cell[name="..."]
        var idx_investi = $('ui-table-cell[name=invested]').index();
        var idx_frais = $('ui-table-cell[name=Fees]').index();
        var idx_levier = $('ui-table-cell[name=leverage]').index();
        var idx_fermeture = $('ui-table-cell[name=close]').index();
        var idx_gain = $('ui-table-cell[name=plPercentage]').index();

        $('div.ui-table-row').each(function () {
          // On filtre pour n'avoir que les positions
          if ($(this).find("span.i-portfolio-table-marker-obj").last().text() != "") {
            // Item : élément spécifique .i-portfolio-table-inner-name-symbol
            //var cItem =  $.trim($(this).find("div.i-portfolio-table-inner-name-symbol").clone().children().remove().end().text());
            var cTitre = $.trim($(this).find("div.i-portfolio-table-inner-name-symbol").text());
            // Levier, on utilise la détection du titre
            var cLevier = "-";
            if (idx_levier != -1 ) cLevier = $(this).find("ui-table-cell").eq(idx_levier).find("span.i-portfolio-table-marker-obj").text();
            // Type de fermeture : élément détectable directement
            var cReason = $(this).find("div.i-history-close-reason ").attr('class');
            if (typeof cReason === "undefined") cReason = "Manuel"; else if (cReason.indexOf("sl") > -1) cReason = "SL"; else if (cReason.indexOf("tp") > -1) cReason = "TP"; else if (cReason.indexOf("cr") > -1) cReason = "cr";
            // Fermé à, via détection du titre
            var cSorti = "-";
            if (idx_fermeture != -1 ) cSorti = $(this).find("ui-table-cell").eq(idx_fermeture).find("span.i-portfolio-table-marker-obj").text();
            cSorti = cSorti.replace('.', ',');
            // Date ouverture, spécifique
            var cDateOpen = $(this).find("p.i-portfolio-table-cell-inner-date").first().text();
            // Date fermeture, spécifique
            var cDateClose = $(this).find("p.i-portfolio-table-cell-inner-date").eq(2).text();
            // Montant, via détection du titre
            var cInvesti = "-";
            if (idx_investi != -1 ) cInvesti = $(this).find("ui-table-cell").eq(idx_investi).find("span.i-portfolio-table-marker-obj").text();
            cInvesti = cInvesti.replace('.', ',').replace('$', '');
            // GP, via détection du titre
            var cGain = "-";
            if (idx_gain != -1 ) cGain = $(this).find("ui-table-cell").eq(idx_gain).find("span.i-portfolio-table-marker-obj").text();
            cGain = cGain.replace('.', ',');
            // Frais, via détection du titre
            var cFrais = "-";
            if (idx_frais != -1) cFrais = $(this).find("ui-table-cell").eq(idx_frais).text();
            cFrais = cFrais.replace('.', ',').replace('$', '').replace(/\s/g, '');

            var current = [cTitre, cLevier, cReason, cSorti, cDateOpen, cDateClose, cInvesti, cGain, cFrais];
            data.push(current);
          }
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
      var currentItem = $(this).find("div.table-first-name").children("span.ng-binding").last().text().trim();
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
    var menuExport = "<a class=\"icon actionExport customMenu mobile-off\"><div class=\"list\"><img class=\"bt_img\" src=\""+imgURL_Export+"\"/></div></a>";
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

    // Ajout Totaux par type
    // Verif si présence de la colonne total!
    // ui-table-head data-etoro-automation-id = portfolio-manual-trades-table-header-cell-net-profit-amount
    // data-etoro-automation-id = portfolio-manual-trades-table-body-cell-container-profit
    if ($("div.inner-header-buttons").find(".viewTotaux").length) return;
    else if ($("div.ui-table-head").find('[data-etoro-automation-id="portfolio-manual-trades-table-header-cell-net-profit-amount"]')) // Si on a bien une colonne de profit
    {
      console.log("Colonne trouvée!");
      // Création de la liste des arrays possibles, avec la classe, le libellé, le GP et le total investi
      var aUS = new Array(".US", "Actions US", 0, 0);
      var aEU = new Array(".EU", "Actions EU", 0, 0);
      var aCR = new Array(".CR", "Crypto", 0, 0);
      var aMAT = new Array(".MAT", "Matériaux", 0, 0);
      var aIND = new Array(".IND", "Indices", 0, 0);
      var aUKN = new Array(".UKN", "Autres", 0, 0);
      var aList = new Array(aUS, aEU, aCR, aMAT, aIND, aUKN);

      var menuTotaux = "<div class=\"dropdown-menu customMenu menuFilter  ng-scope \" style=\" font-size:12px;\"><a class=\"icon\"><div class=\"filter\"><img class=\"bt_img\" src=\""+imgURL_Stats+"\"/></div></a><div class=\"drop-select-box myBoxFilter viewTotaux\"><div class=\"valueTotaux\" style=\"width:200px;\">";
      // Parcours des lignes avec calcul des sommes
      $("div.ui-table-row-container").each(function (index) {
        console.log("une ligne...");
        for (var x in aList) {
          if (aList[x][0] == ".UKN") // Si UKN, c'est le dernier array possible et pas réellement une classe, on traite sans chercher de classe
          {
            aList[x][2] = aList[x][2] + parseFloat($(this).find('[data-etoro-automation-id="portfolio-manual-trades-table-body-cell-container-profit"]').text().replace('$', '').replace(',', ''));
            aList[x][3] = aList[x][3] + parseFloat($(this).find('[data-etoro-automation-id="portfolio-manual-trades-table-body-invested-value"]').text().replace('$', '').replace(',', ''));
          }
          else if ($(this).find(aList[x][0]).length) // Pour les autres valeurs, on cherche la classe et on arrête si trouvée
          {
            aList[x][2] = aList[x][2] + parseFloat($(this).find('[data-etoro-automation-id="portfolio-manual-trades-table-body-cell-container-profit"]').text().replace('$', '').replace(',', ''));
            aList[x][3] = aList[x][3] + parseFloat($(this).find('[data-etoro-automation-id="portfolio-manual-trades-table-body-invested-value"]').text().replace('$', '').replace(',', ''));
            break;
          }
        }
      });

      // Création de l'insertion
      jQuery.each(aList, function (index, value) {
        if (value[2] > 0)
          menuTotaux = menuTotaux + "<div><label>" + value[1] + " = </label><span class=\"positive\">" + Math.round(value[2]).toLocaleString() + "</span> / " + Math.round(value[3]).toLocaleString() + "$ (" + Math.round((value[2] / value[3]) * 100).toLocaleString() + "%)</div>";
        else
          menuTotaux = menuTotaux + "<div><label>" + value[1] + " = </label><span class=\"negative\">" + Math.round(value[2]).toLocaleString() + "</span> / " + Math.round(value[3]).toLocaleString() + "$ (" + Math.round((value[2] / value[3]) * 100).toLocaleString() + "%)</div>";
      });
      // Insertion
      menuTotaux = menuTotaux + "</div><button class=\"updateTotaux\">" + browser.i18n.getMessage("boutonUpdate") + "</button></div></div>";
      $("div.inner-header-buttons").append(menuTotaux);

      // Refresh
      $(".updateTotaux").on('click', function (event) {
        $("div.valueTotaux").remove(); // On vire la div avec le résultat actuel
        // On le recalcul
        for (var x in aList) { aList[x][2] = 0; aList[x][3] = 0; } // reset des sommes
        $("div.ui-table-row-container").each(function (index) {
          for (var x in aList) {
            if (aList[x][0] == ".UKN") // Si UKN, c'est le dernier array possible et pas réellement une classe, on traite sans chercher de classe
            {
              aList[x][2] = aList[x][2] + parseFloat($(this).find('[data-etoro-automation-id="portfolio-manual-trades-table-body-cell-container-profit"]').text().replace('$', '').replace(',', ''));
              aList[x][3] = aList[x][3] + parseFloat($(this).find('[data-etoro-automation-id="portfolio-manual-trades-table-body-invested-value"]').text().replace('$', '').replace(',', ''));
            }
            else if ($(this).find(aList[x][0]).length) // Pour les autres valeurs, on cherche la classe et on arrête si trouvée
            {
              aList[x][2] = aList[x][2] + parseFloat($(this).find('[data-etoro-automation-id="portfolio-manual-trades-table-body-cell-container-profit"]').text().replace('$', '').replace(',', ''));
              aList[x][3] = aList[x][3] + parseFloat($(this).find('[data-etoro-automation-id="portfolio-manual-trades-table-body-invested-value"]').text().replace('$', '').replace(',', ''));
              break;
            }
          }
        });

        menuTotaux = "<div class=\"valueTotaux\">";
        jQuery.each(aList, function (index, value) {
          if (value[2] > 0)
            menuTotaux = menuTotaux + "<div><label>" + value[1] + " = </label><span class=\"positive\">" + Math.round(value[2]).toLocaleString() + "</span> / " + Math.round(value[3]).toLocaleString() + "$ (" + Math.round((value[2] / value[3]) * 100).toLocaleString() + "%)</div>";
          else
            menuTotaux = menuTotaux + "<div><label>" + value[1] + " = </label><span class=\"negative\">" + Math.round(value[2]).toLocaleString() + "</span> / " + Math.round(value[3]).toLocaleString() + "$ (" + Math.round((value[2] / value[3]) * 100).toLocaleString() + "%)</div>";
        });
        menuTotaux = menuTotaux + "</div>";
        $("div.viewTotaux").append(menuTotaux);
      });
    }

        // Ajout filtre "Alerte"
        if ($("div.inner-header-buttons").find(".viewAlert").length) return;
        else
        {
          var menuAlert = "<div class=\"dropdown-menu customMenu viewAlert  ng-scope \" style=\" font-size:12px;\"><a class=\"icon\"><div class=\"filter\"><img id=\"alert_img\" class=\"bt_img\" src=\""+imgURL_AlertOff+"\"/></div></a></div>";
          $("div.inner-header-buttons").append(menuAlert);
          $(".viewAlert").on('click', function (event) {
            console.log("test");
            var cibleElt = "div.ui-table-row-container";
            if($("#alert_img").attr("src") === imgURL_AlertOff) // On cache et change l'image
            {
              $("#alert_img").attr("src", imgURL_AlertOn)
              $(cibleElt).each(function (index) {if (!$(this).find(".positive-border, .negative-border").length) $(this).hide();});
            } // On désactive ce filtre
            else
            {
              $("#alert_img").attr("src", imgURL_AlertOff)
              allFiltresByType("portfolio"); // On réapplique les autres filtres, tout simplement
            }

          });
        }

  }
  //--------------------------------------------------------------------------------------------
  // Traitement d'un marché ex : https://www.etoro.com/markets/gddy
  //--------------------------------------------------------------------------------------------
  else if (document.location.href.indexOf('markets') > -1) {
    var currentItem;
    // Box d'infos
    $("div.user-head-content-ph").each(function (index) {
      // Ajout des éléments vides
      if ($(this).find(".myData").length) return; // Il y a déjà l'élément, on arrête la boucle // TODO : A MODIFIER POUR MAJ
	  
		

      // Récup de la valeur ciblée
      currentItem = $(this).find("h1.user-nickname").text();


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
        if (arrayCible.LEVERAGE != "") $(this).find(".myData").append("<span class=\"icon_leverage_market\">"+arrayCible.LEVERAGE+"</span>");
      }
    });
    // Ajout raccourci vers historique
    if (!$("body").find("#customHisto").length)
      $("tabstitles.w-instrument-navigation").append('<tabtitle id="customHisto"><a href="/portfolio/history/market/' + currentItem + '"><span class="i-instrument-navigation-item e-link pointer stats-list">'+
      '<span class="sprite"><img class="bt_img" src="'+imgURL_History+'"/></span>'+
      '<span class="i-instrument-navigation-item-label ng-scope">Historique</span> </span></a></tabtitle>');

  }
  //--------------------------------------------------------------------------------------------
  // Traitement des favoris  https://www.etoro.com/watchlists ou https://www.etoro.com/watchlists/...
  //--------------------------------------------------------------------------------------------
  else if (document.location.href.indexOf('watchlists') > -1) {
    // Infos sur les favoris
    $("div.row-wrap").each(function (index) {
      // Ajout des éléments vides
      if ($(this).find(".myData").length) return; // Il y a déjà l'élément, on arrête la boucle // TODO : A MODIFIER POUR MAJ

      // Récup de la valeur ciblée
      var currentItem = $(this).find("div.symbol").text();
      // Récup et affichage des infos
      var arrayCible = searchByNom(currentItem.toUpperCase(), data);
      if (arrayCible) {

        // On prépare le contenu
        var content = prepareContent(arrayCible);
        var tips = $("<div></div>").addClass("myData tooltip " + arrayCible.TYPE).append(content);
        // On l'insère
        $(this).find("a.card-avatar-wrap").after(tips);
        // Gestion de la version tooltip
        $(this).hover(function () { $(this).find('.tooltip').css({ 'visibility': 'visible' }); },
          function () {$(this).find('.tooltip').css({ 'visibility': 'hidden' }); });

        // info ER
        $(this).find("div.table-info").before(prepareER(arrayCible));

        // Mise en valeur si alerte
        if (arrayCible.ALERT == "x") $(this).find("div.symbol").css({ "color": "red" });
        // Mise en valeur si multiplicateur élevé
        if (arrayCible.LEVERAGE != "") $(this).append("<span class=\"icon_leverage\">"+arrayCible.LEVERAGE+"</span>");
      }

      // Mise en avant des % au lieu des unités pour la variation
      var EltPro = $(this).find(".instrument-pro");
      var EltNum = $(this).find(".instrument-num");
      EltNum.after(EltPro);
      EltPro.wrap($('<div style="margin: -8px 0;"></div>'));
      EltPro.toggleClass( "instrument-pro instrument-num" );
      EltNum.toggleClass( "instrument-pro instrument-num" );
      
    });

    // Ajout des filtres par type et par actions, si ce n'est déjà fait
    if ($("div.watch-list-buttons").find(".menuFilter").length) return;
    else {
      // TODO : ne marche plus, format spécifique aux listes
      //createFilter("All", "favori");
    }

    // Ajout du tri
    if ($("div.watch-list-buttons").find(".menuOrder").length) return;
    else {
      var menuOrder = "<div class=\"filter dropdown-menu menuFilter ng-scope customMenu \"><a class=\"icon\"><div class=\"filter\"><img class=\"bt_img\" src=\""+imgURL_Order+"\"/></div></a><div class=\"drop-select-box myBoxFilter menuTri\">";
      menuOrder = menuOrder + "<label class=\"order\" ><a class=\"drop-select-box-option NoOrder\"><input type=\"radio\" name=\"tri\" value=\"aucun\">"+browser.i18n.getMessage("order_ByDefault")+"</a></label>";
      menuOrder = menuOrder + "<label class=\"order\" ><a class=\"drop-select-box-option OrderByName\"><input type=\"radio\" name=\"tri\" value=\"nom\">"+browser.i18n.getMessage("order_ByName")+"</a></label>";
      menuOrder = menuOrder + "<label class=\"order\" ><a class=\"drop-select-box-option OrderByER\"><input type=\"radio\" name=\"tri\" value=\"er\">"+browser.i18n.getMessage("order_ByER")+"</a></label>";
      menuOrder = menuOrder + "<label class=\"order\" ><a class=\"drop-select-box-option OrderByGain\"><input type=\"radio\" name=\"tri\" value=\"gain\">"+browser.i18n.getMessage("order_ByGP")+"</a></label>";
     // TODO : ne marche plus, format spécifique aux listes
      // $("div.watch-list-buttons").append(menuOrder);

      // récupération valeur enregistrée
      var currentTri = JSON.parse(sessionStorage.getItem("etatTri"));
      if (currentTri != null) {
        console.log('currentTri: ', currentTri);
        $('div.menuTri input[value="' + currentTri + '"]').prop("checked", true);
        Trier(currentTri);
      }
      else 
        $('div.menuTri input[value="aucun"]').prop("checked", true);

      // Traitement du clic
      $('div.menuTri input:radio[name="tri"]').change(function () {
        var value = $(this).val();
        Trier(value);
      });
    }
  }
}

function Trier(value) {
  console.log('On trie par: ', value);
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
  // stockage du tri en cours, généralisé pour l'instant, sauf si defaut
  if (value == "aucun")
  {
    sessionStorage.removeItem("etatTri");
    location.reload();
  }
  else
    sessionStorage.setItem("etatTri", JSON.stringify(value));
}

// Création d'un menu Filtre
// type de filtre =  Action ou Type
// Choix page : page source, Porfolio ou ...
function createFilter(choixFiltre, choixPage) {

  // Intégration filtre de type
  if (choixFiltre == "Type" || choixFiltre == "All") {



    var menuFiltreType = "<div class=\"filter dropdown-menu menuFilter customMenu ng-scope \"><a class=\"icon\"><div class=\"filter\"><img class=\"bt_img\" src=\""+imgURL_Filtretype+"\"/></div></a>"+
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
  // Cas des favoris, changé
  $("div.watch-list-buttons").append(menuFiltreType);
    
  }

  // Intégration filtre d'action
  if (choixFiltre == "Action" || choixFiltre == "All") {
    // On récupère dynamiquement la liste des actions présentes
    var arrayActions = [];
    $.each(sheetData.records, function (i, item) {
      // On peut avoir plusieurs tag, il faut les séparer
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



    var menuFiltreAction = "<div class=\"filter dropdown-menu customMenu menuFilter ng-scope \"><a class=\"icon\"><div class=\"filter\"><img class=\"bt_img\" src=\"" + imgURL_Filtreaction + "\" width=\"22px\" /></div></a><div class=\"drop-select-box myBoxFilter actionFilter\">";
    menuFiltreAction = menuFiltreAction + "<label class=\"filter\"><a class=\"drop-select-box-option\"><input type=\"radio\" name=\"actionFiltre\" value=\"TOUT\" checked>Tout voir</a></label>";
    $.each(arrayActions, function (index, value) {
      menuFiltreAction = menuFiltreAction + "<label class=\"filter\"><a class=\"drop-select-box-option\"><input type=\"radio\" name=\"actionFiltre\" value=\"" + value + "\">" + value + "</a></label>";
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
    }
    else if (!event.ctrlKey) // Sinon sans CTRL, on coche que la case courant et on filtre aussitôt
    {
      $('div.typeFilter input[type="checkbox"]').not($(this)).prop('checked', false); // on décoche tout
      $(this).prop('checked', true); // on clic sur un item = lui doit rester coché
    }
    else if ($(this).not(':checked')) // On décoche une case : on doit décocher aussi TOUT
      $('div.typeFilter input[value="TOUT"]').prop('checked', false);
    allFiltresByType(choixPage); // Puis on filtre
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
      if ($(this).find(".US,.EU,.MAT,.CR,.IND").length) // Si l'élément a un tag connu
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
  if (arrayCible.TARGET) contenu = contenu + " " + browser.i18n.getMessage("infosMarket_Objectif") + " = " + arrayCible.TARGET; else contenu = contenu + "-";
  if (arrayCible.ESTIMATE) contenu = contenu + " (" + arrayCible.ESTIMATE + ")";
  contenu = contenu + " </div>";


  ////////// DATE ER
  contenu = contenu + prepareER(arrayCible);
  return contenu;
}

// Mise en forme de la date ER
function prepareER(arrayCible) {
  var divER = "";
  if (arrayCible.ER != "") {
    var dateRapport = new Date(arrayCible.ER);
    var formatDateRapport = dateRapport.getDate() + "/" + (dateRapport.getMonth() + 1);
    var stringRapport = "ER le " + ("0" + dateRapport.getDate()).slice(-2) + "/" + ("0" + (dateRapport.getMonth() + 1)).slice(-2);

    // mise en forme suivant date
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
  $('div[ng-model="$ctrl.watchlist.Instruments"] .dataER').css({
    'font-size': '10px',
    'position': 'absolute',
    'display': 'inline',
    'margin': '12px',
    'font-weight': 'normal',
    'color': 'grey'
  });
  $('et-card-avatar.instrument-cell div.myData').css({
    'font-size': '0.6em',
    'left': '200px',
    'height': 'auto',
    'z-index': '100'
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
  $('.ER_past').css({
    'text-decoration': 'line-through'
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
  // Spécifique marché
  $('.icon_leverage_market').css({
    'vertical-align': 'sub',
    'font-size': '8px',
    'font-weight': 'bold',
    'position': 'absolute',
    'right': '5px',
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
/*
  $('img.bt_img').css({
    'width': '22px',
    'background-position': '0'
  });
*/
  $('.bt_export:hover, .bt_stats:hover, .bt_filtretype:hover, .bt_filtretype:hover').css({
    'filter': 'brightness(0.8)'
  });
/*
  $(".customMenu").hover(function() {
    $(this).find("img").css("background-color","red")
  });
*/
}

function globalStyleSheet() {
  $('body').css({
    '-moz-user-select': 'auto',
    '-webkit-user-select': 'auto',
    'user-select': 'auto'
  });

}