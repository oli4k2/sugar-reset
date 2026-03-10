/**
 * AppBenefitsScreen
 * 
 * Swipeable slides showing POSITIVE aspects of SugarReset.
 * Reviews, features, statistics, and benefits.
 */

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    useWindowDimensions,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing, borderRadius } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';
import { GlassCard } from '../../components/GlassCard';

type AppBenefitsScreenProps = {
    navigation: NativeStackNavigationProp<any, 'AppBenefits'>;
};

interface BenefitSlide {
    id: string;
    type: 'feature' | 'stats' | 'review' | 'intro';
    emoji?: string;
    title: string;
    subtitle?: string;
    content: any;
}

const benefitSlides: BenefitSlide[] = [
    {
        id: '1',
        type: 'intro',
        emoji: '✨',
        title: 'There is a better way',
        subtitle: 'SugarReset helps you break free',
        content: {
            points: [
                'Science-backed habit tracking',
                'No judgment, just progress',
                'Daily insights that actually help',
                'A growing community of thousands',
            ],
        },
    },
    {
        id: '2',
        type: 'stats',
        emoji: '📊',
        title: 'Real Results',
        subtitle: '90-day user study',
        content: {
            stats: [
                { value: '78%', label: 'reduced sugar cravings' },
                { value: '3.2kg', label: 'average weight loss' },
                { value: '89%', label: 'improved energy levels' },
                { value: '4.8★', label: 'user satisfaction' },
            ],
        },
    },
    {
        id: '3',
        type: 'feature',
        emoji: '🌳',
        title: 'Watch Your Progress Grow',
        subtitle: 'Visual motivation that works',
        content: {
            features: [
                '🔥 Streak tracking without shame',
                '📅 Sugar-free day calendar',
                '💰 Money saved calculator',
                '🧬 Daily science insights',
            ],
        },
    },
    {
        id: '4',
        type: 'intro',
        emoji: '🔬',
        title: 'What to expect',
        subtitle: 'Science-backed benefits timeline',
        content: {
            points: [
                '🧠 Days 3-7: Clearer thinking',
                '⚡ Weeks 1-2: Stable energy',
                '😴 Weeks 2-3: Better sleep',
                '💪 Weeks 3-4: Reduced cravings',
            ],
        },
    },
    {
        id: '5',
        type: 'review',
        title: 'What Users Say',
        content: {
            reviews: [
                {
                    text: '"Finally an app that doesn\'t make me feel guilty. I\'ve been sugar-free for 45 days!"',
                    author: 'Sarah M.',
                    rating: 5,
                },
                {
                    text: '"The science insights really opened my eyes. I never knew what sugar was doing to me."',
                    author: 'Michael T.',
                    rating: 5,
                },
                {
                    text: '"Lost 8 pounds in 2 months without even trying. Just cut sugar."',
                    author: 'Emma L.',
                    rating: 5,
                },
            ],
        },
    },
    {
        id: '6',
        type: 'intro',
        emoji: '🚀',
        title: 'Ready to Start?',
        subtitle: 'Your personalized journey awaits',
        content: {
            points: [
                'Takes just 2 minutes to set up',
                'Personalized plan based on your goals',
                'Start seeing benefits in days',
                'Join 50,000+ sugar-free journeys',
            ],
        },
    },
];

