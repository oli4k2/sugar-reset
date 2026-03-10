/**
 * CancellationOfferScreen
 * 
 * Shown when users try to cancel their subscription or after trial expires.
 * Multi-step offer flow:
 * 
 * Offer 1: $14.99/year OR $24.99 lifetime (with X button)
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
import { looviColors } from './LooviBackground';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BASE_WIDTH = 390;
const MODAL_MAX_WIDTH = 468;
const s = (size: number) => {
    const factor = Math.min(SCREEN_WIDTH, MODAL_MAX_WIDTH) / BASE_WIDTH;
    return Math.round(size * Math.min(Math.max(factor, 0.8), 1.05));
};

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

    // Render Offer 1: $14.99/year or $24.99 lifetime
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
                    <Text style={styles.dealOriginalPrice}>$29.99</Text>
                    <Text
                        style={styles.dealNewPrice}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                    >
                        $14.99
                    </Text>
                    <Text style={styles.dealPeriod}>per year</Text>
                    <View style={styles.savingsBadge}>
                        <Text style={styles.savingsText}>Save 50%</Text>
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
                    {/* Removed strikethrough price */}
                    <Text
                        style={styles.dealNewPrice}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                    >
                        $24.99
                    </Text>
                    <Text style={styles.dealPeriod}>one-time</Text>
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
        width: Math.min(SCREEN_WIDTH - 32, MODAL_MAX_WIDTH),
        maxHeight: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: s(28),
        overflow: 'hidden',
    },
    safeArea: {
        padding: s(24),
    },
    closeButton: {
        position: 'absolute',
        top: s(12),
        right: s(12),
        width: s(36),
        height: s(36),
        borderRadius: s(18),
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    offerContent: {
        alignItems: 'center',
        paddingTop: s(24),
    },
    waitTitle: {
        fontSize: s(28),
        fontWeight: '800',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: s(8),
    },
    offerSubtitle: {
        fontSize: s(15),
        color: looviColors.text.secondary,
        textAlign: 'center',
        marginBottom: s(24),
    },
    offerGrid: {
        flexDirection: 'row',
        gap: s(12),
        marginBottom: s(20),
    },
    offerCard: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        borderRadius: s(20),
        padding: s(20),
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
        paddingHorizontal: s(8),
        paddingVertical: 3,
        borderRadius: 8,
    },
    bestValueText: {
        color: '#FFFFFF',
        fontSize: s(9),
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    dealLabel: {
        fontSize: s(11),
        fontWeight: '700',
        color: looviColors.text.tertiary,
        letterSpacing: 0.5,
        marginBottom: s(4),
        marginTop: s(8),
    },
    dealOriginalPrice: {
        fontSize: s(16),
        color: looviColors.text.muted,
        textDecorationLine: 'line-through',
    },
    dealNewPrice: {
        fontSize: s(36),
        fontWeight: '800',
        color: looviColors.text.primary,
    },
    dealPeriod: {
        fontSize: s(13),
        color: looviColors.text.secondary,
        marginBottom: s(8),
    },
    savingsBadge: {
        backgroundColor: 'rgba(127, 176, 105, 0.15)',
        paddingHorizontal: s(8),
        paddingVertical: 4,
        borderRadius: 8,
    },
    savingsBadgeGold: {
        backgroundColor: 'rgba(255, 107, 107, 0.15)',
    },
    savingsText: {
        fontSize: s(11),
        fontWeight: '700',
        color: looviColors.accent.success,
    },
    offerFeatures: {
        alignSelf: 'stretch',
        marginBottom: s(20),
    },
    featureItem: {
        fontSize: s(14),
        color: looviColors.text.secondary,
        marginBottom: s(4),
    },
    finalChanceEmoji: {
        fontSize: s(56),
        marginBottom: s(8),
    },
    finalChanceLabel: {
        fontSize: s(11),
        fontWeight: '800',
        color: looviColors.coralOrange,
        letterSpacing: 1,
        marginBottom: s(8),
    },
    lifetimeCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: s(20),
        padding: s(24),
        alignItems: 'center',
        alignSelf: 'stretch',
        marginBottom: s(20),
    },
    lifetimeOriginal: {
        fontSize: s(18),
        color: looviColors.text.muted,
        textDecorationLine: 'line-through',
    },
    lifetimePrice: {
        fontSize: s(56),
        fontWeight: '800',
        color: looviColors.accent.success,
    },
    lifetimePeriod: {
        fontSize: s(16),
        color: looviColors.text.secondary,
        fontWeight: '500',
        marginBottom: s(20),
    },
    lifetimeFeaturesList: {
        alignSelf: 'stretch',
    },
    lifetimeFeature: {
        fontSize: s(14),
        color: looviColors.text.primary,
        fontWeight: '500',
        marginBottom: s(4),
    },
    lifetimeCta: {
        backgroundColor: looviColors.accent.success,
        paddingVertical: s(16),
        paddingHorizontal: s(32),
        borderRadius: s(25),
        alignSelf: 'stretch',
        alignItems: 'center',
        shadowColor: looviColors.accent.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
    },
    lifetimeCtaText: {
        fontSize: s(17),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    freeEmoji: {
        fontSize: s(48),
        marginBottom: s(8),
    },
    freeComparisonCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: s(20),
        padding: s(20),
        alignSelf: 'stretch',
        marginBottom: s(20),
    },
    comparisonTitle: {
        fontSize: s(14),
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: s(8),
    },
    comparisonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: s(4),
        gap: s(8),
    },
    comparisonText: {
        fontSize: s(14),
        color: looviColors.text.primary,
    },
    textMuted: {
        color: looviColors.text.secondary,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E5E5',
        marginVertical: s(12),
    },
    upgradeHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: s(4),
        marginBottom: s(20),
        padding: s(12),
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: s(12),
    },
    upgradeHintText: {
        fontSize: s(13),
        color: looviColors.accent.primary,
        fontWeight: '500',
    },
    freeCta: {
        backgroundColor: looviColors.text.primary,
        paddingVertical: s(16),
        paddingHorizontal: s(32),
        borderRadius: s(25),
        alignSelf: 'stretch',
        alignItems: 'center',
    },
    freeCtaText: {
        fontSize: s(17),
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
