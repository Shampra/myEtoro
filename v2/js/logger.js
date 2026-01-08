// v2/js/logger.js

import { config } from './config.js';

let hasShownDebugMessage = false;

export function log(message) {
  if (config.debugMode) {
    if (!hasShownDebugMessage) {
        console.log("[My eToro v2 | Debug Mode] Debug mode is enabled. You can view detailed logs in your browser's developer console (F12 or Ctrl+Shift+I).");
        hasShownDebugMessage = true;
    }
    console.log(`[My eToro v2] ${message}`);
  }
}
