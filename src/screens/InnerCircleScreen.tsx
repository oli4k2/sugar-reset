/**
 * InnerCircleScreen - Talk to Inner Circle
 * 
 * Dedicated screen for contacting inner circle during cravings
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthContext } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { notificationService } from '../services/notificationService';

const calmColors = {
    darkBg: '#1A1A2E',
    darkerBg: '#0F0F1E',
    text: '#E8E8F0',
    textSecondary: '#B0B0C8',
    accent: '#7FB069',
    cardBg: 'rgba(255, 255, 255, 0.08)',
    inputBg: 'rgba(255, 255, 255, 0.05)',
};

export default function InnerCircleScreen() {
    const navigation = useNavigation();
    const { user } = useAuthContext();
    const { onboardingData } = useUserData();
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

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
                    'Message Sent',
                    `Your Inner Circle (${result.notifiedCount} friend${result.notifiedCount > 1 ? 's' : ''}) has been notified. Stay strong! 💪`,
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
                setMessage('');
            } else if (result.notifiedCount === 0) {
                Alert.alert(
                    'No Friends Yet',
                    'Add friends to your Inner Circle so they can support you when you need it!',
                    [
                        { text: 'Later', style: 'cancel' },
                        { text: 'Add Friends', onPress: () => navigation.navigate('Social') }
                    ]
                );
            } else {
                Alert.alert('Error', 'Failed to send message. Please try again.');
            }
        } catch (error) {
            console.error('SOS error:', error);
            Alert.alert('Error', 'Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[calmColors.darkerBg, calmColors.darkBg, calmColors.darkerBg]}
                locations={[0, 0.5, 1]}
                style={styles.gradient}
            />

            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Feather name="arrow-left" size={24} color={calmColors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Inner Circle</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <View style={styles.iconBg}>
                            <Feather name="users" size={48} color={calmColors.accent} />
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Reach Out for Support</Text>
                    <Text style={styles.subtitle}>
                        Your inner circle is here to help. Send them a quick message.
                    </Text>

                    {/* Message Input */}
                    <View style={styles.inputCard}>
                        <Text style={styles.inputLabel}>Your Message (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Having a tough moment..."
                            placeholderTextColor={calmColors.textSecondary}
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            numberOfLines={4}
                            maxLength={200}
                            textAlignVertical="top"
                        />
                        <Text style={styles.charCount}>{message.length}/200</Text>
                    </View>

                    {/* Quick Templates */}
                    <View style={styles.templatesContainer}>
                        <Text style={styles.templatesTitle}>Quick Messages</Text>
                        <TouchableOpacity
                            style={styles.template}
                            onPress={() => setMessage("Having a craving right now. Could use some support.")}
                        >
                            <Text style={styles.templateText}>
                                Having a craving right now. Could use some support.
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.template}
                            onPress={() => setMessage("Need someone to talk to for a few minutes.")}
                        >
                            <Text style={styles.templateText}>
                                Need someone to talk to for a few minutes.
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.template}
                            onPress={() => setMessage("Struggling today. Just wanted to reach out.")}
                        >
                            <Text style={styles.templateText}>
                                Struggling today. Just wanted to reach out.
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Send Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
                        onPress={handleSendSOS}
                        disabled={isSending}
                        activeOpacity={0.85}
                    >
                        <Feather name="send" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.sendButtonText}>
                            {isSending ? 'Sending...' : 'Send to Inner Circle'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: calmColors.darkerBg,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: calmColors.text,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        paddingBottom: spacing.xxl,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: spacing.xl,
    },
    iconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: calmColors.cardBg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: calmColors.accent,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: calmColors.text,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: calmColors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: spacing.xxl,
    },
    inputCard: {
        width: '100%',
        backgroundColor: calmColors.cardBg,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: calmColors.text,
        marginBottom: spacing.sm,
    },
    input: {
        backgroundColor: calmColors.inputBg,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        fontSize: 15,
        color: calmColors.text,
        minHeight: 100,
        marginBottom: spacing.xs,
    },
    charCount: {
        fontSize: 12,
        color: calmColors.textSecondary,
        textAlign: 'right',
    },
    templatesContainer: {
        width: '100%',
    },
    templatesTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: calmColors.text,
        marginBottom: spacing.md,
    },
    template: {
        backgroundColor: calmColors.cardBg,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    templateText: {
        fontSize: 14,
        color: calmColors.textSecondary,
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.lg,
    },
    sendButton: {
        backgroundColor: calmColors.accent,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: borderRadius.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    sendButtonDisabled: {
        opacity: 0.6,
    },
    sendButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});



