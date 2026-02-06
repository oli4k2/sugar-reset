/**
 * SimpleJournalModal Component
 * 
 * Simple modal for adding/editing journal text entries only.
 * No wellness tracking sliders - just a text field.
 */

import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import { JournalEntry } from '../context/UserDataContext';

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

    // Pre-populate when editing
    useEffect(() => {
        if (visible) {
            if (existingEntry) {
                setNotes(existingEntry.notes || '');
            } else {
                setNotes('');
            }
        }
    }, [visible, existingEntry]);

    const handleSave = async () => {
        if (!notes.trim()) {
            return;
        }

        setIsSaving(true);
        try {
            await onSave(notes.trim());
            setNotes('');
            onClose();
        } catch (error) {
            console.error('Error saving journal:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setNotes('');
        onClose();
    };

    const isEditing = !!existingEntry;
    const dateFormatted = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.container}>
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
                            <Text style={[
                                styles.saveButtonText,
                                (!notes.trim() || isSaving) && styles.saveButtonTextDisabled
                            ]}>
                                {isSaving ? 'Saving...' : 'Save'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
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

                        {/* Tips */}
                        <View style={styles.tipsContainer}>
                            <Text style={styles.tipsTitle}>💡 Journal Ideas</Text>
                            <Text style={styles.tip}>• How did you handle cravings today?</Text>
                            <Text style={styles.tip}>• What made you feel good?</Text>
                            <Text style={styles.tip}>• Any challenges you overcame?</Text>
                            <Text style={styles.tip}>• What are you grateful for?</Text>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
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
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
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
