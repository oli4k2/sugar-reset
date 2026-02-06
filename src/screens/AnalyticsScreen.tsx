/**
 * AnalyticsScreen
 * 
 * Redesigned analytics page focused on INSIGHTS over raw data:
 * - Overall health score with clickable explanations
 * - Actionable insights based on user's data
 * - Food scanner modal opens directly from CTA
 * - Wellness-nutrition correlation insights
 * - Visual, scannable design
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    LayoutAnimation,
    Platform,
    UIManager,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, Feather } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../theme';
import LooviBackground, { looviColors } from '../components/LooviBackground';
import { GlassCard } from '../components/GlassCard';
import { useUserData } from '../context/UserDataContext';
import { TimeframeToggle, Timeframe } from '../components/TimeframeToggle';
import { HealthScoreRing } from '../components/HealthScoreRing';
import { SwipeableTabView } from '../components/SwipeableTabView';
import FoodScannerModal from '../components/FoodScannerModal';
import { WellnessModal, WellnessLog } from '../components/WellnessModal';
import { getScannedItems, ScannedItem } from '../services/scannerService';
import {
    aggregateHealthData,
    WellnessMetrics,
    getNutritionInsights,
} from '../services/healthScoringService';
import { InsightDetailModal, InsightType } from '../components/InsightDetailModal';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface WellnessLogData {
    date: string;
    mood: number;
    energy: number;
    focus: number;
    sleepHours: number;
}

// Score info content
const SCORE_INFO = {
    overall: {
        title: 'Overall Health Score',
        description: 'Your overall score combines nutrition quality and wellness metrics to give you a complete picture of your health.',
        ranges: [
            { min: 80, max: 100, label: 'Excellent', color: '#22C55E', tip: 'You\'re doing great! Keep up the healthy habits.' },
            { min: 60, max: 79, label: 'Good', color: '#F5B461', tip: 'Good progress! Focus on consistency to improve further.' },
            { min: 40, max: 59, label: 'Fair', color: '#F59E0B', tip: 'Room for improvement. Try logging meals and tracking wellness daily.' },
            { min: 0, max: 39, label: 'Needs Work', color: '#EF4444', tip: 'Start with small changes - reduce sugar intake and improve sleep.' },
        ],
        howToImprove: [
            'Log your meals daily to track nutrition',
            'Aim for less than 25g of added sugar per day',
            'Track your mood, energy, and sleep consistently',
            'Get 7-9 hours of sleep each night',
        ],
    },
    nutrition: {
        title: 'Nutrition Score',
        description: 'Based on the nutritional quality of foods you\'ve logged, including sugar content, fiber, protein, and overall balance.',
        ranges: [
            { min: 80, max: 100, label: 'Excellent', color: '#22C55E', tip: 'Great food choices! Your diet is well-balanced.' },
            { min: 60, max: 79, label: 'Good', color: '#F5B461', tip: 'Good nutrition. Watch your sugar intake for even better scores.' },
            { min: 40, max: 59, label: 'Fair', color: '#F59E0B', tip: 'Try adding more protein and fiber to your meals.' },
            { min: 0, max: 39, label: 'Needs Work', color: '#EF4444', tip: 'Focus on reducing processed foods and added sugars.' },
        ],
        howToImprove: [
            'Choose whole foods over processed options',
            'Include protein with every meal',
            'Add more vegetables and fiber-rich foods',
            'Replace sugary snacks with fruit or nuts',
        ],
    },
    wellness: {
        title: 'Wellness Score',
        description: 'Calculated from your daily mood, energy, focus, and sleep quality ratings.',
        ranges: [
            { min: 80, max: 100, label: 'Excellent', color: '#22C55E', tip: 'You\'re feeling great! Your wellness habits are paying off.' },
            { min: 60, max: 79, label: 'Good', color: '#F5B461', tip: 'Good overall wellness. Small improvements can make a big difference.' },
            { min: 40, max: 59, label: 'Fair', color: '#F59E0B', tip: 'Focus on sleep quality and stress management.' },
            { min: 0, max: 39, label: 'Needs Work', color: '#EF4444', tip: 'Prioritize rest and self-care. Sugar reduction can help improve mood.' },
        ],
        howToImprove: [
            'Maintain a consistent sleep schedule',
            'Take short breaks for mental clarity',
            'Exercise regularly for better energy',
            'Practice mindfulness or meditation',
        ],
    },
};

// Get score color based on value
const getScoreColor = (score: number): string => {
    if (score >= 80) return '#22C55E';
    if (score >= 60) return '#F5B461';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
};

// Get score label
const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
};

// Generate personalized insights based on data - expanded with many more categories
const generateInsights = (
    wellnessLogs: WellnessLogData[],
    scannedItems: ScannedItem[],
    nutritionInsights: ReturnType<typeof getNutritionInsights> | null
): { icon: string; iconColor: string; title: string; message: string; action?: string; insightType: InsightType; priority: number }[] => {
    const insights: { icon: string; iconColor: string; title: string; message: string; action?: string; insightType: InsightType; priority: number }[] = [];

    // No data logged
    if (wellnessLogs.length === 0 && scannedItems.length === 0) {
        return [{
            icon: 'rocket-outline',
            iconColor: looviColors.accent.primary,
            title: 'Start Your Journey',
            message: 'Your health journey is waiting! Log your first meal or check-in to unlock personalized insights.',
            action: 'Log now',
            insightType: 'consistency',
            priority: 1,
        }];
    }

    // Calculate averages
    const avgMood = wellnessLogs.length > 0
        ? wellnessLogs.reduce((sum, log) => sum + log.mood, 0) / wellnessLogs.length
        : 0;
    const avgEnergy = wellnessLogs.length > 0
        ? wellnessLogs.reduce((sum, log) => sum + log.energy, 0) / wellnessLogs.length
        : 0;
    const avgSleep = wellnessLogs.length > 0
        ? wellnessLogs.reduce((sum, log) => sum + log.sleepHours, 0) / wellnessLogs.length
        : 0;
    const avgFocus = wellnessLogs.length > 0
        ? wellnessLogs.reduce((sum, log) => sum + log.focus, 0) / wellnessLogs.length
        : 0;

    // === ENERGY INSIGHTS ===
    if (avgEnergy > 0 && avgEnergy < 3) {
        insights.push({
            icon: 'flash',
            iconColor: '#F59E0B',
            title: 'Need an Energy Boost?',
            message: 'Feeling a bit drained? Boosting your protein intake can provide steady fuel. You\'ve got this!',
            action: 'Foods for energy',
            insightType: 'energy',
            priority: 1,
        });
    } else if (avgEnergy >= 4) {
        insights.push({
            icon: 'flash',
            iconColor: '#22C55E',
            title: 'Energy Superstar! ⚡',
            message: 'Your energy levels are fantastic! Whatever you\'re doing, keep it up.',
            insightType: 'celebration',
            priority: 5,
        });
    }

    // === SLEEP INSIGHTS ===
    if (avgSleep > 0 && avgSleep < 6) {
        insights.push({
            icon: 'moon',
            iconColor: '#8B5CF6',
            title: 'Rest is Your Superpower',
            message: 'Getting less than 6 hours? Sleep fights cravings better than willpower. Try winding down earlier!',
            action: 'Sleep tips',
            insightType: 'sleep',
            priority: 1,
        });
    } else if (avgSleep >= 6 && avgSleep < 7) {
        insights.push({
            icon: 'moon',
            iconColor: '#F5B461',
            title: 'Almost There on Sleep',
            message: 'You\'re close to optimal! Just 30-60 more minutes of sleep could boost your willpower significantly.',
            action: 'Sleep tips',
            insightType: 'sleep',
            priority: 3,
        });
    } else if (avgSleep >= 7.5) {
        insights.push({
            icon: 'moon',
            iconColor: '#22C55E',
            title: 'Sleep Champion! 💤',
            message: 'Great sleep habits! This is directly helping your sugar resistance and mood.',
            insightType: 'celebration',
            priority: 5,
        });
    }

    // === SUGAR INSIGHTS ===
    if (nutritionInsights && nutritionInsights.avgAddedSugar > 40) {
        insights.push({
            icon: 'water',
            iconColor: '#EF4444',
            title: 'Time to Reset',
            message: 'Sugar\'s been higher lately. That\'s okay! Let\'s hydrate and get back on track.',
            action: 'Reset strategies',
            insightType: 'hydration',
            priority: 1,
        });
    } else if (nutritionInsights && nutritionInsights.avgAddedSugar > 25) {
        insights.push({
            icon: 'water',
            iconColor: '#3B82F6',
            title: 'Hydrate & Stabilize',
            message: 'Had some sugar? No worries! Hydrating and moving your body can help stabilize your levels.',
            action: 'Stabilize now',
            insightType: 'hydration',
            priority: 2,
        });
    } else if (nutritionInsights && nutritionInsights.avgAddedSugar > 0 && nutritionInsights.avgAddedSugar <= 25) {
        insights.push({
            icon: 'checkmark-circle',
            iconColor: '#22C55E',
            title: 'Crushing It on Sugar! 🎉',
            message: 'You\'re keeping sugar low and your body thanks you. Keep riding this wave of healthy choices!',
            action: 'Keep it up',
            insightType: 'sugar_low',
            priority: 4,
        });
    }

    // === MOOD INSIGHTS ===
    if (avgMood > 0 && avgMood < 3) {
        insights.push({
            icon: 'heart',
            iconColor: '#EC4899',
            title: 'Be Kind to Yourself',
            message: 'It\'s okay to have tough days. A short walk, music, or calling a friend could help lift your spirits.',
            action: 'Mood boosters',
            insightType: 'mood',
            priority: 1,
        });
    } else if (avgMood >= 4) {
        insights.push({
            icon: 'heart',
            iconColor: '#22C55E',
            title: 'Great Mood Lately! 😊',
            message: 'Your mood has been positive! Healthy eating and self-care are clearly working for you.',
            insightType: 'celebration',
            priority: 5,
        });
    }

    // === PROTEIN INSIGHTS ===
    if (nutritionInsights && nutritionInsights.avgProtein < 40) {
        insights.push({
            icon: 'fitness',
            iconColor: '#3B82F6',
            title: 'Fuel Your Body with Protein',
            message: 'More protein can be a game changer for cravings and fullness. Try adding some to each meal!',
            action: 'High-protein ideas',
            insightType: 'protein',
            priority: 2,
        });
    } else if (nutritionInsights && nutritionInsights.avgProtein >= 60) {
        insights.push({
            icon: 'fitness',
            iconColor: '#22C55E',
            title: 'Protein Pro! 💪',
            message: 'Excellent protein intake! This is helping you stay full and reduce cravings.',
            insightType: 'celebration',
            priority: 5,
        });
    }

    // === FIBER INSIGHTS ===
    if (nutritionInsights && nutritionInsights.avgFiber < 15) {
        insights.push({
            icon: 'leaf',
            iconColor: '#22C55E',
            title: 'Add More Fiber',
            message: 'Fiber keeps you full and supports gut health. Try adding more vegetables and whole grains.',
            action: 'Fiber-rich foods',
            insightType: 'fiber',
            priority: 3,
        });
    }

    // === FOCUS INSIGHTS ===
    if (avgFocus > 0 && avgFocus < 3) {
        insights.push({
            icon: 'bulb',
            iconColor: '#F59E0B',
            title: 'Boost Your Focus',
            message: 'Brain fog? Try reducing sugar and adding omega-3 rich foods like salmon or walnuts.',
            action: 'Brain foods',
            insightType: 'energy',
            priority: 2,
        });
    }

    // === CORRELATION INSIGHTS ===
    if (nutritionInsights && nutritionInsights.avgAddedSugar > 30 && avgEnergy < 3) {
        insights.push({
            icon: 'git-compare',
            iconColor: '#EC4899',
            title: 'Energy-Sugar Connection',
            message: 'Notice how energy dips when sugar is high? Try swapping sweets for fruit to steady your energy!',
            action: 'Learn more',
            insightType: 'correlation',
            priority: 1,
        });
    }

    if (avgSleep < 7 && avgMood < 3) {
        insights.push({
            icon: 'git-compare',
            iconColor: '#8B5CF6',
            title: 'Sleep-Mood Connection',
            message: 'Low sleep and mood often go together. Even one extra hour of rest can brighten your outlook!',
            action: 'Learn more',
            insightType: 'sleep',
            priority: 1,
        });
    }

    // === STREAK/CONSISTENCY INSIGHTS ===
    if (wellnessLogs.length >= 7) {
        insights.push({
            icon: 'flame',
            iconColor: '#F59E0B',
            title: 'Consistency Champion! 🔥',
            message: `You've logged ${wellnessLogs.length} check-ins! Consistency is the key to lasting change.`,
            action: 'Keep the streak',
            insightType: 'streak',
            priority: 4,
        });
    } else if (wellnessLogs.length >= 3) {
        insights.push({
            icon: 'trending-up',
            iconColor: looviColors.accent.primary,
            title: 'Building Momentum',
            message: 'Great start! Keep logging daily to build a powerful health habit.',
            action: 'Build consistency',
            insightType: 'consistency',
            priority: 3,
        });
    }

    // === POSITIVE MOOD STREAK ===
    if (wellnessLogs.length >= 3) {
        const recentMood = wellnessLogs.slice(-3).reduce((sum, log) => sum + log.mood, 0) / 3;
        if (recentMood >= 4) {
            insights.push({
                icon: 'star',
                iconColor: '#F59E0B',
                title: 'You\'re Glowing! ✨',
                message: 'Your consistent efforts are paying off with great mood levels. Whatever you\'re doing, it\'s working!',
                insightType: 'celebration',
                priority: 4,
            });
        }
    }

    // === BREAKFAST INSIGHT ===
    const morningItems = scannedItems.filter(item => {
        const hour = new Date(item.timestamp).getHours();
        return hour >= 5 && hour < 10;
    });
    if (morningItems.length === 0 && scannedItems.length > 0) {
        insights.push({
            icon: 'sunny',
            iconColor: '#F5B461',
            title: 'Start with Breakfast',
            message: 'We don\'t see many morning meals. A protein-rich breakfast can stabilize your whole day!',
            action: 'Breakfast ideas',
            insightType: 'breakfast',
            priority: 3,
        });
    }

    // === SNACKING INSIGHT ===
    const afternoonItems = scannedItems.filter(item => {
        const hour = new Date(item.timestamp).getHours();
        return hour >= 14 && hour < 17;
    });
    if (afternoonItems.length >= 3) {
        const avgAfternoonSugar = afternoonItems.reduce((sum, item) => sum + (item.addedSugar || 0), 0) / afternoonItems.length;
        if (avgAfternoonSugar > 10) {
            insights.push({
                icon: 'nutrition',
                iconColor: '#F59E0B',
                title: 'Afternoon Snack Swap',
                message: 'Your afternoon snacks tend to be sugary. Try nuts, cheese, or veggies with hummus instead!',
                action: 'Smart snacks',
                insightType: 'snacking',
                priority: 2,
            });
        }
    }

    // === MOTIVATIONAL FALLBACK ===
    if (insights.length < 3) {
        insights.push({
            icon: 'compass',
            iconColor: looviColors.accent.primary,
            title: 'Stay on Course',
            message: 'Every healthy choice moves you forward. Keep tracking and you\'ll unlock more personalized insights!',
            insightType: 'consistency',
            priority: 5,
        });
    }

    // Sort by priority (lower = more important) and return top 6
    return insights.sort((a, b) => a.priority - b.priority).slice(0, 6);
};


export default function AnalyticsScreen() {
    const navigation = useNavigation<any>();
    const [timeframe, setTimeframe] = useState<Timeframe>('7d');
    const [wellnessLogs, setWellnessLogs] = useState<WellnessLogData[]>([]);
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [healthScore, setHealthScore] = useState({ overall: 0, nutrition: 0, wellness: 0 });
    const [prevHealthScore, setPrevHealthScore] = useState({ overall: 0, nutrition: 0, wellness: 0 });
    const [nutritionInsights, setNutritionInsights] = useState<ReturnType<typeof getNutritionInsights> | null>(null);
    const [showInfoModal, setShowInfoModal] = useState<'overall' | 'nutrition' | 'wellness' | null>(null);
    const [showFoodScanner, setShowFoodScanner] = useState(false);
    const [showWellnessModal, setShowWellnessModal] = useState(false);
    const [showInsightModal, setShowInsightModal] = useState<InsightType | null>(null);
    const { onboardingData, addJournalEntry, refreshStreakFromFoodLogs } = useUserData();

    // Load wellness logs and food data
    useFocusEffect(
        React.useCallback(() => {
            const loadData = async () => {
                try {
                    // Trigger streak refresh to ensure up-to-date status
                    if (refreshStreakFromFoodLogs) {
                        refreshStreakFromFoodLogs();
                    }

                    const [storedWellness, foodItems] = await Promise.all([
                        AsyncStorage.getItem('wellness_logs'),
                        getScannedItems(),
                    ]);

                    if (storedWellness) {
                        setWellnessLogs(JSON.parse(storedWellness));
                    } else {
                        setWellnessLogs([]);
                    }
                    setScannedItems(foodItems);
                } catch (error) {
                    console.error('Error loading data:', error);
                }
            };
            loadData();
        }, [])
    );

    // Filter data based on timeframe
    const getTimeframeDays = (tf: Timeframe): number => {
        switch (tf) {
            case '7d': return 7;
            case '1m': return 30;
            case 'all': return 365;
        }
    };

    const filteredWellnessLogs = useMemo(() => {
        const days = getTimeframeDays(timeframe);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return wellnessLogs.filter(log => new Date(log.date) >= cutoff);
    }, [wellnessLogs, timeframe]);

    const filteredScannedItems = useMemo(() => {
        const days = getTimeframeDays(timeframe);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return scannedItems.filter(item => new Date(item.timestamp) >= cutoff);
    }, [scannedItems, timeframe]);

    // Calculate wellness averages
    const wellnessAverages = useMemo(() => {
        if (filteredWellnessLogs.length === 0) {
            return { mood: 0, energy: 0, focus: 0, sleep: 0 };
        }
        const sum = filteredWellnessLogs.reduce(
            (acc, log) => ({
                mood: acc.mood + log.mood,
                energy: acc.energy + log.energy,
                focus: acc.focus + log.focus,
                sleep: acc.sleep + log.sleepHours,
            }),
            { mood: 0, energy: 0, focus: 0, sleep: 0 }
        );
        const count = filteredWellnessLogs.length;
        return {
            mood: sum.mood / count,
            energy: sum.energy / count,
            focus: sum.focus / count,
            sleep: sum.sleep / count,
        };
    }, [filteredWellnessLogs]);

    // Calculate health scores
    useEffect(() => {
        const calculateScore = () => {
            const days = getTimeframeDays(timeframe);

            const wellnessMetrics: WellnessMetrics[] = filteredWellnessLogs.map(log => ({
                mood: log.mood,
                energy: log.energy,
                focus: log.focus,
                sleepHours: log.sleepHours,
            }));

            const aggregated = aggregateHealthData(filteredScannedItems, wellnessMetrics, days);
            setHealthScore({
                overall: aggregated.avgOverallScore,
                nutrition: aggregated.avgNutritionScore,
                wellness: aggregated.avgWellnessScore,
            });

            // Previous period
            const prevStart = new Date();
            prevStart.setDate(prevStart.getDate() - (days * 2));
            const prevEnd = new Date();
            prevEnd.setDate(prevEnd.getDate() - days);

            const prevWellness = wellnessLogs.filter(log => {
                const logDate = new Date(log.date);
                return logDate >= prevStart && logDate < prevEnd;
            });
            const prevFood = scannedItems.filter(item => {
                const itemDate = new Date(item.timestamp);
                return itemDate >= prevStart && itemDate < prevEnd;
            });

            const prevMetrics: WellnessMetrics[] = prevWellness.map(log => ({
                mood: log.mood,
                energy: log.energy,
                focus: log.focus,
                sleepHours: log.sleepHours,
            }));

            const prevAggregated = aggregateHealthData(prevFood, prevMetrics, days);
            setPrevHealthScore({
                overall: prevAggregated.avgOverallScore,
                nutrition: prevAggregated.avgNutritionScore,
                wellness: prevAggregated.avgWellnessScore,
            });

            // Nutrition insights
            const insights = getNutritionInsights(filteredScannedItems, days);
            setNutritionInsights(insights);
        };

        calculateScore();
    }, [filteredScannedItems, filteredWellnessLogs, scannedItems, wellnessLogs, timeframe]);

    const handleTimeframeChange = (newTimeframe: Timeframe) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setTimeframe(newTimeframe);
    };

    // Generate personalized insights
    const insights = useMemo(() =>
        generateInsights(filteredWellnessLogs, filteredScannedItems, nutritionInsights),
        [filteredWellnessLogs, filteredScannedItems, nutritionInsights]
    );

    // Calculate changes
    const getScoreChange = (current: number, previous: number) => {
        const change = Math.round(current - previous);
        return { value: Math.abs(change), isPositive: change >= 0 };
    };

    const nutritionChange = getScoreChange(healthScore.nutrition, prevHealthScore.nutrition);
    const wellnessChange = getScoreChange(healthScore.wellness, prevHealthScore.wellness);

    const getTimeframeLabel = () => {
        switch (timeframe) {
            case '7d': return 'vs last week';
            case '1m': return 'vs last month';
            case 'all': return 'vs previous period';
        }
    };

    // Handle wellness save
    const handleWellnessSave = async (log: WellnessLog) => {
        try {
            const stored = await AsyncStorage.getItem('wellness_logs');
            const logs = stored ? JSON.parse(stored) : [];
            const existingIndex = logs.findIndex((l: any) => l.date === log.date);

            if (existingIndex >= 0) {
                logs[existingIndex] = log;
            } else {
                logs.unshift(log);
            }

            await AsyncStorage.setItem('wellness_logs', JSON.stringify(logs));
            setWellnessLogs(logs);

            if (log.thoughts && log.thoughts.trim()) {
                await addJournalEntry(new Date(), {
                    mood: log.mood >= 4 ? 'good' : log.mood >= 3 ? 'okay' : 'struggling',
                    notes: log.thoughts.trim(),
                });
            }
        } catch (error) {
            console.error('Failed to save wellness log:', error);
        }
    };

    // Score Info Modal
    const renderInfoModal = () => {
        if (!showInfoModal) return null;
        const info = SCORE_INFO[showInfoModal];
        const currentScore = showInfoModal === 'overall' ? healthScore.overall :
            showInfoModal === 'nutrition' ? healthScore.nutrition : healthScore.wellness;
        const currentRange = info.ranges.find(r => currentScore >= r.min && currentScore <= r.max) || info.ranges[info.ranges.length - 1];

        return (
            <Modal
                visible={!!showInfoModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowInfoModal(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.infoModalContent}>
                        <View style={styles.infoModalHeader}>
                            <Text style={styles.infoModalTitle}>{info.title}</Text>
                            <TouchableOpacity
                                style={styles.infoModalClose}
                                onPress={() => setShowInfoModal(null)}
                            >
                                <Feather name="x" size={20} color={looviColors.text.secondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.currentScoreBox, { backgroundColor: `${currentRange.color}15` }]}>
                            <Text style={[styles.currentScoreValue, { color: currentRange.color }]}>
                                {currentScore}
                            </Text>
                            <Text style={styles.currentScoreOutOf}>/100</Text>
                            <View style={[styles.currentScoreBadge, { backgroundColor: currentRange.color }]}>
                                <Text style={styles.currentScoreBadgeText}>{currentRange.label}</Text>
                            </View>
                        </View>

                        <Text style={styles.infoModalDescription}>{info.description}</Text>

                        <View style={styles.tipBox}>
                            <Ionicons name="bulb" size={18} color={currentRange.color} />
                            <Text style={styles.tipText}>{currentRange.tip}</Text>
                        </View>

                        <Text style={styles.rangesTitle}>Score Ranges</Text>
                        <View style={styles.rangesContainer}>
                            {info.ranges.map((range, index) => (
                                <View key={index} style={styles.rangeRow}>
                                    <View style={[styles.rangeDot, { backgroundColor: range.color }]} />
                                    <Text style={styles.rangeLabel}>{range.label}</Text>
                                    <Text style={styles.rangeValues}>{range.min}-{range.max}</Text>
                                </View>
                            ))}
                        </View>

                        <Text style={styles.improveTitle}>How to Improve</Text>
                        {info.howToImprove.map((tip, index) => (
                            <View key={index} style={styles.improveItem}>
                                <Ionicons name="checkmark-circle" size={16} color={looviColors.accent.primary} />
                                <Text style={styles.improveText}>{tip}</Text>
                            </View>
                        ))}

                        <TouchableOpacity
                            style={styles.infoModalButton}
                            onPress={() => setShowInfoModal(null)}
                        >
                            <Text style={styles.infoModalButtonText}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <SwipeableTabView currentTab="Analytics">
            <LooviBackground variant="blueBottom">
                <SafeAreaView style={styles.container}>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Health</Text>
                            <Text style={styles.subtitle}>Your personalized health analysis</Text>
                        </View>

                        {/* Timeframe Toggle */}
                        <TimeframeToggle
                            value={timeframe}
                            onChange={handleTimeframeChange}
                        />

                        {/* Overall Health Score */}
                        <GlassCard variant="light" padding="lg" style={styles.healthCard}>
                            <TouchableOpacity
                                onPress={() => setShowInfoModal('overall')}
                                activeOpacity={0.8}
                            >
                                <HealthScoreRing
                                    mood={wellnessAverages.mood}
                                    energy={wellnessAverages.energy}
                                    focus={wellnessAverages.focus}
                                    sleep={wellnessAverages.sleep}
                                    overallScore={healthScore.overall}
                                />
                                <View style={styles.infoHint}>
                                    <Ionicons name="information-circle-outline" size={16} color={looviColors.text.tertiary} />
                                    <Text style={styles.infoHintText}>Tap for details</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Score Breakdown */}
                            <View style={styles.scoreBreakdown}>
                                <TouchableOpacity
                                    style={styles.scoreItem}
                                    onPress={() => setShowInfoModal('nutrition')}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.scoreItemHeader}>
                                        <Text style={styles.scoreItemLabel}>Nutrition</Text>
                                        <Ionicons name="information-circle-outline" size={14} color={looviColors.text.muted} />
                                    </View>
                                    <Text style={[styles.scoreItemValue, { color: getScoreColor(healthScore.nutrition) }]}>
                                        {healthScore.nutrition}
                                    </Text>
                                    <Text style={styles.scoreItemOutOf}>/100</Text>
                                    {prevHealthScore.nutrition > 0 && (
                                        <View style={styles.changeIndicator}>
                                            <Ionicons
                                                name={nutritionChange.isPositive ? 'arrow-up' : 'arrow-down'}
                                                size={12}
                                                color={nutritionChange.isPositive ? '#22C55E' : '#EF4444'}
                                            />
                                            <Text style={[styles.changeText, { color: nutritionChange.isPositive ? '#22C55E' : '#EF4444' }]}>
                                                {nutritionChange.value}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.scoreItem}
                                    onPress={() => setShowInfoModal('wellness')}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.scoreItemHeader}>
                                        <Text style={styles.scoreItemLabel}>Wellness</Text>
                                        <Ionicons name="information-circle-outline" size={14} color={looviColors.text.muted} />
                                    </View>
                                    <Text style={[styles.scoreItemValue, { color: getScoreColor(healthScore.wellness) }]}>
                                        {healthScore.wellness}
                                    </Text>
                                    <Text style={styles.scoreItemOutOf}>/100</Text>
                                    {prevHealthScore.wellness > 0 && (
                                        <View style={styles.changeIndicator}>
                                            <Ionicons
                                                name={wellnessChange.isPositive ? 'arrow-up' : 'arrow-down'}
                                                size={12}
                                                color={wellnessChange.isPositive ? '#22C55E' : '#EF4444'}
                                            />
                                            <Text style={[styles.changeText, { color: wellnessChange.isPositive ? '#22C55E' : '#EF4444' }]}>
                                                {wellnessChange.value}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>

                            {(prevHealthScore.nutrition > 0 || prevHealthScore.wellness > 0) && (
                                <Text style={styles.comparisonLabel}>{getTimeframeLabel()}</Text>
                            )}
                        </GlassCard>

                        {/* Personalized Insights Section - THE MAIN FOCUS */}
                        <View style={styles.insightsSection}>
                            <Text style={styles.insightsSectionTitle}>Your Insights</Text>
                            <Text style={styles.insightsSectionSubtitle}>Tap any insight for actionable tips</Text>

                            {insights.map((insight, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.insightCard,
                                        insight.priority === 1 && styles.insightCardPriority,
                                    ]}
                                    activeOpacity={0.8}
                                    onPress={() => setShowInsightModal(insight.insightType)}
                                >
                                    <View style={[styles.insightIconContainer, { backgroundColor: `${insight.iconColor}15` }]}>
                                        <Ionicons name={insight.icon as any} size={24} color={insight.iconColor} />
                                    </View>
                                    <View style={styles.insightContent}>
                                        <Text style={styles.insightTitle}>{insight.title}</Text>
                                        <Text style={styles.insightMessage}>{insight.message}</Text>
                                        {insight.action && (
                                            <View style={styles.insightActionRow}>
                                                <Text style={[styles.insightAction, { color: insight.iconColor }]}>{insight.action}</Text>
                                                <Ionicons name="chevron-forward" size={14} color={insight.iconColor} />
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Quick Actions */}
                        <View style={styles.quickActionsRow}>
                            <TouchableOpacity
                                style={[styles.quickActionButton, styles.quickActionPrimary]}
                                onPress={() => setShowFoodScanner(true)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="scan" size={22} color="#FFFFFF" />
                                <Text style={styles.quickActionPrimaryText}>Log Food</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.quickActionButton, styles.quickActionSecondary]}
                                onPress={() => setShowWellnessModal(true)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="heart" size={22} color={looviColors.coralOrange} />
                                <Text style={styles.quickActionSecondaryText}>Check-in</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Nutrition Summary - Simplified */}
                        {nutritionInsights && nutritionInsights.avgCalories > 0 && (
                            <GlassCard variant="light" padding="lg" style={styles.nutritionSummaryCard}>
                                <Text style={styles.nutritionSummaryTitle}>Nutrition Summary</Text>

                                <View style={styles.nutritionStatsRow}>
                                    <View style={styles.nutritionStat}>
                                        <Text style={styles.nutritionStatValue}>{nutritionInsights.avgCalories}</Text>
                                        <Text style={styles.nutritionStatLabel}>Calories/day</Text>
                                    </View>
                                    <View style={styles.nutritionStatDivider} />
                                    <View style={styles.nutritionStat}>
                                        <Text style={[
                                            styles.nutritionStatValue,
                                            { color: nutritionInsights.avgAddedSugar <= 25 ? '#22C55E' : nutritionInsights.avgAddedSugar <= 50 ? '#F59E0B' : '#EF4444' }
                                        ]}>
                                            {nutritionInsights.avgAddedSugar}g
                                        </Text>
                                        <Text style={styles.nutritionStatLabel}>Sugar/day</Text>
                                    </View>
                                    <View style={styles.nutritionStatDivider} />
                                    <View style={styles.nutritionStat}>
                                        <Text style={styles.nutritionStatValue}>{nutritionInsights.avgProtein}g</Text>
                                        <Text style={styles.nutritionStatLabel}>Protein/day</Text>
                                    </View>
                                </View>

                                {/* Visual sugar meter */}
                                <View style={styles.sugarMeter}>
                                    <View style={styles.sugarMeterHeader}>
                                        <Text style={styles.sugarMeterLabel}>Daily Sugar</Text>
                                        <Text style={styles.sugarMeterValue}>
                                            {nutritionInsights.avgAddedSugar}g / 25g recommended
                                        </Text>
                                    </View>
                                    <View style={styles.sugarMeterTrack}>
                                        <View
                                            style={[
                                                styles.sugarMeterFill,
                                                {
                                                    width: `${Math.min((nutritionInsights.avgAddedSugar / 50) * 100, 100)}%`,
                                                    backgroundColor: nutritionInsights.avgAddedSugar <= 25 ? '#22C55E' : nutritionInsights.avgAddedSugar <= 50 ? '#F59E0B' : '#EF4444'
                                                }
                                            ]}
                                        />
                                        <View style={styles.sugarMeterMarker} />
                                    </View>
                                    <View style={styles.sugarMeterLabels}>
                                        <Text style={styles.sugarMeterMarkerLabel}>0g</Text>
                                        <Text style={[styles.sugarMeterMarkerLabel, { position: 'absolute', left: '50%' }]}>25g</Text>
                                        <Text style={styles.sugarMeterMarkerLabel}>50g+</Text>
                                    </View>
                                </View>
                            </GlassCard>
                        )}

                        {/* Wellness Summary */}
                        {filteredWellnessLogs.length > 0 && (
                            <GlassCard variant="light" padding="lg" style={styles.wellnessSummaryCard}>
                                <Text style={styles.wellnessSummaryTitle}>Wellness Summary</Text>
                                <Text style={styles.wellnessSummarySubtitle}>Based on {filteredWellnessLogs.length} check-ins</Text>

                                <View style={styles.wellnessMetricsGrid}>
                                    {[
                                        { label: 'Mood', value: wellnessAverages.mood, icon: 'happy-outline', color: looviColors.coralOrange },
                                        { label: 'Energy', value: wellnessAverages.energy, icon: 'flash-outline', color: '#F5B461' },
                                        { label: 'Focus', value: wellnessAverages.focus, icon: 'bulb-outline', color: looviColors.coralDark },
                                        { label: 'Sleep', value: wellnessAverages.sleep, icon: 'bed-outline', color: looviColors.skyBlueDark, suffix: 'h' },
                                    ].map((metric, index) => (
                                        <View key={index} style={styles.wellnessMetricItem}>
                                            <View style={[styles.wellnessMetricIcon, { backgroundColor: `${metric.color}15` }]}>
                                                <Ionicons name={metric.icon as any} size={18} color={metric.color} />
                                            </View>
                                            <Text style={styles.wellnessMetricValue}>
                                                {metric.suffix ? metric.value.toFixed(1) : metric.value.toFixed(1)}
                                                {metric.suffix || '/5'}
                                            </Text>
                                            <Text style={styles.wellnessMetricLabel}>{metric.label}</Text>
                                        </View>
                                    ))}
                                </View>
                            </GlassCard>
                        )}

                    </ScrollView>

                    {/* Modals */}
                    {renderInfoModal()}

                    <FoodScannerModal
                        visible={showFoodScanner}
                        onClose={() => setShowFoodScanner(false)}
                        onScanComplete={(item) => {
                            setScannedItems(prev => [item, ...prev]);
                            setShowFoodScanner(false);
                        }}
                    />

                    <WellnessModal
                        visible={showWellnessModal}
                        onClose={() => setShowWellnessModal(false)}
                        onSave={handleWellnessSave}
                        selectedDate={new Date().toISOString().split('T')[0]}
                    />

                    <InsightDetailModal
                        visible={showInsightModal !== null}
                        insightType={showInsightModal}
                        onClose={() => setShowInsightModal(null)}
                    />
                </SafeAreaView>
            </LooviBackground>
        </SwipeableTabView>
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
        paddingTop: spacing.lg,
        paddingBottom: spacing['3xl'],
    },
    header: {
        marginBottom: spacing.xl,
    },
    title: {
        fontFamily: typography.fonts.heading.bold,
        fontSize: 28,
        color: looviColors.text.primary,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '400',
        color: looviColors.text.secondary,
        marginTop: spacing.xs,
    },
    healthCard: {
        marginBottom: spacing.lg,
        alignItems: 'center',
    },
    infoHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginTop: spacing.sm,
    },
    infoHintText: {
        fontSize: 12,
        color: looviColors.text.tertiary,
    },
    scoreBreakdown: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingTop: spacing.lg,
        marginTop: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
    },
    scoreItem: {
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },
    scoreItemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: spacing.xs,
    },
    scoreItemLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: looviColors.text.tertiary,
    },
    scoreItemValue: {
        fontFamily: typography.fonts.heading.bold,
        fontSize: 28,
    },
    scoreItemOutOf: {
        fontSize: 12,
        color: looviColors.text.muted,
        marginTop: -4,
    },
    changeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginTop: spacing.xs,
    },
    changeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    comparisonLabel: {
        fontSize: 11,
        color: looviColors.text.muted,
        marginTop: spacing.md,
    },
    // Insights Section
    insightsSection: {
        marginBottom: spacing.lg,
    },
    insightsSectionTitle: {
        fontFamily: typography.fonts.heading.bold,
        fontSize: 20,
        color: looviColors.text.primary,
        marginBottom: spacing.xs,
    },
    insightsSectionSubtitle: {
        fontSize: 14,
        color: looviColors.text.secondary,
        marginBottom: spacing.lg,
    },
    insightCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.6)', // More transparent as requested
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        marginBottom: spacing.md,
        // Reduced shadow for lighter feel
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    insightCardPriority: {
        borderLeftWidth: 4,
        borderLeftColor: looviColors.coralOrange,
    },
    insightIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    insightContent: {
        flex: 1,
    },
    insightTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: 4,
    },
    insightMessage: {
        fontSize: 14,
        fontWeight: '400',
        color: looviColors.text.secondary,
        lineHeight: 20,
    },
    insightActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    insightAction: {
        fontSize: 13,
        fontWeight: '600',
    },
    // Quick Actions
    quickActionsRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    quickActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: 14,
        borderRadius: borderRadius.xl,
    },
    quickActionPrimary: {
        backgroundColor: looviColors.accent.primary,
    },
    quickActionPrimaryText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    quickActionSecondary: {
        backgroundColor: 'rgba(232, 168, 124, 0.15)',
    },
    quickActionSecondaryText: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.coralOrange,
    },
    // Nutrition Summary
    nutritionSummaryCard: {
        marginBottom: spacing.lg,
    },
    nutritionSummaryTitle: {
        fontFamily: typography.fonts.heading.bold,
        fontSize: 18,
        color: looviColors.text.primary,
        marginBottom: spacing.md,
    },
    nutritionStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    nutritionStat: {
        flex: 1,
        alignItems: 'center',
    },
    nutritionStatValue: {
        fontSize: 22,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    nutritionStatLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        marginTop: 2,
    },
    nutritionStatDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
    },
    sugarMeter: {
        marginTop: spacing.sm,
    },
    sugarMeterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    sugarMeterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    sugarMeterValue: {
        fontSize: 12,
        fontWeight: '500',
        color: looviColors.text.tertiary,
    },
    sugarMeterTrack: {
        height: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderRadius: 4,
        position: 'relative',
    },
    sugarMeterFill: {
        height: '100%',
        borderRadius: 4,
    },
    sugarMeterMarker: {
        position: 'absolute',
        left: '50%',
        top: -2,
        width: 2,
        height: 12,
        backgroundColor: looviColors.text.tertiary,
    },
    sugarMeterLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
        position: 'relative',
    },
    sugarMeterMarkerLabel: {
        fontSize: 10,
        color: looviColors.text.muted,
    },
    // Wellness Summary
    wellnessSummaryCard: {
        marginBottom: spacing.lg,
    },
    wellnessSummaryTitle: {
        fontFamily: typography.fonts.heading.bold,
        fontSize: 18,
        color: looviColors.text.primary,
    },
    wellnessSummarySubtitle: {
        fontSize: 13,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        marginBottom: spacing.lg,
    },
    wellnessMetricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    wellnessMetricItem: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    wellnessMetricIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
    },
    wellnessMetricValue: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    wellnessMetricLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        marginTop: 2,
    },
    // Info Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    infoModalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius['2xl'],
        padding: spacing.xl,
        width: '100%',
        maxWidth: 400,
        maxHeight: '85%',
    },
    infoModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    infoModalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    infoModalClose: {
        padding: spacing.xs,
    },
    currentScoreBox: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.md,
    },
    currentScoreValue: {
        fontSize: 48,
        fontWeight: '800',
    },
    currentScoreOutOf: {
        fontSize: 18,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        marginLeft: 4,
    },
    currentScoreBadge: {
        marginLeft: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    currentScoreBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    infoModalDescription: {
        fontSize: 14,
        fontWeight: '400',
        color: looviColors.text.secondary,
        lineHeight: 20,
        marginBottom: spacing.md,
    },
    tipBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
    },
    tipText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '500',
        color: looviColors.text.primary,
        lineHeight: 18,
    },
    rangesTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.primary,
        marginBottom: spacing.sm,
    },
    rangesContainer: {
        marginBottom: spacing.lg,
    },
    rangeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.xs,
    },
    rangeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: spacing.sm,
    },
    rangeLabel: {
        flex: 1,
        fontSize: 13,
        fontWeight: '500',
        color: looviColors.text.primary,
    },
    rangeValues: {
        fontSize: 13,
        fontWeight: '400',
        color: looviColors.text.tertiary,
    },
    improveTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.primary,
        marginBottom: spacing.sm,
    },
    improveItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    improveText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '400',
        color: looviColors.text.secondary,
        lineHeight: 18,
    },
    infoModalButton: {
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 14,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        marginTop: spacing.md,
    },
    infoModalButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
