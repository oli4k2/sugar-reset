/**
 * LoginScreen
 * 
 * User login with sky theme.
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

type LoginScreenProps = {
    navigation: NativeStackNavigationProp<any, 'Login'>;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
    const { signIn, signInWithGoogle, signInWithApple } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [appleLoading, setAppleLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        setLoading(true);
        setError('');

        try {
            const success = await signIn(email.trim(), password);
            if (success) {
                // Navigate to Main app after successful login
                console.log('Login successful - navigating to Main');
                navigation.getParent()?.reset({
                    index: 0,
                    routes: [{ name: 'Main' }],
                });
            } else {
                setError('Invalid email or password');
                setLoading(false);
            }
        } catch (err: any) {
            console.error('Login error:', err);
            const errorMessage = err?.message || 'Failed to sign in';
            if (errorMessage.includes('invalid-credential') || errorMessage.includes('user-not-found')) {
                setError('Invalid email or password');
            } else if (errorMessage.includes('too-many-requests')) {
                setError('Too many attempts. Try again later.');
            } else {
                setError('Login failed. Please try again.');
            }
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setError('');

        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            const idToken = userInfo.data?.idToken;

            if (idToken) {
                const success = await signInWithGoogle(idToken);
                if (success) {
                    navigation.getParent()?.reset({
                        index: 0,
                        routes: [{ name: 'Main' }],
                    });
                } else {
                    setError('Google sign-in failed');
                }
            } else {
                setError('Failed to get Google ID token');
            }
        } catch (err: any) {
            console.error('Google sign-in error:', err);
            setError('Google sign-in failed. Please try again.');
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleAppleSignIn = async () => {
        setAppleLoading(true);
        setError('');

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
                if (success) {
                    navigation.getParent()?.reset({
                        index: 0,
                        routes: [{ name: 'Main' }],
                    });
                } else {
                    setError('Apple sign-in failed');
                }
            } else {
                setError('Failed to get Apple identity token');
            }
        } catch (err: any) {
            if (err.code === 'ERR_CANCELED') {
                // User canceled, do nothing
            } else {
                console.error('Apple sign-in error:', err);
                setError('Apple sign-in failed. Please try again.');
            }
        } finally {
            setAppleLoading(false);
        }
    };

    const handleForgotPassword = () => {
        navigation.navigate('ForgotPassword');
    };

    const handleSignUp = () => {
        navigation.navigate('SignUp');
    };

    const isValid = email.includes('@') && password.length >= 6;
    const isAppleSignInAvailable = Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 13;

    return (
        <LooviBackground variant="coralTop">
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
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.emoji}>👋</Text>
                            <Text style={styles.title}>Welcome back</Text>
                            <Text style={styles.subtitle}>Sign in to continue your journey</Text>
                        </View>

                        {/* Social Sign-In */}
                        {Platform.OS === 'ios' && isAppleSignInAvailable && (
                            <TouchableOpacity
                                style={[styles.socialButton, styles.appleButton]}
                                onPress={handleAppleSignIn}
                                disabled={appleLoading || loading || googleLoading}
                                activeOpacity={0.8}
                            >
                                {appleLoading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                                        <Text style={styles.socialButtonText}>Continue with Apple</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.socialButton, styles.googleButton]}
                            onPress={handleGoogleSignIn}
                            disabled={googleLoading || loading || appleLoading}
                            activeOpacity={0.8}
                        >
                            {googleLoading ? (
                                <ActivityIndicator size="small" color={looviColors.text.primary} />
                            ) : (
                                <>
                                    <Ionicons name="logo-google" size={20} color="#EA4335" />
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

                        {/* Form */}
                        <GlassCard variant="light" padding="lg" style={styles.formCard}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="your@email.com"
                                    placeholderTextColor={looviColors.text.muted}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="••••••••"
                                    placeholderTextColor={looviColors.text.muted}
                                    secureTextEntry
                                    autoCapitalize="none"
                                />
                            </View>

                            <TouchableOpacity onPress={handleForgotPassword}>
                                <Text style={styles.forgotText}>Forgot password?</Text>
                            </TouchableOpacity>

                            {error ? (
                                <Text style={styles.errorText}>{error}</Text>
                            ) : null}
                        </GlassCard>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[styles.loginButton, !isValid && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={!isValid || loading}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.loginButtonText}>
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Text>
                        </TouchableOpacity>

                        {/* Sign Up Link */}
                        <View style={styles.signUpRow}>
                            <Text style={styles.signUpText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={handleSignUp}>
                                <Text style={styles.signUpLink}>Sign Up</Text>
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
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing['2xl'],
    },
    emoji: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '400',
        color: looviColors.text.secondary,
    },
    formCard: {
        marginBottom: spacing.xl,
    },
    inputGroup: {
        marginBottom: spacing.lg,
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
    forgotText: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.accent.primary,
        textAlign: 'right',
    },
    loginButton: {
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: spacing.xl,
        shadowColor: looviColors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
    },
    loginButtonDisabled: {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        shadowOpacity: 0,
    },
    loginButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    signUpRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    signUpText: {
        fontSize: 14,
        fontWeight: '400',
        color: looviColors.text.tertiary,
    },
    signUpLink: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.accent.primary,
    },
    errorText: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.accent.error,
        textAlign: 'center',
        marginTop: spacing.md,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: 14,
        borderRadius: borderRadius.lg,
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
    socialButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    googleButtonText: {
        color: looviColors.text.primary,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.xl,
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
});
