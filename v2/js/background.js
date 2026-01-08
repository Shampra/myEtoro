// v2/js/background.js

browser.action.onClicked.addListener(() => {
  browser.runtime.openOptionsPage();
});
