/**
 * PaywallScreen
 * 
 * Subscription options with RevenueCat integration.
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PurchasesPackage } from 'react-native-purchases';
import { spacing, borderRadius } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';
import { GlassCard } from '../../components/GlassCard';
import { useRevenueCat } from '../../hooks/useRevenueCat';
import { useUserData } from '../../context/UserDataContext';
import { useAuthContext } from '../../context/AuthContext';
import * as Haptics from 'expo-haptics';

type PaywallScreenProps = {
    navigation: NativeStackNavigationProp<any, 'Paywall'>;
};

interface PlanOption {
    id: string;
    name: string;
    price: string;
    period: string;
    savings?: string;
    popular?: boolean;
}

const plans: PlanOption[] = [
    {
        id: 'yearly',
        name: 'Annual',
        price: '$29.99',
        period: '/year',
        savings: 'Save 75%',
        popular: true,
    },
    {
        id: 'monthly',
        name: 'Monthly',
        price: '$9.99',
        period: '/month',
    },
];

const features = [
    '✓ Unlimited daily tracking',
    '✓ Science-based insights',
    '✓ Personalized recommendations',
    '✓ Progress analytics',
    '✓ Community support',
];

export default function PaywallScreen({ navigation }: PaywallScreenProps) {
    const { currentOffering, isLoading, purchasePackage, restorePurchases, isPremium } = useRevenueCat();
    const { hasCompletedOnboarding } = useUserData();
    const { isAuthenticated } = useAuthContext();
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    // Set default selected package when offerings load
    useEffect(() => {
        if (currentOffering?.availablePackages && currentOffering.availablePackages.length > 0) {
            // Prefer annual, then monthly
            const annual = currentOffering.annual;
            const monthly = currentOffering.monthly;
            setSelectedPackage(annual || monthly || currentOffering.availablePackages[0]);
        }
    }, [currentOffering]);

    // Navigate away if user is already premium (but only if not loading and RevenueCat is initialized)
    // IMPORTANT: Only navigate if user has completed onboarding AND is premium
    useEffect(() => {
        // Only skip paywall if:
        // 1. Not loading
        // 2. Premium is confirmed true
        // 3. We have offerings loaded (meaning RevenueCat is working)
        // 4. User has completed onboarding (to prevent skipping before onboarding is done)
        // 5. User is authenticated (required to access Main app)
        if (!isLoading && isPremium && currentOffering !== null && hasCompletedOnboarding && isAuthenticated) {
            console.log('✅ User has premium, completed onboarding, and is authenticated → navigating to Main');
            // User has everything needed, navigate to main app
            navigation.getParent()?.reset({
                index: 0,
                routes: [{ name: 'Main' }],
            });
        } else if (!isLoading && isPremium && hasCompletedOnboarding && !isAuthenticated) {
            console.log('ℹ️ User has premium but not authenticated → navigating to Auth');
            // User has premium but needs to log in
            navigation.getParent()?.reset({
                index: 0,
                routes: [{ name: 'Auth', params: { screen: 'SignUp' } }],
            });
        } else if (!isLoading && isPremium && !hasCompletedOnboarding) {
            console.log('ℹ️ User has premium but onboarding not complete, staying on paywall');
        } else if (!isLoading && !isPremium) {
            console.log('ℹ️ User does not have premium, showing paywall');
        } else if (isLoading) {
            console.log('⏳ Loading subscription status...');
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
            
            // Check if user is authenticated after purchase
            if (!isAuthenticated) {
                // Purchase successful but user is anonymous - need to log in to link purchase
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                    'Purchase Successful! 🎉',
                    'Your subscription is active, but you need to create an account to access premium features. Let\'s get you set up!',
                    [
                        {
                            text: 'Create Account',
                            onPress: () => {
                                // Navigate to Auth screen
                                navigation.getParent()?.reset({
                                    index: 0,
                                    routes: [{ name: 'Auth', params: { screen: 'SignUp' } }],
                                });
                            },
                        },
                    ]
                );
            } else {
                // User is authenticated - navigation will happen automatically via isPremium effect
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error: any) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            
            if (error.message === 'Purchase cancelled') {
                // User cancelled - don't show error
                return;
            }
            
            Alert.alert(
                'Purchase Failed',
                error.message || 'Unable to complete purchase. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleRestore = async () => {
        try {
            setIsRestoring(true);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await restorePurchases();
            
            // Check if restore was successful
            if (isPremium) {
                Alert.alert('Success', 'Your purchases have been restored!');
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Alert.alert('No Purchases Found', 'We couldn\'t find any purchases to restore.');
            }
        } catch (error: any) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(
                'Restore Failed',
                error.message || 'Unable to restore purchases. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsRestoring(false);
        }
    };

    const handleSkip = () => {
        // Still need to create account even when skipping paywall
        navigation.getParent()?.reset({
            index: 0,
            routes: [{ name: 'Auth', params: { screen: 'SignUp' } }],
        });
    };

    // Get available packages from RevenueCat
    const packages = currentOffering?.availablePackages || [];
    
    // Helper to get package display name
    const getPackageName = (pkg: PurchasesPackage): string => {
        if (pkg.packageType === 'ANNUAL') return 'Annual';
        if (pkg.packageType === 'MONTHLY') return 'Monthly';
        if (pkg.packageType === 'SIX_MONTH') return '6 Months';
        if (pkg.packageType === 'THREE_MONTH') return '3 Months';
        return pkg.identifier;
    };

    // Helper to check if package is popular (annual is usually best value)
    const isPopular = (pkg: PurchasesPackage): boolean => {
        return pkg.packageType === 'ANNUAL';
    };

    // Calculate savings for annual vs monthly
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
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.emoji}>🌟</Text>
                        <Text style={styles.title}>Unlock Your Journey</Text>
                        <Text style={styles.subtitle}>
                            Get full access to all premium features
                        </Text>
                    </View>

                    {/* Features */}
                    <GlassCard variant="light" padding="lg" style={styles.featuresCard}>
                        {features.map((feature, index) => (
                            <Text key={index} style={styles.featureText}>{feature}</Text>
                        ))}
                    </GlassCard>

                    {/* Plans */}
                    {isLoading && packages.length === 0 ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={looviColors.accent.primary} />
                            <Text style={styles.loadingText}>Loading subscription options...</Text>
                        </View>
                    ) : packages.length > 0 ? (
                        <View style={styles.plansContainer}>
                            {packages.map((pkg) => {
                                const isSelected = selectedPackage?.identifier === pkg.identifier;
                                const popular = isPopular(pkg);
                                const savings = getSavings(pkg);
                                
                                return (
                                    <TouchableOpacity
                                        key={pkg.identifier}
                                        onPress={() => setSelectedPackage(pkg)}
                                        activeOpacity={0.8}
                                        style={styles.planWrapper}
                                        disabled={isPurchasing}
                                    >
                                        <GlassCard
                                            variant="light"
                                            padding="md"
                                            style={isSelected ? {
                                                ...styles.planCard,
                                                ...styles.planCardSelected,
                                            } : styles.planCard}
                                        >
                                            {popular && (
                                                <View style={styles.popularBadge}>
                                                    <Text style={styles.popularText}>Best Value</Text>
                                                </View>
                                            )}
                                            <Text style={styles.planName}>{getPackageName(pkg)}</Text>
                                            <View style={styles.priceRow}>
                                                <Text style={styles.planPrice}>{pkg.product.priceString}</Text>
                                                {pkg.packageType === 'MONTHLY' && (
                                                    <Text style={styles.planPeriod}>/month</Text>
                                                )}
                                                {pkg.packageType === 'ANNUAL' && (
                                                    <Text style={styles.planPeriod}>/year</Text>
                                                )}
                                            </View>
                                            {savings && (
                                                <Text style={styles.planSavings}>{savings}</Text>
                                            )}
                                        </GlassCard>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>
                                Unable to load subscription options. Please check your connection.
                            </Text>
                        </View>
                    )}

                    {/* Trial info */}
                    {selectedPackage?.product.introPrice && (
                        <Text style={styles.trialInfo}>
                            {selectedPackage.product.introPrice.priceString === '$0.00' 
                                ? 'Start with a free trial. Cancel anytime.'
                                : `Special introductory price: ${selectedPackage.product.introPrice.priceString}`}
                        </Text>
                    )}
                    {!selectedPackage?.product.introPrice && (
                        <Text style={styles.trialInfo}>
                            Cancel anytime. No commitment.
                        </Text>
                    )}
                </ScrollView>

                {/* Bottom */}
                <View style={styles.bottomContainer}>
                    <TouchableOpacity
                        style={[
                            styles.subscribeButton,
                            (isPurchasing || !selectedPackage) && styles.subscribeButtonDisabled
                        ]}
                        onPress={handleSubscribe}
                        activeOpacity={0.8}
                        disabled={isPurchasing || !selectedPackage || isLoading}
                    >
                        {isPurchasing ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.subscribeButtonText}>
                                {selectedPackage?.product.introPrice?.priceString === '$0.00'
                                    ? 'Start Free Trial'
                                    : 'Subscribe'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.linksRow}>
                        <TouchableOpacity 
                            onPress={handleRestore}
                            disabled={isRestoring || isPurchasing}
                        >
                            {isRestoring ? (
                                <ActivityIndicator size="small" color={looviColors.text.tertiary} />
                            ) : (
                                <Text style={styles.linkText}>Restore Purchases</Text>
                            )}
                        </TouchableOpacity>
                        <Text style={styles.linkDivider}>•</Text>
                        <TouchableOpacity 
                            onPress={handleSkip}
                            disabled={isPurchasing || isRestoring}
                        >
                            <Text style={styles.linkText}>Skip for now</Text>
                        </TouchableOpacity>
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    emoji: {
        fontSize: 56,
        marginBottom: spacing.md,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'center',
    },
    featuresCard: {
        marginBottom: spacing.xl,
    },
    featureText: {
        fontSize: 15,
        fontWeight: '400',
        color: looviColors.text.secondary,
        marginBottom: spacing.sm,
    },
    plansContainer: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    planWrapper: {
        flex: 1,
        marginTop: 14, // Make room for popular badge
    },
    planCard: {
        alignItems: 'center',
        position: 'relative',
        paddingTop: spacing.md,
        minHeight: 120,
        overflow: 'visible',
        backgroundColor: 'transparent', // Fix iOS transparent box issue
    },
    planCardSelected: {
        borderColor: looviColors.accent.primary,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
    },
    popularBadge: {
        position: 'absolute',
        top: -10,
        backgroundColor: looviColors.accent.success,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: 8,
    },
    popularText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
        textTransform: 'uppercase',
    },
    planName: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.tertiary,
        marginBottom: spacing.xs,
        marginTop: spacing.sm,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    planPrice: {
        fontSize: 24,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    planPeriod: {
        fontSize: 14,
        fontWeight: '400',
        color: looviColors.text.tertiary,
    },
    planSavings: {
        fontSize: 12,
        fontWeight: '600',
        color: looviColors.accent.success,
        marginTop: spacing.xs,
    },
    trialInfo: {
        fontSize: 13,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        textAlign: 'center',
    },
    bottomContainer: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing.md,
        paddingBottom: spacing['2xl'],
    },
    subscribeButton: {
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: looviColors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
        marginBottom: spacing.lg,
    },
    subscribeButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    linksRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    linkText: {
        fontSize: 13,
        fontWeight: '500',
        color: looviColors.text.tertiary,
    },
    linkDivider: {
        marginHorizontal: spacing.md,
        color: looviColors.text.muted,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl,
        marginBottom: spacing.lg,
    },
    loadingText: {
        fontSize: 14,
        color: looviColors.text.secondary,
        marginTop: spacing.md,
    },
    errorContainer: {
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    errorText: {
        fontSize: 14,
        color: looviColors.accent.error,
        textAlign: 'center',
    },
    subscribeButtonDisabled: {
        opacity: 0.6,
    },
});
