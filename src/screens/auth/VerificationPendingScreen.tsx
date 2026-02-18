import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthContext } from '../../context/AuthContext';
import { useAuth } from '../../hooks/useAuth';
import LooviBackground, { looviColors } from '../../components/LooviBackground';
import { GlassCard } from '../../components/GlassCard';
import { spacing, borderRadius } from '../../theme';

export default function VerificationPendingScreen() {
    const { user, firebaseUser, refreshUser } = useAuthContext();
    const { signOut } = useAuth();
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);

    const handleResend = async () => {
        if (!firebaseUser) return;
        setSending(true);
        try {
            Alert.alert('Deprecated', 'Please use the OTP verification flow instead.');
            Alert.alert('Email Sent', 'Please check your inbox (and spam folder) for the verification link.');
        } catch (error) {
            Alert.alert('Error', 'Failed to send verification email. Please try again later.');
        } finally {
            setSending(false);
        }
    };

    const handleCheckVerification = async () => {
        setVerifying(true);
        try {
            // Reload user and force context update
            await refreshUser();
        } catch (error) {
            Alert.alert('Not Verified', 'We still can\'t confirm your email. Please verify and click this button again.');
        } finally {
            setVerifying(false);
        }
    };

    return (
        <LooviBackground variant="blueTop">
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.emoji}>✉️</Text>
                    </View>

                    <Text style={styles.title}>Verify your email</Text>

                    <GlassCard variant="light" padding="lg" style={styles.card}>
                        <Text style={styles.description}>
                            We sent a verification link to:
                        </Text>
                        <Text style={styles.email}>{user?.email || firebaseUser?.email}</Text>

                        <View style={styles.divider} />

                        <Text style={styles.infoText}>
                            Please check your email and click the link to activate your account. You won't be able to access the app until you verify.
                        </Text>
                    </GlassCard>

                    <TouchableOpacity
                        style={styles.verifyButton}
                        onPress={handleCheckVerification}
                        disabled={verifying}
                    >
                        {verifying ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.verifyButtonText}>I've Verified My Email</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.resendButton}
                        onPress={handleResend}
                        disabled={sending}
                    >
                        <Text style={styles.resendButtonText}>
                            {sending ? 'Sending...' : 'Resend Email'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LooviBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    iconContainer: {
        width: 100,
        height: 100,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    emoji: {
        fontSize: 48,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.xl,
        textAlign: 'center',
    },
    card: {
        width: '100%',
        marginBottom: spacing.xl,
    },
    description: {
        fontSize: 16,
        color: looviColors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    email: {
        fontSize: 18,
        fontWeight: '600',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginVertical: spacing.md,
    },
    infoText: {
        fontSize: 14,
        color: looviColors.text.tertiary,
        textAlign: 'center',
        lineHeight: 20,
    },
    verifyButton: {
        backgroundColor: looviColors.accent.primary,
        width: '100%',
        paddingVertical: 16,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        marginBottom: spacing.md,
        shadowColor: looviColors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    verifyButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    resendButton: {
        paddingVertical: 12,
    },
    resendButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: looviColors.text.secondary,
    },
});
