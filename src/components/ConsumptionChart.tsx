/**
 * ConsumptionChart Component
 * 
 * A simple line chart showing sugar consumption over time for the gradual plan.
 * Includes a scrollable popup for viewing all-time data.
 * Refactored to a gesture-driven bottom sheet.
 */

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Modal,
    TouchableOpacity,
    ScrollView,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Animated,
    PanResponder,
    Platform,
    TouchableWithoutFeedback,
} from 'react-native';
import Svg, { Path, Line, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, typography, spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.6;
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.4;

// Chart color theme using coral/orange from app theme
const CHART_COLORS = {
    line: looviColors.coralOrange,
    gradient: looviColors.coralSoft,
    success: looviColors.accent.success,
    error: looviColors.accent.error,
};

interface ConsumptionChartProps {
    /** Check-in history with grams data */
    checkInHistory: Record<string, { status: 'sugar_free' | 'had_sugar'; grams?: number }>;
    /** Daily limit to show as reference line */
    dailyLimit?: number;
    /** Number of days to show (default: 14) */
    daysToShow?: number;
}

const CHART_HEIGHT = 200;
const CHART_PADDING = { top: 25, right: 30, bottom: 45, left: 50 };

export function ConsumptionChart({
    checkInHistory,
    dailyLimit = 50,
    daysToShow = 14,
}: ConsumptionChartProps) {
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyPage, setHistoryPage] = useState(0);
    const screenWidth = Dimensions.get('window').width - 60;
    const modalWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - CHART_PADDING.left - CHART_PADDING.right;
    const chartHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

    const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

    const dismiss = useCallback(() => {
        Animated.timing(translateY, {
            toValue: SHEET_HEIGHT,
            duration: 220,
            useNativeDriver: true,
        }).start(() => setShowHistoryModal(false));
    }, [translateY]);

    useEffect(() => {
        if (showHistoryModal) {
            translateY.setValue(SHEET_HEIGHT);
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 3,
                speed: 14,
            }).start();
        }
    }, [showHistoryModal]);

    // Prepare data points
    const dataPoints = useMemo(() => {
        const points: { date: string; grams: number | null; isWithinLimit: boolean }[] = [];
        const allDates = Object.keys(checkInHistory).sort();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let startDate: Date;
        if (allDates.length > 0) {
            const firstEntryDate = new Date(allDates[0]);
            const daysSinceFirst = Math.floor((today.getTime() - firstEntryDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceFirst >= daysToShow) {
                startDate = new Date(today);
                startDate.setDate(today.getDate() - (daysToShow - 1));
            } else {
                startDate = firstEntryDate;
            }
        } else {
            startDate = today;
        }

        for (let i = 0; i < daysToShow; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dateKey = date.toISOString().split('T')[0];
            const entry = checkInHistory[dateKey];
            points.push({
                date: dateKey,
                grams: entry?.grams ?? null,
                isWithinLimit: entry?.status === 'sugar_free' || (entry?.grams || 0) <= dailyLimit,
            });
        }
        return points;
    }, [checkInHistory, daysToShow, dailyLimit]);

    // Get all historical data grouped by 14-day periods
    const historyData = useMemo(() => {
        const allDates = Object.keys(checkInHistory).sort();
        if (allDates.length === 0) return [];
        const periods: { startDate: string; endDate: string; data: typeof dataPoints }[] = [];
        const today = new Date();
        const firstDate = new Date(allDates[0]);
        const daysDiff = Math.ceil((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
        const numPeriods = Math.ceil(daysDiff / 14);

        for (let period = 0; period < Math.max(numPeriods, 1); period++) {
            const periodPoints: typeof dataPoints = [];
            const endOffset = period * 14;
            for (let i = 13 + endOffset; i >= endOffset; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateKey = date.toISOString().split('T')[0];
                const entry = checkInHistory[dateKey];
                periodPoints.push({
                    date: dateKey,
                    grams: entry?.grams ?? null,
                    isWithinLimit: entry?.status === 'sugar_free' || (entry?.grams || 0) <= dailyLimit,
                });
            }
            if (periodPoints.some(p => p.grams !== null)) {
                periods.push({
                    startDate: periodPoints[0].date,
                    endDate: periodPoints[periodPoints.length - 1].date,
                    data: periodPoints,
                });
            }
        }
        return periods;
    }, [checkInHistory, dailyLimit]);

    const maxGrams = useMemo(() => {
        const gramsValues = dataPoints
            .map(p => p.grams)
            .filter((g): g is number => g !== null);
        const maxData = Math.max(...gramsValues, dailyLimit);
        return Math.ceil(maxData / 20) * 20 + 20;
    }, [dataPoints, dailyLimit]);

    const getX = (index: number, width: number = chartWidth) => CHART_PADDING.left + (index / (daysToShow - 1)) * width;
    const getY = (grams: number, height: number = chartHeight) => CHART_PADDING.top + height - (grams / maxGrams) * height;

    const linePath = useMemo(() => {
        const validPoints = dataPoints
            .map((p, i) => (p.grams !== null ? { x: getX(i), y: getY(p.grams) } : null))
            .filter((p): p is { x: number; y: number } => p !== null);
        if (validPoints.length < 2) return '';
        return validPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    }, [dataPoints, daysToShow, maxGrams]);

    const areaPath = useMemo(() => {
        const validPoints = dataPoints
            .map((p, i) => (p.grams !== null ? { x: getX(i), y: getY(p.grams) } : null))
            .filter((p): p is { x: number; y: number } => p !== null);
        if (validPoints.length < 2) return '';
        const baseY = CHART_PADDING.top + chartHeight;
        let path = `M ${validPoints[0].x} ${baseY}`;
        validPoints.forEach(p => { path += ` L ${p.x} ${p.y}`; });
        path += ` L ${validPoints[validPoints.length - 1].x} ${baseY} Z`;
        return path;
    }, [dataPoints, daysToShow, maxGrams]);

    const yLabels = [0, Math.round(maxGrams / 2), maxGrams];
    const hasGramsData = dataPoints.some(p => p.grams !== null);

    const handleModalScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const page = Math.round(event.nativeEvent.contentOffset.x / modalWidth);
        setHistoryPage(page);
    };

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

    if (!hasGramsData) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Sugar Consumption</Text>
                <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>No consumption data yet.</Text>
                    <Text style={styles.noDataSubtext}>Start logging your daily grams to see trends here.</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => setShowHistoryModal(true)} activeOpacity={0.8}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.title}>Sugar Consumption</Text>
                        <Text style={styles.subtitle}>Last {daysToShow} days • Tap for history</Text>
                    </View>
                    <Text style={styles.expandIcon}>📊</Text>
                </View>

                <Svg width={screenWidth} height={CHART_HEIGHT}>
                    <Defs>
                        <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0%" stopColor={CHART_COLORS.line} stopOpacity="0.3" />
                            <Stop offset="100%" stopColor={CHART_COLORS.line} stopOpacity="0.05" />
                        </LinearGradient>
                    </Defs>
                    {yLabels.map((label, i) => (
                        <Line key={`grid-${i}`} x1={CHART_PADDING.left} y1={getY(label)} x2={screenWidth - CHART_PADDING.right} y2={getY(label)} stroke="rgba(0,0,0,0.05)" strokeWidth={1} />
                    ))}
                    <Line x1={CHART_PADDING.left} y1={getY(dailyLimit)} x2={screenWidth - CHART_PADDING.right} y2={getY(dailyLimit)} stroke={CHART_COLORS.line} strokeWidth={1.5} strokeDasharray="5,5" />
                    <SvgText x={CHART_PADDING.left + 5} y={getY(dailyLimit) - 5} fill={CHART_COLORS.line} fontSize={10} textAnchor="start">Limit: {dailyLimit}g</SvgText>
                    {areaPath && <Path d={areaPath} fill="url(#areaGradient)" />}
                    {linePath && <Path d={linePath} stroke={CHART_COLORS.line} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
                    {dataPoints.map((point, i) => point.grams !== null && (
                        <Circle key={`point-${i}`} cx={getX(i)} cy={getY(point.grams)} r={5} fill={point.isWithinLimit ? CHART_COLORS.success : CHART_COLORS.error} stroke="#FFFFFF" strokeWidth={2} />
                    ))}
                    {yLabels.map((label, i) => (
                        <SvgText key={`y-label-${i}`} x={CHART_PADDING.left - 10} y={getY(label) + 4} fill={looviColors.text.tertiary} fontSize={11} textAnchor="end">{label}g</SvgText>
                    ))}
                    {dataPoints.map((point, i) => {
                        if (i % Math.ceil(daysToShow / 5) !== 0 && i !== daysToShow - 1) return null;
                        const date = new Date(point.date);
                        return <SvgText key={`x-label-${i}`} x={getX(i)} y={CHART_HEIGHT - 10} fill={looviColors.text.tertiary} fontSize={10} textAnchor="middle">{`${date.getDate()}/${date.getMonth() + 1}`}</SvgText>;
                    })}
                </Svg>
            </TouchableOpacity>

            <Modal visible={showHistoryModal} transparent animationType="none" onRequestClose={dismiss}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={dismiss}>
                        <View style={StyleSheet.absoluteFill} />
                    </TouchableWithoutFeedback>

                    <Animated.View style={[styles.modalContent, { transform: [{ translateY }] }]}>
                        <View {...panResponder.panHandlers} style={styles.handleContainer}>
                            <View style={styles.handle} />
                        </View>

                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Consumption History</Text>
                            <TouchableOpacity onPress={dismiss}>
                                <Ionicons name="close" size={24} color={looviColors.text.tertiary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>Swipe to see previous periods</Text>

                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={handleModalScroll}
                        >
                            {historyData.map((period, periodIndex) => (
                                <View key={periodIndex} style={[styles.modalPage, { width: modalWidth }]}>
                                    <Text style={styles.periodLabel}>
                                        {new Date(period.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(period.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </Text>
                                    <View style={styles.periodStats}>
                                        {period.data.filter(p => p.grams !== null).map((p, i) => (
                                            <View key={i} style={styles.periodStat}>
                                                <Text style={[styles.periodGrams, p.isWithinLimit ? styles.gramsGood : styles.gramsBad]}>{p.grams}g</Text>
                                                <Text style={styles.periodDate}>{new Date(p.date).getDate()}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.pageIndicator}>
                            {historyData.map((_, i) => (
                                <View key={i} style={[styles.pageDot, i === historyPage && styles.pageDotActive]} />
                            ))}
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 13,
        color: looviColors.text.secondary,
    },
    expandIcon: {
        fontSize: 20,
    },
    noDataContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    noDataText: {
        fontSize: 14,
        color: looviColors.text.secondary,
        marginBottom: 4,
    },
    noDataSubtext: {
        fontSize: 12,
        color: looviColors.text.tertiary,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: SHEET_HEIGHT,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    handleContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 14,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        marginBottom: 4,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    modalSubtitle: {
        fontSize: 13,
        color: looviColors.text.tertiary,
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.xl,
    },
    modalPage: {
        paddingHorizontal: spacing.xl,
    },
    periodLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.primary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    periodStats: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        justifyContent: 'center',
    },
    periodStat: {
        alignItems: 'center',
        padding: spacing.sm,
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: borderRadius.md,
        minWidth: 55,
    },
    periodGrams: {
        fontSize: 15,
        fontWeight: '700',
    },
    gramsGood: {
        color: looviColors.accent.success,
    },
    gramsBad: {
        color: looviColors.accent.error,
    },
    periodDate: {
        fontSize: 11,
        color: looviColors.text.tertiary,
        marginTop: 2,
    },
    pageIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xl,
        gap: 8,
    },
    pageDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    pageDotActive: {
        backgroundColor: looviColors.accent.primary,
        width: 20,
    },
});

export default ConsumptionChart;
