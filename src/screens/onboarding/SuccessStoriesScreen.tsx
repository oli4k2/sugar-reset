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
    Image,
    ImageSourcePropType,
} from 'react-native';
import { usePostHog } from 'posthog-react-native';
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
    avatar: ImageSourcePropType;
    title: string;
    headline: string;
    quote: string;
}

const EXPERT_QUOTES: ExpertQuote[] = [
    {
        id: '1',
        name: 'Dr. Casey Means',
        avatar: require('../../../assets/images/onboarding/expert_casey_means.png'),
        title: 'Author of \'Good Energy\'',
        headline: 'The Worst Cellular Offender',
        quote: 'Of all the levers most damaging our cells and preventing \'Good Energy,\' I believe the worst offender may be added sugar. We need to see refined added sugar for what it is: an addictive, dangerous drug.',
    },
    {
        id: '2',
        name: 'Dr. Mindy Pelz',
        avatar: require('../../../assets/images/onboarding/expert_mindy_pelz.png'),
        title: 'Author of \'Fast Like a Girl\'',
        headline: 'Reactivate Your Immune System',
        quote: 'One of the greatest ways you can suppress your immune system is by eating sugar. Getting your body out of insulin resistance can save your life.',
    },
    {
        id: '3',
        name: 'Jessie Inchauspé',
        avatar: require('../../../assets/images/onboarding/expert_jessie_inchauspe.png'),
        title: 'The Glucose Goddess & Biochemist',
        headline: 'Slowing the Aging Process',
        quote: 'Fructose molecules glycate things 10 times as fast as glucose, generating much more damage. Since browning is aging and aging is browning, slowing down the browning reaction in your body leads to a longer life.',
    },
    {
        id: '4',
        name: 'Sarah Wilson',
        avatar: require('../../../assets/images/onboarding/expert_sarah_wilson.png'),
        title: 'Author of \'I Quit Sugar\'',
        headline: 'Freedom from Addiction',
        quote: 'Sugar is a drug. We know that sugar interacts with reward systems in the brain in much the same way as addictive drugs. I went sugar-free and I became freed from sugar.',
    },
];

export default function SuccessStoriesScreen({ navigation }: SuccessStoriesScreenProps) {
    const posthog = usePostHog();
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
        posthog?.capture('onboarding_success_stories_completed');
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
                                    <Image source={expert.avatar} style={styles.expertAvatar} resizeMode="contain" />
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
        paddingLeft: spacing.screen.horizontal + spacing.card.lg,
        paddingRight: spacing.screen.horizontal,
        paddingTop: spacing.xl,
        alignItems: 'flex-start',
        marginBottom: spacing.xl,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.xs,
        letterSpacing: -0.5,
        textAlign: 'left',
    },
    headerSubtitle: {
        fontSize: 17,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'left',
    },
    expertCard: {
        marginHorizontal: spacing.screen.horizontal,
        marginBottom: spacing.lg,
    },
    expertHeader: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    expertAvatar: {
        width: 42,
        height: 42,
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
