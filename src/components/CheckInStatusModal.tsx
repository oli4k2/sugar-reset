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
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = 450;
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.4;

interface CheckInStatusModalProps {
    visible: boolean;
    onClose: () => void;
    todayCheckIn: {
        sugarFree: boolean;
        grams?: number;
    } | null;
    onAddJournal: () => void;
    onResetCheckIn: () => void;
}

export function CheckInStatusModal({
    visible,
    onClose,
    todayCheckIn,
    onAddJournal,
    onResetCheckIn,
}: CheckInStatusModalProps) {
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
                            <Text style={styles.emoji}>✅</Text>
                            <Text style={styles.title}>Today's Check-In Complete</Text>
                        </View>

                        <View style={styles.statusBox}>
                            <Text style={styles.statusLabel}>You logged:</Text>
                            <Text style={styles.statusValue}>
                                {todayCheckIn?.sugarFree
                                    ? '🌟 Sugar-Free Day!'
                                    : '📊 Had Sugar'}
                            </Text>
                            {todayCheckIn?.grams !== undefined && (
                                <Text style={styles.gramsText}>
                                    {todayCheckIn.grams}g consumed
                                </Text>
                            )}
                        </View>

                        <Text style={styles.hintText}>
                            💡 Consider adding a journal entry to reflect on your day
                        </Text>

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => {
                                    onClose();
                                    onAddJournal();
                                }}
                            >
                                <Text style={styles.primaryButtonText}>📝 Add Journal Entry</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => {
                                    onClose();
                                    onResetCheckIn();
                                }}
                            >
                                <Text style={styles.secondaryButtonText}>🔄 Change Check-In</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.closeButton} onPress={dismiss}>
                                <Text style={styles.closeButtonText}>Dismiss</Text>
                            </TouchableOpacity>
                        </View>
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
    emoji: {
        fontSize: 48,
        marginBottom: spacing.sm,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
    },
    statusBox: {
        backgroundColor: 'rgba(127, 176, 105, 0.1)',
        borderRadius: 20,
        padding: spacing.xl,
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    statusLabel: {
        fontSize: 14,
        color: looviColors.text.tertiary,
        marginBottom: 4,
    },
    statusValue: {
        fontSize: 20,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    gramsText: {
        fontSize: 14,
        color: looviColors.text.secondary,
        marginTop: 8,
        fontWeight: '500',
    },
    hintText: {
        fontSize: 14,
        color: looviColors.text.tertiary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: spacing.xl,
        fontStyle: 'italic',
    },
    actions: {
        gap: spacing.sm,
    },
    primaryButton: {
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        paddingVertical: 14,
        borderRadius: 30,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: looviColors.text.secondary,
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

export default CheckInStatusModal;
