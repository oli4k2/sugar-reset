/**
 * Review Prompt Service
 * 
 * Tracks whether we should show review prompts, preventing
 * duplicate or annoying prompts. Uses AsyncStorage for persistence.
 * 
 * Trigger points:
 * 1. After the user's first food scan
 * 2. On the user's second day of app usage (trial day 2)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    FIRST_SCAN_PROMPTED: '@review_prompt_first_scan',
    DAY_TWO_PROMPTED: '@review_prompt_day_two',
    REVIEW_DISMISSED_COUNT: '@review_prompt_dismissed_count',
};

/**
 * Check if we should show the "first scan" review prompt.
 * Returns true only once — after the user's very first food scan.
 */
export async function shouldShowFirstScanPrompt(totalScannedItems: number): Promise<boolean> {
    // Only trigger when the user just completed their first scan (count = 1)
    if (totalScannedItems !== 1) return false;

    try {
        const alreadyPrompted = await AsyncStorage.getItem(KEYS.FIRST_SCAN_PROMPTED);
        if (alreadyPrompted === 'true') return false;

        return true;
    } catch {
        return false;
    }
}

/**
 * Mark the "first scan" prompt as shown.
 */
export async function markFirstScanPromptShown(): Promise<void> {
    try {
        await AsyncStorage.setItem(KEYS.FIRST_SCAN_PROMPTED, 'true');
    } catch (error) {
        console.warn('Failed to mark first scan prompt:', error);
    }
}

/**
 * Check if we should show the "day two" review prompt.
 * Returns true if the user's onboarding completedAt is 1-2 days ago
 * and we haven't shown this prompt before.
 */
export async function shouldShowDayTwoPrompt(completedAt: string | undefined): Promise<boolean> {
    if (!completedAt) return false;

    try {
        const alreadyPrompted = await AsyncStorage.getItem(KEYS.DAY_TWO_PROMPTED);
        if (alreadyPrompted === 'true') return false;

        const completedDate = new Date(completedAt);
        const now = new Date();
        const diffMs = now.getTime() - completedDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        // Show on day 2 (between 1 and 3 days after onboarding)
        return diffDays >= 1 && diffDays < 3;
    } catch {
        return false;
    }
}

/**
 * Mark the "day two" prompt as shown.
 */
export async function markDayTwoPromptShown(): Promise<void> {
    try {
        await AsyncStorage.setItem(KEYS.DAY_TWO_PROMPTED, 'true');
    } catch (error) {
        console.warn('Failed to mark day two prompt:', error);
    }
}

/**
 * Reset all review prompt flags (for testing or account reset).
 */
export async function resetReviewPrompts(): Promise<void> {
    try {
        await AsyncStorage.multiRemove([
            KEYS.FIRST_SCAN_PROMPTED,
            KEYS.DAY_TWO_PROMPTED,
            KEYS.REVIEW_DISMISSED_COUNT,
        ]);
    } catch (error) {
        console.warn('Failed to reset review prompts:', error);
    }
}

