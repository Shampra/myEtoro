function saveOptions(e) {
    e.preventDefault();
    console.log("test");
    if ($("#SheetName").val()  && $("#idSpreadsheet").val())
    {
        $("#SheetName").removeAttr('style');
        $("#idSpreadsheet").removeAttr('style');
        $("#errorconfigSheet").remove();
        browser.storage.local.set({
            //    MyEtoro_idSpreadsheet: document.querySelector("#idSpreadsheet").value,
                MyEtoro_SheetName: $("#SheetName").val(),
                MyEtoro_idSpreadsheet: $("#idSpreadsheet").val(),
                MyEtoro_setShortTitle: $("#titre_court").prop('checked'),
                MyEtoro_setDirectLinkNotif: $("#DirectLinkNotification").prop('checked')
            });
        $("form").append('<strong id="errorconfigSheet">Données enregistrées.</strong>');
    }
    else if ($("#SheetName").val() || $("#idSpreadsheet").val())
    {
        
            console.log("Champs mal rempli");
            $("#configSheet").append('<strong id="errorconfigSheet">Il faut renseigner les deux valeurs (ou aucune).</strong>');
            $("#SheetName").css("background-color", "red");
            $("#idSpreadsheet").css("background-color", "red");
    }
    else
    console.log("Pas de configuration de feuille, les fonctions l'utilisant ne marcheront pas.")
   
  }
  
  function restoreOptions() {
    // erreur sur promise
    function onError(error) {
        console.log(`Error: ${error}`);
      }
    
      // Retour ok
      function onGot(item) {
        console.log(item);
        $("#SheetName").val(item.MyEtoro_SheetName) ;
        $("#idSpreadsheet").val(item.MyEtoro_idSpreadsheet) ;
        $("#titre_court").prop('checked',MyEtoro_setShortTitle) ;
        $("#DirectLinkNotification").prop('checked',MyEtoro_setDirectLinkNotif) ;
      }
    var gettingItem = browser.storage.local.get();
    gettingItem.then(onGot, onError);

  }
  
  // Récup des options au chargement
  document.addEventListener("DOMContentLoaded", restoreOptions);
  // Sauvegarde
  document.querySelector("form").addEventListener("submit", saveOptions);