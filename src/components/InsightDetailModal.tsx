/**
 * InsightDetailModal
 * 
 * Modal that shows detailed, actionable content for each insight type.
 * Includes tips, suggestions, and specific recommendations.
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Linking,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';

export type InsightType =
    | 'energy'
    | 'sleep'
    | 'hydration'
    | 'mood'
    | 'protein'
    | 'sugar_high'
    | 'sugar_low'
    | 'correlation'
    | 'streak'
    | 'fiber'
    | 'breakfast'
    | 'snacking'
    | 'consistency'
    | 'celebration';

interface InsightContent {
    title: string;
    subtitle: string;
    icon: string;
    iconColor: string;
    tips: { icon: string; title: string; description: string }[];
    quickActions?: { label: string; action: () => void }[];
}

const INSIGHT_CONTENT: Record<InsightType, InsightContent> = {
    energy: {
        title: 'Boost Your Energy',
        subtitle: 'Simple ways to feel more energized throughout the day',
        icon: 'flash',
        iconColor: '#F59E0B',
        tips: [
            {
                icon: 'nutrition-outline',
                title: 'Eat protein with every meal',
                description: 'Eggs, Greek yogurt, lean meats, or legumes provide steady energy without the crash.',
            },
            {
                icon: 'water-outline',
                title: 'Stay hydrated',
                description: 'Even mild dehydration can cause fatigue. Aim for 8 glasses of water daily.',
            },
            {
                icon: 'walk-outline',
                title: 'Take a 10-minute walk',
                description: 'Light movement boosts blood flow and can increase energy for up to 2 hours.',
            },
            {
                icon: 'sunny-outline',
                title: 'Get natural light',
                description: 'Morning sunlight helps regulate your circadian rhythm and improves alertness.',
            },
            {
                icon: 'cafe-outline',
                title: 'Time your caffeine',
                description: 'Best consumed 90 minutes after waking. Avoid after 2pm for better sleep.',
            },
        ],
    },
    sleep: {
        title: 'Improve Your Sleep',
        subtitle: 'Better rest tonight means more willpower tomorrow',
        icon: 'moon',
        iconColor: '#8B5CF6',
        tips: [
            {
                icon: 'time-outline',
                title: 'Set a consistent bedtime',
                description: 'Going to bed at the same time trains your body to feel sleepy on schedule.',
            },
            {
                icon: 'phone-portrait-outline',
                title: 'No screens 1 hour before bed',
                description: 'Blue light suppresses melatonin. Try reading or gentle stretching instead.',
            },
            {
                icon: 'thermometer-outline',
                title: 'Keep your room cool',
                description: 'The ideal sleeping temperature is 65-68°F (18-20°C).',
            },
            {
                icon: 'cafe-outline',
                title: 'Limit caffeine after noon',
                description: 'Caffeine has a half-life of 5-6 hours and can affect sleep quality.',
            },
            {
                icon: 'leaf-outline',
                title: 'Try a calming ritual',
                description: 'Herbal tea, deep breathing, or journaling can signal your body it\'s time to rest.',
            },
        ],
    },
    hydration: {
        title: 'Reset & Stabilize',
        subtitle: 'Quick ways to bounce back after sugar',
        icon: 'water',
        iconColor: '#3B82F6',
        tips: [
            {
                icon: 'water-outline',
                title: 'Drink a large glass of water',
                description: 'Water helps your body process sugar and reduces that sluggish feeling.',
            },
            {
                icon: 'walk-outline',
                title: 'Take a 15-minute walk',
                description: 'Light movement helps your body use up the glucose and stabilize levels.',
            },
            {
                icon: 'nutrition-outline',
                title: 'Eat protein or healthy fat',
                description: 'A handful of nuts or cheese can help balance your blood sugar.',
            },
            {
                icon: 'timer-outline',
                title: 'Wait before eating more',
                description: 'Give your body 2-3 hours to stabilize before your next meal.',
            },
            {
                icon: 'heart-outline',
                title: 'Don\'t beat yourself up',
                description: 'One moment doesn\'t define your journey. Focus on your next healthy choice.',
            },
        ],
    },
    mood: {
        title: 'Mood Boosters',
        subtitle: 'Simple activities that can lift your spirits',
        icon: 'heart',
        iconColor: '#EC4899',
        tips: [
            {
                icon: 'musical-notes-outline',
                title: 'Listen to uplifting music',
                description: 'Music can shift your mood in minutes. Create a feel-good playlist.',
            },
            {
                icon: 'people-outline',
                title: 'Connect with someone',
                description: 'A quick call or text to a friend can provide a meaningful boost.',
            },
            {
                icon: 'sunny-outline',
                title: 'Get outside',
                description: '20 minutes of nature time is proven to reduce stress hormones.',
            },
            {
                icon: 'fitness-outline',
                title: 'Move your body',
                description: 'Even gentle stretching releases endorphins and improves mood.',
            },
            {
                icon: 'journal-outline',
                title: 'Write 3 things you\'re grateful for',
                description: 'Gratitude journaling rewires your brain for positivity over time.',
            },
            {
                icon: 'paw-outline',
                title: 'Spend time with pets',
                description: 'Interacting with animals reduces cortisol and increases oxytocin.',
            },
        ],
    },
    protein: {
        title: 'High-Protein Ideas',
        subtitle: 'Satisfying foods that keep you full longer',
        icon: 'fitness',
        iconColor: '#3B82F6',
        tips: [
            {
                icon: 'egg-outline',
                title: 'Eggs (6g protein each)',
                description: 'Versatile and quick. Try scrambled, boiled, or in an omelet with veggies.',
            },
            {
                icon: 'nutrition-outline',
                title: 'Greek yogurt (17g per cup)',
                description: 'Add berries and a sprinkle of nuts for a satisfying snack.',
            },
            {
                icon: 'fish-outline',
                title: 'Salmon or chicken (25-30g per serving)',
                description: 'Prep on Sunday for easy weekday meals.',
            },
            {
                icon: 'leaf-outline',
                title: 'Lentils & beans (15g per cup)',
                description: 'Great for soups, salads, or as a side dish. Budget-friendly too!',
            },
            {
                icon: 'pizza-outline',
                title: 'Cottage cheese (14g per half cup)',
                description: 'Pair with fruit for breakfast or add to smoothies.',
            },
            {
                icon: 'nutrition-outline',
                title: 'Almonds (6g per handful)',
                description: 'Keep a small container at your desk for afternoon hunger.',
            },
        ],
    },
    sugar_high: {
        title: 'Reduce Sugar Cravings',
        subtitle: 'Strategies to manage and reduce sweet cravings',
        icon: 'trending-down',
        iconColor: '#EF4444',
        tips: [
            {
                icon: 'nutrition-outline',
                title: 'Eat regular, balanced meals',
                description: 'Skipping meals leads to blood sugar drops that trigger cravings.',
            },
            {
                icon: 'water-outline',
                title: 'Drink water first',
                description: 'Thirst is often mistaken for hunger or cravings. Hydrate and wait 10 minutes.',
            },
            {
                icon: 'timer-outline',
                title: 'Wait 15 minutes',
                description: 'Most cravings pass within 15-20 minutes. Distract yourself with an activity.',
            },
            {
                icon: 'nutrition-outline',
                title: 'Choose fruit instead',
                description: 'Natural sugars with fiber are processed more slowly by your body.',
            },
            {
                icon: 'bed-outline',
                title: 'Prioritize sleep',
                description: 'Sleep deprivation increases hunger hormones and sugar cravings.',
            },
        ],
    },
    sugar_low: {
        title: 'You\'re Crushing It! 🎉',
        subtitle: 'Tips to keep your momentum going',
        icon: 'checkmark-circle',
        iconColor: '#22C55E',
        tips: [
            {
                icon: 'trophy-outline',
                title: 'Celebrate your wins',
                description: 'You\'re doing amazing! Acknowledge how far you\'ve come.',
            },
            {
                icon: 'bookmark-outline',
                title: 'Notice how you feel',
                description: 'Pay attention to your energy, mood, and sleep. These are your rewards!',
            },
            {
                icon: 'people-outline',
                title: 'Share your success',
                description: 'Inspire others in the community or tell a friend about your progress.',
            },
            {
                icon: 'flag-outline',
                title: 'Set a new goal',
                description: 'Now that you\'ve mastered sugar, what\'s next? More protein? Better sleep?',
            },
        ],
    },
    correlation: {
        title: 'Food-Mood Connection',
        subtitle: 'How what you eat affects how you feel',
        icon: 'git-compare',
        iconColor: '#EC4899',
        tips: [
            {
                icon: 'analytics-outline',
                title: 'Track patterns',
                description: 'Notice how you feel 2-3 hours after different meals. Sugar often leads to crashes.',
            },
            {
                icon: 'nutrition-outline',
                title: 'Balance your plate',
                description: 'Protein + fiber + healthy fat = stable energy and steady mood.',
            },
            {
                icon: 'flask-outline',
                title: 'Blood sugar matters',
                description: 'Spikes and crashes affect your brain. Steady glucose = steady mood.',
            },
            {
                icon: 'leaf-outline',
                title: 'Gut-brain connection',
                description: 'Your gut produces 90% of serotonin. Healthy eating = happier brain.',
            },
        ],
    },
    streak: {
        title: 'Keep Your Streak Alive! 🔥',
        subtitle: 'You\'re building powerful habits',
        icon: 'flame',
        iconColor: '#F59E0B',
        tips: [
            {
                icon: 'time-outline',
                title: 'Same time, same place',
                description: 'Log at consistent times to make it automatic.',
            },
            {
                icon: 'notifications-outline',
                title: 'Set reminders',
                description: 'Don\'t rely on memory. Let your phone help you stay consistent.',
            },
            {
                icon: 'trophy-outline',
                title: 'Celebrate milestones',
                description: '7 days, 14 days, 30 days - each one is an achievement!',
            },
            {
                icon: 'people-outline',
                title: 'Find accountability',
                description: 'Share your streak with friends or the community.',
            },
        ],
    },
    fiber: {
        title: 'Fiber-Rich Foods',
        subtitle: 'Keep you full and support gut health',
        icon: 'leaf',
        iconColor: '#22C55E',
        tips: [
            {
                icon: 'nutrition-outline',
                title: 'Vegetables (3-5g per serving)',
                description: 'Broccoli, carrots, Brussels sprouts are fiber superstars.',
            },
            {
                icon: 'nutrition-outline',
                title: 'Berries (4g per cup)',
                description: 'Raspberries and blackberries have the most fiber of any fruit.',
            },
            {
                icon: 'nutrition-outline',
                title: 'Oatmeal (4g per cup)',
                description: 'A warm, filling breakfast that keeps you satisfied for hours.',
            },
            {
                icon: 'nutrition-outline',
                title: 'Chia seeds (10g per ounce)',
                description: 'Add to yogurt, smoothies, or make chia pudding.',
            },
            {
                icon: 'nutrition-outline',
                title: 'Avocado (10g per fruit)',
                description: 'Healthy fats plus fiber. Great on toast or in salads.',
            },
        ],
    },
    breakfast: {
        title: 'Start Your Day Right',
        subtitle: 'Breakfast ideas that set you up for success',
        icon: 'sunny',
        iconColor: '#F5B461',
        tips: [
            {
                icon: 'egg-outline',
                title: 'Eggs + avocado toast',
                description: 'Protein + healthy fat + fiber = stable energy all morning.',
            },
            {
                icon: 'nutrition-outline',
                title: 'Greek yogurt parfait',
                description: 'Layer with berries, nuts, and a drizzle of honey.',
            },
            {
                icon: 'nutrition-outline',
                title: 'Protein smoothie',
                description: 'Blend protein powder, banana, spinach, and almond milk.',
            },
            {
                icon: 'nutrition-outline',
                title: 'Overnight oats',
                description: 'Prep the night before with chia seeds and nut butter.',
            },
        ],
    },
    snacking: {
        title: 'Smart Snacking',
        subtitle: 'Satisfy cravings without the sugar crash',
        icon: 'nutrition',
        iconColor: '#22C55E',
        tips: [
            {
                icon: 'nutrition-outline',
                title: 'Apple + almond butter',
                description: 'Sweet, crunchy, and satisfying. Perfect afternoon snack.',
            },
            {
                icon: 'nutrition-outline',
                title: 'Cheese + crackers',
                description: 'Choose whole grain crackers for added fiber.',
            },
            {
                icon: 'nutrition-outline',
                title: 'Hummus + veggies',
                description: 'Carrots, cucumbers, and bell peppers are great dippers.',
            },
            {
                icon: 'nutrition-outline',
                title: 'Hard-boiled eggs',
                description: 'Prep a batch on Sunday for grab-and-go protein.',
            },
            {
                icon: 'nutrition-outline',
                title: 'Trail mix (homemade)',
                description: 'Nuts, seeds, and a few dark chocolate chips.',
            },
        ],
    },
    consistency: {
        title: 'Build Consistency',
        subtitle: 'Small habits lead to big changes',
        icon: 'calendar',
        iconColor: '#8B5CF6',
        tips: [
            {
                icon: 'alarm-outline',
                title: 'Start with one habit',
                description: 'Master one thing before adding more. Progress over perfection.',
            },
            {
                icon: 'link-outline',
                title: 'Stack your habits',
                description: 'Attach new habits to existing ones. "After I brush my teeth, I\'ll..."',
            },
            {
                icon: 'trending-up-outline',
                title: 'Track your progress',
                description: 'What gets measured gets managed. Log daily in this app!',
            },
            {
                icon: 'refresh-outline',
                title: 'Don\'t break the chain',
                description: 'Focus on not missing two days in a row. One slip is okay!',
            },
        ],
    },
    celebration: {
        title: 'Celebrate Your Progress! 🎉',
        subtitle: 'You\'re doing incredible work',
        icon: 'star',
        iconColor: '#F59E0B',
        tips: [
            {
                icon: 'trophy-outline',
                title: 'You\'ve earned this',
                description: 'Your dedication is paying off. Be proud of yourself!',
            },
            {
                icon: 'heart-outline',
                title: 'Non-food rewards',
                description: 'Treat yourself to a massage, new book, or relaxing activity.',
            },
            {
                icon: 'share-outline',
                title: 'Share your success',
                description: 'Post in the community to inspire others on their journey.',
            },
            {
                icon: 'flag-outline',
                title: 'Set your next goal',
                description: 'What will you accomplish next? The sky\'s the limit!',
            },
        ],
    },
};

interface InsightDetailModalProps {
    visible: boolean;
    insightType: InsightType | null;
    onClose: () => void;
    onAction?: (actionType: string) => void;
}

export const InsightDetailModal: React.FC<InsightDetailModalProps> = ({
    visible,
    insightType,
    onClose,
    onAction,
}) => {
    if (!insightType) return null;

    const content = INSIGHT_CONTENT[insightType];
    if (!content) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={[styles.iconCircle, { backgroundColor: `${content.iconColor}20` }]}>
                            <Ionicons name={content.icon as any} size={28} color={content.iconColor} />
                        </View>
                        <View style={styles.headerText}>
                            <Text style={styles.title}>{content.title}</Text>
                            <Text style={styles.subtitle}>{content.subtitle}</Text>
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Feather name="x" size={22} color={looviColors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Tips List - wrapped in flex container */}
                    <View style={styles.scrollContainer}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                        >
                            {content.tips.map((tip, index) => (
                                <View key={index} style={styles.tipCard}>
                                    <View style={[styles.tipIcon, { backgroundColor: `${content.iconColor}15` }]}>
                                        <Ionicons name={tip.icon as any} size={20} color={content.iconColor} />
                                    </View>
                                    <View style={styles.tipContent}>
                                        <Text style={styles.tipTitle}>{tip.title}</Text>
                                        <Text style={styles.tipDescription}>{tip.description}</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Close Button */}
                    <TouchableOpacity style={styles.doneButton} onPress={onClose}>
                        <Text style={styles.doneButtonText}>Got it!</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: 400,
        maxHeight: '85%',
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: looviColors.text.secondary,
        lineHeight: 20,
    },
    closeButton: {
        padding: spacing.xs,
        marginLeft: spacing.sm,
    },
    scrollContainer: {
        flex: 1,
        minHeight: 200,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    tipIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    tipContent: {
        flex: 1,
    },
    tipTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: looviColors.text.primary,
        marginBottom: 4,
    },
    tipDescription: {
        fontSize: 13,
        color: looviColors.text.secondary,
        lineHeight: 18,
    },
    doneButton: {
        marginHorizontal: spacing.lg,
        backgroundColor: looviColors.accent.primary,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    doneButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default InsightDetailModal;
