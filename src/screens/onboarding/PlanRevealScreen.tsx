import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';
import { OnboardingStackParamList } from '../../types';

type PlanRevealScreenProps = {
    navigation: NativeStackNavigationProp<OnboardingStackParamList, 'PlanReveal'>;
};

export default function PlanRevealScreen({ navigation }: PlanRevealScreenProps) {
    const handleContinue = () => {
        navigation.navigate('Paywall');
    };

    return (
        <LooviBackground variant="coralDominant">
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.emoji}>📋</Text>
                    <Text style={styles.title}>Your Plan is Ready</Text>
                    <Text style={styles.subtitle}>
                        We've designed a custom program to help you break free from sugar.
                    </Text>
                </View>

                <View style={styles.bottomContainer}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleContinue}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Unlock Your Plan</Text>
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
    content: {
        flex: 1,
        paddingHorizontal: spacing.screen.horizontal,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emoji: {
        fontSize: 64,
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'center',
        paddingHorizontal: spacing.md,
        lineHeight: 24,
    },
    bottomContainer: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingBottom: spacing['2xl'],
    },
    button: {
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: looviColors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
