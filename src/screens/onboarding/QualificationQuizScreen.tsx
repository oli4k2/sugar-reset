/**
 * QualificationQuizScreen
 * 
 * "Is this app for you?" - Quick 3-question quiz to qualify users
 * and create psychological buy-in before showing app benefits.
 */

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing, borderRadius } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';
import { GlassCard } from '../../components/GlassCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type QualificationQuizScreenProps = {
    navigation: NativeStackNavigationProp<any, 'QualificationQuiz'>;
};

interface Question {
    id: string;
    emoji: string;
    text: string;
    subtext: string;
}

const QUESTIONS: Question[] = [
    {
        id: '1',
        emoji: '🍬',
        text: 'Do you consume sugar daily?',
        subtext: 'Candy, soda, desserts, sweetened coffee...',
    },
    {
        id: '2',
        emoji: '🔄',
        text: 'Have you tried to cut back before?',
        subtext: 'Even if it didn\'t last long',
    },
    {
        id: '3',
        emoji: '⚡',
        text: 'Do you experience energy crashes?',
        subtext: 'Feeling tired after meals or in the afternoon',
    },
];

export default function QualificationQuizScreen({ navigation }: QualificationQuizScreenProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<string, boolean>>({});
    const [showResult, setShowResult] = useState(false);

    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;
    const resultFade = useRef(new Animated.Value(0)).current;
    const resultScale = useRef(new Animated.Value(0.8)).current;

    const handleAnswer = (answer: boolean) => {
        const questionId = QUESTIONS[currentQuestion].id;
        setAnswers(prev => ({ ...prev, [questionId]: answer }));

        // Animate out
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: -50,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            if (currentQuestion < QUESTIONS.length - 1) {
                // Move to next question
                setCurrentQuestion(prev => prev + 1);
                slideAnim.setValue(50);

                // Animate in
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(slideAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start();
            } else {
                // Show result
                setShowResult(true);
                Animated.parallel([
                    Animated.timing(resultFade, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.spring(resultScale, {
                        toValue: 1,
                        friction: 8,
                        tension: 40,
                        useNativeDriver: true,
                    }),
                ]).start();
            }
        });
    };

    const handleContinue = () => {
        navigation.navigate('SugarDangers');
    };

    const yesCount = Object.values(answers).filter(Boolean).length;
    const question = QUESTIONS[currentQuestion];
    const progress = (currentQuestion + 1) / QUESTIONS.length;

    return (
        <LooviBackground variant="coralTop">
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Quick Check</Text>
                    <Text style={styles.headerSubtitle}>Is this app right for you?</Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressTrack}>
                        <Animated.View
                            style={[
                                styles.progressFill,
                                { width: `${progress * 100}%` }
                            ]}
                        />
                    </View>
                    <Text style={styles.progressText}>
                        {currentQuestion + 1} of {QUESTIONS.length}
                    </Text>
                </View>

                {/* Question Card */}
                {!showResult ? (
                    <Animated.View
                        style={[
                            styles.questionContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            },
                        ]}
                    >
                        <GlassCard variant="light" padding="lg" style={styles.questionCard}>
                            <Text style={styles.questionEmoji}>{question.emoji}</Text>
                            <Text style={styles.questionText}>{question.text}</Text>
                            <Text style={styles.questionSubtext}>{question.subtext}</Text>
                        </GlassCard>

                        {/* Answer Buttons */}
                        <View style={styles.answersContainer}>
                            <TouchableOpacity
                                style={[styles.answerButton, styles.yesButton]}
                                onPress={() => handleAnswer(true)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.answerEmoji}>✓</Text>
                                <Text style={styles.answerText}>Yes</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.answerButton, styles.noButton]}
                                onPress={() => handleAnswer(false)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.answerEmoji}>✕</Text>
                                <Text style={[styles.answerText, styles.noText]}>No</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                ) : (
                    /* Result Screen */
                    <Animated.View
                        style={[
                            styles.resultContainer,
                            {
                                opacity: resultFade,
                                transform: [{ scale: resultScale }],
                            },
                        ]}
                    >
                        <GlassCard variant="light" padding="lg" style={styles.resultCard}>
                            <Text style={styles.resultEmoji}>
                                {yesCount >= 2 ? '✨' : '👍'}
                            </Text>
                            <Text style={styles.resultTitle}>
                                {yesCount >= 2
                                    ? 'Perfect Match!'
                                    : 'Good Start!'}
                            </Text>
                            <Text style={styles.resultText}>
                                {yesCount >= 2
                                    ? 'Based on your answers, Craveless is designed exactly for people like you.'
                                    : 'Craveless can help you build healthier habits, even if you\'re just starting out.'}
                            </Text>

                            {/* Stats */}
                            <View style={styles.statsContainer}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{yesCount}</Text>
                                    <Text style={styles.statLabel}>of 3 matched</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>89%</Text>
                                    <Text style={styles.statLabel}>success rate</Text>
                                </View>
                            </View>
                        </GlassCard>

                        <TouchableOpacity
                            style={styles.continueButton}
                            onPress={handleContinue}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.continueButtonText}>
                                Let's Learn Why →
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}
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
        paddingTop: spacing.xl,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.xs,
    },
    headerSubtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: looviColors.text.secondary,
    },
    progressContainer: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing.xl,
        alignItems: 'center',
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
    progressText: {
        fontSize: 13,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        marginTop: spacing.sm,
    },
    questionContainer: {
        flex: 1,
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing['2xl'],
    },
    questionCard: {
        alignItems: 'center',
        paddingVertical: spacing['2xl'],
    },
    questionEmoji: {
        fontSize: 56,
        marginBottom: spacing.lg,
    },
    questionText: {
        fontSize: 22,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    questionSubtext: {
        fontSize: 15,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'center',
    },
    answersContainer: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.xl,
    },
    answerButton: {
        flex: 1,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    yesButton: {
        backgroundColor: looviColors.accent.success,
    },
    noButton: {
        backgroundColor: 'rgba(0,0,0,0.08)',
    },
    answerEmoji: {
        fontSize: 20,
        color: '#FFFFFF',
    },
    answerText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    noText: {
        color: looviColors.text.secondary,
    },
    resultContainer: {
        flex: 1,
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing['2xl'],
        justifyContent: 'center',
    },
    resultCard: {
        alignItems: 'center',
        paddingVertical: spacing['2xl'],
    },
    resultEmoji: {
        fontSize: 64,
        marginBottom: spacing.lg,
    },
    resultTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.md,
    },
    resultText: {
        fontSize: 16,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: spacing.md,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xl,
        paddingTop: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.08)',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: looviColors.accent.primary,
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        marginTop: spacing.xs,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    continueButton: {
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: spacing.xl,
        shadowColor: looviColors.coralOrange,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 5,
    },
    continueButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
