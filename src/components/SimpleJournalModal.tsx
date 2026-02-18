/**
 * SimpleJournalModal Component
 *
 * Simple modal for adding/editing journal text entries only.
 * Gesture-driven bottom sheet: drag handle to dismiss.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated,
    PanResponder,
    Dimensions,
    TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import { JournalEntry } from '../context/UserDataContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.35;

interface SimpleJournalModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (notes: string) => Promise<void>;
    existingEntry?: JournalEntry | null;
    date?: Date;
}

export default function SimpleJournalModal({
    visible,
    onClose,
    onSave,
    existingEntry,
    date = new Date(),
}: SimpleJournalModalProps) {
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (visible) {
            setNotes(existingEntry ? existingEntry.notes || '' : '');
        }
    }, [visible, existingEntry]);

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

    const handleSave = async () => {
        if (!notes.trim()) return;
        setIsSaving(true);
        try {
            await onSave(notes.trim());
            setNotes('');
            dismiss();
        } catch (error) {
            console.error('Error saving journal:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setNotes('');
        dismiss();
    };

    const isEditing = !!existingEntry;
    const dateFormatted = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
    });

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={handleClose}>
                    <View style={StyleSheet.absoluteFill} />
                </TouchableWithoutFeedback>

                <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
                    {/* Drag handle */}
                    <View style={styles.dragHandleArea} {...panResponder.panHandlers}>
                        <View style={styles.dragHandle} />
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={looviColors.text.secondary} />
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <Text style={styles.title}>
                                {isEditing ? 'Edit Entry' : 'New Journal Entry'}
                            </Text>
                            <Text style={styles.dateText}>{dateFormatted}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleSave}
                            style={[styles.saveButton, (!notes.trim() || isSaving) && styles.saveButtonDisabled]}
                            disabled={!notes.trim() || isSaving}
                        >
                            <Text style={[styles.saveButtonText, (!notes.trim() || isSaving) && styles.saveButtonTextDisabled]}>
                                {isSaving ? 'Saving...' : 'Save'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>How are you feeling?</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Write about your day, cravings, victories, or anything on your mind..."
                                    placeholderTextColor={looviColors.text.muted}
                                    value={notes}
                                    onChangeText={setNotes}
                                    multiline
                                    textAlignVertical="top"
                                    autoFocus={!existingEntry}
                                />
                            </View>

                            <View style={styles.tipsContainer}>
                                <Text style={styles.tipsTitle}>💡 Journal Ideas</Text>
                                <Text style={styles.tip}>• How did you handle cravings today?</Text>
                                <Text style={styles.tip}>• What made you feel good?</Text>
                                <Text style={styles.tip}>• Any challenges you overcame?</Text>
                                <Text style={styles.tip}>• What are you grateful for?</Text>
                            </View>
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    closeButton: {
        padding: spacing.xs,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    dateText: {
        fontSize: 13,
        color: looviColors.text.secondary,
        marginTop: 2,
    },
    saveButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.accent.primary,
    },
    saveButtonTextDisabled: {
        color: looviColors.text.muted,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: spacing.xl + 40,
    },
    inputContainer: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: looviColors.text.primary,
        marginBottom: spacing.sm,
    },
    textInput: {
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        fontSize: 15,
        color: looviColors.text.primary,
        minHeight: 150,
        lineHeight: 22,
    },
    tipsContainer: {
        backgroundColor: `${looviColors.accent.primary}08`,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
    },
    tipsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.primary,
        marginBottom: spacing.sm,
    },
    tip: {
        fontSize: 13,
        color: looviColors.text.secondary,
        lineHeight: 20,
    },
});
