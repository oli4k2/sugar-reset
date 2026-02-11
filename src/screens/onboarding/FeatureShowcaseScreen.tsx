/**
 * FeatureShowcaseScreen
 * 
 * Swipeable carousel showing key app features with illustrations.
 * Shows what users can expect from the app before they personalize.
 * Content swipes while pagination dots and Next button remain fixed at the bottom.
 */

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    FlatList,
    Image,
    ImageSourcePropType,
} from 'react-native';
import { usePostHog } from 'posthog-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type FeatureShowcaseScreenProps = {
    navigation: NativeStackNavigationProp<any, 'FeatureShowcase'>;
};

interface Feature {
    id: string;
    title: string;
    description: string;
    descriptionBold: string[];
    image: ImageSourcePropType;
}

const FEATURES: Feature[] = [
    {
        id: 'welcome',
        title: 'Join thousands of others',
        description: 'Join thousands of others breaking the cycle of sugar addiction through science and community support.',
        descriptionBold: ['thousands', 'breaking the cycle', 'science'],
        image: require('../../../assets/images/craveless-sugar-reset-header.png'),
    },
    {
        id: 'break_patterns',
        title: 'Break old patterns',
        description: 'Turn your sugar dependency into a journey of recovery. Replace old habits with science-backed rituals.',
        descriptionBold: ['dependency', 'recovery', 'rituals'],
        image: require('../../public/feature_choose_path.png'), // Placeholder
    },
    {
        id: '1',
        title: 'Track your progress',
        description: 'Watch your streak grow day by day. See your consistency build into lasting change.',
        descriptionBold: ['streak', 'consistency'],
        image: require('../../public/feature_track_progress.png'),
    },
    {
        id: '2',
        title: 'Choose your path',
        description: 'Personalized plans designed by habit scientists. Find the approach that fits your lifestyle.',
        descriptionBold: ['habit scientists', 'lifestyle'],
        image: require('../../public/feature_choose_path.png'),
    },
    {
        id: '3',
        title: 'Stay strong',
        description: 'Get instant help when cravings hit. Proven techniques to overcome temptation in seconds.',
        descriptionBold: ['cravings', 'overcome'],
        image: require('../../public/feature_stay_strong.png'),
    },
    {
        id: '4',
        title: 'Understand yourself',
        description: 'Learn the science behind sugar addiction. Build awareness to make lasting change.',
        descriptionBold: ['science', 'awareness'],
        image: require('../../public/feature_understand_yourself.png'),
    },
];

