/**
 * JournalEntryModal Component
 * 
 * Modal for creating/editing daily journal entries with wellness tracking
 * Includes mood, energy, focus, and sleep scales
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
    ScrollView,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';

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
            handleClose();
        } catch (error) {
            console.error('Failed to save journal entry:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setMood(3);
        setEnergy(3);
        setFocus(3);
        setSleep(7);
        setNotes('');
        setWhatTriggered('');
        onClose();
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
            <View style={styles.scaleLabels}>
                <Text style={styles.scaleLabelMin}>Low</Text>
                <Text style={styles.scaleLabelMax}>High</Text>
            </View>
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
            animationType="fade"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.overlay}>
                        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                            <View style={styles.modalContent}>
                                <ScrollView
                                    style={styles.scrollView}
                                    contentContainerStyle={styles.scrollContent}
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    {/* Header */}
                                    <View style={styles.header}>
                                        <Text style={styles.title}>
                                            📝 {(() => {
                                                const now = new Date();
                                                const currentHour = now.getHours();
                                                return currentHour >= 18 ? 'Evening Reflection' : 'Wellness Reflection';
                                            })()}
                                        </Text>
                                        <Text style={styles.dateText}>{dateString}</Text>
                                    </View>

                                    {/* How are you feeling? Section */}
                                    <Text style={styles.sectionTitle}>How are you feeling?</Text>

                                    {/* Mood Slider */}
                                    {renderScaleSlider(mood, setMood, 'happy-outline', 'Mood', looviColors.accent.primary)}

                                    {/* Energy Slider */}
                                    {renderScaleSlider(energy, setEnergy, 'flash-outline', 'Energy', looviColors.accent.warning)}

                                    {/* Focus Slider */}
                                    {renderScaleSlider(focus, setFocus, 'bulb-outline', 'Focus', '#8B5CF6')}

                                    {/* Sync Health Button */}
                                    <TouchableOpacity style={styles.syncHealthButton} onPress={() => {/* TODO: Implement health sync */}}>
                                        <Ionicons name="fitness-outline" size={16} color={looviColors.accent.primary} />
                                        <Text style={styles.syncHealthText}>Sync with Apple Health</Text>
                                    </TouchableOpacity>

                                    {/* Sleep Slider */}
                                    {renderSleepSlider()}

                                    {/* What triggered it? - Only show for slip-ups */}
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

                                    {/* Notes - Optional */}
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

                                    {/* Buttons */}
                                    <View style={styles.buttonContainer}>
                                        <TouchableOpacity
                                            style={[styles.button, styles.saveButton]}
                                            onPress={handleSave}
                                            disabled={isSaving}
                                        >
                                            <Text style={styles.saveButtonText}>
                                                {isSaving ? 'Saving...' : 'Save'}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.button, styles.cancelButton]}
                                            onPress={handleClose}
                                        >
                                            <Text style={styles.cancelButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    keyboardAvoidingView: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        maxHeight: '90%',
        width: '100%',
        overflow: 'hidden',
    },
    scrollView: {
        flexGrow: 0,
    },
    scrollContent: {
        padding: spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: 4,
    },
    dateText: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.text.tertiary,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.primary,
        marginBottom: spacing.md,
        marginTop: spacing.sm,
    },
    // Wellness Slider Styles
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
    // Sync Health Button
    syncHealthButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: `${looviColors.accent.primary}10`,
        borderRadius: 12,
        marginBottom: spacing.md,
        gap: spacing.xs,
    },
    syncHealthText: {
        fontSize: 13,
        fontWeight: '600',
        color: looviColors.accent.primary,
    },
    // Section
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
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
        padding: spacing.md,
        fontSize: 15,
        color: looviColors.text.primary,
        minHeight: 60,
    },
    notesInput: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
        padding: spacing.md,
        fontSize: 15,
        color: looviColors.text.primary,
        minHeight: 80,
    },
    buttonContainer: {
        marginTop: spacing.lg,
        gap: spacing.sm,
    },
    button: {
        paddingVertical: 14,
        borderRadius: 24,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    saveButton: {
        backgroundColor: looviColors.accent.primary,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    cancelButton: {
        backgroundColor: 'transparent',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.text.tertiary,
    },
});

export default JournalEntryModal;
