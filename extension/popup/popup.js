
$("#conf_link").click(function(){
function onOpened() {
  console.log(`Options page opened`);
}
function onError(error) {
  console.log(`Error: ${error}`);
}

var opening = browser.runtime.openOptionsPage();
opening.then(onOpened, onError);
})

function gotBadgeText(text) {
    console.log(text);
    if (text == "on")
        $("div#info").html("Les données de la feuille ont bien été récupérées");
    else if (text == "Load")
        $("div#info").html("Chargement en cours (parfois long suivant l'accès à Google Sheet)");
    else if (text == "maj")
        $("div#info").html("Mise à jour en cours (parfois long suivant l'accès à Google Sheet)");
    else if (text == "off")
        $("div#info").html("Merci de configurer l'extension : ");

  }

  var gettingBadgeText = browser.browserAction.getBadgeText({});
  gettingBadgeText.then(gotBadgeText);