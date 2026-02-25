import React, { useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    Linking,
    Animated,
    PanResponder,
    Dimensions,
    TouchableWithoutFeedback,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import { GlassCard } from './GlassCard';
import { PlanType } from '../utils/planUtils';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.9;
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.4;

interface PlanDetailsModalProps {
    visible: boolean;
    planType: PlanType;
    onClose: () => void;
}

interface HabitPrinciple {
    title: string;
    description: string;
    emoji: string;
}

interface PracticalStep {
    title: string;
    description: string;
    emoji: string;
}

interface FoodCategory {
    category: string;
    items: string[];
    emoji: string;
}

const ATOMIC_HABITS_PRINCIPLES: HabitPrinciple[] = [
    {
        emoji: '🎯',
        title: 'Make it Obvious',
        description: 'Remove all sugary foods from your home. Out of sight, out of mind. Replace with visible healthy alternatives.',
    },
    {
        emoji: '✨',
        title: 'Make it Attractive',
        description: 'Stock your kitchen with delicious sugar-free alternatives. Make healthy eating appealing and convenient.',
    },
    {
        emoji: '⚡',
        title: 'Make it Easy',
        description: 'Prep sugar-free snacks in advance. Keep them ready to grab. Reduce friction for good choices.',
    },
    {
        emoji: '🎉',
        title: 'Make it Satisfying',
        description: 'Track your progress daily. Celebrate small wins. Use this app to visualize your success.',
    },
];

const PRACTICAL_STEPS: PracticalStep[] = [
    {
        emoji: '🗑️',
        title: 'Clean Your Environment',
        description: 'Remove all added-sugar products from your home. Donate or discard cookies, candy, soda, sweetened cereals, and condiments with added sugar.',
    },
    {
        emoji: '🛒',
        title: 'Shop the Perimeter',
        description: 'At the grocery store, stick to the outer aisles: produce, meat, dairy. Avoid center aisles where processed foods live.',
    },
    {
        emoji: '📖',
        title: 'Read Every Label',
        description: 'Sugar hides in 60+ names: sucrose, HFCS, maltose, dextrose, etc. If it ends in "-ose", it\'s sugar.',
    },
    {
        emoji: '🍽️',
        title: 'Meal Prep Sundays',
        description: 'Prepare sugar-free meals for the week. When you\'re hungry and tired, you\'ll reach for what\'s ready.',
    },
    {
        emoji: '💧',
        title: 'Hydration Protocol',
        description: 'Drink water before meals. Often "hunger" is actually thirst. Sparkling water can satisfy fizzy drink cravings.',
    },
    {
        emoji: '😴',
        title: 'Prioritize Sleep',
        description: 'Sleep deprivation increases sugar cravings by 30-40%. Aim for 7-9 hours. Your willpower will thank you.',
    },
];

const FOODS_TO_EAT: FoodCategory[] = [
    {
        emoji: '🥑',
        category: 'Healthy Fats',
        items: ['Avocados', 'Nuts (almonds, walnuts)', 'Olive oil', 'Fatty fish (salmon, mackerel)', 'Chia seeds'],
    },
    {
        emoji: '🥩',
        category: 'Proteins',
        items: ['Eggs', 'Chicken', 'Grass-fed beef', 'Greek yogurt (unsweetened)', 'Legumes'],
    },
    {
        emoji: '🥦',
        category: 'Vegetables',
        items: ['Leafy greens', 'Broccoli', 'Bell peppers', 'Cauliflower', 'Zucchini'],
    },
    {
        emoji: '🫐',
        category: 'Low-Sugar Fruits',
        items: ['Berries', 'Apples', 'Pears', 'Citrus fruits', 'Kiwi (moderate portions)'],
    },
];

const HELPFUL_RESOURCES = [
    {
        title: 'That Sugar Film',
        url: 'https://www.youtube.com/watch?v=6uaWekLrilY',
        type: 'video',
    },
    {
        title: 'Fed Up Documentary',
        url: 'https://www.youtube.com/watch?v=aCUbvOwwfWM',
        type: 'video',
    },
    {
        title: 'The Case Against Sugar (Gary Taubes)',
        url: 'https://www.amazon.com/Case-Against-Sugar-Gary-Taubes/dp/0307701646',
        type: 'book',
    },
];

export function PlanDetailsModal({ visible, planType, onClose }: PlanDetailsModalProps) {
    const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

    const planTitle = planType === 'cold_turkey' ? 'Cold Turkey Plan' : 'Gradual Reduction Plan';
    const planEmoji = planType === 'cold_turkey' ? '🚀' : '🌱';

    const dismiss = useCallback(() => {
        Animated.timing(translateY, {
            toValue: SHEET_HEIGHT,
            duration: 220,
            useNativeDriver: true,
        }).start(() => onClose());
    }, [translateY, onClose]);

    useEffect(() => {
        if (visible) {
            translateY.setValue(SHEET_HEIGHT);
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 3,
                speed: 14,
            }).start();
        }
    }, [visible, translateY]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 10,
            onPanResponderGrant: () => {
                translateY.stopAnimation();
                translateY.setOffset(0);
            },
            onPanResponderMove: (_, gs) => {
                translateY.setValue(Math.max(0, gs.dy));
            },
            onPanResponderRelease: (_, gs) => {
                translateY.flattenOffset();
                if (gs.dy > DISMISS_THRESHOLD || gs.vy > 1.0) {
                    dismiss();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 4,
                        speed: 14,
                    }).start();
                }
            },
        })
    ).current;

    const openLink = async (url: string) => {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={dismiss}
        >
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={dismiss}>
                    <View style={StyleSheet.absoluteFill} />
                </TouchableWithoutFeedback>

                <Animated.View
                    style={[
                        styles.sheet,
                        { transform: [{ translateY }] }
                    ]}
                >
                    <View {...panResponder.panHandlers} style={styles.handleContainer}>
                        <View style={styles.handle} />
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.planEmoji}>{planEmoji}</Text>
                            <Text style={styles.title}>{planTitle}</Text>
                            <Text style={styles.subtitle}>Your Complete Success Guide</Text>
                        </View>

                        {/* Atomic Habits Principles */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>🧠 The 4 Laws of Habit Change</Text>
                            <Text style={styles.sectionSubtitle}>
                                Based on "Atomic Habits" by James Clear
                            </Text>
                            {ATOMIC_HABITS_PRINCIPLES.map((principle, index) => (
                                <GlassCard key={index} variant="light" padding="md" style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardEmoji}>{principle.emoji}</Text>
                                        <Text style={styles.cardTitle}>{principle.title}</Text>
                                    </View>
                                    <Text style={styles.cardDescription}>{principle.description}</Text>
                                </GlassCard>
                            ))}
                        </View>

                        {/* Practical Action Steps */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>✅ Practical Action Steps</Text>
                            {PRACTICAL_STEPS.map((step, index) => (
                                <GlassCard key={index} variant="light" padding="md" style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardEmoji}>{step.emoji}</Text>
                                        <Text style={styles.cardTitle}>{step.title}</Text>
                                    </View>
                                    <Text style={styles.cardDescription}>{step.description}</Text>
                                </GlassCard>
                            ))}
                        </View>

                        {/* Foods to Eat */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>🍴 What to Eat</Text>
                            <Text style={styles.sectionSubtitle}>
                                Focus on whole, unprocessed foods
                            </Text>
                            {FOODS_TO_EAT.map((category, index) => (
                                <GlassCard key={index} variant="light" padding="md" style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardEmoji}>{category.emoji}</Text>
                                        <Text style={styles.cardTitle}>{category.category}</Text>
                                    </View>
                                    <View style={styles.foodList}>
                                        {category.items.map((item, idx) => (
                                            <Text key={idx} style={styles.foodItem}>• {item}</Text>
                                        ))}
                                    </View>
                                </GlassCard>
                            ))}
                        </View>

                        {/* Resources */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>📚 Recommended Resources</Text>
                            {HELPFUL_RESOURCES.map((resource, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => openLink(resource.url)}
                                    activeOpacity={0.7}
                                >
                                    <GlassCard variant="light" padding="md" style={styles.resourceCard}>
                                        <Text style={styles.resourceEmoji}>
                                            {resource.type === 'video' ? '🎥' : '📖'}
                                        </Text>
                                        <Text style={styles.resourceTitle}>{resource.title}</Text>
                                        <Text style={styles.resourceLink}>Tap to open →</Text>
                                    </GlassCard>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Cold Turkey Success Tips */}
                        <GlassCard variant="light" padding="lg" style={styles.tipCard}>
                            <Text style={styles.tipEmoji}>💪</Text>
                            <Text style={styles.tipTitle}>Cold Turkey Success Tips</Text>
                            <Text style={styles.tipText}>
                                Days 3-5 are typically the hardest. Your brain is adjusting to lower dopamine.
                                This is temporary! By day 7, cravings drop significantly. By day 14, you'll feel clearer
                                and more energized than you have in years.
                            </Text>
                        </GlassCard>

                        <View style={{ height: 100 }} />
                    </ScrollView>

                    <View style={styles.bottomContainer}>
                        <TouchableOpacity style={styles.closeButton} onPress={dismiss}>
                            <Text style={styles.closeButtonText}>Close Guide</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#F0F9FF', // Light blue background for success guide
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        width: '100%',
        maxHeight: SHEET_HEIGHT,
        overflow: 'hidden',
    },
    handleContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 14,
        backgroundColor: 'transparent',
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 3,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.xl,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginVertical: spacing.xl,
    },
    planEmoji: {
        fontSize: 48,
        marginBottom: spacing.sm,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        marginTop: 4,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.xs,
    },
    sectionSubtitle: {
        fontSize: 13,
        fontWeight: '400',
        color: looviColors.text.secondary,
        marginBottom: spacing.md,
    },
    card: {
        marginBottom: spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    cardEmoji: {
        fontSize: 20,
        marginRight: spacing.sm,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    cardDescription: {
        fontSize: 13,
        fontWeight: '400',
        color: looviColors.text.secondary,
        lineHeight: 18,
    },
    foodList: {
        gap: 4,
    },
    foodItem: {
        fontSize: 13,
        fontWeight: '400',
        color: looviColors.text.secondary,
    },
    resourceCard: {
        marginBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
    },
    resourceEmoji: {
        fontSize: 24,
        marginRight: spacing.md,
    },
    resourceTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.primary,
        flex: 1,
    },
    resourceLink: {
        fontSize: 11,
        fontWeight: '500',
        color: looviColors.accent.primary,
    },
    tipCard: {
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginBottom: spacing.xl,
    },
    tipEmoji: {
        fontSize: 32,
        marginBottom: spacing.sm,
    },
    tipTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.sm,
    },
    tipText: {
        fontSize: 14,
        fontWeight: '400',
        color: looviColors.text.secondary,
        lineHeight: 20,
        textAlign: 'center',
    },
    bottomContainer: {
        padding: spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
        backgroundColor: '#F0F9FF',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
    },
    closeButton: {
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default PlanDetailsModal;
