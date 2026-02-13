/**
 * CancellationOfferScreen
 * 
 * Shown when users try to cancel their subscription or after trial expires.
 * Multi-step offer flow:
 * 
 * Offer 1: $12.99/year OR $24.99 lifetime (with X button)
 * Offer 2: $14.99 lifetime - Final chance (with X button)
 * Free tier: If they decline everything
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../theme';
import { looviColors } from './LooviBackground';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CancellationOfferProps {
    visible: boolean;
    onClose: () => void;
    onAcceptYearly: (step: OfferStep) => void;
    onAcceptLifetime: (step: OfferStep) => void;
    onContinueFree?: () => void; // Optional - only used if needed
}

type OfferStep = 'offer1' | 'offer2' | 'free';

export default function CancellationOfferScreen({
    visible,
    onClose,
    onAcceptYearly,
    onAcceptLifetime,
    onContinueFree,
}: CancellationOfferProps) {
    const [currentStep, setCurrentStep] = useState<OfferStep>('offer1');

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        if (visible) {
            setCurrentStep('offer1');
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.9);

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (currentStep === 'offer1') {
            // Show offer 2
            setCurrentStep('offer2');
        } else if (currentStep === 'offer2') {
            // After both offers declined, close and continue to free tier
            // No "continue free" button - just close
            onClose();
        } else {
            onClose();
        }
    };

    const handleAcceptYearly = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onAcceptYearly(currentStep);
    };

    const handleAcceptLifetime = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onAcceptLifetime(currentStep);
    };

    const handleContinueFree = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Only call if provided (for backward compatibility)
        if (onContinueFree) {
            onContinueFree();
        } else {
            // Just close - user goes to free tier automatically
            onClose();
        }
    };

    // Render Offer 1: $12.99/year or $24.99 lifetime
    const renderOffer1 = () => (
        <View style={styles.offerContent}>
            <Text style={styles.waitTitle}>Wait! Don't Go</Text>
            <Text style={styles.offerSubtitle}>
                We have a special offer just for you
            </Text>

            <View style={styles.offerGrid}>
                {/* Yearly Deal */}
                <TouchableOpacity
                    style={styles.offerCard}
                    onPress={handleAcceptYearly}
                    activeOpacity={0.8}
                >
                    <Text style={styles.dealLabel}>YEARLY DEAL</Text>
                    <Text style={styles.dealOriginalPrice}>$14.99</Text>
                    <Text style={styles.dealNewPrice}>$12.99</Text>
                    <Text style={styles.dealPeriod}>per year</Text>
                    <View style={styles.savingsBadge}>
                        <Text style={styles.savingsText}>Save 13%</Text>
                    </View>
                </TouchableOpacity>

                {/* Lifetime Deal */}
                <TouchableOpacity
                    style={[styles.offerCard, styles.offerCardHighlight]}
                    onPress={handleAcceptLifetime}
                    activeOpacity={0.8}
                >
                    <View style={styles.bestValueBadge}>
                        <Text style={styles.bestValueText}>BEST VALUE</Text>
                    </View>
                    <Text style={styles.dealLabel}>LIFETIME</Text>
                    <Text style={styles.dealOriginalPrice}>$24.99</Text>
                    <Text style={styles.dealNewPrice}>$24.99</Text>
                    <Text style={styles.dealPeriod}>one-time</Text>
                    <View style={[styles.savingsBadge, styles.savingsBadgeGold]}>
                        <Text style={styles.savingsText}>Best Deal</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.offerFeatures}>
                <Text style={styles.featureItem}>✓ All premium features</Text>
                <Text style={styles.featureItem}>✓ Cancel anytime for yearly</Text>
                <Text style={styles.featureItem}>✓ No recurring charges for lifetime</Text>
            </View>
        </View>
    );

    // Render Offer 2: $14.99 Lifetime - Final chance
    const renderOffer2 = () => (
        <View style={styles.offerContent}>
            <Text style={styles.finalChanceEmoji}>🎁</Text>
            <Text style={styles.finalChanceLabel}>FINAL OFFER</Text>
            <Text style={styles.waitTitle}>Last Chance!</Text>
            <Text style={styles.offerSubtitle}>
                Lifetime access at our lowest price ever
            </Text>

            <View style={styles.lifetimeCard}>
                <Text style={styles.lifetimeOriginal}>$24.99</Text>
                <Text style={styles.lifetimePrice}>$14.99</Text>
                <Text style={styles.lifetimePeriod}>Lifetime Access</Text>

                <View style={styles.lifetimeFeaturesList}>
                    <Text style={styles.lifetimeFeature}>✓ All premium features forever</Text>
                    <Text style={styles.lifetimeFeature}>✓ All future updates included</Text>
                    <Text style={styles.lifetimeFeature}>✓ Never pay again</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.lifetimeCta}
                onPress={handleAcceptLifetime}
                activeOpacity={0.8}
            >
                <Text style={styles.lifetimeCtaText}>Get Lifetime for $14.99</Text>
            </TouchableOpacity>
        </View>
    );

    // Render Free Tier info
    const renderFreeTier = () => (
        <View style={styles.offerContent}>
            <Text style={styles.freeEmoji}>👋</Text>
            <Text style={styles.waitTitle}>Continue with Free</Text>
            <Text style={styles.offerSubtitle}>
                You'll have access to limited features
            </Text>

            <View style={styles.freeComparisonCard}>
                <Text style={styles.comparisonTitle}>Free Plan Includes:</Text>
                <View style={styles.comparisonItem}>
                    <Ionicons name="checkmark-circle" size={20} color={looviColors.accent.success} />
                    <Text style={styles.comparisonText}>Basic food logging</Text>
                </View>
                <View style={styles.comparisonItem}>
                    <Ionicons name="checkmark-circle" size={20} color={looviColors.accent.success} />
                    <Text style={styles.comparisonText}>SOS panic button</Text>
                </View>
                <View style={styles.comparisonItem}>
                    <Ionicons name="checkmark-circle" size={20} color={looviColors.accent.success} />
                    <Text style={styles.comparisonText}>Community access</Text>
                </View>

                <View style={styles.divider} />

                <Text style={styles.comparisonTitle}>Premium Features You'll Miss:</Text>
                <View style={styles.comparisonItem}>
                    <Ionicons name="close-circle" size={20} color={looviColors.accent.error} />
                    <Text style={[styles.comparisonText, styles.textMuted]}>Unlimited food scanning</Text>
                </View>
                <View style={styles.comparisonItem}>
                    <Ionicons name="close-circle" size={20} color={looviColors.accent.error} />
                    <Text style={[styles.comparisonText, styles.textMuted]}>Advanced analytics</Text>
                </View>
                <View style={styles.comparisonItem}>
                    <Ionicons name="close-circle" size={20} color={looviColors.accent.error} />
                    <Text style={[styles.comparisonText, styles.textMuted]}>Wellness tracking</Text>
                </View>
                <View style={styles.comparisonItem}>
                    <Ionicons name="close-circle" size={20} color={looviColors.accent.error} />
                    <Text style={[styles.comparisonText, styles.textMuted]}>Inner Circle (accountability)</Text>
                </View>
            </View>

            <View style={styles.upgradeHint}>
                <Ionicons name="gift-outline" size={18} color={looviColors.accent.primary} />
                <Text style={styles.upgradeHintText}>
                    Invite 3 friends to earn Premium for free!
                </Text>
            </View>

            <TouchableOpacity
                style={styles.freeCta}
                onPress={handleContinueFree}
                activeOpacity={0.8}
            >
                <Text style={styles.freeCtaText}>Continue with Free</Text>
            </TouchableOpacity>
        </View>
    );

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.container,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <SafeAreaView style={styles.safeArea}>
                        {/* Close Button */}
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={handleClose}
                            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        >
                            <Ionicons name="close" size={24} color={looviColors.text.tertiary} />
                        </TouchableOpacity>

                        {currentStep === 'offer1' && renderOffer1()}
                        {currentStep === 'offer2' && renderOffer2()}
                        {/* Removed free tier step - users go directly to free tier after declining both offers */}
                    </SafeAreaView>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: SCREEN_WIDTH - 32,
        maxHeight: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        overflow: 'hidden',
    },
    safeArea: {
        padding: spacing.xl,
    },
    closeButton: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    offerContent: {
        alignItems: 'center',
        paddingTop: spacing.xl,
    },
    waitTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    offerSubtitle: {
        fontSize: 15,
        color: looviColors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    // Offer 1 Grid
    offerGrid: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    offerCard: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        borderRadius: 20,
        padding: spacing.lg,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    offerCardHighlight: {
        borderColor: looviColors.coralOrange,
        backgroundColor: 'rgba(255, 107, 107, 0.05)',
    },
    bestValueBadge: {
        position: 'absolute',
        top: -10,
        backgroundColor: looviColors.coralOrange,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: 8,
    },
    bestValueText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    dealLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: looviColors.text.tertiary,
        letterSpacing: 0.5,
        marginBottom: spacing.xs,
        marginTop: spacing.sm,
    },
    dealOriginalPrice: {
        fontSize: 16,
        color: looviColors.text.muted,
        textDecorationLine: 'line-through',
    },
    dealNewPrice: {
        fontSize: 36,
        fontWeight: '800',
        color: looviColors.text.primary,
    },
    dealPeriod: {
        fontSize: 13,
        color: looviColors.text.secondary,
        marginBottom: spacing.sm,
    },
    savingsBadge: {
        backgroundColor: 'rgba(127, 176, 105, 0.15)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 8,
    },
    savingsBadgeGold: {
        backgroundColor: 'rgba(255, 107, 107, 0.15)',
    },
    savingsText: {
        fontSize: 11,
        fontWeight: '700',
        color: looviColors.accent.success,
    },
    offerFeatures: {
        alignSelf: 'stretch',
        marginBottom: spacing.lg,
    },
    featureItem: {
        fontSize: 14,
        color: looviColors.text.secondary,
        marginBottom: spacing.xs,
    },
    // Offer 2 - Lifetime
    finalChanceEmoji: {
        fontSize: 56,
        marginBottom: spacing.sm,
    },
    finalChanceLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: looviColors.coralOrange,
        letterSpacing: 1,
        marginBottom: spacing.sm,
    },
    lifetimeCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 20,
        padding: spacing.xl,
        alignItems: 'center',
        alignSelf: 'stretch',
        marginBottom: spacing.lg,
    },
    lifetimeOriginal: {
        fontSize: 18,
        color: looviColors.text.muted,
        textDecorationLine: 'line-through',
    },
    lifetimePrice: {
        fontSize: 56,
        fontWeight: '800',
        color: looviColors.accent.success,
    },
    lifetimePeriod: {
        fontSize: 16,
        color: looviColors.text.secondary,
        fontWeight: '500',
        marginBottom: spacing.lg,
    },
    lifetimeFeaturesList: {
        alignSelf: 'stretch',
    },
    lifetimeFeature: {
        fontSize: 14,
        color: looviColors.text.primary,
        fontWeight: '500',
        marginBottom: spacing.xs,
    },
    lifetimeCta: {
        backgroundColor: looviColors.accent.success,
        paddingVertical: 16,
        paddingHorizontal: spacing['2xl'],
        borderRadius: 25,
        alignSelf: 'stretch',
        alignItems: 'center',
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
    // Free Tier
    freeEmoji: {
        fontSize: 48,
        marginBottom: spacing.sm,
    },
    freeComparisonCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 20,
        padding: spacing.lg,
        alignSelf: 'stretch',
        marginBottom: spacing.lg,
    },
    comparisonTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.sm,
    },
    comparisonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
        gap: spacing.sm,
    },
    comparisonText: {
        fontSize: 14,
        color: looviColors.text.primary,
    },
    textMuted: {
        color: looviColors.text.secondary,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E5E5',
        marginVertical: spacing.md,
    },
    upgradeHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.lg,
        padding: spacing.md,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 12,
    },
    upgradeHintText: {
        fontSize: 13,
        color: looviColors.accent.primary,
        fontWeight: '500',
    },
    freeCta: {
        backgroundColor: looviColors.text.primary,
        paddingVertical: 16,
        paddingHorizontal: spacing['2xl'],
        borderRadius: 25,
        alignSelf: 'stretch',
        alignItems: 'center',
    },
    freeCtaText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
