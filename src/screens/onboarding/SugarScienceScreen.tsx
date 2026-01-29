/**
 * SugarScienceScreen (SugarDangers)
 * 
 * Swipeable slides showing the NEGATIVE effects of sugar.
 * Science-based facts about glucose, cancer, mental/physical health.
 */

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Dimensions,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';
import { AnimatedIllustration, IllustrationType } from '../../components/AnimatedIllustration';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SugarScienceScreenProps = {
    navigation: NativeStackNavigationProp<any, 'SugarScience'>;
};

interface ScienceSlide {
    id: string;
    illustration: IllustrationType;
    title: string;
    body: string;
    backgroundColor: 'crimson' | 'navy';
}

const scienceSlides: ScienceSlide[] = [
    {
        id: '1',
        illustration: 'blood_sugar',
        title: 'Sugar is a Rollercoaster',
        body: "Every spike is a debt your body can't pay. It creates a cycle of **fake energy**, **brutal crashes**, and **ruined sleep** that leaves you permanently exhausted.",
        backgroundColor: 'crimson',
    },
    {
        id: '2',
        illustration: 'brain',
        title: 'Sugar Hijacks Your Brain',
        body: "Sugar triggers the **same dopamine pathways** as addictive drugs. It's a chemical hook that increases your risk of **depression by 23%** and clouds your mind with brain fog.",
        backgroundColor: 'crimson',
    },
    {
        id: '3',
        illustration: 'heart_health',
        title: 'The Silent Destroyer',
        body: "Sugar sets your body on fire. It fuels **chronic inflammation**, doubles the risk of **heart disease**, and provides the glucose that **cancer cells** crave to grow.",
        backgroundColor: 'crimson',
    },
    {
        id: '4',
        illustration: 'cancer_awareness',
        title: 'The Aging Accelerator',
        body: "Sugar literally 'caramelizes' your cells through glycation. It destroys **collagen and elastin**, leading to **premature wrinkles**, sagging skin, and faster cellular aging.",
        backgroundColor: 'crimson',
    },
    {
        id: '5',
        illustration: 'target_goals',
        title: 'The Path to Freedom',
        body: "You are more than your cravings. By **breaking the sugar cycle**, your brain restores its **natural dopamine balance** and your body begins to **heal from the inside out**. It's time to trade the crashes for **stable moods, deep sleep, and your natural, vibrant glow**.",
        backgroundColor: 'navy',
    },
];

export default function SugarScienceScreen({ navigation }: SugarScienceScreenProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const handleNext = () => {
        if (currentIndex < scienceSlides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            navigation.navigate('SugarestWelcome');
        }
    };

    const handleSkip = () => {
        navigation.navigate('SugarestWelcome');
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
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
                <AnimatedIllustration
                    name={item.illustration}
                    size={160}
                    animation="breathe"
                />
                <Text style={styles.title}>{item.title}</Text>
                <View style={styles.spacer} />
                {renderBodyText(item.body)}
            </View>
        </View>
    );

    const isLastSlide = currentIndex === scienceSlides.length - 1;

    // Determine background variant based on current slide
    const currentSlide = scienceSlides[currentIndex];
    const backgroundVariant = currentSlide?.backgroundColor === 'navy' ? 'solidNavy' : 'solidCrimson';

    return (
        <LooviBackground variant={backgroundVariant}>
            <SafeAreaView style={styles.container}>
                {/* Header with title */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Learn About Sugar</Text>
                    <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>
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
        </LooviBackground>
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
    skipButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    skipText: {
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
