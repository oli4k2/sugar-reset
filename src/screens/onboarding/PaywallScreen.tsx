/**
 * PaywallScreen
 * 
 * Multi-step paywall flow:
 * Step 1: "Try Craveless for free" - App preview
 * Step 2: "We'll send you a reminder" - Bell notification
 * Step 3: Timeline with plan selection - 3-day free trial
 * 
 * After trial cancellation:
 * - Offer 1: $14.99/year or $24.99 lifetime
 * - Offer 2: $14.99 lifetime (final)
 * - Free tier if declined
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions,
    Animated,
    Image,
    ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PurchasesPackage } from 'react-native-purchases';
import { Ionicons, Feather } from '@expo/vector-icons';
import LooviBackground, { looviColors } from '../../components/LooviBackground';
import { useRevenueCat } from '../../hooks/useRevenueCat';
import { useUserData } from '../../context/UserDataContext';
import { useAuthContext } from '../../context/AuthContext';
import * as Haptics from 'expo-haptics';
import { usePostHog } from 'posthog-react-native';

import CancellationOfferScreen from '../../components/CancellationOfferScreen';
import { notificationService, NOTIFICATION_PROMPTED_ONBOARDING_KEY } from '../../services/notificationService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive scaling: reference iPhone 14 (390pt), clamped for small phones and iPad
const BASE_WIDTH = 390;
const CONTENT_MAX_WIDTH = 500;
const IPAD_BREAKPOINT = 768;
const s = (size: number) => {
    const factor = Math.min(SCREEN_WIDTH, CONTENT_MAX_WIDTH) / BASE_WIDTH;
    return Math.round(size * Math.min(Math.max(factor, 0.8), 1.05));
};
// Timeline/roadmap scale: same as s() on phone, scales up on iPad so roadmap isn't too small
const t = (size: number) => {
    const base = s(size);
    if (SCREEN_WIDTH >= IPAD_BREAKPOINT) return Math.round(base * 1.2);
    return base;
};

type PaywallScreenProps = {
    navigation: NativeStackNavigationProp<any, 'Paywall'>;
    route?: any;
};

// Paywall steps
type PaywallStep = 'intro' | 'reminder' | 'plans';

export default function PaywallScreen({ navigation, route }: PaywallScreenProps) {
    const { currentOffering, isLoading, purchasePackage, isPremium, customerInfo, findPackageByIdentifier, restorePurchases } = useRevenueCat();
    const { hasCompletedOnboarding, completeOnboarding, setPostPaywallAuthRequired, setOnboardingCheckpoint, onboardingData } = useUserData();
    const { isAuthenticated } = useAuthContext();
    const posthog = usePostHog();

    // Check if we should show full flow (from route params or if in onboarding)
    const showFullFlow = route?.params?.showFullFlow || !hasCompletedOnboarding;

    // If user has completed onboarding AND we're not showing full flow, they're accessing from within the app
    const isFromApp = hasCompletedOnboarding && !showFullFlow;
    const [currentStep, setCurrentStep] = useState<PaywallStep>('intro'); // Always start at intro, will be adjusted if needed
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [showCancellationOffer, setShowCancellationOffer] = useState(false);
    const [isRequestingNotifications, setIsRequestingNotifications] = useState(false);

    // Check if user can get a trial (hasn't used one before AND account is new)
    // RevenueCat tracks trial usage - check if user has ever had a trial period
    const yearlyPkg = currentOffering?.annual;
    const hasUsedTrial = customerInfo?.entitlements?.all?.['premium']?.periodType === 'TRIAL' ||
        (customerInfo?.entitlements?.all?.['premium']?.willRenew === false &&
            customerInfo?.entitlements?.all?.['premium']?.expirationDate &&
            new Date(customerInfo.entitlements.all['premium'].expirationDate) < new Date());

    // Check account age (if > 3 days, no trial)
    const accountAgeDays = onboardingData?.startDate
        ? Math.floor((new Date().getTime() - new Date(onboardingData.startDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
    const isAccountNew = accountAgeDays <= 3;

    const canGetTrial = !hasUsedTrial && (yearlyPkg?.product?.introPrice !== null) && isAccountNew;

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const stepInitialized = useRef(false);

    // Ensure we start at the correct step based on showFullFlow
    // During onboarding (showFullFlow = true), always start at 'intro'
    // When accessed from app (isFromApp = true), start at 'plans'
    // Only initialize once to avoid resetting if user has progressed
    useEffect(() => {
        if (!stepInitialized.current) {
            if (showFullFlow) {
                // During onboarding, always start at intro step
                setCurrentStep('intro');
            } else if (isFromApp) {
                // When accessed from within the app, start at plans
                setCurrentStep('plans');
            }
            stepInitialized.current = true;
        }
    }, [showFullFlow, isFromApp]);

    // Animate on step change
    useEffect(() => {
        fadeAnim.setValue(0);
        slideAnim.setValue(30);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 10,
                useNativeDriver: true,
            }),
        ]).start();

        // Track step view
        posthog?.capture('paywall_step_viewed', {
            step: currentStep,
            has_trial: currentStep === 'plans'
        });

        // Map intro and reminder to paywall viewed for consistency with high-level conversion funnel
        if (currentStep === 'intro') {
            posthog?.capture('paywall_viewed');
        }
    }, [currentStep, posthog]);

    // Set default package
    useEffect(() => {
        if (currentOffering) {
            const pkg = selectedPlan === 'yearly' ? currentOffering.annual : currentOffering.monthly;
            setSelectedPackage(pkg || null);
        }
    }, [currentOffering, selectedPlan]);

    // Checkpoint
    useEffect(() => {
        setOnboardingCheckpoint('Paywall').catch(() => { });
    }, [setOnboardingCheckpoint]);

    // Navigate if already premium
    useEffect(() => {
        if (!isLoading && isPremium && currentOffering !== null && hasCompletedOnboarding && isAuthenticated) {
            navigation.getParent()?.reset({
                index: 0,
                routes: [{ name: 'Main' }],
            });
        }
    }, [isPremium, isLoading, currentOffering, hasCompletedOnboarding, isAuthenticated, navigation]);

    const handleNextStep = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        posthog?.capture('paywall_step_next_clicked', {
            current_step: currentStep
        });

        if (currentStep === 'intro') {
            setCurrentStep('reminder');
        } else if (currentStep === 'reminder') {
            setCurrentStep('plans');
        }
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        posthog?.capture('paywall_back_clicked', {
            current_step: currentStep
        });

        // If accessed from inside the app, allow going back to app
        if (isFromApp) {
            navigation.goBack();
            return;
        }

        // During onboarding, only allow navigation between steps
        // No way to skip/decline - must start free trial
        if (currentStep === 'reminder') {
            setCurrentStep('intro');
        } else if (currentStep === 'plans') {
            setCurrentStep('reminder');
        }
        // Removed: intro step back button no longer shows cancellation offer
        // Users must complete the paywall flow to start free trial
    };

    const handleEnableNotificationsFromOnboarding = async () => {
        if (isRequestingNotifications) return;
        setIsRequestingNotifications(true);
        try {
            // If this CTA was tapped, do not show the Home fallback nudge later.
            await AsyncStorage.setItem(NOTIFICATION_PROMPTED_ONBOARDING_KEY, '1');
            const status = await notificationService.requestNotificationPermissionOnly();
            if (status === 'granted') {
                Alert.alert('Nice! 🔔', 'Notifications are on. We will remind you before your trial ends.');
            } else {
                Alert.alert('No worries', 'You can enable notifications anytime in Profile > Notifications.');
            }
        } catch (error) {
            console.warn('Failed to request notifications from onboarding:', error);
            Alert.alert('Error', 'Could not request notifications right now. Please try again later.');
        } finally {
            setIsRequestingNotifications(false);
        }
    };

    const handleRestorePurchases = async () => {
        if (isRestoring || !restorePurchases) return;
        setIsRestoring(true);
        try {
            await restorePurchases();
            Alert.alert('Restore Complete', 'If you had an active subscription, you should now have access. Otherwise, no previous purchases were found.');

        } catch (err: any) {
            Alert.alert('Restore Failed', err?.message || 'Could not restore purchases. Please try again.');
        } finally {
            setIsRestoring(false);
        }
    };

    const handleAcceptYearly = async (step: 'offer1' | 'offer2' | 'free') => {
        posthog?.capture('paywall_cancellation_yearly_accepted', {
            offer_step: step
        });
        setShowCancellationOffer(false);
        setIsPurchasing(true);
        try {
            // Try to find the cancellation offer yearly package
            // Offer 1: 'annual_offer1' for yearly_subscription_offer ($14.99)
            // Offer 2: 'annual_offer2' for yearly_subscription_offer_2 ($14.99) - if exists
            let offerPackage: PurchasesPackage | null = null;

            if (step === 'offer1') {
                // Search across all offerings for annual_offer1
                offerPackage = await findPackageByIdentifier('annual_offer1');
            } else if (step === 'offer2') {
                // Search across all offerings for annual_offer2
                offerPackage = await findPackageByIdentifier('annual_offer2');
            }

            // Fallback to regular annual if offer package not found
            if (!offerPackage && currentOffering?.annual) {
                offerPackage = currentOffering.annual;
            }

            if (offerPackage) {
                posthog?.capture('purchase_initiated', {
                    package_id: offerPackage.identifier,
                    package_type: 'annual',
                    is_downsell: true,
                    offer_step: step
                });
                await purchasePackage(offerPackage);
                posthog?.capture('purchase_successful', {
                    package_id: offerPackage.identifier,
                    package_type: 'annual',
                    is_downsell: true
                });
                await completeSuccessFlow();
            } else {
                Alert.alert('Error', 'Yearly offer not available');
            }
        } catch (e: any) {
            console.warn(e);
            posthog?.capture('purchase_failed', {
                error: e.message,
                package_type: 'annual',
                is_downsell: true
            });
            Alert.alert('Error', e.message);
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleAcceptLifetime = async (step: 'offer1' | 'offer2' | 'free') => {
        posthog?.capture('paywall_cancellation_lifetime_accepted', {
            offer_step: step
        });
        setShowCancellationOffer(false);
        setIsPurchasing(true);
        try {
            // Try to find the cancellation offer lifetime package based on step
            // Offer 1: 'lifetime_offer1' for lifetime_offer_1 ($24.99)
            // Offer 2: 'lifetime_offer2' for lifetime_offer_2 ($14.99)
            let offerPackage: PurchasesPackage | null = null;

            if (step === 'offer1') {
                // Search across all offerings for lifetime_offer1
                offerPackage = await findPackageByIdentifier('lifetime_offer1');
            } else if (step === 'offer2') {
                // Search across all offerings for lifetime_offer2
                offerPackage = await findPackageByIdentifier('lifetime_offer2');
            }

            // Fallback to regular lifetime if offer packages not found
            if (!offerPackage && currentOffering?.lifetime) {
                offerPackage = currentOffering.lifetime;
            }

            if (offerPackage) {
                posthog?.capture('purchase_initiated', {
                    package_id: offerPackage.identifier,
                    package_type: 'lifetime',
                    is_downsell: true,
                    offer_step: step
                });
                await purchasePackage(offerPackage);
                posthog?.capture('purchase_successful', {
                    package_id: offerPackage.identifier,
                    package_type: 'lifetime',
                    is_downsell: true
                });
                await completeSuccessFlow();
            } else {
                Alert.alert('Error', 'Lifetime offer not available');
            }
        } catch (e: any) {
            console.warn(e);
            posthog?.capture('purchase_failed', {
                error: e.message,
                package_type: 'lifetime',
                is_downsell: true
            });
            Alert.alert('Error', e.message);
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleContinueFree = async () => {
        posthog?.capture('paywall_cancellation_declined_continue_free');
        setShowCancellationOffer(false);
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

    const completeSuccessFlow = async () => {
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

    const handleStartTrial = async () => {
        if (!selectedPackage) {
            Alert.alert('Error', 'Please select a plan');
            return;
        }

        try {
            setIsPurchasing(true);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            if (selectedPackage) {
                posthog?.capture('purchase_initiated', {
                    package_id: selectedPackage.identifier,
                    package_type: selectedPackage.packageType,
                    price: selectedPackage.product.price,
                    currency: selectedPackage.product.currencyCode
                });
            }

            // Check if purchasePackage is available
            if (!purchasePackage) {
                console.error('purchasePackage function is not available');
                Alert.alert('Error', 'Subscription service is not available. Please try again later.');
                setIsPurchasing(false);
                return;
            }

            // Purchase the package - this will throw if it fails
            await purchasePackage(selectedPackage);

            // Verify purchase actually succeeded by checking premium status
            // Retry with increasing delays since RevenueCat may take time to propagate
            const { revenueCatService } = await import('../../services/revenueCatService');
            let hasPremium = false;
            const retryDelays = [500, 1500, 3000];

            for (const delay of retryDelays) {
                await new Promise(resolve => setTimeout(resolve, delay));
                const updatedInfo = await revenueCatService.getCustomerInfo();
                hasPremium = !!updatedInfo?.entitlements?.active?.['premium'];
                if (hasPremium) break;
            }

            if (!hasPremium) {
                // Purchase didn't actually complete - don't proceed
                throw new Error('Purchase verification failed. The subscription was not activated. Please try again.');
            }

            if (selectedPackage) {
                posthog?.capture('purchase_successful', {
                    package_id: selectedPackage.identifier,
                    package_type: selectedPackage.packageType
                });
            }

            // Schedule trial expiration reminder (2 days into trial = 1 day before it ends)
            // Only for yearly subscription (which has the 3-day free trial)
            if (selectedPlan === 'yearly' && selectedPackage?.packageType === 'ANNUAL') {
                try {
                    // Check if user has active premium entitlement with trial period
                    const latestInfo = await revenueCatService.getCustomerInfo();
                    const premiumEntitlement = latestInfo?.entitlements?.active?.['premium'];
                    if (premiumEntitlement && premiumEntitlement.expirationDate) {
                        const expirationDate = new Date(premiumEntitlement.expirationDate);
                        const now = new Date();
                        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                        // Only schedule if trial is active (expires in ~3 days)
                        if (daysUntilExpiration > 0 && daysUntilExpiration <= 3) {
                            const { notificationService } = await import('../../services/notificationService');
                            await notificationService.scheduleTrialExpirationReminder(expirationDate);
                            console.log('✅ Scheduled trial expiration reminder for', expirationDate.toLocaleDateString(), '(2 days into trial)');
                        }
                    }
                } catch (notifError) {
                    console.warn('Could not schedule trial reminder:', notifError);
                    // Don't fail the purchase if notification scheduling fails
                }
            }

            // Only complete onboarding if purchase was successful
            await completeOnboarding();

            if (!isAuthenticated) {
                await setPostPaywallAuthRequired(true);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                    'Welcome! 🎉',
                    'Your free trial has started. Create your account to continue.',
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

            // Don't complete onboarding if purchase failed
            const errorMessage = error.message || 'Purchase failed. Please try again.';

            // Check if it was a user cancellation
            if (error.message?.includes('cancelled') || error.message?.includes('canceled') || error.userCancelled) {
                posthog?.capture('purchase_cancelled', {
                    package_id: selectedPackage?.identifier,
                    package_type: selectedPackage?.packageType
                });
                Alert.alert('Purchase Cancelled', 'You cancelled the purchase. You can try again anytime.');
            } else {
                posthog?.capture('purchase_failed', {
                    error: errorMessage,
                    package_id: selectedPackage?.identifier,
                    package_type: selectedPackage?.packageType
                });
                Alert.alert('Purchase Failed', errorMessage);
            }

            // Don't complete onboarding - user stays on paywall to retry
        } finally {
            setIsPurchasing(false);
        }
    };

    // Calculate billing date (3 days from now)
    const getBillingDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 3);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Get price info
    const getMonthlyPrice = () => currentOffering?.monthly?.product.priceString || '$9.99';
    const getYearlyPrice = () => currentOffering?.annual?.product.priceString || '$29.99';
    const getYearlyMonthlyEquivalent = () => {
        const annualPkg = currentOffering?.annual;
        if (!annualPkg) return '$2.50';

        const price = annualPkg.product.price || 29.99;
        const currencyCode = annualPkg.product.currencyCode || 'USD';
        const monthlyPrice = price / 12;

        // Format based on currency
        if (currencyCode === 'USD') {
            return `$${monthlyPrice.toFixed(2)}`;
        } else {
            // For other currencies, use the same format as the yearly price but divide by 12
            // RevenueCat provides priceString in local format, so we'll calculate and format similarly
            const formatted = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(monthlyPrice);
            return formatted;
        }
    };

    // Render Step 1: Intro
    const renderIntroStep = () => (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <ScrollView
                style={styles.stepScroll}
                contentContainerStyle={styles.stepScrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <View style={styles.contentArea}>
                    <Text style={styles.mainTitle}>We want you to{'\n'}try Craveless for free.</Text>

                    {/* App Preview Mockup */}
                    <View style={styles.phonePreview}>
                        <View style={styles.phoneMockup}>
                            <Image
                                source={{ uri: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=800' }}
                                style={styles.previewImage}
                                resizeMode="cover"
                            />
                            <View style={styles.previewOverlay}>
                                <View style={styles.scannerCorners}>
                                    <View style={[styles.corner, styles.cornerTL]} />
                                    <View style={[styles.corner, styles.cornerTR]} />
                                    <View style={[styles.corner, styles.cornerBL]} />
                                    <View style={[styles.corner, styles.cornerBR]} />
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.bottomArea}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleNextStep}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.primaryButtonText}>
                            Try for {currentOffering?.annual?.product?.currencyCode === 'USD'
                                ? '$0.00'
                                : currentOffering?.annual?.product?.currencyCode
                                    ? `0.00 ${currentOffering.annual.product.currencyCode}`
                                    : '$0.00'}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.billedAmountText}>
                        Just {getYearlyPrice()} per year
                    </Text>
                    <Text style={styles.priceSubtext}>
                        (≈ {getYearlyMonthlyEquivalent()}/mo)
                    </Text>
                    <View style={styles.legalFooter}>
                        <View style={styles.legalFooterSmallLinksRow}>
                            <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')} style={styles.legalLinkTouchable}>
                                <Text style={styles.legalLinkTextSmall}>Privacy Policy</Text>
                            </TouchableOpacity>
                            <Text style={styles.legalSeparatorSmall}>•</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')} style={styles.legalLinkTouchable}>
                                <Text style={styles.legalLinkTextSmall}>Terms of Use</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </Animated.View>
    );

    // Render Step 2: Reminder
    const renderReminderStep = () => (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <ScrollView
                style={styles.stepScroll}
                contentContainerStyle={styles.stepScrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <View style={[styles.contentArea, styles.reminderContentArea]}>
                    <Text style={styles.mainTitle}>We'll send you{'\n'}a reminder before your{'\n'}free trial ends</Text>

                    {/* Bell Icon + Turn on notifications - vertically centered in remaining space */}
                    <View style={styles.reminderBellCentered}>
                        <View style={styles.bellAndNotificationGroup}>
                            <View style={styles.bellIconWrapper}>
                                <Ionicons name="notifications-outline" size={s(80)} color={looviColors.text.muted} />
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.notificationBadgeText}>1</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.notificationCtaButton}
                                onPress={handleEnableNotificationsFromOnboarding}
                                activeOpacity={0.75}
                                disabled={isRequestingNotifications}
                            >
                                <Text style={styles.notificationCtaText}>
                                    {isRequestingNotifications ? 'Opening...' : 'Turn on notifications'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.bottomArea}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleNextStep}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.primaryButtonText}>Continue for FREE</Text>
                    </TouchableOpacity>

                    <Text style={styles.billedAmountText}>
                        Just {getYearlyPrice()} per year
                    </Text>
                    <Text style={styles.priceSubtext}>
                        (≈ {getYearlyMonthlyEquivalent()}/mo)
                    </Text>
                    <View style={styles.legalFooter}>
                        <View style={styles.legalFooterSmallLinksRow}>
                            <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')} style={styles.legalLinkTouchable}>
                                <Text style={styles.legalLinkTextSmall}>Privacy Policy</Text>
                            </TouchableOpacity>
                            <Text style={styles.legalSeparatorSmall}>•</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')} style={styles.legalLinkTouchable}>
                                <Text style={styles.legalLinkTextSmall}>Terms of Use</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </Animated.View>
    );

    // Render Step 3: Plans
    const renderPlansStep = () => {
        // Check if selected package has a trial period
        const yearlyPkg = currentOffering?.annual;
        const hasTrial = canGetTrial && (yearlyPkg?.product?.introPrice !== null);
        const isYearlySelected = selectedPlan === 'yearly';
        const showTrialForSelectedPlan = hasTrial && isYearlySelected;
        const title = isFromApp
            ? (hasTrial ? 'Upgrade to Premium' : 'Subscribe to Premium')
            : 'Start your 3-day FREE\ntrial to continue.';

        return (
            <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <ScrollView
                    style={styles.stepScroll}
                    contentContainerStyle={styles.stepScrollContent}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                <View style={styles.contentArea}>
                    <Text style={styles.mainTitle}>{title}</Text>

                    {/* Timeline - Only show during onboarding */}
                    {!isFromApp ? (
                        <View style={styles.timeline}>
                            {/* Today */}
                            <View style={styles.timelineItem}>
                                <View style={styles.timelineIconContainer}>
                                    <View style={[styles.timelineIcon, styles.timelineIconActive]}>
                                        <Ionicons name="lock-open" size={t(16)} color="#FFFFFF" />
                                    </View>
                                    <View style={styles.timelineLine} />
                                </View>
                                <View style={styles.timelineContent}>
                                    <Text style={styles.timelineTitle}>Today</Text>
                                    <Text style={styles.timelineDescription}>
                                        Unlock all the app's features like food scanning, craving support and more.
                                    </Text>
                                </View>
                            </View>

                            {/* Day 2 */}
                            <View style={styles.timelineItem}>
                                <View style={styles.timelineIconContainer}>
                                    <View style={[styles.timelineIcon, styles.timelineIconPending]}>
                                        <Ionicons name="notifications" size={t(16)} color="#FFFFFF" />
                                    </View>
                                    <View style={styles.timelineLine} />
                                </View>
                                <View style={styles.timelineContent}>
                                    <Text style={styles.timelineTitle}>In 2 Days - Reminder</Text>
                                    <Text style={styles.timelineDescription}>
                                        We'll send you a reminder that your trial is ending soon.
                                    </Text>
                                </View>
                            </View>

                            {/* Day 3 */}
                            <View style={styles.timelineItem}>
                                <View style={styles.timelineIconContainer}>
                                    <View style={[styles.timelineIcon, styles.timelineIconFuture]}>
                                        <Ionicons name="card" size={t(16)} color="#FFFFFF" />
                                    </View>
                                    <View style={styles.timelineLineBottom} />
                                </View>
                                <View style={styles.timelineContent}>
                                    <Text style={styles.timelineTitle}>In 3 Days - Billing Starts</Text>
                                    <Text style={styles.timelineDescription}>
                                        You'll be charged on {getBillingDate()} unless you cancel anytime before.
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.featuresContainer}>
                            <View style={styles.featureItem}>
                                <View style={styles.featureIconBg}>
                                    <Ionicons name="scan" size={20} color={looviColors.accent.primary} />
                                </View>
                                <Text style={styles.featureText}>Unlimited Food Scanning</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <View style={styles.featureIconBg}>
                                    <Ionicons name="stats-chart" size={20} color={looviColors.accent.primary} />
                                </View>
                                <Text style={styles.featureText}>Advanced Analytics</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <View style={styles.featureIconBg}>
                                    <Ionicons name="heart" size={20} color={looviColors.accent.primary} />
                                </View>
                                <Text style={styles.featureText}>Craving Support</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <View style={styles.featureIconBg}>
                                    <Ionicons name="people" size={20} color={looviColors.accent.primary} />
                                </View>
                                <Text style={styles.featureText}>Inner Circle Community</Text>
                            </View>
                        </View>
                    )}
                    {/* Plan Selection */}
                    <View style={styles.planSelection}>
                        {/* Monthly */}
                        <TouchableOpacity
                            style={[
                                styles.planOption,
                                selectedPlan === 'monthly' && styles.planOptionSelected,
                            ]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setSelectedPlan('monthly');
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.planLabel}>Monthly</Text>
                            <Text style={styles.planPrice}>{getMonthlyPrice()}<Text style={styles.planPeriod}>/mo</Text></Text>
                            <View style={[
                                styles.radioCircle,
                                selectedPlan === 'monthly' && styles.radioCircleSelected,
                            ]}>
                                {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
                            </View>
                        </TouchableOpacity>

                        {/* Yearly */}
                        <TouchableOpacity
                            style={[
                                styles.planOption,
                                selectedPlan === 'yearly' && styles.planOptionSelected,
                            ]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setSelectedPlan('yearly');
                            }}
                            activeOpacity={0.8}
                        >
                            {hasTrial && (
                                <View style={styles.freeTrialBadge}>
                                    <Text style={styles.freeTrialBadgeText}>3 DAYS FREE</Text>
                                </View>
                            )}
                            <Text style={styles.planLabel}>Yearly</Text>
                            {/* Annual total is the primary price for App Store compliance */}
                            <Text style={styles.planPrice}>
                                {getYearlyPrice()}
                                <Text style={styles.planPeriod}>/year</Text>
                            </Text>
                            {/* Monthly equivalent as secondary helper text */}
                            <Text style={styles.planMonthlyEquivalent}>
                                ≈ {getYearlyMonthlyEquivalent()}
                                <Text style={styles.planMonthlyEquivalentPeriod}>/mo</Text>
                            </Text>
                            <View style={[
                                styles.radioCircle,
                                selectedPlan === 'yearly' && styles.radioCircleSelected,
                            ]}>
                                {selectedPlan === 'yearly' && (
                                    <Ionicons name="checkmark" size={t(14)} color="#FFFFFF" />
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.bottomArea}>
                    <TouchableOpacity
                        style={[styles.primaryButton, isPurchasing && styles.buttonDisabled]}
                        onPress={handleStartTrial}
                        activeOpacity={0.8}
                        disabled={isPurchasing || isLoading}
                    >
                        {isPurchasing ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.primaryButtonText}>
                                {showTrialForSelectedPlan ? 'Start My 3-Day Free Trial' : (isFromApp || !hasTrial ? 'Subscribe Now' : 'Start Your Journey')}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.billedAmountText}>
                        {selectedPlan === 'yearly'
                            ? `Just ${getYearlyPrice()} per year`
                            : `${getMonthlyPrice()} per month`
                        }
                    </Text>
                    <Text style={styles.priceSubtext}>
                        {selectedPlan === 'yearly'
                            ? `(≈ ${getYearlyMonthlyEquivalent()}/mo)`
                            : `Billed at ${getMonthlyPrice()}/mo`
                        }
                    </Text>
                    <View style={styles.legalFooter}>
                        <View style={styles.legalFooterSmallLinksRow}>
                            <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')} style={styles.legalLinkTouchable}>
                                <Text style={styles.legalLinkTextSmall}>Privacy Policy</Text>
                            </TouchableOpacity>
                            <Text style={styles.legalSeparatorSmall}>•</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')} style={styles.legalLinkTouchable}>
                                <Text style={styles.legalLinkTextSmall}>Terms of Use</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                </ScrollView>
            </Animated.View>
        );
    };

    return (
        <LooviBackground variant="white">
            <SafeAreaView style={styles.container}>
                <View style={styles.innerContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        {(currentStep !== 'intro' || isFromApp) ? (
                            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                                <Ionicons name={isFromApp ? "close" : "chevron-back"} size={s(24)} color={looviColors.text.primary} />
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.backButton} />
                        )}
                        <TouchableOpacity
                            onPress={handleRestorePurchases}
                            disabled={isRestoring}
                            style={styles.restoreHeaderLink}
                        >
                            <Text style={styles.restoreHeaderText}>
                                {isRestoring ? 'Restoring...' : 'Restore Purchases'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Step Content */}
                    {currentStep === 'intro' && renderIntroStep()}
                    {currentStep === 'reminder' && renderReminderStep()}
                    {currentStep === 'plans' && renderPlansStep()}
                </View>
            </SafeAreaView>

            <CancellationOfferScreen
                visible={showCancellationOffer}
                onClose={() => setShowCancellationOffer(false)}
                onAcceptYearly={handleAcceptYearly}
                onAcceptLifetime={handleAcceptLifetime}
                onContinueFree={handleContinueFree}
            />
        </LooviBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
        maxWidth: CONTENT_MAX_WIDTH,
        width: '100%',
        alignSelf: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: s(20),
        paddingVertical: s(12),
    },
    backButton: {
        width: s(40),
        height: s(40),
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    restoreHeaderLink: {
        paddingVertical: s(8),
        paddingHorizontal: s(4),
        justifyContent: 'center',
    },
    restoreHeaderText: {
        fontSize: s(11),
        fontWeight: '500',
        color: looviColors.text.muted,
    },
    stepContainer: {
        flex: 1,
    },
    stepScroll: {
        flex: 1,
    },
    stepScrollContent: {
        flexGrow: 1,
        justifyContent: 'space-between',
    },
    contentArea: {
        paddingHorizontal: s(24),
        paddingTop: s(20),
    },
    reminderContentArea: {
        flex: 1,
    },
    reminderBellCentered: {
        flex: 1,
        justifyContent: 'center',
    },
    mainTitle: {
        fontSize: s(28),
        fontWeight: '800',
        color: looviColors.text.primary,
        textAlign: 'center',
        lineHeight: s(36),
        letterSpacing: -0.5,
    },
    phonePreview: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: s(24),
    },
    phoneMockup: {
        width: Math.min(SCREEN_WIDTH * 0.5, s(240)),
        height: Math.min(SCREEN_HEIGHT * 0.38, s(400)),
        backgroundColor: looviColors.text.primary,
        borderRadius: s(36),
        padding: s(8),
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: s(28),
    },
    previewOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scannerCorners: {
        ...StyleSheet.absoluteFillObject,
        margin: s(20),
    },
    corner: {
        position: 'absolute',
        width: s(20),
        height: s(20),
        borderColor: '#FFFFFF',
        borderWidth: 3,
    },
    cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
    bellAndNotificationGroup: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: s(24),
    },
    bellIconWrapper: {
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: s(28),
        height: s(28),
        borderRadius: s(14),
        backgroundColor: looviColors.coralOrange,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationBadgeText: {
        color: '#FFFFFF',
        fontSize: s(14),
        fontWeight: '700',
    },
    timeline: {
        marginTop: t(24),
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: t(8),
    },
    timelineIconContainer: {
        alignItems: 'center',
        width: t(40),
    },
    timelineIcon: {
        width: t(32),
        height: t(32),
        borderRadius: t(16),
        alignItems: 'center',
        justifyContent: 'center',
    },
    timelineIconActive: {
        backgroundColor: looviColors.coralOrange,
    },
    timelineIconPending: {
        backgroundColor: '#F59E0B',
    },
    timelineIconFuture: {
        backgroundColor: looviColors.text.muted,
    },
    timelineLine: {
        width: 3,
        flex: 1,
        backgroundColor: '#E5E5E5',
        marginVertical: 4,
    },
    timelineLineBottom: {
        width: 3,
        height: t(20),
        backgroundColor: '#E5E5E5',
        marginTop: 4,
    },
    timelineContent: {
        flex: 1,
        paddingLeft: t(12),
        paddingBottom: t(20),
    },
    timelineTitle: {
        fontSize: t(16),
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: 4,
    },
    timelineDescription: {
        fontSize: t(13),
        color: looviColors.text.secondary,
        lineHeight: t(18),
    },
    planSelection: {
        flexDirection: 'row',
        gap: t(12),
        marginTop: t(20),
    },
    planOption: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        borderRadius: t(16),
        padding: t(12),
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
    },
    planOptionSelected: {
        borderColor: looviColors.text.primary,
        backgroundColor: '#FFFFFF',
    },
    freeTrialBadge: {
        position: 'absolute',
        top: -12,
        alignSelf: 'center',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 1,
    },
    freeTrialBadgeText: {
        backgroundColor: looviColors.text.primary,
        color: '#FFFFFF',
        fontSize: t(12),
        fontWeight: '800',
        letterSpacing: 1,
        paddingHorizontal: t(12),
        paddingVertical: 4,
        borderRadius: 10,
        overflow: 'hidden',
    },
    planLabel: {
        fontSize: t(14),
        color: looviColors.text.secondary,
        marginBottom: 4,
    },
    planPrice: {
        fontSize: t(18),
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    planPeriod: {
        fontSize: t(14),
        fontWeight: '400',
        color: looviColors.text.secondary,
    },
    radioCircle: {
        position: 'absolute',
        right: t(12),
        top: '50%',
        marginTop: -(t(24) / 2),
        width: t(24),
        height: t(24),
        borderRadius: t(12),
        borderWidth: 2,
        borderColor: looviColors.text.muted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioCircleSelected: {
        backgroundColor: looviColors.text.primary,
        borderColor: looviColors.text.primary,
    },
    radioInner: {
        width: t(10),
        height: t(10),
        borderRadius: t(5),
        backgroundColor: '#FFFFFF',
    },
    bottomArea: {
        paddingHorizontal: s(24),
        paddingBottom: s(16),
    },
    primaryButton: {
        backgroundColor: looviColors.text.primary,
        paddingVertical: s(18),
        borderRadius: s(30),
        alignItems: 'center',
        marginBottom: s(8),
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    primaryButtonText: {
        fontSize: s(17),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    priceSubtext: {
        fontSize: s(13),
        color: looviColors.text.tertiary,
        textAlign: 'center',
    },
    billedAmountText: {
        fontSize: s(15),
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: 2,
    },
    notificationCtaButton: {
        marginTop: s(16),
        alignSelf: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    notificationCtaText: {
        fontSize: s(13),
        fontWeight: '600',
        color: looviColors.text.secondary,
        textDecorationLine: 'underline',
    },
    legalFooter: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: s(10),
    },
    legalLinkTouchable: {
        paddingVertical: 4,
        paddingHorizontal: 4,
    },
    legalLinkText: {
        fontSize: s(13),
        fontWeight: '500',
        color: looviColors.text.secondary,
        textDecorationLine: 'underline',
    },
    legalFooterSmallLinksRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s(4),
        marginTop: 4,
    },
    legalLinkTextSmall: {
        fontSize: s(10),
        fontWeight: '500',
        color: looviColors.text.secondary,
        textDecorationLine: 'underline',
    },
    legalSeparatorSmall: {
        fontSize: s(10),
        color: looviColors.text.tertiary,
    },
    featuresContainer: {
        marginTop: s(12),
        marginBottom: s(24),
        gap: s(12),
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.6)',
        padding: s(12),
        borderRadius: s(16),
    },
    featureIconBg: {
        width: s(36),
        height: s(36),
        borderRadius: s(18),
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: s(12),
    },
    featureText: {
        fontSize: s(16),
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    planMonthlyEquivalent: {
        marginTop: 2,
        fontSize: t(13),
        fontWeight: '500',
        color: looviColors.text.secondary,
    },
    planMonthlyEquivalentPeriod: {
        fontSize: t(12),
        fontWeight: '400',
        color: looviColors.text.tertiary,
    },
});
