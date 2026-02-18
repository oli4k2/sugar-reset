/**
 * SignUpScreen
 * 
 * User registration with Google/Apple/Email OTP.
 */

import React, { useState, useEffect, useRef } from 'react';
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
    Dimensions,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
let GoogleSignin: any = null;
try {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (e) {
    console.warn('Google Sign-In native module not available (Expo Go)');
}
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { spacing, borderRadius } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';
import { GlassCard } from '../../components/GlassCard';
import { useAuth } from '../../hooks/useAuth';
import { useUserData } from '../../context/UserDataContext';
import { useAuthContext } from '../../context/AuthContext';

type SignUpScreenProps = {
    navigation: NativeStackNavigationProp<any, 'SignUp'>;
};

type AuthStep = 'options' | 'email' | 'otp';

export default function SignUpScreen({ navigation }: SignUpScreenProps) {
    const {
        signInWithGoogle,
        signInWithApple,
        sendOTP,
        verifyOTP,
        error: authError,
        clearError,
    } = useAuth();
    const { onboardingData } = useUserData();

    const [step, setStep] = useState<AuthStep>('options');
    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [appleLoading, setAppleLoading] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const otpInputRefs = useRef<(TextInput | null)[]>([]);

    // Get nickname from onboarding
    const nickname = onboardingData?.nickname || '';

    // Sync auth error
    useEffect(() => {
        if (authError) {
            setError(authError.message);
        }
    }, [authError]);

    // Check if user was successfully signed in (auth state changed)
    const { isAuthenticated } = useAuthContext();
    useEffect(() => {
        if (isAuthenticated && step === 'otp') {
            console.log('✅ User authenticated, navigation will happen automatically');
        }
    }, [isAuthenticated, step]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleGoogleSignIn = async () => {
        if (!GoogleSignin) {
            setError('Google Sign-In is not available in Expo Go. Use email instead.');
            return;
        }
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

    const handleSendOTP = async () => {
        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }

        setEmailLoading(true);
        setError('');
        clearError();

        try {
            const success = await sendOTP(email.trim().toLowerCase());
            if (success) {
                setStep('otp');
                setResendCooldown(60);
                setOtpCode(['', '', '', '', '', '']);
                // Focus first OTP input after transition
                setTimeout(() => otpInputRefs.current[0]?.focus(), 300);
            } else {
                if (authError && authError.message) {
                    setError(authError.message);
                } else {
                    setError('Failed to send code. Please try again.');
                }
            }
        } catch (err: any) {
            console.error('Send OTP error:', err);
            setError(err.message || 'Failed to send code. Please try again.');
        } finally {
            setEmailLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendCooldown > 0) return;

        setError('');
        clearError();
        setEmailLoading(true);

        try {
            const success = await sendOTP(email.trim().toLowerCase());
            if (success) {
                setResendCooldown(60);
                setOtpCode(['', '', '', '', '', '']);
                setError('');
            }
        } catch (err: any) {
            console.error('Resend OTP error:', err);
        } finally {
            setEmailLoading(false);
        }
    };

    const handleOTPChange = (text: string, index: number) => {
        // Only allow digits
        const digit = text.replace(/[^0-9]/g, '');

        if (digit.length <= 1) {
            const newCode = [...otpCode];
            newCode[index] = digit;
            setOtpCode(newCode);

            // Auto-advance to next input
            if (digit && index < 5) {
                otpInputRefs.current[index + 1]?.focus();
            }

            // Auto-submit when all 6 digits are entered
            if (digit && index === 5) {
                const fullCode = newCode.join('');
                if (fullCode.length === 6) {
                    handleVerifyOTP(fullCode);
                }
            }
        } else if (digit.length === 6) {
            // Handle paste of full code
            const digits = digit.split('');
            setOtpCode(digits);
            otpInputRefs.current[5]?.focus();
            handleVerifyOTP(digit);
        }
    };

    const handleOTPKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otpCode[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
            const newCode = [...otpCode];
            newCode[index - 1] = '';
            setOtpCode(newCode);
        }
    };

    const handleVerifyOTP = async (code?: string) => {
        const otpString = code || otpCode.join('');
        if (otpString.length !== 6) {
            setError('Please enter the complete 6-digit code');
            return;
        }

        setOtpLoading(true);
        setError('');
        clearError();

        try {
            const success = await verifyOTP(
                email.trim().toLowerCase(),
                otpString,
                nickname || undefined
            );
            if (success) {
                console.log('✅ Sign-up successful!');
            }
        } catch (err: any) {
            console.error('Verify OTP error:', err);
        } finally {
            setOtpLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 'email' || step === 'otp') {
            if (step === 'otp') {
                setStep('email');
            } else {
                setStep('options');
            }
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
    const isLoading = googleLoading || appleLoading || emailLoading || otpLoading;
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
                        contentContainerStyle={[styles.scrollContent, { marginTop: -Dimensions.get('window').height * 0.05 }]}
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
                            <Image
                                source={require('../../../assets/images/craveless-logo-auth.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                            <Text style={styles.title}>
                                {step === 'otp'
                                    ? 'Enter your code'
                                    : `Create account${nickname ? `, ${nickname}` : ''}!`
                                }
                            </Text>
                            <Text style={styles.subtitle}>
                                {step === 'options' && 'Sign up to start your sugar-free journey'}
                                {step === 'email' && 'Enter your email to receive a verification code'}
                                {step === 'otp' && `We sent a 6-digit code to ${email}`}
                            </Text>
                        </View>

                        {step === 'options' && (
                            <>
                                {/* Sign-In Options */}
                                <View style={styles.buttonsContainer}>
                                    <View style={styles.socialButtonsRow}>
                                        {Platform.OS === 'ios' && isAppleSignInAvailable && (
                                            <TouchableOpacity
                                                style={[styles.socialButton, styles.socialButtonInRow, styles.appleButton]}
                                                onPress={handleAppleSignIn}
                                                disabled={isLoading}
                                                activeOpacity={0.8}
                                            >
                                                {appleLoading ? (
                                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                                ) : (
                                                    <>
                                                        <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                                                        <Text style={styles.socialButtonText}>Apple</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        )}

                                        <TouchableOpacity
                                            style={[styles.socialButton, styles.socialButtonInRow, styles.googleButton]}
                                            onPress={handleGoogleSignIn}
                                            disabled={isLoading}
                                            activeOpacity={0.8}
                                        >
                                            {googleLoading ? (
                                                <ActivityIndicator size="small" color={looviColors.text.primary} />
                                            ) : (
                                                <>
                                                    <Ionicons name="logo-google" size={20} color="#EA4335" />
                                                    <Text style={[styles.socialButtonText, styles.googleButtonText]}>
                                                        Google
                                                    </Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>

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
                                    onPress={handleSendOTP}
                                    disabled={!isEmailValid || emailLoading}
                                    activeOpacity={0.8}
                                >
                                    {emailLoading ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>Send Code</Text>
                                    )}
                                </TouchableOpacity>

                                <Text style={styles.emailHint}>
                                    We'll send you a 6-digit code to verify your email — no password needed!
                                </Text>
                            </>
                        )}

                        {step === 'otp' && (
                            <>
                                {/* OTP Input */}
                                <View style={styles.otpContainer}>
                                    <View style={styles.otpRow}>
                                        {otpCode.map((digit, index) => (
                                            <TextInput
                                                key={index}
                                                ref={(ref) => { otpInputRefs.current[index] = ref; }}
                                                style={[
                                                    styles.otpInput,
                                                    digit ? styles.otpInputFilled : null,
                                                ]}
                                                value={digit}
                                                onChangeText={(text) => handleOTPChange(text, index)}
                                                onKeyPress={({ nativeEvent }) => handleOTPKeyPress(nativeEvent.key, index)}
                                                keyboardType="number-pad"
                                                maxLength={index === 0 ? 6 : 1}
                                                selectTextOnFocus
                                                textContentType="oneTimeCode"
                                                autoFocus={index === 0}
                                            />
                                        ))}
                                    </View>

                                    {error ? (
                                        <Text style={[styles.errorText, { marginTop: spacing.md }]}>{error}</Text>
                                    ) : null}
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.primaryButton,
                                        otpCode.join('').length !== 6 && styles.primaryButtonDisabled,
                                    ]}
                                    onPress={() => handleVerifyOTP()}
                                    disabled={otpCode.join('').length !== 6 || otpLoading}
                                    activeOpacity={0.8}
                                >
                                    {otpLoading ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>Verify & Create Account</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.resendButton}
                                    onPress={handleResendOTP}
                                    disabled={resendCooldown > 0 || emailLoading}
                                >
                                    {emailLoading ? (
                                        <ActivityIndicator size="small" color={looviColors.accent.primary} />
                                    ) : (
                                        <Text style={[
                                            styles.resendText,
                                            resendCooldown > 0 && styles.resendTextDisabled,
                                        ]}>
                                            {resendCooldown > 0
                                                ? `Resend code in ${resendCooldown}s`
                                                : 'Resend code'}
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.changeEmailButton}
                                    onPress={() => {
                                        setStep('email');
                                        setOtpCode(['', '', '', '', '', '']);
                                        setError('');
                                    }}
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
                        {step !== 'otp' && (
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
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.screen.horizontal,
        paddingVertical: spacing['2xl'],
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
        marginBottom: spacing.lg,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
    },
    buttonsContainer: {
        marginBottom: spacing.xl,
    },
    socialButtonsRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: 0,
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
    socialButtonInRow: {
        flex: 1,
        marginBottom: 0,
        paddingVertical: 14,
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
        marginVertical: spacing.sm,
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
    // OTP Styles
    otpContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    otpRow: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
    },
    otpInput: {
        width: 48,
        height: 56,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 2,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    otpInputFilled: {
        borderColor: looviColors.accent.primary,
        backgroundColor: 'rgba(232, 168, 124, 0.1)',
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
    resendTextDisabled: {
        color: looviColors.text.tertiary,
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
