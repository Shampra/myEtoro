// v2/features/title-shortening.js

import { config } from '../js/config.js';
import { log } from '../js/logger.js';
import { pageDetector } from '../js/page-detector.js';

let intervalId = null;

// This selector is an educated guess based on the old codebase and may
// need to be updated after inspecting the modern eToro website.
const USER_FULLNAME_SELECTOR = '[data-etoro-automation-id="user-header-username-nickname"]';

function shortenTitle() {
  const titleElement = document.querySelector(USER_FULLNAME_SELECTOR);

  if (titleElement) {
    const newTitle = titleElement.textContent.trim();
    if (document.title !== newTitle) {
      document.title = newTitle;
      log(`Tab title shortened to: "${newTitle}"`);
    }
  } else {
    log(`Could not find selector for title shortening: ${USER_FULLNAME_SELECTOR}`);
  }
}

function start() {
  if (!config.features.titleShortening) {
    return;
  }
  log('Starting title shortening feature.');
  // We run this on an interval because eToro might change the title
  // dynamically without a full page navigation.
  intervalId = setInterval(shortenTitle, 3000);
}

function stop() {
  if (intervalId) {
    log('Stopping title shortening feature.');
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function initTitleShortening() {
  // We'll tie the feature to the "instrument" page, but it might
  // be applicable to other pages as well.
  pageDetector.on('page-load:instrument', start);
  pageDetector.on('page-unload:instrument', stop);

  // Also listen for config changes to enable/disable on the fly
  config.events.on('featuresChanged', (change) => {
    if (change.newValue.titleShortening !== change.oldValue.titleShortening) {
      if (change.newValue.titleShortening) {
        start();
      } else {
        stop();
      }
    }
  });
}
