// v2/js/storage.js

import { log } from './logger.js';

const STORAGE_KEY = 'instrumentData';

/**
 * Retrieves all stored data for all instruments.
 * @returns {Promise<Object>} A promise that resolves to an object containing all instrument data.
 */
async function getAllData() {
  try {
    const result = await browser.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || {};
  } catch (error) {
    log(`Error getting all instrument data from storage: ${error}`);
    return {}; // Fail gracefully
  }
}

/**
 * Retrieves data for a specific instrument.
 * @param {string} instrumentName - The name of the instrument.
 * @returns {Promise<Object|null>} A promise that resolves to the data for the instrument, or null if not found.
 */
export async function getInstrumentData(instrumentName) {
  const allData = await getAllData();
  return allData[instrumentName] || null;
}

/**
 * Stores data for a specific instrument.
 * @param {string} instrumentName - The name of the instrument.
 * @param {Object} data - The data to store for the instrument.
 * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise.
 */
export async function setInstrumentData(instrumentName, data) {
  const allData = await getAllData();
  allData[instrumentName] = data;
  try {
    await browser.storage.local.set({ [STORAGE_KEY]: allData });
    log(`Successfully set data for instrument: ${instrumentName}`);
    return true;
  } catch (error) {
    log(`Error setting instrument data in storage: ${error}`);
    return false; // Fail gracefully
  }
}

/**
 * Removes data for a specific instrument.
 * @param {string} instrumentName - The name of the instrument to remove.
 * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise.
 */
export async function removeInstrumentData(instrumentName) {
    const allData = await getAllData();
    if (allData[instrumentName]) {
        delete allData[instrumentName];
        try {
            await browser.storage.local.set({ [STORAGE_KEY]: allData });
            log(`Successfully removed data for instrument: ${instrumentName}`);
            return true;
        } catch (error) {
            log(`Error removing instrument data from storage: ${error}`);
            return false; // Fail gracefully
        }
    }
    return true; // Instrument data didn't exist, so it's "removed"
}
