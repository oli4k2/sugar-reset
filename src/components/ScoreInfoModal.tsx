/**
 * ScoreInfoModal Component
 * 
 * A detailed informational modal explaining health, nutrition, and wellness scores.
 * Refactored to a gesture-driven bottom sheet.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Animated,
    PanResponder,
    Dimensions,
    TouchableWithoutFeedback,
    Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.4;

export interface ScoreRange {
    min: number;
    max: number;
    label: string;
    color: string;
    tip: string;
}

export interface ScoreInfo {
    title: string;
    description: string;
    ranges: ScoreRange[];
    howToImprove: string[];
}

export const SCORE_INFO: Record<string, ScoreInfo> = {
    overall: {
        title: 'Overall Health Score',
        description: 'Your Health Score is a holistic view of your progress, combining nutrition data with your daily wellness check-ins.',
        ranges: [
            { min: 80, max: 100, label: 'Excellent', color: '#22C55E', tip: "You're at your peak! Your habits are perfectly aligned. Keep making these choices consistently." },
            { min: 60, max: 79, label: 'Great', color: '#3B82F6', tip: "You're doing great work. Focus on consistent hydration and slightly better sleep to reach Excellent." },
            { min: 40, max: 59, label: 'Moderate', color: '#F59E0B', tip: "You've built a solid foundation. Try reducing added sugar by 10% this week to boost your score." },
            { min: 0, max: 39, label: 'Developing', color: '#EF4444', tip: "Every journey starts here. Focus on logging daily - awareness is the first step to change!" },
        ],
        howToImprove: [
            'Log your food daily for accurate nutrition data',
            'Complete your wellness check-ins every evening',
            'Sustain a sugar-free streak of 3+ days',
            'Aim for 7-8 hours of sleep consistently',
        ],
    },
    nutrition: {
        title: 'Nutrition Score',
        description: 'Based on your food logs, focusing on added sugar, protein intake, and fiber for stable blood sugar.',
        ranges: [
            { min: 80, max: 100, label: 'Optimal', color: '#22C55E', tip: 'Your blood sugar is likely very stable. This is the goal for long-term health!' },
            { min: 60, max: 79, label: 'Healthy', color: '#3B82F6', tip: 'Good balance. Aim to swap one sugary snack for a protein-rich one today.' },
            { min: 40, max: 59, label: 'Fair', color: '#F59E0B', tip: 'Watch out for hidden sugars in sauces and processed foods.' },
            { min: 0, max: 39, label: 'Needs Focus', color: '#EF4444', tip: 'Focus on one high-protein breakfast this week to reduce afternoon cravings.' },
        ],
        howToImprove: [
            'Keep added sugar below your daily limit',
            'Increase daily protein intake (aim for 20g+ per meal)',
            'Include fiber-rich vegetables with lunch and dinner',
            'Hydrate with water instead of sugary drinks',
        ],
    },
    wellness: {
        title: 'Wellness Score',
        description: 'Calculated from your daily mood, energy, focus, and sleep reports. It reflects how you feel.',
        ranges: [
            { min: 80, max: 100, label: 'Thriving', color: '#22C55E', tip: 'You feel amazing! Note what you did today to replicate this feeling.' },
            { min: 60, max: 79, label: 'Balanced', color: '#3B82F6', tip: 'Steady energy and good mood. A 10-min walk could push you into Thriving!' },
            {
                min: 40, max: 59, label: 'Stable', color: '#F59E0B', tip: 'You're holding steady.Earlier bedtime tonight might boost your score tomorrow.' },
            { min: 0, max: 39, label: 'Struggling', color: '#EF4444', tip: "It's okay to have low energy days. Be extra kind to yourself today." },
        ],
        howToImprove: [
            'Prioritize a consistent sleep/wake schedule',
            'Take short "movement breaks" during the day',
            'Practice 5 minutes of mindful breathing',
            'Log your mood triggers to identify patterns',
        ],
    },
};

interface ScoreInfoModalProps {
    visible: boolean;
    type: 'overall' | 'nutrition' | 'wellness' | null;
    currentScore: number;
    onClose: () => void;
}

export const ScoreInfoModal: React.FC<ScoreInfoModalProps> = ({
    visible,
    type,
    currentScore,
    onClose,
}) => {
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
                toValue: 0,
                useNativeDriver: true,
                bounciness: 3,
                speed: 14,
            }).start();
        }
    }, [visible]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 10,
            onPanResponderGrant: () => {
                translateY.stopAnimation();
                translateY.setOffset(0);
            },
            onPanResponderMove: (_, gs) => {
                translateY.setValue(Math.max(0, gs.dy));
            },
            onPanResponderRelease: (_, gs) => {
                translateY.flattenOffset();
                if (gs.dy > DISMISS_THRESHOLD || gs.vy > 1.0) {
                    dismiss();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 4,
                        speed: 14,
                    }).start();
                }
            },
        })
    ).current;

    if (!type || !SCORE_INFO[type]) return null;
    const info = SCORE_INFO[type];
    const currentRange = info.ranges.find(r => currentScore >= r.min && currentScore <= r.max) || info.ranges[info.ranges.length - 1];

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
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
                    <View {...panResponder.panHandlers} style={styles.handleContainer}>
                        <View style={styles.handle} />
                    </View>

                    <View style={styles.header}>
                        <Text style={styles.title}>{info.title}</Text>
                        <TouchableOpacity onPress={dismiss}>
                            <Feather name="x" size={24} color={looviColors.text.tertiary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <View style={[styles.currentScoreBox, { backgroundColor: `${currentRange.color}10` }]}>
                            <View>
                                <Text style={styles.currentScoreLabel}>Your Current Score</Text>
                                <View style={styles.scoreRow}>
                                    <Text style={[styles.scoreValue, { color: currentRange.color }]}>{currentScore}</Text>
                                    <Text style={styles.scoreOutOf}>/100</Text>
                                </View>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: currentRange.color }]}>
                                <Text style={styles.statusBadgeText}>{currentRange.label}</Text>
                            </View>
                        </View>

                        <Text style={styles.description}>{info.description}</Text>

                        <View style={[styles.tipCard, { borderLeftColor: currentRange.color }]}>
                            <Ionicons name="bulb" size={20} color={currentRange.color} style={styles.tipIcon} />
                            <Text style={styles.tipText}>{currentRange.tip}</Text>
                        </View>

                        <Text style={styles.sectionTitle}>Score Ranges</Text>
                        <View style={styles.rangesContainer}>
                            {info.ranges.map((range, index) => (
                                <View key={index} style={styles.rangeRow}>
                                    <View style={[styles.rangeIndicator, { backgroundColor: range.color }]} />
                                    <Text style={styles.rangeLabel}>{range.label}</Text>
                                    <Text style={styles.rangeValues}>{range.min} - {range.max}</Text>
                                </View>
                            ))}
                        </View>

                        <Text style={styles.sectionTitle}>How to Improve</Text>
                        <View style={styles.improveList}>
                            {info.howToImprove.map((item, index) => (
                                <View key={index} style={styles.improveItem}>
                                    <Ionicons name="checkmark-circle" size={18} color={looviColors.accent.primary} />
                                    <Text style={styles.improveText}>{item}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={{ height: 40 }} />
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.doneButton} onPress={dismiss}>
                            <Text style={styles.doneButtonText}>Got it!</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

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
        width: '100%',
        maxHeight: SHEET_HEIGHT,
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    scrollContent: {
        paddingHorizontal: spacing.xl,
    },
    currentScoreBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.xl,
    },
    currentScoreLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: looviColors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    scoreValue: {
        fontSize: 32,
        fontWeight: '800',
    },
    scoreOutOf: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.tertiary,
        marginLeft: 2,
    },
    statusBadge: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    statusBadgeText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: looviColors.text.secondary,
        marginBottom: spacing.xl,
    },
    tipCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderLeftWidth: 4,
        marginBottom: spacing.xl,
    },
    tipIcon: {
        marginRight: spacing.sm,
        marginTop: 2,
    },
    tipText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
        color: looviColors.text.primary,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.md,
    },
    rangesContainer: {
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.xl,
    },
    rangeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    rangeIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: spacing.md,
    },
    rangeLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.secondary,
    },
    rangeValues: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.text.tertiary,
    },
    improveList: {
        gap: spacing.sm,
    },
    improveItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
    },
    improveText: {
        flex: 1,
        fontSize: 14,
        color: looviColors.text.secondary,
        lineHeight: 20,
    },
    footer: {
        padding: spacing.xl,
        paddingTop: spacing.md,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    doneButton: {
        backgroundColor: looviColors.accent.primary,
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
    },
    doneButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default ScoreInfoModal;
