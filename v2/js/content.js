// v2/js/content.js

import { config } from './config.js';
import { log } from './logger.js';
import { pageDetector } from './page-detector.js';
import { initTitleShortening } from '../features/title-shortening.js';
import { initPortfolioExport } from '../features/portfolio-export.js';
import { initInstrumentHistoryShortcut } from '../features/instrument-history-shortcut.js';

async function main() {
  // Load configuration
  await config.load();

  log("Content script loaded.");

  // Initialize features
  initTitleShortening();
  initPortfolioExport();
  initInstrumentHistoryShortcut();

  // Start watching for page changes
  pageDetector.start();

  // Example of listening for a specific page load
  pageDetector.on('page-load:portfolio', () => {
    log('Portfolio page loaded!');
    // In the future, this is where we would trigger the portfolio export feature.
  });
}

main();