export default function AppBenefitsScreen({ navigation }: AppBenefitsScreenProps) {
    const { width: screenWidth } = useWindowDimensions();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [viewportWidth, setViewportWidth] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const pageWidth = viewportWidth || screenWidth;

    const handleNext = () => {
        if (currentIndex < benefitSlides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            navigation.navigate('IntentSelection');
        }
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const renderSlide = ({ item }: { item: BenefitSlide }) => (
        <View style={[styles.slide, { width: pageWidth }]}>
            <View style={styles.slideContent}>
                {item.emoji && <Text style={styles.emoji}>{item.emoji}</Text>}
                <Text style={styles.title}>{item.title}</Text>
                {item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}

                {item.type === 'intro' && (
                    <GlassCard variant="light" padding="lg" style={styles.card}>
                        {item.content.points.map((point: string, index: number) => (
                            <View key={index} style={styles.pointRow}>
                                <Text style={styles.checkmark}>✓</Text>
                                <Text style={styles.pointText}>{point}</Text>
                            </View>
                        ))}
                    </GlassCard>
                )}

                {item.type === 'stats' && (
                    <View style={styles.statsGrid}>
                        {item.content.stats.map((stat: any, index: number) => (
                            <GlassCard key={index} variant="light" padding="md" style={styles.statCard}>
                                <Text style={styles.statValue}>{stat.value}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </GlassCard>
                        ))}
                    </View>
                )}

                {item.type === 'feature' && (
                    <GlassCard variant="light" padding="lg" style={styles.card}>
                        {item.content.features.map((feature: string, index: number) => (
                            <Text key={index} style={styles.featureText}>{feature}</Text>
                        ))}
                    </GlassCard>
                )}

                {item.type === 'review' && (
                    <View style={styles.reviewsContainer}>
                        {item.content.reviews.map((review: any, index: number) => (
                            <GlassCard key={index} variant="light" padding="md" style={styles.reviewCard}>
                                <Text style={styles.reviewStars}>{'⭐'.repeat(review.rating)}</Text>
                                <Text style={styles.reviewText}>{review.text}</Text>
                                <Text style={styles.reviewAuthor}>— {review.author}</Text>
                            </GlassCard>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );

    const isLastSlide = currentIndex === benefitSlides.length - 1;

    return (
        <LooviBackground variant="coralTop">
            <SafeAreaView style={styles.container}>
                {/* Slides */}
                <View
                    style={styles.flatListWrapper}
                    onLayout={(event) => {
                        const nextWidth = Math.round(event.nativeEvent.layout.width);
                        if (nextWidth > 0 && nextWidth !== viewportWidth) {
                            setViewportWidth(nextWidth);
                        }
                    }}
                >
                    {viewportWidth > 0 && (
                        <FlatList
                            key={pageWidth}
                            ref={flatListRef}
                            data={benefitSlides}
                            renderItem={renderSlide}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item.id}
                            onViewableItemsChanged={onViewableItemsChanged}
                            viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                            getItemLayout={(_, index) => ({
                                length: pageWidth,
                                offset: pageWidth * index,
                                index,
                            })}
                            onScroll={Animated.event(
                                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                                { useNativeDriver: false }
                            )}
                        />
                    )}
                </View>

                {/* Pagination */}
                <View style={styles.pagination}>
                    {benefitSlides.map((_, index) => {
                        const inputRange = [
                            (index - 1) * pageWidth,
                            index * pageWidth,
                            (index + 1) * pageWidth,
                        ];
                        const dotWidth = scrollX.interpolate({
                            inputRange,
                            outputRange: [8, 24, 8],
                            extrapolate: 'clamp',
                        });
                        const opacity = scrollX.interpolate({
                            inputRange,
                            outputRange: [0.3, 1, 0.3],
                            extrapolate: 'clamp',
                        });
                        return (
                            <Animated.View
                                key={index}
                                style={[styles.dot, { width: dotWidth, opacity }]}
                            />
                        );
                    })}
                </View>

                {/* Bottom */}
                <View style={styles.bottomContainer}>
                    <TouchableOpacity
                        style={styles.nextButton}
                        onPress={handleNext}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.nextButtonText}>
                            {isLastSlide ? 'Personalize My Journey' : 'Next'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LooviBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    flatListWrapper: {
        flex: 1,
    },
    slide: {
        paddingHorizontal: spacing.screen.horizontal,
    },
    slideContent: {
        flex: 1,
        alignItems: 'center',
        paddingTop: spacing['2xl'],
    },
    emoji: {
        fontSize: 56,
        marginBottom: spacing.md,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    card: {
        width: '100%',
    },
    pointRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    checkmark: {
        fontSize: 16,
        color: looviColors.accent.success,
        marginRight: spacing.sm,
        fontWeight: '700',
    },
    pointText: {
        fontSize: 16,
        fontWeight: '400',
        color: looviColors.text.secondary,
        flex: 1,
    },
    statsGrid: {
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    statCard: {
        width: '48%',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 32,
        fontWeight: '800',
        color: looviColors.accent.primary,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    featureText: {
        fontSize: 16,
        fontWeight: '400',
        color: looviColors.text.secondary,
        marginBottom: spacing.md,
    },
    reviewsContainer: {
        width: '100%',
        gap: spacing.sm,
    },
    reviewCard: {},
    reviewStars: {
        fontSize: 12,
        marginBottom: spacing.xs,
    },
    reviewText: {
        fontSize: 14,
        fontWeight: '400',
        color: looviColors.text.secondary,
        fontStyle: 'italic',
        lineHeight: 20,
        marginBottom: spacing.xs,
    },
    reviewAuthor: {
        fontSize: 13,
        fontWeight: '500',
        color: looviColors.text.tertiary,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.lg,
        gap: spacing.xs,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        backgroundColor: looviColors.accent.success,
    },
    bottomContainer: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingBottom: spacing['2xl'],
    },
    nextButton: {
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
    nextButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
