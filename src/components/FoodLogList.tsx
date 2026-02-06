/**
 * FoodLogList
 * 
 * Displays a list of food items for a selected day.
 * Shows: Image, Name, Calories, Sugar, Health Score
 */

import React from 'react';
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

interface FoodLogListProps {
    items: ScannedItem[];
    onItemPress: (item: ScannedItem) => void;
    emptyMessage?: string;
}

function FoodItemRow({ item, onPress }: { item: ScannedItem; onPress: () => void }) {
    const healthColor = getHealthScoreColor(item.healthScore);

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
                        <Text style={styles.itemStatValue}>{Math.round((item.sugar || 0) * 10) / 10}</Text>
                        <Text style={styles.itemStatUnit}>g sugar</Text>
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

export function FoodLogList({ items, onItemPress, emptyMessage }: FoodLogListProps) {
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
        sugar: acc.sugar + (item.sugar || 0),
        protein: acc.protein + (item.protein || 0),
    }), { calories: 0, sugar: 0, protein: 0 });

    const totals = {
        calories: Math.round(rawTotals.calories),
        sugar: Math.round(rawTotals.sugar * 10) / 10, // One decimal for sugar
        protein: Math.round(rawTotals.protein),
    };

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
                    <Text style={styles.summaryValue}>{totals.sugar}g</Text>
                    <Text style={styles.summaryLabel}>sugar</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{totals.protein}g</Text>
                    <Text style={styles.summaryLabel}>protein</Text>
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
        marginBottom: spacing.md,
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
