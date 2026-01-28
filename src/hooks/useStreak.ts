/**
 * useStreak Hook
 *
 * Manages streak data based on food logging.
 *
 * Streak logic:
 * 1. Did user log food? If NO → streak resets
 * 2. If YES, was sugar under daily target? If NO → streak resets
 * 3. If YES → streak continues
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { userService } from '../services/userService';
import {
    calculateStreak,
    checkTodayStreakStatus,
    StreakResult,
    DayStatus,
    getLocalDateString,
} from '../services/streakService';
import { StreakData } from '../types';
import { PlanType } from '../utils/planUtils';

interface UseStreakReturn {
    streak: StreakData | null;
    streakResult: StreakResult | null;
    todayStatus: DayStatus | null;
    isLoading: boolean;
    error: string | null;
    refreshStreak: () => Promise<void>;
    hasLoggedToday: boolean;
    canRecoverStreak: boolean;
    missingDates: string[];
}

export function useStreak(): UseStreakReturn {
    const { user, firebaseUser } = useAuthContext();
    const { onboardingData } = useUserData();

    const [streakResult, setStreakResult] = useState<StreakResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get plan type and start date from onboarding data
    const planType = (onboardingData?.plan || 'cold_turkey') as PlanType;
    const startDateString = onboardingData?.startDate;
    const startDate = startDateString ? new Date(startDateString) : new Date();

    /**
     * Refresh streak data by recalculating from food logs
     */
    const refreshStreak = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await calculateStreak(planType, startDate);
            setStreakResult(result);

            // Sync to Firestore for leaderboard if authenticated
            if (firebaseUser) {
                const streakData: StreakData = {
                    currentStreak: result.currentStreak,
                    longestStreak: result.longestStreak,
                    lastCheckIn: result.lastValidDate ? new Date(result.lastValidDate) : null,
                    startDate: startDate,
                    totalDaysSugarFree: result.totalDaysUnderTarget,
                };

                try {
                    await userService.updateStreak(firebaseUser.uid, streakData);

                    // Also sync to userStats for leaderboard
                    await userService.syncUserStats(firebaseUser.uid, {
                        currentStreak: result.currentStreak,
                    });
                } catch (syncError) {
                    // Don't fail the whole operation if sync fails
                    console.warn('Failed to sync streak to Firestore:', syncError);
                }
            }
        } catch (err) {
            console.error('Error calculating streak:', err);
            setError('Failed to calculate streak');
        } finally {
            setIsLoading(false);
        }
    }, [planType, startDate, firebaseUser]);

    // Initial load
    useEffect(() => {
        refreshStreak();
    }, [refreshStreak]);

    // Convert streakResult to legacy StreakData format for backward compatibility
    const streak: StreakData | null = streakResult
        ? {
              currentStreak: streakResult.currentStreak,
              longestStreak: streakResult.longestStreak,
              lastCheckIn: streakResult.lastValidDate
                  ? new Date(streakResult.lastValidDate)
                  : null,
              startDate: startDate,
              totalDaysSugarFree: streakResult.totalDaysUnderTarget,
          }
        : null;

    return {
        streak,
        streakResult,
        todayStatus: streakResult?.todayStatus || null,
        isLoading,
        error,
        refreshStreak,
        hasLoggedToday: streakResult?.todayStatus?.hasLogs || false,
        canRecoverStreak: streakResult?.canRecoverStreak || false,
        missingDates: streakResult?.missingDates || [],
    };
}

export default useStreak;
