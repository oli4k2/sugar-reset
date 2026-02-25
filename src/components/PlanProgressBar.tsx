/**
 * PlanProgressBar Component
 * 
 * Shows plan completion progress with phase information.
 * Displays: percentage, phase labels, and phase description.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import { GlassCard } from './GlassCard';
import { LinearGradient } from 'expo-linear-gradient';

// Phase definitions based on plan progress - More granular phases, especially early on
const PHASES = [
    {
        minPercent: 0,
        maxPercent: 5,
        name: 'Phase 1: Starting Out',
        feeling: 'taking your first steps',
        endFeeling: 'you\'ve begun your journey',
    },
    {
        minPercent: 5,
        maxPercent: 10,
        name: 'Phase 2: First Steps',
        feeling: 'building your foundation',
        endFeeling: 'establishing new routines',
    },
    {
        minPercent: 10,
        maxPercent: 15,
        name: 'Phase 3: Building Foundation',
        feeling: 'creating healthy habits',
        endFeeling: 'patterns are forming',
    },
    {
        minPercent: 15,
        maxPercent: 20,
        name: 'Phase 4: Early Progress',
        feeling: 'seeing initial results',
        endFeeling: 'momentum is building',
    },
    {
        minPercent: 20,
        maxPercent: 25,
        name: 'Phase 5: Gaining Momentum',
        feeling: 'feeling more in control',
        endFeeling: 'habits are strengthening',
    },
    {
        minPercent: 25,
        maxPercent: 35,
        name: 'Phase 6: Detox',
        feeling: 'experiencing cravings and adjustment',
        endFeeling: 'cravings will start to decrease',
    },
    {
        minPercent: 35,
        maxPercent: 50,
        name: 'Phase 7: Adaptation',
        feeling: 'adapting to lower sugar intake',
        endFeeling: 'energy levels will stabilize',
    },
    {
        minPercent: 50,
        maxPercent: 65,
        name: 'Phase 8: Momentum',
        feeling: 'building healthy habits',
        endFeeling: 'taste preferences will change',
    },
    {
        minPercent: 65,
        maxPercent: 80,
        name: 'Phase 9: Strengthening',
        feeling: 'habits becoming second nature',
        endFeeling: 'confidence is growing',
    },
    {
        minPercent: 80,
        maxPercent: 100,
        name: 'Phase 10: Mastery',
        feeling: 'mastering your sugar-free lifestyle',
        endFeeling: 'feel in complete control',
    },
];

interface PlanProgressBarProps {
    /** Days since start */
    daysSinceStart: number;
    /** Total plan duration in days */
    planDuration: number;
    /** Plan end date */
    endDate?: Date;
    /** Callback when info button is pressed */
    onInfoPress?: () => void;
}

export function PlanProgressBar({
    daysSinceStart,
    planDuration,
    endDate,
    onInfoPress,
}: PlanProgressBarProps) {
    const animatedWidth = useRef(new Animated.Value(0)).current;

    // Calculate progress percentage (capped at 100%)
    const progressPercent = Math.min(100, Math.round((daysSinceStart / planDuration) * 100));

    useEffect(() => {
        Animated.spring(animatedWidth, {
            toValue: progressPercent,
            useNativeDriver: false,
            tension: 20,
            friction: 7,
        }).start();
    }, [progressPercent]);

    // Find current phase index
    const currentPhaseIndex = PHASES.findIndex(
        phase => progressPercent >= phase.minPercent && progressPercent < phase.maxPercent
    );
    const safePhaseIndex = currentPhaseIndex === -1 ? PHASES.length - 1 : currentPhaseIndex;
    const currentPhase = PHASES[safePhaseIndex];

    // Format end date
    const endDateFormatted = endDate
        ? endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '';

    return (
        <GlassCard variant="light" style={styles.container}>
            {/* Header Row: Title and Percentage */}
            <View style={styles.headerRow}>
                <View style={styles.titleGroup}>
                    <Text style={styles.phasePrefix}>Phase {safePhaseIndex + 1}</Text>
                    <Text style={styles.phaseName}>{currentPhase.name}</Text>
                </View>
                <View style={styles.percentGroup}>
                    <Text style={styles.percentText}>{progressPercent}%</Text>
                    {onInfoPress && (
                        <TouchableOpacity onPress={onInfoPress} activeOpacity={0.7} style={styles.infoButton}>
                            <Ionicons name="information-circle-outline" size={16} color={looviColors.text.tertiary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Segmented Progress Bar Track */}
            <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                    <Animated.View
                        style={[
                            styles.progressFillContainer,
                            {
                                width: animatedWidth.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: ['0%', '100%']
                                })
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={[looviColors.coralOrange, '#EB6E5F']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.progressFill}
                        />
                    </Animated.View>
                </View>

                {/* Visual Phase Ticks/Markers */}
                <View style={[StyleSheet.absoluteFill, styles.markerOverlay]}>
                    {[25, 50, 75].map((pos) => (
                        <View
                            key={`marker-${pos}`}
                            style={[
                                styles.marker,
                                { left: `${pos}%` },
                                progressPercent >= pos && styles.markerActive
                            ]}
                        />
                    ))}
                </View>
            </View>

            {/* Footer Row: Hint and End Date */}
            <View style={styles.footerRow}>
                <Text style={styles.phaseHint} numberOfLines={1}>
                    {currentPhase.feeling} → {currentPhase.endFeeling}
                </Text>
                {endDateFormatted && (
                    <Text style={styles.endDateLabel}>Ends {endDateFormatted}</Text>
                )}
            </View>
        </GlassCard>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: spacing.md,
        padding: spacing.md,
        borderRadius: borderRadius.xl,
        marginTop: spacing.sm,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: spacing.xs,
    },
    titleGroup: {
        flexDirection: 'column',
    },
    phasePrefix: {
        fontSize: 10,
        fontWeight: '700',
        color: looviColors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 2,
    },
    phaseName: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
        letterSpacing: -0.5,
    },
    percentGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    percentText: {
        fontSize: 14,
        fontWeight: '700',
        color: looviColors.coralOrange,
    },
    infoButton: {
        marginLeft: spacing.xs,
    },
    progressContainer: {
        height: 12,
        justifyContent: 'center',
        marginVertical: 6,
    },
    progressTrack: {
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFillContainer: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        flex: 1,
    },
    markerOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        pointerEvents: 'none',
    },
    marker: {
        position: 'absolute',
        width: 1.5,
        height: 8,
        backgroundColor: 'rgba(0,0,0,0.06)',
        marginLeft: -0.75,
    },
    markerActive: {
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    phaseHint: {
        fontSize: 11,
        fontWeight: '500',
        color: looviColors.text.secondary,
        flex: 1,
        marginRight: spacing.sm,
    },
    endDateLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: looviColors.text.tertiary,
        backgroundColor: 'rgba(0,0,0,0.04)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
        textTransform: 'uppercase',
    },
});

export default PlanProgressBar;
