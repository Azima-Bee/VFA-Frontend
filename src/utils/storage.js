import AsyncStorage from '@react-native-async-storage/async-storage';

const memoryStorage = new Map();

/**
 * Safe AsyncStorage wrapper with in-memory fallback for web and dev environments
 */
export const safeStorage = {
  async getItem(key) {
    try {
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        const value = await AsyncStorage.getItem(key);
        if (value !== null) return value;
      }
    } catch (err) {
      console.warn(`[safeStorage getItem Warning] Key: ${key}`, err?.message || err);
    }
    return memoryStorage.get(key) || null;
  },

  async setItem(key, value) {
    memoryStorage.set(key, value);
    try {
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem(key, value);
      }
    } catch (err) {
      console.warn(`[safeStorage setItem Warning] Key: ${key}`, err?.message || err);
    }
  },

  async removeItem(key) {
    memoryStorage.delete(key);
    try {
      if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
        await AsyncStorage.removeItem(key);
      }
    } catch (err) {
      console.warn(`[safeStorage removeItem Warning] Key: ${key}`, err?.message || err);
    }
  },

  async clear() {
    memoryStorage.clear();
    try {
      if (AsyncStorage && typeof AsyncStorage.clear === 'function') {
        await AsyncStorage.clear();
      }
    } catch (err) {
      console.warn('[safeStorage clear Warning]', err?.message || err);
    }
  },
};

export default safeStorage;
