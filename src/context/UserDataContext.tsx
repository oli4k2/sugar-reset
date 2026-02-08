/**
 * User Data Context
 * 
 * Provides global access to user data throughout the app.
 * Combines: onboarding data, streak data, and check-ins.
 * Works offline-first with local storage, syncs to Firebase when authenticated.
 */


import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onboardingService, OnboardingData, OnboardingCheckpoint } from '../services/onboardingService';
import { useAuthContext } from './AuthContext';
import { userService } from '../services/userService';
import { communityStatsService } from '../services/communityStatsService';
import { StreakData, DailyCheckIn, OnboardingStackParamList } from '../types';
import { calculateStreak, StreakResult, DayStatus } from '../services/streakService';
import { PlanType } from '../utils/planUtils';

export interface JournalEntry {
    id: string;
    date: string; // YYYY-MM-DD
    mood?: 'great' | 'good' | 'okay' | 'struggling' | 'difficult';
    notes: string;
    whatTriggered?: string;
    createdAt: number;
}

interface UserDataContextType {
    // Onboarding data
    onboardingData: OnboardingData;
    hasCompletedOnboarding: boolean;
    onboardingCheckpoint: OnboardingCheckpoint | null;
    postPaywallAuthRequired: boolean;

    // Streak data (legacy format for backward compatibility)
    streakData: StreakData | null;

    // Food-based streak data (new)
    streakResult: StreakResult | null;
    todayStatus: DayStatus | null;
    hasLoggedFoodToday: boolean;
    canRecoverStreak: boolean;

    // Today's check-in (legacy - keeping for compatibility)
    todayCheckIn: DailyCheckIn | null;

    // Check-in history (for calendar)
    // Key: 'YYYY-MM-DD', Value: { status, grams? }
    checkInHistory: Record<string, { status: 'sugar_free' | 'had_sugar'; grams?: number }>;

    // Achievements
    achievements: string[]; // Array of unlocked achievement IDs

    // Journal entries
    journalEntries: JournalEntry[];

    // Social & Stats (Phase 1)
    latestHealthScore: number;
    updateHealthScore: (score: number) => void;

    // Inner Circle
    innerCircle: { id: string; name: string; role: string; color: string }[];
    updateInnerCircle: (circle: { id: string; name: string; role: string; color: string }[]) => void;

    // Loading states
    isLoading: boolean;

    // Methods
    updateOnboardingData: (data: Partial<OnboardingData>) => Promise<void>;
    completeOnboarding: () => Promise<void>;
    setOnboardingCheckpoint: (checkpoint: OnboardingCheckpoint | keyof OnboardingStackParamList) => Promise<void>;
    setPostPaywallAuthRequired: (required: boolean) => Promise<void>;
    refreshData: () => Promise<void>;
    refreshStreakFromFoodLogs: () => Promise<void>;
    recordCheckIn: (sugarFree: boolean, notes?: string) => Promise<void>;
    recordCheckInForDate: (date: Date, sugarFree: boolean, grams?: number) => Promise<void>;
    resetStreak: () => Promise<void>;
    unlockAchievements: (achievementIds: string[]) => Promise<void>;

    // Journal methods
    addJournalEntry: (date: Date, entry: Omit<JournalEntry, 'id' | 'date' | 'createdAt'>) => Promise<void>;
    updateJournalEntry: (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'createdAt'>>) => Promise<void>;
    deleteJournalEntry: (id: string) => Promise<void>;
    getLatestJournalEntry: () => JournalEntry | null;
    getJournalEntries: (limit?: number) => JournalEntry[];
}

const defaultStreakData: StreakData = {
    currentStreak: 0,
    longestStreak: 0,
    lastCheckIn: null,
    startDate: new Date(),
    totalDaysSugarFree: 0,
};

const UserDataContext = createContext<UserDataContextType | null>(null);

export function useUserData(): UserDataContextType {
    const context = useContext(UserDataContext);
    if (!context) {
        throw new Error('useUserData must be used within UserDataProvider');
    }
    return context;
}

