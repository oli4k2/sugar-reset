/**
 * WelcomeScreen
 *
 * Start screen of the app: Animated logo splash, then logo + Continue / Log In.
 * No onboarding checkpoint here — returning users always see this start screen.
 */

import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing, typography } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';

type WelcomeScreenProps = {
    navigation: NativeStackNavigationProp<any, 'Welcome'>;
};

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
    const [showSplash, setShowSplash] = useState(true);

    const logoFade = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.8)).current;
    const splashOpacity = useRef(new Animated.Value(1)).current;
    const contentFade = useRef(new Animated.Value(0)).current;
    const contentSlide = useRef(new Animated.Value(24)).current;

    useEffect(() => {
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
            Animated.delay(2500),
            Animated.timing(splashOpacity, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setShowSplash(false);
            Animated.parallel([
                Animated.timing(contentFade, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(contentSlide, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    }, []);

    const handleContinue = () => {
        navigation.navigate('QuizIntro');
    };

    const handleLogin = () => {
        navigation.navigate('Auth' as any, {
            screen: 'Login',
            params: { fromOnboardingWelcome: true },
        });
    };

    return (
        <LooviBackground variant="mixed">
            {/* Splash overlay */}
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

            {/* Start screen: logo + Continue / Log In (shown after splash) */}
            {!showSplash && (
                <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                    <Animated.View
                        style={[
                            styles.content,
                            {
                                opacity: contentFade,
                                transform: [{ translateY: contentSlide }],
                            },
                        ]}
                    >
                        <View style={styles.centered}>
                            <Animated.Image
                                source={require('../../../assets/images/craveless-logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleContinue}
                                activeOpacity={0.9}
                            >
                                <Text style={styles.primaryButtonText}>Continue</Text>
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
                        </View>
                    </Animated.View>
                </SafeAreaView>
            )}
        </LooviBackground>
    );
}

const styles = StyleSheet.create({
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
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.screen.horizontal,
        paddingBottom: spacing['2xl'],
        justifyContent: 'space-between',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: width * 0.7,
        height: width * 0.4,
    },
    actions: {
        width: '100%',
        gap: spacing.md,
        paddingBottom: spacing.lg,
    },
    primaryButton: {
        backgroundColor: looviColors.accent.primary,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: looviColors.coralOrange,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 10,
    },
    primaryButtonText: {
        fontSize: 18,
        fontWeight: '800',
        fontFamily: typography.fonts.heading.bold,
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    secondaryButton: {
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: looviColors.text.primary,
        opacity: 0.9,
    },
});
