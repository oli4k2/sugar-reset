/**
 * Streak Service
 *
 * Calculates streaks based on food logging and sugar targets.
 *
 * Streak logic:
 * 1. Did user log food? If NO → streak resets
 * 2. If YES, was sugar under daily target? If NO → streak resets
 * 3. If YES → streak continues
 * 4. Retroactive recovery allowed (logging yesterday's food can recover streak)
 */

import { getScannedItemsForDate, ScannedItem } from './scannerService';
import { getCurrentDayLimit, PlanType } from '../utils/planUtils';
import onboardingService from './onboardingService';

export interface DayStatus {
    date: string;           // YYYY-MM-DD
    hasLogs: boolean;       // Did user log any food?
    totalAddedSugar: number; // Sum of ADDED sugar from all logged items (not natural sugar)
    dailyTarget: number;    // WHO recommendation based on gender
    isUnderTarget: boolean; // totalAddedSugar <= dailyTarget
    isStreakDay: boolean;   // hasLogs && isUnderTarget
    itemCount: number;      // Number of food items logged
}

export interface StreakResult {
    currentStreak: number;
    longestStreak: number;
    totalDaysUnderTarget: number;
    lastValidDate: string | null;
    todayStatus: DayStatus;
    canRecoverStreak: boolean;      // If within grace period and can still log food
    missingDates: string[];         // Days without logs within grace period
    gracePeriodRemaining: number;   // Days left before streak resets (0-2)
}

/**
 * Get the local date string in YYYY-MM-DD format.
 * Uses local timezone to avoid UTC issues.
 */
