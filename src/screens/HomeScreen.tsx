/**
 * HomeScreen - Main Dashboard (Sky Theme with Live Counters)
 * 
 * Features:
 * - Live timer (days, hours, minutes, seconds)
 * - Money saved counter
 * - Sugar avoided counter
 * - Panic button for cravings
 * - Personal reasons reminder
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput,
    Alert,
    Animated,
    PanResponder,
    LayoutAnimation,
    Platform,
    UIManager,
    FlatList,
    Dimensions,
    // Image removed - replaced sprout.png with PhaseAnimation
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { spacing, borderRadius, typography } from '../theme';
import LooviBackground, { looviColors } from '../components/LooviBackground';
import {
    GlassCard,
    WeekStrip,
    PlanDetailsModal,
    CheckInModal,
    JournalWidget,
    SwipeableTabView,
    JournalEntryModal,
    FoodScannerModal,
    PlanProgressBar,
    WellnessTracker,
    QuickTrackModal,
    SOSButton,
    WellnessModal,
    PledgeModal,
    PanicModal,
    EditSavingsModal,
    CheckInStatusModal,
    EditGoalsModal
} from '../components';
import { useUserData } from '../context/UserDataContext';
import { getTodayGuidance, PlanType, getPlanDetails, getCurrentWeek } from '../utils/planUtils';
import { healthService } from '../services/healthService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppIcon } from '../components/OnboardingIcon';
import { WellnessLog } from '../components/WellnessModal';
import { WellnessData } from '../components/WellnessTracker';
import { getScannedItems, ScannedItem } from '../services/scannerService';
import {
    aggregateHealthData,
} from '../services/healthScoringService';
import { useAuthContext } from '../context/AuthContext';
import { userService } from '../services/userService';
import { MascotTip } from '../components/MascotTip';
import streakService from '../services/streakService';
import { friendService } from '../services/friendService';
import { PhaseAnimation } from '../components/PhaseAnimation';
import StreakInfoModal from '../components/StreakInfoModal';
import { ReviewPromptModal } from '../components/ReviewPromptModal';
import CancellationOfferScreen from '../components/CancellationOfferScreen';
import {
    shouldShowFirstScanPrompt,
    markFirstScanPromptShown,
    shouldShowDayTwoPrompt,
    markDayTwoPromptShown,
} from '../services/reviewPromptService';
import { useRevenueCat } from '../hooks/useRevenueCat';
import { notificationService, NOTIFICATION_PROMPTED_ONBOARDING_KEY } from '../services/notificationService';
// Note: Phase preview moved to ProfileScreen dev tools

function formatDuration(ms: number) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    return { days, hours, minutes, seconds };
}

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function HomeScreen() {
    const [showPanicModal, setShowPanicModal] = useState(false);
    const [showCheckInModal, setShowCheckInModal] = useState(false);
    const [showCheckInStatusModal, setShowCheckInStatusModal] = useState(false);
    const [checkInResult, setCheckInResult] = useState<'success' | 'reset' | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [showPlanDetails, setShowPlanDetails] = useState(false);
    const [showEditSavingsModal, setShowEditSavingsModal] = useState(false);
    const [showEditReasonsModal, setShowEditReasonsModal] = useState(false);
    const [editSavingsGoal, setEditSavingsGoal] = useState('');
    const [editReasons, setEditReasons] = useState<string[]>([]);
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);

    // Carousel logic
    const flatListRef = useRef<FlatList>(null);
    const isFocused = useIsFocused();
    const scrollX = useRef(new Animated.Value(0)).current;
    const [showPledgeModal, setShowPledgeModal] = useState(false);
    const [hasPledgedToday, setHasPledgedToday] = useState(false);
    const [wellnessAverages, setWellnessAverages] = useState<WellnessData | null>(null);
    const [hasFoodLoggedToday, setHasFoodLoggedToday] = useState(false);
    const [showJournalModal, setShowJournalModal] = useState(false);
    const [showTrackModal, setShowTrackModal] = useState(false);
    const [showFoodScannerModal, setShowFoodScannerModal] = useState(false);
    const [showWellnessModal, setShowWellnessModal] = useState(false);
    const [hasWellnessToday, setHasWellnessToday] = useState(false);
    const [todayWellnessData, setTodayWellnessData] = useState<WellnessLog | null>(null);
    const [hasInnerCircleFriends, setHasInnerCircleFriends] = useState(false);
    const [hasCommunityTipDoneToday, setHasCommunityTipDoneToday] = useState(false);
    const [hasCheckedCircleToday, setHasCheckedCircleToday] = useState(false);
    const [showStreakInfoModal, setShowStreakInfoModal] = useState(false);
    const [showReviewPrompt, setShowReviewPrompt] = useState(false);
    const [reviewPromptVariant, setReviewPromptVariant] = useState<'first_scan' | 'day_two'>('first_scan');
    const [showNotificationPermissionPrePrompt, setShowNotificationPermissionPrePrompt] = useState(false);
    const [isRequestingNotificationPermission, setIsRequestingNotificationPermission] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const hasTriggeredNotificationPermissionRef = useRef(false);
    const fallbackDateRef = useRef(new Date().toISOString()); // Stable fallback
    const navigation = useNavigation<any>(); // Type as any to allow navigation to new modal screens

    // Pledge hold-down animation states
    const [isPledgeHolding, setIsPledgeHolding] = useState(false);
    const pledgeProgress = useRef(new Animated.Value(0)).current;
    const pledgeScale = useRef(new Animated.Value(1)).current;
    const pledgeShroudOpacity = useRef(new Animated.Value(0)).current;
    const celebrationScale = useRef(new Animated.Value(0)).current;
    const celebrationOpacity = useRef(new Animated.Value(0)).current;
    const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

    // RevenueCat context for subscription and cancellation offers
    const {
        isPremium,
        currentOffering,
        purchasePackage,
        findPackageByIdentifier,
        showCancellationOffer,
        dismissCancellationOffer,
    } = useRevenueCat();

    const {
        onboardingData,
        isLoading,
        recordCheckIn,
        resetStreak,
        todayCheckIn,
        streakData,
        checkInHistory,
        recordCheckInForDate,
        getLatestJournalEntry,
        updateOnboardingData,
        addJournalEntry,
        updateHealthScore,
        // New food-based streak data
        refreshStreakFromFoodLogs,
        todayStatus,
        hasLoggedFoodToday: hasLoggedFoodTodayFromContext,
        canRecoverStreak,
    } = useUserData();

    // Auth context for syncing pledge status
    const { user, isAuthenticated } = useAuthContext();

    // Get user data from context (with fallbacks)
    // Use streakData.startDate for timer accuracy (updates when streak resets)
    const streakStartDateString = streakData?.startDate
        ? (streakData.startDate instanceof Date
            ? streakData.startDate.toISOString()
            : String(streakData.startDate))
        : onboardingData.startDate || fallbackDateRef.current;

    // Stability fix: use the same fallback date for the entire component lifecycle
    const startDate = useMemo(() => {
        return new Date(streakStartDateString);
    }, [streakStartDateString]);

    // Plan start date - fixed from onboarding, never resets (independent of streak)
    const planStartDate = useMemo(() => {
        const planStartString = onboardingData?.startDate || fallbackDateRef.current;
        return new Date(planStartString);
    }, [onboardingData?.startDate]);
    const dailySpendingCents = onboardingData.dailySpendingCents || 300;
    const dailySugarGrams = onboardingData.dailySugarGrams || 77;
    const savingsGoal = onboardingData.savingsGoal || 'Something amazing';
    const savingsGoalAmount = onboardingData.savingsGoalAmount || 500;

    // Map user's selected goals to readable reason statements
    const GOAL_TO_REASON: Record<string, string> = {
        cravings: 'Break free from sugar cravings',
        habits: 'Form healthier daily habits',
        energy: 'Better focus and mental clarity',
        health: 'Improved overall health',
        weight: 'Achieve your weight goals',
        skin: 'Clearer, healthier skin',
        focus: 'Enhanced focus and productivity',
        blood_sugar: 'Stable blood sugar levels',
        sleep: 'Improved sleep quality',
        savings: 'Save money for what matters',
    };

    // Get user's personalized reasons from their selected goals
    // Goals can be either goal IDs (from onboarding) or full text strings (from editing)
    const userGoals = onboardingData.goals || [];
    const reasons = userGoals.length > 0
        ? userGoals.map(goalOrText => GOAL_TO_REASON[goalOrText] || goalOrText).filter(Boolean)
        : ['Better focus and mental clarity', 'Stable blood sugar levels', 'Improved sleep quality'];

    useEffect(() => {
        // Calculate initial elapsed time
        const now = new Date();
        const elapsed = now.getTime() - startDate.getTime();
        setTimeElapsed(Math.max(0, elapsed));

        // Update every second
        intervalRef.current = setInterval(() => {
            const now = new Date();
            const elapsed = now.getTime() - startDate.getTime();
            setTimeElapsed(Math.max(0, elapsed));
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [startDate]);

    // Animate button changes
    useEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [hasPledgedToday, hasFoodLoggedToday, wellnessAverages]);

    // Internal function to get target index
    const getTargetIndex = useCallback(() => {
        if (!hasPledgedToday) return 0;
        const currentHour = new Date().getHours();
        if (currentHour < 20) return 1;
        return 2;
    }, [hasPledgedToday]);

    // Auto-scroll on pledge completion
    useEffect(() => {
        if (hasPledgedToday && flatListRef.current) {
            // giving a small delay to ensure state update and layout
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: 1, animated: true });
            }, 300);
        }
    }, [hasPledgedToday]);

    // Re-center on Tab Focus
    useEffect(() => {
        if (isFocused && flatListRef.current) {
            const targetIndex = getTargetIndex();
            // Optional: delayed scroll to ensure layout is ready if switching tabs
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: targetIndex, animated: true });
            }, 100);
        }
    }, [isFocused, getTargetIndex]);

    // Load pledge status from AsyncStorage on mount (survives app close)
    useEffect(() => {
        const loadPledgeStatus = async () => {
            try {
                const pledgeDate = await AsyncStorage.getItem('pledge_date');
                const todayStr = new Date().toISOString().split('T')[0];
                if (pledgeDate === todayStr) {
                    setHasPledgedToday(true);
                } else {
                    setHasPledgedToday(false);
                    // Clear stale pledge date
                    if (pledgeDate) await AsyncStorage.removeItem('pledge_date');
                }
            } catch (error) {
                console.error('Error loading pledge status:', error);
            }
        };
        loadPledgeStatus();
    }, []);

    // Load Inner Circle friend count
    useEffect(() => {
        const loadFriendCount = async () => {
            if (!user?.id) return;
            try {
                const friends = await friendService.getInnerCircle(user.id);
                setHasInnerCircleFriends(friends.length > 0);
            } catch (error) {
                console.error('Error loading friend count:', error);
            }
        };
        loadFriendCount();
    }, [user?.id]);

    // Load 7-day wellness averages with real date-based filtering
    // Refresh when wellness modal is closed
    useEffect(() => {
        const loadWellnessAverages = async () => {
            try {
                const [stored, foodItems] = await Promise.all([
                    AsyncStorage.getItem('wellness_logs'),
                    getScannedItems(),
                ]);

                setScannedItems(foodItems);

                const logs = stored ? JSON.parse(stored) : [];

                // Check if today has wellness logged
                const todayStr = new Date().toISOString().split('T')[0];
                const todayLog = logs.find((log: any) => log.date === todayStr);
                setHasWellnessToday(!!todayLog);
                setTodayWellnessData(todayLog || null);

                // Filter logs for last 7 days
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

                const recentLogs = logs.filter((log: any) => log.date >= sevenDaysAgoStr);

                if (recentLogs.length > 0) {
                    // Calculate actual averages for each metric
                    const sum = recentLogs.reduce((acc: any, log: any) => ({
                        mood: acc.mood + log.mood,
                        energy: acc.energy + log.energy,
                        focus: acc.focus + log.focus,
                        sleep: acc.sleep + log.sleepHours,
                    }), { mood: 0, energy: 0, focus: 0, sleep: 0 });

                    setWellnessAverages({
                        mood: sum.mood / recentLogs.length,
                        energy: sum.energy / recentLogs.length,
                        focus: sum.focus / recentLogs.length,
                        sleep: sum.sleep / recentLogs.length,
                    });

                    // Aggregate data for health score calculation
                    const aggregated = aggregateHealthData(foodItems, logs, 7);
                    updateHealthScore(aggregated.avgOverallScore);
                } else {
                    setWellnessAverages(null);
                    updateHealthScore(0);
                }
            } catch (error) {
                console.error('Error loading wellness averages:', error);
                setWellnessAverages(null);
                setHasWellnessToday(false);
            }
        };
        loadWellnessAverages();
    }, [showWellnessModal, isFocused]); // Reload when wellness modal closes or tab is focused

    // Check if food has been logged today
    useEffect(() => {
        const checkFoodLogged = async () => {
            try {
                const items = await getScannedItems();
                const today = new Date().toISOString().split('T')[0];
                const hasLoggedToday = items.some(item =>
                    item.timestamp.split('T')[0] === today
                );
                setHasFoodLoggedToday(hasLoggedToday);
            } catch (error) {
                console.error('Error checking food log:', error);
            }
        };
        checkFoodLogged();
    }, []);

    // Check if we should show the day-2 review prompt
    useEffect(() => {
        const checkDayTwoPrompt = async () => {
            try {
                const show = await shouldShowDayTwoPrompt(onboardingData.completedAt);
                if (show) {
                    // Slight delay so the home screen loads first
                    setTimeout(() => {
                        setReviewPromptVariant('day_two');
                        setShowReviewPrompt(true);
                        markDayTwoPromptShown();
                    }, 2000);
                }
            } catch (error) {
                console.warn('Error checking day-2 review prompt:', error);
            }
        };
        if (!isLoading) {
            checkDayTwoPrompt();
        }
    }, [isLoading, onboardingData.completedAt]);

    // Notification pre-permission modal on first Home open.
    // If user already tapped the onboarding CTA, this is skipped.
    useEffect(() => {
        const maybePromptNotifications = async () => {
            if (!user?.id || !isAuthenticated) return;
            if (hasTriggeredNotificationPermissionRef.current) return;
            hasTriggeredNotificationPermissionRef.current = true;

            try {
                const promptedInOnboarding = await AsyncStorage.getItem(NOTIFICATION_PROMPTED_ONBOARDING_KEY);
                if (promptedInOnboarding === '1') return;

                const currentStatus = await notificationService.getNotificationPermissionStatus();

                // If already resolved, no need to show the coaching nudge.
                if (currentStatus === 'granted') {
                    await notificationService.registerForPushNotifications(user.id, { requestPermission: false });
                    return;
                }
                if (currentStatus !== 'undetermined') return;

                // Show an attractive in-app prompt first, then trigger Apple's native prompt.
                setShowNotificationPermissionPrePrompt(true);
            } catch (error) {
                console.warn('Notification permission prompt failed:', error);
            }
        };

        maybePromptNotifications();
    }, [user?.id, isAuthenticated]);

    // Handle notification taps — open the relevant modal directly
    useEffect(() => {
        const subscription = notificationService.addNotificationResponseListener((response) => {
            const notificationType = response.notification.request.content.data?.type;
            if (notificationType === 'food_logging_reminder') {
                setShowFoodScannerModal(true);
            } else if (notificationType === 'wellness_checkin_reminder') {
                setShowWellnessModal(true);
            }
        });

        return () => subscription.remove();
    }, []);

    const handleNotificationPrePromptContinue = async () => {
        if (!user?.id || isRequestingNotificationPermission) return;
        setIsRequestingNotificationPermission(true);
        try {
            await AsyncStorage.setItem(NOTIFICATION_PROMPTED_ONBOARDING_KEY, '1');
            setShowNotificationPermissionPrePrompt(false);
            const token = await notificationService.registerForPushNotifications(user.id);
            if (token) console.log('✅ Notifications enabled from Home pre-prompt');
        } catch (error) {
            console.warn('Failed to request notifications from Home pre-prompt:', error);
        } finally {
            setIsRequestingNotificationPermission(false);
        }
    };

    const handleNotificationPrePromptLater = async () => {
        setShowNotificationPermissionPrePrompt(false);
        // Prevents this from reappearing every app launch after user already decided here.
        await AsyncStorage.setItem(NOTIFICATION_PROMPTED_ONBOARDING_KEY, '1');
    };

    const duration = formatDuration(timeElapsed);
    const daysSugarFree = duration.days;

    // Calculate savings and sugar avoided
    const moneySavedCents = Math.floor((timeElapsed / (1000 * 60 * 60 * 24)) * dailySpendingCents);
    const moneySaved = (moneySavedCents / 100).toFixed(2);
    const sugarAvoided = Math.floor((timeElapsed / (1000 * 60 * 60 * 24)) * dailySugarGrams);

    const handlePanicButton = () => {
        setShowPanicModal(true);
    };

    const handleWellnessSave = async (log: WellnessLog) => {
        try {
            // Save wellness metrics
            const stored = await AsyncStorage.getItem('wellness_logs');
            const logs = stored ? JSON.parse(stored) : [];
            const existingIndex = logs.findIndex((l: any) => l.date === log.date);

            if (existingIndex >= 0) {
                logs[existingIndex] = log;
            } else {
                logs.unshift(log);
            }

            await AsyncStorage.setItem('wellness_logs', JSON.stringify(logs));

            // Cancel wellness check-in reminder if user completed it today
            const todayStr = new Date().toISOString().split('T')[0];
            if (log.date === todayStr) {
                const { notificationService } = await import('../services/notificationService');
                await notificationService.cancelWellnessCheckInReminder();
            }

            // Also save journal entry if thoughts are provided
            if (log.thoughts && log.thoughts.trim()) {
                const moodMap: Record<number, 'great' | 'good' | 'okay' | 'struggling' | 'difficult'> = {
                    5: 'great',
                    4: 'good',
                    3: 'okay',
                    2: 'struggling',
                    1: 'difficult',
                };
                await addJournalEntry(new Date(), {
                    mood: moodMap[log.mood] || 'okay',
                    notes: log.thoughts.trim(),
                });
            }

            // Immediately update button state so it reflects the save
            const todayStr2 = new Date().toISOString().split('T')[0];
            if (log.date === todayStr2) {
                setHasWellnessToday(true);
                setTodayWellnessData(log);
            }
        } catch (error) {
            console.error('Failed to save wellness log:', error);
        }
    };

    const handleCheckIn = () => {
        if (hasCheckedInToday) {
            // Show status modal instead of check-in modal
            setShowCheckInStatusModal(true);
        } else {
            setShowCheckInModal(true);
            setCheckInResult(null);
        }
    };

    const handleResetCheckIn = async () => {
        // Close status modal and open check-in modal to re-do
        setShowCheckInStatusModal(false);
        setShowCheckInModal(true);
        setCheckInResult(null);
    };

    const handleCheckInSubmit = async (sugarFree: boolean, extras?: any) => {
        try {
            const today = new Date();

            // Extract grams from extras if present (for gradual plan)
            const grams = extras?.sugarGrams;

            // Record the check-in with grams
            await recordCheckInForDate(today, sugarFree, grams);

            setShowCheckInModal(false);
            setCheckInResult(sugarFree ? 'success' : 'reset');

            // Auto-hide result after 3 seconds
            setTimeout(() => {
                setCheckInResult(null);
            }, 3000);
        } catch (error) {
            console.error('Failed to submit check-in:', error);
            setShowCheckInModal(false);
        }
    };

    const handleSugarFree = async () => {
        await recordCheckIn(true);
        setCheckInResult('success');
    };

    const handleHadSugar = async () => {
        await resetStreak();
        setCheckInResult('reset');
    };

    const hasCheckedInToday = !!todayCheckIn || !!checkInHistory[new Date().toISOString().split('T')[0]];

    // Get plan guidance - always Cold Turkey
    const planType = 'cold_turkey' as PlanType;
    const guidance = getTodayGuidance(planType, startDate);

    // For cold turkey, daily limit is always 0
    const currentWeek = getCurrentWeek(startDate);
    const planDetails = getPlanDetails(planType);
    const dailyLimit = 0; // Cold turkey: no sugar allowed

    // Handle check-in for a specific date from calendar
    const handleDayPress = (date: Date) => {
        setSelectedDate(date);
        setShowCheckInModal(true);
        setCheckInResult(null);
    };

    const handleDateCheckIn = async (sugarFree: boolean) => {
        if (selectedDate) {
            await recordCheckInForDate(selectedDate, sugarFree);
            setCheckInResult(sugarFree ? 'success' : 'reset');
        }
    };

    // Open edit savings modal
    const handleEditSavings = () => {
        setEditSavingsGoal(savingsGoal);
        setShowEditSavingsModal(true);
    };

    // Save savings goal
    const handleSaveSavingsGoal = async () => {
        if (editSavingsGoal.trim()) {
            await updateOnboardingData({ savingsGoal: editSavingsGoal.trim() });
            setShowEditSavingsModal(false);
        }
    };

    // Open edit reasons modal
    const handleEditReasons = () => {
        setEditReasons(reasons);
        setShowEditReasonsModal(true);
    };

    // Save reasons
    const handleSaveReasons = async () => {
        const filteredReasons = editReasons.filter(r => r.trim());
        if (filteredReasons.length > 0) {
            await updateOnboardingData({ goals: filteredReasons });
            setShowEditReasonsModal(false);
        }
    };

    // Update a single reason in the edit list
    const updateReason = (index: number, value: string) => {
        const newReasons = [...editReasons];
        newReasons[index] = value;
        setEditReasons(newReasons);
    };

    // Add new reason
    const addReason = () => {
        setEditReasons([...editReasons, '']);
    };

    // Remove reason
    const removeReason = (index: number) => {
        setEditReasons(editReasons.filter((_, i) => i !== index));
    };

    return (
        <SwipeableTabView currentTab="Home">
            <LooviBackground variant="coralTop">
                <SafeAreaView style={styles.container}>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Growth Animation Section */}
                        <View style={styles.timerSection}>
                            {/* Streak Badge - Above Animation */}
                            <TouchableOpacity
                                style={styles.streakBadge}
                                onPress={() => setShowStreakInfoModal(true)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.streakRow}>
                                    <AppIcon emoji="🔥" size={16} />
                                    <Text style={styles.streakText}> Sugar-free streak</Text>
                                    <Ionicons name="information-circle" size={16} color="#D97706" style={{ marginLeft: 4 }} />
                                </View>
                            </TouchableOpacity>

                            {/* Growth Animation instead of number */}
                            <TouchableOpacity
                                style={styles.animationWrapper}
                                onPress={() => setShowStreakInfoModal(true)}
                                activeOpacity={0.7}
                            >
                                <View style={{ marginBottom: spacing.sm, marginTop: spacing['2xl'] }}>
                                    <PhaseAnimation daysSugarFree={daysSugarFree} size={150} />
                                </View>
                            </TouchableOpacity>

                            {/* Live Timer - floating below animation with days */}
                            <View style={styles.floatingTimer}>
                                <Text style={styles.timerText}>
                                    {daysSugarFree}d {String(duration.hours).padStart(2, '0')}h {String(duration.minutes).padStart(2, '0')}m {String(duration.seconds).padStart(2, '0')}s
                                </Text>
                            </View>
                        </View>

                        {/* Plan Progress Bar */}
                        <PlanProgressBar
                            daysSinceStart={Math.floor((Date.now() - planStartDate.getTime()) / (1000 * 60 * 60 * 24))}
                            planDuration={90}
                            endDate={new Date(planStartDate.getTime() + 90 * 24 * 60 * 60 * 1000)}
                            onInfoPress={() => setShowStreakInfoModal(true)}
                        />

                        {/* Action Buttons: Pledge, Logging, Journal - Daily Journey */}
                        <View style={styles.dailyFlowContainer}>
                            {/* Carousel of Daily Actions */}
                            <Animated.FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                snapToAlignment="start"
                                snapToInterval={100} // Reduced to 100 for tighter spacing
                                decelerationRate="fast"
                                onScroll={Animated.event(
                                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                                    { useNativeDriver: true }
                                )}
                                ref={flatListRef}
                                disableIntervalMomentum={true}
                                getItemLayout={(data, index) => (
                                    { length: 100, offset: 100 * index, index }
                                )}
                                initialScrollIndex={getTargetIndex()}
                                onScrollToIndexFailed={(info) => {
                                    const wait = new Promise(resolve => setTimeout(resolve, 500));
                                    wait.then(() => {
                                        flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                                    });
                                }}
                                contentContainerStyle={{
                                    paddingHorizontal: (Dimensions.get('window').width - 100) / 2,
                                    alignItems: 'center',
                                    paddingTop: spacing.md,
                                }}
                                data={[
                                    { id: 'pledge', type: 'pledge' },
                                    { id: 'track', type: 'track' },
                                    { id: 'journal', type: 'journal' },
                                ]}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item, index }) => {
                                    const isPledged = hasPledgedToday;
                                    const isLogged = hasFoodLoggedToday;
                                    const isJournaled = hasWellnessToday;

                                    let isCompleted = false;
                                    let label = "";
                                    let subLabel = "";
                                    let iconName: any = "";
                                    let iconEmoji = "";
                                    let bg = "";
                                    let shadow = "";
                                    let onPress: () => void = () => { };
                                    let disabled = false;

                                    if (item.type === 'pledge') {
                                        isCompleted = isPledged;
                                        label = "Pledge";
                                        subLabel = "Morning";
                                        iconName = isPledged ? "checkmark" : "hand-left";
                                        bg = isPledged ? 'rgba(127, 176, 105, 0.4)' : 'rgba(217, 123, 102, 0.9)';
                                        shadow = isPledged ? '#7FB069' : looviColors.coralOrange;
                                        onPress = () => setShowPledgeModal(true);
                                        disabled = isPledged;
                                    } else if (item.type === 'track') {
                                        isCompleted = isLogged;
                                        label = "Track";
                                        subLabel = "Day";
                                        iconName = "restaurant";
                                        bg = 'rgba(232, 168, 124, 0.9)';
                                        shadow = looviColors.coralOrange;
                                        onPress = () => isPledged && setShowFoodScannerModal(true);
                                        disabled = !isPledged;
                                    } else if (item.type === 'journal') {
                                        isCompleted = isJournaled;
                                        label = "Wellness";
                                        subLabel = "Evening";
                                        iconName = isJournaled ? "checkmark" : "heart";
                                        // When done: Green background
                                        bg = isJournaled ? looviColors.accent.success : 'rgba(235, 110, 95, 0.9)'; // Orange/Red for Evening/Incomplete
                                        shadow = '#7FB069';
                                        onPress = () => setShowWellnessModal(true);
                                        // Allow journaling anytime
                                    }

                                    // Animations
                                    const ITEM_SIZE = 100;
                                    const inputRange = [
                                        (index - 1) * ITEM_SIZE,
                                        index * ITEM_SIZE,
                                        (index + 1) * ITEM_SIZE,
                                    ];

                                    const scale = scrollX.interpolate({
                                        inputRange,
                                        outputRange: [0.6, 1, 0.6],
                                        extrapolate: 'clamp',
                                    });

                                    const opacity = scrollX.interpolate({
                                        inputRange,
                                        outputRange: [0.4, 1, 0.4], // More dim (0.4)
                                        extrapolate: 'clamp',
                                    });

                                    return (
                                        <View style={[styles.carouselItem, { width: 100 }]}>
                                            <Animated.View style={{ transform: [{ scale }], opacity }}>
                                                <TouchableOpacity
                                                    activeOpacity={0.8}
                                                    onPress={onPress}
                                                    disabled={disabled && item.type !== 'track'}
                                                    style={styles.largeCircleButtonContainer}
                                                >
                                                    <View style={[
                                                        styles.largeCircleButton,
                                                        {
                                                            backgroundColor: bg,
                                                            shadowColor: shadow,
                                                            borderColor: 'rgba(255, 255, 255, 0.9)',
                                                            borderWidth: 4,
                                                        }
                                                    ]}>
                                                        {iconEmoji ? (
                                                            <AppIcon
                                                                emoji={iconEmoji}
                                                                size={32}
                                                                color="#FFFFFF"
                                                            />
                                                        ) : (
                                                            <Ionicons
                                                                name={iconName}
                                                                size={30}
                                                                color="#FFFFFF"
                                                            />
                                                        )}
                                                    </View>
                                                    <Text style={styles.largeCircleButtonLabel}>{label}</Text>
                                                    <Text style={styles.largeFlowTimeLabel}>{subLabel}</Text>
                                                </TouchableOpacity>
                                            </Animated.View>
                                        </View>
                                    );
                                }}
                            />
                        </View>

                        {/* Mascot Tips - Dynamic suggestions with friendly mascot */}
                        <MascotTip
                            hasPledgedToday={hasPledgedToday}
                            hasFoodLoggedToday={hasFoodLoggedToday}
                            hasWellnessToday={hasWellnessToday}
                            hasInnerCircleFriends={hasInnerCircleFriends}
                            currentStreak={streakData?.currentStreak || 0}
                            healthScore={0}
                            hasCommunityTipDoneToday={hasCommunityTipDoneToday}
                            onCommunityTipDone={() => setHasCommunityTipDoneToday(true)}
                            hasCheckedCircleToday={hasCheckedCircleToday}
                            onTipPress={(action, friendId) => {
                                switch (action) {
                                    case 'pledge':
                                        setShowPledgeModal(true);
                                        break;
                                    case 'track':
                                        setShowFoodScannerModal(true);
                                        break;
                                    case 'journal':
                                        setShowWellnessModal(true);
                                        break;
                                    case 'inner_circle':
                                        setHasCheckedCircleToday(true);
                                        navigation.navigate('Social', { initialTab: 'circle' });
                                        break;
                                    case 'analytics':
                                        navigation.navigate('Analytics');
                                        break;
                                    case 'community':
                                        navigation.navigate('Social', { initialTab: 'community' });
                                        break;
                                    case 'cheer_friend':
                                        // Navigate to friend's profile to send encouragement
                                        if (friendId) {
                                            navigation.navigate('Social', { viewFriendId: friendId });
                                        } else {
                                            navigation.navigate('Social');
                                        }
                                        break;
                                    default:
                                        break;
                                }
                            }}
                        />

                        {/* Spacer */}
                        <View style={{ height: spacing.lg }} />

                        {/* 7-Day Wellness Averages */}
                        {wellnessAverages ? (
                            <WellnessTracker averages={wellnessAverages} />
                        ) : (
                            <GlassCard variant="light" padding="lg" style={styles.wellnessEmptyCard}>
                                <View style={styles.wellnessEmptyHeader}>
                                    <Feather name="heart" size={18} color={looviColors.accent.primary} />
                                    <Text style={styles.wellnessEmptyTitle}>7-Day Wellness</Text>
                                </View>
                                <Text style={styles.wellnessEmptyText}>
                                    Start logging your mood, energy, focus, and sleep to see your 7-day averages here.
                                </Text>
                                <TouchableOpacity
                                    style={styles.wellnessEmptyButton}
                                    onPress={() => setShowWellnessModal(true)}
                                >
                                    <Text style={styles.wellnessEmptyButtonText}>Log Wellness</Text>
                                </TouchableOpacity>
                            </GlassCard>
                        )}


                    </ScrollView>

                    <Modal
                        visible={showNotificationPermissionPrePrompt}
                        transparent
                        animationType="fade"
                        onRequestClose={handleNotificationPrePromptLater}
                    >
                        <View style={styles.notificationPromptOverlay}>
                            <View style={styles.notificationPromptCard}>
                                <View style={styles.notificationPromptIconWrap}>
                                    <Ionicons name="notifications" size={30} color="#FFFFFF" />
                                </View>
                                <Text style={styles.notificationPromptTitle}>Turn on Reminders to 3x Your Success Rate</Text>
                                <Text style={styles.notificationPromptSubtitle}>
                                    Our data shows that users who enable reminders are 3x more likely to stay consistent and hit their goals. Get gentle nudges that help you build lasting habits.
                                </Text>
                                <View style={styles.notificationPromptStats}>
                                    <Ionicons name="trending-up" size={14} color="#22C55E" />
                                    <Text style={styles.notificationPromptStatsText}>Join 85% of successful users who keep reminders on</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.notificationPromptPrimaryButton}
                                    onPress={handleNotificationPrePromptContinue}
                                    disabled={isRequestingNotificationPermission}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.notificationPromptPrimaryButtonText}>
                                        {isRequestingNotificationPermission ? 'Opening...' : 'Turn on reminders'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.notificationPromptSecondaryButton}
                                    onPress={handleNotificationPrePromptLater}
                                    disabled={isRequestingNotificationPermission}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.notificationPromptSecondaryButtonText}>Maybe later</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>


                    {/* Panic Modal */}
                    <PanicModal
                        visible={showPanicModal}
                        onClose={() => setShowPanicModal(false)}
                        reasons={reasons}
                        moneySaved={moneySaved}
                        sugarAvoided={sugarAvoided.toString()}
                        onNavigateToReasons={() => navigation.navigate('Reasons')}
                        onNavigateToBreathing={() => navigation.navigate('BreathingExercise')}
                    />

                    {/* Enhanced Check-in Modal */}
                    <CheckInModal
                        visible={showCheckInModal}
                        onClose={() => {
                            setShowCheckInModal(false);
                            setCheckInResult(null);
                        }}
                        onCheckIn={handleCheckInSubmit}
                        planType="cold_turkey"
                        startDate={startDate}
                    />

                    {/* Plan Details Modal */}
                    <PlanDetailsModal
                        visible={showPlanDetails}
                        planType={planType || 'cold_turkey'}
                        onClose={() => setShowPlanDetails(false)}
                    />

                    {/* Check-in Status Modal (when already checked in) */}
                    <CheckInStatusModal
                        visible={showCheckInStatusModal}
                        onClose={() => setShowCheckInStatusModal(false)}
                        todayCheckIn={todayCheckIn}
                        onAddJournal={() => navigation.navigate('Track', { tab: 'journal' })}
                        onResetCheckIn={handleResetCheckIn}
                    />

                    {/* Edit Savings Goal Modal */}
                    <EditSavingsModal
                        visible={showEditSavingsModal}
                        onClose={() => setShowEditSavingsModal(false)}
                        currentGoal={editSavingsGoal}
                        onSave={async (newGoal: string) => {
                            await updateOnboardingData({ savingsGoal: newGoal });
                            setShowEditSavingsModal(false);
                        }}
                    />



                    {/* Pledge Modal - Interactive Hold-Down */}
                    {/* Pledge Modal - Interactive Hold-Down */}
                    <PledgeModal
                        visible={showPledgeModal}
                        onClose={() => setShowPledgeModal(false)}
                        onPledgeComplete={async () => {
                            setHasPledgedToday(true);
                            // Trigger layout animation for the button change
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

                            // Persist pledge date to AsyncStorage so it survives app close/logout
                            const todayStr = new Date().toISOString().split('T')[0];
                            await AsyncStorage.setItem('pledge_date', todayStr);

                            // Sync pledgedToday to Firebase for UserProfilePopup and ProfileScreen
                            if (isAuthenticated && user?.id) {
                                try {
                                    await userService.syncUserStats(user.id, {
                                        pledgedToday: true,
                                        updatedAt: new Date(),
                                    });
                                } catch (e) {
                                    console.warn('Failed to sync pledge status:', e);
                                }
                            }
                        }}
                    />



                    {/* Journal Entry Modal */}
                    <JournalEntryModal
                        visible={showJournalModal}
                        onClose={() => setShowJournalModal(false)}
                        onSave={async (entry) => {
                            // Save wellness data if provided
                            if (entry.mood !== undefined && entry.energy !== undefined &&
                                entry.focus !== undefined && entry.sleep !== undefined) {
                                const todayStr = new Date().toISOString().split('T')[0];
                                const stored = await AsyncStorage.getItem('wellness_logs');
                                const logs = stored ? JSON.parse(stored) : [];

                                // Remove existing entry for today if any
                                const filteredLogs = logs.filter((log: any) => log.date !== todayStr);

                                // Add new entry
                                filteredLogs.push({
                                    date: todayStr,
                                    mood: entry.mood,
                                    energy: entry.energy,
                                    focus: entry.focus,
                                    sleepHours: entry.sleep,
                                });

                                await AsyncStorage.setItem('wellness_logs', JSON.stringify(filteredLogs));
                            }

                            // Only save journal entry if there are actual notes
                            if (entry.notes && entry.notes.trim().length > 0) {
                                // Convert mood number to mood string
                                let moodString: 'great' | 'good' | 'okay' | 'struggling' | 'difficult' = 'okay';
                                if (entry.mood) {
                                    if (entry.mood >= 5) moodString = 'great';
                                    else if (entry.mood >= 4) moodString = 'good';
                                    else if (entry.mood >= 3) moodString = 'okay';
                                    else if (entry.mood >= 2) moodString = 'struggling';
                                    else moodString = 'difficult';
                                }

                                await addJournalEntry(new Date(), {
                                    mood: moodString,
                                    notes: entry.notes.trim(),
                                    whatTriggered: entry.whatTriggered,
                                });
                            }

                            setShowJournalModal(false);
                        }}
                    />

                    {/* Quick Track Modal */}
                    <QuickTrackModal
                        visible={showTrackModal}
                        onClose={() => setShowTrackModal(false)}
                        onTrackFood={() => setShowFoodScannerModal(true)}
                        onTrackWellness={() => setShowWellnessModal(true)}
                        scannedItemsCount={scannedItems.length}
                        hasWellnessToday={hasWellnessToday}
                    />

                    {/* Food Scanner Modal */}
                    <FoodScannerModal
                        visible={showFoodScannerModal}
                        onClose={() => setShowFoodScannerModal(false)}
                        onScanComplete={() => {
                            setShowFoodScannerModal(false);
                            // Refresh food logged status
                            getScannedItems().then(async (items) => {
                                const today = new Date().toISOString().split('T')[0];
                                const hasLoggedToday = items.some(item =>
                                    item.timestamp.split('T')[0] === today
                                );
                                setHasFoodLoggedToday(hasLoggedToday);

                                // Check if this was the user's first scan ever
                                try {
                                    const showPrompt = await shouldShowFirstScanPrompt(items.length);
                                    if (showPrompt) {
                                        setTimeout(() => {
                                            setReviewPromptVariant('first_scan');
                                            setShowReviewPrompt(true);
                                            markFirstScanPromptShown();
                                        }, 800);

                                        // Schedule celebration notification for first scan
                                        try {
                                            const { notificationService } = await import('../services/notificationService');
                                            await notificationService.scheduleFirstScanCelebration();
                                            console.log('✅ Scheduled first scan celebration notification');
                                        } catch (notifError) {
                                            console.warn('Could not schedule first scan notification:', notifError);
                                        }
                                    }
                                } catch (e) {
                                    console.warn('Error checking first scan review prompt:', e);
                                }
                            });
                            // Refresh streak calculation based on new food logs
                            refreshStreakFromFoodLogs();
                        }}
                        onShowPaywall={() => {
                            setShowFoodScannerModal(false);
                            navigation.getParent()?.navigate('Main', {
                                screen: 'Profile',
                                params: { showPaywall: true }
                            });
                        }}
                    />

                    {/* Wellness Modal - Full-screen shared component */}
                    <WellnessModal
                        visible={showWellnessModal}
                        onClose={() => setShowWellnessModal(false)}
                        onSave={handleWellnessSave}
                        selectedDate={new Date().toISOString().split('T')[0]}
                        existingData={todayWellnessData}
                    />

                    {/* Edit Goals/Reasons Modal */}
                    <EditGoalsModal
                        visible={showEditReasonsModal}
                        currentGoals={reasons}
                        onClose={() => setShowEditReasonsModal(false)}
                        onSave={async (newGoals) => {
                            await updateOnboardingData({ goals: newGoals });
                            setShowEditReasonsModal(false);
                        }}
                    />

                    {/* Streak Info Modal */}
                    <StreakInfoModal
                        visible={showStreakInfoModal}
                        onClose={() => setShowStreakInfoModal(false)}
                    />

                    {/* Review Prompt Modal */}
                    <ReviewPromptModal
                        visible={showReviewPrompt}
                        onClose={() => setShowReviewPrompt(false)}
                        variant={reviewPromptVariant}
                    />

                    {/* Cancellation Offer Screen - Shown when subscription is cancelled */}
                    <CancellationOfferScreen
                        visible={showCancellationOffer}
                        onClose={dismissCancellationOffer}
                        onAcceptYearly={async (step: 'offer1' | 'offer2' | 'free') => {
                            try {
                                let offerPackage: any = null;

                                if (step === 'offer1') {
                                    offerPackage = await findPackageByIdentifier('annual_offer1');
                                } else if (step === 'offer2') {
                                    offerPackage = await findPackageByIdentifier('annual_offer2');
                                }

                                // Fallback to regular annual if offer package not found
                                if (!offerPackage && currentOffering?.annual) {
                                    offerPackage = currentOffering.annual;
                                }

                                if (offerPackage) {
                                    await purchasePackage(offerPackage);
                                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                    dismissCancellationOffer();
                                } else {
                                    Alert.alert('Error', 'Yearly offer not available');
                                }
                            } catch (error: any) {
                                if (error.message !== 'Purchase cancelled') {
                                    Alert.alert('Error', error.message || 'Purchase failed');
                                }
                            }
                        }}
                        onAcceptLifetime={async (step: 'offer1' | 'offer2' | 'free') => {
                            try {
                                let offerPackage: any = null;

                                if (step === 'offer1') {
                                    offerPackage = await findPackageByIdentifier('lifetime_offer1');
                                } else if (step === 'offer2') {
                                    offerPackage = await findPackageByIdentifier('lifetime_offer2');
                                }

                                // Fallback to regular lifetime if offer packages not found
                                if (!offerPackage && currentOffering?.lifetime) {
                                    offerPackage = currentOffering.lifetime;
                                }

                                if (offerPackage) {
                                    await purchasePackage(offerPackage);
                                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                    dismissCancellationOffer();
                                } else {
                                    Alert.alert('Not Available', 'Lifetime package not configured in RevenueCat.');
                                }
                            } catch (error: any) {
                                if (error.message !== 'Purchase cancelled') {
                                    Alert.alert('Error', error.message || 'Purchase failed');
                                }
                            }
                        }}
                        onContinueFree={dismissCancellationOffer}
                    />
                </SafeAreaView>
            </LooviBackground >
        </SwipeableTabView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing.lg,
        paddingBottom: spacing['3xl'],
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '600',
        color: looviColors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    greeting: {
        fontSize: 24,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    topCheckInWrapper: {
        marginBottom: spacing.md,
    },
    topCheckInCard: {
        borderWidth: 2,
        borderColor: looviColors.accent.primary,
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
    },
    timerCard: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    floatingTimer: {
        marginTop: -spacing.xs,
    },
    timerText: {
        fontFamily: typography.fonts.heading.bold,
        fontSize: 18,
        color: looviColors.accent.primary,
        letterSpacing: 0.5,
        textShadowColor: 'rgba(217, 123, 102, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    timerSection: {
        alignItems: 'center',
        paddingVertical: spacing.lg,
        marginBottom: spacing.md,
    },
    streakBadge: {
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 16,
        marginBottom: spacing.xs,
        alignSelf: 'center',
    },
    animationWrapper: {
        marginTop: -spacing.sm,
        marginBottom: 0,
    },
    streakText: {
        fontFamily: typography.fonts.body.semibold,
        fontSize: 12,
        color: '#D97706',
    },
    streakRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    separatorLine: {
        width: '80%',
        height: 1,
        backgroundColor: 'rgba(217, 123, 102, 0.3)',
        marginTop: spacing.lg,
    },
    // Action Row Styles
    // Daily Flow Container
    dailyFlowContainer: {
        position: 'relative',
        marginBottom: spacing.lg,
        marginTop: spacing.lg,
        marginHorizontal: -spacing.screen.horizontal, // Break out of parent padding for full-width carousel
    },
    flowLineContainer: {
        position: 'absolute',
        top: 30, // Align with center of buttons (60px button / 2)
        left: '20%',
        right: '20%',
        height: 2,
        zIndex: 0,
    },
    flowLine: {
        position: 'absolute',
        top: 0.5,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(217, 123, 102, 0.2)',
    },
    flowDot: {
        position: 'absolute',
        top: -1.5,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(217, 123, 102, 0.4)',
    },
    flowButtonWrapper: {
        flex: 1,
        alignItems: 'center',
        zIndex: 2,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: spacing.sm,
        position: 'relative',
        zIndex: 1,
    },
    stepNumberBadge: {
        position: 'absolute',
        top: -8,
        left: '50%',
        marginLeft: -12,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: looviColors.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    stepNumber: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    journeyConnectorContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 45,
    },
    journeyConnector: {
        width: 25,
        height: 3,
        backgroundColor: 'rgba(217, 123, 102, 0.2)',
        borderRadius: 2,
    },
    journeyConnectorActive: {
        backgroundColor: looviColors.accent.success,
    },
    actionButton: {
        flex: 1,
    },
    actionCard: {
        minHeight: 70,
    },
    checkInCardDone: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderWidth: 2,
        borderColor: looviColors.accent.success,
    },
    actionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    actionEmoji: {
        fontSize: 24,
    },
    actionTextContainer: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    actionSubtitle: {
        fontSize: 11,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
    },
    statEmoji: {
        fontSize: 24,
        marginBottom: spacing.xs,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        marginTop: 2,
    },
    goalCard: {
        marginBottom: spacing.lg,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    goalLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    goalEmoji: {
        fontSize: 20,
    },
    goalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: looviColors.text.primary,
        marginBottom: spacing.md,
    },
    goalProgress: {
        gap: spacing.xs,
    },
    goalProgressBar: {
        height: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    goalProgressFill: {
        height: '100%',
        backgroundColor: looviColors.accent.success,
        borderRadius: 4,
    },
    goalProgressText: {
        fontSize: 12,
        fontWeight: '500',
        color: looviColors.text.tertiary,
    },
    panicCard: {
        marginBottom: spacing.lg,
    },
    panicContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    panicEmoji: {
        fontSize: 32,
        marginRight: spacing.md,
    },
    panicTextContainer: {
        flex: 1,
    },
    panicTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    panicSubtitle: {
        fontSize: 13,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        marginTop: 2,
    },
    reasonsSection: {
        marginBottom: spacing.xl,
    },
    reasonsSectionTitle: {
        fontFamily: typography.fonts.heading.semibold,
        fontSize: 18,
        color: looviColors.text.primary,
        marginBottom: spacing.md,
    },
    reasonsContainer: {
        gap: spacing.sm,
    },
    reasonCard: {},
    reasonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reasonNumberContainer: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: looviColors.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    reasonNumber: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    reasonText: {
        fontFamily: typography.fonts.body.medium,
        fontSize: 14,
        color: looviColors.text.secondary,
        flex: 1,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.screen.horizontal,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius['2xl'],
        padding: spacing.xl,
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    modalText: {
        fontSize: 15,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.lg,
    },
    modalReasons: {
        marginBottom: spacing.md,
    },
    modalReason: {
        fontSize: 14,
        fontWeight: '400',
        color: looviColors.text.secondary,
        marginBottom: spacing.xs,
    },
    modalStats: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
    },
    modalStatText: {
        fontSize: 14,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    modalHighlight: {
        fontWeight: '700',
        color: looviColors.accent.success,
    },
    modalTip: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.accent.primary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    modalButton: {
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // Check-in Button Card Styles
    checkInCard: {
        marginTop: spacing.md,
        borderColor: looviColors.accent.success,
        borderWidth: 1,
    },
    checkInContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkInEmoji: {
        fontSize: 28,
        marginRight: spacing.md,
    },
    checkInTextContainer: {
        flex: 1,
    },
    checkInTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    checkInSubtitle: {
        fontSize: 13,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        marginTop: 2,
    },
    checkInBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: looviColors.accent.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkInBadgeDone: {
        backgroundColor: looviColors.accent.primary,
    },
    checkInBadgeText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // Check-in Modal Styles
    checkInButtons: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    checkInSuccessButton: {
        flex: 1,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: looviColors.accent.success,
    },
    checkInResetButton: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    checkInButtonEmoji: {
        fontSize: 32,
        marginBottom: spacing.sm,
    },
    checkInButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: looviColors.accent.success,
    },
    checkInButtonTextSecondary: {
        fontSize: 15,
        fontWeight: '500',
        color: looviColors.text.secondary,
    },
    checkInCancelButton: {
        padding: spacing.md,
    },
    checkInCancelText: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.text.tertiary,
    },
    successEmoji: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    streakMessage: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.accent.success,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    resetMessage: {
        fontSize: 15,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: spacing.xl,
    },
    // Plan Guidance Card Styles
    planGuidanceCard: {
        marginBottom: spacing.lg,
    },
    planGuidanceGradual: {
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1,
    },
    planGuidanceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    planGuidanceEmoji: {
        fontSize: 28,
        marginRight: spacing.md,
    },
    planGuidanceInfo: {
        flex: 1,
    },
    planGuidanceTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    planGuidanceWeek: {
        fontSize: 13,
        fontWeight: '500',
        color: looviColors.accent.primary,
        marginTop: 2,
    },
    gramLimit: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    gramLimitValue: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.accent.primary,
    },
    gramLimitLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: looviColors.text.tertiary,
    },
    planGuidanceTip: {
        fontSize: 13,
        fontWeight: '400',
        color: looviColors.text.secondary,
        lineHeight: 18,
    },
    myPlanButton: {
        marginTop: spacing.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    myPlanButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: looviColors.accent.primary,
    },
    primaryButton: {
        backgroundColor: looviColors.accent.primary,
        marginBottom: spacing.md,
    },
    secondaryButton: {
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        marginBottom: spacing.md,
    },
    successButton: {
        backgroundColor: looviColors.accent.success,
    },
    // Check-in Status Modal Styles
    checkInStatusCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: spacing.xl,
        marginHorizontal: spacing.lg,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    checkInStatusEmoji: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    checkInStatusTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    checkInStatusInfo: {
        backgroundColor: 'rgba(127, 176, 105, 0.1)',
        borderRadius: 16,
        padding: spacing.md,
        width: '100%',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    checkInStatusLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        marginBottom: spacing.xs,
    },
    checkInStatusValue: {
        fontSize: 18,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    checkInStatusGrams: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.text.secondary,
        marginTop: spacing.xs,
    },
    checkInStatusHint: {
        fontSize: 13,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        textAlign: 'center',
        marginBottom: spacing.lg,
        fontStyle: 'italic',
    },
    checkInStatusButtons: {
        width: '100%',
        gap: spacing.sm,
    },
    checkInStatusButton: {
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
    },
    checkInStatusButtonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: looviColors.text.muted,
    },
    checkInStatusButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    checkInStatusButtonTextSecondary: {
        color: looviColors.text.secondary,
    },
    checkInStatusCloseButton: {
        marginTop: spacing.md,
        paddingVertical: spacing.sm,
    },
    checkInStatusCloseText: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.text.muted,
    },
    // Edit functionality styles
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    editIcon: {
        fontSize: 14,
        opacity: 0.6,
    },
    goalHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    // Edit Modal Styles
    editModalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: spacing.xl,
        marginHorizontal: spacing.lg,
        maxHeight: '80%',
    },
    editModalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    editInput: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
        padding: spacing.md,
        fontSize: 16,
        color: looviColors.text.primary,
        marginBottom: spacing.md,
    },
    reasonEditRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
        gap: spacing.sm,
    },
    reasonEditInput: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
        padding: spacing.md,
        fontSize: 15,
        color: looviColors.text.primary,
    },
    removeReasonButton: {
        padding: spacing.sm,
    },
    removeReasonText: {
        fontSize: 18,
        color: looviColors.accent.error,
    },
    addReasonButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        marginBottom: spacing.lg,
    },
    addReasonText: {
        fontSize: 15,
        fontWeight: '500',
        color: looviColors.accent.primary,
    },
    editModalButtons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    editCancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    editCancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: looviColors.text.secondary,
    },
    editSaveButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        backgroundColor: looviColors.accent.primary,
    },
    editSaveText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // Circular Action Buttons (Pledge, Track, Journal) - SOS-like styling
    circleButtonContainer: {
        alignItems: 'center',
        marginHorizontal: spacing.md, // Closer together
    },
    circleButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
        // White ring/border like SOS button
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        // Floating glow effect
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    circleButtonLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: looviColors.text.primary,
        textAlign: 'center',
    },
    flowTimeLabel: {
        fontSize: 9,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        textAlign: 'center',
        marginTop: 2,
        opacity: 0.7,
    },
    // Keep legacy styles for compatibility
    tripleActionButton: {
        flex: 1,
    },
    tripleActionCard: {
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    tripleActionEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    tripleActionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    // Pledge Modal styles
    pledgeShroud: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(217, 123, 102, 0.3)',
    },
    pledgeCloseButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    pledgeModalContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    morningBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 20,
        marginBottom: spacing.xl,
        gap: spacing.xs,
    },
    morningBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    pledgeEmojiContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    pledgeInstruction: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: spacing.xl,
    },
    pledgeHoldButton: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pledgeProgressRing: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 4,
        borderColor: '#7FB069',
        backgroundColor: 'rgba(127, 176, 105, 0.2)',
    },
    pledgeButtonInner: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: looviColors.coralOrange,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: looviColors.coralOrange,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    pledgeCelebration: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pledgeCompletedText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        marginTop: spacing.lg,
    },
    pledgeCompletedSubtext: {
        fontSize: 16,
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        marginTop: spacing.sm,
    },
    pledgeButton: {
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 16,
        paddingHorizontal: spacing.xl,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
        marginBottom: spacing.md,
        shadowColor: looviColors.coralOrange,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    pledgeButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    pledgeSecondaryButton: {
        paddingVertical: spacing.sm,
    },
    pledgeSecondaryText: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.accent.primary,
    },
    // Track Modal Styles
    trackModalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius['2xl'],
        padding: spacing.xl,
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    trackModalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    trackModalSubtitle: {
        fontSize: 14,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    trackOptionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        borderRadius: borderRadius.xl,
        marginBottom: spacing.md,
    },
    trackOptionText: {
        marginLeft: spacing.md,
        flex: 1,
    },
    trackOptionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    trackOptionSubtitle: {
        fontSize: 13,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        marginTop: 2,
    },
    trackOptionIconContainer: {
        position: 'relative',
    },
    trackOptionBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 16,
        height: 16,
        paddingHorizontal: 4,
        borderRadius: 8,
        backgroundColor: looviColors.accent.success,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    trackOptionBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // CTA Component Styles
    ctaContainerGlass: {
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        overflow: 'hidden',
    },
    ctaContent: {
        flexDirection: 'row',
        alignItems: 'center',
        // Padding handled by GlassCard
    },
    ctaIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${looviColors.accent.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    ctaTextContainer: {
        flex: 1,
    },
    ctaTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: 2,
    },
    ctaSubtitle: {
        fontSize: 12,
        fontWeight: '400',
        color: looviColors.text.tertiary,
    },
    // Wellness Empty State Styles
    wellnessEmptyCard: {
        marginVertical: spacing.md,
        alignItems: 'center',
    },
    wellnessEmptyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    wellnessEmptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    wellnessEmptyText: {
        fontSize: 13,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    wellnessEmptyButton: {
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 10,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.lg,
    },
    wellnessEmptyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // Floating SOS Button
    sosFloating: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        zIndex: 100,
    },
    // Carousel Layout Styles
    carouselContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 140, // Fixed height to accommodate largest button + labels
    },
    carouselItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    carouselItemActive: {
        width: 120, // Give it space
        zIndex: 10,
        transform: [{ scale: 1.0 }],
    },
    carouselItemInactive: {
        width: 60,
        opacity: 0.6,
        transform: [{ scale: 0.8 }],
    },
    smallCircleButtonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    smallCircleButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    // Sequential Action Button Styles
    largeCircleButtonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    largeCircleButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    largeCircleButtonLabel: {
        fontFamily: typography.fonts.heading.bold,
        fontSize: 14,
        color: looviColors.text.primary,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    largeFlowTimeLabel: {
        fontFamily: typography.fonts.body.medium,
        fontSize: 11,
        color: looviColors.text.tertiary,
        textAlign: 'center',
        marginTop: 2,
    },
    // Streak Status Banner Styles
    streakStatusBanner: {
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    streakStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    streakStatusWarning: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    streakStatusDanger: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    streakStatusSuccess: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    streakStatusLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    streakStatusEmoji: {
        fontSize: 24,
    },
    streakStatusTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    streakStatusSubtitle: {
        fontSize: 12,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        marginTop: 2,
    },
    // Streak Recovery Banner Styles
    streakRecoveryBanner: {
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
    },
    streakRecoveryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    streakRecoveryIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(232, 168, 124, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    streakRecoveryText: {
        flex: 1,
    },
    streakRecoveryTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    streakRecoverySubtitle: {
        fontSize: 12,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        marginTop: 2,
    },
    notificationPromptOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.52)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.screen.horizontal,
    },
    notificationPromptCard: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius['2xl'],
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.16,
        shadowRadius: 20,
        elevation: 10,
    },
    notificationPromptIconWrap: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: looviColors.coralOrange,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    notificationPromptTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    notificationPromptSubtitle: {
        fontSize: 14,
        lineHeight: 20,
        color: looviColors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    notificationPromptStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        marginBottom: spacing.lg,
    },
    notificationPromptStatsText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#166534',
    },
    notificationPromptPrimaryButton: {
        width: '100%',
        backgroundColor: looviColors.accent.primary,
        borderRadius: borderRadius.lg,
        paddingVertical: 13,
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    notificationPromptPrimaryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    notificationPromptSecondaryButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    notificationPromptSecondaryButtonText: {
        color: looviColors.text.tertiary,
        fontSize: 14,
        fontWeight: '500',
    },
});
