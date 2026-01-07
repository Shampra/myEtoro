// Function to save options to local storage
function saveOptions(e) {
  e.preventDefault();
  browser.storage.local.set({
    features: {
      titleShortening: document.querySelector("#feature-title-shortening").checked,
      portfolioExport: document.querySelector("#feature-portfolio-export").checked,
      instrumentHistoryShortcut: document.querySelector("#feature-instrument-history-shortcut").checked
    },
    debugMode: document.querySelector("#debug-mode").checked
  });
}

// Function to restore options from local storage
function restoreOptions() {
  function setCurrentChoice(result) {
    document.querySelector("#feature-title-shortening").checked = result.features?.titleShortening || false;
    document.querySelector("#feature-portfolio-export").checked = result.features?.portfolioExport || false;
    document.querySelector("#feature-instrument-history-shortcut").checked = result.features?.instrumentHistoryShortcut || false;
    document.querySelector("#debug-mode").checked = result.debugMode || false;
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  let getting = browser.storage.local.get(["features", "debugMode"]);
  getting.then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("#options-form").addEventListener("submit", saveOptions);
