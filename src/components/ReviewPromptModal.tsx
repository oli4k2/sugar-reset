/**
 * ReviewPromptModal
 * 
 * An encouraging popup that asks the user to leave an app store review.
 * Triggered after:
 * - First food scan
 * - Second day of using the app (trial day 2)
 * 
 * Uses expo-store-review for the native review dialog.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as StoreReview from 'expo-store-review';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';

interface ReviewPromptModalProps {
    visible: boolean;
    onClose: () => void;
    variant: 'first_scan' | 'day_two' | 'profile';
}

const COPY = {
    first_scan: {
        emoji: '🎉',
        title: 'You go!',
        subtitle: 'First scan done!',
        body: "You just took your first step toward a healthier you. We'd love your support — a quick review helps others discover Craveless too!",
        reward: '⭐ Leave a review and earn bragging rights!',
    },
    day_two: {
        emoji: '💪',
        title: "You're on fire!",
        subtitle: 'Day 2 — keep it up!',
        body: "You're building real momentum. If you're enjoying Craveless, a quick review would mean the world to us!",
        reward: '🌟 Your review helps our community grow!',
    },
    profile: {
        emoji: '⭐',
        title: 'Rate Craveless',
        subtitle: 'How are we doing?',
        body: 'Your feedback helps us improve your experience and helps others discover the app.',
        reward: '✨ Tap a star to continue',
    },
};

export function ReviewPromptModal({ visible, onClose, variant }: ReviewPromptModalProps) {
    const copy = COPY[variant];
    const [selectedRating, setSelectedRating] = useState<number>(0);

    useEffect(() => {
        if (visible) {
            setSelectedRating(0);
        }
    }, [visible]);

    const shouldAskAppStoreReview = useMemo(() => selectedRating >= 4, [selectedRating]);

    const handleSubmitRating = async () => {
        if (!selectedRating) return;
        try {
            if (shouldAskAppStoreReview) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                const isAvailable = await StoreReview.isAvailableAsync();
                if (isAvailable) {
                    await StoreReview.requestReview();
                } else if (Platform.OS === 'ios') {
                    // iOS decides whether to show the native sheet.
                    await StoreReview.requestReview();
                }
            } else {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert(
                    'Thanks for your feedback',
                    "Thanks for rating us. We'll keep improving Craveless for you."
                );
            }
        } catch (error) {
            console.warn('Error requesting review:', error);
        } finally {
            onClose();
        }
    };

    const handleMaybeLater = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    style={styles.content}
                    activeOpacity={1}
                    onPress={() => { /* prevent close */ }}
                >
                    {/* Emoji */}
                    <Text style={styles.emoji}>{copy.emoji}</Text>

                    {/* Title */}
                    <Text style={styles.title}>{copy.title}</Text>

                    {/* Subtitle */}
                    <Text style={styles.subtitle}>{copy.subtitle}</Text>

                    {/* Body */}
                    <Text style={styles.body}>{copy.body}</Text>

                    {/* Reward hint */}
                    <View style={styles.rewardBadge}>
                        <Text style={styles.rewardText}>{copy.reward}</Text>
                    </View>

                    {/* Fake iOS-like rating card */}
                    <View style={styles.ratingCard}>
                        <Text style={styles.ratingPrompt}>Tap a star to rate</Text>
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    style={styles.starButton}
                                    onPress={() => setSelectedRating(star)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={selectedRating >= star ? 'star' : 'star-outline'}
                                        size={30}
                                        color={selectedRating >= star ? '#FFB400' : '#D1D5DB'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Continue Button */}
                    <TouchableOpacity
                        style={[styles.reviewButton, selectedRating === 0 && styles.reviewButtonDisabled]}
                        onPress={handleSubmitRating}
                        disabled={selectedRating === 0}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="star" size={18} color="#FFFFFF" />
                        <Text style={styles.reviewButtonText}>
                            {shouldAskAppStoreReview ? 'Continue to App Store' : 'Submit Rating'}
                        </Text>
                    </TouchableOpacity>

                    {/* Maybe Later */}
                    <TouchableOpacity
                        style={styles.laterButton}
                        onPress={handleMaybeLater}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.laterButtonText}>Maybe later</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.screen.horizontal,
    },
    content: {
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius['2xl'],
        padding: spacing.xl,
        paddingTop: 32,
        paddingBottom: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    emoji: {
        fontSize: 56,
        marginBottom: spacing.sm,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: looviColors.text.primary,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.accent.primary,
        textAlign: 'center',
        marginTop: 4,
        marginBottom: spacing.md,
    },
    body: {
        fontSize: 14,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: spacing.sm,
        marginBottom: spacing.md,
    },
    rewardBadge: {
        backgroundColor: 'rgba(251, 191, 36, 0.12)',
        borderRadius: borderRadius.lg,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginBottom: spacing.lg,
    },
    rewardText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#B45309',
        textAlign: 'center',
    },
    ratingCard: {
        width: '100%',
        borderRadius: 14,
        backgroundColor: '#F7F7F8',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingVertical: 12,
        paddingHorizontal: 10,
        marginBottom: spacing.md,
    },
    ratingPrompt: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 6,
    },
    starsRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    starButton: {
        paddingHorizontal: 6,
        paddingVertical: 3,
    },
    reviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: looviColors.accent.primary,
        borderRadius: borderRadius.lg,
        paddingVertical: 14,
        paddingHorizontal: 32,
        width: '100%',
        shadowColor: looviColors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    reviewButtonDisabled: {
        opacity: 0.6,
    },
    reviewButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    laterButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginTop: 4,
    },
    laterButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.text.tertiary,
    },
});

export default ReviewPromptModal;

