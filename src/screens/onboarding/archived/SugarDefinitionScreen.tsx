/**
 * SugarDefinitionScreen
 * 
 * Clarifies what we mean by "sugar" before the quiz.
 * Shows added sugar (sweets) vs natural sugars (fruits).
 */

import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing, borderRadius } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';
import { GlassCard } from '../../components/GlassCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SugarDefinitionScreenProps = {
    navigation: NativeStackNavigationProp<any, 'SugarDefinition'>;
};

const ADDED_SUGARS = [
    { emoji: '🍭', label: 'Candy & Sweets' },
    { emoji: '🥤', label: 'Soda & Energy Drinks' },
    { emoji: '🍩', label: 'Donuts & Pastries' },
    { emoji: '🍫', label: 'Chocolate Bars' },
    { emoji: '🧁', label: 'Cakes & Cupcakes' },
    { emoji: '🍦', label: 'Ice Cream' },
];

const NATURAL_SUGARS = [
    { emoji: '🍎', label: 'Apples' },
    { emoji: '🍌', label: 'Bananas' },
    { emoji: '🍇', label: 'Grapes' },
    { emoji: '🥕', label: 'Carrots' },
    { emoji: '🥛', label: 'Milk (lactose)' },
    { emoji: '🍯', label: 'Honey (moderation)' },
];

export default function SugarDefinitionScreen({ navigation }: SugarDefinitionScreenProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const addedScaleAnim = useRef(new Animated.Value(0.9)).current;
    const naturalScaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.sequence([
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
                }),
            ]),
            Animated.stagger(200, [
                Animated.spring(addedScaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.spring(naturalScaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, []);

    const handleContinue = () => {
        navigation.navigate('ComprehensiveQuiz');
    };

    return (
        <LooviBackground variant="mixed">
            <SafeAreaView style={styles.container}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        }}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerEmoji}>🔍</Text>
                            <Text style={styles.headerTitle}>
                                When we talk about sugar...
                            </Text>
                            <Text style={styles.headerSubtitle}>
                                We mean <Text style={styles.highlight}>added sugars</Text>, not the natural sugars found in whole foods
                            </Text>
                        </View>

                        {/* Added Sugars - RED/Warning */}
                        <Animated.View style={{ transform: [{ scale: addedScaleAnim }] }}>
                            <View style={styles.sectionCard}>
                                <View style={[styles.sectionHeader, styles.addedHeader]}>
                                    <Text style={styles.sectionIcon}>⚠️</Text>
                                    <Text style={styles.sectionTitle}>Added Sugars</Text>
                                    <Text style={styles.sectionBadge}>We're tracking these</Text>
                                </View>
                                <Text style={styles.sectionDescription}>
                                    Sugars added during processing or preparation. These are what we want to reduce.
                                </Text>
                                <View style={styles.itemsGrid}>
                                    {ADDED_SUGARS.map((item, index) => (
                                        <View key={index} style={styles.itemChip}>
                                            <Text style={styles.itemEmoji}>{item.emoji}</Text>
                                            <Text style={styles.itemLabel}>{item.label}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </Animated.View>

                        {/* Natural Sugars - GREEN/OK */}
                        <Animated.View style={{ transform: [{ scale: naturalScaleAnim }] }}>
                            <View style={[styles.sectionCard, styles.naturalCard]}>
                                <View style={[styles.sectionHeader, styles.naturalHeader]}>
                                    <Text style={styles.sectionIcon}>✅</Text>
                                    <Text style={[styles.sectionTitle, styles.naturalTitle]}>Natural Sugars</Text>
                                    <Text style={[styles.sectionBadge, styles.naturalBadge]}>These are OK</Text>
                                </View>
                                <Text style={styles.sectionDescription}>
                                    Sugars naturally present in whole foods, paired with fiber and nutrients.
                                </Text>
                                <View style={styles.itemsGrid}>
                                    {NATURAL_SUGARS.map((item, index) => (
                                        <View key={index} style={[styles.itemChip, styles.naturalChip]}>
                                            <Text style={styles.itemEmoji}>{item.emoji}</Text>
                                            <Text style={styles.itemLabel}>{item.label}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </Animated.View>

                        {/* Key Point */}
                        <GlassCard variant="light" padding="md" style={styles.keyPoint}>
                            <Text style={styles.keyPointText}>
                                💡 <Text style={styles.keyPointBold}>The difference?</Text> Added sugars cause blood sugar spikes without nutrients, while natural sugars come with fiber that slows absorption.
                            </Text>
                        </GlassCard>
                    </Animated.View>
                </ScrollView>

                {/* Continue Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleContinue}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.continueButtonText}>Got it!</Text>
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingBottom: 120,
    },
    header: {
        alignItems: 'center',
        paddingTop: spacing.xl,
        marginBottom: spacing.xl,
    },
    headerEmoji: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    headerSubtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    highlight: {
        fontWeight: '700',
        color: looviColors.accent.primary,
    },
    sectionCard: {
        backgroundColor: 'rgba(229, 115, 115, 0.08)',
        borderRadius: borderRadius['2xl'],
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 2,
        borderColor: 'rgba(229, 115, 115, 0.2)',
    },
    naturalCard: {
        backgroundColor: 'rgba(127, 176, 105, 0.08)',
        borderColor: 'rgba(127, 176, 105, 0.2)',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    addedHeader: {},
    naturalHeader: {},
    sectionIcon: {
        fontSize: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#D32F2F',
        flex: 1,
    },
    naturalTitle: {
        color: '#388E3C',
    },
    sectionBadge: {
        backgroundColor: 'rgba(211, 47, 47, 0.15)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
    },
    naturalBadge: {
        backgroundColor: 'rgba(56, 142, 60, 0.15)',
        color: '#388E3C',
    },
    sectionDescription: {
        fontSize: 14,
        fontWeight: '400',
        color: looviColors.text.secondary,
        marginBottom: spacing.md,
        lineHeight: 20,
    },
    itemsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    itemChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(229, 115, 115, 0.12)',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.lg,
        gap: spacing.xs,
    },
    naturalChip: {
        backgroundColor: 'rgba(127, 176, 105, 0.12)',
    },
    itemEmoji: {
        fontSize: 16,
    },
    itemLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: looviColors.text.primary,
    },
    keyPoint: {
        marginTop: spacing.md,
    },
    keyPointText: {
        fontSize: 14,
        fontWeight: '400',
        color: looviColors.text.secondary,
        lineHeight: 22,
        textAlign: 'center',
    },
    keyPointBold: {
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.screen.horizontal,
        paddingBottom: spacing.xl,
        paddingTop: spacing.md,
        backgroundColor: 'rgba(255,250,245,0.95)',
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
