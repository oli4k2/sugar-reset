import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LooviBackground, { looviColors } from '../../components/LooviBackground';
import { spacing, borderRadius } from '../../theme';
import { useUserData } from '../../context/UserDataContext';
import { OnboardingStackParamList } from '../../types';

type SymptomsScreenProps = {
    navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Symptoms'>;
};

type SymptomCategory = {
    title: string;
    symptoms: Symptom[];
};

type Symptom = {
    id: string;
    label: string;
};

const SYMPTOMS_DATA: SymptomCategory[] = [
    {
        title: 'Energy & Body',
        symptoms: [
            { id: 'energy_crash', label: 'Energy crashes after eating' },
            { id: 'afternoon_slump', label: 'Strong afternoon slump' },
            { id: 'hungry_soon', label: 'Hungry again soon after meals' },
            { id: 'bloated', label: 'Bloated or heavy feeling' },
        ],
    },
    {
        title: 'Mind & Mood',
        symptoms: [
            { id: 'brain_fog', label: 'Brain fog' },
            { id: 'mood_swings', label: 'Mood swings' },
            { id: 'irritability', label: 'Irritability when you can’t have sweets' },
            { id: 'restlessness', label: 'Restlessness / can’t focus' },
            { id: 'feeling_off', label: 'Feeling “off” without sugar' },
        ],
    },
    {
        title: 'Control & Behavior',
        symptoms: [
            { id: 'eat_more', label: 'Eat more sweets than planned' },
            { id: 'snack_not_hungry', label: 'Snack even when not hungry' },
            { id: 'think_sugar', label: 'Think about sugar often' },
            { id: 'hide_food', label: 'Hide or justify sugary foods' },
        ],
    },
    {
        title: 'Sleep & Timing',
        symptoms: [
            { id: 'cravings_night', label: 'Cravings late at night' },
            { id: 'wake_tired', label: 'Wake up tired' },
            { id: 'sugar_push', label: 'Use sugar to “push through”' },
            { id: 'cant_stop', label: 'Can’t stop once you start' },
        ],
    },
    {
        title: 'Self-Perception',
        symptoms: [
            { id: 'stuck_cycle', label: 'Feel stuck in a cycle' },
            { id: 'frustrated', label: 'Feel frustrated with yourself' },
            { id: 'out_of_control', label: 'Feel out of control around food' },
            { id: 'wish_willpower', label: 'Wish you had more willpower' },
        ],
    },
];

export default function SymptomsScreen({ navigation }: SymptomsScreenProps) {
    const { updateOnboardingData } = useUserData();
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

    const toggleSymptom = (id: string) => {
        setSelectedSymptoms(prev => 
            prev.includes(id) 
                ? prev.filter(s => s !== id) 
                : [...prev, id]
        );
    };

    const handleContinue = async () => {
        await updateOnboardingData({ symptoms: selectedSymptoms });
        navigation.navigate('SugarDangers');
    };

    return (
        <LooviBackground variant="coralTop">
            <SafeAreaView style={styles.container}>
                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.instructionText}>
                        Select your symptoms below:
                    </Text>

                    {SYMPTOMS_DATA.map((category) => (
                        <View key={category.title} style={styles.section}>
                            <Text style={styles.sectionTitle}>{category.title}</Text>
                            {category.symptoms.map((symptom) => {
                                const isSelected = selectedSymptoms.includes(symptom.id);
                                return (
                                    <TouchableOpacity
                                        key={symptom.id}
                                        style={[
                                            styles.optionCard,
                                            isSelected && styles.optionCardSelected
                                        ]}
                                        onPress={() => toggleSymptom(symptom.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[
                                            styles.radioCircle,
                                            isSelected && styles.radioCircleSelected
                                        ]}>
                                            {isSelected && <View style={styles.radioInner} />}
                                        </View>
                                        <Text style={[
                                            styles.optionText,
                                            isSelected && styles.optionTextSelected
                                        ]}>
                                            {symptom.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))}
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleContinue}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.continueButtonText}>
                            Begin your recovery
                        </Text>
                    </TouchableOpacity>
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
    content: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing.lg,
        paddingBottom: 120, // Space for footer
    },
    instructionText: {
        color: looviColors.text.primary,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: spacing.lg,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        color: looviColors.text.primary,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: spacing.md,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: borderRadius.xl,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.sm,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionCardSelected: {
        backgroundColor: 'rgba(217, 123, 102, 0.1)',
        borderColor: looviColors.accent.primary,
    },
    radioCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: looviColors.text.tertiary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    radioCircleSelected: {
        borderColor: looviColors.accent.primary,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: looviColors.accent.primary,
    },
    optionText: {
        color: looviColors.text.primary,
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
    },
    optionTextSelected: {
        color: looviColors.accent.primary,
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.screen.horizontal,
        paddingBottom: spacing.xl,
        paddingTop: spacing.md,
        backgroundColor: 'rgba(255, 250, 245, 0.95)',
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
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});
