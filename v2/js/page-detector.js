// v2/js/page-detector.js

import { log } from './logger.js';

// These selectors are educated guesses and may need to be updated
// after inspecting the modern eToro website.
const pageRules = {
  portfolio: {
    path: /^\/portfolio$/,
    selector: 'et-portfolio-table',
    name: 'portfolio'
  },
  instrument: {
    path: /^\/markets\/[^\/]+\/?$/,
    selector: 'et-market-page',
    name: 'instrument'
  },
  watchlists: {
    path: /^\/watchlists/,
    selector: 'et-watchlist-page',
    name: 'watchlists'
  },
  history: {
    path: /^\/portfolio\/history/,
    selector: 'et-portfolio-history-table',
    name: 'history'
  }
};

class PageDetector {
  constructor() {
    this.currentPage = null;
    this.currentUrl = location.href;
    this.listeners = {};
  }

  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
  }

  emit(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(callback => callback(data));
    }
  }

  detectPage() {
    const path = location.pathname;

    for (const key in pageRules) {
      const rule = pageRules[key];
      if (rule.path.test(path)) {
        this.waitForElement(rule.selector, () => {
          if (this.currentPage !== rule.name) {
            this.currentPage = rule.name;
            log(`Page detected and ready: ${this.currentPage}`);
            this.emit('page-load', { page: this.currentPage });
            this.emit(`page-load:${this.currentPage}`);
          }
        });
        return; // Found a matching rule
      }
    }

    // If no rules matched, we are not on a recognized page.
    if (this.currentPage) {
      log(`Exited known page: ${this.currentPage}`);
      this.emit('page-unload', { page: this.currentPage });
      this.emit(`page-unload:${this.currentPage}`);
      this.currentPage = null;
    }
  }

  waitForElement(selector, callback) {
    // Check if the element already exists
    if (document.querySelector(selector)) {
      callback();
      return;
    }

    // If not, wait for it to appear
    const observer = new MutationObserver((mutations, obs) => {
      if (document.querySelector(selector)) {
        obs.disconnect(); // Stop observing
        callback();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  start() {
    // Initial detection on script load
    this.detectPage();

    // Poll for URL changes to handle SPA navigation
    setInterval(() => {
      if (this.currentUrl !== location.href) {
        this.currentUrl = location.href;
        log(`URL changed to: ${this.currentUrl}`);
        this.detectPage();
      }
    }, 500);
  }
}

export const pageDetector = new PageDetector();
