//- Options page script
document.addEventListener("DOMContentLoaded", async () => {
    const config = await getConfig();
    const featuresContainer = document.getElementById("features");

    //- Populate debug mode setting
    document.getElementById("debugMode").checked = config.debug;

    //- Dynamically populate features
    for (const featureKey in config.features) {
        const feature = config.features[featureKey];
        const element = document.createElement("div");
        element.classList.add("element");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = featureKey;
        checkbox.checked = feature.enabled;

        const label = document.createElement("label");
        label.classList.add("checkbox");
        label.setAttribute("for", featureKey);
        label.textContent = feature.name;

        element.appendChild(checkbox);
        element.appendChild(label);
        featuresContainer.appendChild(element);
    }

    //- Save settings
    document.querySelector("form").addEventListener("submit", async (e) => {
        e.preventDefault();

        //- Save debug mode setting
        config.debug = document.getElementById("debugMode").checked;

        //- Save feature settings
        for (const featureKey in config.features) {
            config.features[featureKey].enabled = document.getElementById(featureKey).checked;
        }

        await saveConfig(config);
        window.close();
    });
});
