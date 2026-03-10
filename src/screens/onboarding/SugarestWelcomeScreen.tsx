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
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';

const TABLET_BREAKPOINT = 600;

type SugarestWelcomeScreenProps = {
    navigation: NativeStackNavigationProp<any, 'SugarestWelcome'>;
};

export default function SugarestWelcomeScreen({ navigation }: SugarestWelcomeScreenProps) {
    const { width: screenWidth } = useWindowDimensions();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    const contentMaxWidth = Math.min(screenWidth * 0.9, 520);
    const headerImageWidth = Math.min(screenWidth * 0.85, contentMaxWidth);
    const isTablet = screenWidth >= TABLET_BREAKPOINT;

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
                            paddingHorizontal: isTablet ? spacing['2xl'] : spacing.screen.horizontal,
                        },
                    ]}
                >
                    {/* Centered Content */}
                    <View style={styles.centeredContent}>
                        {/* Welcome Message */}
                        <View style={styles.welcomeSection}>
                            <View style={styles.welcomeContentWrapper}>
                                <Image
                                    source={require('../../../assets/images/craveless-sugar-reset-header.png')}
                                    style={[styles.welcomeHeaderImage, { width: headerImageWidth, maxWidth: contentMaxWidth }]}
                                    resizeMode="contain"
                                />
                                <Text style={styles.welcomeSubtitle}>
                                    Join thousands of others breaking the cycle of sugar addiction through science and community support.
                                </Text>

                                {/* Features Row - Horizontal */}
                                <View style={[styles.featuresRow, { maxWidth: contentMaxWidth }]}>
                                <View style={styles.featureItem}>
                                    <View style={styles.iconContainer}>
                                        <Image 
                                            source={require('../../public/feature_personalized.png')}
                                            style={styles.featureIcon}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <Text style={styles.featureLabel}>Personalized</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <View style={styles.iconContainer}>
                                        <Image 
                                            source={require('../../public/feature_science.png')}
                                            style={styles.featureIcon}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <Text style={styles.featureLabel}>Science-Backed</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <View style={styles.iconContainer}>
                                        <Image 
                                            source={require('../../public/feature_social.png')}
                                            style={styles.featureIconSocial}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <Text style={styles.featureLabel}>Social Support</Text>
                                </View>
                            </View>
                            </View>
                        </View>
                    </View>

                    {/* Continue Button - Fixed at bottom */}
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
        paddingBottom: spacing['2xl'],
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
    },
    welcomeSection: {
        alignItems: 'center',
    },
    welcomeContentWrapper: {
        alignItems: 'center',
        width: '100%',
        maxWidth: 520,
    },
    welcomeHeaderImage: {
        height: undefined,
        aspectRatio: 2.8,
        marginBottom: spacing.lg,
    },
    welcomeSubtitle: {
        fontSize: 15,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 40,
        paddingHorizontal: spacing.md,
        alignSelf: 'stretch',
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
    iconContainer: {
        height: 60, // Fixed height to keep labels aligned
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    featureIcon: {
        width: 46,
        height: 46,
    },
    featureIconSocial: {
        width: 53,
        height: 53,
    },
    featureLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: looviColors.text.primary,
        textAlign: 'center',
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
