/**
 * WelcomeScreen
 * 
 * First screen: Animated logo splash, then main content.
 * Shows SugarReset logo with fade animation for 2 seconds,
 * then reveals Get Started / Log In buttons.
 */

import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Image,
    Dimensions,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';
import { useUserData } from '../../context/UserDataContext';

type WelcomeScreenProps = {
    navigation: NativeStackNavigationProp<any, 'Welcome'>;
};

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
    const [showSplash, setShowSplash] = useState(true);

    // Splash animations
    const logoFade = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.8)).current;
    const splashOpacity = useRef(new Animated.Value(1)).current;

    // Content animations
    const contentFade = useRef(new Animated.Value(0)).current;
    const contentSlide = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        // Phase 1: Animate logo (fade in + scale up)
        Animated.sequence([
            Animated.delay(200),
            Animated.parallel([
                Animated.timing(logoFade, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.spring(logoScale, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]),
            // Phase 2: Hold for a moment
            Animated.delay(2500),
            // Phase 3: Fade out splash
            Animated.timing(splashOpacity, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setShowSplash(false);
            // Animate content in
            Animated.parallel([
                Animated.timing(contentFade, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(contentSlide, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    }, []);

    const handleGetStarted = () => {
        navigation.navigate('QuizIntro');
    };

    const handleLogin = () => {
        navigation.navigate('Auth' as any, {
            screen: 'Login',
            params: { fromOnboardingWelcome: true },
        });
    };

    // DEV: Skip onboarding for testing
    const { updateOnboardingData, completeOnboarding } = useUserData();
    const handleDevSkip = async () => {
        try {
            console.log('DEV SKIP: Starting...');
            await updateOnboardingData({
                plan: 'cold_turkey',
                goals: ['health', 'energy'],
                nickname: 'Tester',
                dailySugarGrams: 50,
                startDate: new Date().toISOString(),
            });
            console.log('DEV SKIP: Data updated, completing...');
            await completeOnboarding();
            console.log('DEV SKIP: Complete! Navigating...');
            // Navigate to main app
            navigation.reset({
                index: 0,
                routes: [{ name: 'Main' as any }],
            });
        } catch (error) {
            console.error('DEV SKIP Error:', error);
            Alert.alert('Dev Skip Error', String(error));
        }
    };

    return (
        <LooviBackground variant="mixed">
            {/* Splash Screen with Logo Animation */}
            {showSplash && (
                <Animated.View style={[styles.splashContainer, { opacity: splashOpacity }]}>
                    <Animated.Image
                        source={require('../../../assets/images/craveless-logo.png')}
                        style={[
                            styles.splashLogo,
                            {
                                opacity: logoFade,
                                transform: [{ scale: logoScale }],
                            },
                        ]}
                        resizeMode="contain"
                    />
                </Animated.View>
            )}

            {/* Main Content (after splash) */}
            {!showSplash && (
                <SafeAreaView style={styles.container}>
                    <Animated.View
                        style={[
                            styles.content,
                            {
                                opacity: contentFade,
                                transform: [{ translateY: contentSlide }],
                            },
                        ]}
                    >
                        {/* Logo Area with dedicated fade animation */}
                        <Animated.View
                            style={[
                                styles.logoContainer,
                                { opacity: contentFade }
                            ]}
                        >
                            <Animated.Image
                                source={require('../../../assets/images/craveless-logo.png')}
                                style={[
                                    styles.logoSmall,
                                    {
                                        opacity: contentFade,
                                        transform: [{
                                            scale: contentFade.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0.8, 1]
                                            })
                                        }]
                                    }
                                ]}
                                resizeMode="contain"
                            />
                        </Animated.View>

                        {/* Spacer */}
                        <View style={styles.spacer} />

                        {/* Buttons */}
                        <View style={styles.buttonsContainer}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleGetStarted}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.primaryButtonText}>Get Started</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={handleLogin}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.secondaryButtonText}>
                                    Already have an account? Log In
                                </Text>
                            </TouchableOpacity>

                            {/* DEV: Skip button for testing */}
                            {__DEV__ && (
                                <TouchableOpacity
                                    style={styles.devSkipButton}
                                    onPress={handleDevSkip}
                                    activeOpacity={0.5}
                                    hitSlop={{ top: 20, bottom: 20, left: 40, right: 40 }}
                                >
                                    <Text style={styles.devSkipText}>⚡ DEV SKIP ⚡</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </Animated.View>
                </SafeAreaView>
            )}
        </LooviBackground>
    );
}

const styles = StyleSheet.create({
    // Splash Screen
    splashContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    splashLogo: {
        width: width * 0.7,
        height: width * 0.4,
    },

    // Main Content
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing['3xl'],
        paddingBottom: spacing['2xl'],
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: spacing['3xl'] * 2,
    },
    logoSmall: {
        width: width * 0.7,
        height: width * 0.4,
        marginBottom: spacing.md,
    },
    slogan: {
        fontSize: 18,
        fontWeight: '500',
        color: looviColors.text.secondary,
        textAlign: 'center',
        lineHeight: 26,
        marginTop: spacing.lg,
    },
    spacer: {
        flex: 1,
    },
    buttonsContainer: {
        gap: spacing.md,
    },
    primaryButton: {
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: looviColors.coralOrange,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 5,
    },
    primaryButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    secondaryButton: {
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: '500',
        color: looviColors.text.tertiary,
    },
    devSkipButton: {
        paddingVertical: spacing.sm,
        alignItems: 'center',
        marginTop: spacing.md,
    },
    devSkipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#F59E0B',
    },
});
