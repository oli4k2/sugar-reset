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

export interface DayStatus {
    date: string;           // YYYY-MM-DD
    hasLogs: boolean;       // Did user log any food?
    totalSugar: number;     // Sum of sugar from all logged items
    dailyTarget: number;    // From getCurrentDayLimit()
    isUnderTarget: boolean; // totalSugar <= dailyTarget
    isStreakDay: boolean;   // hasLogs && isUnderTarget
    itemCount: number;      // Number of food items logged
}

export interface StreakResult {
    currentStreak: number;
    longestStreak: number;
    totalDaysUnderTarget: number;
    lastValidDate: string | null;
    todayStatus: DayStatus;
    canRecoverStreak: boolean;      // If yesterday has no logs but could be logged
    missingDates: string[];         // Days that broke streak but could be recovered
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
 * Calculate the daily target for a specific date
 */
export function getDailyTargetForDate(
    dateString: string,
    planType: PlanType,
    planStartDate: Date
): number {
    // For dates before plan start, return a high limit (no restriction)
    const targetDate = parseLocalDateString(dateString);
    if (targetDate < planStartDate) {
        return 999;
    }

    // Calculate which week of the plan this date falls in
    const diffMs = targetDate.getTime() - planStartDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffDays / 7) + 1;

    // Get the plan details to find the limit for the calculated week
    const plan = planType === 'cold_turkey'
        ? { weeklyLimits: [{ dailyGrams: 0 }] }  // Cold turkey is always 0g
        : {
            weeklyLimits: [
                { dailyGrams: 50 },  // Week 1
                { dailyGrams: 45 },  // Week 2
                { dailyGrams: 40 },  // Week 3
                { dailyGrams: 35 },  // Week 4
                { dailyGrams: 30 },  // Week 5
                { dailyGrams: 25 },  // Week 6
                { dailyGrams: 20 },  // Week 7
                { dailyGrams: 0 },   // Week 8+
            ]
        };

    // Get the limit for the specific week (cap at last defined week)
    const weekIndex = Math.min(weekNumber - 1, plan.weeklyLimits.length - 1);
    return plan.weeklyLimits[Math.max(0, weekIndex)].dailyGrams;
}

/**
 * Get status for a specific day
 */
export async function getDayStatus(
    dateString: string,
    planType: PlanType,
    planStartDate: Date
): Promise<DayStatus> {
    const items = await getScannedItemsForDate(dateString);

    // Get the daily limit for this plan (using the specific date)
    const dailyTarget = getDailyTargetForDate(dateString, planType, planStartDate);

    // Sum up sugar from all food items
    const totalSugar = items.reduce((sum, item) => sum + (item.sugar || 0), 0);

    const hasLogs = items.length > 0;
    const isUnderTarget = totalSugar <= dailyTarget;

    return {
        date: dateString,
        hasLogs,
        totalSugar: Math.round(totalSugar * 10) / 10, // Round to 1 decimal
        dailyTarget,
        isUnderTarget,
        isStreakDay: hasLogs && isUnderTarget,
        itemCount: items.length,
    };
}

/**
 * Calculate current streak based on food logs.
 * Works backwards from today to find consecutive streak days.
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

    // Get today's status first
    const todayStatus = await getDayStatus(todayString, planType, planStartDate);

    // Check each day starting from today going backwards
    for (let i = 0; i < lookbackDays; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateString = getLocalDateString(checkDate);

        // Don't count days before plan start
        if (checkDate < planStartDate) {
            break;
        }

        // Use cached status for today, fetch for other days
        const status = i === 0
            ? todayStatus
            : await getDayStatus(dateString, planType, planStartDate);

        if (status.isStreakDay) {
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
        } else {
            // Streak broken
            runningStreak = 0;

            if (!streakBroken) {
                streakBroken = true;

                // Track if this is a recoverable day (no logs yet, not too far back)
                // Only yesterday is recoverable for streak purposes
                if (!status.hasLogs && i === 1) {
                    missingDates.push(dateString);
                }
            }
        }
    }

    // Can recover if the only missing day is yesterday and user logs food under target
    const canRecoverStreak = missingDates.length > 0 &&
        missingDates.every(d => d === getYesterdayDateString());

    return {
        currentStreak,
        longestStreak: Math.max(longestStreak, currentStreak),
        totalDaysUnderTarget,
        lastValidDate,
        todayStatus,
        canRecoverStreak,
        missingDates,
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
