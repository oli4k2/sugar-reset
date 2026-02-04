/**
 * NotificationSettingsModal
 * 
 * A beautifully designed modal for notification preferences
 * with a single toggle to enable/disable all notifications.
 * Now actually connected to the notification service.
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Switch,
    Dimensions,
    Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { looviColors } from './LooviBackground';
import { spacing, borderRadius } from '../theme';
import { notificationService } from '../services/notificationService';
import { useAuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');

interface NotificationSettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

export function NotificationSettingsModal({ visible, onClose }: NotificationSettingsModalProps) {
    const { user } = useAuthContext();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Load settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const stored = await AsyncStorage.getItem('notification_settings');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    // Check if all notifications are enabled (for backwards compatibility)
                    if (typeof parsed.allEnabled === 'boolean') {
                        setNotificationsEnabled(parsed.allEnabled);
                    } else {
                        // Legacy format: check if any individual setting is enabled
                        const anyEnabled = parsed.pledge ?? parsed.journal ?? parsed.streak ?? parsed.community ?? true;
                        setNotificationsEnabled(anyEnabled);
                    }
                }
            } catch (e) {
                console.warn('Failed to load notification settings:', e);
            }
        };
        if (visible) {
            loadSettings();
        }
    }, [visible]);

    const handleToggle = async (value: boolean) => {
        if (isLoading) return;

        setIsLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            if (value) {
                // Enable notifications
                if (user?.id) {
                    // Register for push notifications
                    const token = await notificationService.registerForPushNotifications(user.id);

                    if (token) {
                        // Schedule daily reminder at 8 PM
                        await notificationService.scheduleDailyReminder(20, 0);
                        console.log('✅ Notifications enabled with token:', token);
                    } else {
                        // Permission denied or not on device
                        Alert.alert(
                            'Permission Required',
                            'Please enable notifications in your device settings to receive reminders.',
                            [{ text: 'OK' }]
                        );
                        setIsLoading(false);
                        return; // Don't update state if we couldn't enable
                    }
                }
            } else {
                // Disable notifications
                if (user?.id) {
                    await notificationService.disableAllNotifications(user.id);
                    console.log('✅ Notifications disabled');
                }
            }

            setNotificationsEnabled(value);

            // Save the unified setting
            const newSettings = {
                allEnabled: value,
                // Also set individual settings for backwards compatibility
                pledge: value,
                journal: value,
                streak: value,
                community: value,
            };

            await AsyncStorage.setItem('notification_settings', JSON.stringify(newSettings));

            Haptics.notificationAsync(
                value ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
            );
        } catch (error) {
            console.error('Failed to toggle notifications:', error);
            Alert.alert('Error', 'Failed to update notification settings. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <BlurView intensity={40} tint="dark" style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Gradient Header */}
                    <LinearGradient
                        colors={[looviColors.coralOrange, '#E8A87C']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.header}
                    >
                        {/* Close Button */}
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={24} color="rgba(255,255,255,0.9)" />
                        </TouchableOpacity>

                        {/* Icon */}
                        <View style={styles.iconContainer}>
                            <Text style={styles.headerIcon}>🔔</Text>
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>Stay on Track</Text>

                        {/* Subtitle with statistics */}
                        <Text style={styles.subtitle}>
                            Users with notifications enabled are{' '}
                            <Text style={styles.highlight}>3x more likely</Text>
                            {' '}to achieve their sugar-free goals
                        </Text>

                        {/* Stats badge */}
                        <View style={styles.statsBadge}>
                            <Ionicons name="trending-up" size={14} color="#22C55E" />
                            <Text style={styles.statsText}>91% success rate with daily reminders</Text>
                        </View>
                    </LinearGradient>

                    {/* Single Toggle Setting */}
                    <View style={styles.settingsContainer}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingIcon}>
                                <Text style={styles.emoji}>✨</Text>
                            </View>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingLabel}>All Notifications</Text>
                                <Text style={styles.settingDescription}>
                                    Daily reminders, streak milestones & community support
                                </Text>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={handleToggle}
                                disabled={isLoading}
                                trackColor={{
                                    false: 'rgba(0,0,0,0.1)',
                                    true: looviColors.accent.success
                                }}
                                thumbColor="#FFFFFF"
                                ios_backgroundColor="rgba(0,0,0,0.1)"
                            />
                        </View>
                    </View>

                    {/* Status indicator */}
                    <View style={styles.statusContainer}>
                        {notificationsEnabled ? (
                            <View style={styles.statusBadge}>
                                <Ionicons name="checkmark-circle" size={16} color={looviColors.accent.success} />
                                <Text style={[styles.statusText, { color: looviColors.accent.success }]}>
                                    You're all set for success!
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.statusBadge}>
                                <Ionicons name="notifications-off" size={16} color={looviColors.text.muted} />
                                <Text style={styles.statusText}>
                                    Notifications are disabled
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContainer: {
        width: width - 40,
        maxWidth: 400,
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 20,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 24,
        paddingHorizontal: 24,
        alignItems: 'center',
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    headerIcon: {
        fontSize: 36,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    highlight: {
        fontWeight: '700',
        color: '#FFFFFF',
    },
    statsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 16,
        gap: 6,
    },
    statsText: {
        fontSize: 12,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    settingsContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        backgroundColor: 'rgba(242, 228, 216, 0.3)',
        borderRadius: borderRadius.lg,
        paddingHorizontal: 16,
    },
    settingIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(242, 228, 216, 0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    emoji: {
        fontSize: 24,
    },
    settingInfo: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 17,
        fontWeight: '600',
        color: looviColors.text.primary,
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 13,
        color: looviColors.text.secondary,
        lineHeight: 18,
    },
    statusContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        paddingBottom: 24,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusText: {
        fontSize: 14,
        color: looviColors.text.muted,
        fontWeight: '500',
    },
});

export default NotificationSettingsModal;
