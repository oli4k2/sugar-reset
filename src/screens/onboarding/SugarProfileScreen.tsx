/**
 * SugarProfileScreen
 * 
 * Combined personalization questionnaire replacing IntentSelection + BaselineSetup.
 * Collects:
 * - Daily sugar consumption estimate
 * - Main sugar sources
 * - Primary motivation
 */

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing, borderRadius } from '../../theme';
import LooviBackground, { looviColors, footerFullWidthStyle, footerButtonWrapperStyle } from '../../components/LooviBackground';
import { GlassCard } from '../../components/GlassCard';
import { useUserData } from '../../context/UserDataContext';

type SugarProfileScreenProps = {
    navigation: NativeStackNavigationProp<any, 'SugarProfile'>;
};

interface SugarSource {
    id: string;
    emoji: string;
    label: string;
}

interface Motivation {
    id: string;
    emoji: string;
    label: string;
    description: string;
}

const SUGAR_SOURCES: SugarSource[] = [
    { id: 'drinks', emoji: '🥤', label: 'Sugary Drinks' },
    { id: 'coffee', emoji: '☕', label: 'Sweetened Coffee' },
    { id: 'snacks', emoji: '🍪', label: 'Snacks & Candy' },
    { id: 'desserts', emoji: '🍰', label: 'Desserts' },
    { id: 'meals', emoji: '🍝', label: 'Hidden in Meals' },
    { id: 'breakfast', emoji: '🥣', label: 'Breakfast Foods' },
];

const MOTIVATIONS: Motivation[] = [
    { id: 'health', emoji: '❤️', label: 'Better Health', description: 'Reduce disease risk' },
    { id: 'weight', emoji: '⚖️', label: 'Weight Loss', description: 'Lose extra pounds' },
    { id: 'energy', emoji: '⚡', label: 'More Energy', description: 'No more crashes' },
    { id: 'clarity', emoji: '🧠', label: 'Mental Clarity', description: 'Sharper focus' },
    { id: 'skin', emoji: '✨', label: 'Better Skin', description: 'Clear complexion' },
    { id: 'mood', emoji: '😊', label: 'Stable Mood', description: 'Less irritability' },
];

const CONSUMPTION_LEVELS = [
    { value: 1, label: 'Light', emoji: '🟢', grams: '< 25g/day' },
    { value: 2, label: 'Moderate', emoji: '🟡', grams: '25-50g/day' },
    { value: 3, label: 'Heavy', emoji: '🟠', grams: '50-100g/day' },
    { value: 4, label: 'Very Heavy', emoji: '🔴', grams: '> 100g/day' },
];

