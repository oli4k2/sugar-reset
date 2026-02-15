/**
 * NicknameScreen
 * 
 * Asks user for their name/nickname.
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing, borderRadius } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';
import { GlassCard } from '../../components/GlassCard';
import { useUserData } from '../../context/UserDataContext';
import ProgressBar from '../../components/ProgressBar';
import { validateDisplayName, sanitizeDisplayName } from '../../utils/inputSanitizer';

type NicknameScreenProps = {
    navigation: NativeStackNavigationProp<any, 'Nickname'>;
};

export default function NicknameScreen({ navigation }: NicknameScreenProps) {
    const [nickname, setNickname] = useState('');
    const { updateOnboardingData } = useUserData();

    const handleContinue = async () => {
        const trimmed = nickname.trim() || 'Friend';
        
        // Validate and sanitize the nickname
        const validation = validateDisplayName(trimmed);
        if (!validation.valid) {
            Alert.alert('Invalid Name', validation.error || 'Please enter a valid name');
            return;
        }
        
        const sanitized = sanitizeDisplayName(trimmed);
        await updateOnboardingData({ nickname: sanitized });
        navigation.navigate('Promise', { nickname: sanitized });
    };

    const isButtonEnabled = nickname.trim().length > 0;

    return (
        <LooviBackground variant="coralTop">
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    style={styles.keyboardView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.content}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.emoji}>👋</Text>
                            <Text style={styles.title}>What should we call you?</Text>
                            <Text style={styles.subtitle}>
                                This helps personalize your journey
                            </Text>
                        </View>

                        {/* Input */}
                        <GlassCard variant="light" padding="none" style={styles.inputCard}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your name or nickname"
                                placeholderTextColor={looviColors.text.muted}
                                value={nickname}
                                onChangeText={setNickname}
                                autoCapitalize="words"
                                autoCorrect={false}
                                maxLength={20}
                            />
                        </GlassCard>

                        <Text style={styles.hint}>
                            This is just for you – we won't share it anywhere
                        </Text>

                        {/* Spacer */}
                        <View style={styles.spacer} />
                    </View>

                    {/* Bottom Button */}
                    <View style={styles.bottomContainer}>
                        <TouchableOpacity
                            style={[
                                styles.continueButton,
                                !isButtonEnabled && styles.continueButtonDisabled,
                            ]}
                            onPress={handleContinue}
                            activeOpacity={0.8}
                            disabled={!isButtonEnabled}
                        >
                            <Text style={[
                                styles.continueButtonText,
                                !isButtonEnabled && styles.continueButtonTextDisabled,
                            ]}>
                                Continue
                            </Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LooviBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing['3xl'],
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing['2xl'],
    },
    emoji: {
        fontSize: 56,
        marginBottom: spacing.md,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'center',
    },
    inputCard: {
        marginBottom: spacing.md,
    },
    input: {
        fontSize: 18,
        fontWeight: '500',
        color: looviColors.text.primary,
        textAlign: 'center',
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    hint: {
        fontSize: 13,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        textAlign: 'center',
    },
    spacer: {
        flex: 1,
    },
    bottomContainer: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing.md,
        paddingBottom: spacing['2xl'],
    },
    continueButton: {
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: looviColors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
    },
    continueButtonDisabled: {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        shadowOpacity: 0,
    },
    continueButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    continueButtonTextDisabled: {
        color: looviColors.text.muted,
    },
});
