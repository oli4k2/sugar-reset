/**
 * BreathingExerciseScreen
 * 
 * Guided box breathing exercise (4-4-4-4) to manage cravings.
 * Animated circle expands/contracts with breathing rhythm.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

const THEME = {
    bgColors: ['#0F172A', '#1E1B4B'],
    accent: '#818CF8', // Indigo
    text: '#F8FAFC',
    textDim: '#94A3B8',
    success: '#34D399',
};

type BreathingExerciseScreenProps = {
    navigation: NativeStackNavigationProp<any, 'BreathingExercise'>;
};

type Phase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

const PHASE_DURATION = 4000; // 4 seconds
const PHASE_INSTRUCTIONS = {
    inhale: 'Breathe In',
    hold1: 'Hold',
    exhale: 'Breathe Out',
    hold2: 'Hold',
};

export default function BreathingExerciseScreen({ navigation }: BreathingExerciseScreenProps) {
    const [phase, setPhase] = useState<Phase>('inhale');
    const [countdown, setCountdown] = useState(4);
    const [cycleCount, setCycleCount] = useState(0);

    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const opacityAnim = useRef(new Animated.Value(0.6)).current;

    useEffect(() => {
        // Start animation based on current phase
        const targetScale = (phase === 'inhale' || phase === 'hold1') ? 1 : 0.5;
        const targetOpacity = (phase === 'inhale' || phase === 'hold1') ? 0.9 : 0.6;

        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: targetScale,
                duration: phase.includes('hold') ? 0 : PHASE_DURATION,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: targetOpacity,
                duration: phase.includes('hold') ? 0 : PHASE_DURATION,
                useNativeDriver: true,
            }),
        ]).start();
    }, [phase]);

    useEffect(() => {
        // Reset countdown when phase changes
        setCountdown(4);

        // Countdown timer
        const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    return 1; // Stay at 1 until phase changes
                }
                return prev - 1;
            });
        }, 1000);

        // Phase progression
        const phaseTimeout = setTimeout(() => {
            setPhase((currentPhase) => {
                const phases: Phase[] = ['inhale', 'hold1', 'exhale', 'hold2'];
                const currentIndex = phases.indexOf(currentPhase);
                const nextIndex = (currentIndex + 1) % phases.length;

                if (nextIndex === 0) {
                    setCycleCount((prev) => prev + 1);
                }

                return phases[nextIndex];
            });
        }, PHASE_DURATION);

        return () => {
            clearInterval(countdownInterval);
            clearTimeout(phaseTimeout);
        };
    }, [phase]);

    const instruction = PHASE_INSTRUCTIONS[phase];

    return (
        <View style={styles.container}>
            <LinearGradient colors={THEME.bgColors as any} style={StyleSheet.absoluteFillObject} />
            <SafeAreaView style={styles.safeArea}>

                {/* Unified Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                        <Feather name="x" size={24} color={THEME.textDim} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>BREATHING</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.content}>
                    <View style={styles.topInfo}>
                        <Text style={styles.cycleText}>Cycle {cycleCount + 1}</Text>
                        <Text style={styles.subtitle}>
                            Cravings typically pass in 3-5 minutes
                        </Text>
                    </View>

                    {/* Animated Circle */}
                    <View style={styles.circleContainer}>
                        <Animated.View
                            style={[
                                styles.circle,
                                {
                                    transform: [{ scale: scaleAnim }],
                                    opacity: opacityAnim,
                                    backgroundColor: THEME.accent,
                                },
                            ]}
                        />
                        <View style={styles.instructionContainer}>
                            <Text style={styles.instructionText}>{instruction}</Text>
                            <Text style={styles.countdownText}>{countdown}</Text>
                        </View>
                    </View>

                    <View style={styles.bottomInfo}>
                        <View style={styles.tipCard}>
                            <Feather name="info" size={16} color={THEME.textDim} style={{ marginRight: 8 }} />
                            <Text style={styles.tipText}>
                                Focus on the rhythm. Let thoughts pass like clouds.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.doneButton}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={['#6366F1', '#4338CA']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={StyleSheet.absoluteFillObject}
                            />
                            <Text style={styles.doneButtonText}>I'm Calm Now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 60,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 2,
        color: '#FFF',
    },
    iconBtn: {
        padding: 8,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
    },
    topInfo: {
        alignItems: 'center',
    },
    cycleText: {
        fontSize: 12,
        fontWeight: '800',
        color: THEME.accent,
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: THEME.textDim,
        lineHeight: 20,
        textAlign: 'center',
    },
    circleContainer: {
        width: 300,
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circle: {
        position: 'absolute',
        width: 250,
        height: 250,
        borderRadius: 125,
    },
    instructionContainer: {
        alignItems: 'center',
    },
    instructionText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    countdownText: {
        fontSize: 64,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    bottomInfo: {
        width: '100%',
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 32,
        width: '100%',
    },
    tipText: {
        flex: 1,
        fontSize: 13,
        color: THEME.textDim,
        lineHeight: 18,
    },
    doneButton: {
        height: 56,
        width: '100%',
        borderRadius: 28,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    doneButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: 0.5,
    },
});
