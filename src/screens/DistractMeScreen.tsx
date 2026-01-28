/**
 * DistractMeScreen - Distraction Options
 * 
 * Dedicated screen for distraction activities during cravings
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

const calmColors = {
    darkBg: '#1A1A2E',
    darkerBg: '#0F0F1E',
    text: '#E8E8F0',
    textSecondary: '#B0B0C8',
    accent: '#F5B461',
    cardBg: 'rgba(255, 255, 255, 0.08)',
};

const distractions = [
    {
        id: 'breathing',
        icon: 'wind' as const,
        title: 'Breathing Exercise',
        description: 'Calm your mind with guided breathing',
        screen: 'BreathingExercise',
        color: '#88A4D6',
    },
    {
        id: 'walk',
        icon: 'navigation' as const,
        title: 'Quick 5-Minute Walk',
        description: 'Movement reduces cravings by 50%',
        action: 'timer',
        color: '#7FB069',
    },
    {
        id: 'water',
        icon: 'droplet' as const,
        title: 'Drink Water Challenge',
        description: 'Finish a full glass, then reassess',
        action: 'challenge',
        color: '#88A4D6',
    },
    {
        id: 'call',
        icon: 'phone' as const,
        title: 'Call a Friend',
        description: 'A quick chat can shift your mindset',
        action: 'call',
        color: '#C997A8',
    },
    {
        id: 'music',
        icon: 'music' as const,
        title: 'Listen to Music',
        description: 'Put on your favorite uplifting song',
        action: 'music',
        color: '#F5B461',
    },
];

export default function DistractMeScreen() {
    const navigation = useNavigation<any>();

    const handleDistractionSelect = (distraction: typeof distractions[0]) => {
        if (distraction.screen) {
            navigation.navigate(distraction.screen);
        } else if (distraction.action === 'timer') {
            Alert.alert(
                'Quick Walk',
                'Get up and take a quick walk around. Movement releases dopamine and reduces cravings. Set a 5-minute timer on your phone!',
                [{ text: 'Start Walking!' }]
            );
        } else if (distraction.action === 'challenge') {
            Alert.alert(
                'Water Challenge',
                'Drink a full glass of water right now. Thirst is often mistaken for sugar cravings. Once you finish, take a moment to see how you feel.',
                [{ text: 'Challenge Accepted!' }]
            );
        } else if (distraction.action === 'call') {
            Alert.alert(
                'Call Someone',
                'Reach out to a friend or family member. Even a brief conversation can help shift your focus and provide support.',
                [{ text: 'Got It!' }]
            );
        } else if (distraction.action === 'music') {
            Alert.alert(
                'Music Therapy',
                'Put on a song that makes you feel good. Music can instantly shift your mood and help you through this moment.',
                [{ text: 'Let\'s Go!' }]
            );
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[calmColors.darkerBg, calmColors.darkBg, calmColors.darkerBg]}
                locations={[0, 0.5, 1]}
                style={styles.gradient}
            />

            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Feather name="arrow-left" size={24} color={calmColors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Distract Me</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <View style={styles.iconBg}>
                            <Feather name="target" size={48} color={calmColors.accent} />
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Choose a Distraction</Text>
                    <Text style={styles.subtitle}>
                        Shift your focus for just a few minutes. Cravings typically pass quickly.
                    </Text>

                    {/* Distraction Options */}
                    <View style={styles.optionsContainer}>
                        {distractions.map((distraction) => (
                            <TouchableOpacity
                                key={distraction.id}
                                style={styles.optionCard}
                                onPress={() => handleDistractionSelect(distraction)}
                                activeOpacity={0.85}
                            >
                                <View style={[styles.optionIcon, { backgroundColor: `${distraction.color}20` }]}>
                                    <Feather name={distraction.icon} size={24} color={distraction.color} />
                                </View>
                                <View style={styles.optionInfo}>
                                    <Text style={styles.optionTitle}>{distraction.title}</Text>
                                    <Text style={styles.optionDescription}>{distraction.description}</Text>
                                </View>
                                <Feather name="chevron-right" size={20} color={calmColors.textSecondary} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Tip */}
                    <View style={styles.tipCard}>
                        <Feather name="lightbulb" size={20} color={calmColors.accent} style={{ marginRight: spacing.md }} />
                        <Text style={styles.tipText}>
                            Research shows most cravings pass within 3-5 minutes when distracted.
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: calmColors.darkerBg,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: calmColors.text,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        paddingBottom: spacing.xxl,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: spacing.xl,
    },
    iconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: calmColors.cardBg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: calmColors.accent,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: calmColors.text,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: calmColors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: spacing.xxl,
    },
    optionsContainer: {
        width: '100%',
        marginBottom: spacing.xl,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: calmColors.cardBg,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    optionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    optionInfo: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: calmColors.text,
        marginBottom: 2,
    },
    optionDescription: {
        fontSize: 13,
        color: calmColors.textSecondary,
    },
    tipCard: {
        flexDirection: 'row',
        backgroundColor: calmColors.cardBg,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: `${calmColors.accent}30`,
    },
    tipText: {
        flex: 1,
        fontSize: 14,
        color: calmColors.textSecondary,
        lineHeight: 20,
    },
});



