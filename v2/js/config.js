// v2/js/config.js

const config = {
  features: {
    titleShortening: false,
    portfolioExport: false,
    instrumentHistoryShortcut: false
  },
  debugMode: false,

  async load() {
    const data = await browser.storage.local.get(["features", "debugMode"]);
    this.features = data.features || this.features;
    this.debugMode = data.debugMode || this.debugMode;
  }
};

// Simple event emitter
const events = {
  listeners: {},
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
};

// Add the event emitter to the config object
config.events = events;


// Listen for changes in storage and update the config
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local") {
    if (changes.features) {
      const oldFeatures = config.features;
      config.features = changes.features.newValue;
      config.events.emit('featuresChanged', {
        newValue: config.features,
        oldValue: oldFeatures
      });
    }
    if (changes.debugMode) {
      const oldDebugMode = config.debugMode;
      config.debugMode = changes.debugMode.newValue;
      config.events.emit('debugModeChanged', {
        newValue: config.debugMode,
        oldValue: oldDebugMode
      });
    }
  }
});

// Load the initial config
config.load();
