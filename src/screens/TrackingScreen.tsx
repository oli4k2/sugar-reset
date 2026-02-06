/**
 * TrackingScreen
 * 
 * Redesigned tracking screen focused on food and wellness logging.
 * Features:
 * - Two big action buttons (Food & Feelings)
 * - Food calendar with color-coded days
 * - Selected day's food list + journal entries
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, Feather } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../theme';
import LooviBackground, { looviColors } from '../components/LooviBackground';
import { GlassCard } from '../components/GlassCard';
import { AppIcon } from '../components/OnboardingIcon';
import FoodScannerModal from '../components/FoodScannerModal';
import { FoodCalendar } from '../components/FoodCalendar';
import { FoodLogList } from '../components/FoodLogList';
import { FoodItemModal } from '../components/FoodItemModal';
import SimpleJournalModal from '../components/SimpleJournalModal';
import {
    getScannedItems,
    getFoodCountsByDate,
    getScannedItemsForDate,
    saveScannedItem,
    generateScanId,
    ScannedItem,
} from '../services/scannerService';
import { useUserData, JournalEntry } from '../context/UserDataContext';
import { SwipeableTabView } from '../components/SwipeableTabView';
import { WellnessModal, WellnessLog } from '../components/WellnessModal';

const WELLNESS_LOGS_KEY = 'wellness_logs';

export default function TrackingScreen() {
    const route = useRoute<any>();
    const { journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useUserData();

    // State
    const [showScannerModal, setShowScannerModal] = useState(false);
    const [showWellnessModal, setShowWellnessModal] = useState(false);
    const [showJournalModal, setShowJournalModal] = useState(false);
    const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null);
    const [showFoodItemModal, setShowFoodItemModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ScannedItem | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [foodCounts, setFoodCounts] = useState<Record<string, number>>({});
    const [selectedDayFoods, setSelectedDayFoods] = useState<ScannedItem[]>([]);
    const [selectedDayWellness, setSelectedDayWellness] = useState<any | null>(null);
    const [wellnessDates, setWellnessDates] = useState<string[]>([]);
    const [todayFoods, setTodayFoods] = useState<ScannedItem[]>([]);

    const todayStr = new Date().toISOString().split('T')[0];

    // Calculate today's sugar total
    const todaySugarTotal = todayFoods.reduce((sum, food) => sum + (food.addedSugar || food.sugar || 0), 0);

    // Load food counts for calendar
    const loadFoodCounts = useCallback(async () => {
        const counts = await getFoodCountsByDate();
        setFoodCounts(counts);
    }, []);

    // Load foods for selected date
    const loadSelectedDayFoods = useCallback(async () => {
        const foods = await getScannedItemsForDate(selectedDate);
        setSelectedDayFoods(foods);
    }, [selectedDate]);

    // Load today's foods for badge indicator
    const loadTodayFoods = useCallback(async () => {
        const foods = await getScannedItemsForDate(todayStr);
        setTodayFoods(foods);
    }, [todayStr]);

    // Load wellness for selected date and track all wellness dates
    const loadSelectedDayWellness = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem('wellness_logs');
            if (stored) {
                const logs = JSON.parse(stored);
                const dayLog = logs.find((log: any) => log.date === selectedDate);
                setSelectedDayWellness(dayLog || null);
                // Extract all dates with wellness data
                const dates = logs.map((log: any) => log.date);
                setWellnessDates(dates);
            } else {
                setSelectedDayWellness(null);
                setWellnessDates([]);
            }
        } catch (error) {
            console.error('Error loading wellness:', error);
            setSelectedDayWellness(null);
        }
    }, [selectedDate]);

    useFocusEffect(useCallback(() => {
        loadFoodCounts();
        loadSelectedDayFoods();
        loadSelectedDayWellness();
        loadTodayFoods();
    }, [loadFoodCounts, loadSelectedDayFoods, loadSelectedDayWellness, loadTodayFoods]));

    useEffect(() => {
        loadSelectedDayFoods();
        loadSelectedDayWellness();
    }, [selectedDate, loadSelectedDayFoods, loadSelectedDayWellness]);

    // Reload wellness when modal closes
    useEffect(() => {
        if (!showWellnessModal) {
            loadSelectedDayWellness();
        }
    }, [showWellnessModal, loadSelectedDayWellness]);

    // Get journal entries for selected date
    const selectedDayJournals = journalEntries.filter(
        entry => entry.date.split('T')[0] === selectedDate
    );

    const handleScanComplete = () => {
        loadFoodCounts();
        loadSelectedDayFoods();
    };

    const handleDateSelect = (date: string) => {
        setSelectedDate(date);
    };

    const handleFoodItemPress = (item: ScannedItem) => {
        setSelectedItem(item);
        setShowFoodItemModal(true);
    };

    const handleFoodItemUpdate = () => {
        loadFoodCounts();
        loadSelectedDayFoods();
    };

    const handleWellnessSave = async (log: WellnessLog) => {
        try {
            const stored = await AsyncStorage.getItem(WELLNESS_LOGS_KEY);
            const logs: WellnessLog[] = stored ? JSON.parse(stored) : [];
            const existingIndex = logs.findIndex(l => l.date === log.date);

            if (existingIndex >= 0) {
                logs[existingIndex] = log;
            } else {
                logs.unshift(log);
            }

            await AsyncStorage.setItem(WELLNESS_LOGS_KEY, JSON.stringify(logs));
            // Refresh the displayed wellness data
            loadSelectedDayWellness();
            Alert.alert('Saved!', 'Your wellness log has been saved.');
        } catch (error) {
            Alert.alert('Error', 'Failed to save wellness log.');
        }
    };

    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    const selectedDateFormatted = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
    });

    return (
        <SwipeableTabView currentTab="Track">
            <LooviBackground variant="coralTop">
                <SafeAreaView style={styles.container}>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Track</Text>
                            <Text style={styles.subtitle}>Log your food & feelings</Text>
                        </View>

                        {/* Two Big Action Buttons - ALWAYS reference TODAY */}
                        {/* Two Big Action Buttons - MATCHING ANALYTICS STYLE */}
                        <View style={styles.quickActionsRow}>
                            <TouchableOpacity
                                style={[styles.quickActionButton, styles.quickActionPrimary]}
                                onPress={() => {
                                    handleDateSelect(todayStr);
                                    setShowScannerModal(true);
                                }}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="scan" size={22} color="#FFFFFF" />
                                <Text style={styles.quickActionPrimaryText}>Log Food</Text>
                                {todayFoods.length > 0 && (
                                    <View style={styles.buttonBadge}>
                                        <Text style={styles.buttonBadgeText}>{todayFoods.length}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.quickActionButton, styles.quickActionSecondary]}
                                onPress={() => {
                                    handleDateSelect(todayStr);
                                    setShowWellnessModal(true);
                                }}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="heart" size={22} color={looviColors.coralOrange} />
                                <Text style={styles.quickActionSecondaryText}>Wellness</Text>
                                {wellnessDates.includes(todayStr) && (
                                    <View style={[styles.buttonBadge, { backgroundColor: looviColors.accent.success }]}>
                                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Food Calendar with Wellness Indicators */}
                        <GlassCard variant="light" padding="md" style={styles.calendarCard}>
                            <FoodCalendar
                                foodCounts={foodCounts}
                                wellnessDates={wellnessDates}
                                selectedDate={selectedDate}
                                onSelectDate={handleDateSelect}
                            />
                        </GlassCard>

                        {/* Selected Day's Content */}
                        <View style={styles.selectedDayHeader}>
                            <Text style={styles.selectedDayTitle}>
                                {isToday ? 'Today' : selectedDateFormatted}
                            </Text>
                        </View>

                        {/* Wellness Status - Shows data if exists, or Add button if missing */}
                        <GlassCard variant="light" padding="md" style={styles.wellnessCard}>
                            <View style={styles.wellnessHeader}>
                                <Ionicons name="heart" size={18} color={looviColors.accent.primary} />
                                <Text style={styles.wellnessTitle}>Wellness</Text>
                                {selectedDayWellness && (
                                    <TouchableOpacity
                                        style={styles.wellnessEditButton}
                                        onPress={() => setShowWellnessModal(true)}
                                    >
                                        <Text style={styles.wellnessEditText}>Edit</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            {selectedDayWellness ? (
                                <View style={styles.wellnessMetrics}>
                                    <View style={styles.wellnessMetric}>
                                        <View style={[styles.wellnessIconBg, { backgroundColor: `${looviColors.accent.primary}15` }]}>
                                            <Ionicons name="happy-outline" size={18} color={looviColors.accent.primary} />
                                        </View>
                                        <Text style={styles.wellnessLabel}>Mood</Text>
                                        <Text style={styles.wellnessValue}>{selectedDayWellness.mood}/5</Text>
                                    </View>
                                    <View style={styles.wellnessMetric}>
                                        <View style={[styles.wellnessIconBg, { backgroundColor: `${looviColors.accent.warning}15` }]}>
                                            <Ionicons name="flash-outline" size={18} color={looviColors.accent.warning} />
                                        </View>
                                        <Text style={styles.wellnessLabel}>Energy</Text>
                                        <Text style={styles.wellnessValue}>{selectedDayWellness.energy}/5</Text>
                                    </View>
                                    <View style={styles.wellnessMetric}>
                                        <View style={[styles.wellnessIconBg, { backgroundColor: `${looviColors.skyBlue}15` }]}>
                                            <Ionicons name="bulb-outline" size={18} color={looviColors.skyBlue} />
                                        </View>
                                        <Text style={styles.wellnessLabel}>Focus</Text>
                                        <Text style={styles.wellnessValue}>{selectedDayWellness.focus}/5</Text>
                                    </View>
                                    <View style={styles.wellnessMetric}>
                                        <View style={[styles.wellnessIconBg, { backgroundColor: `${looviColors.accent.success}15` }]}>
                                            <Ionicons name="bed-outline" size={18} color={looviColors.accent.success} />
                                        </View>
                                        <Text style={styles.wellnessLabel}>Sleep</Text>
                                        <Text style={styles.wellnessValue}>{selectedDayWellness.sleepHours}h</Text>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.addWellnessButton}
                                    onPress={() => setShowWellnessModal(true)}
                                >
                                    <Ionicons name="add-circle-outline" size={20} color={looviColors.accent.primary} />
                                    <Text style={styles.addWellnessText}>
                                        Add wellness data for {isToday ? 'today' : 'this day'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </GlassCard>

                        {/* Food List */}
                        <GlassCard variant="light" padding="md" style={styles.listCard}>
                            <View style={styles.listHeader}>
                                <View style={styles.listTitleContainer}>
                                    <Ionicons name="restaurant" size={18} color={looviColors.accent.primary} />
                                    <Text style={styles.listTitle}>Food Log</Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowScannerModal(true)}>
                                    <Text style={styles.addButton}>+ Add</Text>
                                </TouchableOpacity>
                            </View>
                            <FoodLogList
                                items={selectedDayFoods}
                                onItemPress={handleFoodItemPress}
                                emptyMessage={isToday ? "No food logged yet today" : "No food logged this day"}
                            />
                        </GlassCard>

                        {/* Journal Entries */}
                        <GlassCard variant="light" padding="md" style={styles.listCard}>
                            <View style={styles.listHeader}>
                                <View style={styles.listTitleContainer}>
                                    <Ionicons name="book" size={18} color={looviColors.accent.primary} />
                                    <Text style={styles.listTitle}>Journal</Text>
                                </View>
                                {isToday && (
                                    <TouchableOpacity onPress={() => {
                                        setEditingJournal(null);
                                        setShowJournalModal(true);
                                    }}>
                                        <Text style={styles.addButton}>+ Add</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            {selectedDayJournals.length > 0 ? (
                                <View style={styles.journalList}>
                                    {selectedDayJournals.map((entry, index) => (
                                        <View key={entry.id || index} style={styles.journalEntry}>
                                            <View style={styles.journalIconContainer}>
                                                <Ionicons name="document-text" size={18} color={looviColors.accent.primary} />
                                            </View>
                                            <View style={styles.journalContent}>
                                                <Text style={styles.journalNote} numberOfLines={2}>
                                                    {entry.notes || 'No notes'}
                                                </Text>
                                                <Text style={styles.journalTime}>
                                                    {new Date(entry.createdAt).toLocaleTimeString('en-US', {
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                    })}
                                                </Text>
                                            </View>
                                            <View style={styles.journalActions}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setEditingJournal(entry);
                                                        setShowJournalModal(true);
                                                    }}
                                                    style={styles.journalActionButton}
                                                >
                                                    <Ionicons name="pencil" size={16} color={looviColors.accent.primary} />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        Alert.alert(
                                                            'Delete Entry',
                                                            'Are you sure you want to delete this journal entry?',
                                                            [
                                                                { text: 'Cancel', style: 'cancel' },
                                                                {
                                                                    text: 'Delete',
                                                                    style: 'destructive',
                                                                    onPress: () => deleteJournalEntry(entry.id)
                                                                }
                                                            ]
                                                        );
                                                    }}
                                                    style={styles.journalActionButton}
                                                >
                                                    <Ionicons name="trash" size={16} color="#EF4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.emptyJournal}>
                                    <View style={styles.emptyIconContainer}>
                                        <Feather name="edit-3" size={28} color={looviColors.accent.primary} />
                                    </View>
                                    <Text style={styles.emptyText}>
                                        {isToday ? "How are you feeling today?" : "No journal entries this day"}
                                    </Text>
                                </View>
                            )}
                        </GlassCard>
                    </ScrollView>

                    {/* Modals */}
                    <FoodScannerModal
                        visible={showScannerModal}
                        onClose={() => setShowScannerModal(false)}
                        onScanComplete={handleScanComplete}
                        selectedDate={selectedDate}
                    />

                    <WellnessModal
                        visible={showWellnessModal}
                        onClose={() => setShowWellnessModal(false)}
                        onSave={handleWellnessSave}
                        selectedDate={selectedDate}
                        existingData={selectedDayWellness}
                    />

                    <SimpleJournalModal
                        visible={showJournalModal}
                        onClose={() => {
                            setShowJournalModal(false);
                            setEditingJournal(null);
                        }}
                        existingEntry={editingJournal}
                        date={new Date(selectedDate + 'T12:00:00')}
                        onSave={async (notes: string) => {
                            if (editingJournal) {
                                // Update existing entry
                                updateJournalEntry(editingJournal.id, { notes });
                            } else {
                                // Create new entry
                                addJournalEntry(new Date(selectedDate + 'T12:00:00'), { notes });
                            }
                        }}
                    />

                    <FoodItemModal
                        visible={showFoodItemModal}
                        item={selectedItem}
                        onClose={() => setShowFoodItemModal(false)}
                        onUpdate={handleFoodItemUpdate}
                    />
                </SafeAreaView>
            </LooviBackground>
        </SwipeableTabView>
    );
}

// Main Styles
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
    buttonBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        minWidth: 22,
        height: 22,
        paddingHorizontal: 6,
        borderRadius: 11,
        backgroundColor: looviColors.accent.warning,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        zIndex: 10,
    },
    buttonBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    calendarCard: {
        marginBottom: spacing.lg,
    },
    selectedDayHeader: {
        marginBottom: spacing.md,
    },
    selectedDayTitle: {
        fontFamily: typography.fonts.heading.semibold,
        fontSize: 18,
        color: looviColors.text.primary,
    },
    listCard: {
        marginBottom: spacing.lg,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    listTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    listTitle: {
        fontFamily: typography.fonts.heading.semibold,
        fontSize: 16,
        color: looviColors.text.primary,
    },
    addButton: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.accent.primary,
    },
    journalList: {
        gap: spacing.sm,
    },
    journalEntry: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    journalIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: `${looviColors.accent.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    journalContent: {
        flex: 1,
    },
    journalActions: {
        flexDirection: 'row',
        gap: spacing.xs,
        marginLeft: spacing.sm,
    },
    journalActionButton: {
        padding: spacing.xs,
    },
    journalNote: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.text.primary,
        lineHeight: 20,
    },
    journalTime: {
        fontSize: 11,
        fontWeight: '400',
        color: looviColors.text.muted,
        marginTop: 4,
    },
    emptyJournal: {
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    emptyIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: `${looviColors.accent.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        textAlign: 'center',
    },
    wellnessCard: {
        marginBottom: spacing.md,
    },
    wellnessHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.md,
    },
    wellnessTitle: {
        fontFamily: typography.fonts.heading.semibold,
        fontSize: 16,
        color: looviColors.text.primary,
    },
    wellnessMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: spacing.sm,
    },
    wellnessMetric: {
        alignItems: 'center',
        flex: 1,
    },
    wellnessIconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
    },
    wellnessLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        marginBottom: 2,
    },
    wellnessValue: {
        fontSize: 15,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    wellnessEditButton: {
        marginLeft: 'auto',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
    },
    wellnessEditText: {
        fontSize: 13,
        fontWeight: '600',
        color: looviColors.accent.primary,
    },
    addWellnessButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: `${looviColors.accent.primary}10`,
        borderWidth: 1,
        borderColor: `${looviColors.accent.primary}30`,
        borderStyle: 'dashed',
    },
    addWellnessText: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.accent.primary,
    },
    // Updated Quick Actions Styles (Matching AnalyticsScreen)
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
        paddingVertical: 16,
        borderRadius: borderRadius.xl,
        gap: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
        position: 'relative', // For badges
    },
    quickActionPrimary: {
        backgroundColor: looviColors.accent.primary,
    },
    quickActionSecondary: {
        backgroundColor: `${looviColors.coralOrange}15`, // Almost transparent orange
    },
    quickActionPrimaryText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    quickActionSecondaryText: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.coralOrange,
    },
});
