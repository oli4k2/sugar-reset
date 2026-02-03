/**
 * MascotTip Component
 * 
 * A friendly mascot that peeks from the left side of the screen
 * with dynamic, context-aware tips and suggestions.
 * Now with glass morphism styling to match app theme.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Image,
    Dimensions,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Tip categories with navigation targets
export interface MascotTipData {
    id: string;
    icon: string; // Feather icon name
    iconColor?: string; // Optional custom color
    title: string;
    subtitle: string;
    action?: string; // Navigation target or action
    category: 'task' | 'social' | 'analytics' | 'motivation' | 'streak';
    priority: number; // Higher = more important
    friendId?: string; // For cheering on specific friend
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
}

// Generate tips based on user state - NEVER shows "All done", always suggests something useful
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

    if (!props.hasFoodLoggedToday && props.hasPledgedToday) {
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

    if (!props.hasWellnessToday && props.hasPledgedToday && props.hasFoodLoggedToday) {
        tips.push({
            id: 'journal',
            icon: 'book',
            iconColor: looviColors.accent.success,
            title: 'Evening reflection',
            subtitle: 'How was your day? Take a moment to journal',
            action: 'journal',
            category: 'task',
            priority: 80,
        });
    }

    // Inner Circle tips - HIGH priority if no friends
    if (!props.hasInnerCircleFriends) {
        tips.push({
            id: 'find_friends',
            icon: 'users',
            iconColor: looviColors.accent.primary,
            title: 'Find accountability partners!',
            subtitle: "You're 65% more likely to succeed with friends",
            action: 'inner_circle',
            category: 'social',
            priority: 85, // High priority - always suggest if no friends
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
            priority: 75,
            friendId: friend.id,
        });
    } else if (props.hasInnerCircleFriends) {
        tips.push({
            id: 'cheer_friends',
            icon: 'smile',
            iconColor: looviColors.accent.primary,
            title: 'Check on your circle!',
            subtitle: 'See how your accountability partners are doing',
            action: 'inner_circle',
            category: 'social',
            priority: 60,
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
            priority: 55,
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
            priority: 50,
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
            priority: 45,
        });
    }

    // Community tip
    tips.push({
        id: 'community',
        icon: 'message-circle',
        iconColor: looviColors.accent.primary,
        title: 'Share your journey!',
        subtitle: 'Connect with others in the Community',
        action: 'community',
        category: 'social',
        priority: 40,
    });

    // Motivational tips - always have something encouraging
    const motivationalTips: MascotTipData[] = [
        {
            id: 'motivation_1',
            icon: 'star',
            iconColor: '#FFD54F',
            title: "You're doing amazing!",
            subtitle: 'Every healthy choice is a victory',
            action: 'analytics',
            category: 'motivation',
            priority: 35,
        },
        {
            id: 'motivation_2',
            icon: 'feather',
            iconColor: looviColors.accent.success,
            title: 'Small steps, big changes',
            subtitle: 'Check your progress and celebrate wins',
            action: 'analytics',
            category: 'motivation',
            priority: 35,
        },
        {
            id: 'motivation_3',
            icon: 'compass',
            iconColor: looviColors.accent.primary,
            title: 'Stay on course!',
            subtitle: 'See how far you\'ve come',
            action: 'analytics',
            category: 'motivation',
            priority: 35,
        },
        {
            id: 'motivation_4',
            icon: 'wind',
            iconColor: '#81D4FA',
            title: 'Take a mindful moment',
            subtitle: 'Reflect on your wellness journey',
            action: 'journal',
            category: 'motivation',
            priority: 35,
        },
    ];

    // Add one random motivational tip as fallback
    const randomMotivational = motivationalTips[Math.floor(Math.random() * motivationalTips.length)];
    tips.push(randomMotivational);

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
}) => {
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const bounceAnim = useRef(new Animated.Value(0)).current;
    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    // Generate tips based on current state
    const tips = generateTips({
        hasPledgedToday,
        hasFoodLoggedToday,
        hasWellnessToday,
        hasInnerCircleFriends,
        currentStreak,
        healthScore,
        friendsNeedingSupport,
    });

    const currentTip = forceTip || tips[currentTipIndex] || tips[0];

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

    // Handle tap to navigate
    const handlePress = () => {
        if (currentTip.action) {
            onTipPress(currentTip.action, currentTip.friendId);
        } else {
            // Cycle to next tip
            setCurrentTipIndex((prev) => (prev + 1) % tips.length);
        }
    };

    // Long press to cycle tips
    const handleLongPress = () => {
        setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    };

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePress}
            onLongPress={handleLongPress}
            style={styles.container}
        >
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

            {/* Speech bubble with glass effect */}
            <Animated.View
                style={[
                    styles.bubbleContainer,
                    { transform: [{ translateX: slideAnim }] },
                ]}
            >
                <View style={styles.bubbleArrow} />
                <View style={styles.bubble}>
                    <View style={styles.iconContainer}>
                        <Feather
                            name={currentTip.icon as any}
                            size={20}
                            color={currentTip.iconColor || looviColors.accent.primary}
                        />
                    </View>
                    <View style={styles.tipTextContainer}>
                        <Text style={styles.tipTitle}>{currentTip.title}</Text>
                        <Text style={styles.tipSubtitle}>{currentTip.subtitle}</Text>
                    </View>
                    <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={looviColors.text.tertiary}
                    />
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Align to top so mascot can be lower
        marginHorizontal: 0, // No horizontal margin - mascot touches edge
        marginVertical: spacing.md,
        minHeight: 90,
        paddingRight: spacing.screen.horizontal,
    },
    mascotContainer: {
        position: 'absolute',
        left: -20, // Left edge touching screen
        top: 15, // Lowered so bubble appears above
        zIndex: 10,
    },
    mascotImage: {
        width: 90,
        height: 90,
    },
    bubbleContainer: {
        flex: 1,
        marginLeft: 55, // Closer to mascot
        marginTop: 0, // Bubble at top
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
    bubble: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        // Glass morphism effect
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        // Soft shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
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
    tipTextContainer: {
        flex: 1,
    },
    tipTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.primary,
        marginBottom: 2,
    },
    tipSubtitle: {
        fontSize: 12,
        color: looviColors.text.secondary,
        lineHeight: 16,
    },
});

export default MascotTip;
