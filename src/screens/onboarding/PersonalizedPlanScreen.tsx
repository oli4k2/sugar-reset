import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { spacing } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';
import { useUserData } from '../../context/UserDataContext';
import { OnboardingStackParamList } from '../../types';

type PersonalizedPlanScreenProps = {
    navigation: NativeStackNavigationProp<OnboardingStackParamList, 'PersonalizedPlan'>;
};

export default function PersonalizedPlanScreen({ navigation }: PersonalizedPlanScreenProps) {
    const { onboardingData } = useUserData();
    const [displayedText, setDisplayedText] = useState('');
    const [showButton, setShowButton] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const buttonFadeAnim = useRef(new Animated.Value(0)).current;
    const cardSlideAnim = useRef(new Animated.Value(-100)).current; // Start slightly above
    const cardOpacityAnim = useRef(new Animated.Value(0)).current; // Start invisible

    const steps = [
        `Hey ${onboardingData.nickname || 'there'},`,
        "Your answers have helped us understand you better.",
        "We have a custom plan ready",
        "Now, it's time to invest in yourself."
    ];

    useEffect(() => {
        // Sequence of text changes
        const runAnimationSequence = async () => {
            for (let i = 0; i < steps.length; i++) {
                const fullText = steps[i];
                setDisplayedText(''); // Clear text for new step

                // Fade in container
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(slideAnim, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    })
                ]).start();

                // Typewriter effect
                for (let charIndex = 0; charIndex <= fullText.length; charIndex++) {
                    setDisplayedText(fullText.substring(0, charIndex));

                    // Add vibration on each letter for tactile feel
                    if (charIndex > 0) {
                        Haptics.selectionAsync();
                    }

                    // Dynamic typing speed
                    const typingSpeed = fullText.length > 40 ? 25 : 40;
                    await new Promise(resolve => setTimeout(resolve, typingSpeed));
                }

                // Trigger card animation on step 2 ("We have a custom plan ready")
                if (i === 2) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                    Animated.parallel([
                        Animated.timing(cardOpacityAnim, {
                            toValue: 1,
                            duration: 1200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(cardSlideAnim, {
                            toValue: 0,
                            duration: 1200,
                            useNativeDriver: true,
                        })
                    ]).start();
                }

                // Wait for step duration (minus fade out time if not last step)
                if (i < steps.length - 1) {
                    // Constant pause after typing finished
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    // Fade out
                    Animated.parallel([
                        Animated.timing(fadeAnim, {
                            toValue: 0,
                            duration: 500,
                            useNativeDriver: true,
                        }),
                        Animated.timing(slideAnim, {
                            toValue: -20,
                            duration: 500,
                            useNativeDriver: true,
                        })
                    ]).start();

                    await new Promise(resolve => setTimeout(resolve, 500));
                    // Reset slide for next entry
                    slideAnim.setValue(20);
                } else {
                    // Last step stays visible
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // Show button after all animations finish
                    setShowButton(true);
                    Animated.timing(buttonFadeAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }).start();
                }
            }
        };

        runAnimationSequence();

        return () => {
            // Cleanup handled by async/await flow essentially, but good practice if using intervals
        };
    }, []);

    const handleContinue = () => {
        navigation.navigate('LongScrollablePlan');
    };

    // Date formatting for "Free since" (e.g. 12/22)
    const today = new Date();
    const freeSinceDate = `${today.getMonth() + 1}/${today.getFullYear().toString().slice(-2)}`;

    return (
        <LooviBackground variant="blueDominant">
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    {/* Streak Card Visual - at top */}
                    <Animated.View
                        style={[
                            styles.cardContainer,
                            {
                                opacity: cardOpacityAnim,
                                transform: [{ translateY: cardSlideAnim }]
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={[looviColors.coralSoft, looviColors.coralOrange, looviColors.skyBlue]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.streakCard}
                        >
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderSpacer} />
                                <Image
                                    source={require('../../../assets/images/craveless-sugar-reset-card.png')}
                                    style={styles.cardBadgeImage}
                                    resizeMode="contain"
                                />
                            </View>

                            <View style={styles.cardBody}>
                                <Text style={styles.streakLabel}>Active Streak</Text>
                                <Text style={styles.streakValue}>0 days</Text>
                            </View>

                            <View style={styles.cardFooter}>
                                <View>
                                    <Text style={styles.footerLabel}>Name</Text>
                                    <Text style={styles.footerValue}>{onboardingData.nickname || 'You'}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.footerLabel}>Free since</Text>
                                    <Text style={styles.footerValue}>{freeSinceDate}</Text>
                                </View>
                            </View>
                        </LinearGradient>

                        {/* Decorative glow/shadow behind */}
                        <View style={styles.cardShadow} />
                    </Animated.View>

                    {/* Animated Header Text - beneath card */}
                    <View style={styles.headerContainer}>
                        <Animated.Text
                            style={[
                                styles.headerText,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }]
                                }
                            ]}
                        >
                            {displayedText}
                        </Animated.Text>
                    </View>
                </View>

                {/* Become Craveless Button - Fade in at end */}
                {showButton && (
                    <Animated.View style={[styles.bottomContainer, { opacity: buttonFadeAnim }]}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleContinue}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>Become Craveless</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}
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
        paddingTop: spacing['3xl'],
        alignItems: 'center',
    },
    cardContainer: {
        width: '100%',
        maxWidth: 320,
        aspectRatio: 0.9, // Slightly less tall
        position: 'relative',
        marginBottom: spacing['2xl'] * 0.6, // Space between card and text
    },
    headerContainer: {
        height: 120, // Fixed height to prevent layout jumps
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    headerText: {
        fontSize: 24,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        lineHeight: 32,
    },
    streakCard: {
        flex: 1,
        borderRadius: 24,
        padding: spacing.lg,
        justifyContent: 'space-between',
        zIndex: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    cardShadow: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: -20,
        bottom: -20,
        backgroundColor: 'rgba(232, 168, 124, 0.25)',
        borderRadius: 24,
        zIndex: 0,
        transform: [{ scale: 0.95 }],
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    cardHeaderSpacer: {
        flex: 1,
    },
    cardBadgeImage: {
        width: 48,
        height: 48,
    },
    cardBody: {
        flex: 1,
        justifyContent: 'center',
    },
    streakLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    streakValue: {
        color: '#FFFFFF',
        fontSize: 42,
        fontWeight: '800',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.3)',
        paddingTop: spacing.md,
    },
    footerLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginBottom: 2,
    },
    footerValue: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    bottomContainer: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingBottom: spacing['2xl'],
    },
    button: {
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
    buttonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
