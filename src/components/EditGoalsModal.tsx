import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    Animated,
    PanResponder,
    Dimensions,
    TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import { GlassCard } from './GlassCard';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.8;
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.4;

interface EditGoalsModalProps {
    visible: boolean;
    currentGoals: string[];
    onSave: (goals: string[]) => void;
    onClose: () => void;
}

interface GoalOption {
    id: string;
    emoji: string;
    label: string;
}

const goalOptions: GoalOption[] = [
    { id: 'cravings', emoji: '🍭', label: 'Reduce sugar cravings' },
    { id: 'habits', emoji: '🔄', label: 'Break daily sugar habits' },
    { id: 'energy', emoji: '⚡', label: 'Improve energy levels' },
    { id: 'health', emoji: '💚', label: 'Better overall health' },
    { id: 'weight', emoji: '⚖️', label: 'Support weight goals' },
    { id: 'skin', emoji: '✨', label: 'Clearer skin' },
    { id: 'focus', emoji: '🧠', label: 'Better focus and clarity' },
    { id: 'blood_sugar', emoji: '📉', label: 'Stable blood sugar' },
    { id: 'sleep', emoji: '😴', label: 'Improved sleep' },
    { id: 'savings', emoji: '💰', label: 'Financial savings' },
];

export function EditGoalsModal({ visible, currentGoals, onSave, onClose }: EditGoalsModalProps) {
    const [selectedGoals, setSelectedGoals] = useState<string[]>(currentGoals);
    const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

    useEffect(() => {
        if (visible) {
            setSelectedGoals(currentGoals);
            translateY.setValue(SHEET_HEIGHT);
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 3,
                speed: 14,
            }).start();
        }
    }, [currentGoals, visible]);

    const dismiss = useCallback(() => {
        Animated.timing(translateY, {
            toValue: SHEET_HEIGHT,
            duration: 220,
            useNativeDriver: true,
        }).start(() => onClose());
    }, [onClose]);

    const toggleGoal = (id: string) => {
        setSelectedGoals(prev =>
            prev.includes(id)
                ? prev.filter(g => g !== id)
                : [...prev, id]
        );
    };

    const handleSave = () => {
        onSave(selectedGoals);
        dismiss();
    };

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

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={dismiss}
        >
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
                        <Text style={styles.title}>Update Your Goals</Text>
                        <Text style={styles.subtitle}>
                            Select the reminders you want to see when things get tough.
                        </Text>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.optionsGrid}>
                            {goalOptions.map((option) => {
                                const isSelected = selectedGoals.includes(option.id);
                                return (
                                    <TouchableOpacity
                                        key={option.id}
                                        onPress={() => toggleGoal(option.id)}
                                        activeOpacity={0.7}
                                    >
                                        <GlassCard
                                            variant={isSelected ? 'dark' : 'light'}
                                            padding="md"
                                            style={[
                                                styles.optionCard,
                                                isSelected && styles.optionCardSelected
                                            ]}
                                        >
                                            <Text style={styles.optionEmoji}>{option.emoji}</Text>
                                            <Text style={[
                                                styles.optionLabel,
                                                isSelected && styles.optionLabelSelected
                                            ]}>
                                                {option.label}
                                            </Text>
                                            {isSelected && (
                                                <View style={styles.checkmark}>
                                                    <Text style={styles.checkmarkText}>✓</Text>
                                                </View>
                                            )}
                                        </GlassCard>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <View style={{ height: 100 }} />
                    </ScrollView>

                    <View style={styles.bottomContainer}>
                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                selectedGoals.length === 0 && styles.saveButtonDisabled
                            ]}
                            onPress={handleSave}
                            disabled={selectedGoals.length === 0}
                        >
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={dismiss}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

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
        overflow: 'hidden',
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
        paddingHorizontal: spacing.xl,
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
    },
    optionsGrid: {
        gap: spacing.sm,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 60,
    },
    optionCardSelected: {
        borderWidth: 2,
        borderColor: looviColors.accent.primary,
    },
    optionEmoji: {
        fontSize: 24,
        marginRight: spacing.md,
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: looviColors.text.primary,
        flex: 1,
    },
    optionLabelSelected: {
        fontWeight: '600',
        color: looviColors.accent.primary,
    },
    checkmark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: looviColors.accent.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    bottomContainer: {
        padding: spacing.xl,
        paddingTop: spacing.md,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    saveButton: {
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    cancelButton: {
        paddingVertical: spacing.sm,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: looviColors.text.tertiary,
    },
});

export default EditGoalsModal;
