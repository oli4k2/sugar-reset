/**
 * PlanPhasesPreviewModal – DEV-only swipeable preview of all sugar reset plan phases.
 *
 * Shows the 4 phases from PlanProgressBar (Phase 1: Detox, Phase 2: Adaptation, 
 * Phase 3: Momentum, Phase 4: Mastery) with progress visualisation.
 */

import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    FlatList,
    Dimensions,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { looviColors } from './LooviBackground';
import { spacing } from '../theme';
import { GlassCard } from './GlassCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PlanPhasesPreviewModalProps {
    visible: boolean;
    onClose: () => void;
}

// Phase definitions matching PlanProgressBar - More granular phases, especially early on
const PHASES = [
    {
        minPercent: 0,
        maxPercent: 5,
        name: 'Phase 1: Starting Out',
        feeling: 'taking your first steps',
        endFeeling: 'you\'ve begun your journey',
    },
    {
        minPercent: 5,
        maxPercent: 10,
        name: 'Phase 2: First Steps',
        feeling: 'building your foundation',
        endFeeling: 'establishing new routines',
    },
    {
        minPercent: 10,
        maxPercent: 15,
        name: 'Phase 3: Building Foundation',
        feeling: 'creating healthy habits',
        endFeeling: 'patterns are forming',
    },
    {
        minPercent: 15,
        maxPercent: 20,
        name: 'Phase 4: Early Progress',
        feeling: 'seeing initial results',
        endFeeling: 'momentum is building',
    },
    {
        minPercent: 20,
        maxPercent: 25,
        name: 'Phase 5: Gaining Momentum',
        feeling: 'feeling more in control',
        endFeeling: 'habits are strengthening',
    },
    {
        minPercent: 25,
        maxPercent: 35,
        name: 'Phase 6: Detox',
        feeling: 'experiencing cravings and adjustment',
        endFeeling: 'cravings will start to decrease',
    },
    {
        minPercent: 35,
        maxPercent: 50,
        name: 'Phase 7: Adaptation',
        feeling: 'adapting to lower sugar intake',
        endFeeling: 'energy levels will stabilize',
    },
    {
        minPercent: 50,
        maxPercent: 65,
        name: 'Phase 8: Momentum',
        feeling: 'building healthy habits',
        endFeeling: 'taste preferences will change',
    },
    {
        minPercent: 65,
        maxPercent: 80,
        name: 'Phase 9: Strengthening',
        feeling: 'habits becoming second nature',
        endFeeling: 'confidence is growing',
    },
    {
        minPercent: 80,
        maxPercent: 100,
        name: 'Phase 10: Mastery',
        feeling: 'mastering your sugar-free lifestyle',
        endFeeling: 'feel in complete control',
    },
];

export function PlanPhasesPreviewModal({ visible, onClose }: PlanPhasesPreviewModalProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const renderPhasePage = ({ item, index }: { item: typeof PHASES[0]; index: number }) => {
        const progress = Math.round(((index + 1) / PHASES.length) * 100);

        return (
            <View style={[styles.page, { width: SCREEN_WIDTH }]}>
                <View style={styles.phaseCard}>
                    {/* Phase number badge */}
                    <View style={styles.phaseBadge}>
                        <Text style={styles.phaseBadgeText}>{item.name}</Text>
                    </View>

                    {/* Progress bar */}
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${item.maxPercent}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{item.maxPercent}% of plan</Text>

                    {/* Description */}
                    <Text style={styles.phaseDescription}>
                        {item.feeling.charAt(0).toUpperCase() + item.feeling.slice(1)} → {item.endFeeling}
                    </Text>

                    {/* Progress range */}
                    <Text style={styles.progressRange}>
                        {item.minPercent}% - {item.maxPercent}% progress
                    </Text>
                </View>
            </View>
        );
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index ?? 0);
        }
    }).current;

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const goToPage = (index: number) => {
        flatListRef.current?.scrollToIndex({ index, animated: true });
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Habit Formation Phases</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Feather name="x" size={22} color={looviColors.text.secondary} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.subtitle}>
                    Swipe to browse all {PHASES.length} phases
                </Text>

                {/* Swipeable pages */}
                <FlatList
                    ref={flatListRef}
                    data={PHASES}
                    renderItem={renderPhasePage}
                    keyExtractor={(item, index) => `phase_${index}`}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    getItemLayout={(_, index) => ({
                        length: SCREEN_WIDTH,
                        offset: SCREEN_WIDTH * index,
                        index,
                    })}
                    style={styles.flatList}
                />

                {/* Dot indicators */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dotsContainer}
                >
                    {PHASES.map((_, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => goToPage(index)}
                            style={[
                                styles.dot,
                                index === activeIndex && styles.dotActive,
                            ]}
                        />
                    ))}
                </ScrollView>

                {/* Navigation arrows */}
                <View style={styles.navRow}>
                    <TouchableOpacity
                        style={[styles.navButton, activeIndex === 0 && styles.navButtonDisabled]}
                        onPress={() => activeIndex > 0 && goToPage(activeIndex - 1)}
                        disabled={activeIndex === 0}
                    >
                        <Feather name="chevron-left" size={24} color={activeIndex === 0 ? '#CCC' : looviColors.text.primary} />
                        <Text style={[styles.navText, activeIndex === 0 && styles.navTextDisabled]}>Previous</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.navButton, activeIndex === PHASES.length - 1 && styles.navButtonDisabled]}
                        onPress={() => activeIndex < PHASES.length - 1 && goToPage(activeIndex + 1)}
                        disabled={activeIndex === PHASES.length - 1}
                    >
                        <Text style={[styles.navText, activeIndex === PHASES.length - 1 && styles.navTextDisabled]}>Next</Text>
                        <Feather name="chevron-right" size={24} color={activeIndex === PHASES.length - 1 ? '#CCC' : looviColors.text.primary} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FEFAF6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.xs,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    closeButton: {
        padding: 8,
    },
    subtitle: {
        fontSize: 13,
        color: looviColors.text.tertiary,
        textAlign: 'center',
        marginBottom: spacing.md,
        marginTop: spacing.xs,
    },
    flatList: {
        flex: 1,
    },
    page: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
        paddingBottom: 20,
    },
    phaseCard: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 20,
        padding: spacing.xl,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    phaseBadge: {
        backgroundColor: looviColors.coralOrange,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: spacing.lg,
    },
    phaseBadgeText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    progressTrack: {
        width: '100%',
        height: 10,
        backgroundColor: 'rgba(0,0,0,0.08)',
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressFill: {
        height: '100%',
        backgroundColor: looviColors.coralOrange,
        borderRadius: 5,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '600',
        color: looviColors.accent.primary,
        marginBottom: spacing.lg,
    },
    phaseDescription: {
        fontSize: 16,
        fontWeight: '500',
        color: looviColors.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: spacing.md,
        marginTop: spacing.lg,
    },
    progressRange: {
        fontSize: 13,
        fontWeight: '500',
        color: looviColors.text.muted,
        marginTop: spacing.sm,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D9D9D9',
    },
    dotActive: {
        width: 20,
        height: 8,
        borderRadius: 4,
        backgroundColor: looviColors.coralOrange,
    },
    navRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xl,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    navButtonDisabled: {
        opacity: 0.4,
    },
    navText: {
        fontSize: 15,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    navTextDisabled: {
        color: '#CCC',
    },
});

