/**
 * CheckInModal Component
 * 
 * Bottom sheet modal for daily sugar check-in.
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    Keyboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Button } from './Button';
import { GlassCard } from './GlassCard';
import { colors, typography, spacing, borderRadius } from '../theme';
import { getCurrentDayLimit } from '../utils/planUtils';

interface CheckInModalProps {
    visible: boolean;
    onClose: () => void;
    onCheckIn: (sugarFree: boolean, extras?: CheckInExtras) => Promise<void>;
    isLoading?: boolean;
    planType?: 'cold_turkey' | 'gradual';
    startDate?: Date;
}

interface CheckInExtras {
    notes?: string;
    cravingLevel?: 1 | 2 | 3 | 4 | 5;
    mood?: 1 | 2 | 3 | 4 | 5;
    sugarGrams?: number;
}

export function CheckInModal({
    visible,
    onClose,
    onCheckIn,
    isLoading = false,
    planType = 'cold_turkey',
    startDate = new Date(),
}: CheckInModalProps) {
    const [sugarFree, setSugarFree] = useState<boolean | null>(null);
    const [sugarGrams, setSugarGrams] = useState<string>('');
    const [step, setStep] = useState<'choice' | 'success'>('choice');

    // Calculate dynamic daily limit based on current week for gradual plan
    const currentLimit = planType === 'gradual'
        ? getCurrentDayLimit(planType, startDate)
        : null;
    const dailyLimit = currentLimit?.dailyGrams || 0;
    const weekTitle = currentLimit?.title || '';
    const isColdTurkey = planType === 'cold_turkey';

    // Handle gram input change - auto-select within/exceeded based on value
    const handleGramsChange = (value: string) => {
        setSugarGrams(value);

        // Auto-select choice based on entered grams
        if (value && !isColdTurkey) {
            const grams = parseInt(value, 10) || 0;
            if (grams <= dailyLimit) {
                setSugarFree(true); // Within limit
            } else {
                setSugarFree(false); // Exceeded limit
            }
        }
    };

    const handleChoice = async (choice: boolean) => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSugarFree(choice);

        // For gradual plan with gram input, just mark the selection
        // Submit will happen when user taps "Complete Check-In"
        if (!isColdTurkey) {
            // Stay on choice step to allow gram entry
            return;
        }

        // For cold turkey, submit immediately
        await submitCheckIn(choice);
    };

    const submitCheckIn = async (sugarFreeValue: boolean) => {
        const extras: CheckInExtras = {};

        // Add sugar grams for gradual plan
        if (!isColdTurkey && sugarGrams) {
            extras.sugarGrams = parseInt(sugarGrams, 10) || 0;
        }

        await onCheckIn(sugarFreeValue, Object.keys(extras).length > 0 ? extras : undefined);

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStep('success');

        // Auto close after success animation
        setTimeout(() => {
            handleClose();
        }, 1500);
    };

    const handleSubmit = async () => {
        if (sugarFree === null) return;
        await submitCheckIn(sugarFree);
    };

    const handleClose = () => {
        // Reset state
        setSugarFree(null);
        setSugarGrams('');
        setStep('choice');
        onClose();
    };

    const renderChoice = () => {
        return (
            <View style={styles.choiceContainer}>
                <Text style={styles.title}>How was today?</Text>
                <Text style={styles.subtitle}>Be honest with yourself</Text>

                <View style={styles.choiceButtons}>
                    <TouchableOpacity
                        style={[
                            styles.choiceButton,
                            styles.sugarFreeButton,
                            sugarFree === true && styles.choiceButtonSelected,
                        ]}
                        onPress={() => handleChoice(true)}
                    >
                        <Text style={styles.choiceEmoji}>✅</Text>
                        <Text style={styles.choiceLabel}>Sugar-Free</Text>
                        <Text style={styles.choiceSubtext}>No added sugar today</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.choiceButton,
                            styles.hadSugarButton,
                            sugarFree === false && styles.choiceButtonSelected,
                        ]}
                        onPress={() => handleChoice(false)}
                    >
                        <Text style={styles.choiceEmoji}>🍬</Text>
                        <Text style={styles.choiceLabel}>Had Sugar</Text>
                        <Text style={styles.choiceSubtext}>Reset tomorrow</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderSuccess = () => (
        <View style={styles.successContainer}>
            <Text style={styles.successEmoji}>{sugarFree ? '🎉' : '💪'}</Text>
            <Text style={styles.successTitle}>
                {sugarFree ? 'Streak continues!' : 'Logged!'}
            </Text>
            <Text style={styles.successText}>
                {sugarFree
                    ? 'Keep up the great work!'
                    : 'Every day is a fresh start'}
            </Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={handleClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <View style={styles.handle} />

                            {step === 'choice' && renderChoice()}
                            {step === 'success' && renderSuccess()}

                            {step !== 'success' && (
                                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                                    <Text style={styles.closeText}>Cancel</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: borderRadius['2xl'],
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
        paddingTop: spacing.lg,
        width: '100%',
        maxWidth: 360,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: colors.glass.strong,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: spacing.xl,
    },
    title: {
        ...typography.styles.h2,
        color: '#1A1A3D',
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.styles.body,
        color: '#555566',
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    // Choice step
    choiceContainer: {
        alignItems: 'center',
    },
    choiceButtons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    choiceButton: {
        flex: 1,
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        borderWidth: 1,
    },
    sugarFreeButton: {
        backgroundColor: 'rgba(127, 176, 105, 0.15)',
        borderColor: colors.accent.success,
    },
    hadSugarButton: {
        backgroundColor: 'rgba(214, 104, 83, 0.15)',
        borderColor: colors.accent.error,
    },
    choiceButtonSelected: {
        borderWidth: 3,
        transform: [{ scale: 1.02 }],
    },
    choiceEmoji: {
        fontSize: 32,
        marginBottom: spacing.sm,
    },
    choiceLabel: {
        ...typography.styles.bodyMedium,
        color: '#1A1A3D',
        marginBottom: spacing.xs,
    },
    choiceSubtext: {
        ...typography.styles.caption,
        color: '#666677',
        textAlign: 'center',
    },
    submitButton: {
        marginTop: spacing.lg,
    },
    // Success step
    successContainer: {
        alignItems: 'center',
        paddingVertical: spacing['3xl'],
    },
    successEmoji: {
        fontSize: 64,
        marginBottom: spacing.lg,
    },
    successTitle: {
        ...typography.styles.h2,
        color: '#1A1A3D',
        marginBottom: spacing.sm,
    },
    successText: {
        ...typography.styles.body,
        color: '#555566',
    },
    closeButton: {
        alignItems: 'center',
        paddingVertical: spacing.md,
        marginTop: spacing.md,
    },
    closeText: {
        ...typography.styles.body,
        color: '#666677',
    },
    // Gram input for gradual plan
    gramInputContainer: {
        marginTop: spacing.xl,
        width: '100%',
    },
    gramInputLabel: {
        ...typography.styles.bodySm,
        color: '#555566',
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    gramInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    gramInput: {
        backgroundColor: '#F0F0F5',
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        fontSize: 24,
        fontWeight: '600',
        color: '#1A1A3D',
        textAlign: 'center',
        width: 100,
        borderWidth: 1,
        borderColor: '#E0E0E8',
    },
    gramInputUnit: {
        ...typography.styles.body,
        color: '#555566',
    },
});

export default CheckInModal;
