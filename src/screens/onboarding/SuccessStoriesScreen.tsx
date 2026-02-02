/**
 * SuccessStoriesScreen
 * 
 * Expert quotes and professional insights showing:
 * - High-authority expert quote cards
 * - Scientific backing for quitting sugar
 * - Professional credentials and verified sources
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';
import { GlassCard } from '../../components/GlassCard';

type SuccessStoriesScreenProps = {
    navigation: NativeStackNavigationProp<any, 'SuccessStories'>;
};

interface ExpertQuote {
    id: string;
    name: string;
    avatar: string;
    title: string;
    headline: string;
    quote: string;
}

const EXPERT_QUOTES: ExpertQuote[] = [
    {
        id: '1',
        name: 'Andrew Huberman, Ph.D.',
        avatar: '👨‍🔬',
        title: 'Neuroscientist & Stanford Professor',
        headline: 'Reset your dopamine balance.',
        quote: 'Quitting sugar is less about willpower and more about reclaiming your brain\'s chemistry. Resetting your dopamine balance can dramatically improve motivation and everyday pleasure.',
    },
    {
        id: '2',
        name: 'Steven Bartlett',
        avatar: '🎙️',
        title: 'Host of \'The Diary of a CEO\'',
        headline: 'Reclaim your mental sovereignty.',
        quote: 'If you depend on anything, it\'s bad. Ultra-processed foods are poison. When you quit, you break the cycle of consumption and misery and reclaim your control.',
    },
    {
        id: '3',
        name: 'Dr. Mark Hyman',
        avatar: '⚕️',
        title: 'Functional Medicine Physician',
        headline: 'Stop the biological hijacking.',
        quote: 'Our hormones and brain chemistry are hijacked by sugar. Not metaphorically, but biologically. Quitting sugar is the fastest way to rapidly improve your health.',
    },
    {
        id: '4',
        name: 'Jessie Inchauspé',
        avatar: '🔬',
        title: 'The Glucose Goddess & Biochemist',
        headline: 'Slow down the aging process.',
        quote: 'Fructose molecules glycate things 10 times as fast as glucose. Since aging is essentially \'browning\' from the inside, reducing sugar leads to a longer, more vibrant life.',
    },
    {
        id: '5',
        name: 'Dr. Robert Lustig',
        avatar: '👨‍⚕️',
        title: 'Pediatric Endocrinologist',
        headline: 'Neutralize the chronic toxin.',
        quote: 'Sugar is a chronic toxin that kills you slowly by promoting chronic disease, regardless of your weight. Quitting is the only way to stop the metabolic damage.',
    },
];

export default function SuccessStoriesScreen({ navigation }: SuccessStoriesScreenProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        // Animate content in
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleContinue = () => {
        navigation.navigate('SugarResetGraph');
    };

    return (
        <LooviBackground variant="subtle">
            <SafeAreaView style={styles.container}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Real Results</Text>
                        <Text style={styles.headerSubtitle}>Explained By Experts and Professionals</Text>
                    </View>

                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        }}
                    >
                        {/* Expert Quote Cards */}
                        {EXPERT_QUOTES.map((expert) => (
                            <GlassCard
                                key={expert.id}
                                variant="light"
                                padding="lg"
                                style={styles.expertCard}
                            >
                                {/* Expert Header */}
                                <View style={styles.expertHeader}>
                                    <Text style={styles.expertAvatar}>{expert.avatar}</Text>
                                    <View style={styles.expertInfo}>
                                        <View style={styles.expertNameRow}>
                                            <Text style={styles.expertName}>{expert.name}</Text>
                                            <View style={styles.verifiedBadge}>
                                                <Text style={styles.verifiedIcon}>✓</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.expertTitle}>{expert.title}</Text>
                                    </View>
                                </View>

                                {/* Headline */}
                                <Text style={styles.expertHeadline}>{expert.headline}</Text>

                                {/* Quote */}
                                <Text style={styles.expertQuote}>"{expert.quote}"</Text>
                            </GlassCard>
                        ))}
                    </Animated.View>
                </ScrollView>

                {/* Continue Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleContinue}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.continueButtonText}>
                            See How It Works →
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing.xl,
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.xs,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 17,
        fontWeight: '400',
        color: looviColors.text.secondary,
    },
    expertCard: {
        marginHorizontal: spacing.screen.horizontal,
        marginBottom: spacing.lg,
    },
    expertHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    expertAvatar: {
        fontSize: 48,
        marginTop: 4,
    },
    expertInfo: {
        flex: 1,
    },
    expertNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: 4,
    },
    expertName: {
        fontSize: 17,
        fontWeight: '700',
        color: looviColors.text.primary,
        flexShrink: 1,
    },
    verifiedBadge: {
        backgroundColor: looviColors.accent.primary,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifiedIcon: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    expertTitle: {
        fontSize: 14,
        fontWeight: '400',
        color: looviColors.text.secondary,
        lineHeight: 18,
    },
    expertHeadline: {
        fontSize: 19,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.sm,
        lineHeight: 26,
    },
    expertQuote: {
        fontSize: 15,
        fontWeight: '400',
        color: looviColors.text.secondary,
        lineHeight: 24,
        fontStyle: 'italic',
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
