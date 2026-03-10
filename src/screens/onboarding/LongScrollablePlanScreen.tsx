/**
 * LongScrollablePlanScreen
 *
 * Vertically scrollable personalized plan summary. Shows user's goals,
 * value propositions, and app features. Data from onboarding (goals, nickname)
 * is reflected in the content.
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Animated,
    Easing,
    Dimensions,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { usePostHog } from 'posthog-react-native';

import { OnboardingStackParamList } from '../../types';
import LooviBackground, { looviColors, footerButtonWrapperStyle, sectionFullWidthStyle } from '../../components/LooviBackground';
import { spacing } from '../../theme';
import { useUserData } from '../../context/UserDataContext';
import PersonalizedInsight from '../../components/PersonalizedInsight';

type LongScrollablePlanScreenProps = {
    navigation: NativeStackNavigationProp<OnboardingStackParamList, 'LongScrollablePlan'>;
};

const GOAL_CONFIG: Record<string, { label: string; icon: string }> = {
    cravings: { label: 'Reduce Cravings', icon: 'shield' },
    energy: { label: 'Increased Energy', icon: 'zap' },
    weight: { label: 'Weight Management', icon: 'trending-down' },
    health: { label: 'Better Health', icon: 'heart' },
    money: { label: 'Save Money', icon: 'dollar-sign' },
    sleep: { label: 'Better Sleep', icon: 'moon' },
    skin: { label: 'Clearer Skin', icon: 'sun' },
    mood: { label: 'Stable Mood', icon: 'smile' },
};

const DARK_SECTION_BG = '#1E293B';

// Plan section images (order: top to bottom on the screen)
const PLAN_IMAGES = {
    headerCheck: require('../../../assets/images/plan/plan-8.png'),
    bestVersion: require('../../../assets/images/plan/plan-9.png'),
    conquerLogo: require('../../../assets/images/plan/plan-10.png'),
    conquerLock: require('../../../assets/images/plan/plan-11.png'),
    conquerUser: require('../../../assets/images/plan/plan-12.png'),
    conquerHeart: require('../../../assets/images/plan/plan-13.png'),
    conquerSmile: require('../../../assets/images/plan/plan-14.png'),
    relationshipsHero: require('../../../assets/images/plan/plan-15.png'),
    relationshipsZap: require('../../../assets/images/plan/plan-16.png'),
    relationshipsShield: require('../../../assets/images/plan/plan-17.png'),
    relationshipsHeart: require('../../../assets/images/plan/plan-18.png'),
    relationshipsTrending: require('../../../assets/images/plan/plan-19.png'),
};

// Gradient for cards and CTA: orange -> lighter orange -> lightest -> blueish -> light blue
const CARD_GRADIENT_COLORS = [
    looviColors.coralDark,   // orange
    looviColors.coralOrange, // lighter orange
    looviColors.coralSoft,   // lightest
    '#D0D8E8',              // blueish (lavender)
    looviColors.skyBlue,    // light blue
] as const;
const CARD_GRADIENT_LOCATIONS = [0, 0.28, 0.52, 0.75, 1] as const;

// Approximate step card area for random star placement (full width minus section padding)
const CARD_WIDTH = Dimensions.get('window').width - 2 * spacing.screen.horizontal;
const CARD_HEIGHT = 64;

function FlickeringStars({ count = 10 }: { count?: number }) {
    const stars = useRef(
        Array.from({ length: count }, () => ({
            opacity: new Animated.Value(0),
            translateY: new Animated.Value(0),
            translateX: new Animated.Value(0),
            left: 6 + Math.random() * (CARD_WIDTH - 20),
            top: 6 + Math.random() * (CARD_HEIGHT - 16),
            size: Math.random() * 1.8 + 1,
            duration: 4000 + Math.random() * 4000,
            delay: Math.random() * 2000,
        }))
    ).current;

    useEffect(() => {
        let cancelled = false;
        const runStar = (star: (typeof stars)[0]) => {
            if (cancelled) return;
            star.translateY.setValue(0);
            star.translateX.setValue(0);
            star.opacity.setValue(0);

            const driftY = -12 - Math.random() * 14;
            const driftX = (Math.random() - 0.5) * 18;

            Animated.sequence([
                Animated.delay(star.delay),
                Animated.parallel([
                    Animated.timing(star.translateY, {
                        toValue: driftY,
                        duration: star.duration,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(star.translateX, {
                        toValue: driftX,
                        duration: star.duration,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.sequence([
                        Animated.timing(star.opacity, {
                            toValue: 0.7,
                            duration: star.duration * 0.15,
                            useNativeDriver: true,
                        }),
                        Animated.timing(star.opacity, {
                            toValue: 0.7,
                            duration: star.duration * 0.45,
                            useNativeDriver: true,
                        }),
                        Animated.timing(star.opacity, {
                            toValue: 0,
                            duration: star.duration * 0.4,
                            useNativeDriver: true,
                        }),
                    ]),
                ]),
            ]).start(() => {
                if (!cancelled) runStar(star);
            });
        };

        const timeouts = stars.map((star, i) => setTimeout(() => runStar(star), i * 150));
        return () => {
            cancelled = true;
            timeouts.forEach(clearTimeout);
        };
    }, []);

    return (
        <>
            {stars.map((star, i) => (
                <Animated.View
                    key={i}
                    style={[
                        styles.starDot,
                        {
                            left: star.left,
                            top: star.top,
                            width: star.size,
                            height: star.size,
                            borderRadius: star.size / 2,
                            opacity: star.opacity,
                            transform: [
                                { translateY: star.translateY },
                                { translateX: star.translateX },
                            ],
                        },
                    ]}
                />
            ))}
        </>
    );
}

export default function LongScrollablePlanScreen({ navigation }: LongScrollablePlanScreenProps) {
    const { onboardingData, setOnboardingCheckpoint } = useUserData();
    const insets = useSafeAreaInsets();
    const { height: windowHeight } = useWindowDimensions();
    const posthog = usePostHog();

    // Push footer content down slightly; scale with screen height for different device sizes
    const footerContentOffset = Math.round(Math.min(14, Math.max(6, windowHeight * 0.012)));

    const quitDate = new Date();
    const dayOfMonth = quitDate.getDate();
    quitDate.setMonth(quitDate.getMonth() + 2);
    // Handle cases where the target month has fewer days than the current month
    // (e.g., March 31st -> June 30th)
    if (quitDate.getDate() !== dayOfMonth) {
        quitDate.setDate(0);
    }
    const formattedDate = quitDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const userGoals =
        onboardingData?.goals && onboardingData.goals.length > 0
            ? onboardingData.goals
            : ['energy', 'mood', 'sleep'];

    const handleContinue = () => {
        posthog?.capture('onboarding_plan_view_completed');
        navigation.navigate('Paywall', { showFullFlow: true });
    };

    // Track land
    useEffect(() => {
        setOnboardingCheckpoint('LongScrollablePlan').catch(() => { });

        posthog?.capture('onboarding_plan_view_started', {
            goals: onboardingData?.goals || [],
            triggers: onboardingData?.triggers || [],
            crave_intensity: onboardingData?.craveIntensity || '0',
            nickname: onboardingData?.nickname || ''
        });
    }, []);

    const GoalPill = ({ label }: { label: string }) => (
        <View style={styles.pill}>
            <Text style={styles.pillText}>{label}</Text>
        </View>
    );

    const FeatureRow = ({
        icon,
        color,
        imageSource,
        text,
        boldText,
    }: {
        icon?: string;
        color?: string;
        imageSource?: number;
        text: string;
        boldText?: string;
    }) => (
        <View style={styles.featureRow}>
            <View style={[styles.iconCircle, imageSource ? undefined : { backgroundColor: color }]}>
                {imageSource ? (
                    <Image source={imageSource} style={styles.featureRowImage} resizeMode="contain" />
                ) : (
                    <Feather name={(icon ?? 'circle') as any} size={16} color="#FFFFFF" />
                )}
            </View>
            <Text style={styles.featureText}>
                {boldText ? <Text style={styles.boldText}>{boldText} </Text> : null}
                {text}
            </Text>
        </View>
    );

    const StepItem = ({ text }: { text: string }) => (
        <View style={styles.stepItem}>
            <LinearGradient
                colors={[...CARD_GRADIENT_COLORS]}
                locations={[...CARD_GRADIENT_LOCATIONS]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.stepStarsWrap} pointerEvents="none">
                <FlickeringStars count={6} />
            </View>
            <Text style={styles.stepText}>{text}</Text>
        </View>
    );

    return (
        <LooviBackground variant="blueDominant">
            <SafeAreaView style={[styles.container, sectionFullWidthStyle]} edges={['top', 'left', 'right']}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    {/* Header */}
                    <View style={styles.headerSection}>
                        <Image
                            source={PLAN_IMAGES.headerCheck}
                            style={styles.checkCircleImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.mainTitle}>
                            {onboardingData?.nickname || 'Friend'}, we've made you a{'\n'}custom plan.
                        </Text>
                        <Text style={styles.dateLabel}>You will be sugar-free by:</Text>
                        <View style={styles.dateContainer}>
                            <Text style={styles.dateText}>{formattedDate}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Best version of yourself */}
                    <View style={styles.section}>
                        <Image
                            source={PLAN_IMAGES.bestVersion}
                            style={styles.bestVersionImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.sectionTitle}>
                            Become the best version of{'\n'}yourself with Craveless
                        </Text>
                        <Text style={styles.sectionSubtitle}>Stronger. Healthier. Happier.</Text>
                        <View style={styles.pillsContainer}>
                            {userGoals.map((goalId) => {
                                const config = GOAL_CONFIG[goalId];
                                if (!config) return null;
                                return (
                                    <GoalPill key={goalId} label={config.label} />
                                );
                            })}
                        </View>
                    </View>

                    <PersonalizedInsight type="goal" />

                    <View style={styles.divider} />

                    {/* Conquer yourself */}
                    <View style={styles.section}>
                        <Image
                            source={PLAN_IMAGES.conquerLogo}
                            style={styles.illustration}
                            resizeMode="contain"
                        />
                        <Text style={styles.sectionTitle}>Conquer yourself</Text>
                        <View style={styles.featuresList}>
                            <FeatureRow
                                imageSource={PLAN_IMAGES.conquerLock}
                                boldText="Build unbreakable self-control"
                                text=""
                            />
                            <FeatureRow
                                imageSource={PLAN_IMAGES.conquerUser}
                                boldText="Become more confident"
                                text="and secure"
                            />
                            <FeatureRow
                                imageSource={PLAN_IMAGES.conquerHeart}
                                boldText="Boost your self-worth"
                                text=""
                            />
                            <FeatureRow
                                imageSource={PLAN_IMAGES.conquerSmile}
                                boldText="Fill each day with pride"
                                text="and happiness"
                            />
                        </View>
                    </View>

                    {/* Personalized Insight Strategy Card (Trigger focus) */}
                    <PersonalizedInsight type="trigger" />

                    <View style={styles.divider} />

                    {/* Build real relationships */}
                    <View style={styles.section}>
                        <Image
                            source={PLAN_IMAGES.relationshipsHero}
                            style={styles.illustration}
                            resizeMode="contain"
                        />
                        <Text style={styles.sectionTitle}>Build real relationships</Text>
                        <View style={styles.featuresList}>
                            <FeatureRow
                                imageSource={PLAN_IMAGES.relationshipsZap}
                                boldText="Enhance your emotional stability"
                                text=""
                            />
                            <FeatureRow
                                imageSource={PLAN_IMAGES.relationshipsShield}
                                boldText="Be more trustworthy"
                                text="and dependable"
                            />
                            <FeatureRow
                                imageSource={PLAN_IMAGES.relationshipsHeart}
                                boldText="Experience real connection"
                                text=""
                            />
                            <FeatureRow
                                imageSource={PLAN_IMAGES.relationshipsTrending}
                                boldText="Become the person they deserve"
                                text=""
                            />
                        </View>
                    </View>

                    {/* Personalized Insight (Social/Emotional focus) */}
                    <PersonalizedInsight type="social" />

                    {/* Simple, daily habits */}
                    <View style={styles.darkSection}>
                        <View style={styles.handIcon}>
                            <Feather name="check-circle" size={32} color="#FFFFFF" />
                        </View>
                        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>
                            Simple, daily habits
                        </Text>
                        <Text style={styles.whiteText}>
                            Craveless teaches science-based habits that make lasting, life-long
                            freedom from sugar addiction possible.
                        </Text>
                        <Text
                            style={[
                                styles.dateLabel,
                                { color: 'rgba(255,255,255,0.7)', marginTop: 20 },
                            ]}
                        >
                            You should quit sugar by:
                        </Text>
                        <View style={[styles.dateContainer, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                            <Text style={[styles.dateText, { color: '#FFFFFF' }]}>{formattedDate}</Text>
                        </View>
                        <Text style={[styles.subtitleCentered, { color: '#FFFFFF' }]}>
                            How to reach your goal:
                        </Text>
                        <View style={styles.stepsContainer}>
                            <StepItem text="Press the Panic Button when tempted" />
                            <StepItem text="Pledge daily to not relapse" />
                            <StepItem text="Track progress towards betterment" />
                            <StepItem text="Lean on the community for support" />
                        </View>
                    </View>

                </ScrollView>

                {/* Sticky CTA Footer */}
                <View
                    style={[
                        styles.ctaSection,
                        {
                            paddingTop: spacing.md + footerContentOffset,
                            paddingBottom: Math.max(spacing.sm, Math.max(spacing.md, insets.bottom + 8) - footerContentOffset),
                        },
                    ]}
                >
                    <View style={footerButtonWrapperStyle}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleContinue}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>Become Craveless</Text>
                        </TouchableOpacity>
                        <View style={styles.guaranteeRow}>
                            <Feather name="shield" size={14} color="rgba(255,255,255,0.7)" />
                            <Text style={styles.guaranteeText}>Secure & Private</Text>
                            <View style={styles.dot} />
                            <Feather name="check" size={14} color="rgba(255,255,255,0.7)" />
                            <Text style={styles.guaranteeText}>Cancel Anytime</Text>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </LooviBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: spacing['2xl'],
    },
    headerSection: {
        alignItems: 'center',
        paddingHorizontal: spacing.screen.horizontal,
        marginBottom: spacing['2xl'],
    },
    checkCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    checkCircleImage: {
        width: 80,
        height: 80,
        marginBottom: spacing.lg,
    },
    bestVersionImage: {
        width: 120,
        height: 80,
        marginBottom: spacing.md,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: looviColors.text.primary,
        textAlign: 'center',
        lineHeight: 36,
        marginBottom: spacing['2xl'],
    },
    dateLabel: {
        fontSize: 16,
        color: looviColors.text.secondary,
        fontWeight: '600',
        marginBottom: spacing.md,
    },
    dateContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    dateText: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
        width: '60%',
        alignSelf: 'center',
        marginVertical: spacing['2xl'],
    },
    section: {
        paddingHorizontal: spacing.screen.horizontal,
        alignItems: 'center',
        marginBottom: spacing['3xl'],
    },
    laurelContainer: {
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    starsRow: {
        flexDirection: 'row',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    sectionSubtitle: {
        fontSize: 16,
        color: looviColors.text.secondary,
        marginBottom: spacing.xl,
        fontWeight: '500',
    },
    pillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: looviColors.glass.background,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: looviColors.glass.border,
        marginBottom: spacing.xs,
    },
    pillText: {
        color: looviColors.text.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    illustration: {
        width: 150,
        height: 150,
        marginBottom: spacing.lg,
    },
    illustrationPlaceholder: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: looviColors.glass.light,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    featuresList: {
        width: '100%',
        marginTop: spacing.lg,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        backgroundColor: looviColors.glass.background,
        padding: spacing.md,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: looviColors.glass.border,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
        overflow: 'hidden',
    },
    featureRowImage: {
        width: 32,
        height: 32,
    },
    featureText: {
        fontSize: 14,
        color: looviColors.text.primary,
        flex: 1,
    },
    boldText: {
        fontWeight: '700',
    },
    testimonialContainer: {
        marginHorizontal: spacing.screen.horizontal,
        backgroundColor: looviColors.glass.background,
        borderRadius: 20,
        padding: spacing.xl,
        alignItems: 'center',
        marginBottom: spacing['3xl'],
        borderWidth: 1,
        borderColor: looviColors.glass.border,
    },
    insightContainer: {
        marginHorizontal: spacing.screen.horizontal,
        backgroundColor: 'rgba(78, 205, 196, 0.08)', // Very subtle teal tint
        borderRadius: 20,
        padding: spacing.xl,
        marginBottom: spacing['3xl'],
        borderWidth: 1,
        borderColor: looviColors.accent.primary, // Teal border to match brand
        shadowColor: looviColors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    insightIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: looviColors.accent.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    insightTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
        flex: 1,
    },
    insightText: {
        fontSize: 15,
        color: looviColors.text.secondary,
        lineHeight: 22,
    },
    testimonialText: {
        color: looviColors.text.primary,
        textAlign: 'center',
        fontSize: 15,
        marginTop: spacing.md,
        lineHeight: 22,
    },
    testimonialAuthor: {
        color: looviColors.text.tertiary,
        fontSize: 12,
        marginTop: spacing.md,
    },
    darkSection: {
        backgroundColor: '#1E293B',
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing['3xl'],
        paddingBottom: 60, // Increased from 30 to add a bit more space above the button
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    handIcon: {
        marginBottom: spacing.lg,
    },
    whiteText: {
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        lineHeight: 24,
        marginTop: spacing.md,
    },
    subtitleLeft: {
        alignSelf: 'flex-start',
        fontSize: 18,
        fontWeight: '700',
        marginTop: spacing['2xl'],
        marginBottom: spacing.lg,
    },
    subtitleCentered: {
        alignSelf: 'center',
        fontSize: 18,
        fontWeight: '700',
        marginTop: spacing['2xl'],
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    stepsContainer: {
        width: '100%',
        gap: spacing.md,
    },
    stepItem: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        borderRadius: 16,
        overflow: 'hidden',
        minHeight: 56,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    stepStarsWrap: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    starDot: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    stepText: {
        fontSize: 15,
        fontWeight: '700',
        color: looviColors.text.primary,
        lineHeight: 20,
        textAlign: 'center',
    },
    ctaSection: {
        backgroundColor: '#1E293B',
        paddingHorizontal: spacing.screen.horizontal,
        alignItems: 'center',
    },
    button: {
        backgroundColor: looviColors.accent.primary,
        width: '100%',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
        shadowColor: looviColors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    guaranteeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'stretch',
        marginTop: 2,
    },
    guaranteeText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '500',
        marginHorizontal: 4,
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: 'rgba(255,255,255,0.4)',
        marginHorizontal: 4,
    },
    bottomFiller: {
        backgroundColor: DARK_SECTION_BG,
    },
});
