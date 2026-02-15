/**
 * SOSButton
 * 
 * Emergency support button that sends an SOS alert to Inner Circle friends.
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import { notificationService } from '../services/notificationService';
import { useAuthContext } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { handleError } from '../utils/errorHandler';

interface SOSButtonProps {
    style?: any;
    size?: 'small' | 'large';
}

export function SOSButton({ style, size = 'small' }: SOSButtonProps) {
    const { user } = useAuthContext();
    const { onboardingData } = useUserData();
    const [showModal, setShowModal] = useState(false);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSOSPress = () => {
        setShowModal(true);
    };

    const handleSendSOS = async () => {
        if (!user) {
            Alert.alert('Error', 'You must be logged in to send an SOS');
            return;
        }

        setIsSending(true);
        try {
            const userName = onboardingData.nickname || user.displayName || 'A friend';
            const result = await notificationService.sendSOSAlert(
                user.id,
                userName,
                message.trim() || undefined
            );

            if (result.success && result.notifiedCount > 0) {
                Alert.alert(
                    'SOS Sent',
                    `Your Inner Circle (${result.notifiedCount} friend${result.notifiedCount > 1 ? 's' : ''}) has been notified. Stay strong! 💪`,
                    [{ text: 'OK', onPress: () => setShowModal(false) }]
                );
            } else if (result.notifiedCount === 0) {
                Alert.alert(
                    'No Friends to Notify',
                    'Add friends to your Inner Circle so they can support you when you need it!',
                    [{ text: 'OK', onPress: () => setShowModal(false) }]
                );
            } else {
                Alert.alert('Error', 'Failed to send SOS. Please try again.');
            }
        } catch (error) {
            handleError(error, 'Failed to send SOS. Please try again.', 'SOSButton');
        } finally {
            setIsSending(false);
            setMessage('');
        }
    };

    const handleCancel = () => {
        setShowModal(false);
        setMessage('');
    };

    const isSmall = size === 'small';

    return (
        <>
            <TouchableOpacity
                style={[
                    styles.button,
                    isSmall ? styles.buttonSmall : styles.buttonLarge,
                    style,
                ]}
                onPress={handleSOSPress}
                activeOpacity={0.8}
            >
                <Ionicons
                    name="alert-circle"
                    size={isSmall ? 20 : 28}
                    color="#FFFFFF"
                />
                {!isSmall && <Text style={styles.buttonText}>SOS</Text>}
            </TouchableOpacity>

            <Modal
                visible={showModal}
                transparent
                animationType="fade"
                onRequestClose={handleCancel}
            >
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Ionicons name="alert-circle" size={40} color={looviColors.accent.error} />
                            <Text style={styles.modalTitle}>Need Support?</Text>
                            <Text style={styles.modalSubtitle}>
                                Send an SOS to your Inner Circle. They'll receive a notification to check in on you.
                            </Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Add a message (optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Having strong cravings..."
                                placeholderTextColor={looviColors.text.muted}
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                maxLength={200}
                            />
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleCancel}
                                disabled={isSending}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
                                onPress={handleSendSOS}
                                disabled={isSending}
                            >
                                {isSending ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons name="send" size={18} color="#FFFFFF" />
                                        <Text style={styles.sendText}>Send SOS</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.disclaimer}>
                            Your friends will receive a push notification
                        </Text>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: looviColors.accent.error,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: looviColors.accent.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonSmall: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    buttonLarge: {
        flexDirection: 'row',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.xl,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    modal: {
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius['2xl'],
        padding: spacing.xl,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginTop: spacing.md,
    },
    modalSubtitle: {
        fontSize: 14,
        color: looviColors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.sm,
        lineHeight: 20,
    },
    inputContainer: {
        marginBottom: spacing.lg,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.primary,
        marginBottom: spacing.sm,
    },
    input: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        fontSize: 14,
        color: looviColors.text.primary,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.tertiary,
    },
    sendButton: {
        flex: 1,
        flexDirection: 'row',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: looviColors.accent.error,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.7,
    },
    sendText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    disclaimer: {
        fontSize: 11,
        color: looviColors.text.muted,
        textAlign: 'center',
        marginTop: spacing.md,
    },
});

export default SOSButton;
