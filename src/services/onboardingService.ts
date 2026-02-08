/**
 * Onboarding Service
 * 
 * Manages onboarding data collection and persistence.
 * Stores locally first, syncs to Firebase when authenticated.
 */

import { storageService } from './storageService';
import type { OnboardingStackParamList } from '../types';

export type OnboardingCheckpoint = {
    routeName: keyof OnboardingStackParamList;
    meta?: {
        quizStage?: 'results';
    };
};

/**
 * Onboarding data collected during the flow
 */
export interface OnboardingData {
    // Comprehensive Quiz fields
    gender?: 'male' | 'female' | 'other';
    ageGroup?: string;
    sugarFrequency?: string; // 'rarely', 'few-times-week', 'daily', 'multiple-daily'
    dailySweetTimes?: string; // '0-1', '2-3', '4-5', '6+'
    unconsciousSugar?: string; // '1', '2', '3', '4'
    sugarChoiceFeeling?: string; // 'choose', 'give-in', 'already-eating'
    reduceSugarAttempt?: string; // 'succeed', 'few-days', 'old-habits', 'never-tried'
    craveWhenNotHungry?: string; // '1', '2', '3', '4'
    craveIntensity?: string; // '1', '2', '3', '4'
    avoidSugarDifficulty?: string; // '1', '2', '3', '4'
    sugarVisibility?: string; // '1', '2', '3', '4'
    sugarDependencyScore?: number; // calculated total
    triggers?: string[]; // stress, boredom, after-meals, late-night, social, no-pattern
    nickname?: string;
    age?: string;
    symptoms?: string[];

    // Legacy fields (kept for backwards compatibility)
    consumptionShift?: string;
    dailySugarGrams?: number;
    hardToGoWithout?: number; // 1-4 scale
    moodDifference?: string;
    monthlySpending?: string;
    reasons?: string[];
    otherReason?: string;
    stressEating?: number; // 1-4 scale
    boredomEating?: number; // 1-4 scale
    goals?: string[];

    // Plan screen
    plan?: 'cold_turkey' | 'gradual';

    // Legacy fields (kept for backwards compatibility)
    sugarConsumption?: string;
    sugarSources?: string[];
    motivation?: string;
    dailySpendingCents?: number;
    savingsGoal?: string;
    savingsGoalAmount?: number;

    // Promise screen - completion marker
    promiseConfirmed?: boolean;

    // Journey start
    startDate?: string; // ISO string

    // Metadata
    completedAt?: string; // ISO string
}

/**
 * Save partial onboarding data (for progressive save during flow)
 */
async function saveOnboardingData(data: Partial<OnboardingData>): Promise<void> {
    const existing = await getOnboardingData();
    const updated: OnboardingData = { ...existing, ...data };
    await storageService.save(storageService.KEYS.ONBOARDING_DATA, updated);
}

/**
 * Get all onboarding data
 */
async function getOnboardingData(): Promise<OnboardingData> {
    const data = await storageService.load<OnboardingData>(storageService.KEYS.ONBOARDING_DATA);
    return data || {};
}

/**
 * Clear onboarding data (for testing or reset)
 */
async function clearOnboardingData(): Promise<void> {
    await storageService.remove(storageService.KEYS.ONBOARDING_DATA);
    await storageService.remove(storageService.KEYS.HAS_COMPLETED_ONBOARDING);
    await storageService.remove(storageService.KEYS.ONBOARDING_CHECKPOINT);
    await storageService.remove(storageService.KEYS.POST_PAYWALL_AUTH_REQUIRED);
}

/**
 * Reset onboarding completion flag (for logout)
 * This allows users to see the landing page again after logging out
 */
async function resetOnboardingCompletion(): Promise<void> {
    await storageService.remove(storageService.KEYS.HAS_COMPLETED_ONBOARDING);
    await storageService.remove(storageService.KEYS.ONBOARDING_CHECKPOINT);
    await storageService.remove(storageService.KEYS.POST_PAYWALL_AUTH_REQUIRED);
}

/**
 * Mark onboarding as complete
 */
async function completeOnboarding(): Promise<void> {
    const existing = await getOnboardingData();
    await saveOnboardingData({
        completedAt: new Date().toISOString(),
        // Preserve an existing startDate if onboarding already set it earlier (e.g., Promise screen)
        startDate: existing.startDate || new Date().toISOString(),
    });
    await storageService.save(storageService.KEYS.HAS_COMPLETED_ONBOARDING, true);
}

/**
 * Check if user has completed onboarding
 */
async function hasCompletedOnboarding(): Promise<boolean> {
    const completed = await storageService.load<boolean>(storageService.KEYS.HAS_COMPLETED_ONBOARDING);
    return completed === true;
}

/**
 * Persist the last onboarding screen the user reached.
 * This is used to resume onboarding after an app restart.
 */
async function setOnboardingCheckpoint(checkpoint: OnboardingCheckpoint | keyof OnboardingStackParamList): Promise<void> {
    const normalized: OnboardingCheckpoint =
        typeof checkpoint === 'string' ? { routeName: checkpoint } : checkpoint;
    await storageService.save(storageService.KEYS.ONBOARDING_CHECKPOINT, normalized);
}

async function getOnboardingCheckpoint(): Promise<OnboardingCheckpoint | null> {
    const value = await storageService.load<unknown>(storageService.KEYS.ONBOARDING_CHECKPOINT);

    // Backwards compatibility: previously stored as a string route name.
    if (typeof value === 'string') {
        return { routeName: value as keyof OnboardingStackParamList };
    }

    if (value && typeof value === 'object' && 'routeName' in value) {
        const routeName = (value as any).routeName;
        if (typeof routeName === 'string') {
            return value as OnboardingCheckpoint;
        }
    }

    return null;
}

async function clearOnboardingCheckpoint(): Promise<void> {
    await storageService.remove(storageService.KEYS.ONBOARDING_CHECKPOINT);
}

/**
 * Separate from onboarding checkpoints: once the user has reached/passed the paywall,
 * they should resume in Auth (not back in onboarding).
 */
async function setPostPaywallAuthRequired(required: boolean): Promise<void> {
    await storageService.save(storageService.KEYS.POST_PAYWALL_AUTH_REQUIRED, required);
}

async function isPostPaywallAuthRequired(): Promise<boolean> {
    const value = await storageService.load<boolean>(storageService.KEYS.POST_PAYWALL_AUTH_REQUIRED);
    return value === true;
}

export const onboardingService = {
    saveOnboardingData,
    getOnboardingData,
    clearOnboardingData,
    completeOnboarding,
    hasCompletedOnboarding,
    resetOnboardingCompletion,
    setOnboardingCheckpoint,
    getOnboardingCheckpoint,
    clearOnboardingCheckpoint,
    setPostPaywallAuthRequired,
    isPostPaywallAuthRequired,
};

export default onboardingService;
