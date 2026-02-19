/**
 * MascotTip Component
 * 
 * A friendly mascot that peeks from the left side of the screen
 * with dynamic, context-aware tips and suggestions.
 * Supports tap navigation between tips with pagination dots.
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { Feather, Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';

// Tip categories with navigation targets
export interface MascotTipData {
    id: string;
    icon: string; // Feather icon name
    iconColor?: string; // Optional custom color
    title: string;
    subtitle: string;
    action?: string; // Navigation target or action
    category: 'task' | 'social' | 'analytics' | 'motivation' | 'streak' | 'celebration';
    priority: number; // Higher = more important
    friendId?: string; // For cheering on specific friend
    isSuccess?: boolean; // For green styling on success messages
}

interface MascotTipProps {
    // User state for context-aware tips
    hasPledgedToday: boolean;
    hasFoodLoggedToday: boolean;
    hasWellnessToday: boolean;
    hasInnerCircleFriends: boolean;
    currentStreak: number;
    healthScore: number;
    // Optional: friend data for personalized suggestions
    friendsNeedingSupport?: { id: string; name: string; healthScore: number }[];
    // Navigation handler
    onTipPress: (action: string, friendId?: string) => void;
    // Optional: force show specific tip
    forceTip?: MascotTipData;
    // Community tip completion tracking
    hasCommunityTipDoneToday?: boolean;
    onCommunityTipDone?: () => void;
    // Circle check tracking
    hasCheckedCircleToday?: boolean;
}

// Encouraging messages for when all daily tasks are done - with green styling
const ALL_DONE_MESSAGES: MascotTipData[] = [
    {
        id: 'done_1',
        icon: 'star',
        iconColor: looviColors.accent.success,
        title: 'All done for today! 🌟',
        subtitle: 'You\'re taking amazing care of yourself. Keep it up!',
        action: 'analytics',
        category: 'celebration',
        priority: 100,
        isSuccess: true,
    },
    {
        id: 'done_2',
        icon: 'heart',
        iconColor: looviColors.accent.success,
        title: 'Amazing job today! 💪',
        subtitle: 'Your body thanks you for the love and care.',
        action: 'analytics',
        category: 'celebration',
        priority: 100,
        isSuccess: true,
    },
    {
        id: 'done_3',
        icon: 'award',
        iconColor: looviColors.accent.success,
        title: 'You crushed it! 🏆',
        subtitle: 'Every healthy choice builds a stronger you.',
        action: 'analytics',
        category: 'celebration',
        priority: 100,
        isSuccess: true,
    },
    {
        id: 'done_4',
        icon: 'sun',
        iconColor: looviColors.accent.success,
        title: 'What a great day! ☀️',
        subtitle: 'You\'re building habits that will change your life.',
        action: 'analytics',
        category: 'celebration',
        priority: 100,
        isSuccess: true,
    },
    {
        id: 'done_5',
        icon: 'zap',
        iconColor: looviColors.accent.success,
        title: 'Today was a WIN! ⚡',
        subtitle: 'You showed up for yourself. That\'s what matters.',
        action: 'analytics',
        category: 'celebration',
        priority: 100,
        isSuccess: true,
    },
    {
        id: 'done_6',
        icon: 'check-circle',
        iconColor: looviColors.accent.success,
        title: 'Mission accomplished! 🎉',
        subtitle: 'Rest well knowing you did your best today.',
        action: 'analytics',
        category: 'celebration',
        priority: 100,
        isSuccess: true,
    },
    {
        id: 'done_7',
        icon: 'thumbs-up',
        iconColor: '#22C55E',
        title: 'You\'re on fire! 🔥',
        subtitle: 'Your dedication is truly inspiring. Keep going!',
        action: 'analytics',
        category: 'celebration',
        priority: 100,
        isSuccess: true,
    },
];

// Get a consistent daily message based on date
const getDailyMessage = (): MascotTipData => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const messageIndex = dayOfYear % ALL_DONE_MESSAGES.length;
    return ALL_DONE_MESSAGES[messageIndex];
};

// Generate tips based on user state
const generateTips = (props: Omit<MascotTipProps, 'onTipPress' | 'forceTip'>): MascotTipData[] => {
    const tips: MascotTipData[] = [];

    // Task-based tips (highest priority when incomplete)
    if (!props.hasPledgedToday) {
        tips.push({
            id: 'pledge',
            icon: 'sun',
            iconColor: looviColors.coralOrange,
            title: 'Start your morning!',
            subtitle: 'Take a moment to set your intention for today',
            action: 'pledge',
            category: 'task',
            priority: 100,
        });
    }

    if (!props.hasFoodLoggedToday) {
        tips.push({
            id: 'track',
            icon: 'camera',
            iconColor: looviColors.accent.primary,
            title: 'Log your meals',
            subtitle: 'Track what you eat to build your streak',
            action: 'track',
            category: 'task',
            priority: 90,
        });
    }

    if (!props.hasWellnessToday) {
        // Check if it's past 18:00 (6 PM) to determine title
        const now = new Date();
        const currentHour = now.getHours();
        const isEvening = currentHour >= 18;
        
        tips.push({
            id: 'journal',
            icon: 'book',
            iconColor: looviColors.accent.success,
            title: isEvening ? 'Evening reflection' : 'Wellness reflection',
            subtitle: 'How was your day? Take a moment to journal',
            action: 'journal',
            category: 'task',
            priority: 80,
        });
    }

    // Inner Circle tips - HIGH priority if no friends
    if (!props.hasInnerCircleFriends && !props.hasCheckedCircleToday) {
        tips.push({
            id: 'find_friends',
            icon: 'users',
            iconColor: looviColors.accent.primary,
            title: 'Find accountability partners!',
            subtitle: "You're 65% more likely to succeed with friends",
            action: 'inner_circle',
            category: 'social',
            priority: 70,
        });
    }

    // Friends needing support - personalized suggestions
    if (props.friendsNeedingSupport && props.friendsNeedingSupport.length > 0) {
        const friend = props.friendsNeedingSupport[0];
        tips.push({
            id: `cheer_${friend.id}`,
            icon: 'heart',
            iconColor: '#E57373',
            title: `Send ${friend.name} some love!`,
            subtitle: 'A little encouragement goes a long way',
            action: 'cheer_friend',
            category: 'social',
            priority: 65,
            friendId: friend.id,
        });
    } else if (props.hasInnerCircleFriends && !props.hasCheckedCircleToday) {
        tips.push({
            id: 'cheer_friends',
            icon: 'smile',
            iconColor: looviColors.accent.primary,
            title: 'Check on your circle!',
            subtitle: 'See how your accountability partners are doing',
            action: 'inner_circle',
            category: 'social',
            priority: 50,
        });
    }

    // Analytics tips
    if (props.currentStreak >= 3) {
        tips.push({
            id: 'check_trends',
            icon: 'trending-up',
            iconColor: looviColors.accent.success,
            title: 'See your progress!',
            subtitle: 'Check out your wellness trends in Analytics',
            action: 'analytics',
            category: 'analytics',
            priority: 45,
        });
    }

    // Streak-based motivational tips
    if (props.currentStreak >= 7) {
        tips.push({
            id: 'streak_7',
            icon: 'zap',
            iconColor: '#FFB74D',
            title: `${props.currentStreak} days strong!`,
            subtitle: "You're on fire! Share your progress with friends",
            action: 'community',
            category: 'streak',
            priority: 40,
        });
    } else if (props.currentStreak >= 3) {
        tips.push({
            id: 'streak_3',
            icon: 'award',
            iconColor: looviColors.accent.primary,
            title: 'Building momentum!',
            subtitle: `${props.currentStreak} days - keep the energy going!`,
            action: 'community',
            category: 'streak',
            priority: 35,
        });
    }

    // Community tip - only show if main tasks are done AND not already pressed today
    const mainTasksDone = props.hasPledgedToday && props.hasFoodLoggedToday && props.hasWellnessToday;
    if (mainTasksDone && !props.hasCommunityTipDoneToday) {
        tips.push({
            id: 'community',
            icon: 'message-circle',
            iconColor: looviColors.accent.primary,
            title: 'Share your journey!',
            subtitle: 'Connect with others in the Community',
            action: 'community',
            category: 'social',
            priority: 30,
        });
    }

    // If no tips at all, show the daily encouraging message
    if (tips.length === 0) {
        return [getDailyMessage()];
    }

    // Sort by priority (highest first) and return
    return tips.sort((a, b) => b.priority - a.priority);
};

export const MascotTip: React.FC<MascotTipProps> = ({
    hasPledgedToday,
    hasFoodLoggedToday,
    hasWellnessToday,
    hasInnerCircleFriends,
    currentStreak,
    healthScore,
    friendsNeedingSupport,
    onTipPress,
    forceTip,
    hasCommunityTipDoneToday,
    onCommunityTipDone,
    hasCheckedCircleToday,
}) => {
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const bounceAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    // Generate tips based on current state - memoized
    const tips = useMemo(() => generateTips({
        hasPledgedToday,
        hasFoodLoggedToday,
        hasWellnessToday,
        hasInnerCircleFriends,
        currentStreak,
        healthScore,
        friendsNeedingSupport,
        hasCommunityTipDoneToday,
        hasCheckedCircleToday,
    }), [hasPledgedToday, hasFoodLoggedToday, hasWellnessToday, hasInnerCircleFriends, currentStreak, healthScore, friendsNeedingSupport, hasCommunityTipDoneToday, hasCheckedCircleToday]);

    // Reset index when tips change
    useEffect(() => {
        if (currentTipIndex >= tips.length) {
            setCurrentTipIndex(0);
        }
    }, [tips.length, currentTipIndex]);

    const currentTip = forceTip || tips[currentTipIndex] || tips[0];

    // Navigate to next tip with animation
    const goToNextTip = useCallback(() => {
        if (tips.length <= 1) return;

        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 120,
            useNativeDriver: true,
        }).start(() => {
            setCurrentTipIndex((prev) => (prev + 1) % tips.length);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 120,
                useNativeDriver: true,
            }).start();
        });
    }, [tips.length, fadeAnim]);

    // Navigate to previous tip with animation
    const goToPrevTip = useCallback(() => {
        if (tips.length <= 1) return;

        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 120,
            useNativeDriver: true,
        }).start(() => {
            setCurrentTipIndex((prev) => (prev - 1 + tips.length) % tips.length);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 120,
                useNativeDriver: true,
            }).start();
        });
    }, [tips.length, fadeAnim]);

    // Entrance animation
    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
        }).start();

        // Subtle bounce animation for mascot
        const bounce = Animated.loop(
            Animated.sequence([
                Animated.timing(bounceAnim, {
                    toValue: -4,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(bounceAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        );
        bounce.start();

        return () => bounce.stop();
    }, []);

    // Handle tap to navigate to action
    const handlePress = () => {
        if (currentTip.action) {
            // Mark community tip as done when pressed
            if (currentTip.id === 'community' && onCommunityTipDone) {
                onCommunityTipDone();
            }
            onTipPress(currentTip.action, currentTip.friendId);
        }
    };

    // Determine bubble styling
    const isSuccess = currentTip.isSuccess;

    const bubbleBackgroundColor = isSuccess
        ? 'transparent'
        : 'rgba(255, 255, 255, 0.7)';

    const bubbleBorderColor = isSuccess
        ? 'rgba(255, 255, 255, 0.3)'
        : 'rgba(255, 255, 255, 0.5)';

    return (
        <View style={styles.container}>
            {/* Mascot peeking from left */}
            <Animated.View
                style={[
                    styles.mascotContainer,
                    {
                        transform: [
                            { translateX: slideAnim },
                            { translateY: bounceAnim },
                        ],
                    },
                ]}
            >
                <Image
                    source={require('../public/mascot.png')}
                    style={styles.mascotImage}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* Speech bubble */}
            <Animated.View
                style={[
                    styles.bubbleContainer,
                    { transform: [{ translateX: slideAnim }] },
                ]}
            >
                <View style={[styles.bubbleArrow, { borderRightColor: bubbleBackgroundColor }]} />
                <TouchableOpacity
                    activeOpacity={isSuccess ? 1 : 0.9}
                    onPress={isSuccess ? undefined : handlePress}
                    disabled={!!isSuccess}
                    style={styles.bubbleTouchable}
                >
                    <View style={[
                        styles.bubble,
                        { backgroundColor: bubbleBackgroundColor, borderColor: bubbleBorderColor },
                        isSuccess && { shadowOpacity: 0, elevation: 0, overflow: 'hidden' }
                    ]}>
                        {isSuccess && (
                            <BlurView
                                intensity={20}
                                tint="light"
                                style={StyleSheet.absoluteFill}
                            />
                        )}
                        {/* Navigation arrows (left) */}
                        {tips.length > 1 && (
                            <TouchableOpacity
                                style={styles.navArrow}
                                onPress={goToPrevTip}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 5 }}
                            >
                                <Ionicons name="chevron-back" size={18} color={looviColors.text.tertiary} />
                            </TouchableOpacity>
                        )}

                        {/* Content with fade animation */}
                        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
                            {/* Icon */}
                            <View style={[styles.iconContainer, currentTip.isSuccess && styles.iconContainerSuccess]}>
                                <Feather
                                    name={currentTip.icon as any}
                                    size={20}
                                    color={currentTip.iconColor || looviColors.accent.primary}
                                />
                            </View>

                            {/* Text */}
                            <View style={styles.tipTextContainer}>
                                <Text style={[styles.tipTitle, currentTip.isSuccess && styles.tipTitleSuccess]}>
                                    {currentTip.title}
                                </Text>
                                <Text style={styles.tipSubtitle}>{currentTip.subtitle}</Text>
                            </View>
                        </Animated.View>

                        {/* Navigation arrows (right) / chevron */}
                        {tips.length > 1 ? (
                            <TouchableOpacity
                                style={styles.navArrow}
                                onPress={goToNextTip}
                                hitSlop={{ top: 10, bottom: 10, left: 5, right: 10 }}
                            >
                                <Ionicons name="chevron-forward" size={18} color={looviColors.text.tertiary} />
                            </TouchableOpacity>
                        ) : (
                            !isSuccess && <Ionicons name="chevron-forward" size={18} color={looviColors.text.tertiary} />
                        )}
                    </View>

                    {/* Pagination dots - show ALL swipeable tips */}
                    {tips.length > 1 && (
                        <View style={styles.paginationContainer}>
                            {tips.map((tip, index) => (
                                <View
                                    key={tip.id}
                                    style={[
                                        styles.paginationDot,
                                        // Highlight the dot for the currently displayed tip
                                        currentTip.id === tip.id && styles.paginationDotActive,
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginHorizontal: 0,
        marginVertical: spacing.md,
        minHeight: 90,
        paddingRight: spacing.screen.horizontal,
    },
    mascotContainer: {
        position: 'absolute',
        left: 0,
        top: 8, // Move up to align with text bubble
        zIndex: 10,
    },
    mascotImage: {
        width: 68, // 75% of 90
        height: 68,
    },
    bubbleContainer: {
        flex: 1,
        marginLeft: 76, // 68 + spacing
        marginTop: 0,
        flexDirection: 'row',
        alignItems: 'center',
    },
    bubbleArrow: {
        width: 0,
        height: 0,
        borderTopWidth: 8,
        borderBottomWidth: 8,
        borderRightWidth: 10,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderRightColor: 'rgba(255, 255, 255, 0.7)',
        marginRight: -1,
    },
    bubbleTouchable: {
        flex: 1,
    },
    bubble: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    contentContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    navArrow: {
        padding: 4,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    iconContainerSuccess: {
        backgroundColor: 'transparent',
    },
    tipTextContainer: {
        flex: 1,
    },
    tipTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.primary,
        marginBottom: 2,
    },
    tipTitleSuccess: {
        color: looviColors.accent.success, // Natural green #7FB069
    },
    tipSubtitle: {
        fontSize: 12,
        color: looviColors.text.secondary,
        lineHeight: 16,
    },
    // Pagination dots
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.xs,
        gap: 4,
    },
    paginationDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
    },
    paginationDotActive: {
        backgroundColor: looviColors.accent.primary,
        width: 12,
    },
    paginationMore: {
        fontSize: 9,
        color: looviColors.text.tertiary,
        marginLeft: 2,
    },
});

export default MascotTip;
