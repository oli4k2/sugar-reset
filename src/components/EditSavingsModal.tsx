import React, { useRef, useEffect, useCallback, useState } from 'react';
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
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = 400;
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.4;

interface EditSavingsModalProps {
    visible: boolean;
    onClose: () => void;
    currentGoal: string;
    onSave: (newGoal: string) => void;
}

export function EditSavingsModal({
    visible,
    onClose,
    currentGoal,
    onSave,
}: EditSavingsModalProps) {
    const [goal, setGoal] = useState(currentGoal);
    const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

    useEffect(() => {
        if (visible) {
            setGoal(currentGoal);
            translateY.setValue(SHEET_HEIGHT);
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 3,
                speed: 14,
            }).start();
        }
    }, [visible, currentGoal, translateY]);

    const dismiss = useCallback(() => {
        Keyboard.dismiss();
        Animated.timing(translateY, {
            toValue: SHEET_HEIGHT,
            duration: 220,
            useNativeDriver: true,
        }).start(() => onClose());
    }, [translateY, onClose]);

    const handleSave = () => {
        if (goal.trim()) {
            onSave(goal.trim());
            dismiss();
        }
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 10 && !Keyboard.isVisible(),
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
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
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
                        <Text style={styles.title}>What are you saving for?</Text>

                        <TextInput
                            style={styles.input}
                            value={goal}
                            onChangeText={setGoal}
                            placeholder="e.g., A vacation, New phone..."
                            placeholderTextColor={looviColors.text.muted}
                            autoFocus={true}
                            returnKeyType="done"
                            onSubmitEditing={handleSave}
                        />

                        <View style={styles.buttons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={dismiss}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSave}
                            >
                                <Text style={styles.saveText}>Save Goal</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
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
        paddingBottom: Platform.OS === 'ios' ? spacing['3xl'] : spacing.xl,
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
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: spacing.md,
        fontSize: 16,
        color: looviColors.text.primary,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    buttons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: looviColors.text.secondary,
    },
    saveButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        backgroundColor: looviColors.accent.primary,
    },
    saveText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default EditSavingsModal;
