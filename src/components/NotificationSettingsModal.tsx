/**
 * NotificationSettingsModal
 * 
 * A beautifully designed modal for notification preferences
 * with persuasive messaging to encourage enabling notifications.
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
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { looviColors } from './LooviBackground';
import { spacing, borderRadius } from '../theme';

const { width } = Dimensions.get('window');

interface NotificationSettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

interface NotificationSetting {
    id: string;
    icon: string;
    label: string;
    description: string;
    key: string;
}

const NOTIFICATION_SETTINGS: NotificationSetting[] = [
    {
        id: 'pledge',
        icon: '🌅',
        label: 'Morning Pledge',
        description: 'Start each day with intention',
        key: 'pledge',
    },
    {
        id: 'journal',
        icon: '🌙',
        label: 'Evening Reflection',
        description: 'Reflect on your daily progress',
        key: 'journal',
    },
    {
        id: 'streak',
        icon: '🔥',
        label: 'Streak Milestones',
        description: 'Celebrate your achievements',
        key: 'streak',
    },
    {
        id: 'community',
        icon: '💬',
        label: 'Community Support',
        description: 'Get encouragement from others',
        key: 'community',
    },
];

export function NotificationSettingsModal({ visible, onClose }: NotificationSettingsModalProps) {
    const [settings, setSettings] = useState<Record<string, boolean>>({
        pledge: true,
        journal: true,
        streak: true,
        community: true,
    });

    // Load settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const stored = await AsyncStorage.getItem('notification_settings');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setSettings({
                        pledge: parsed.pledge ?? true,
                        journal: parsed.journal ?? true,
                        streak: parsed.streak ?? true,
                        community: parsed.community ?? true,
                    });
                }
            } catch (e) {
                console.warn('Failed to load notification settings:', e);
            }
        };
        if (visible) {
            loadSettings();
        }
    }, [visible]);

    const handleToggle = async (key: string, value: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        try {
            await AsyncStorage.setItem('notification_settings', JSON.stringify(newSettings));
        } catch (e) {
            console.warn('Failed to save notification settings:', e);
        }
    };

    const enabledCount = Object.values(settings).filter(Boolean).length;
    const allEnabled = enabledCount === NOTIFICATION_SETTINGS.length;

    const handleEnableAll = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const newSettings = {
            pledge: true,
            journal: true,
            streak: true,
            community: true,
        };
        setSettings(newSettings);
        try {
            await AsyncStorage.setItem('notification_settings', JSON.stringify(newSettings));
        } catch (e) {
            console.warn('Failed to save notification settings:', e);
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

                    {/* Settings List */}
                    <View style={styles.settingsContainer}>
                        {NOTIFICATION_SETTINGS.map((setting, index) => (
                            <View
                                key={setting.id}
                                style={[
                                    styles.settingRow,
                                    index < NOTIFICATION_SETTINGS.length - 1 && styles.settingRowBorder,
                                ]}
                            >
                                <View style={styles.settingIcon}>
                                    <Text style={styles.emoji}>{setting.icon}</Text>
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingLabel}>{setting.label}</Text>
                                    <Text style={styles.settingDescription}>{setting.description}</Text>
                                </View>
                                <Switch
                                    value={settings[setting.key]}
                                    onValueChange={(value) => handleToggle(setting.key, value)}
                                    trackColor={{
                                        false: 'rgba(0,0,0,0.1)',
                                        true: looviColors.accent.success
                                    }}
                                    thumbColor="#FFFFFF"
                                    ios_backgroundColor="rgba(0,0,0,0.1)"
                                />
                            </View>
                        ))}
                    </View>

                    {/* Enable All Button */}
                    {!allEnabled && (
                        <TouchableOpacity
                            style={styles.enableAllButton}
                            onPress={handleEnableAll}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[looviColors.accent.success, '#5fa352']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.enableAllGradient}
                            >
                                <Ionicons name="notifications" size={18} color="#FFFFFF" />
                                <Text style={styles.enableAllText}>Enable All Reminders</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}

                    {/* Status indicator */}
                    <View style={styles.statusContainer}>
                        {allEnabled ? (
                            <View style={styles.statusBadge}>
                                <Ionicons name="checkmark-circle" size={16} color={looviColors.accent.success} />
                                <Text style={[styles.statusText, { color: looviColors.accent.success }]}>
                                    You're all set for success!
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.statusText}>
                                {enabledCount} of {NOTIFICATION_SETTINGS.length} reminders enabled
                            </Text>
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
        paddingTop: 8,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    settingRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    settingIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(242, 228, 216, 0.5)', // warmBeige with opacity
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    emoji: {
        fontSize: 22,
    },
    settingInfo: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.primary,
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: 13,
        color: looviColors.text.secondary,
    },
    enableAllButton: {
        marginHorizontal: 20,
        marginTop: 8,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    enableAllGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    enableAllText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    statusContainer: {
        alignItems: 'center',
        paddingVertical: 16,
        paddingBottom: 20,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusText: {
        fontSize: 13,
        color: looviColors.text.muted,
        fontWeight: '500',
    },
});

export default NotificationSettingsModal;
