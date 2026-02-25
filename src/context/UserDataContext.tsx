/**
 * User Data Context
 * 
 * Provides global access to user data throughout the app.
 * Combines: onboarding data, streak data, and check-ins.
 * Works offline-first with local storage, syncs to Firebase when authenticated.
 */


import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

    // Logout helper
    resetForLogout: () => void;
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
    // Schedule daily reminders when app starts (if notifications are enabled)
    useEffect(() => {
        const scheduleRemindersOnStart = async () => {
            try {
                const stored = await AsyncStorage.getItem('notification_settings');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    const notificationsEnabled = parsed.allEnabled ?? (parsed.pledge ?? parsed.journal ?? parsed.streak ?? parsed.community ?? false);

                    if (notificationsEnabled) {
                        const { notificationService } = await import('../services/notificationService');
                        await notificationService.scheduleAllDailyReminders();
                        console.log('✅ Scheduled daily reminders on app start');
                    }
                }
            } catch (error) {
                console.error('Failed to schedule reminders on start:', error);
            }
        };

        scheduleRemindersOnStart();
    }, []);
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

            // Load persisted journal entries from AsyncStorage
            try {
                const storedJournal = await AsyncStorage.getItem('journal_entries');
                if (storedJournal) {
                    const parsed: JournalEntry[] = JSON.parse(storedJournal);
                    setJournalEntries(parsed.sort((a, b) => b.createdAt - a.createdAt));
                }
            } catch (error) {
                console.error('Failed to load journal entries:', error);
            }

            // Don't load stale streak data from Firebase - let refreshStreakFromFoodLogs calculate it fresh
            // This prevents showing cached/incorrect values when the app opens
            if (isAuthenticated && userId) {
                // Non-blocking check-in fetch - don't wait for it
                userService.getTodayCheckIn(userId)
                    .then(checkIn => setTodayCheckIn(checkIn))
                    .catch(() => { }); // Silently ignore errors
            }
            
            // Initialize with minimal default - refreshStreakFromFoodLogs will calculate the real values
            // This ensures we always show fresh data, not cached values
            if (localOnboarding.startDate) {
                const startDate = new Date(localOnboarding.startDate);
                setStreakData({
                    ...defaultStreakData,
                    startDate: startDate,
                });
            } else {
                setStreakData(defaultStreakData);
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
            // Use refreshStreakFromFoodLogs for consistent effective start date logic
            refreshStreakFromFoodLogs();
        }
    }, [hasLoadedOnce, onboardingData?.startDate, onboardingData?.plan, refreshStreakFromFoodLogs]);

    // Refresh streak when app comes to foreground to ensure fresh data
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active' && hasLoadedOnce && onboardingData?.startDate) {
                // App came to foreground - refresh streak to get latest data
                // This prevents showing cached/incorrect values when reopening the app
                refreshStreakFromFoodLogs();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [hasLoadedOnce, onboardingData?.startDate, refreshStreakFromFoodLogs]);

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
            // Check if there's a reset timestamp stored (from resetStreak)
            const storedBrokenAt = await AsyncStorage.getItem('streak_broken_at');
            let effectiveStartDate: Date;

            // Determine if the user is currently "on track" today
            const todayOnTrack = result.todayStatus
                ? (!result.todayStatus.hasLogs || result.todayStatus.isUnderTarget)
                : true;

            const onboardingStart = onboardingData.startDate ? new Date(onboardingData.startDate) : new Date();
            const msSinceStart = Date.now() - onboardingStart.getTime();
            const daysSinceStart = Math.floor(msSinceStart / (1000 * 60 * 60 * 24));

            // Check if streak was just broken today (exceeded sugar limit)
            const streakJustBroken = result.currentStreak === 0 && 
                result.todayStatus?.hasLogs && 
                !result.todayStatus.isUnderTarget;

            if (result.currentStreak > 0) {
                // Streak is active - clear any reset timestamp
                await AsyncStorage.removeItem('streak_broken_at');

                // If streak matches the full time since onboarding, use original start date for perfect precision
                if (result.currentStreak >= daysSinceStart) {
                    effectiveStartDate = onboardingStart;
                } else {
                    // Streak was broken and restarted. 
                    // Calculate start date based on when the streak actually started (N days ago)
                    const newBase = new Date();
                    newBase.setDate(newBase.getDate() - result.currentStreak);
                    newBase.setHours(0, 0, 0, 0); // Start of day
                    effectiveStartDate = newBase;
                }
            } else if (storedBrokenAt) {
                // Streak is 0 and there's a reset timestamp - use it as the new start (Day 0)
                // This happens when resetStreak was called or streak was broken previously
                effectiveStartDate = new Date(storedBrokenAt);
            } else if (streakJustBroken) {
                // Streak was just broken today - store timestamp now (this is Day 0)
                effectiveStartDate = new Date();
                await AsyncStorage.setItem('streak_broken_at', effectiveStartDate.toISOString());
            } else if (todayOnTrack) {
                // currentStreak is 0 but user is on track today (no reset yet)
                // Use current time as Day 0
                effectiveStartDate = new Date();
            } else {
                // Streak is broken (grace period exceeded) - create reset timestamp (Day 0)
                effectiveStartDate = new Date();
                await AsyncStorage.setItem('streak_broken_at', effectiveStartDate.toISOString());
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

            // Schedule grace period notifications if needed
            const { notificationService } = await import('../services/notificationService');
            if (result.gracePeriodRemaining > 0 && !result.todayStatus?.hasLogs) {
                // User is in grace period - schedule warning notification
                await notificationService.scheduleGracePeriodWarning(result.gracePeriodRemaining);
            } else {
                // User has logged food or not in grace period - cancel any pending warnings
                await notificationService.cancelGracePeriodWarnings();
            }

            // Cancel food logging reminder if user has logged food today
            if (result.todayStatus?.hasLogs) {
                await notificationService.cancelFoodLoggingReminder();
            }
        } catch (error) {
            console.error('Error calculating streak from food logs:', error);
        }
        // Note: We intentionally don't include streakData in dependencies to avoid infinite loops.
        // We only read streakData for stability calculations, and the actual streak is calculated from food logs.
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

        // Store the streak broken timestamp so the timer counts from this moment
        // This is the NEW start timestamp for the reset streak
        await AsyncStorage.setItem('streak_broken_at', now.toISOString());

        // Update the start date in onboarding data to the reset timestamp
        await onboardingService.saveOnboardingData({
            startDate: now.toISOString(),
        });

        // Update local state immediately with the new start timestamp
        setStreakData({
            ...defaultStreakData,
            currentStreak: 0,
            startDate: now,
            lastCheckIn: now,
        });

        if (isAuthenticated && userId) {
            await userService.updateStreak(userId, {
                currentStreak: 0,
                startDate: now,
                lastCheckIn: now,
            });
        }

        // Trigger recalculation to ensure everything is in sync
        // This will respect the new start timestamp we just set
        await refreshStreakFromFoodLogs();
    }, [isAuthenticated, userId, checkInHistory, refreshStreakFromFoodLogs]);

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

        const updated = [newEntry, ...journalEntries].sort((a, b) => b.createdAt - a.createdAt);
        setJournalEntries(updated);

        // Persist to AsyncStorage
        try {
            await AsyncStorage.setItem('journal_entries', JSON.stringify(updated));
        } catch (error) {
            console.error('Failed to persist journal entry:', error);
        }
    }, [journalEntries]);

    const getLatestJournalEntry = useCallback(() => {
        if (journalEntries.length === 0) return null;
        return journalEntries[0];
    }, [journalEntries]);

    const getJournalEntries = useCallback((limit?: number) => {
        if (!limit) return journalEntries;
        return journalEntries.slice(0, limit);
    }, [journalEntries]);

    const updateJournalEntry = useCallback(async (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'createdAt'>>) => {
        const updated = journalEntries.map(entry =>
            entry.id === id ? { ...entry, ...updates } : entry
        );
        setJournalEntries(updated);

        // Persist to AsyncStorage
        try {
            await AsyncStorage.setItem('journal_entries', JSON.stringify(updated));
        } catch (error) {
            console.error('Failed to persist journal update:', error);
        }
    }, [journalEntries]);

    const deleteJournalEntry = useCallback(async (id: string) => {
        const updated = journalEntries.filter(entry => entry.id !== id);
        setJournalEntries(updated);

        // Persist to AsyncStorage
        try {
            await AsyncStorage.setItem('journal_entries', JSON.stringify(updated));
        } catch (error) {
            console.error('Failed to persist journal deletion:', error);
        }
    }, [journalEntries]);

    // Reset all in-memory state on logout so navigation doesn't use stale values
    const resetForLogout = useCallback(() => {
        setOnboardingData({});
        setHasCompletedOnboarding(false);
        setOnboardingCheckpointState(null);
        setPostPaywallAuthRequiredState(false);
        setStreakData(null);
        setStreakResult(null);
        setTodayCheckIn(null);
        setCheckInHistory({});
        setAchievements([]);
        setJournalEntries([]);
        setLatestHealthScore(0);
        setInnerCircle([]);
        setHasLoadedOnce(false);
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
        resetForLogout,
    };

    // Sync stats to Firestore when they change (Phase 1)
    // NOTE: pledgedToday is synced separately from HomeScreen when the user actually pledges.
    // We do NOT overwrite it here, because that would reset it to false.
    useEffect(() => {
        if (isAuthenticated && userId && streakData) {
            const syncStats = async () => {
                try {
                    // Check if user has pledged today via AsyncStorage
                    const pledgeDate = await AsyncStorage.getItem('pledge_date');
                    const todayStr = new Date().toISOString().split('T')[0];
                    const hasPledged = pledgeDate === todayStr;

                    await userService.syncUserStats(userId, {
                        currentStreak: streakData.currentStreak,
                        healthScore: latestHealthScore,
                        goalAchieved: streakData.currentStreak > 0,
                        pledgedToday: hasPledged,
                        updatedAt: new Date(),
                    });
                    // Trigger community stats update in the background
                    communityStatsService.triggerStatsUpdate();
                } catch (err) {
                    console.error('Failed to sync user stats:', err);
                }
            };
            syncStats();
        }
    }, [isAuthenticated, userId, streakData, latestHealthScore]);

    return (
        <UserDataContext.Provider value={value}>
            {children}
        </UserDataContext.Provider>
    );
}

export default UserDataContext;
