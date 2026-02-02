/**
 * ComprehensiveQuizScreen
 * 
 * Consolidated quiz with sophisticated questions to identify
 * sugar habits and personalize the user experience.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Animated,
    Dimensions,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';
import { GlassCard } from '../../components/GlassCard';
import { useUserData } from '../../context/UserDataContext';
import { PlanBuildingAnimation } from '../../components/PlanBuildingAnimation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_HEIGHT < 700; // iPhone SE, smaller Android devices

type ComprehensiveQuizScreenProps = {
    navigation: NativeStackNavigationProp<any, 'ComprehensiveQuiz'>;
    route: {
        params?: {
            skip?: boolean;
        };
    };
};

// Question types
type QuestionType = 'single' | 'scale' | 'multi' | 'slider' | 'text' | 'triggers' | 'userInfo';

interface QuestionOption {
    id: string;
    emoji: string;
    label: string;
    description?: string;
    femaleOnly?: boolean;
    isOther?: boolean;
}

interface Question {
    id: string;
    type: QuestionType;
    emoji: string;
    title: string;
    subtitle?: string;
    options?: QuestionOption[];
    sliderConfig?: {
        min: number;
        max: number;
        step: number;
        unit: string;
        references?: { value: number; label: string }[];
    };
    helpText?: string;
}

// Helper function to get questions based on gender
const getQuestions = (gender: string | null): Question[] => {
    const baseQuestions: Question[] = [
        {
            id: 'gender',
            type: 'single',
            emoji: '👤',
            title: "What's your gender?",
            options: [
                { id: 'male', emoji: '', label: 'Male' },
                { id: 'female', emoji: '', label: 'Female' },
                { id: 'other', emoji: '', label: 'Prefer not to say' },
            ],
        },
        {
            id: 'ageGroup',
            type: 'single',
            emoji: '👤',
            title: 'What is your age group?',
            options: [
                { id: '18-34', emoji: '', label: '18-34' },
                { id: '35-44', emoji: '', label: '35-44' },
                { id: '45-54', emoji: '', label: '45-54' },
                { id: '55-64', emoji: '', label: '55-64' },
                { id: '65+', emoji: '', label: '65+' },
            ],
        },
        {
            id: 'sugarFrequency',
            type: 'single',
            emoji: '📅',
            title: 'How often do you eat foods with added sugar?',
            options: [
                { id: 'rarely', emoji: '', label: 'Rarely' },
                { id: 'few-times-week', emoji: '', label: 'A few times per week' },
                { id: 'daily', emoji: '', label: 'Daily' },
                { id: 'multiple-daily', emoji: '', label: 'Multiple times per day' },
            ],
        },
        {
            id: 'dailySweetTimes',
            type: 'single',
            emoji: '🍬',
            title: 'On a typical day, how many separate times do you eat or drink something sweet?',
            options: [
                { id: '0-1', emoji: '', label: '0-1' },
                { id: '2-3', emoji: '', label: '2-3' },
                { id: '4-5', emoji: '', label: '4-5' },
                { id: '6+', emoji: '', label: '6+' },
            ],
        },
        {
            id: 'unconsciousSugar',
            type: 'scale',
            emoji: '🤔',
            title: 'How often do you eat sugar without consciously deciding to?',
            options: [
                { id: '1', emoji: '', label: 'Never' },
                { id: '2', emoji: '', label: 'Sometimes' },
                { id: '3', emoji: '', label: 'Often' },
                { id: '4', emoji: '', label: 'Almost always' },
            ],
        },
        {
            id: 'sugarChoiceFeeling',
            type: 'single',
            emoji: '💭',
            title: 'Which feels closer to the truth?',
            options: [
                { id: 'choose', emoji: '', label: 'I choose to eat sugar' },
                { id: 'give-in', emoji: '', label: 'I give in to cravings' },
                { id: 'already-eating', emoji: '', label: 'I find myself already eating it' },
            ],
        },
        {
            id: 'sugarSituations',
            type: 'triggers',
            emoji: '🎯',
            title: 'In which situations do you most often eat sugary foods?',
            options: [
                { id: 'stress', emoji: '', label: 'When stressed' },
                { id: 'boredom', emoji: '', label: 'When bored' },
                { id: 'after-meals', emoji: '', label: 'After meals' },
                { id: 'late-night', emoji: '', label: 'Late at night' },
                { id: 'social', emoji: '', label: 'Social situations' },
                { id: 'no-pattern', emoji: '', label: "I don't notice patterns" },
            ],
        },
        {
            id: 'reduceSugarAttempt',
            type: 'single',
            emoji: '🔄',
            title: 'When you try to reduce sugar, what usually happens?',
            options: [
                { id: 'succeed', emoji: '', label: 'I succeed' },
                { id: 'few-days', emoji: '', label: 'I last a few days' },
                { id: 'old-habits', emoji: '', label: 'I return to old habits' },
                { id: 'never-tried', emoji: '', label: "I've never tried" },
            ],
        },
        {
            id: 'craveWhenNotHungry',
            type: 'scale',
            emoji: '🍰',
            title: "How often do you crave sugary snacks and drinks when you're not hungry?",
            options: [
                { id: '1', emoji: '', label: 'Never' },
                { id: '2', emoji: '', label: 'Sometimes' },
                { id: '3', emoji: '', label: 'Often' },
                { id: '4', emoji: '', label: 'Almost always' },
            ],
        },
        {
            id: 'craveIntensity',
            type: 'scale',
            emoji: '⚡',
            title: 'When you crave sugar, how intense is the urge?',
            options: [
                { id: '1', emoji: '', label: 'Easy to ignore' },
                { id: '2', emoji: '', label: 'Noticeable' },
                { id: '3', emoji: '', label: 'Hard to resist' },
                { id: '4', emoji: '', label: 'Feels automatic' },
            ],
        },
        {
            id: 'avoidSugarDifficulty',
            type: 'scale',
            emoji: '💪',
            title: 'How hard is it to avoid sugar in your normal routine?',
            options: [
                { id: '1', emoji: '', label: 'Easy' },
                { id: '2', emoji: '', label: 'Somewhat hard' },
                { id: '3', emoji: '', label: 'Hard' },
                { id: '4', emoji: '', label: 'Almost impossible' },
            ],
        },
        {
            id: 'sugarVisibility',
            type: 'scale',
            emoji: '👀',
            title: 'How often are sugary foods or drinks visible around you?',
            options: [
                { id: '1', emoji: '', label: 'Rarely' },
                { id: '2', emoji: '', label: 'Sometimes' },
                { id: '3', emoji: '', label: 'Often' },
                { id: '4', emoji: '', label: 'Everywhere' },
            ],
        },
    ];

    return baseQuestions;
};

export default function ComprehensiveQuizScreen({ navigation, route }: ComprehensiveQuizScreenProps) {
    const { updateOnboardingData } = useUserData();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [showUserInfo, setShowUserInfo] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);

    // Answers state
    const [answers, setAnswers] = useState<Record<string, any>>({
        gender: null,
        ageGroup: null,
        sugarFrequency: null,
        dailySweetTimes: null,
        unconsciousSugar: null,
        sugarChoiceFeeling: null,
        sugarSituations: [],
        reduceSugarAttempt: null,
        craveWhenNotHungry: null,
        craveIntensity: null,
        avoidSugarDifficulty: null,
        sugarVisibility: null,
        nickname: '',
        age: '',
    });

    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;
    const resultFade = useRef(new Animated.Value(0)).current;
    const resultScale = useRef(new Animated.Value(0.8)).current;

    // Handle skip from params - skip quiz and results, go directly to userInfo
    useEffect(() => {
        if (route.params?.skip) {
            // Skip all quiz questions and results, go directly to userInfo screen
            setShowUserInfo(true);
        }
    }, [route.params?.skip]);

    const QUESTIONS = getQuestions(answers.gender);
    const question = QUESTIONS[currentQuestion];
    const progress = (currentQuestion + 1) / QUESTIONS.length;

    const animateTransition = (callback: () => void) => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
        ]).start(() => {
            callback();
            slideAnim.setValue(30);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start();
        });
    };

    const handleSingleSelect = (optionId: string) => {
        setAnswers(prev => ({ ...prev, [question.id]: optionId }));
        // For question 12 (last question), don't auto-advance - show CTA button instead
        if (currentQuestion < QUESTIONS.length - 1) {
            setTimeout(() => goNext(), 300);
        }
    };

    const handleMultiSelect = (optionId: string, fieldId: string) => {
        setAnswers(prev => {
            const current = prev[fieldId] || [];
            if (current.includes(optionId)) {
                return { ...prev, [fieldId]: current.filter((id: string) => id !== optionId) };
            }
            return { ...prev, [fieldId]: [...current, optionId] };
        });
    };

    const handleOtherReasonChange = (text: string) => {
        setAnswers(prev => ({ ...prev, otherReason: text }));
    };

    const handleUserInfoChange = (field: 'nickname' | 'age', text: string) => {
        setAnswers(prev => ({ ...prev, [field]: text }));
    };

    const handleSliderChange = (value: number) => {
        setAnswers(prev => ({ ...prev, intake: Math.round(value) }));
    };

    const canProceed = () => {
        const answer = answers[question.id];
        if (question.type === 'text') return answer && answer.trim().length > 0;
        if (question.type === 'multi' || question.type === 'triggers') {
            const hasSelection = answer && answer.length > 0;
            if (answer?.includes('other')) {
                return hasSelection && answers.otherReason.trim().length > 0;
            }
            return hasSelection;
        }
        if (question.type === 'slider') return true;
        return answer !== null;
    };

    const goNext = () => {
        console.log('goNext called, currentQuestion:', currentQuestion, 'QUESTIONS.length:', QUESTIONS.length);
        Keyboard.dismiss();
        
        if (currentQuestion < QUESTIONS.length - 1) {
            animateTransition(() => setCurrentQuestion(prev => prev + 1));
        } else {
            console.log('Final question reached, checking canProceed...');
            if (canProceed()) {
                console.log('Proceeding to calculate results...');
                saveAnswers().catch(err => console.error('Error saving answers:', err));
                setIsCalculating(true);
            } else {
                console.log('canProceed returned false');
            }
        }
    };

    const handleAnimationComplete = () => {
        setIsCalculating(false);
        showResultScreen();
    };

    const saveAnswers = async () => {
        // Calculate sugar dependency score from all questions
        // Q3: sugarFrequency (1-4 points)
        const frequencyMap: Record<string, number> = { 
            'rarely': 1, 
            'few-times-week': 2, 
            'daily': 3, 
            'multiple-daily': 4 
        };
        const frequencyScore = frequencyMap[answers.sugarFrequency as string] || 0;
        
        // Q4: dailySweetTimes (1-4 points)
        const dailySweetTimesMap: Record<string, number> = {
            '0-1': 1,
            '2-3': 2,
            '4-5': 3,
            '6+': 4
        };
        const dailySweetTimesScore = dailySweetTimesMap[answers.dailySweetTimes as string] || 0;
        
        // Q5: unconsciousSugar (1-4 points)
        const unconsciousSugarScore = parseInt(answers.unconsciousSugar) || 0;
        
        // Q6: sugarChoiceFeeling (1-3 points)
        const choiceFeelingMap: Record<string, number> = {
            'choose': 1,
            'give-in': 2,
            'already-eating': 3
        };
        const choiceFeelingScore = choiceFeelingMap[answers.sugarChoiceFeeling as string] || 0;
        
        // Q7: sugarSituations (0-2 points, based on number selected, max 2)
        const situationsCount = (answers.sugarSituations || []).length;
        const situationsScore = situationsCount === 0 ? 0 : situationsCount <= 2 ? 1 : 2;
        
        // Q8: reduceSugarAttempt (1-4 points)
        const reduceAttemptMap: Record<string, number> = {
            'succeed': 1,
            'few-days': 2,
            'old-habits': 3,
            'never-tried': 4
        };
        const reduceAttemptScore = reduceAttemptMap[answers.reduceSugarAttempt as string] || 0;
        
        // Q9: craveWhenNotHungry (1-4 points)
        const craveWhenNotHungryScore = parseInt(answers.craveWhenNotHungry) || 0;
        
        // Q10: craveIntensity (1-4 points)
        const craveIntensityScore = parseInt(answers.craveIntensity) || 0;
        
        // Q11: avoidSugarDifficulty (1-4 points)
        const avoidDifficultyScore = parseInt(answers.avoidSugarDifficulty) || 0;
        
        // Q12: sugarVisibility (1-4 points)
        const visibilityScore = parseInt(answers.sugarVisibility) || 0;

        const sugarDependencyScore = frequencyScore + dailySweetTimesScore + unconsciousSugarScore + 
            choiceFeelingScore + situationsScore + reduceAttemptScore + craveWhenNotHungryScore + 
            craveIntensityScore + avoidDifficultyScore + visibilityScore;

        const dataToSave: any = {
            gender: answers.gender,
            ageGroup: answers.ageGroup,
            sugarFrequency: answers.sugarFrequency,
            dailySweetTimes: answers.dailySweetTimes,
            unconsciousSugar: answers.unconsciousSugar,
            sugarChoiceFeeling: answers.sugarChoiceFeeling,
            triggers: answers.sugarSituations,
            reduceSugarAttempt: answers.reduceSugarAttempt,
            craveWhenNotHungry: answers.craveWhenNotHungry,
            craveIntensity: answers.craveIntensity,
            avoidSugarDifficulty: answers.avoidSugarDifficulty,
            sugarVisibility: answers.sugarVisibility,
            sugarDependencyScore,
        };

        // Only save userInfo if it's been filled (after results screen)
        if (answers.nickname.trim()) {
            dataToSave.nickname = answers.nickname;
        }

        await updateOnboardingData(dataToSave);
    };

    const showResultScreen = () => {
        setShowResult(true);
        Animated.parallel([
            Animated.timing(resultFade, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.spring(resultScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
        ]).start();
    };

    const handleContinue = () => {
        // Show userInfo screen after results
        setShowResult(false);
        setShowUserInfo(true);
    };

    const handleUserInfoContinue = async () => {
        // Save userInfo and navigate to next screen
        await updateOnboardingData({
            nickname: answers.nickname,
        });
        navigation.navigate('Symptoms');
    };

    const handleContinueToAnalysis = async () => {
        // Save answers and show loading animation (same as normal flow)
        Keyboard.dismiss();
        await saveAnswers();
        setIsCalculating(true);
    };

    // Extract primary motivation/trigger for emotional bridge
    const getPrimaryMotivation = (): string => {
        // Check sugar situations (triggers)
        const situations = answers.sugarSituations || [];
        if (situations.length > 0) {
            const situationMap: Record<string, string> = {
                'stress': 'stress eating',
                'boredom': 'boredom snacking',
                'after-meals': 'after-meal cravings',
                'late-night': 'late-night cravings',
                'social': 'social situations',
            };
            for (const situation of situations) {
                if (situationMap[situation]) {
                    return situationMap[situation];
                }
            }
        }

        // Default fallback
        return 'sugar cravings';
    };

    // Calculate category scores for the 5-bar display
    // Returns number of filled segments (1-5) for each category
    // 1 = perfect (all healthiest), 3-5 = distributed based on severity (avoiding 2)
    const getCategoryScores = () => {
        // Exposure: sugarVisibility (single question, scale 1-4)
        // 1 = '1' (Rarely), 3 = '2' (Sometimes), 4 = '3' (Often), 5 = '4' (Everywhere)
        const visibilityValue = parseInt(answers.sugarVisibility) || 4;
        const exposureSegments = visibilityValue === 1 ? 1 : visibilityValue === 2 ? 3 : visibilityValue === 3 ? 4 : 5;

        // Autopilot: unconsciousSugar (1-4) + sugarChoiceFeeling (choose=1, give-in=2, already-eating=3)
        const unconsciousValue = parseInt(answers.unconsciousSugar) || 4;
        const choiceFeelingMap: Record<string, number> = {
            'choose': 1,
            'give-in': 2,
            'already-eating': 3
        };
        const choiceFeelingValue = choiceFeelingMap[answers.sugarChoiceFeeling as string] || 3;
        
        // Perfect: both are 1
        // Good (3): one is 1, other is 2
        // High (4): both are 2, or one is 1 and other is 3, or one is 2 and other is 3
        // Very High (5): both are 3 or 4, or one is 4
        let autopilotSegments = 5;
        if (unconsciousValue === 1 && choiceFeelingValue === 1) {
            autopilotSegments = 1; // Perfect
        } else if ((unconsciousValue === 1 && choiceFeelingValue === 2) || 
                   (unconsciousValue === 2 && choiceFeelingValue === 1)) {
            autopilotSegments = 3; // Good
        } else if ((unconsciousValue === 2 && choiceFeelingValue === 2) ||
                   (unconsciousValue === 1 && choiceFeelingValue === 3) ||
                   (unconsciousValue === 3 && choiceFeelingValue === 1) ||
                   (unconsciousValue === 2 && choiceFeelingValue === 3) ||
                   (unconsciousValue === 3 && choiceFeelingValue === 2)) {
            autopilotSegments = 4; // High
        } else {
            autopilotSegments = 5; // Very High
        }

        // Control: reduceSugarAttempt (succeed=1, few-days=2, old-habits=3, never-tried=4) + avoidSugarDifficulty (1-4)
        const reduceAttemptMap: Record<string, number> = {
            'succeed': 1,
            'few-days': 2,
            'old-habits': 3,
            'never-tried': 4
        };
        const reduceAttemptValue = reduceAttemptMap[answers.reduceSugarAttempt as string] || 4;
        const avoidDifficultyValue = parseInt(answers.avoidSugarDifficulty) || 4;
        
        // Perfect: both are 1
        // Good (3): one is 1, other is 2
        // High (4): both are 2, or one is 1 and other is 3, or one is 2 and other is 3
        // Very High (5): both are 3 or 4, or one is 4
        let controlSegments = 5;
        if (reduceAttemptValue === 1 && avoidDifficultyValue === 1) {
            controlSegments = 1; // Perfect
        } else if ((reduceAttemptValue === 1 && avoidDifficultyValue === 2) || 
                   (reduceAttemptValue === 2 && avoidDifficultyValue === 1)) {
            controlSegments = 3; // Good
        } else if ((reduceAttemptValue === 2 && avoidDifficultyValue === 2) ||
                   (reduceAttemptValue === 1 && avoidDifficultyValue === 3) ||
                   (reduceAttemptValue === 3 && avoidDifficultyValue === 1) ||
                   (reduceAttemptValue === 2 && avoidDifficultyValue === 3) ||
                   (reduceAttemptValue === 3 && avoidDifficultyValue === 2)) {
            controlSegments = 4; // High
        } else {
            controlSegments = 5; // Very High
        }

        // MentalPull: craveWhenNotHungry (1-4) + craveIntensity (1-4)
        const craveWhenNotHungryValue = parseInt(answers.craveWhenNotHungry) || 4;
        const craveIntensityValue = parseInt(answers.craveIntensity) || 4;
        
        // Perfect: both are 1
        // Good (3): one is 1, other is 2
        // High (4): both are 2, or one is 1 and other is 3, or one is 2 and other is 3
        // Very High (5): both are 3 or 4, or one is 4
        let mentalPullSegments = 5;
        if (craveWhenNotHungryValue === 1 && craveIntensityValue === 1) {
            mentalPullSegments = 1; // Perfect
        } else if ((craveWhenNotHungryValue === 1 && craveIntensityValue === 2) || 
                   (craveWhenNotHungryValue === 2 && craveIntensityValue === 1)) {
            mentalPullSegments = 3; // Good
        } else if ((craveWhenNotHungryValue === 2 && craveIntensityValue === 2) ||
                   (craveWhenNotHungryValue === 1 && craveIntensityValue === 3) ||
                   (craveWhenNotHungryValue === 3 && craveIntensityValue === 1) ||
                   (craveWhenNotHungryValue === 2 && craveIntensityValue === 3) ||
                   (craveWhenNotHungryValue === 3 && craveIntensityValue === 2)) {
            mentalPullSegments = 4; // High
        } else {
            mentalPullSegments = 5; // Very High
        }

        // Environment: sugarFrequency (rarely=1, few-times-week=2, daily=3, multiple-daily=4) + 
        //              dailySweetTimes (0-1=1, 2-3=2, 4-5=3, 6+=4) + sugarSituations (count/pattern)
        const frequencyMap: Record<string, number> = {
            'rarely': 1,
            'few-times-week': 2,
            'daily': 3,
            'multiple-daily': 4
        };
        const frequencyValue = frequencyMap[answers.sugarFrequency as string] || 4;
        const dailySweetTimesMap: Record<string, number> = {
            '0-1': 1,
            '2-3': 2,
            '4-5': 3,
            '6+': 4
        };
        const dailySweetTimesValue = dailySweetTimesMap[answers.dailySweetTimes as string] || 4;
        const situations = answers.sugarSituations || [];
        const hasNoPattern = situations.length === 0 || (situations.length === 1 && situations[0] === 'no-pattern');
        const situationsValue = hasNoPattern ? 1 : situations.length >= 3 ? 4 : situations.length === 2 ? 3 : 2;
        
        // Average the three values, then map to segments
        // Perfect (1): all are 1
        // Good (3): average is around 1.5-2
        // High (4): average is around 2.5-3
        // Very High (5): average is 3.5+
        const avgEnvironment = (frequencyValue + dailySweetTimesValue + situationsValue) / 3;
        let environmentSegments = 5;
        if (frequencyValue === 1 && dailySweetTimesValue === 1 && situationsValue === 1) {
            environmentSegments = 1; // Perfect
        } else if (avgEnvironment <= 2) {
            environmentSegments = 3; // Good
        } else if (avgEnvironment <= 3) {
            environmentSegments = 4; // High
        } else {
            environmentSegments = 5; // Very High
        }

        return {
            exposure: exposureSegments,
            autopilot: autopilotSegments,
            control: controlSegments,
            mentalPull: mentalPullSegments,
            environment: environmentSegments,
        };
    };

    // Calculate result (kept for backward compatibility with sugarDependencyScore)
    const getResultMessage = () => {
        // Q3: sugarFrequency (1-4 points)
        const frequencyMap: Record<string, number> = { 
            'rarely': 1, 
            'few-times-week': 2, 
            'daily': 3, 
            'multiple-daily': 4 
        };
        const frequencyScore = frequencyMap[answers.sugarFrequency as string] || 0;
        
        // Q4: dailySweetTimes (1-4 points)
        const dailySweetTimesMap: Record<string, number> = {
            '0-1': 1,
            '2-3': 2,
            '4-5': 3,
            '6+': 4
        };
        const dailySweetTimesScore = dailySweetTimesMap[answers.dailySweetTimes as string] || 0;
        
        // Q5: unconsciousSugar (1-4 points)
        const unconsciousSugarScore = parseInt(answers.unconsciousSugar) || 0;
        
        // Q6: sugarChoiceFeeling (1-3 points)
        const choiceFeelingMap: Record<string, number> = {
            'choose': 1,
            'give-in': 2,
            'already-eating': 3
        };
        const choiceFeelingScore = choiceFeelingMap[answers.sugarChoiceFeeling as string] || 0;
        
        // Q7: sugarSituations (0-2 points, based on number selected, max 2)
        const situationsCount = (answers.sugarSituations || []).length;
        const situationsScore = situationsCount === 0 ? 0 : situationsCount <= 2 ? 1 : 2;
        
        // Q8: reduceSugarAttempt (1-4 points)
        const reduceAttemptMap: Record<string, number> = {
            'succeed': 1,
            'few-days': 2,
            'old-habits': 3,
            'never-tried': 4
        };
        const reduceAttemptScore = reduceAttemptMap[answers.reduceSugarAttempt as string] || 0;
        
        // Q9: craveWhenNotHungry (1-4 points)
        const craveWhenNotHungryScore = parseInt(answers.craveWhenNotHungry) || 0;
        
        // Q10: craveIntensity (1-4 points)
        const craveIntensityScore = parseInt(answers.craveIntensity) || 0;
        
        // Q11: avoidSugarDifficulty (1-4 points)
        const avoidDifficultyScore = parseInt(answers.avoidSugarDifficulty) || 0;
        
        // Q12: sugarVisibility (1-4 points)
        const visibilityScore = parseInt(answers.sugarVisibility) || 0;

        const totalScore = frequencyScore + dailySweetTimesScore + unconsciousSugarScore + 
            choiceFeelingScore + situationsScore + reduceAttemptScore + craveWhenNotHungryScore + 
            craveIntensityScore + avoidDifficultyScore + visibilityScore;
        const maxScore = 37; // Updated max score: 4+4+4+3+2+4+4+4+4+4 = 37
        const rawPercentage = Math.round((totalScore / maxScore) * 100);

        // Determine dependency level
        let dependencyLevel = 'Active';
        if (rawPercentage >= 60) {
            dependencyLevel = 'High';
        } else if (rawPercentage < 35) {
            dependencyLevel = 'Low';
        }

        const adjustedPercentage = (() => {
            // Low dependency: map to 15-25% range
            if (rawPercentage < 35) {
                const scaled = 15 + (rawPercentage / 34) * 10;
                return Math.round(Math.min(25, Math.max(15, scaled)));
            }

            const scaled = 55 + ((rawPercentage - 35) / 65) * 45;
            return Math.round(Math.min(100, Math.max(55, scaled)));
        })();

        return {
            score: adjustedPercentage,
            dependencyLevel,
        };
    };

    // Filter options for triggers question based on gender
    const getFilteredOptions = () => {
        if (!question.options) return [];
        if (question.id === 'sugarSituations' && answers.gender !== 'female') {
            return question.options.filter(opt => !opt.femaleOnly);
        }
        return question.options;
    };

    const renderQuestion = () => {
        const filteredOptions = getFilteredOptions();

        switch (question.type) {
            case 'single':
            case 'scale':
                return (
                    <View style={styles.optionsContainer}>
                        {filteredOptions.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.optionCard,
                                    answers[question.id] === option.id && styles.optionCardSelected,
                                ]}
                                onPress={() => handleSingleSelect(option.id)}
                                activeOpacity={0.7}
                            >
                                {option.emoji && <Text style={styles.optionEmoji}>{option.emoji}</Text>}
                                <View style={styles.optionTextContainer}>
                                    <Text style={[
                                        styles.optionLabel,
                                        answers[question.id] === option.id && styles.optionLabelSelected,
                                    ]}>
                                        {option.label}
                                    </Text>
                                    {option.description && (
                                        <Text style={styles.optionDescription}>{option.description}</Text>
                                    )}
                                </View>
                                {answers[question.id] === option.id && (
                                    <Text style={styles.checkmark}>✓</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                );

            case 'multi':
                return (
                    <View style={styles.singleColumnContainer}>
                        {filteredOptions.map((option) => {
                            const isSelected = answers[question.id]?.includes(option.id);
                            return (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.singleRowOptionCard,
                                        isSelected && styles.singleRowOptionCardSelected,
                                    ]}
                                    onPress={() => handleMultiSelect(option.id, question.id)}
                                    activeOpacity={0.7}
                                >
                                    {option.emoji && <Text style={styles.singleRowEmoji}>{option.emoji}</Text>}
                                    <Text style={[
                                        styles.singleRowLabel,
                                        isSelected && styles.singleRowLabelSelected,
                                    ]}>
                                        {option.label}
                                    </Text>
                                    {isSelected && (
                                        <View style={styles.singleRowCheckmark}>
                                            <Text style={styles.singleRowCheckmarkText}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                );

            case 'triggers':
                return (
                    <View style={styles.singleColumnContainer}>
                        {filteredOptions.map((option) => {
                            const isSelected = answers[question.id]?.includes(option.id);
                            return (
                                <View key={option.id}>
                                    <TouchableOpacity
                                        style={[
                                            styles.singleRowOptionCard,
                                            isSelected && styles.singleRowOptionCardSelected,
                                        ]}
                                        onPress={() => handleMultiSelect(option.id, question.id)}
                                        activeOpacity={0.7}
                                    >
                                        {option.emoji && <Text style={styles.singleRowEmoji}>{option.emoji}</Text>}
                                        <Text style={[
                                            styles.singleRowLabel,
                                            isSelected && styles.singleRowLabelSelected,
                                        ]}>
                                            {option.label}
                                        </Text>
                                        {isSelected && (
                                            <View style={styles.singleRowCheckmark}>
                                                <Text style={styles.singleRowCheckmarkText}>✓</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                    
                                    {option.isOther && isSelected && (
                                        <View style={styles.otherInputContainer}>
                                            <TextInput
                                                style={styles.otherInput}
                                                placeholder="Please specify..."
                                                placeholderTextColor={looviColors.text.muted}
                                                value={answers.otherReason}
                                                onChangeText={handleOtherReasonChange}
                                                autoFocus
                                            />
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                );

            case 'slider':
                return (
                    <View style={styles.sliderContainer}>
                        <View style={styles.sliderValueContainer}>
                            <Text style={styles.sliderValue}>
                                {answers.intake >= 150 ? '150+' : answers.intake}g
                            </Text>
                            <Text style={styles.sliderValueLabel}>per day</Text>
                        </View>

                        {/* Help Text */}
                        {question.helpText && (
                            <View style={styles.helpTextContainer}>
                                <Text style={styles.helpText}>{question.helpText}</Text>
                            </View>
                        )}

                        <Slider
                            style={styles.slider}
                            minimumValue={question.sliderConfig?.min || 0}
                            maximumValue={question.sliderConfig?.max || 150}
                            step={question.sliderConfig?.step || 5}
                            value={answers.intake}
                            onValueChange={handleSliderChange}
                            minimumTrackTintColor={looviColors.accent.primary}
                            maximumTrackTintColor="rgba(0,0,0,0.1)"
                            thumbTintColor={looviColors.accent.primary}
                        />
                        <View style={styles.sliderReferences}>
                            {question.sliderConfig?.references?.map((ref, i) => (
                                <View key={i} style={styles.sliderReference}>
                                    <View style={[
                                        styles.sliderReferenceDot,
                                        answers.intake >= ref.value && styles.sliderReferenceDotActive,
                                    ]} />
                                    <Text style={styles.sliderReferenceLabel}>{ref.label}</Text>
                                    <Text style={styles.sliderReferenceValue}>{ref.value}g</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                );

            case 'text':
                return (
                    <View style={styles.textInputContainer}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter your name..."
                            placeholderTextColor={looviColors.text.muted}
                            value={answers.nickname}
                            onChangeText={(text) => handleUserInfoChange('nickname', text)}
                            autoCapitalize="words"
                            maxLength={20}
                        />
                    </View>
                );

            default:
                return null;
        }
    };

    if (showUserInfo) {
        // UserInfo screen after results
        return (
            <LooviBackground variant="coralTop">
                <SafeAreaView style={styles.container}>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View
                            style={[
                                styles.questionContainer,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }],
                                },
                            ]}
                        >
                            {/* Question Header */}
                            <View style={styles.questionHeader}>
                                <Text style={styles.questionEmoji}>👤</Text>
                                <Text style={styles.questionTitle}>A little more about you</Text>
                            </View>

                            {/* UserInfo Content */}
                            <View style={styles.userInfoContainer}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>What should we call you?</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Your name"
                                        placeholderTextColor={looviColors.text.muted}
                                        value={answers.nickname}
                                        onChangeText={(text) => handleUserInfoChange('nickname', text)}
                                        autoCapitalize="words"
                                        maxLength={20}
                                    />
                                </View>
                            </View>
                        </Animated.View>
                    </ScrollView>

                    {/* Continue Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[
                                styles.continueButton,
                                !answers.nickname.trim() && styles.continueButtonDisabled,
                            ]}
                            onPress={handleUserInfoContinue}
                            disabled={!answers.nickname.trim()}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.continueButtonText}>
                                Continue
                            </Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LooviBackground>
        );
    }

    if (showResult) {
        const categoryScores = getCategoryScores();

        // Adaptive spacing for smaller screens
        const adaptiveSpacing = {
            titleBottom: isSmallScreen ? spacing.sm : spacing.md,
            sublineBottom: isSmallScreen ? spacing.xl : spacing['2xl'],
            barStackTop: isSmallScreen ? spacing.xl : spacing['2xl'],
            barStackBottom: isSmallScreen ? spacing.md : spacing.lg,
            barGap: isSmallScreen ? spacing.md : spacing.lg,
            disclaimerTop: isSmallScreen ? spacing.md : spacing.lg,
            disclaimerBottom: isSmallScreen ? spacing.xl : spacing['2xl'],
            buttonTop: isSmallScreen ? spacing.lg : spacing.xl,
            scrollPadding: isSmallScreen ? spacing.xl : spacing['2xl'],
        };

        // Get color based on score (1 = best, 5 = worst)
        const getScoreColor = (filledSegments: number): string => {
            switch (filledSegments) {
                case 1:
                    return '#F5E6D3'; // Whitish-yellow-orange (soft, best)
                case 3:
                    return '#F0B88A'; // Medium orange
                case 4:
                    return '#E8A87C'; // Orange-coral (current accent)
                case 5:
                    return '#D77B5A'; // Red-orange (imposing, worst)
                default:
                    return '#E8A87C'; // Default to accent color
            }
        };

        // Helper component for a single bar with segments
        const CategoryBar = ({ label, filledSegments }: { label: string; filledSegments: number }) => {
            const segments = Array.from({ length: 5 }, (_, i) => i < filledSegments);
            const segmentColor = getScoreColor(filledSegments);
            return (
                <View style={styles.categoryBarContainer}>
                    <Text style={[styles.categoryBarLabel, isSmallScreen && { fontSize: 13 }]}>{label}</Text>
                    <View style={styles.categoryBarSegments}>
                        {segments.map((filled, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.categoryBarSegment,
                                    isSmallScreen && { height: 28 },
                                    filled && {
                                        backgroundColor: segmentColor,
                                    },
                                ]}
                            />
                        ))}
                    </View>
                </View>
            );
        };

        return (
            <LooviBackground variant="mixed">
                <SafeAreaView style={styles.container}>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={[
                            styles.resultScrollContent,
                            { paddingVertical: isSmallScreen ? spacing.xl : spacing['2xl'] }
                        ]}
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View
                            style={[
                                styles.resultContainer,
                                {
                                    opacity: resultFade,
                                    transform: [{ scale: resultScale }],
                                },
                            ]}
                        >
                            {/* Title */}
                            <Text style={[
                                styles.resultTitle,
                                isSmallScreen && { fontSize: 28, marginBottom: adaptiveSpacing.titleBottom }
                            ]}>
                                Pattern detected
                            </Text>

                            {/* Subline */}
                            <Text style={[
                                styles.resultSubline,
                                isSmallScreen && { 
                                    fontSize: 15, 
                                    marginBottom: adaptiveSpacing.sublineBottom 
                                }
                            ]}>
                                Your responses form a sugar habit loop.
                            </Text>

                            {/* 5-Bar Stack */}
                            <View style={[
                                styles.barStackContainer,
                                {
                                    marginTop: adaptiveSpacing.barStackTop,
                                    marginBottom: adaptiveSpacing.barStackBottom,
                                    gap: adaptiveSpacing.barGap,
                                }
                            ]}>
                                <CategoryBar label="Exposure" filledSegments={categoryScores.exposure} />
                                <CategoryBar label="Autopilot" filledSegments={categoryScores.autopilot} />
                                <CategoryBar label="Control" filledSegments={categoryScores.control} />
                                <CategoryBar label="Mental Pull" filledSegments={categoryScores.mentalPull} />
                                <CategoryBar label="Environment" filledSegments={categoryScores.environment} />
                            </View>

                            {/* Asterisk disclaimer */}
                            <Text style={[
                                styles.resultDisclaimer,
                                {
                                    marginTop: adaptiveSpacing.disclaimerTop,
                                    marginBottom: adaptiveSpacing.disclaimerBottom,
                                }
                            ]}>
                                * This result is an indication only, not a medical diagnosis
                            </Text>

                            {/* CTA Button */}
                            <TouchableOpacity
                                style={[
                                    styles.checkSymptomsButton,
                                    {
                                        marginTop: adaptiveSpacing.buttonTop,
                                    },
                                    isSmallScreen && { paddingVertical: 16 }
                                ]}
                                onPress={handleContinue}
                                activeOpacity={0.8}
                            >
                                <Text style={[
                                    styles.checkSymptomsButtonText,
                                    isSmallScreen && { fontSize: 16 }
                                ]}>
                                    Check symptoms
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </ScrollView>
                </SafeAreaView>
            </LooviBackground>
        );
    }

    return (
        <LooviBackground variant="coralTop">
            {!isCalculating && (
                <SafeAreaView style={styles.container}>
                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressTrack}>
                            <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                        </View>
                        <Text style={styles.progressText}>
                            Question {currentQuestion + 1} of {QUESTIONS.length}
                        </Text>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View
                            style={[
                                styles.questionContainer,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }],
                                },
                            ]}
                        >
                            {/* Question Header */}
                            <View style={styles.questionHeader}>
                                <Text style={styles.questionEmoji}>{question.emoji}</Text>
                                <Text style={styles.questionTitle}>{question.title}</Text>
                                {question.subtitle && (
                                    <Text style={styles.questionSubtitle}>{question.subtitle}</Text>
                                )}
                            </View>

                            {/* Question Content */}
                            {renderQuestion()}
                        </Animated.View>
                    </ScrollView>

                    {/* Continue Button (for multi-select, slider, text, triggers) */}
                    {(question.type === 'multi' || question.type === 'slider' || question.type === 'text' || question.type === 'triggers') && (
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[
                                    styles.continueButton,
                                    !canProceed() && styles.continueButtonDisabled,
                                ]}
                                onPress={goNext}
                                disabled={!canProceed()}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.continueButtonText}>
                                    {currentQuestion < QUESTIONS.length - 1 ? 'Continue' : 'See Results'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* CTA Button for question 12 (last question) */}
                    {currentQuestion === QUESTIONS.length - 1 && question.type !== 'multi' && question.type !== 'slider' && question.type !== 'text' && question.type !== 'triggers' && answers[question.id] !== null && (
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={styles.continueButton}
                                onPress={handleContinueToAnalysis}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.continueButtonText}>
                                    Continue to analysis
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </SafeAreaView>
            )}
            
            {/* Transition Animation */}
            {isCalculating && (
                <PlanBuildingAnimation 
                    answers={answers} 
                    onComplete={handleAnimationComplete} 
                />
            )}
        </LooviBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    progressText: {
        fontSize: 13,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        marginTop: spacing.sm,
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120,
    },
    questionContainer: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing.xl,
    },
    questionHeader: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    questionEmoji: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    questionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    questionSubtitle: {
        fontSize: 15,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'center',
    },
    optionsContainer: {
        gap: spacing.md,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionCardSelected: {
        backgroundColor: 'rgba(217, 123, 102, 0.1)',
        borderColor: looviColors.accent.primary,
    },
    optionEmoji: {
        fontSize: 28,
        marginRight: spacing.md,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    optionLabelSelected: {
        color: looviColors.accent.primary,
    },
    optionDescription: {
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
    // Single column (one per row) styles for goals and triggers
    singleColumnContainer: {
        gap: spacing.sm,
    },
    singleRowOptionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: borderRadius.xl,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    singleRowOptionCardSelected: {
        backgroundColor: 'rgba(217, 123, 102, 0.1)',
        borderColor: looviColors.accent.primary,
    },
    singleRowEmoji: {
        fontSize: 24,
        marginRight: spacing.md,
    },
    singleRowLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    singleRowLabelSelected: {
        color: looviColors.accent.primary,
    },
    singleRowCheckmark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: looviColors.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    singleRowCheckmarkText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '700',
    },
    sliderContainer: {
        paddingHorizontal: spacing.md,
    },
    sliderValueContainer: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    sliderValue: {
        fontSize: 48,
        fontWeight: '700',
        color: looviColors.accent.primary,
    },
    sliderValueLabel: {
        fontSize: 16,
        fontWeight: '400',
        color: looviColors.text.secondary,
    },
    helpTextContainer: {
        backgroundColor: 'rgba(232, 168, 124, 0.15)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    helpText: {
        fontSize: 13,
        fontWeight: '500',
        color: looviColors.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderReferences: {
        marginTop: spacing.xl,
        gap: spacing.md,
    },
    sliderReference: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    sliderReferenceDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    sliderReferenceDotActive: {
        backgroundColor: looviColors.accent.primary,
    },
    sliderReferenceLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '400',
        color: looviColors.text.secondary,
    },
    sliderReferenceValue: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    textInputContainer: {
        paddingHorizontal: spacing.md,
    },
    textInput: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        fontSize: 20,
        fontWeight: '600',
        color: looviColors.text.primary,
        textAlign: 'center',
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.1)',
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
    resultScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: spacing['2xl'],
        minHeight: SCREEN_HEIGHT * 0.8, // Ensure minimum height for proper centering
    },
    resultContainer: {
        paddingHorizontal: spacing.screen.horizontal,
    },
    resultTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    resultSubline: {
        fontSize: 16,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing['2xl'],
    },
    resultHelperText: {
        fontSize: 12,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        textAlign: 'center',
        marginBottom: spacing['2xl'],
    },
    barStackContainer: {
        gap: spacing.lg,
        marginTop: spacing['2xl'],
        marginBottom: spacing.lg,
    },
    categoryBarContainer: {
        gap: spacing.sm,
    },
    categoryBarLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.primary,
        marginBottom: spacing.xs,
    },
    categoryBarSegments: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    categoryBarSegment: {
        flex: 1,
        height: 32,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: borderRadius.md,
    },
    resultDisclaimer: {
        fontSize: 10,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        textAlign: 'center',
        marginTop: spacing.lg,
        marginBottom: spacing['2xl'],
    },
    checkSymptomsButton: {
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 18,
        paddingHorizontal: spacing.xl,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: looviColors.coralOrange,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 5,
        marginTop: spacing.xl,
    },
    checkSymptomsButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    userInfoContainer: {
        paddingHorizontal: spacing.md,
        gap: spacing.xl,
        marginTop: spacing['2xl'],
    },
    inputGroup: {
        gap: spacing.sm,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.primary,
        textAlign: 'center',
    },
    otherInputContainer: {
        marginTop: spacing.xs,
        marginBottom: spacing.md,
        paddingHorizontal: spacing.md,
    },
    otherInput: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        fontSize: 16,
        color: looviColors.text.primary,
        borderWidth: 2,
        borderColor: looviColors.accent.primary,
    },
});
