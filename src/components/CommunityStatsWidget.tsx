/**
 * CommunityStatsWidget
 * 
 * Displays comprehensive community statistics including:
 * - Key metrics (active users, streaks)
 * - Mood distribution visualization
 * - Goal achievement rate
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import { communityStatsService, CommunityStats } from '../services/communityStatsService';
import { GlassCard } from './GlassCard';
import { MoodDonutChart } from './MoodDonutChart';

interface CommunityStatsWidgetProps {
    onStatsLoaded?: (stats: CommunityStats) => void;
}

// Mock extended stats (will be replaced with real data as user base grows)
const MOCK_MOOD_DATA = {
    great: 28,
    good: 42,
    okay: 20,
    struggling: 10,
};

const MOCK_GOAL_ACHIEVEMENT = 72; // 72% of users achieved their weekly goal

export function CommunityStatsWidget({ onStatsLoaded }: CommunityStatsWidgetProps) {
    const [stats, setStats] = useState<CommunityStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showExpanded, setShowExpanded] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setIsLoading(true);
        try {
            const communityStats = await communityStatsService.getCommunityStats();
            setStats(communityStats);
            if (communityStats && onStatsLoaded) {
                onStatsLoaded(communityStats);
            }
        } catch (error) {
            console.error('Error loading community stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="small" color={looviColors.accent.primary} />
            </View>
        );
    }

    if (!stats) {
        return null;
    }

    return (
        <View style={styles.container}>
            {/* Quick Stats Row */}
            <GlassCard variant="light" padding="md" style={styles.quickStatsCard}>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <View style={styles.statIconWrapper}>
                            <Ionicons name="people" size={16} color={looviColors.accent.primary} />
                        </View>
                        <Text style={styles.statValue}>{stats.activeUsers}</Text>
                        <Text style={styles.statLabel}>Active</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.statItem}>
                        <View style={styles.statIconWrapper}>
                            <Ionicons name="flame" size={16} color={looviColors.accent.warning} />
                        </View>
                        <Text style={styles.statValue}>{stats.averageStreak}</Text>
                        <Text style={styles.statLabel}>Avg Streak</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.statItem}>
                        <View style={styles.statIconWrapper}>
                            <Ionicons name="trophy" size={16} color="#FFD700" />
                        </View>
                        <Text style={styles.statValue}>{stats.topStreak}</Text>
                        <Text style={styles.statLabel}>Top Streak</Text>
                    </View>
                </View>

                {/* Expand/Collapse Toggle */}
                <TouchableOpacity
                    style={styles.expandToggle}
                    onPress={() => setShowExpanded(!showExpanded)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.expandToggleText}>
                        {showExpanded ? 'Less' : 'More insights'}
                    </Text>
                    <Ionicons
                        name={showExpanded ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color={looviColors.accent.primary}
                    />
                </TouchableOpacity>
            </GlassCard>

            {/* Expanded Stats Section */}
            {showExpanded && (
                <View style={styles.expandedSection}>
                    {/* Mood Distribution Card */}
                    <GlassCard variant="light" padding="md" style={styles.moodCard}>
                        <Text style={styles.cardTitle}>How's the Community Feeling?</Text>
                        <MoodDonutChart data={MOCK_MOOD_DATA} size={90} />
                    </GlassCard>

                    {/* Goal Achievement Card */}
                    <GlassCard variant="light" padding="md" style={styles.achievementCard}>
                        <View style={styles.achievementRow}>
                            <View style={styles.achievementIconBg}>
                                <Ionicons name="flag" size={20} color={looviColors.accent.success} />
                            </View>
                            <View style={styles.achievementContent}>
                                <Text style={styles.achievementValue}>{MOCK_GOAL_ACHIEVEMENT}%</Text>
                                <Text style={styles.achievementLabel}>
                                    achieved their weekly goal
                                </Text>
                            </View>
                        </View>
                        {/* Progress Bar */}
                        <View style={styles.progressBarBg}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    { width: `${MOCK_GOAL_ACHIEVEMENT}%` }
                                ]}
                            />
                        </View>
                    </GlassCard>

                    {/* Extra Stats Row */}
                    <View style={styles.extraStatsRow}>
                        <GlassCard variant="light" padding="sm" style={styles.miniStatCard}>
                            <Ionicons name="calendar" size={18} color={looviColors.accent.primary} />
                            <Text style={styles.miniStatValue}>{stats.totalDaysSugarFree}</Text>
                            <Text style={styles.miniStatLabel}>Days Sugar-Free</Text>
                        </GlassCard>
                        <GlassCard variant="light" padding="sm" style={styles.miniStatCard}>
                            <Ionicons name="heart" size={18} color="#F87171" />
                            <Text style={styles.miniStatValue}>{stats.averageHealthScore || 75}</Text>
                            <Text style={styles.miniStatLabel}>Avg Health</Text>
                        </GlassCard>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    quickStatsCard: {
        // Main card styling handled by GlassCard
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statIconWrapper: {
        marginBottom: spacing.xs,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: looviColors.text.primary,
        letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: 11,
        color: looviColors.text.tertiary,
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(0, 0, 0, 0.06)',
    },
    expandToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
        gap: 4,
    },
    expandToggleText: {
        fontSize: 12,
        fontWeight: '600',
        color: looviColors.accent.primary,
    },
    expandedSection: {
        marginTop: spacing.sm,
        gap: spacing.sm,
    },
    moodCard: {
        // Card styling
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.primary,
        marginBottom: spacing.md,
    },
    achievementCard: {
        // Card styling
    },
    achievementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    achievementIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(52, 211, 153, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    achievementContent: {
        flex: 1,
    },
    achievementValue: {
        fontSize: 24,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    achievementLabel: {
        fontSize: 12,
        color: looviColors.text.secondary,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: looviColors.accent.success,
        borderRadius: 3,
    },
    extraStatsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    miniStatCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    miniStatValue: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginTop: spacing.xs,
    },
    miniStatLabel: {
        fontSize: 10,
        color: looviColors.text.tertiary,
        textTransform: 'uppercase',
        textAlign: 'center',
        marginTop: 2,
    },
});

export default CommunityStatsWidget;
