/**
 * FoodLogList
 * 
 * Displays a list of food items for a selected day.
 * Shows: Image, Name, Calories, Added Sugar, Health Score
 * Includes visual sugar meter comparing to daily recommended limit.
 */

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
} from 'react-native';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import { ScannedItem, getHealthScoreColor } from '../services/scannerService';
import { getDailyAddedSugarLimit } from '../services/streakService';

interface FoodLogListProps {
    items: ScannedItem[];
    onItemPress: (item: ScannedItem) => void;
    emptyMessage?: string;
    dailySugarLimit?: number;
}

function FoodItemRow({ item, onPress }: { item: ScannedItem; onPress: () => void }) {
    const healthColor = getHealthScoreColor(item.healthScore);
    const addedSugar = item.addedSugar !== undefined ? item.addedSugar : (item.sugar || 0);

    return (
        <TouchableOpacity style={styles.itemRow} onPress={onPress} activeOpacity={0.7}>
            {/* Image */}
            {item.imageUri ? (
                <Image source={{ uri: item.imageUri }} style={styles.itemImage} />
            ) : (
                <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                    <Text style={styles.itemImageEmoji}>🍽️</Text>
                </View>
            )}

            {/* Info */}
            <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.itemStats}>
                    <Text style={styles.itemStat}>
                        <Text style={styles.itemStatValue}>{Math.round(item.calories || 0)}</Text>
                        <Text style={styles.itemStatUnit}> kcal</Text>
                    </Text>
                    <Text style={styles.itemStatDivider}>•</Text>
                    <Text style={styles.itemStat}>
                        <Text style={styles.itemStatValue}>{Math.round(addedSugar * 10) / 10}</Text>
                        <Text style={styles.itemStatUnit}>g added sugar</Text>
                    </Text>
                </View>
            </View>

            {/* Health Score */}
            <View style={[styles.healthScore, { backgroundColor: `${healthColor}20` }]}>
                <Text style={[styles.healthScoreValue, { color: healthColor }]}>
                    {item.healthScore}
                </Text>
            </View>

            {/* Arrow */}
            <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
    );
}

export function FoodLogList({ items, onItemPress, emptyMessage, dailySugarLimit: propLimit }: FoodLogListProps) {
    const [dailySugarLimit, setDailySugarLimit] = useState(propLimit || 25);

    useEffect(() => {
        if (propLimit !== undefined) {
            setDailySugarLimit(propLimit);
        } else {
            getDailyAddedSugarLimit().then(limit => setDailySugarLimit(limit));
        }
    }, [propLimit]);

    if (items.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🍽️</Text>
                <Text style={styles.emptyText}>{emptyMessage || 'No food logged for this day'}</Text>
            </View>
        );
    }

    // Calculate totals and round to prevent floating-point precision issues
    const rawTotals = items.reduce((acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        addedSugar: acc.addedSugar + (item.addedSugar !== undefined ? item.addedSugar : (item.sugar || 0)),
        protein: acc.protein + (item.protein || 0),
    }), { calories: 0, addedSugar: 0, protein: 0 });

    const totals = {
        calories: Math.round(rawTotals.calories),
        addedSugar: Math.round(rawTotals.addedSugar * 10) / 10, // One decimal for sugar
        protein: Math.round(rawTotals.protein),
    };

    // Sugar meter colors
    const sugarColor = totals.addedSugar <= dailySugarLimit
        ? '#22C55E'
        : totals.addedSugar <= (dailySugarLimit * 2)
            ? '#F59E0B'
            : '#EF4444';

    const sugarFillPercent = Math.min((totals.addedSugar / (dailySugarLimit * 2)) * 100, 100);

    return (
        <View style={styles.container}>
            {/* Summary */}
            <View style={styles.summary}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{totals.calories}</Text>
                    <Text style={styles.summaryLabel}>kcal</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: sugarColor }]}>{totals.addedSugar}g</Text>
                    <Text style={styles.summaryLabel}>Added Sugar</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{totals.protein}g</Text>
                    <Text style={styles.summaryLabel}>protein</Text>
                </View>
            </View>

            {/* Sugar Meter */}
            <View style={styles.sugarMeter}>
                <View style={styles.sugarMeterHeader}>
                    <Text style={styles.sugarMeterLabel}>Added Sugar</Text>
                    <Text style={styles.sugarMeterValue}>
                        {totals.addedSugar}g / {dailySugarLimit}g recommended
                    </Text>
                </View>
                <View style={styles.sugarMeterTrack}>
                    <View
                        style={[
                            styles.sugarMeterFill,
                            {
                                width: `${sugarFillPercent}%`,
                                backgroundColor: sugarColor,
                            },
                        ]}
                    />
                    <View style={styles.sugarMeterMarker} />
                </View>
                <View style={styles.sugarMeterLabels}>
                    <Text style={styles.sugarMeterMarkerLabel}>0g</Text>
                    <Text style={[styles.sugarMeterMarkerLabel, { position: 'absolute', left: '50%' }]}>{dailySugarLimit}g</Text>
                    <Text style={styles.sugarMeterMarkerLabel}>{dailySugarLimit * 2}g+</Text>
                </View>
            </View>

            {/* List */}
            <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <FoodItemRow item={item} onPress={() => onItemPress(item)} />
                )}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {},
    summary: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: spacing.md,
        marginBottom: spacing.sm,
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderRadius: borderRadius.lg,
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    summaryLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        marginTop: 2,
    },
    summaryDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    // Sugar Meter
    sugarMeter: {
        marginBottom: spacing.md,
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
    // Item Row
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    itemImage: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.md,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    itemImagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemImageEmoji: {
        fontSize: 24,
    },
    itemInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        color: looviColors.text.primary,
        marginBottom: 2,
    },
    itemStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemStat: {
        fontSize: 12,
    },
    itemStatValue: {
        fontWeight: '600',
        color: looviColors.text.secondary,
    },
    itemStatUnit: {
        fontWeight: '400',
        color: looviColors.text.tertiary,
    },
    itemStatDivider: {
        marginHorizontal: spacing.xs,
        color: looviColors.text.muted,
    },
    healthScore: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    healthScoreValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    arrow: {
        fontSize: 20,
        color: looviColors.text.muted,
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    emptyEmoji: {
        fontSize: 40,
        marginBottom: spacing.md,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        textAlign: 'center',
    },
});
