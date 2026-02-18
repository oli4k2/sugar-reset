import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
    Animated,
    PanResponder,
    TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserData } from '../context/UserDataContext';
import { getCurrentWeek, getPlanDetails, PlanType } from '../utils/planUtils';
import { looviColors } from './LooviBackground';
import { spacing } from '../theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;
const TRANSLATE_PEEK = 0;
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.4;

interface StreakInfoModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function StreakInfoModal({ visible, onClose }: StreakInfoModalProps) {
    const { onboardingData, streakData, streakResult } = useUserData();
    const [dailyLimit, setDailyLimit] = useState<number>(25); // Default to 25g

    const planType = (onboardingData?.plan || 'cold_turkey') as PlanType;
    const startDate = onboardingData?.startDate ? new Date(onboardingData.startDate) : new Date();
    const currentWeek = getCurrentWeek(startDate);
    const planDetails = getPlanDetails(planType);

    // Use todayStatus from streakResult instead of useStreak hook
    const todayStatus = streakResult?.todayStatus || null;

    // Get actual daily limit (not the 999 placeholder)
    useEffect(() => {
        const loadDailyLimit = async () => {
            try {
                const { getDailyAddedSugarLimit } = await import('../services/streakService');
                const limit = await getDailyAddedSugarLimit();
                setDailyLimit(limit);
            } catch (error) {
                console.warn('Could not load daily limit:', error);
            }
        };
        loadDailyLimit();
    }, []);

    // Calculate plan progress (with safety checks)
    const now = new Date();
    const daysSinceStart = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const planDuration = 90; // All plans are now 90 days
    const planProgressPercent = Math.min(100, Math.max(0, Math.round((daysSinceStart / planDuration) * 100)));
    const daysRemaining = Math.max(0, planDuration - daysSinceStart);

    const getStatusColor = () => {
        if (!todayStatus) return looviColors.text.tertiary;
        if (todayStatus.isStreakDay) return looviColors.accent.success;
        if (!todayStatus.hasLogs) return looviColors.accent.warning;
        return looviColors.accent.error;
    };

    const getStatusText = () => {
        if (!todayStatus) return 'Loading...';
        if (todayStatus.isStreakDay) return 'Sugar-free today!';
        if (!todayStatus.hasLogs) return 'Log your food to continue';
        return 'Over sugar limit today';
    };

    const getStatusIcon = () => {
        if (!todayStatus) return 'time-outline';
        if (todayStatus.isStreakDay) return 'checkmark-circle';
        if (!todayStatus.hasLogs) return 'hourglass-outline';
        return 'close-circle';
    };

    // Calculate current phase (same as PlanProgressBar)
    const progressPercent = Math.min(100, Math.max(0, Math.round((daysSinceStart / planDuration) * 100)));
    const PHASES = [
        { minPercent: 0, maxPercent: 25, name: 'Phase 1: Detox', feeling: 'experiencing cravings and adjustment', endFeeling: 'cravings will start to decrease' },
        { minPercent: 25, maxPercent: 50, name: 'Phase 2: Adaptation', feeling: 'adapting to lower sugar intake', endFeeling: 'energy levels will stabilize' },
        { minPercent: 50, maxPercent: 75, name: 'Phase 3: Momentum', feeling: 'building healthy habits', endFeeling: 'taste preferences will change' },
        { minPercent: 75, maxPercent: 100, name: 'Phase 4: Mastery', feeling: 'mastering your sugar-free lifestyle', endFeeling: 'feel in complete control' },
    ];
    const currentPhase = PHASES.find(
        phase => progressPercent >= phase.minPercent && progressPercent < phase.maxPercent
    ) || PHASES[PHASES.length - 1];

    // ── Bottom-sheet gesture ──────────────────────────────────────────────────
    const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

    const dismiss = useCallback(() => {
        Animated.timing(translateY, {
            toValue: SHEET_HEIGHT,
            duration: 220,
            useNativeDriver: true,
        }).start(() => onClose());
    }, [translateY, onClose]);