export function getLocalDateString(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get a date object from YYYY-MM-DD string (at noon to avoid timezone edge cases)
 */
function parseLocalDateString(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Get yesterday's date string
 */
export function getYesterdayDateString(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return getLocalDateString(yesterday);
}

/**
 * WHO daily sugar recommendations based on gender.
 * Men: ~36g (9 teaspoons) max added sugar per day
 * Women: ~25g (6 teaspoons) max added sugar per day
 * Source: World Health Organization / American Heart Association
 */
export const WHO_SUGAR_LIMITS = {
    male: 36,
    female: 25,
    other: 30, // Average for non-specified
    default: 25, // Conservative default
};

/**
 * Get the daily added sugar limit based on user's gender (WHO recommendation).
 * This replaces the old plan-based limits since we now focus on health recommendations.
 */
export async function getDailyAddedSugarLimit(): Promise<number> {
    try {
        const onboardingData = await onboardingService.getOnboardingData();
        const gender = onboardingData?.gender || 'default';
        return WHO_SUGAR_LIMITS[gender as keyof typeof WHO_SUGAR_LIMITS] || WHO_SUGAR_LIMITS.default;
    } catch (error) {
        console.warn('Could not get gender for sugar limit, using default:', error);
        return WHO_SUGAR_LIMITS.default;
    }
}

/**
 * Calculate the daily target for a specific date.
 * Now uses WHO recommendations based on gender, not the old plan system.
 */
export async function getDailyTargetForDate(
    dateString: string,
    planType: PlanType,
    planStartDate: Date
): Promise<number> {
    // For dates before plan start, return a high limit (no restriction)
    const targetDate = parseLocalDateString(dateString);
    if (targetDate < planStartDate) {
        return 999;
    }

    // Use WHO gender-based limits for added sugar
    return getDailyAddedSugarLimit();
}

/**
 * Get status for a specific day.
 * Now uses ADDED SUGAR only (not total sugar including natural sugars from fruit).
 */
export async function getDayStatus(
    dateString: string,
    planType: PlanType,
    planStartDate: Date
): Promise<DayStatus> {
    const items = await getScannedItemsForDate(dateString);

    // Get the daily limit (WHO gender-based recommendation)
    const dailyTarget = await getDailyTargetForDate(dateString, planType, planStartDate);

    // Sum up ADDED sugar only from all food items (not natural sugars from fruit/dairy)
    // Fall back to total sugar for items logged before addedSugar field existed
    const totalAddedSugar = items.reduce((sum, item) => {
        return sum + (item.addedSugar ?? item.sugar ?? 0);
    }, 0);

    const hasLogs = items.length > 0;
    const isUnderTarget = totalAddedSugar <= dailyTarget;

    return {
        date: dateString,
        hasLogs,
        totalAddedSugar: Math.round(totalAddedSugar * 10) / 10, // Round to 1 decimal
        dailyTarget,
        isUnderTarget,
        isStreakDay: hasLogs && isUnderTarget,
        itemCount: items.length,
    };
}

/**
 * Calculate current streak based on food logs.
 * Works backwards from today to find consecutive streak days.
 * 
 * GRACE PERIOD: User has 2 days to log food before streak resets.
 * - If no food logged today, streak is still valid (day 1 of grace)
 * - If no food logged yesterday AND today, streak still valid (day 2 of grace)
 * - If no food logged for 3+ consecutive days, streak resets
 */
export async function calculateStreak(
    planType: PlanType,
    planStartDate: Date,
    lookbackDays: number = 90
): Promise<StreakResult> {
    const today = new Date();
    const todayString = getLocalDateString(today);

    let currentStreak = 0;
    let longestStreak = 0;
    let runningStreak = 0;
    let totalDaysUnderTarget = 0;
    let lastValidDate: string | null = null;
    let streakBroken = false;
    const missingDates: string[] = [];

    // Track consecutive days without logs (for grace period)
    let consecutiveMissingDays = 0;
    const GRACE_PERIOD_DAYS = 2; // 2 days grace before streak resets

    // Get today's status first
    const todayStatus = await getDayStatus(todayString, planType, planStartDate);

    // TODAY is handled specially: it can BREAK the streak (if over target),
    // but it does NOT count as a completed day yet (must pass 24h).
    // Only check today for streak-breaking conditions.
    if (todayStatus.hasLogs && !todayStatus.isUnderTarget) {
        // Today has logs AND exceeded sugar target - streak is broken
        streakBroken = true;
    }
    // If today has no logs or is under target, streak continues from yesterday

    // Check each COMPLETED day (starting from yesterday) going backwards
    for (let i = 1; i < lookbackDays; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateString = getLocalDateString(checkDate);

        // Don't count days before plan start
        if (checkDate < planStartDate) {
            break;
        }

        const status = await getDayStatus(dateString, planType, planStartDate);

        if (status.isStreakDay) {
            // Valid streak day - reset missing days counter
            consecutiveMissingDays = 0;
            totalDaysUnderTarget++;
            runningStreak++;

            if (!streakBroken) {
                currentStreak++;
                lastValidDate = dateString;
            }

            // Track longest streak
            if (runningStreak > longestStreak) {
                longestStreak = runningStreak;
            }
        } else if (!status.hasLogs) {
            // No food logged this day - check grace period
            consecutiveMissingDays++;

            if (!streakBroken) {
                // Within grace period - streak continues but day is "pending"
                if (consecutiveMissingDays <= GRACE_PERIOD_DAYS) {
                    missingDates.push(dateString);
                    // Don't increment streak for missing days, but don't break it yet
                } else {
                    // Grace period exceeded - streak is broken
                    streakBroken = true;
                    runningStreak = 0;
                }
            } else {
                // Streak already broken — missing day interrupts any historical streak run
                runningStreak = 0;
            }
        } else {
            // Has logs but exceeded sugar target - immediate streak break
            streakBroken = true;
            runningStreak = 0;
            consecutiveMissingDays = 0;
        }
    }

    // Can recover if within grace period (missing dates exist but under limit)
    const canRecoverStreak = missingDates.length > 0 && missingDates.length <= GRACE_PERIOD_DAYS;

    // Calculate days remaining in grace period
    const gracePeriodRemaining = Math.max(0, GRACE_PERIOD_DAYS - missingDates.length);

    return {
        currentStreak,
        longestStreak: Math.max(longestStreak, currentStreak),
        totalDaysUnderTarget,
        lastValidDate,
        todayStatus,
        canRecoverStreak,
        missingDates,
        gracePeriodRemaining,
    };
}

/**
 * Quick check if today qualifies as a streak day
 */
export async function checkTodayStreakStatus(
    planType: PlanType,
    planStartDate: Date
): Promise<DayStatus> {
    const todayString = getLocalDateString();
    return getDayStatus(todayString, planType, planStartDate);
}

/**
 * Get sugar total for today
 */
export async function getTodaySugarTotal(): Promise<number> {
    const todayString = getLocalDateString();
    const items = await getScannedItemsForDate(todayString);
    return items.reduce((sum, item) => sum + (item.sugar || 0), 0);
}

/**
 * Check if user has logged food today
 */
export async function hasLoggedFoodToday(): Promise<boolean> {
    const todayString = getLocalDateString();
    const items = await getScannedItemsForDate(todayString);
    return items.length > 0;
}

export default {
    getLocalDateString,
    getYesterdayDateString,
    getDayStatus,
    calculateStreak,
    checkTodayStreakStatus,
    getTodaySugarTotal,
    hasLoggedFoodToday,
};
