/**
 * PhasePreviewModal – DEV-only swipeable preview of all 10 phase animations.
 *
 * Each "page" is one phase shown at full size with its day-range label.
 * Swipe left/right or tap the dots to navigate between phases.
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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { looviColors } from './LooviBackground';
import { spacing } from '../theme';
import { PhaseAnimation } from './PhaseAnimation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PHASES = [
    { day: 0, label: 'Phase 0 – Seed', range: 'Day 0' },
    { day: 1, label: 'Phase 1 – Sprout', range: 'Day 1' },
    { day: 2, label: 'Phase 2 – Growing', range: 'Day 2' },
    { day: 3, label: 'Phase 3 – Expanding', range: 'Day 3–4' },
    { day: 5, label: 'Phase 4 – Blooming', range: 'Day 5–6' },
    { day: 7, label: 'Phase 5 – Radiant', range: 'Day 7–9' },
    { day: 10, label: 'Phase 6 – Flourishing', range: 'Day 10–13' },
    { day: 14, label: 'Phase 7 – Vibrant', range: 'Day 14–20' },
    { day: 21, label: 'Phase 8 – Majestic', range: 'Day 21–29' },
    { day: 30, label: 'Phase 9 – Transcendent', range: 'Day 30–44' },
    { day: 45, label: 'Phase 10 – Luminous', range: 'Day 45–59' },
    { day: 60, label: 'Phase 11 – Celestial', range: 'Day 60–89' },
    { day: 90, label: 'Phase 12 – Ascended ✨', range: 'Day 90+ (Plan Complete)' },
];

interface PhasePreviewModalProps {
    visible: boolean;
    onClose: () => void;
}

export function PhasePreviewModal({ visible, onClose }: PhasePreviewModalProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const renderPage = ({ item, index }: { item: typeof PHASES[number]; index: number }) => (
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
            <View style={styles.animationContainer}>
                <PhaseAnimation daysSugarFree={item.day} size={200} />
            </View>
            <Text style={styles.phaseLabel}>{item.label}</Text>
            <Text style={styles.phaseRange}>{item.range}</Text>
            <Text style={styles.phaseIndex}>{index + 1} / {PHASES.length}</Text>
        </View>
    );

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
                    <Text style={styles.headerTitle}>Phase Animations</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Feather name="x" size={22} color={looviColors.text.secondary} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.subtitle}>Swipe to preview all {PHASES.length} growth phases</Text>

                {/* Swipeable pages */}
                <FlatList
                    ref={flatListRef}
                    data={PHASES}
                    renderItem={renderPage}
                    keyExtractor={(item) => String(item.day)}
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
                <View style={styles.dotsContainer}>
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
                </View>

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
    },
    flatList: {
        flex: 1,
    },
    page: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 40,
    },
    animationContainer: {
        width: 220,
        height: 220,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    phaseLabel: {
        fontSize: 22,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: 6,
    },
    phaseRange: {
        fontSize: 15,
        fontWeight: '500',
        color: looviColors.text.secondary,
        marginBottom: 4,
    },
    phaseIndex: {
        fontSize: 12,
        color: looviColors.text.muted,
        marginTop: 8,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.md,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D9D9D9',
    },
    dotActive: {
        width: 24,
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

