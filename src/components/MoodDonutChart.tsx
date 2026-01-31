/**
 * MoodDonutChart
 * 
 * A lightweight donut chart for visualizing community mood distribution.
 * Uses React Native SVG for smooth rendering.
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { looviColors } from './LooviBackground';

interface MoodData {
    great: number;
    good: number;
    okay: number;
    struggling: number;
}

interface MoodDonutChartProps {
    data: MoodData;
    size?: number;
}

const MOOD_COLORS = {
    great: '#34D399',      // Green - feeling great
    good: '#60A5FA',       // Blue - feeling good
    okay: '#FBBF24',       // Yellow - okay
    struggling: '#F87171', // Red - struggling
};

const MOOD_LABELS = {
    great: 'Great',
    good: 'Good',
    okay: 'Okay',
    struggling: 'Struggling',
};

export function MoodDonutChart({ data, size = 100 }: MoodDonutChartProps) {
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    // Calculate percentages and segments
    const total = data.great + data.good + data.okay + data.struggling;
    if (total === 0) {
        return null;
    }

    const segments = [
        { key: 'great', value: data.great, color: MOOD_COLORS.great },
        { key: 'good', value: data.good, color: MOOD_COLORS.good },
        { key: 'okay', value: data.okay, color: MOOD_COLORS.okay },
        { key: 'struggling', value: data.struggling, color: MOOD_COLORS.struggling },
    ].filter(s => s.value > 0);

    let cumulativePercentage = 0;

    // Find the dominant mood for center display
    const dominantMood = segments.reduce((prev, curr) =>
        curr.value > prev.value ? curr : prev
    );
    const dominantPercentage = Math.round((dominantMood.value / total) * 100);

    return (
        <View style={styles.container}>
            <View style={styles.chartContainer}>
                <Svg width={size} height={size}>
                    <G rotation="-90" origin={`${center}, ${center}`}>
                        {segments.map((segment, index) => {
                            const percentage = segment.value / total;
                            const strokeDashoffset = circumference * cumulativePercentage;
                            const strokeDasharray = `${circumference * percentage} ${circumference * (1 - percentage)}`;
                            cumulativePercentage += percentage;

                            return (
                                <Circle
                                    key={segment.key}
                                    cx={center}
                                    cy={center}
                                    r={radius}
                                    stroke={segment.color}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={-strokeDashoffset}
                                    strokeLinecap="round"
                                    fill="transparent"
                                />
                            );
                        })}
                    </G>
                </Svg>
                <View style={styles.centerContent}>
                    <Text style={styles.centerPercentage}>{dominantPercentage}%</Text>
                    <Text style={styles.centerLabel}>{MOOD_LABELS[dominantMood.key as keyof typeof MOOD_LABELS]}</Text>
                </View>
            </View>
            <View style={styles.legend}>
                {segments.map((segment) => (
                    <View key={segment.key} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: segment.color }]} />
                        <Text style={styles.legendLabel}>
                            {MOOD_LABELS[segment.key as keyof typeof MOOD_LABELS]}
                        </Text>
                        <Text style={styles.legendValue}>
                            {Math.round((segment.value / total) * 100)}%
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    chartContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerContent: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerPercentage: {
        fontSize: 16,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    centerLabel: {
        fontSize: 9,
        color: looviColors.text.tertiary,
        textTransform: 'uppercase',
    },
    legend: {
        flex: 1,
        gap: 6,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendLabel: {
        fontSize: 11,
        color: looviColors.text.secondary,
        flex: 1,
    },
    legendValue: {
        fontSize: 11,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
});

export default MoodDonutChart;
