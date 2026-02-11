/**
 * GoalsScreen
 * 
 * User selects their main goals and optionally a savings goal before choosing their approach.
 * Goals and savings goal are saved to onboarding data and used in HomeScreen.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing, borderRadius } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';
import { useUserData } from '../../context/UserDataContext';
import { usePostHog } from 'posthog-react-native';

type GoalsScreenProps = {
    navigation: NativeStackNavigationProp<any, 'Goals'>;
};

const GOALS = [
    { id: 'cravings', emoji: '🍭', label: 'Reduce cravings' },
    { id: 'energy', emoji: '⚡', label: 'More energy' },
    { id: 'weight', emoji: '⚖️', label: 'Weight management' },
    { id: 'health', emoji: '❤️', label: 'Better health' },
    { id: 'money', emoji: '💵', label: 'Save money' },
    { id: 'sleep', emoji: '😴', label: 'Better sleep' },
    { id: 'skin', emoji: '✨', label: 'Clearer skin' },
    { id: 'mood', emoji: '😊', label: 'Stable mood' },
];



export default function GoalsScreen({ navigation }: GoalsScreenProps) {
    const { onboardingData, updateOnboardingData, setOnboardingCheckpoint } = useUserData();
    const posthog = usePostHog();
    const [selectedGoals, setSelectedGoals] = useState<string[]>(onboardingData?.goals || []);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;



    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();

        // Milestone checkpoint: user finished the info slides and reached the next flow.
        setOnboardingCheckpoint('Goals').catch(() => { });
    }, []);

    const toggleGoal = (goalId: string) => {
        setSelectedGoals(prev => {
            if (prev.includes(goalId)) {
                return prev.filter(id => id !== goalId);
            }
            return [...prev, goalId];
        });
    };

    const handleContinue = async () => {
        // Track goals
        posthog?.capture('onboarding_goals_completed', {
            goals_count: selectedGoals.length,
            selected_goals: selectedGoals
        });

        // Save goals and set default plan to cold_turkey
        await updateOnboardingData({
            goals: selectedGoals,
            plan: 'cold_turkey', // All users default to cold turkey
        });

        navigation.navigate('Promise');
    };

    // - user answered "Not now", OR
    // - user answered "Yes" and picked a savings goal
    const canProceed = selectedGoals.length > 0;

    return (
        <LooviBackground variant="blueBottom">
            <SafeAreaView style={styles.container}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        }}
                    >
                        {/* Goals Header */}
                        <View style={styles.header}>
                            <Image
                                source={require('../../../assets/images/illustrations/target_goals.png')}
                                style={styles.headerImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.title}>What are your main goals?</Text>
                            <Text style={styles.subtitle}>Select all that apply</Text>
                        </View>

                        {/* Goals List - Single Column */}
                        <View style={styles.goalsContainer}>
                            {GOALS.map((goal) => {
                                const isSelected = selectedGoals.includes(goal.id);
                                return (
                                    <TouchableOpacity
                                        key={goal.id}
                                        style={[
                                            styles.goalCard,
                                            isSelected && styles.goalCardSelected,
                                        ]}
                                        onPress={() => toggleGoal(goal.id)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[
                                            styles.goalLabel,
                                            isSelected && styles.goalLabelSelected,
                                        ]}>
                                            {goal.label}
                                        </Text>
                                        {isSelected && (
                                            <View style={styles.checkmark}>
                                                <Text style={styles.checkmarkText}>✓</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </Animated.View>
                </ScrollView>

                {/* Continue Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            !canProceed && styles.continueButtonDisabled,
                        ]}
                        onPress={handleContinue}
                        disabled={!canProceed}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.continueButtonText}>Track these goals</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LooviBackground >
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
        paddingBottom: 120,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    headerImage: {
        width: 100,
        height: 100,
        marginBottom: spacing.md,
    },
    emoji: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    title: {
        fontSize: 26,
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
    goalsContainer: {
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    goalCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: borderRadius.xl,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    goalCardSelected: {
        backgroundColor: 'rgba(217, 123, 102, 0.1)',
        borderColor: looviColors.accent.primary,
    },
    goalEmoji: {
        fontSize: 24,
        marginRight: spacing.md,
    },
    goalLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    goalLabelSelected: {
        color: looviColors.accent.primary,
    },
    checkmark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: looviColors.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmarkText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '700',
    },
    // Savings Section
    savingsSection: {
        marginTop: spacing.md,
        paddingTop: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.08)',
    },
    savingsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    savingsSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.accent.success,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    yesNoContainer: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    yesNoButton: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.xl,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderWidth: 2,
        borderColor: 'transparent',
        alignItems: 'center',
    },
    yesNoButtonSelected: {
        backgroundColor: 'rgba(217, 123, 102, 0.1)',
        borderColor: looviColors.accent.primary,
    },
    yesNoText: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    yesNoTextSelected: {
        color: looviColors.accent.primary,
    },
    savingsOptionsTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: looviColors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    savingsOptionsContainer: {
        gap: spacing.sm,
    },
    savingsOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    savingsOptionSelected: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3B82F6',
    },
    savingsOptionEmoji: {
        fontSize: 20,
        marginRight: spacing.sm,
    },
    savingsOptionLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.text.primary,
    },
    savingsOptionLabelSelected: {
        color: '#3B82F6',
    },
    // Footer
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
