/**
 * QuizIntroScreen
 * 
 * Welcome screen after "Get Started" that introduces the quiz.
 * Shows Sugarest logo and explains we'll identify sugar habits.
 */

import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { usePostHog } from 'posthog-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing, typography } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type QuizIntroScreenProps = {
    navigation: NativeStackNavigationProp<any, 'QuizIntro'>;
};

export default function QuizIntroScreen({ navigation }: QuizIntroScreenProps) {
    const posthog = usePostHog();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 2500, // Slow animation
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 2500, // Slow animation
                easing: (t) => 1 - Math.pow(1 - t, 3), // custom ease out
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleStart = () => {
        posthog?.capture('onboarding_quiz_start_clicked');
        navigation.navigate('ComprehensiveQuiz');
    };

    const handleLogin = () => {
        navigation.navigate('Auth' as any, {
            screen: 'Login',
            params: { fromOnboardingWelcome: true },
        });
    };

    return (
        <LooviBackground variant="coralTop">
            <SafeAreaView style={styles.container}>
                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {/* Centered Content Group */}
                    <View style={styles.centeredContent}>
                        {/* Main Content */}
                        <View style={styles.mainContent}>
                            <Text style={styles.headline}>
                                Welcome to{"\n"}Craveless!
                            </Text>

                            <View style={styles.subheaderWrapper}>
                                <Text style={styles.subheader}>
                                    Let's find out if you have a dependence on sugar.
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={handleStart}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.startButtonText}>Start Quiz</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleLogin}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.loginButtonText}>
                                Already have an account? Log In
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
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
        paddingHorizontal: spacing.screen.horizontal,
        paddingBottom: spacing['2xl'],
        justifyContent: 'space-between',
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainContent: {
        alignItems: 'center',
    },
    headline: {
        fontFamily: typography.fonts.rounded.bold,
        fontSize: 38,
        lineHeight: 44,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.lg,
        letterSpacing: -0.3,
    },
    subheaderWrapper: {
        marginTop: spacing.xs,
        paddingHorizontal: spacing.xl,
        alignItems: 'center',
    },
    subheader: {
        fontSize: 18,
        fontFamily: typography.fonts.body.medium,
        fontWeight: '500',
        color: '#2C2C2C', // High-contrast dark charcoal
        textAlign: 'center',
        lineHeight: 26,
    },
    actionsContainer: {
        width: '100%',
        gap: spacing.md,
        paddingBottom: spacing.lg,
        marginTop: spacing['2xl'],
    },
    startButton: {
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
    startButtonText: {
        fontSize: 18,
        fontWeight: '800',
        fontFamily: typography.fonts.heading.bold,
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    loginButton: {
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    loginButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2C2C2C',
        opacity: 0.8,
    },
});
