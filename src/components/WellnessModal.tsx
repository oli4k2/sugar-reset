/**
 * WellnessModal - Shared wellness tracking component
 *
 * Full bottom-sheet modal for logging mood, energy, focus, sleep, and thoughts.
 * Gesture-driven: drag handle to dismiss.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    Animated,
    PanResponder,
    Dimensions,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import { healthService } from '../services/healthService';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.92;
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.3;

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
                const autoSyncSleep = async () => {
                    try {
                        const sleepHrs = await healthService.getTodaySleep();
                        if (sleepHrs > 0) setSleepHours(Math.round(sleepHrs));
                    } catch (e) { }
                };
                autoSyncSleep();
            }
        }
    }, [visible, existingData]);

    // ── Bottom-sheet gesture ──────────────────────────────────────────────────
    const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
    const currentSnap = useRef(0);
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
            currentSnap.current = 0;
            Animated.spring(translateY, {
                toValue: 0,
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
                    currentSnap.current = 0;
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
    // ─────────────────────────────────────────────────────────────────────────

    const handleSave = () => {
        Keyboard.dismiss();
        onSave({ date: selectedDate, mood, energy, focus, sleepHours, thoughts: thoughts.trim() || undefined });
        dismiss();
    };

    const handleSyncSleep = async () => {
        setSyncing(true);
        try {
            const sleepHrs = await healthService.getTodaySleep();
            if (sleepHrs > 0) {
                setSleepHours(Math.round(sleepHrs));
                Alert.alert('Synced!', `Sleep data: ${Math.round(sleepHrs)} hours`);
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
                <TouchableOpacity style={styles.syncButton} onPress={handleSyncSleep} disabled={syncing}>
                    <Ionicons name={syncing ? 'hourglass' : 'sync'} size={14} color={looviColors.skyBlueDark} />
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
        <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={dismiss}>
                    <View style={StyleSheet.absoluteFill} />
                </TouchableWithoutFeedback>

                <Animated.View style={[styles.modalContent, { transform: [{ translateY }] }]}>
                    {/* Drag handle */}
                    <View style={styles.dragHandleArea} {...panResponder.panHandlers}>
                        <View style={styles.dragHandle} />
                    </View>

                    {/* Close button */}
                    <TouchableOpacity style={styles.closeButton} onPress={dismiss}>
                        <Feather name="x" size={20} color={looviColors.text.secondary} />
                    </TouchableOpacity>

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

                            {renderScaleSlider(mood, setMood, 'happy-outline', 'Mood', looviColors.coralOrange)}
                            {renderScaleSlider(energy, setEnergy, 'flash-outline', 'Energy', '#F5B461')}
                            {renderScaleSlider(focus, setFocus, 'bulb-outline', 'Focus', looviColors.coralDark)}
                            {renderSleepSlider()}

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

                            <TouchableOpacity
                                style={[styles.saveButton, isFutureDate && styles.saveButtonDisabled]}
                                onPress={handleSave}
                                disabled={isFutureDate}
                            >
                                <Text style={styles.saveButtonText}>
                                    {isFutureDate ? "Can't Save" : 'Save Check-in'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.cancelButton} onPress={dismiss}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </Animated.View>
            </View>

            {Platform.OS === 'ios' && (
                <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
                    <View style={styles.keyboardAccessory}>
                        <TouchableOpacity style={styles.doneButton} onPress={() => Keyboard.dismiss()}>
                            <Text style={styles.doneButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </InputAccessoryView>
            )}
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: SHEET_HEIGHT,
        width: '100%',
    },
    dragHandleArea: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 40,
    },
    dragHandle: {
        width: 44,
        height: 5,
        backgroundColor: '#CCCCCC',
        borderRadius: 3,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 20,
        zIndex: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flexGrow: 0,
    },
    scrollContent: {
        padding: spacing.xl,
        paddingTop: spacing.md,
    },
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
