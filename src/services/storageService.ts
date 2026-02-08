/**
 * Storage Service
 * 
 * Wrapper around AsyncStorage for local data persistence.
 * Provides typed access to app storage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
    ONBOARDING_DATA: '@sugar_reset_onboarding',
    USER_PREFERENCES: '@sugar_reset_preferences',
    CHECK_INS_CACHE: '@sugar_reset_checkins',
    HAS_COMPLETED_ONBOARDING: '@sugar_reset_has_onboarded',
    ONBOARDING_CHECKPOINT: '@sugar_reset_onboarding_checkpoint',
    POST_PAYWALL_AUTH_REQUIRED: '@sugar_reset_post_paywall_auth_required',
};

/**
 * Generic save function
 */
async function save<T>(key: string, data: T): Promise<void> {
    try {
        const jsonValue = JSON.stringify(data);
        await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
        console.error(`Error saving ${key}:`, error);
        throw error;
    }
}

/**
 * Generic load function
 */
async function load<T>(key: string): Promise<T | null> {
    try {
        const jsonValue = await AsyncStorage.getItem(key);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
        console.error(`Error loading ${key}:`, error);
        return null;
    }
}

/**
 * Remove a specific key
 */
async function remove(key: string): Promise<void> {
    try {
        await AsyncStorage.removeItem(key);
    } catch (error) {
        console.error(`Error removing ${key}:`, error);
    }
}

/**
 * Clear all app data
 */
async function clearAll(): Promise<void> {
    try {
        const keys = Object.values(STORAGE_KEYS);
        await AsyncStorage.multiRemove(keys);
        console.log('✅ Cleared all app storage keys');
    } catch (error) {
        console.error('Error clearing storage:', error);
        throw error;
    }
}

/**
 * Clear ALL AsyncStorage data (nuclear option - clears everything)
 * Use with caution - this will clear ALL AsyncStorage data, not just app data
 */
async function clearEverything(): Promise<void> {
    try {
        const allKeys = await AsyncStorage.getAllKeys();
        await AsyncStorage.multiRemove(allKeys);
        console.log('✅ Cleared ALL AsyncStorage data');
    } catch (error) {
        console.error('Error clearing all storage:', error);
        throw error;
    }
}

// Export the service
export const storageService = {
    save,
    load,
    remove,
    clearAll,
    clearEverything,
    KEYS: STORAGE_KEYS,
};

export default storageService;
