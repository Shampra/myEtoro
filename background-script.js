browser.runtime.onMessage.addListener(updateBadge);

function updateBadge(message) {
    let text = "";
    let color = "grey";
    let title = "My_Etoro";

    switch (message.action) {
        case "off":
            text = "init";
            break;
        case "na":
            text = "off";
            title = "My_Etoro - Not configured";
            break;
        case "waiting":
            text = "-";
            title = "My_Etoro - Sheet not configured";
            break;
        case "lancement":
            text = "Load";
            color = "#ff9900";
            title = "My_Etoro - Waiting for Google Sheet";
            break;
        case "update":
            text = "maj";
            color = "#ff9900";
            title = "My_Etoro - Updating from Google Sheet";
            break;
        case "error":
            text = "!";
            color = "red";
            title = "My_Etoro - Error fetching from Google Sheet";
            break;
        case "ok":
            text = "on";
            color = "green";
            title = "My_Etoro - Google Sheet data loaded";
            break;
    }

    browser.browserAction.setBadgeText({ text: text });
    browser.browserAction.setBadgeBackgroundColor({ color: color });
    browser.browserAction.setTitle({ title: title });
}
