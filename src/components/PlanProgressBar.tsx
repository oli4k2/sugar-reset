/**
 * PlanProgressBar Component
 * 
 * Shows plan completion progress with phase information.
 * Displays: percentage, phase labels, and phase description.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import { GlassCard } from './GlassCard';

// Phase definitions based on plan progress
const PHASES = [
    {
        minPercent: 0,
        maxPercent: 25,
        name: 'Phase 1: Detox',
        feeling: 'experiencing cravings and adjustment',
        endFeeling: 'cravings will start to decrease',
    },
    {
        minPercent: 25,
        maxPercent: 50,
        name: 'Phase 2: Adaptation',
        feeling: 'adapting to lower sugar intake',
        endFeeling: 'energy levels will stabilize',
    },
    {
        minPercent: 50,
        maxPercent: 75,
        name: 'Phase 3: Momentum',
        feeling: 'building healthy habits',
        endFeeling: 'taste preferences will change',
    },
    {
        minPercent: 75,
        maxPercent: 100,
        name: 'Phase 4: Mastery',
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
    // Calculate progress percentage (capped at 100%)
    const progressPercent = Math.min(100, Math.round((daysSinceStart / planDuration) * 100));

    // Find current phase
    const currentPhase = PHASES.find(
        phase => progressPercent >= phase.minPercent && progressPercent < phase.maxPercent
    ) || PHASES[PHASES.length - 1];

    // Format end date
    const endDateFormatted = endDate
        ? endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '';

    return (
        <GlassCard variant="light" style={styles.container}>
            {/* Header Label with Info Button */}
            <View style={styles.headerRow}>
                <Text style={styles.headerLabel}>Habit Formation Progress</Text>
                {onInfoPress && (
                    <TouchableOpacity onPress={onInfoPress} activeOpacity={0.7}>
                        <Ionicons name="information-circle" size={18} color={looviColors.text.tertiary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Phase Title - Above Progress Bar */}
            <Text style={styles.phaseTitle}>{currentPhase.name}</Text>

            {/* Progress Bar */}
            <View style={styles.progressTrack}>
                <View
                    style={[
                        styles.progressFill,
                        { width: `${progressPercent}%` }
                    ]}
                />
            </View>

            {/* Progress Percentage and End Date - Below Progress Bar */}
            <View style={styles.progressLabelsRow}>
                <Text style={styles.percentText}>{progressPercent}%</Text>
                {endDateFormatted && (
                    <Text style={styles.endDateLabel}>Complete by {endDateFormatted}</Text>
                )}
            </View>

            {/* Phase Description - Compact single line */}
            <Text style={styles.phaseHint}>
                {currentPhase.feeling.charAt(0).toUpperCase() + currentPhase.feeling.slice(1)} → {currentPhase.endFeeling}
            </Text>
        </GlassCard>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing.xs,
        paddingBottom: spacing.sm,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    headerLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: looviColors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    phaseTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: looviColors.accent.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.xs,
        textShadowColor: 'rgba(217, 123, 102, 0.25)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    progressTrack: {
        height: 10,
        backgroundColor: 'rgba(0,0,0,0.08)',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: looviColors.coralOrange,
        borderRadius: 5,
    },
    progressLabelsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    percentText: {
        fontSize: 12,
        fontWeight: '600',
        color: looviColors.accent.primary,
        textShadowColor: 'rgba(217, 123, 102, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    endDateLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: looviColors.text.tertiary,
    },
    phaseHint: {
        fontSize: 12,
        fontWeight: '500',
        color: looviColors.text.secondary,
        fontStyle: 'italic',
        marginTop: spacing.sm,
        textAlign: 'center',
        alignSelf: 'center',
    },
});

export default PlanProgressBar;
