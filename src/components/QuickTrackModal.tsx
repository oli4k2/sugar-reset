import React, { useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
    PanResponder,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import { AppIcon } from './OnboardingIcon';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = 420; // Fixed height for quick track
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.4;

interface QuickTrackModalProps {
    visible: boolean;
    onClose: () => void;
    onTrackFood: () => void;
    onTrackWellness: () => void;
    scannedItemsCount: number;
    hasWellnessToday: boolean;
}

export function QuickTrackModal({
    visible,
    onClose,
    onTrackFood,
    onTrackWellness,
    scannedItemsCount,
    hasWellnessToday,
}: QuickTrackModalProps) {
    const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

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

    return (
        <Modal
            visible={visible}
            transparent
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

                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Quick Track</Text>
                            <Text style={styles.subtitle}>What would you like to log?</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={() => {
                                onClose();
                                onTrackFood();
                            }}
                        >
                            <View style={styles.iconContainer}>
                                <AppIcon emoji="🍎" size={32} />
                                {scannedItemsCount > 0 && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{scannedItemsCount}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.optionText}>
                                <Text style={styles.optionTitle}>What have you eaten?</Text>
                                <Text style={styles.optionSubtitle}>Scan or log your food</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={looviColors.text.muted} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={() => {
                                onClose();
                                onTrackWellness();
                            }}
                        >
                            <View style={styles.iconContainer}>
                                <AppIcon emoji="💭" size={32} />
                                {hasWellnessToday && (
                                    <View style={styles.badge}>
                                        <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                                    </View>
                                )}
                            </View>
                            <View style={styles.optionText}>
                                <Text style={styles.optionTitle}>How are you feeling?</Text>
                                <Text style={styles.optionSubtitle}>
                                    {hasWellnessToday ? "Edit today's wellness" : "Log your wellness"}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={looviColors.text.muted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.closeButton} onPress={dismiss}>
                            <Text style={styles.closeButtonText}>Dismiss</Text>
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
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        width: '100%',
        paddingBottom: spacing['2xl'],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
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
    content: {
        paddingHorizontal: spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '400',
        color: looviColors.text.tertiary,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    iconContainer: {
        position: 'relative',
        marginRight: spacing.md,
    },
    optionText: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    optionSubtitle: {
        fontSize: 13,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        marginTop: 2,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: looviColors.accent.success,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    closeButton: {
        marginTop: spacing.sm,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: looviColors.text.tertiary,
    },
});

export default QuickTrackModal;