    useEffect(() => {
        if (visible) {
            translateY.setValue(SHEET_HEIGHT);
            Animated.spring(translateY, {
                toValue: TRANSLATE_PEEK,
                useNativeDriver: true,
                bounciness: 3,
                speed: 14,
            }).start();
        }
    }, [visible, translateY]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 8,
            onPanResponderGrant: () => {
                translateY.stopAnimation();
                translateY.setOffset(0); // For consistency with simple translateY approach
            },
            onPanResponderMove: (_, gs) => {
                // Only allow downward drag
                translateY.setValue(Math.max(0, gs.dy));
            },
            onPanResponderRelease: (_, gs) => {
                translateY.flattenOffset();
                if (gs.dy > DISMISS_THRESHOLD || gs.vy > 1.0) {
                    dismiss();
                } else {
                    Animated.spring(translateY, {
                        toValue: TRANSLATE_PEEK,
                        useNativeDriver: true,
                        bounciness: 4,
                        speed: 14,
                    }).start();
                }
            },
        })
    ).current;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={dismiss}
        >
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={dismiss}>
                    <View style={StyleSheet.absoluteFill} />
                </TouchableWithoutFeedback>

                <Animated.View
                    style={[
                        styles.sheet,
                        { transform: [{ translateY }] }
                    ]}
                >
                    {/* Drag Handle */}
                    <View {...panResponder.panHandlers} style={styles.handleContainer}>
                        <View style={styles.handle} />
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerIcon}>
                            <Ionicons name="flame" size={24} color={looviColors.coralOrange} />
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.title}>Your Sugar-Free Journey</Text>
                            <Text style={styles.subtitle}>Track your progress & goals</Text>
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={dismiss}>
                            <Ionicons name="close" size={20} color={looviColors.text.tertiary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Today's Status */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Today's Status</Text>
                            <View style={[styles.statusCard, { borderLeftColor: getStatusColor() }]}>
                                <View style={styles.statusRow}>
                                    <Ionicons name={getStatusIcon()} size={20} color={getStatusColor()} style={styles.statusIcon} />
                                    <Text style={styles.statusText}>{getStatusText()}</Text>
                                </View>
                                {todayStatus && (
                                    <Text style={styles.detailText}>
                                        Added sugar: {todayStatus.totalAddedSugar}g / {todayStatus.dailyTarget === 999 ? dailyLimit : todayStatus.dailyTarget}g
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Stats Grid - Compact */}
                        <View style={styles.statsGrid}>
                            <View style={styles.statCard}>
                                <Text style={styles.statNumber}>{streakData?.currentStreak || 0}</Text>
                                <Text style={styles.statLabel}>Current Streak</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statNumber}>{streakData?.longestStreak || 0}</Text>
                                <Text style={styles.statLabel}>Longest Streak</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statNumber}>{streakData?.totalDaysSugarFree || 0}</Text>
                                <Text style={styles.statLabel}>Total Days</Text>
                            </View>
                        </View>

                        {/* Plan Progress */}
                        <View style={[styles.section, styles.planProgressSection]}>
                            <Text style={styles.sectionTitle}>Plan Progress</Text>
                            <View style={styles.planCard}>
                                <View style={styles.planHeader}>
                                    <Text style={styles.planPhaseTitle}>{currentPhase.name}</Text>
                                    <Text style={styles.planProgressPercent}>{planProgressPercent}%</Text>
                                </View>
                                <View style={styles.progressBarContainer}>
                                    <View style={[styles.progressBar, { width: `${planProgressPercent}%` }]} />
                                </View>
                                <Text style={styles.planDetail}>
                                    Week {currentWeek} of 13{daysRemaining > 0 && ` • ${daysRemaining} days remaining`}
                                </Text>
                                <Text style={styles.phaseDescription}>
                                    {currentPhase.feeling.charAt(0).toUpperCase() + currentPhase.feeling.slice(1)} → {currentPhase.endFeeling}
                                </Text>
                            </View>
                        </View>

                        {/* Streak Algorithm */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>How Your Streak Works</Text>
                            <View style={styles.algorithmSteps}>
                                <View style={styles.step}>
                                    <Text style={styles.stepNumber}>1</Text>
                                    <Text style={styles.stepText}>Log your food daily</Text>
                                </View>
                                <View style={styles.step}>
                                    <Text style={styles.stepNumber}>2</Text>
                                    <Text style={styles.stepText}>Stay under your added sugar limit</Text>
                                </View>
                                <View style={styles.step}>
                                    <Text style={styles.stepNumber}>3</Text>
                                    <Text style={styles.stepText}>Keep the streak alive!</Text>
                                </View>
                            </View>

                            <Text style={styles.infoText}>
                                • Only <Text style={styles.bold}>added sugar</Text> counts (not natural sugars from fruit/dairy)
                            </Text>
                            <Text style={styles.infoText}>
                                • You have <Text style={styles.bold}>2 days grace period</Text> to log missed days
                            </Text>
                            <Text style={styles.infoText}>
                                • Limits based on WHO recommendations: 25g (women) / 36g (men)
                            </Text>
                        </View>

                        {/* Tips */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Pro Tips</Text>
                            <View style={styles.tips}>
                                <Text style={styles.tip}>💡 Log food before eating to stay aware</Text>
                                <Text style={styles.tip}>🎯 Focus on added sugars, not natural ones</Text>
                                <Text style={styles.tip}>📱 Use the 2-day grace period wisely</Text>
                            </View>
                        </View>

                        {/* Bottom Spacer for ScrollView */}
                        <View style={{ height: spacing['2xl'] }} />
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: SHEET_HEIGHT,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    handleContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 14,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },
    headerIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(232, 168, 124, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    headerTextContainer: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    subtitle: {
        fontSize: 14,
        color: looviColors.text.tertiary,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
    },
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.primary,
        marginBottom: spacing.sm,
    },
    statusCard: {
        backgroundColor: '#F9FAFB',
        padding: spacing.md,
        borderRadius: 16,
        borderLeftWidth: 4,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    statusIcon: {
        marginRight: spacing.xs,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    detailText: {
        fontSize: 14,
        color: looviColors.text.secondary,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: spacing.md,
        borderRadius: 16,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 22,
        fontWeight: '700',
        color: looviColors.coralOrange,
    },
    statLabel: {
        fontSize: 11,
        color: looviColors.text.secondary,
        marginTop: 4,
        fontWeight: '500',
    },
    planProgressSection: {
        marginTop: spacing.sm,
    },
    planCard: {
        backgroundColor: 'rgba(232, 168, 124, 0.08)',
        padding: spacing.md,
        borderRadius: 16,
        borderLeftWidth: 4,
        borderLeftColor: looviColors.coralOrange,
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    planPhaseTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: looviColors.text.primary,
        flex: 1,
    },
    planProgressPercent: {
        fontSize: 16,
        fontWeight: '700',
        color: looviColors.coralOrange,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.06)',
        borderRadius: 4,
        overflow: 'hidden',
        marginVertical: spacing.xs,
    },
    progressBar: {
        height: '100%',
        backgroundColor: looviColors.coralOrange,
        borderRadius: 4,
    },
    planDetail: {
        fontSize: 14,
        color: looviColors.text.secondary,
        marginTop: spacing.xs,
    },
    phaseDescription: {
        fontSize: 13,
        color: looviColors.text.tertiary,
        fontStyle: 'italic',
        marginTop: spacing.xs,
        lineHeight: 18,
    },
    algorithmSteps: {
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: looviColors.coralOrange,
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 24,
        fontSize: 12,
        fontWeight: '700',
        overflow: 'hidden',
    },
    stepText: {
        fontSize: 14,
        color: looviColors.text.primary,
        fontWeight: '500',
    },
    infoText: {
        fontSize: 14,
        color: looviColors.text.secondary,
        lineHeight: 20,
        marginTop: spacing.xs,
    },
    bold: {
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    tips: {
        gap: spacing.sm,
    },
    tip: {
        fontSize: 14,
        color: looviColors.text.secondary,
        lineHeight: 20,
    },
});
