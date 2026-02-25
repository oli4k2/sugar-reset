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

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.7;
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.4;

interface PanicModalProps {
    visible: boolean;
    onClose: () => void;
    reasons: string[];
    moneySaved: string;
    sugarAvoided: string;
    onNavigateToReasons: () => void;
    onNavigateToBreathing: () => void;
}

export function PanicModal({
    visible,
    onClose,
    reasons,
    moneySaved,
    sugarAvoided,
    onNavigateToReasons,
    onNavigateToBreathing,
}: PanicModalProps) {
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
                            <Text style={styles.title}>Take a breath</Text>
                            <Text style={styles.subtitle}>
                                This craving will pass in 15-20 minutes. Remember why you started:
                            </Text>
                        </View>

                        <View style={styles.reasonsContainer}>
                            {reasons.slice(0, 2).map((reason: string, index: number) => (
                                <View key={index} style={styles.reasonRow}>
                                    <Ionicons name="heart" size={16} color={looviColors.accent.primary} />
                                    <Text style={styles.reasonText}>{reason}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.statsContainer}>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>Money Saved</Text>
                                <Text style={styles.statValue}>${moneySaved}</Text>
                            </View>
                            <View style={[styles.statBox, styles.statBoxRight]}>
                                <Text style={styles.statLabel}>Sugar Avoided</Text>
                                <Text style={styles.statValue}>{sugarAvoided}g</Text>
                            </View>
                        </View>

                        <View style={styles.tipContainer}>
                            <Text style={styles.tipText}>
                                💡 Choose a strategy to help manage this craving:
                            </Text>
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.button, styles.primaryButton]}
                                onPress={() => {
                                    onClose();
                                    onNavigateToReasons();
                                }}
                            >
                                <Text style={styles.buttonText}>💭 Remind Me Why Not</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.secondaryButton]}
                                onPress={() => {
                                    onClose();
                                    onNavigateToBreathing();
                                }}
                            >
                                <Text style={styles.buttonText}>🧘 Breathing Exercise</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.successButton]}
                                onPress={dismiss}
                            >
                                <Text style={styles.buttonText}>I've got this 💪</Text>
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
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '400',
        color: looviColors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    reasonsContainer: {
        marginBottom: spacing.lg,
    },
    reasonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.03)',
        padding: spacing.md,
        borderRadius: 16,
        marginBottom: spacing.xs,
        gap: spacing.sm,
    },
    reasonText: {
        fontSize: 14,
        color: looviColors.text.primary,
        fontWeight: '500',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(127, 176, 105, 0.1)',
        borderRadius: 20,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statBoxRight: {
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(127, 176, 105, 0.2)',
    },
    statLabel: {
        fontSize: 12,
        color: looviColors.text.tertiary,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.accent.success,
    },
    tipContainer: {
        marginBottom: spacing.lg,
    },
    tipText: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.accent.primary,
        textAlign: 'center',
    },
    actions: {
        gap: spacing.sm,
    },
    button: {
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: looviColors.accent.primary,
    },
    secondaryButton: {
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
    },
    successButton: {
        backgroundColor: looviColors.accent.success,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default PanicModal;
