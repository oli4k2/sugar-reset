/**
 * SugarestWelcomeScreen
 * 
 * Welcome screen after the Learn About Sugar section.
 * Introduces Sugarest with compact, authoritative design following Quittr aesthetic.
 */

import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Image,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';
import { GradientText } from '../../components/GradientText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Responsive font size based on screen width (base size for iPhone standard width of 375)
const getResponsiveFontSize = (baseSize: number) => {
    const scale = SCREEN_WIDTH / 375; // 375 is iPhone standard width
    return Math.round(baseSize * scale);
};

type SugarestWelcomeScreenProps = {
    navigation: NativeStackNavigationProp<any, 'SugarestWelcome'>;
};

export default function SugarestWelcomeScreen({ navigation }: SugarestWelcomeScreenProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleContinue = () => {
        navigation.navigate('FeatureShowcase');
    };

    return (
        <LooviBackground variant="blueDominant">
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
                    {/* Logo with fade animation */}
                    <Animated.View
                        style={[
                            styles.logoContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{
                                    scale: fadeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.8, 1]
                                    })
                                }]
                            }
                        ]}
                    >
                        <Animated.Image
                            source={require('../../public/craveless_icon.png')}
                            style={styles.logoIcon}
                            resizeMode="contain"
                        />
                        <GradientText
                            text="craveless"
                            colors={['#FF6B35', '#E8A87C', '#D4896A']}
                            fontSize={getResponsiveFontSize(24)}
                            fontWeight="700"
                            style={styles.logoText}
                        />
                    </Animated.View>

                    {/* Welcome Message */}
                    <View style={styles.welcomeSection}>
                        <GradientText
                            text="Welcome to Craveless"
                            colors={['#FF6B35', '#E8A87C', '#D4896A']}
                            fontSize={getResponsiveFontSize(28)}
                            fontWeight="900"
                            style={styles.welcomeTitle}
                        />
                        <Text style={styles.welcomeSubtitle}>
                            Join thousands of users breaking the cycle of sugar addiction through science and community support.
                        </Text>

                        {/* Features Row - Horizontal */}
                        <View style={styles.featuresRow}>
                            <View style={styles.featureItem}>
                                <Text style={styles.featureIcon}>🎯</Text>
                                <Text style={styles.featureLabel}>Personalized</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Text style={styles.featureIcon}>📊</Text>
                                <Text style={styles.featureLabel}>Science-Backed</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Text style={styles.featureIcon}>💪</Text>
                                <Text style={styles.featureLabel}>Social Support</Text>
                            </View>
                        </View>
                    </View>

                    {/* Spacer */}
                    <View style={styles.spacer} />

                    {/* Continue Button */}
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleContinue}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.continueButtonText}>Learn how it works</Text>
                    </TouchableOpacity>
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
        paddingTop: spacing['3xl'],
        paddingBottom: spacing['2xl'],
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: spacing['2xl'],
    },
    logoIcon: {
        width: SCREEN_WIDTH * 0.15,
        height: SCREEN_WIDTH * 0.15,
        marginBottom: spacing.xs,
    },
    logoText: {
        marginTop: spacing.xs,
    },
    welcomeSection: {
        alignItems: 'center',
        marginBottom: spacing['2xl'],
    },
    welcomeTitle: {
        marginBottom: spacing.md,
    },
    welcomeSubtitle: {
        fontSize: 15,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing['2xl'],
        paddingHorizontal: spacing.md,
    },
    featuresRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
        width: '100%',
        paddingHorizontal: spacing.md,
    },
    featureItem: {
        alignItems: 'center',
        flex: 1,
    },
    featureIcon: {
        fontSize: 32,
        marginBottom: spacing.sm,
    },
    featureLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: looviColors.text.primary,
        textAlign: 'center',
    },
    spacer: {
        flex: 1,
    },
    continueButton: {
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
    continueButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
