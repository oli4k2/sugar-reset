/**
 * CheckInModal Component
 *
 * Bottom sheet modal for daily sugar check-in.
 * Gesture-driven: drag handle to expand/collapse, swipe down to dismiss.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    Keyboard,
    Animated,
    PanResponder,
    Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius } from '../theme';
import { getCurrentDayLimit } from '../utils/planUtils';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.55;
const TRANSLATE_PEEK = 0;           // fully visible (sheet is compact)
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.4;

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

    const currentLimit = planType === 'gradual'
        ? getCurrentDayLimit(planType, startDate)
        : null;
    const dailyLimit = currentLimit?.dailyGrams || 0;
    const isColdTurkey = planType === 'cold_turkey';

    // ── Bottom-sheet gesture ──────────────────────────────────────────────────
    const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
    const currentSnap = useRef(TRANSLATE_PEEK);

    const handleCloseRef = useRef(onClose);
    useEffect(() => { handleCloseRef.current = onClose; });

    const dismiss = useCallback(() => {
        Animated.timing(translateY, {
            toValue: SHEET_HEIGHT,
            duration: 220,
            useNativeDriver: true,
        }).start(() => handleCloseRef.current());
    }, [translateY]);

    useEffect(() => {
        if (visible) {
            translateY.setValue(SHEET_HEIGHT);
            currentSnap.current = TRANSLATE_PEEK;
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
                translateY.setOffset(currentSnap.current);
                translateY.setValue(0);
            },
            onPanResponderMove: (_, gs) => {
                translateY.setValue(Math.max(0, gs.dy));
            },
            onPanResponderRelease: (_, gs) => {
                translateY.flattenOffset();
                if (gs.dy > DISMISS_THRESHOLD || gs.vy > 1.5) {
                    Animated.timing(translateY, {
                        toValue: SHEET_HEIGHT,
                        duration: 220,
                        useNativeDriver: true,
                    }).start(() => handleCloseRef.current());
                } else {
                    currentSnap.current = TRANSLATE_PEEK;
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
    // ─────────────────────────────────────────────────────────────────────────

    const handleGramsChange = (value: string) => {
        setSugarGrams(value);
        if (value && !isColdTurkey) {
            const grams = parseInt(value, 10) || 0;
            setSugarFree(grams <= dailyLimit);
        }
    };

    const handleChoice = async (choice: boolean) => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSugarFree(choice);
        if (!isColdTurkey) return;
        await submitCheckIn(choice);
    };

    const submitCheckIn = async (sugarFreeValue: boolean) => {
        const extras: CheckInExtras = {};
        if (!isColdTurkey && sugarGrams) {
            extras.sugarGrams = parseInt(sugarGrams, 10) || 0;
        }
        await onCheckIn(sugarFreeValue, Object.keys(extras).length > 0 ? extras : undefined);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStep('success');
        setTimeout(() => handleClose(), 1500);
    };

    const handleSubmit = async () => {
        if (sugarFree === null) return;
        await submitCheckIn(sugarFree);
    };

    const handleClose = () => {
        setSugarFree(null);
        setSugarGrams('');
        setStep('choice');
        dismiss();
    };

    const renderChoice = () => (
        <View style={styles.choiceContainer}>
            <Text style={styles.title}>How was today?</Text>
            <Text style={styles.subtitle}>Be honest with yourself</Text>
            <View style={styles.choiceButtons}>
                <TouchableOpacity
                    style={[styles.choiceButton, styles.sugarFreeButton, sugarFree === true && styles.choiceButtonSelected]}
                    onPress={() => handleChoice(true)}
                >
                    <Text style={styles.choiceEmoji}>✅</Text>
                    <Text style={styles.choiceLabel}>Sugar-Free</Text>
                    <Text style={styles.choiceSubtext}>No added sugar today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.choiceButton, styles.hadSugarButton, sugarFree === false && styles.choiceButtonSelected]}
                    onPress={() => handleChoice(false)}
                >
                    <Text style={styles.choiceEmoji}>🍬</Text>
                    <Text style={styles.choiceLabel}>Had Sugar</Text>
                    <Text style={styles.choiceSubtext}>Reset tomorrow</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderSuccess = () => (
        <View style={styles.successContainer}>
            <Text style={styles.successEmoji}>{sugarFree ? '🎉' : '💪'}</Text>
            <Text style={styles.successTitle}>{sugarFree ? 'Streak continues!' : 'Logged!'}</Text>
            <Text style={styles.successText}>{sugarFree ? 'Keep up the great work!' : 'Every day is a fresh start'}</Text>
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={handleClose}>
                    <View style={StyleSheet.absoluteFill} />
                </TouchableWithoutFeedback>

                <Animated.View style={[styles.modalContent, { transform: [{ translateY }] }]}>
                    {/* Drag handle */}
                    <View style={styles.dragHandleArea} {...panResponder.panHandlers}>
                        <View style={styles.handle} />
                    </View>

                    {step === 'choice' && renderChoice()}
                    {step === 'success' && renderSuccess()}

                    {step !== 'success' && (
                        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                            <Text style={styles.closeText}>Cancel</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
        height: SHEET_HEIGHT,
    },
    dragHandleArea: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 40,
    },
    handle: {
        width: 44,
        height: 5,
        backgroundColor: '#CCCCCC',
        borderRadius: 3,
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
