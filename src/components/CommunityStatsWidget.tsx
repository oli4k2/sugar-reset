/**
 * CommunityStatsWidget
 * 
 * Displays key community statistics in a clean, minimal horizontal layout.
 * Redesigned for clarity and reduced visual clutter.
 */

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
        <GlassCard variant="light" padding="md" style={styles.container}>
            {/* Simple 3-stat horizontal layout */}
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
        </GlassCard>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
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
});

export default CommunityStatsWidget;