interface UserDataProviderProps {
    children: ReactNode;
}

export function UserDataProvider({ children }: UserDataProviderProps) {
    const { user, isAuthenticated } = useAuthContext();
    const userId = user?.id; // Extract stable value

    const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
    const [onboardingCheckpoint, setOnboardingCheckpointState] = useState<OnboardingCheckpoint | null>(null);
    const [postPaywallAuthRequired, setPostPaywallAuthRequiredState] = useState(false);
    const [streakData, setStreakData] = useState<StreakData | null>(null);
    const [streakResult, setStreakResult] = useState<StreakResult | null>(null);
    const [todayCheckIn, setTodayCheckIn] = useState<DailyCheckIn | null>(null);
    const [checkInHistory, setCheckInHistory] = useState<Record<string, { status: 'sugar_free' | 'had_sugar'; grams?: number }>>({});
    const [innerCircle, setInnerCircle] = useState<{ id: string; name: string; role: string; color: string }[]>([]);
    const [achievements, setAchievements] = useState<string[]>([]);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [latestHealthScore, setLatestHealthScore] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    // Load initial data
    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Load onboarding data from local storage (this is fast, local)
            const localOnboarding = await onboardingService.getOnboardingData();
            setOnboardingData(localOnboarding);

            const completed = await onboardingService.hasCompletedOnboarding();
            setHasCompletedOnboarding(completed);

            const checkpoint = await onboardingService.getOnboardingCheckpoint();
            setOnboardingCheckpointState(checkpoint);

            const needsAuth = await onboardingService.isPostPaywallAuthRequired();
            setPostPaywallAuthRequiredState(needsAuth);

            // If authenticated, try to load from Firebase with timeout
            if (isAuthenticated && userId) {
                // Use Promise.race for timeout - don't block if Firestore is slow
                const profilePromise = Promise.race([
                    userService.getUserProfile(userId),
                    new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))
                ]);

                const profile = await profilePromise;
                if (profile) {
                    setStreakData(profile.streak);
                }

                // Non-blocking check-in fetch - don't wait for it
                userService.getTodayCheckIn(userId)
                    .then(checkIn => setTodayCheckIn(checkIn))
                    .catch(() => { }); // Silently ignore errors
            } else {
                // Use local streak data from onboarding
                if (localOnboarding.startDate) {
                    const startDate = new Date(localOnboarding.startDate);
                    const now = new Date();
                    const daysDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

                    setStreakData({
                        currentStreak: daysDiff,
                        longestStreak: daysDiff,
                        lastCheckIn: null,
                        startDate,
                        totalDaysSugarFree: daysDiff,
                    });
                } else {
                    setStreakData(defaultStreakData);
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, userId]);

    // Load data once on mount and when auth changes
    useEffect(() => {
        if (!hasLoadedOnce) {
            loadData();
            setHasLoadedOnce(true);
        }
    }, [loadData, hasLoadedOnce]);

    // Calculate streak from food logs after initial load
    useEffect(() => {
        if (hasLoadedOnce && onboardingData?.startDate) {
            // Calculate initial food-based streak
            const planType = (onboardingData?.plan || 'cold_turkey') as PlanType;
            const startDate = new Date(onboardingData.startDate);

            calculateStreak(planType, startDate).then(result => {
                setStreakResult(result);

                // Convert to legacy StreakData format
                const legacyStreakData: StreakData = {
                    currentStreak: result.currentStreak,
                    longestStreak: result.longestStreak,
                    lastCheckIn: result.lastValidDate ? new Date(result.lastValidDate) : null,
                    startDate: startDate,
                    totalDaysSugarFree: result.totalDaysUnderTarget,
                };
                setStreakData(legacyStreakData);
            }).catch(err => {
                console.error('Error calculating initial streak:', err);
            });
        }
    }, [hasLoadedOnce, onboardingData?.startDate, onboardingData?.plan]);

    // Update onboarding data
    const updateOnboardingData = useCallback(async (data: Partial<OnboardingData>) => {
        await onboardingService.saveOnboardingData(data);
        setOnboardingData(prev => ({ ...prev, ...data }));
    }, []);

    // Complete onboarding
    const completeOnboarding = useCallback(async () => {
        await onboardingService.completeOnboarding();
        setHasCompletedOnboarding(true);
        await onboardingService.clearOnboardingCheckpoint();
        setOnboardingCheckpointState(null);

        // Update streak data with start date
        const updated = await onboardingService.getOnboardingData();
        setOnboardingData(updated);

        if (updated.startDate) {
            setStreakData({
                ...defaultStreakData,
                startDate: new Date(updated.startDate),
            });
        }

        // Sync displayName to Firestore for friend search
        if (isAuthenticated && userId && updated.nickname) {
            try {
                await userService.updateDisplayName(userId, updated.nickname);
            } catch (error) {
                console.warn('Failed to sync displayName to Firestore:', error);
            }
        }
    }, [isAuthenticated, userId]);

    const setOnboardingCheckpoint = useCallback(async (checkpoint: OnboardingCheckpoint | keyof OnboardingStackParamList) => {
        await onboardingService.setOnboardingCheckpoint(checkpoint);
        setOnboardingCheckpointState(typeof checkpoint === 'string' ? { routeName: checkpoint } : checkpoint);
    }, []);

    const setPostPaywallAuthRequired = useCallback(async (required: boolean) => {
        await onboardingService.setPostPaywallAuthRequired(required);
        setPostPaywallAuthRequiredState(required);
    }, []);

    // Once authenticated, clear the "post-paywall auth required" state.
    useEffect(() => {
        if (isAuthenticated && postPaywallAuthRequired) {
            setPostPaywallAuthRequired(false);
        }
    }, [isAuthenticated, postPaywallAuthRequired, setPostPaywallAuthRequired]);

    // Refresh all data
    const refreshData = useCallback(async () => {
        setHasLoadedOnce(false); // Allow reload
    }, []);

    // Refresh streak from food logs (new food-based streak calculation)
    const refreshStreakFromFoodLogs = useCallback(async () => {
        const planType = (onboardingData?.plan || 'cold_turkey') as PlanType;
        const startDateString = onboardingData?.startDate;
        const startDate = startDateString ? new Date(startDateString) : new Date();

        try {
            const result = await calculateStreak(planType, startDate);
            setStreakResult(result);

            // Calculate effective start date for the timer
            let effectiveStartDate = new Date();
            if (result.currentStreak > 0) {
                const onboardingStart = new Date(onboardingData.startDate || new Date());
                const daysSinceStart = Math.floor((Date.now() - onboardingStart.getTime()) / (1000 * 60 * 60 * 24));

                // If streak matches the full time since onboarding (approx), use original start date
                // This preserves the exact time of day they started
                if (Math.abs(result.currentStreak - daysSinceStart) <= 1) {
                    effectiveStartDate = onboardingStart;
                } else {
                    // Otherwise, streak started more recently. Calculate backwards.
                    effectiveStartDate.setDate(effectiveStartDate.getDate() - result.currentStreak);
                }
            } else {
                // Streak is 0 (broken or not started). Timer should effectively show 0.
                effectiveStartDate = new Date();
            }

            // Convert to legacy StreakData format for backward compatibility
            const legacyStreakData: StreakData = {
                currentStreak: result.currentStreak,
                longestStreak: result.longestStreak,
                lastCheckIn: result.lastValidDate ? new Date(result.lastValidDate) : null,
                startDate: effectiveStartDate,
                totalDaysSugarFree: result.totalDaysUnderTarget,
            };
            setStreakData(legacyStreakData);

            // Sync to Firestore for leaderboard if authenticated
            if (isAuthenticated && userId) {
                try {
                    await userService.updateStreak(userId, legacyStreakData);
                    await userService.syncUserStats(userId, {
                        currentStreak: result.currentStreak,
                    });
                } catch (syncError) {
                    console.warn('Failed to sync streak to Firestore:', syncError);
                }
            }
        } catch (error) {
            console.error('Error calculating streak from food logs:', error);
        }
    }, [onboardingData?.plan, onboardingData?.startDate, isAuthenticated, userId]);

    // Record a check-in
    const recordCheckIn = useCallback(async (sugarFree: boolean, notes?: string) => {
        const today = new Date().toISOString().split('T')[0];

        // Allow updating today's check-in if it already exists (user can change their mind)
        // We'll just overwrite it
        const wasAlreadyCheckedIn = !!checkInHistory[today];

        if (wasAlreadyCheckedIn) {
            console.log('Updating today\'s check-in');
        }

        // Update check-in history (will overwrite if exists)
        setCheckInHistory(prev => ({
            ...prev,
            [today]: { status: sugarFree ? 'sugar_free' : 'had_sugar' },
        }));

        if (isAuthenticated && userId) {
            // Save to Firebase
            await userService.recordCheckIn(userId, {
                date: today,
                sugarFree,
                notes,
            });

            // Refresh data
            setHasLoadedOnce(false);
        } else {
            // Update local streak
            if (streakData) {
                if (sugarFree) {
                    // Only increment if this is a new check-in, not an update
                    const streakIncrement = wasAlreadyCheckedIn && checkInHistory[today]?.status === 'sugar_free' ? 0 : 1;
                    setStreakData({
                        ...streakData,
                        currentStreak: streakData.currentStreak + streakIncrement,
                        longestStreak: Math.max(streakData.longestStreak, streakData.currentStreak + streakIncrement),
                        lastCheckIn: new Date(),
                        totalDaysSugarFree: streakData.totalDaysSugarFree + streakIncrement,
                    });
                } else {
                    // Reset streak when had sugar
                    setStreakData({
                        ...streakData,
                        currentStreak: 0,
                        lastCheckIn: new Date(),
                    });
                }
            }
        }
    }, [isAuthenticated, userId, streakData, checkInHistory]);

    // Reset streak (after breaking it)
    const resetStreak = useCallback(async () => {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        // Allow updating today's check-in (user can change their answer)
        const wasAlreadyCheckedIn = !!checkInHistory[today];
        if (wasAlreadyCheckedIn) {
            console.log('Updating today\'s check-in to had_sugar');
        }

        // Update check-in history (will overwrite if exists)
        setCheckInHistory(prev => ({
            ...prev,
            [today]: { status: 'had_sugar' },
        }));

        if (isAuthenticated && userId) {
            await userService.updateStreak(userId, {
                currentStreak: 0,
                startDate: now,
                lastCheckIn: now,
            });
            setHasLoadedOnce(false);
        } else {
            // Update locally - reset currentStreak to 0
            await onboardingService.saveOnboardingData({
                startDate: now.toISOString(),
            });
            setStreakData({
                ...defaultStreakData,
                currentStreak: 0,
                startDate: now,
                lastCheckIn: now,
            });
        }
    }, [isAuthenticated, userId, checkInHistory]);

    // Record check-in for a specific date (retroactive)
    const recordCheckInForDate = useCallback(async (date: Date, sugarFree: boolean, grams?: number) => {
        // Use local date components to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;
        const status = sugarFree ? 'sugar_free' : 'had_sugar';

        // Update local state immediately
        setCheckInHistory(prev => ({ ...prev, [dateKey]: { status, grams } }));

        // If it's today, also update todayCheckIn
        const now = new Date();
        const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        if (dateKey === todayKey) {
            // Update local todayCheckIn state
            setTodayCheckIn({
                id: `local-${dateKey}`,
                userId: userId || 'local',
                date: dateKey,
                sugarFree,
                grams,
                createdAt: now,
            });

            if (isAuthenticated && userId) {
                await userService.recordCheckIn(userId, {
                    date: dateKey,
                    sugarFree,
                    grams,
                });
            }
        }

        // Recalculate streak based on history
        // For now, we'll handle this locally
    }, [isAuthenticated, userId]);

    // Unlock achievements
    const unlockAchievements = useCallback(async (achievementIds: string[]) => {
        setAchievements(prev => {
            const newAchievements = [...new Set([...prev, ...achievementIds])];
            return newAchievements;
        });
        // TODO: Persist to AsyncStorage and sync to Firebase
    }, []);

    // Journal methods
    const addJournalEntry = useCallback(async (date: Date, entry: Omit<JournalEntry, 'id' | 'date' | 'createdAt'>) => {
        const newEntry: JournalEntry = {
            id: `journal_${Date.now()}_${Math.random()}`,
            date: date.toISOString().split('T')[0],
            ...entry,
            createdAt: Date.now(),
        };

        setJournalEntries(prev => [newEntry, ...prev].sort((a, b) => b.createdAt - a.createdAt));

        // TODO: Persist to AsyncStorage and sync to Firebase
    }, []);

    const getLatestJournalEntry = useCallback(() => {
        if (journalEntries.length === 0) return null;
        return journalEntries[0];
    }, [journalEntries]);

    const getJournalEntries = useCallback((limit?: number) => {
        if (!limit) return journalEntries;
        return journalEntries.slice(0, limit);
    }, [journalEntries]);

    const updateJournalEntry = useCallback(async (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'createdAt'>>) => {
        setJournalEntries(prev => prev.map(entry =>
            entry.id === id ? { ...entry, ...updates } : entry
        ));
        // TODO: Persist to AsyncStorage and sync to Firebase
    }, []);

    const deleteJournalEntry = useCallback(async (id: string) => {
        setJournalEntries(prev => prev.filter(entry => entry.id !== id));
        // TODO: Persist to AsyncStorage and sync to Firebase
    }, []);

    const value: UserDataContextType = {
        onboardingData,
        hasCompletedOnboarding,
        onboardingCheckpoint,
        postPaywallAuthRequired,
        streakData,
        streakResult,
        todayStatus: streakResult?.todayStatus || null,
        hasLoggedFoodToday: streakResult?.todayStatus?.hasLogs || false,
        canRecoverStreak: streakResult?.canRecoverStreak || false,
        todayCheckIn,
        checkInHistory,
        achievements,
        journalEntries,
        isLoading,
        updateOnboardingData,
        completeOnboarding,
        setOnboardingCheckpoint,
        setPostPaywallAuthRequired,
        refreshData,
        refreshStreakFromFoodLogs,
        recordCheckIn,
        recordCheckInForDate,
        resetStreak,
        unlockAchievements,
        addJournalEntry,
        updateJournalEntry,
        deleteJournalEntry,
        getLatestJournalEntry,
        getJournalEntries,
        latestHealthScore,
        updateHealthScore: setLatestHealthScore,
        innerCircle,
        updateInnerCircle: setInnerCircle,
    };

    // Sync stats to Firestore when they change (Phase 1)
    useEffect(() => {
        if (isAuthenticated && userId && streakData) {
            // Debounce sync slightly or just sync on change (firestore handles merge)
            // We only sync if we have meaningful data
            userService.syncUserStats(userId, {
                currentStreak: streakData.currentStreak,
                healthScore: latestHealthScore,
                goalAchieved: streakData.currentStreak > 0, // Simplified for now
                pledgedToday: !!todayCheckIn, // True if user has checked in today
                updatedAt: new Date(),
            }).then(() => {
                // Trigger community stats update in the background
                communityStatsService.triggerStatsUpdate();
            }).catch(err => {
                console.error('Failed to sync user stats:', err);
            });
        }
    }, [isAuthenticated, userId, streakData, latestHealthScore, todayCheckIn?.mood]);

    return (
        <UserDataContext.Provider value={value}>
            {children}
        </UserDataContext.Provider>
    );
}

export default UserDataContext;
