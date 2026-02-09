/**
 * PaywallScreen
 * 
 * Premium subscription paywall with:
 * - Beautiful design matching onboarding flow
 * - Subtle X button to close
 * - Limited-time lifetime deal popup when closing
 * - RevenueCat integration
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Dimensions,
    Animated,
    Modal,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PurchasesPackage } from 'react-native-purchases';
import { Ionicons, Feather } from '@expo/vector-icons';
import { spacing, borderRadius } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';
import { GlassCard } from '../../components/GlassCard';
import { useRevenueCat } from '../../hooks/useRevenueCat';
import { useUserData } from '../../context/UserDataContext';
import { useAuthContext } from '../../context/AuthContext';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PaywallScreenProps = {
    navigation: NativeStackNavigationProp<any, 'Paywall'>;
};

// Premium features with icons
const PREMIUM_FEATURES = [
    {
        icon: 'camera-outline',
        title: 'Unlimited Food Scanning',
        description: 'Scan any food label to check sugar content',
    },
    {
        icon: 'analytics-outline',
        title: 'Advanced Analytics',
        description: 'Detailed insights into your sugar-free journey',
    },
    {
        icon: 'people-outline',
        title: 'Inner Circle Access',
        description: 'Connect with accountability partners',
    },
    {
        icon: 'flash-outline',
        title: 'SOS Craving Support',
        description: 'Instant help when cravings hit',
    },
    {
        icon: 'heart-outline',
        title: 'Wellness Tracking',
        description: 'Track mood, energy, sleep and more',
    },
    {
        icon: 'infinite-outline',
        title: 'Lifetime Updates',
        description: 'All future features included free',
    },
];

export default function PaywallScreen({ navigation }: PaywallScreenProps) {
    const { currentOffering, isLoading, purchasePackage, restorePurchases, isPremium } = useRevenueCat();
    const { hasCompletedOnboarding, completeOnboarding, setPostPaywallAuthRequired, setOnboardingCheckpoint } = useUserData();
    const { isAuthenticated } = useAuthContext();
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [showLifetimeDeal, setShowLifetimeDeal] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    // Entry animation
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Set default selected package when offerings load
    useEffect(() => {
        if (currentOffering?.availablePackages && currentOffering.availablePackages.length > 0) {
            const annual = currentOffering.annual;
            const monthly = currentOffering.monthly;
            setSelectedPackage(annual || monthly || currentOffering.availablePackages[0]);
        }
    }, [currentOffering]);

    // Milestone checkpoint
    useEffect(() => {
        setOnboardingCheckpoint('Paywall').catch(() => { });
    }, [setOnboardingCheckpoint]);

    // Navigate away if user is already premium
    useEffect(() => {
        if (!isLoading && isPremium && currentOffering !== null && hasCompletedOnboarding && isAuthenticated) {
            navigation.getParent()?.reset({
                index: 0,
                routes: [{ name: 'Main' }],
            });
        }
    }, [isPremium, isLoading, currentOffering, hasCompletedOnboarding, isAuthenticated, navigation]);

    const handleSubscribe = async () => {
        if (!selectedPackage) {
            Alert.alert('Error', 'Please select a subscription plan');
            return;
        }

        try {
            setIsPurchasing(true);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await purchasePackage(selectedPackage);
            await completeOnboarding();

            if (!isAuthenticated) {
                await setPostPaywallAuthRequired(true);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                    'Welcome to Premium! 🎉',
                    'Create your account to unlock all features.',
                    [{
                        text: 'Create Account',
                        onPress: () => {
                            navigation.getParent()?.reset({
                                index: 0,
                                routes: [{ name: 'Auth', params: { screen: 'SignUp' } }],
                            });
                        },
                    }]
                );
            } else {
                await setPostPaywallAuthRequired(false);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error: any) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            if (error.message !== 'Purchase cancelled') {
                Alert.alert('Purchase Failed', error.message || 'Please try again.');
            }
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleRestore = async () => {
        try {
            setIsRestoring(true);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await restorePurchases();

            if (isPremium) {
                Alert.alert('Success!', 'Your purchases have been restored.');
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Alert.alert('No Purchases Found', 'We couldn\'t find any previous purchases.');
            }
        } catch (error: any) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Restore Failed', error.message || 'Please try again.');
        } finally {
            setIsRestoring(false);
        }
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowLifetimeDeal(true);
    };

    const handleSkipFree = async () => {
        setShowLifetimeDeal(false);
        await completeOnboarding();

        if (!isAuthenticated) {
            await setPostPaywallAuthRequired(true);
            navigation.getParent()?.reset({
                index: 0,
                routes: [{ name: 'Auth', params: { screen: 'SignUp' } }],
            });
        } else {
            await setPostPaywallAuthRequired(false);
            navigation.getParent()?.reset({
                index: 0,
                routes: [{ name: 'Main' }],
            });
        }
    };

    const handleLifetimePurchase = async () => {
        // For now, trigger the annual package as "lifetime" - you can configure a real lifetime product in RevenueCat
        if (currentOffering?.annual) {
            setSelectedPackage(currentOffering.annual);
            setShowLifetimeDeal(false);
            await handleSubscribe();
        } else {
            Alert.alert('Error', 'Lifetime deal not available');
        }
    };

    const packages = currentOffering?.availablePackages || [];

    const getPackageName = (pkg: PurchasesPackage): string => {
        if (pkg.packageType === 'ANNUAL') return 'Annual';
        if (pkg.packageType === 'MONTHLY') return 'Monthly';
        return pkg.identifier;
    };

    const getSavings = (pkg: PurchasesPackage): string | undefined => {
        if (pkg.packageType === 'ANNUAL' && currentOffering?.monthly) {
            const monthlyPrice = currentOffering.monthly.product.price;
            const annualPrice = pkg.product.price;
            const monthlyEquivalent = monthlyPrice * 12;
            if (monthlyEquivalent > annualPrice) {
                const savings = ((monthlyEquivalent - annualPrice) / monthlyEquivalent) * 100;
                return `Save ${Math.round(savings)}%`;
            }
        }
        return undefined;
    };

    return (
        <LooviBackground variant="coralDominant">
            <SafeAreaView style={styles.container}>
                {/* Close Button */}
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleClose}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                    <Ionicons name="close" size={24} color={looviColors.text.tertiary} />
                </TouchableOpacity>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Animated Header */}
                    <Animated.View style={[
                        styles.header,
                        {
                            opacity: fadeAnim,
                            transform: [
                                { translateY: slideAnim },
                                { scale: scaleAnim },
                            ],
                        },
                    ]}>
                        <View style={styles.crownContainer}>
                            <Text style={styles.crownEmoji}>👑</Text>
                        </View>
                        <Text style={styles.title}>Unlock Your{'\n'}Full Potential</Text>
                        <Text style={styles.subtitle}>
                            Join thousands breaking free from sugar addiction
                        </Text>
                    </Animated.View>

                    {/* Features Grid */}
                    <Animated.View style={[styles.featuresContainer, { opacity: fadeAnim }]}>
                        {PREMIUM_FEATURES.map((feature, index) => (
                            <View key={index} style={styles.featureRow}>
                                <View style={styles.featureIconContainer}>
                                    <Ionicons
                                        name={feature.icon as any}
                                        size={22}
                                        color={looviColors.accent.primary}
                                    />
                                </View>
                                <View style={styles.featureTextContainer}>
                                    <Text style={styles.featureTitle}>{feature.title}</Text>
                                    <Text style={styles.featureDescription}>{feature.description}</Text>
                                </View>
                            </View>
                        ))}
                    </Animated.View>

                    {/* Plans */}
                    {isLoading && packages.length === 0 ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={looviColors.accent.primary} />
                        </View>
                    ) : packages.length > 0 ? (
                        <Animated.View style={[styles.plansContainer, { opacity: fadeAnim }]}>
                            {packages.map((pkg) => {
                                const isSelected = selectedPackage?.identifier === pkg.identifier;
                                const isAnnual = pkg.packageType === 'ANNUAL';
                                const savings = getSavings(pkg);

                                return (
                                    <TouchableOpacity
                                        key={pkg.identifier}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setSelectedPackage(pkg);
                                        }}
                                        activeOpacity={0.8}
                                        disabled={isPurchasing}
                                        style={[
                                            styles.planCard,
                                            isSelected && styles.planCardSelected,
                                            isAnnual && styles.planCardPopular,
                                        ]}
                                    >
                                        {isAnnual && (
                                            <View style={styles.popularBadge}>
                                                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                                            </View>
                                        )}

                                        <View style={styles.planHeader}>
                                            <View style={[
                                                styles.radioOuter,
                                                isSelected && styles.radioOuterSelected,
                                            ]}>
                                                {isSelected && <View style={styles.radioInner} />}
                                            </View>
                                            <Text style={[
                                                styles.planName,
                                                isSelected && styles.planNameSelected,
                                            ]}>
                                                {getPackageName(pkg)}
                                            </Text>
                                        </View>

                                        <View style={styles.planPricing}>
                                            <Text style={[
                                                styles.planPrice,
                                                isSelected && styles.planPriceSelected,
                                            ]}>
                                                {pkg.product.priceString}
                                            </Text>
                                            <Text style={styles.planPeriod}>
                                                {isAnnual ? '/year' : '/month'}
                                            </Text>
                                        </View>

                                        {isAnnual && (
                                            <Text style={styles.planEquivalent}>
                                                Just {(pkg.product.price / 12).toFixed(2)}/month
                                            </Text>
                                        )}

                                        {savings && (
                                            <View style={styles.savingsBadge}>
                                                <Text style={styles.savingsText}>{savings}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </Animated.View>
                    ) : null}

                    {/* Trial info */}
                    <Text style={styles.trialInfo}>
                        ✓ 7-day free trial · Cancel anytime
                    </Text>
                </ScrollView>

                {/* Bottom CTA */}
                <View style={styles.bottomContainer}>
                    <TouchableOpacity
                        style={[
                            styles.subscribeButton,
                            (isPurchasing || !selectedPackage) && styles.subscribeButtonDisabled,
                        ]}
                        onPress={handleSubscribe}
                        activeOpacity={0.8}
                        disabled={isPurchasing || !selectedPackage || isLoading}
                    >
                        {isPurchasing ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.subscribeButtonText}>
                                Start Free Trial
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleRestore}
                        disabled={isRestoring || isPurchasing}
                        style={styles.restoreButton}
                    >
                        {isRestoring ? (
                            <ActivityIndicator size="small" color={looviColors.text.tertiary} />
                        ) : (
                            <Text style={styles.restoreText}>Restore Purchases</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Lifetime Deal Modal */}
            <Modal
                visible={showLifetimeDeal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowLifetimeDeal(false)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View style={styles.lifetimeModal}>
                        <View style={styles.lifetimeHeader}>
                            <Text style={styles.lifetimeEmoji}>🎁</Text>
                            <Text style={styles.lifetimeLabel}>LIMITED TIME OFFER</Text>
                            <Text style={styles.lifetimeTitle}>Wait! Special Deal{'\n'}Just For You</Text>
                            <Text style={styles.lifetimeSubtitle}>
                                Get lifetime access at a special price - this offer won't be shown again!
                            </Text>
                        </View>

                        <View style={styles.lifetimePricing}>
                            <Text style={styles.lifetimeOriginalPrice}>$99.99</Text>
                            <Text style={styles.lifetimeNewPrice}>$29.99</Text>
                            <Text style={styles.lifetimeOneTime}>One-time payment · Forever</Text>
                        </View>

                        <View style={styles.lifetimeFeatures}>
                            <Text style={styles.lifetimeFeature}>✓ All premium features forever</Text>
                            <Text style={styles.lifetimeFeature}>✓ Lifetime updates included</Text>
                            <Text style={styles.lifetimeFeature}>✓ No recurring charges</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.lifetimeCta}
                            onPress={handleLifetimePurchase}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.lifetimeCtaText}>Get Lifetime Access</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.noThanksButton}
                            onPress={handleSkipFree}
                        >
                            <Text style={styles.noThanksText}>No thanks, continue with free</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </LooviBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    closeButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 100,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing['3xl'],
        paddingBottom: spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    crownContainer: {
        marginBottom: spacing.md,
    },
    crownEmoji: {
        fontSize: 56,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.sm,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'center',
    },
    featuresContainer: {
        marginBottom: spacing.xl,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        backgroundColor: 'rgba(255,255,255,0.6)',
        padding: spacing.md,
        borderRadius: 16,
    },
    featureIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    featureTextContainer: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: looviColors.text.primary,
        marginBottom: 2,
    },
    featureDescription: {
        fontSize: 13,
        color: looviColors.text.secondary,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    plansContainer: {
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    planCard: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 20,
        padding: spacing.lg,
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
        overflow: 'visible',
    },
    planCardSelected: {
        borderColor: looviColors.accent.primary,
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
    },
    planCardPopular: {
        marginTop: 12,
    },
    popularBadge: {
        position: 'absolute',
        top: -12,
        alignSelf: 'center',
        backgroundColor: looviColors.accent.success,
        paddingHorizontal: spacing.md,
        paddingVertical: 4,
        borderRadius: 12,
    },
    popularBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: looviColors.text.muted,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    radioOuterSelected: {
        borderColor: looviColors.accent.primary,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: looviColors.accent.primary,
    },
    planName: {
        fontSize: 17,
        fontWeight: '600',
        color: looviColors.text.secondary,
    },
    planNameSelected: {
        color: looviColors.text.primary,
    },
    planPricing: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginLeft: 30,
    },
    planPrice: {
        fontSize: 28,
        fontWeight: '700',
        color: looviColors.text.secondary,
    },
    planPriceSelected: {
        color: looviColors.text.primary,
    },
    planPeriod: {
        fontSize: 14,
        color: looviColors.text.tertiary,
        marginLeft: 4,
    },
    planEquivalent: {
        fontSize: 13,
        color: looviColors.accent.success,
        fontWeight: '500',
        marginLeft: 30,
        marginTop: 4,
    },
    savingsBadge: {
        position: 'absolute',
        top: spacing.lg,
        right: spacing.lg,
        backgroundColor: 'rgba(127, 176, 105, 0.15)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 8,
    },
    savingsText: {
        fontSize: 12,
        fontWeight: '700',
        color: looviColors.accent.success,
    },
    trialInfo: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.text.secondary,
        textAlign: 'center',
    },
    bottomContainer: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing.md,
        paddingBottom: spacing.xl,
    },
    subscribeButton: {
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: looviColors.accent.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 8,
        marginBottom: spacing.md,
    },
    subscribeButtonDisabled: {
        opacity: 0.6,
    },
    subscribeButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    restoreButton: {
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    restoreText: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.text.tertiary,
    },
    // Lifetime Deal Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    lifetimeModal: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: spacing.xl,
        width: '100%',
        maxWidth: 360,
        alignItems: 'center',
    },
    lifetimeHeader: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    lifetimeEmoji: {
        fontSize: 48,
        marginBottom: spacing.sm,
    },
    lifetimeLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: looviColors.coralOrange,
        letterSpacing: 1,
        marginBottom: spacing.xs,
    },
    lifetimeTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    lifetimeSubtitle: {
        fontSize: 14,
        color: looviColors.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    lifetimePricing: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    lifetimeOriginalPrice: {
        fontSize: 18,
        color: looviColors.text.muted,
        textDecorationLine: 'line-through',
    },
    lifetimeNewPrice: {
        fontSize: 48,
        fontWeight: '800',
        color: looviColors.accent.success,
    },
    lifetimeOneTime: {
        fontSize: 14,
        color: looviColors.text.secondary,
        fontWeight: '500',
    },
    lifetimeFeatures: {
        alignSelf: 'stretch',
        marginBottom: spacing.lg,
    },
    lifetimeFeature: {
        fontSize: 15,
        color: looviColors.text.primary,
        marginBottom: spacing.xs,
        fontWeight: '500',
    },
    lifetimeCta: {
        backgroundColor: looviColors.accent.success,
        paddingVertical: 16,
        paddingHorizontal: spacing['2xl'],
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
        marginBottom: spacing.md,
        shadowColor: looviColors.accent.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
    },
    lifetimeCtaText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    noThanksButton: {
        paddingVertical: spacing.sm,
    },
    noThanksText: {
        fontSize: 14,
        color: looviColors.text.tertiary,
        fontWeight: '500',
    },
});
