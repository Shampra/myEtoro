// v2/js/logger.js

import { config } from './config.js';

export function log(message) {
  if (config.debugMode) {
    console.log(`[My eToro v2] ${message}`);
  }
}