export default function FeatureShowcaseScreen({ navigation }: FeatureShowcaseScreenProps) {
    const posthog = usePostHog();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleContinue = () => {
        if (currentIndex < FEATURES.length - 1) {
            posthog?.capture('onboarding_feature_slide_next_clicked', {
                current_slide_index: currentIndex,
                current_slide_id: FEATURES[currentIndex].id
            });
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        } else {
            posthog?.capture('onboarding_features_completed');
            navigation.navigate('SuccessStories');
        }
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            const index = viewableItems[0].index || 0;
            setCurrentIndex(index);

            // Track slide view
            posthog?.capture('onboarding_feature_slide_viewed', {
                slide_index: index,
                slide_id: FEATURES[index].id,
                slide_title: FEATURES[index].title
            });
        }
    }).current;

    const renderBoldedDescription = (text: string, boldWords: string[]) => {
        // Create a regex pattern that matches any of the bold words/phrases
        // Sort by length (longest first) to match phrases before individual words
        const sortedBoldWords = [...boldWords].sort((a, b) => b.length - a.length);
        const pattern = new RegExp(
            `(${sortedBoldWords.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
            'gi'
        );

        const parts = text.split(pattern);

        return (
            <Text style={styles.featureDescription}>
                {parts.map((part, index) => {
                    if (!part) return null;
                    const isBold = boldWords.some(boldWord =>
                        part.toLowerCase() === boldWord.toLowerCase()
                    );

                    return (
                        <Text
                            key={index}
                            style={isBold ? styles.featureDescriptionBold : undefined}
                        >
                            {part}
                        </Text>
                    );
                })}
            </Text>
        );
    };

    const renderFeature = ({ item }: { item: Feature }) => {
        if (item.id === 'welcome') {
            return (
                <View style={styles.slideContent}>
                    <View style={styles.welcomeSection}>
                        <Image
                            source={item.image}
                            style={styles.welcomeHeaderImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.welcomeSubtitle}>
                            Join thousands of others breaking the cycle of sugar addiction through science and community support.
                        </Text>

                        {/* Features Row - Horizontal */}
                        <View style={styles.featuresRow}>
                            <View style={styles.featureItemCompact}>
                                <View style={styles.iconContainer}>
                                    <Image
                                        source={require('../../public/feature_personalized.png')}
                                        style={styles.featureIconSmall}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={styles.featureLabelSmall}>Personalized</Text>
                            </View>
                            <View style={styles.featureItemCompact}>
                                <View style={styles.iconContainer}>
                                    <Image
                                        source={require('../../public/feature_science.png')}
                                        style={styles.featureIconSmall}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={styles.featureLabelSmall}>Science-Backed</Text>
                            </View>
                            <View style={styles.featureItemCompact}>
                                <View style={styles.iconContainer}>
                                    <Image
                                        source={require('../../public/feature_social.png')}
                                        style={styles.featureIconSocialSmall}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={styles.featureLabelSmall}>Social Support</Text>
                            </View>
                        </View>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.slideContent}>
                {/* Illustration */}
                <View style={styles.illustrationContainer}>
                    <Image
                        source={item.image}
                        style={styles.illustration}
                        resizeMode="contain"
                    />
                </View>

                {/* Feature Info */}
                <View style={styles.featureInfo}>
                    <Text style={styles.featureTitle}>{item.title}</Text>
                    {renderBoldedDescription(item.description, item.descriptionBold)}
                </View>
            </View>
        );
    };

    return (
        <LooviBackground variant="mixed">
            <View style={styles.container}>
                {/* Swipeable Content */}
                <FlatList
                    ref={flatListRef}
                    data={FEATURES}
                    renderItem={renderFeature}
                    keyExtractor={(item) => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                    style={styles.flatList}
                    contentContainerStyle={styles.flatListContent}
                />

                {/* Fixed Bottom Section */}
                <SafeAreaView edges={['bottom']} style={styles.fixedBottom}>
                    {/* Pagination Dots */}
                    <View style={styles.pagination}>
                        {FEATURES.map((_, dotIndex) => (
                            <View
                                key={dotIndex}
                                style={[
                                    styles.paginationDot,
                                    dotIndex === currentIndex && styles.paginationDotActive,
                                ]}
                            />
                        ))}
                    </View>

                    {/* Continue Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.continueButton}
                            onPress={handleContinue}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.continueButtonText}>Next →</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        </LooviBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    flatList: {
        flex: 1,
    },
    flatListContent: {
        paddingBottom: 0,
    },
    slideContent: {
        width: SCREEN_WIDTH,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: spacing.xl,
        paddingBottom: 150, // Space for fixed bottom section
    },
    welcomeSection: {
        alignItems: 'center',
        width: SCREEN_WIDTH,
        paddingHorizontal: spacing.screen.horizontal,
    },
    welcomeHeaderImage: {
        width: SCREEN_WIDTH * 0.85,
        maxWidth: 320,
        height: undefined,
        aspectRatio: 2.8,
        marginBottom: spacing.lg,
    },
    welcomeSubtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
        paddingHorizontal: spacing.md,
    },
    featuresRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
        width: '100%',
    },
    featureItemCompact: {
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    featureIconSmall: {
        width: 40,
        height: 40,
    },
    featureIconSocialSmall: {
        width: 46,
        height: 46,
    },
    featureLabelSmall: {
        fontSize: 12,
        fontWeight: '600',
        color: looviColors.text.primary,
        textAlign: 'center',
    },
    fixedBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
    },
    illustrationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing['2xl'],
        width: SCREEN_WIDTH * 0.6,
        height: SCREEN_WIDTH * 0.6,
    },
    illustration: {
        width: '100%',
        height: '100%',
    },
    featureInfo: {
        alignItems: 'center',
        paddingHorizontal: spacing['2xl'],
        marginTop: spacing.lg,
    },
    featureTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    featureDescription: {
        fontSize: 16,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    featureDescriptionBold: {
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: spacing.xl,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    paginationDotActive: {
        width: 24,
        backgroundColor: looviColors.accent.primary,
    },
    footer: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingBottom: spacing.lg,
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
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
