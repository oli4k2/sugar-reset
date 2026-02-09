import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { looviColors } from './LooviBackground';
import { spacing } from '../theme';
import { useUserData } from '../context/UserDataContext';

type InsightType = 'trigger' | 'goal' | 'social';

export default function PersonalizedInsight({ type }: { type: InsightType }) {
    const { onboardingData } = useUserData();
    
    let title = "";
    let text = "";

    const triggers = onboardingData?.triggers || [];
    const intensity = parseInt(onboardingData?.craveIntensity || '0');
    const goals = onboardingData?.goals || [];
    const symptoms = onboardingData?.symptoms || [];

    // Logic split by type to ensure unique insights per section
    if (type === 'goal') {
        // Focus on physical benefits / primary motivation
        // Priority: Energy > Weight > Skin > Sleep > Brain Fog > General Health
        if (goals.includes('energy') || symptoms.includes('energy_crash') || symptoms.includes('afternoon_slump') || symptoms.includes('wake_tired')) {
            title = "Restoring Your Vitality";
            text = "By stabilizing your glucose curve, we'll eliminate the post-sugar crash, giving you steady, reliable energy from morning to night.";
        } else if (goals.includes('weight') || symptoms.includes('bloated')) {
            title = "Metabolic Reset";
            text = "Your plan lowers insulin levels immediately, switching your body from fat-storage mode to natural fat-burning.";
        } else if (goals.includes('skin')) {
            title = "Clearing Inflammation";
            text = "Sugar is a key inflammatory driver. Your plan focuses on nutrient-dense foods to clear your skin from the inside out.";
        } else if (goals.includes('sleep') || symptoms.includes('cravings_night')) {
            title = "Deep Restorative Sleep";
            text = "Stabilizing blood sugar before bed will help you fall asleep faster and stay asleep, significantly improving your recovery.";
        } else if (symptoms.includes('brain_fog')) {
            title = "Mental Clarity";
            text = "As your brain adapts to running on stable fuel, the 'fog' will lift, revealing sharper focus and better concentration.";
        } else if (goals.includes('health')) {
            title = "Systemic Healing";
            text = "Your plan is designed to reduce systemic inflammation and boost your immune system, helping you feel stronger every day.";
        } else {
            // Default goal fallback
            title = "Optimized for You";
            text = "We've tailored the timeline to maximize your physical recovery, helping you feel lighter and more energetic within days.";
        }
    } else if (type === 'trigger') {
        // Focus on the obstacle / mechanism (Stress, Cravings, Habits)
        // Priority: Stress > Boredom > Late Night > After Meals > High Intensity > General
        if (triggers.includes('stress')) {
            title = "Targeting Stress Triggers";
            text = "You identified stress as a key factor. Your plan prioritizes cortisol-reduction tools to break the stress-sugar cycle without willpower.";
        } else if (triggers.includes('boredom') || symptoms.includes('snack_not_hungry')) {
            title = "Overcoming Boredom";
            text = "Since boredom is a trigger, we've structured engaging 'micro-challenges' to stimulate your brain without needing sugar.";
        } else if (triggers.includes('late-night') || symptoms.includes('cravings_night')) {
            title = "Evening Defense";
            text = "Late-night cravings are often biological. Your plan adjusts your dinner composition to keep you satisfied until morning.";
        } else if (triggers.includes('after-meals') || symptoms.includes('hungry_soon')) {
            title = "Palate Reset";
            text = "Craving sweets after savory meals is a habit loop. Your plan uses specific cues to signal to your brain that eating is done.";
        } else if (intensity >= 3 || symptoms.includes('cant_stop') || symptoms.includes('eat_more')) {
            title = "Managing Intense Cravings";
            text = "High intensity suggests a dopamine imbalance. We've front-loaded your plan with craving-crushing techniques to get you through the first week.";
        } else {
            // Default trigger fallback
            title = "Rewiring Habits";
            text = "Your plan uses 'habit stacking' to replace sugar cues with healthy dopamine sources, making the change feel natural.";
        }
    } else if (type === 'social') {
        // Focus on emotional/social connection
        // Priority: Social > Mood > Control > General
        if (triggers.includes('social') || symptoms.includes('hide_food')) {
            title = "Social Confidence";
            text = "We've included specific scripts and strategies to help you navigate social events without feeling deprived or awkward.";
        } else if (goals.includes('mood') || symptoms.includes('mood_swings') || symptoms.includes('irritability')) {
            title = "Emotional Stability";
            text = "Sugar crashes often masquerade as mood swings. Stabilizing your intake will help you feel calmer and more in control.";
        } else if (symptoms.includes('out_of_control') || symptoms.includes('frustrated') || symptoms.includes('stuck_cycle')) {
            title = "Regaining Control";
            text = "This plan isn't about restriction; it's about freedom. You'll prove to yourself that you are in charge, not the cravings.";
        } else {
            // Default social fallback
            title = "Presence & Connection";
            text = "Without the brain fog from sugar, you'll find yourself more present and patient with the people you care about.";
        }
    }

    return (
        <View style={styles.insightContainer}>
            <Text style={styles.insightTitle}>{title}</Text>
            <Text style={styles.insightText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
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
    insightTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    insightText: {
        fontSize: 15,
        color: looviColors.text.secondary,
        lineHeight: 22,
        textAlign: 'center',
    },
});
