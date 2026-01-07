// v2/features/instrument-history-shortcut.js

import { config } from '../js/config.js';
import { log } from '../js/logger.js';
import { pageDetector } from '../js/page-detector.js';

// These selectors are educated guesses based on the old codebase and may
// need to be updated after inspecting the modern eToro website.
const NAVIGATION_TABS_SELECTOR = '[data-etoro-automation-id="instrument-header-menu-container"]';
const INSTRUMENT_NAME_SELECTOR = '[data-etoro-automation-id="instrument-header-instrument-name"]';
const SHORTCUT_ID = 'my-etoro-v2-history-shortcut';


function addShortcut() {
  if (document.getElementById(SHORTCUT_ID)) {
    return; // Shortcut already exists
  }

  const navigationTabs = document.querySelector(NAVIGATION_TABS_SELECTOR);
  const instrumentNameElement = document.querySelector(INSTRUMENT_NAME_SELECTOR);

  if (!navigationTabs || !instrumentNameElement) {
    log('Could not find target area to add instrument history shortcut.');
    return;
  }

  const instrumentName = instrumentNameElement.textContent.trim();
  const historyUrl = `/portfolio/history/market/${instrumentName}`;

  const shortcut = document.createElement('a');
  shortcut.id = SHORTCUT_ID;
  shortcut.href = historyUrl;
  shortcut.textContent = browser.i18n.getMessage('historyShortcut');
  // We'll need to style this to match the other tabs.
  // This is a placeholder.
  shortcut.style.padding = '0 1rem';


  navigationTabs.appendChild(shortcut);

  log('Instrument history shortcut added to the page.');
}

function removeShortcut() {
  const shortcut = document.getElementById(SHORTCUT_ID);
  if (shortcut) {
    shortcut.remove();
    log('Instrument history shortcut removed from the page.');
  }
}

function start() {
  if (!config.features.instrumentHistoryShortcut) {
    return;
  }
  log('Starting instrument history shortcut feature.');
  addShortcut();
}

function stop() {
  log('Stopping instrument history shortcut feature.');
  removeShortcut();
}

export function initInstrumentHistoryShortcut() {
  pageDetector.on('page-load:instrument', start);
  pageDetector.on('page-unload:instrument', stop);

  // Also listen for config changes to enable/disable on the fly
  config.events.on('featuresChanged', (change) => {
    if (change.newValue.instrumentHistoryShortcut !== change.oldValue.instrumentHistoryShortcut) {
      if (change.newValue.instrumentHistoryShortcut) {
        start();
      } else {
        stop();
      }
    }
  });
}
