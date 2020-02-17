browser.runtime.onMessage.addListener(setbadge);

function setbadge(message) {

            
    if (message.action == "off")
    {
        browser.browserAction.setBadgeText({text: "init"});
        browser.browserAction.setBadgeBackgroundColor({color: "grey"});
        browser.browserAction.setTitle({title: "My_Etoro"});
    }
    else if (message.action == "na")
    {
        browser.browserAction.setBadgeText({text: "off"});
        browser.browserAction.setBadgeBackgroundColor({color: "grey"});
        browser.browserAction.setTitle({title: "My_Etoro - non configuré"});
    }
    else if (message.action == "waiting")
    {
        browser.browserAction.setBadgeText({text: "-"});
        browser.browserAction.setBadgeBackgroundColor({color: "grey"});
        browser.browserAction.setTitle({title: "My_Etoro : Feuille non configurée"});
    }
    else if (message.action == "lancement")
    {
        browser.browserAction.setBadgeText({text: "Load"});
        browser.browserAction.setBadgeBackgroundColor({color: "#ff9900"});
        browser.browserAction.setTitle({title: "My_Etoro : Attente réponse Google Sheet"});
    }
    else if (message.action == "update")
    {
        browser.browserAction.setBadgeText({text: "maj"});
        browser.browserAction.setBadgeBackgroundColor({color: "#ff9900"});
        browser.browserAction.setTitle({title: "My_Etoro : Mise à jour data Google Sheet"});
    }
    else if (message.action == "erreur")
    {
        browser.browserAction.setBadgeText({text: "!"});
        browser.browserAction.setBadgeBackgroundColor({color: "red"});
        browser.browserAction.setTitle({title: "My_Etoro : Erreur de récupération des données Google Sheet"});
    }
    else if (message.action == "ok")
    {
        browser.browserAction.setBadgeText({text: "on"});
        browser.browserAction.setBadgeBackgroundColor({color: "green"});
        browser.browserAction.setTitle({title: "My_Etoro : Données Google Sheet chargées"});
    }

    
}


