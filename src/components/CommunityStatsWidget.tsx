import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import { communityStatsService, CommunityStats } from '../services/communityStatsService';
import { GlassCard } from './GlassCard';

interface CommunityStatsWidgetProps {
    onStatsLoaded?: (stats: CommunityStats) => void;
}

export function CommunityStatsWidget({ onStatsLoaded }: CommunityStatsWidgetProps) {
    const [stats, setStats] = useState<CommunityStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
                            <Ionicons name="heart" size={16} color="#F87171" />
                        </View>
                        <Text style={styles.statValue}>{stats.averageHealthScore || 0}</Text>
                        <Text style={styles.statLabel}>Avg Health</Text>
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
            </GlassCard>
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
    miniStatCard: {
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    miniStatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    miniStatValue: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    miniStatLabel: {
        fontSize: 11,
        color: looviColors.text.tertiary,
        textTransform: 'uppercase',
    },
});

export default CommunityStatsWidget;
