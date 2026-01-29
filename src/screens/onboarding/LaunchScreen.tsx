/**
 * LaunchScreen
 * 
 * Entry point with swipeable intro carousel.
 * 4 slides explaining the app, connected to pagination dots.
 */

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    FlatList,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme';
import { UniverseBackground } from '../../components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type LaunchScreenProps = {
    navigation: NativeStackNavigationProp<any, 'Launch'>;
};

interface IntroSlide {
    id: string;
    title: string;
    subtitle: string;
    phoneContent: {
        logo: string;
        tagline: string;
    };
}

const introSlides: IntroSlide[] = [
    {
        id: '1',
        title: 'Welcome to Craveless!',
        subtitle: "Here's how it works in a nutshell.",
        phoneContent: {
            logo: 'CRAVE\nLESS',
            tagline: 'Embrace this pause.\nReflect before you consume.',
        },
    },
    {
        id: '2',
        title: 'Track your days',
        subtitle: 'Simple binary logging: sugar-free or not.',
        phoneContent: {
            logo: 'Day 12',
            tagline: 'No guilt. No judgment.\nJust data.',
        },
    },
    {
        id: '3',
        title: 'Watch your tree grow',
        subtitle: 'Consistency builds a visual representation of progress.',
        phoneContent: {
            logo: '🌳',
            tagline: 'Growth reflects\nconsistency, not perfection.',
        },
    },
    {
        id: '4',
        title: 'Built on habit science',
        subtitle: 'Rewiring dopamine pathways takes time and awareness.',
        phoneContent: {
            logo: '🧠',
            tagline: 'One day at a time.\nYour brain will adapt.',
        },
    },
];

export default function LaunchScreen({ navigation }: LaunchScreenProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        if (slideIndex !== activeIndex && slideIndex >= 0 && slideIndex < introSlides.length) {
            setActiveIndex(slideIndex);
        }
    };

    const handleContinue = () => {
        if (activeIndex < introSlides.length - 1) {
            // Go to next slide
            flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
        } else {
            // On last slide, navigate to next screen
            navigation.navigate('IntentSelection');
        }
    };

    const renderSlide = ({ item }: { item: IntroSlide }) => (
        <View style={styles.slideContainer}>
            {/* Phone Mockup */}
            <View style={styles.mockupContainer}>
                <View style={styles.phoneFrame}>
                    <View style={styles.phoneScreen}>
                        <Text style={[
                            styles.onScreenLogo,
                            item.id === '3' || item.id === '4' ? styles.onScreenEmoji : null
                        ]}>
                            {item.phoneContent.logo}
                        </Text>
                        <Text style={styles.onScreenTagline}>
                            {item.phoneContent.tagline}
                        </Text>
                        {item.id === '1' && <Text style={styles.onScreenStars}>★★★★★</Text>}
                    </View>
                </View>
            </View>

            {/* Slide Text */}
            <View style={styles.slideTextContainer}>
                <Text style={styles.slideTitle}>{item.title}</Text>
                <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
            </View>
        </View>
    );

    return (
        <UniverseBackground>
            <SafeAreaView style={styles.container}>
                {/* Top Branding */}
                <View style={styles.topBar}>
                    <Text style={styles.topLogo}>CRAVELESS</Text>
                </View>

                {/* Slides */}
                <FlatList
                    ref={flatListRef}
                    data={introSlides}
                    renderItem={renderSlide}
                    keyExtractor={(item) => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    style={styles.flatList}
                    contentContainerStyle={styles.flatListContent}
                />

                {/* Bottom Section */}
                <View style={styles.bottomSection}>
                    {/* Pagination Dots */}
                    <View style={styles.paginationDots}>
                        {introSlides.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    activeIndex === index && styles.activeDot,
                                ]}
                            />
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleContinue}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.primaryButtonText}>
                            {activeIndex < introSlides.length - 1 ? 'Next' : 'Get Started'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </UniverseBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
        marginTop: spacing.md,
        alignItems: 'center',
    },
    topLogo: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.text.primary,
        letterSpacing: 2,
    },
    flatList: {
        flex: 1,
    },
    flatListContent: {
        // No padding needed
    },
    slideContainer: {
        width: SCREEN_WIDTH,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.screen.horizontal,
    },
    mockupContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: spacing.xl,
    },
    phoneFrame: {
        width: 180,
        height: 340,
        backgroundColor: '#1A1A2E',
        borderRadius: 36,
        borderWidth: 3,
        borderColor: '#2A2A4E',
        overflow: 'hidden',
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    phoneScreen: {
        flex: 1,
        backgroundColor: colors.background.secondary,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    onScreenLogo: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.lg,
        letterSpacing: 2,
    },
    onScreenEmoji: {
        fontSize: 64,
        letterSpacing: 0,
    },
    onScreenTagline: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: spacing.lg,
    },
    onScreenStars: {
        fontSize: 18,
        color: colors.accent.warning,
        letterSpacing: 4,
    },
    slideTextContainer: {
        alignItems: 'center',
        paddingBottom: spacing.lg,
    },
    slideTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    slideSubtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    bottomSection: {
        width: '100%',
        paddingHorizontal: spacing.screen.horizontal,
        paddingBottom: spacing.xl,
        alignItems: 'center',
    },
    paginationDots: {
        flexDirection: 'row',
        marginBottom: spacing['2xl'],
        gap: 10,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.glass.strong,
    },
    activeDot: {
        backgroundColor: colors.text.primary,
        width: 24,
    },
    primaryButton: {
        backgroundColor: colors.accent.primary,
        width: '100%',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 5,
    },
    primaryButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
