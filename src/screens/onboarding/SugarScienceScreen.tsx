import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Dimensions,
    Animated,
    Image,
    ImageSourcePropType,
} from 'react-native';
import { usePostHog } from 'posthog-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '../../theme';
import { useUserData } from '../../context/UserDataContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SugarScienceScreenProps = {
    navigation: NativeStackNavigationProp<any, 'SugarScience'>;
};

interface ScienceSlide {
    id: string;
    image: ImageSourcePropType;
    title: string;
    body: string;
    backgroundColor: 'crimson' | 'navy';
}

const scienceSlides: ScienceSlide[] = [
    {
        id: '1',
        image: require('../../../assets/images/onboarding/sugar_science_2.png'),
        title: 'Sugar hijacks your brain',
        body: "Added sugar triggers the same reward pathways as addictive substances. The more often it's used for relief, the stronger the pull becomes.",
        backgroundColor: 'crimson',
    },
    {
        id: '2',
        image: require('../../../assets/images/onboarding/sugar_science_3.png'),
        title: 'Sugar breaks self-control',
        body: "Cravings start before conscious choice. This is why \"just eating less\" feels like a battle you keep losing.",
        backgroundColor: 'crimson',
    },
    {
        id: '3',
        image: require('../../../assets/images/onboarding/sugar_science_5.png'),
        title: 'Sugar drains your energy',
        body: "Blood sugar spikes lead to crashes, fatigue, and mental fog. What feels like comfort is often the cause of the low.",
        backgroundColor: 'crimson',
    },
    {
        id: '4',
        image: require('../../../assets/images/onboarding/sugar_science_4.png'),
        title: 'Sugar affects your body',
        body: "Excess consumption drives systemic inflammation and metabolic stress. Chronic reliance on sugar shifts your biology away from its natural balance.",
        backgroundColor: 'crimson',
    },
    {
        id: '5',
        image: require('../../../assets/images/onboarding/sugar_science_6.png'),
        title: 'There is a way out',
        body: "The brain can relearn. Habits can be rewired. You don't have to fight this alone.",
        backgroundColor: 'navy',
    },
];

export default function SugarScienceScreen({ navigation }: SugarScienceScreenProps) {
    const { setOnboardingCheckpoint } = useUserData();
    const posthog = usePostHog();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        setOnboardingCheckpoint('SugarDangers').catch(() => { });
    }, []);

    const handleNext = () => {
        if (currentIndex < scienceSlides.length - 1) {
            posthog?.capture('onboarding_science_slide_next_clicked', {
                current_slide_index: currentIndex,
                current_slide_id: scienceSlides[currentIndex].id
            });
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            posthog?.capture('onboarding_science_completed');
            navigation.navigate('FeatureShowcase');
        }
    };


    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            const index = viewableItems[0].index ?? 0;
            setCurrentIndex(index);

            // Track slide view
            if (index >= 0 && index < scienceSlides.length) {
                posthog?.capture('onboarding_science_slide_viewed', {
                    slide_index: index,
                    slide_id: scienceSlides[index].id,
                    slide_title: scienceSlides[index].title
                });
            }
        }
    }).current;

    // Helper function to render body text with bold formatting
    const renderBodyText = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return (
            <Text style={styles.bodyText}>
                {parts.map((part, index) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        const boldText = part.slice(2, -2);
                        return (
                            <Text key={index} style={styles.bodyTextBold}>
                                {boldText}
                            </Text>
                        );
                    }
                    return part;
                })}
            </Text>
        );
    };

    const renderSlide = ({ item }: { item: ScienceSlide }) => (
        <View style={styles.slide}>
            <View style={styles.slideContent}>
                <Image
                    source={item.image}
                    style={styles.slideImage}
                    resizeMode="contain"
                />
                <Text style={styles.title}>{item.title}</Text>
                <View style={styles.spacer} />
                {renderBodyText(item.body)}
            </View>
        </View>
    );

    const isLastSlide = currentIndex === scienceSlides.length - 1;

    // Interpolate background color based on scroll position for smooth transition
    // Transition starts at 50% through slide 4, so background is already navy
    // by the time user reaches the last slide - this prevents the visible color change
    const lastSlideIndex = scienceSlides.length - 1;
    const transitionStart = (lastSlideIndex - 1) * SCREEN_WIDTH + SCREEN_WIDTH * 0.5;
    const transitionEnd = lastSlideIndex * SCREEN_WIDTH;

    const backgroundColor = scrollX.interpolate({
        inputRange: [
            (lastSlideIndex - 1) * SCREEN_WIDTH,
            transitionStart,
            transitionEnd,
        ],
        outputRange: ['#B22222', '#B22222', '#1A237E'], // crimson to navy
        extrapolate: 'clamp',
    });

    return (
        <View style={StyleSheet.absoluteFill}>
            {/* Animated background that transitions smoothly based on scroll */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor }
                ]}
            />
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                <SafeAreaView style={styles.container}>
                    {/* Header with title */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Learn About Sugar</Text>
                    </View>

                    {/* Slides */}
                    <FlatList
                        ref={flatListRef}
                        data={scienceSlides}
                        renderItem={renderSlide}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                            { useNativeDriver: false }
                        )}
                    />

                    {/* Pagination */}
                    <View style={styles.pagination}>
                        {scienceSlides.map((_, index) => {
                            const inputRange = [
                                (index - 1) * SCREEN_WIDTH,
                                index * SCREEN_WIDTH,
                                (index + 1) * SCREEN_WIDTH,
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
                                {isLastSlide ? "Let's start Craveless!" : 'Next'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing.sm,
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },

    slide: {
        width: SCREEN_WIDTH,
    },
    slideContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: spacing.xl,
        paddingHorizontal: spacing.screen.horizontal,
    },
    slideImage: {
        width: 200,
        height: 200,
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: -0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    spacer: {
        height: 36,
    },
    bodyText: {
        fontSize: 18,
        fontWeight: '400',
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 28,
        paddingHorizontal: spacing.md,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    bodyTextBold: {
        fontWeight: '700',
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
        backgroundColor: '#FFFFFF',
    },
    bottomContainer: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingBottom: spacing['2xl'],
    },
    nextButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
    },
    nextButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1A1A1A',
    },
});
