// v2/features/portfolio-export.js

import { config } from '../js/config.js';
import { log } from '../js/logger.js';
import { pageDetector } from '../js/page-detector.js';

// These selectors are educated guesses based on the old codebase and may
// need to be updated after inspecting the modern eToro website.
const PORTFOLIO_HEADER_SELECTOR = '[data-etoro-automation-id="portfolio-manual-trades-table-header-cell-net-profit-amount"]';
const PORTFOLIO_ROW_SELECTOR = '[data-etoro-automation-id="portfolio-manual-trades-table-body-row-container"]';
const EXPORT_BUTTON_ID = 'my-etoro-v2-export-button';

function scrapePortfolioData() {
  const data = [];
  const rows = document.querySelectorAll(PORTFOLIO_ROW_SELECTOR);

  log(`Found ${rows.length} rows to export.`);

  rows.forEach(row => {
    // These selectors are highly likely to have changed.
    const instrument = row.querySelector('[data-etoro-automation-id="portfolio-manual-trades-table-body-cell-container-instrument-name"]')?.textContent.trim() || '';
    const invested = row.querySelector('[data-etoro-automation-id="portfolio-manual-trades-table-body-invested-value"]')?.textContent.trim() || '';
    const profit = row.querySelector('[data-etoro-automation-id="portfolio-manual-trades-table-body-cell-container-profit"]')?.textContent.trim() || '';
    const leverage = row.querySelector('[data-etoro-automation-id="portfolio-manual-trades-table-body-leverage"]')?.textContent.trim() || '';

    data.push({ instrument, invested, profit, leverage });
  });

  return data;
}

function exportAsJson(data) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, 'portfolio.json');
}

function exportAsCsv(data) {
  const header = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(','));
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, 'portfolio.csv');
}

function triggerDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


function addExportButton() {
  if (document.getElementById(EXPORT_BUTTON_ID)) {
    return; // Button already exists
  }

  const targetArea = document.querySelector(PORTFOLIO_HEADER_SELECTOR);
  if (!targetArea) {
    log('Could not find target area to add export button.');
    return;
  }

  const buttonContainer = document.createElement('div');
  buttonContainer.id = EXPORT_BUTTON_ID;

  const jsonButton = document.createElement('button');
  jsonButton.textContent = browser.i18n.getMessage('exportJsonButton');
  jsonButton.onclick = () => {
    const data = scrapePortfolioData();
    exportAsJson(data);
  };

  const csvButton = document.createElement('button');
  csvButton.textContent = browser.i18n.getMessage('exportCsvButton');
  csvButton.onclick = () => {
    const data = scrapePortfolioData();
    exportAsCsv(data);
  };

  buttonContainer.appendChild(jsonButton);
  buttonContainer.appendChild(csvButton);
  targetArea.appendChild(buttonContainer);

  log('Export button added to the page.');
}

function removeExportButton() {
  const button = document.getElementById(EXPORT_BUTTON_ID);
  if (button) {
    button.remove();
    log('Export button removed from the page.');
  }
}

function start() {
  if (!config.features.portfolioExport) {
    return;
  }
  log('Starting portfolio export feature.');
  addExportButton();
}

function stop() {
  log('Stopping portfolio export feature.');
  removeExportButton();
}


export function initPortfolioExport() {
  pageDetector.on('page-load:portfolio', start);
  pageDetector.on('page-unload:portfolio', stop);

  // Also listen for config changes to enable/disable on the fly
  config.events.on('featuresChanged', (change) => {
    if (change.newValue.portfolioExport !== change.oldValue.portfolioExport) {
      if (change.newValue.portfolioExport) {
        start();
      } else {
        stop();
      }
    }
  });
}
