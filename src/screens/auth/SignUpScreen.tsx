/**
 * SignUpScreen
 * 
 * User registration with Google/Apple/Email magic link.
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { spacing, borderRadius } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';
import { GlassCard } from '../../components/GlassCard';
import { useAuth } from '../../hooks/useAuth';
import { useUserData } from '../../context/UserDataContext';

type SignUpScreenProps = {
    navigation: NativeStackNavigationProp<any, 'SignUp'>;
};

type AuthStep = 'options' | 'email' | 'email-sent';

export default function SignUpScreen({ navigation }: SignUpScreenProps) {
    const { 
        signInWithGoogle, 
        signInWithApple, 
        sendEmailLink,
        error: authError,
        clearError,
    } = useAuth();
    const { onboardingData } = useUserData();

    const [step, setStep] = useState<AuthStep>('options');
    const [email, setEmail] = useState('');
    const [googleLoading, setGoogleLoading] = useState(false);
    const [appleLoading, setAppleLoading] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [error, setError] = useState('');

    // Get nickname from onboarding
    const nickname = onboardingData?.nickname || '';

    // Sync auth error
    useEffect(() => {
        if (authError) {
            setError(authError.message);
        }
    }, [authError]);

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setError('');
        clearError();

        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            const idToken = userInfo.data?.idToken;

            if (idToken) {
                const success = await signInWithGoogle(idToken);
                if (!success) {
                    setError('Google sign-in failed');
                }
            } else {
                setError('Failed to get Google ID token');
            }
        } catch (err: any) {
            console.error('Google sign-in error:', err);
            if (err.code !== 'SIGN_IN_CANCELLED' && err.code !== '12501') {
                setError('Google sign-in failed. Please try again.');
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleAppleSignIn = async () => {
        setAppleLoading(true);
        setError('');
        clearError();

        try {
            const nonce = Math.random().toString(36).substring(2, 10);
            const hashedNonce = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                nonce
            );

            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
                nonce: hashedNonce,
            });

            if (credential.identityToken) {
                const success = await signInWithApple(credential.identityToken, nonce);
                if (!success) {
                    setError('Apple sign-in failed');
                }
            } else {
                setError('Failed to get Apple identity token');
            }
        } catch (err: any) {
            if (err.code !== 'ERR_CANCELED') {
                console.error('Apple sign-in error:', err);
                setError('Apple sign-in failed. Please try again.');
            }
        } finally {
            setAppleLoading(false);
        }
    };

    const handleSendEmailLink = async () => {
        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }

        setEmailLoading(true);
        setError('');
        clearError();

        try {
            const success = await sendEmailLink(email.trim().toLowerCase());
            if (success) {
                setStep('email-sent');
            } else {
                // If sendEmailLink returns false, the error is already set in authError
                // But we should also check if there's a specific error message
                if (authError && authError.message) {
                    setError(authError.message);
                } else {
                    setError('Failed to send email. Please try again.');
                }
            }
        } catch (err: any) {
            console.error('Send email link error:', err);
            setError(err.message || 'Failed to send email. Please try again.');
        } finally {
            setEmailLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 'email' || step === 'email-sent') {
            setStep('options');
            setError('');
            clearError();
        } else {
            navigation.goBack();
        }
    };

    const handleLogin = () => {
        navigation.navigate('Login');
    };

    const isAppleSignInAvailable = Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 13;
    const isLoading = googleLoading || appleLoading || emailLoading;
    const isEmailValid = email.includes('@') && email.includes('.');

    return (
        <LooviBackground variant="blueTop">
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    style={styles.keyboardView}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Back Button */}
                        {step !== 'options' && (
                            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                                <Ionicons name="arrow-back" size={24} color={looviColors.text.primary} />
                            </TouchableOpacity>
                        )}

                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.emoji}>
                                {step === 'email-sent' ? '📬' : '🌱'}
                            </Text>
                            <Text style={styles.title}>
                                {step === 'email-sent' 
                                    ? 'Check your email!'
                                    : `Create account${nickname ? `, ${nickname}` : ''}!`
                                }
                            </Text>
                            <Text style={styles.subtitle}>
                                {step === 'options' && 'Sign up to start your sugar-free journey'}
                                {step === 'email' && 'Enter your email to receive a sign-in link'}
                                {step === 'email-sent' && `We sent a magic link to ${email}`}
                            </Text>
                        </View>

                        {step === 'options' && (
                            <>
                                {/* Sign-In Options */}
                                <View style={styles.buttonsContainer}>
                                    {Platform.OS === 'ios' && isAppleSignInAvailable && (
                                        <TouchableOpacity
                                            style={[styles.socialButton, styles.appleButton]}
                                            onPress={handleAppleSignIn}
                                            disabled={isLoading}
                                            activeOpacity={0.8}
                                        >
                                            {appleLoading ? (
                                                <ActivityIndicator size="small" color="#FFFFFF" />
                                            ) : (
                                                <>
                                                    <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
                                                    <Text style={styles.socialButtonText}>Continue with Apple</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        style={[styles.socialButton, styles.googleButton]}
                                        onPress={handleGoogleSignIn}
                                        disabled={isLoading}
                                        activeOpacity={0.8}
                                    >
                                        {googleLoading ? (
                                            <ActivityIndicator size="small" color={looviColors.text.primary} />
                                        ) : (
                                            <>
                                                <Ionicons name="logo-google" size={22} color="#EA4335" />
                                                <Text style={[styles.socialButtonText, styles.googleButtonText]}>
                                                    Continue with Google
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>

                                    {/* Divider */}
                                    <View style={styles.dividerContainer}>
                                        <View style={styles.dividerLine} />
                                        <Text style={styles.dividerText}>or</Text>
                                        <View style={styles.dividerLine} />
                                    </View>

                                    {/* Email Option */}
                                    <TouchableOpacity
                                        style={[styles.socialButton, styles.emailButton]}
                                        onPress={() => setStep('email')}
                                        disabled={isLoading}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="mail-outline" size={22} color={looviColors.text.primary} />
                                        <Text style={[styles.socialButtonText, styles.emailButtonText]}>
                                            Continue with Email
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {step === 'email' && (
                            <>
                                <GlassCard variant="light" padding="lg" style={styles.formCard}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Email Address</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={email}
                                            onChangeText={setEmail}
                                            placeholder="your@email.com"
                                            placeholderTextColor={looviColors.text.muted}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            autoFocus
                                        />
                                    </View>

                                    {error ? (
                                        <Text style={styles.errorText}>{error}</Text>
                                    ) : null}
                                </GlassCard>

                                <TouchableOpacity
                                    style={[styles.primaryButton, !isEmailValid && styles.primaryButtonDisabled]}
                                    onPress={handleSendEmailLink}
                                    disabled={!isEmailValid || emailLoading}
                                    activeOpacity={0.8}
                                >
                                    {emailLoading ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>Send Magic Link</Text>
                                    )}
                                </TouchableOpacity>

                                <Text style={styles.emailHint}>
                                    We'll send you a link to sign in instantly — no password needed!
                                </Text>
                            </>
                        )}

                        {step === 'email-sent' && (
                            <>
                                <View style={styles.emailSentCard}>
                                    <Ionicons name="checkmark-circle" size={64} color={looviColors.accent.success} />
                                    <Text style={styles.emailSentText}>
                                        Click the link in your email to sign in.
                                    </Text>
                                    <Text style={styles.emailSentHint}>
                                        The link will expire in 1 hour. Check your spam folder if you don't see it.
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.resendButton}
                                    onPress={handleSendEmailLink}
                                    disabled={emailLoading}
                                >
                                    {emailLoading ? (
                                        <ActivityIndicator size="small" color={looviColors.accent.primary} />
                                    ) : (
                                        <Text style={styles.resendText}>Resend email</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.changeEmailButton}
                                    onPress={() => setStep('email')}
                                >
                                    <Text style={styles.changeEmailText}>Use a different email</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Error Message (for social sign-in) */}
                        {step === 'options' && error ? (
                            <Text style={styles.errorText}>{error}</Text>
                        ) : null}

                        {/* Terms */}
                        {step !== 'email-sent' && (
                            <Text style={styles.terms}>
                                By signing up, you agree to our Terms of Service and Privacy Policy
                            </Text>
                        )}

                        {/* Login Link */}
                        <View style={styles.loginRow}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={handleLogin}>
                                <Text style={styles.loginLink}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing['2xl'],
        paddingBottom: spacing['2xl'],
        flexGrow: 1,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing['2xl'],
    },
    emoji: {
        fontSize: 64,
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'center',
        paddingHorizontal: spacing.lg,
    },
    buttonsContainer: {
        marginBottom: spacing.xl,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        paddingVertical: 16,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.md,
    },
    appleButton: {
        backgroundColor: '#000000',
    },
    googleButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    emailButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    socialButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    googleButtonText: {
        color: looviColors.text.primary,
    },
    emailButtonText: {
        color: looviColors.text.primary,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    dividerText: {
        fontSize: 13,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        marginHorizontal: spacing.md,
    },
    formCard: {
        marginBottom: spacing.xl,
    },
    inputGroup: {
        marginBottom: spacing.sm,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: looviColors.text.secondary,
        marginBottom: spacing.sm,
    },
    input: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: 16,
        fontWeight: '400',
        color: looviColors.text.primary,
    },
    primaryButton: {
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: spacing.lg,
        shadowColor: looviColors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
    },
    primaryButtonDisabled: {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        shadowOpacity: 0,
    },
    primaryButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    emailHint: {
        fontSize: 13,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    emailSentCard: {
        alignItems: 'center',
        paddingVertical: spacing['2xl'],
        marginBottom: spacing.xl,
    },
    emailSentText: {
        fontSize: 16,
        fontWeight: '500',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginTop: spacing.lg,
    },
    emailSentHint: {
        fontSize: 14,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        textAlign: 'center',
        marginTop: spacing.sm,
        paddingHorizontal: spacing.lg,
    },
    resendButton: {
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    resendText: {
        fontSize: 15,
        fontWeight: '600',
        color: looviColors.accent.primary,
    },
    changeEmailButton: {
        alignItems: 'center',
        paddingVertical: spacing.sm,
        marginBottom: spacing.xl,
    },
    changeEmailText: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.text.tertiary,
    },
    errorText: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.accent.error,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    terms: {
        fontSize: 12,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    loginText: {
        fontSize: 14,
        fontWeight: '400',
        color: looviColors.text.tertiary,
    },
    loginLink: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.accent.primary,
    },
});
