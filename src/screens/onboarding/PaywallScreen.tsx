/**
 * PaywallScreen
 * 
 * Multi-step paywall flow:
 * Step 1: "Try Craveless for free" - App preview
 * Step 2: "We'll send you a reminder" - Bell notification
 * Step 3: Timeline with plan selection - 3-day free trial
 * 
 * After trial cancellation:
 * - Offer 1: $15/year or $25 lifetime
 * - Offer 2: $15 lifetime (final)
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PurchasesPackage } from 'react-native-purchases';
import { Ionicons, Feather } from '@expo/vector-icons';
import { spacing } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';
import { useRevenueCat } from '../../hooks/useRevenueCat';
import { useUserData } from '../../context/UserDataContext';
import { useAuthContext } from '../../context/AuthContext';
import * as Haptics from 'expo-haptics';

import CancellationOfferScreen from '../../components/CancellationOfferScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PaywallScreenProps = {
    navigation: NativeStackNavigationProp<any, 'Paywall'>;
};

// Paywall steps
type PaywallStep = 'intro' | 'reminder' | 'plans';

export default function PaywallScreen({ navigation }: PaywallScreenProps) {
    const { currentOffering, isLoading, purchasePackage, restorePurchases, isPremium } = useRevenueCat();
    const { hasCompletedOnboarding, completeOnboarding, setPostPaywallAuthRequired, setOnboardingCheckpoint } = useUserData();
    const { isAuthenticated } = useAuthContext();

    const [currentStep, setCurrentStep] = useState<PaywallStep>('intro');
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [showCancellationOffer, setShowCancellationOffer] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

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
    }, [currentStep]);

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
        if (currentStep === 'intro') {
            setCurrentStep('reminder');
        } else if (currentStep === 'reminder') {
            setCurrentStep('plans');
        }
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentStep === 'reminder') {
            setCurrentStep('intro');
        } else if (currentStep === 'plans') {
            setCurrentStep('reminder');
        } else if (currentStep === 'intro') {
            setShowCancellationOffer(true);
        }
    };

    const handleAcceptYearly = async () => {
        setShowCancellationOffer(false);
        if (currentOffering?.annual) {
            setSelectedPackage(currentOffering.annual);
            await handleStartTrial();
        } else {
            Alert.alert('Error', 'Yearly plan not available');
        }
    };

    const handleAcceptLifetime = async () => {
        setShowCancellationOffer(false);
        // For now using annual as placeholder for lifetime
        // Ideally you would have a specific lifetime package configured
        if (currentOffering?.lifetime) {
            setSelectedPackage(currentOffering.lifetime);
            setIsPurchasing(true);
            try {
                await purchasePackage(currentOffering.lifetime);
                await completeSuccessFlow();
            } catch (e: any) {
                console.warn(e);
                Alert.alert('Error', e.message);
            } finally {
                setIsPurchasing(false);
            }
        } else if (currentOffering?.annual) {
            // Fallback to annual if no lifetime configured (for testing)
            setSelectedPackage(currentOffering.annual);
            await handleStartTrial();
        }
    };

    const handleContinueFree = async () => {
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

            // Check if purchasePackage is available
            if (!purchasePackage) {
                console.error('purchasePackage function is not available');
                Alert.alert('Error', 'Subscription service is not available. Please try again later.');
                setIsPurchasing(false);
                return;
            }

            const customerInfo = await purchasePackage(selectedPackage);

            // Schedule trial expiration reminder (2 days before trial ends)
            if (customerInfo?.entitlements?.active?.['premium']?.periodType === 'TRIAL' &&
                customerInfo.entitlements.active['premium'].expirationDate) {
                try {
                    const expirationDate = new Date(customerInfo.entitlements.active['premium'].expirationDate);
                    const { notificationService } = await import('../../services/notificationService');
                    await notificationService.scheduleTrialExpirationReminder(expirationDate);
                    console.log('✅ Scheduled trial expiration reminder for', expirationDate.toLocaleDateString());
                } catch (notifError) {
                    console.warn('Could not schedule trial reminder:', notifError);
                    // Don't fail the purchase if notification scheduling fails
                }
            }

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
            if (error.message !== 'Purchase cancelled') {
                Alert.alert('Error', error.message || 'Please try again.');
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
        const price = currentOffering?.annual?.product.price || 29.99;
        return `$${(price / 12).toFixed(2)}`;
    };

    // Render Step 1: Intro
    const renderIntroStep = () => (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
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
                <View style={styles.noPaymentRow}>
                    <Ionicons name="checkmark-circle" size={20} color={looviColors.accent.success} />
                    <Text style={styles.noPaymentText}>No Payment Due Now</Text>
                </View>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleNextStep}
                    activeOpacity={0.8}
                >
                    <Text style={styles.primaryButtonText}>Try for $0.00</Text>
                </TouchableOpacity>

                <Text style={styles.priceSubtext}>
                    Just {getYearlyPrice()} per year ({getYearlyMonthlyEquivalent()}/mo)
                </Text>
            </View>
        </Animated.View>
    );

    // Render Step 2: Reminder
    const renderReminderStep = () => (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.contentArea}>
                <Text style={styles.mainTitle}>We'll send you{'\n'}a reminder before your{'\n'}free trial ends</Text>

                {/* Bell Icon */}
                <View style={styles.bellContainer}>
                    <View style={styles.bellIconWrapper}>
                        <Ionicons name="notifications-outline" size={80} color={looviColors.text.muted} />
                        <View style={styles.notificationBadge}>
                            <Text style={styles.notificationBadgeText}>1</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.bottomArea}>
                <View style={styles.noPaymentRow}>
                    <Ionicons name="checkmark-circle" size={20} color={looviColors.accent.success} />
                    <Text style={styles.noPaymentText}>No Payment Due Now</Text>
                </View>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleNextStep}
                    activeOpacity={0.8}
                >
                    <Text style={styles.primaryButtonText}>Continue for FREE</Text>
                </TouchableOpacity>

                <Text style={styles.priceSubtext}>
                    Just {getYearlyPrice()} per year ({getYearlyMonthlyEquivalent()}/mo)
                </Text>
            </View>
        </Animated.View>
    );

    // Render Step 3: Plans
    const renderPlansStep = () => (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.contentArea}>
                <Text style={styles.mainTitle}>Start your 3-day FREE{'\n'}trial to continue.</Text>

                {/* Timeline */}
                <View style={styles.timeline}>
                    {/* Today */}
                    <View style={styles.timelineItem}>
                        <View style={styles.timelineIconContainer}>
                            <View style={[styles.timelineIcon, styles.timelineIconActive]}>
                                <Ionicons name="lock-open" size={16} color="#FFFFFF" />
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
                                <Ionicons name="notifications" size={16} color="#FFFFFF" />
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
                                <Ionicons name="card" size={16} color="#FFFFFF" />
                            </View>
                        </View>
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineTitle}>In 3 Days - Billing Starts</Text>
                            <Text style={styles.timelineDescription}>
                                You'll be charged on {getBillingDate()} unless you cancel anytime before.
                            </Text>
                        </View>
                    </View>
                </View>

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
                        <View style={styles.freeTrialBadge}>
                            <Text style={styles.freeTrialBadgeText}>3 DAYS FREE</Text>
                        </View>
                        <Text style={styles.planLabel}>Yearly</Text>
                        <Text style={styles.planPrice}>{getYearlyMonthlyEquivalent()}<Text style={styles.planPeriod}>/mo</Text></Text>
                        <View style={[
                            styles.radioCircle,
                            selectedPlan === 'yearly' && styles.radioCircleSelected,
                        ]}>
                            {selectedPlan === 'yearly' && (
                                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.bottomArea}>
                <View style={styles.noPaymentRow}>
                    <Ionicons name="checkmark-circle" size={20} color={looviColors.accent.success} />
                    <Text style={styles.noPaymentText}>No Payment Due Now</Text>
                </View>

                <TouchableOpacity
                    style={[styles.primaryButton, isPurchasing && styles.buttonDisabled]}
                    onPress={handleStartTrial}
                    activeOpacity={0.8}
                    disabled={isPurchasing || isLoading}
                >
                    {isPurchasing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.primaryButtonText}>Start My 3-Day Free Trial</Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.priceSubtext}>
                    3 days free, then {selectedPlan === 'yearly' ? getYearlyPrice() + ' per year' : getMonthlyPrice() + ' per month'} ({selectedPlan === 'yearly' ? getYearlyMonthlyEquivalent() : getMonthlyPrice()}/mo)
                </Text>
            </View>
        </Animated.View>
    );

    return (
        <LooviBackground variant="white">
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    {currentStep !== 'intro' ? (
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={24} color={looviColors.text.primary} />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.backButton} />
                    )}
                </View>

                {/* Step Content */}
                {currentStep === 'intro' && renderIntroStep()}
                {currentStep === 'reminder' && renderReminderStep()}
                {currentStep === 'plans' && renderPlansStep()}

                {/* Restore Link */}
                <TouchableOpacity
                    onPress={handleRestore}
                    disabled={isRestoring}
                    style={styles.restoreButtonBottom}
                >
                    {isRestoring ? (
                        <ActivityIndicator size="small" color={looviColors.text.tertiary} />
                    ) : (
                        <Text style={styles.restoreTextBottom}>Restore Purchases</Text>
                    )}
                </TouchableOpacity>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    restoreButtonBottom: {
        alignItems: 'center',
        paddingBottom: spacing.lg,
    },
    restoreTextBottom: {
        fontSize: 13,
        color: looviColors.text.tertiary,
        textDecorationLine: 'underline',
    },
    restoreText: {
        fontSize: 15,
        color: looviColors.text.tertiary,
        fontWeight: '500',
    },
    stepContainer: {
        flex: 1,
        justifyContent: 'space-between',
    },
    contentArea: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: looviColors.text.primary,
        textAlign: 'center',
        lineHeight: 36,
        letterSpacing: -0.5,
    },
    // Phone Preview
    phonePreview: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    phoneMockup: {
        width: SCREEN_WIDTH * 0.55,
        height: SCREEN_WIDTH * 0.9,
        backgroundColor: looviColors.text.primary,
        borderRadius: 36,
        padding: 8,
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
        borderRadius: 28,
    },
    previewOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scannerCorners: {
        width: 120,
        height: 120,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderColor: '#FFFFFF',
    },
    cornerTL: {
        top: 0,
        left: 0,
        borderTopWidth: 3,
        borderLeftWidth: 3,
        borderTopLeftRadius: 8,
    },
    cornerTR: {
        top: 0,
        right: 0,
        borderTopWidth: 3,
        borderRightWidth: 3,
        borderTopRightRadius: 8,
    },
    cornerBL: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 3,
        borderLeftWidth: 3,
        borderBottomLeftRadius: 8,
    },
    cornerBR: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 3,
        borderRightWidth: 3,
        borderBottomRightRadius: 8,
    },
    // Bell
    bellContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bellIconWrapper: {
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: looviColors.coralOrange,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationBadgeText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    // Timeline
    timeline: {
        marginTop: spacing.xl,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
    },
    timelineIconContainer: {
        alignItems: 'center',
        width: 40,
    },
    timelineIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
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
    timelineContent: {
        flex: 1,
        paddingLeft: spacing.md,
        paddingBottom: spacing.lg,
    },
    timelineTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: 4,
    },
    timelineDescription: {
        fontSize: 13,
        color: looviColors.text.secondary,
        lineHeight: 18,
    },
    // Plan Selection
    planSelection: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.lg,
    },
    planOption: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: spacing.md,
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
        top: -10,
        right: spacing.sm,
        backgroundColor: looviColors.text.primary,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: 8,
    },
    freeTrialBadgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    planLabel: {
        fontSize: 14,
        color: looviColors.text.secondary,
        marginBottom: 4,
    },
    planPrice: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    planPeriod: {
        fontSize: 14,
        fontWeight: '400',
        color: looviColors.text.secondary,
    },
    radioCircle: {
        position: 'absolute',
        right: spacing.md,
        top: '50%',
        marginTop: -10,
        width: 24,
        height: 24,
        borderRadius: 12,
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
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FFFFFF',
    },
    // Bottom
    bottomArea: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xl,
    },
    noPaymentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
        gap: spacing.xs,
    },
    noPaymentText: {
        fontSize: 15,
        color: looviColors.text.primary,
        fontWeight: '500',
    },
    primaryButton: {
        backgroundColor: looviColors.text.primary,
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    primaryButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    priceSubtext: {
        fontSize: 13,
        color: looviColors.text.tertiary,
        textAlign: 'center',
    },
});
