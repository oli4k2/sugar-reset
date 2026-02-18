import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    ScrollView,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Animated,
    PanResponder,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.9;
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.4;

interface JournalEntryModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (entry: JournalEntryData) => Promise<void>;
    date?: Date;
    existingEntry?: JournalEntryData;
    /** If true, shows the "What triggered this?" question (for slip-up context) */
    isAfterSlipUp?: boolean;
}

export interface JournalEntryData {
    // Wellness scales (1-5)
    mood?: number;
    energy?: number;
    focus?: number;
    sleep?: number;
    // Notes
    notes: string;
    whatTriggered?: string;
}

export function JournalEntryModal({
    visible,
    onClose,
    onSave,
    date = new Date(),
    existingEntry,
    isAfterSlipUp = false,
}: JournalEntryModalProps) {
    // Wellness scales (1-5)
    const [mood, setMood] = useState<number>(existingEntry?.mood || 3);
    const [energy, setEnergy] = useState<number>(existingEntry?.energy || 3);
    const [focus, setFocus] = useState<number>(existingEntry?.focus || 3);
    const [sleep, setSleep] = useState<number>(existingEntry?.sleep || 7);

    const [notes, setNotes] = useState(existingEntry?.notes || '');
    const [whatTriggered, setWhatTriggered] = useState(existingEntry?.whatTriggered || '');
    const [isSaving, setIsSaving] = useState(false);

    // ── Bottom-sheet gesture ──────────────────────────────────────────────────
    const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

    const dismiss = useCallback(() => {
        Animated.timing(translateY, {
            toValue: SHEET_HEIGHT,
            duration: 220,
            useNativeDriver: true,
        }).start(() => {
            onClose();
            // Reset state after animation
            setMood(3);
            setEnergy(3);
            setFocus(3);
            setSleep(7);
            setNotes('');
            setWhatTriggered('');
        });
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

            // Populate if existing
            if (existingEntry) {
                setMood(existingEntry.mood || 3);
                setEnergy(existingEntry.energy || 3);
                setFocus(existingEntry.focus || 3);
                setSleep(existingEntry.sleep || 7);
                setNotes(existingEntry.notes || '');
                setWhatTriggered(existingEntry.whatTriggered || '');
            }
        }
    }, [visible, existingEntry, translateY]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 10 && !Keyboard.isVisible(),
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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({
                mood,
                energy,
                focus,
                sleep,
                notes: notes.trim(),
                whatTriggered: whatTriggered.trim() || undefined,
            });
            dismiss();
        } catch (error) {
            console.error('Failed to save journal entry:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const dateString = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });

    const renderScaleSlider = (
        value: number,
        setValue: (v: number) => void,
        iconName: keyof typeof Ionicons.glyphMap,
        label: string,
        color: string
    ) => (
        <View style={styles.scaleContainer}>
            <View style={styles.sliderHeader}>
                <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
                    <Ionicons name={iconName} size={18} color={color} />
                </View>
                <View style={styles.sliderLabelContainer}>
                    <Text style={styles.scaleLabel}>{label}</Text>
                    <Text style={[styles.scaleValue, { color }]}>{value}/5</Text>
                </View>
            </View>
            <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={5}
                step={1}
                value={value}
                onValueChange={setValue}
                minimumTrackTintColor={color}
                maximumTrackTintColor="rgba(0,0,0,0.1)"
                thumbTintColor={color}
            />
        </View>
    );

    const renderSleepSlider = () => (
        <View style={styles.scaleContainer}>
            <View style={styles.sliderHeader}>
                <View style={[styles.iconContainer, { backgroundColor: `${looviColors.accent.success}15` }]}>
                    <Ionicons name="bed-outline" size={18} color={looviColors.accent.success} />
                </View>
                <View style={styles.sliderLabelContainer}>
                    <Text style={styles.scaleLabel}>Sleep</Text>
                    <Text style={[styles.scaleValue, { color: looviColors.accent.success }]}>{sleep}h</Text>
                </View>
            </View>
            <Slider
                style={styles.slider}
                minimumValue={4}
                maximumValue={12}
                step={1}
                value={sleep}
                onValueChange={setSleep}
                minimumTrackTintColor={looviColors.accent.success}
                maximumTrackTintColor="rgba(0,0,0,0.1)"
                thumbTintColor={looviColors.accent.success}
            />
            <View style={styles.scaleLabels}>
                <Text style={styles.scaleLabelMin}>4h</Text>
                <Text style={styles.scaleLabelMax}>12h</Text>
            </View>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
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

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Header */}
                            <View style={styles.header}>
                                <View style={styles.headerTitleRow}>
                                    <Text style={styles.title}>📝 Evening Reflection</Text>
                                    <TouchableOpacity style={styles.closeButton} onPress={dismiss}>
                                        <Ionicons name="close" size={20} color={looviColors.text.tertiary} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.dateText}>{dateString}</Text>
                            </View>

                            <Text style={styles.sectionTitle}>How are you feeling?</Text>

                            {renderScaleSlider(mood, setMood, 'happy-outline', 'Mood', looviColors.accent.primary)}
                            {renderScaleSlider(energy, setEnergy, 'flash-outline', 'Energy', looviColors.accent.warning)}
                            {renderScaleSlider(focus, setFocus, 'bulb-outline', 'Focus', '#8B5CF6')}
                            {renderSleepSlider()}

                            {isAfterSlipUp && (
                                <View style={styles.section}>
                                    <Text style={styles.inputLabel}>What triggered this? (optional)</Text>
                                    <TextInput
                                        style={styles.triggerInput}
                                        placeholder="e.g., Stress at work, social event..."
                                        placeholderTextColor="rgba(0,0,0,0.4)"
                                        value={whatTriggered}
                                        onChangeText={setWhatTriggered}
                                        multiline
                                        returnKeyType="done"
                                        blurOnSubmit={true}
                                    />
                                </View>
                            )}

                            <View style={styles.section}>
                                <Text style={styles.inputLabel}>Your thoughts (optional)</Text>
                                <TextInput
                                    style={styles.notesInput}
                                    placeholder={isAfterSlipUp
                                        ? "How did it make you feel? What would you do differently?"
                                        : "How was your day? Any wins or challenges?"
                                    }
                                    placeholderTextColor="rgba(0,0,0,0.4)"
                                    value={notes}
                                    onChangeText={setNotes}
                                    multiline
                                    textAlignVertical="top"
                                    returnKeyType="done"
                                    blurOnSubmit={true}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                                onPress={handleSave}
                                disabled={isSaving}
                            >
                                <Text style={styles.saveButtonText}>
                                    {isSaving ? 'Saving...' : 'Save Entry'}
                                </Text>
                            </TouchableOpacity>

                            <View style={{ height: spacing['2xl'] }} />
                        </ScrollView>
                    </KeyboardAvoidingView>
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
        height: SHEET_HEIGHT,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
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
        marginBottom: spacing.md,
    },
    headerTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    dateText: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        marginTop: 2,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.primary,
        marginBottom: spacing.md,
        marginTop: spacing.sm,
    },
    scaleContainer: {
        marginBottom: spacing.lg,
    },
    sliderHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    sliderLabelContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    scaleLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    scaleValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    slider: {
        width: '100%',
        height: 40,
    },
    scaleLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -8,
        paddingHorizontal: spacing.xs,
    },
    scaleLabelMin: {
        fontSize: 11,
        color: looviColors.text.tertiary,
        fontWeight: '500',
    },
    scaleLabelMax: {
        fontSize: 11,
        color: looviColors.text.tertiary,
        fontWeight: '500',
    },
    section: {
        marginTop: spacing.md,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.primary,
        marginBottom: spacing.sm,
    },
    triggerInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: spacing.md,
        fontSize: 15,
        color: looviColors.text.primary,
        minHeight: 60,
    },
    notesInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: spacing.md,
        fontSize: 15,
        color: looviColors.text.primary,
        minHeight: 100,
        marginBottom: spacing.lg,
    },
    saveButton: {
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 16,
        borderRadius: 24,
        alignItems: 'center',
        marginTop: spacing.md,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default JournalEntryModal;
