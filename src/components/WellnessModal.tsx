/**
 * WellnessModal - Shared wellness tracking component
 * 
 * Full-screen modal for logging mood, energy, focus, sleep, and thoughts.
 * Uses the same slider pattern as JournalEntryModal (which works without glitching).
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    InputAccessoryView,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import { healthService } from '../services/healthService';

export interface WellnessLog {
    date: string;
    mood: number;
    energy: number;
    focus: number;
    sleepHours: number;
    thoughts?: string;
}

interface WellnessModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (log: WellnessLog) => void;
    selectedDate: string;
    existingData?: WellnessLog | null;
}

const INPUT_ACCESSORY_ID = 'wellness-thoughts-input';

export function WellnessModal({
    visible,
    onClose,
    onSave,
    selectedDate,
    existingData
}: WellnessModalProps) {
    const [mood, setMood] = useState(0);
    const [energy, setEnergy] = useState(0);
    const [focus, setFocus] = useState(0);
    const [sleepHours, setSleepHours] = useState(0);
    const [thoughts, setThoughts] = useState('');
    const [syncing, setSyncing] = useState(false);

    // Reset or prefill values when modal opens
    useEffect(() => {
        if (visible) {
            if (existingData) {
                setMood(existingData.mood);
                setEnergy(existingData.energy);
                setFocus(existingData.focus);
                setSleepHours(existingData.sleepHours);
                setThoughts(existingData.thoughts || '');
            } else {
                setMood(0);
                setEnergy(0);
                setFocus(0);
                setSleepHours(0);
                setThoughts('');

                // Auto-sync sleep data from Apple Health when opening fresh
                const autoSyncSleep = async () => {
                    try {
                        const sleepHrs = await healthService.getTodaySleep();
                        if (sleepHrs > 0) {
                            const rounded = Math.round(sleepHrs);
                            setSleepHours(rounded);
                            console.log('✅ Auto-synced sleep data:', rounded, 'hours');
                        }
                    } catch (e) {
                        // Silently fail - user can still manually sync
                        console.log('Auto-sync sleep failed:', e);
                    }
                };
                autoSyncSleep();
            }
        }
    }, [visible, existingData]);

    const handleSave = () => {
        Keyboard.dismiss();
        onSave({
            date: selectedDate,
            mood,
            energy,
            focus,
            sleepHours,
            thoughts: thoughts.trim() || undefined,
        });
        onClose();
    };

    const handleSyncSleep = async () => {
        setSyncing(true);
        try {
            const sleepHrs = await healthService.getTodaySleep();
            if (sleepHrs > 0) {
                const rounded = Math.round(sleepHrs);
                setSleepHours(rounded);
                Alert.alert('Synced!', `Sleep data: ${rounded} hours`);
            } else {
                Alert.alert('No Data', 'No sleep data found in Health app.');
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to sync sleep data.');
        }
        setSyncing(false);
    };

    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    const isFutureDate = selectedDate > new Date().toISOString().split('T')[0];

    // Render a scale slider (same pattern as JournalEntryModal)
    const renderScaleSlider = (
        value: number,
        setValue: (v: number) => void,
        iconName: keyof typeof Ionicons.glyphMap,
        label: string,
        color: string
    ) => (
        <View style={styles.scaleContainer}>
            <View style={styles.sliderHeader}>
                <View style={[styles.iconContainer, { backgroundColor: value === 0 ? '#F0F0F0' : `${color}15` }]}>
                    <Ionicons name={iconName} size={18} color={value === 0 ? '#CCC' : color} />
                </View>
                <View style={styles.sliderLabelContainer}>
                    <Text style={styles.scaleLabel}>{label}</Text>
                    <Text style={[styles.scaleValue, { color: value === 0 ? '#CCC' : color }]}>
                        {value === 0 ? 'Slide to set' : `${value}/5`}
                    </Text>
                </View>
            </View>
            <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={5}
                step={1}
                value={value === 0 ? 1 : value}
                onValueChange={setValue}
                minimumTrackTintColor={value === 0 ? '#E0E0E0' : color}
                maximumTrackTintColor="rgba(0,0,0,0.1)"
                thumbTintColor={value === 0 ? '#CCC' : color}
            />
        </View>
    );

    // Render sleep slider
    const renderSleepSlider = () => (
        <View style={styles.scaleContainer}>
            <View style={styles.sliderHeader}>
                <View style={[styles.iconContainer, { backgroundColor: sleepHours === 0 ? '#F0F0F0' : `${looviColors.skyBlueDark}15` }]}>
                    <Ionicons name="bed-outline" size={18} color={sleepHours === 0 ? '#CCC' : looviColors.skyBlueDark} />
                </View>
                <View style={styles.sliderLabelContainer}>
                    <Text style={styles.scaleLabel}>Sleep</Text>
                    <Text style={[styles.scaleValue, { color: sleepHours === 0 ? '#CCC' : looviColors.skyBlueDark }]}>
                        {sleepHours === 0 ? 'Slide to set' : `${sleepHours}h`}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.syncButton}
                    onPress={handleSyncSleep}
                    disabled={syncing}
                >
                    <Ionicons
                        name={syncing ? "hourglass" : "sync"}
                        size={14}
                        color={looviColors.skyBlueDark}
                    />
                    <Text style={[styles.syncText, { color: looviColors.skyBlueDark }]}>Sync</Text>
                </TouchableOpacity>
            </View>
            <Slider
                style={styles.slider}
                minimumValue={4}
                maximumValue={12}
                step={1}
                value={sleepHours === 0 ? 7 : sleepHours}
                onValueChange={setSleepHours}
                minimumTrackTintColor={sleepHours === 0 ? '#E0E0E0' : looviColors.skyBlueDark}
                maximumTrackTintColor="rgba(0,0,0,0.1)"
                thumbTintColor={sleepHours === 0 ? '#CCC' : looviColors.skyBlueDark}
            />
            <View style={styles.scaleLabels}>
                <Text style={styles.scaleLabelText}>4h</Text>
                <Text style={styles.scaleLabelText}>12h</Text>
            </View>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.overlay}>
                        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                            <View style={styles.modalContent}>
                                {/* Close Button */}
                                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                    <Feather name="x" size={20} color={looviColors.text.secondary} />
                                </TouchableOpacity>

                                <ScrollView
                                    style={styles.scrollView}
                                    contentContainerStyle={styles.scrollContent}
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    {/* Header */}
                                    <View style={styles.header}>
                                        <View style={styles.headerIcon}>
                                            <Ionicons name="heart" size={26} color={looviColors.coralOrange} />
                                        </View>
                                        <View style={styles.headerTextContainer}>
                                            <Text style={styles.title}>Daily Check-in</Text>
                                            <Text style={styles.subtitle}>
                                                {isFutureDate ? "Can't log future" : isToday ? 'How are you feeling today?' : 'Past entry'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Mood Slider */}
                                    {renderScaleSlider(mood, setMood, 'happy-outline', 'Mood', looviColors.coralOrange)}

                                    {/* Energy Slider */}
                                    {renderScaleSlider(energy, setEnergy, 'flash-outline', 'Energy', '#F5B461')}

                                    {/* Focus Slider */}
                                    {renderScaleSlider(focus, setFocus, 'bulb-outline', 'Focus', looviColors.coralDark)}

                                    {/* Sleep Slider */}
                                    {renderSleepSlider()}

                                    {/* Journal Thoughts Section */}
                                    <View style={styles.thoughtsSection}>
                                        <View style={styles.thoughtsHeader}>
                                            <Ionicons name="create-outline" size={16} color={looviColors.text.secondary} />
                                            <Text style={styles.thoughtsLabel}>Your Thoughts</Text>
                                            <Text style={styles.thoughtsOptional}>(optional)</Text>
                                        </View>
                                        <TextInput
                                            style={styles.thoughtsInput}
                                            placeholder="Any reflections on today..."
                                            placeholderTextColor="rgba(0,0,0,0.4)"
                                            value={thoughts}
                                            onChangeText={setThoughts}
                                            multiline
                                            maxLength={300}
                                            textAlignVertical="top"
                                            returnKeyType="done"
                                            blurOnSubmit={true}
                                            inputAccessoryViewID={Platform.OS === 'ios' ? INPUT_ACCESSORY_ID : undefined}
                                        />
                                    </View>

                                    {/* Save Button */}
                                    <TouchableOpacity
                                        style={[styles.saveButton, isFutureDate && styles.saveButtonDisabled]}
                                        onPress={handleSave}
                                        disabled={isFutureDate}
                                    >
                                        <Text style={styles.saveButtonText}>
                                            {isFutureDate ? "Can't Save" : 'Save Check-in'}
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Cancel Button */}
                                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>

            {/* iOS Keyboard Done Button */}
            {Platform.OS === 'ios' && (
                <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
                    <View style={styles.keyboardAccessory}>
                        <TouchableOpacity
                            style={styles.doneButton}
                            onPress={() => Keyboard.dismiss()}
                        >
                            <Text style={styles.doneButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </InputAccessoryView>
            )}
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
        maxWidth: 400,
        overflow: 'hidden',
    },
    closeButton: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    scrollView: {
        flexGrow: 0,
    },
    scrollContent: {
        padding: spacing.xl,
        paddingTop: spacing.xl + 8,
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(232, 168, 124, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    headerTextContainer: {
        flex: 1,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '400',
        color: looviColors.text.secondary,
        marginTop: 2,
    },
    // Wellness Slider Styles (same as JournalEntryModal)
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
    scaleLabelText: {
        fontSize: 11,
        color: looviColors.text.tertiary,
        fontWeight: '500',
    },
    // Sync button
    syncButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.md,
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
    },
    syncText: {
        fontSize: 11,
        fontWeight: '600',
    },
    // Thoughts Section
    thoughtsSection: {
        marginTop: spacing.sm,
        marginBottom: spacing.lg,
    },
    thoughtsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
        gap: spacing.xs,
    },
    thoughtsLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    thoughtsOptional: {
        fontSize: 12,
        fontWeight: '400',
        color: looviColors.text.muted,
    },
    thoughtsInput: {
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        borderRadius: 12,
        padding: spacing.md,
        fontSize: 14,
        color: looviColors.text.primary,
        minHeight: 80,
    },
    // Buttons
    saveButton: {
        backgroundColor: looviColors.coralOrange,
        paddingVertical: 14,
        borderRadius: 24,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    cancelButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.text.tertiary,
    },
    // Keyboard Accessory
    keyboardAccessory: {
        backgroundColor: '#F8F8F8',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    doneButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
    },
    doneButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.coralOrange,
    },
});

export default WellnessModal;