export default function SugarProfileScreen({ navigation }: SugarProfileScreenProps) {
    const { updateOnboardingData } = useUserData();
    const [step, setStep] = useState(1);
    const [consumption, setConsumption] = useState(2);
    const [sources, setSources] = useState<string[]>([]);
    const [motivation, setMotivation] = useState<string | null>(null);

    const fadeAnim = useRef(new Animated.Value(1)).current;

    const animateTransition = (callback: () => void) => {
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
        setTimeout(callback, 150);
    };

    const toggleSource = (id: string) => {
        setSources(prev =>
            prev.includes(id)
                ? prev.filter(s => s !== id)
                : [...prev, id]
        );
    };

    const handleNext = () => {
        if (step === 1) {
            animateTransition(() => setStep(2));
        } else if (step === 2) {
            animateTransition(() => setStep(3));
        } else {
            // Save data and continue
            updateOnboardingData({
                sugarConsumption: CONSUMPTION_LEVELS[consumption - 1].label,
                sugarSources: sources,
                motivation: motivation || 'health',
            });
            navigation.navigate('SugarIntake');
        }
    };

    const canProceed = () => {
        if (step === 1) return true;
        if (step === 2) return sources.length > 0;
        if (step === 3) return motivation !== null;
        return false;
    };

    return (
        <LooviBackground variant="coralBottom">
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Personalize</Text>
                    <Text style={styles.headerSubtitle}>Step {step} of 3</Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressTrack}>
                        <Animated.View
                            style={[
                                styles.progressFill,
                                { width: `${(step / 3) * 100}%` }
                            ]}
                        />
                    </View>
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View style={{ opacity: fadeAnim }}>
                        {/* Step 1: Consumption Level */}
                        {step === 1 && (
                            <View style={styles.stepContent}>
                                <Text style={styles.stepEmoji}>🍬</Text>
                                <Text style={styles.stepTitle}>
                                    How much sugar do you consume?
                                </Text>
                                <Text style={styles.stepSubtitle}>
                                    Be honest - this helps us personalize your plan
                                </Text>

                                <View style={styles.consumptionContainer}>
                                    {CONSUMPTION_LEVELS.map((level) => (
                                        <TouchableOpacity
                                            key={level.value}
                                            style={[
                                                styles.consumptionOption,
                                                consumption === level.value && styles.consumptionOptionActive,
                                            ]}
                                            onPress={() => setConsumption(level.value)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.consumptionEmoji}>{level.emoji}</Text>
                                            <View style={styles.consumptionInfo}>
                                                <Text style={[
                                                    styles.consumptionLabel,
                                                    consumption === level.value && styles.consumptionLabelActive,
                                                ]}>
                                                    {level.label}
                                                </Text>
                                                <Text style={styles.consumptionGrams}>{level.grams}</Text>
                                            </View>
                                            {consumption === level.value && (
                                                <Text style={styles.checkmark}>✓</Text>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Step 2: Sugar Sources */}
                        {step === 2 && (
                            <View style={styles.stepContent}>
                                <Text style={styles.stepEmoji}>🔍</Text>
                                <Text style={styles.stepTitle}>
                                    Where does your sugar come from?
                                </Text>
                                <Text style={styles.stepSubtitle}>
                                    Select all that apply
                                </Text>

                                <View style={styles.sourcesGrid}>
                                    {SUGAR_SOURCES.map((source) => (
                                        <TouchableOpacity
                                            key={source.id}
                                            style={[
                                                styles.sourceCard,
                                                sources.includes(source.id) && styles.sourceCardActive,
                                            ]}
                                            onPress={() => toggleSource(source.id)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.sourceEmoji}>{source.emoji}</Text>
                                            <Text style={[
                                                styles.sourceLabel,
                                                sources.includes(source.id) && styles.sourceLabelActive,
                                            ]}>
                                                {source.label}
                                            </Text>
                                            {sources.includes(source.id) && (
                                                <View style={styles.sourceCheck}>
                                                    <Text style={styles.sourceCheckText}>✓</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Step 3: Motivation */}
                        {step === 3 && (
                            <View style={styles.stepContent}>
                                <Text style={styles.stepEmoji}>🎯</Text>
                                <Text style={styles.stepTitle}>
                                    What's your main goal?
                                </Text>
                                <Text style={styles.stepSubtitle}>
                                    We'll customize your experience around this
                                </Text>

                                <View style={styles.motivationsContainer}>
                                    {MOTIVATIONS.map((mot) => (
                                        <TouchableOpacity
                                            key={mot.id}
                                            style={[
                                                styles.motivationCard,
                                                motivation === mot.id && styles.motivationCardActive,
                                            ]}
                                            onPress={() => setMotivation(mot.id)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.motivationEmoji}>{mot.emoji}</Text>
                                            <View style={styles.motivationInfo}>
                                                <Text style={[
                                                    styles.motivationLabel,
                                                    motivation === mot.id && styles.motivationLabelActive,
                                                ]}>
                                                    {mot.label}
                                                </Text>
                                                <Text style={styles.motivationDesc}>{mot.description}</Text>
                                            </View>
                                            {motivation === mot.id && (
                                                <Text style={styles.checkmark}>✓</Text>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                    </Animated.View>
                </ScrollView>

                {/* Continue Button */}
                <View style={[styles.footer, footerFullWidthStyle]}>
                    <View style={footerButtonWrapperStyle}>
                        <TouchableOpacity
                            style={[
                                styles.continueButton,
                                !canProceed() && styles.continueButtonDisabled,
                            ]}
                            onPress={handleNext}
                            disabled={!canProceed()}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.continueButtonText}>
                                {step < 3 ? 'Continue' : 'Choose Your Plan →'}
                            </Text>
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
    header: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing.lg,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        marginTop: spacing.xs,
    },
    progressContainer: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing.lg,
    },
    progressTrack: {
        width: '100%',
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: looviColors.accent.primary,
        borderRadius: 3,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingBottom: 100,
    },
    stepContent: {
        paddingTop: spacing.xl,
        alignItems: 'center',
    },
    stepEmoji: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    stepSubtitle: {
        fontSize: 15,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    consumptionContainer: {
        width: '100%',
        gap: spacing.md,
    },
    consumptionOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    consumptionOptionActive: {
        backgroundColor: 'rgba(217, 123, 102, 0.1)',
        borderColor: looviColors.accent.primary,
    },
    consumptionEmoji: {
        fontSize: 24,
        marginRight: spacing.md,
    },
    consumptionInfo: {
        flex: 1,
    },
    consumptionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    consumptionLabelActive: {
        color: looviColors.accent.primary,
    },
    consumptionGrams: {
        fontSize: 13,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        marginTop: 2,
    },
    checkmark: {
        fontSize: 20,
        color: looviColors.accent.primary,
        fontWeight: '700',
    },
    sourcesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        justifyContent: 'center',
    },
    sourceCard: {
        width: '45%',
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
    },
    sourceCardActive: {
        backgroundColor: 'rgba(217, 123, 102, 0.1)',
        borderColor: looviColors.accent.primary,
    },
    sourceEmoji: {
        fontSize: 32,
        marginBottom: spacing.sm,
    },
    sourceLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.primary,
        textAlign: 'center',
    },
    sourceLabelActive: {
        color: looviColors.accent.primary,
    },
    sourceCheck: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: looviColors.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sourceCheckText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '700',
    },
    motivationsContainer: {
        width: '100%',
        gap: spacing.md,
    },
    motivationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    motivationCardActive: {
        backgroundColor: 'rgba(217, 123, 102, 0.1)',
        borderColor: looviColors.accent.primary,
    },
    motivationEmoji: {
        fontSize: 28,
        marginRight: spacing.md,
    },
    motivationInfo: {
        flex: 1,
    },
    motivationLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    motivationLabelActive: {
        color: looviColors.accent.primary,
    },
    motivationDesc: {
        fontSize: 13,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        marginTop: 2,
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
    continueButtonDisabled: {
        opacity: 0.5,
    },
    continueButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
