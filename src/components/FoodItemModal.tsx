/**
 * FoodItemModal
 *
 * Modal showing full macro breakdown for a food item.
 * Gesture-driven bottom sheet: drag handle to dismiss.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ScrollView,
    TextInput,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Animated,
    PanResponder,
    Dimensions,
} from 'react-native';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import { ScannedItem, getHealthScoreColor, updateScannedItem, deleteScannedItem } from '../services/scannerService';
import Slider from '@react-native-community/slider';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.88;
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.3;

interface FoodItemModalProps {
    visible: boolean;
    item: ScannedItem | null;
    onClose: () => void;
    onUpdate: (updatedItem?: ScannedItem) => void;
}

interface MacroRowProps {
    label: string;
    value: string;
    unit: string;
    subValue?: string;
    isEditing?: boolean;
    onChangeText?: (text: string) => void;
}

function MacroRow({ label, value, unit, subValue, isEditing, onChangeText }: MacroRowProps) {
    if (isEditing) {
        return (
            <View style={styles.macroRow}>
                <Text style={styles.macroLabel}>{label}</Text>
                <View style={styles.macroEditContainer}>
                    <TextInput
                        style={styles.macroInput}
                        value={value}
                        onChangeText={onChangeText}
                        keyboardType="numeric"
                        placeholder="0"
                        selectTextOnFocus
                    />
                    <Text style={styles.macroUnit}>{unit}</Text>
                </View>
            </View>
        );
    }
    return (
        <View style={styles.macroRow}>
            <Text style={styles.macroLabel}>{label}</Text>
            <View style={styles.macroValueContainer}>
                <Text style={styles.macroValue}>{value}</Text>
                <Text style={styles.macroUnit}>{unit}</Text>
                {subValue && <Text style={styles.macroSub}>{subValue}</Text>}
            </View>
        </View>
    );
}

export function FoodItemModal({ visible, item, onClose, onUpdate }: FoodItemModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedItem, setEditedItem] = useState<ScannedItem | null>(null);

    useEffect(() => {
        if (item) setEditedItem({ ...item });
    }, [item]);

    // ── Bottom-sheet gesture ──────────────────────────────────────────────────
    const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
    const currentSnap = useRef(0);
    const handleCloseRef = useRef(onClose);
    useEffect(() => { handleCloseRef.current = onClose; });

    const dismiss = useCallback(() => {
        Animated.timing(translateY, {
            toValue: SHEET_HEIGHT,
            duration: 220,
            useNativeDriver: true,
        }).start(() => handleCloseRef.current());
    }, [translateY]);

    useEffect(() => {
        if (visible) {
            translateY.setValue(SHEET_HEIGHT);
            currentSnap.current = 0;
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
            onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 8,
            onPanResponderGrant: () => {
                translateY.stopAnimation();
                translateY.setOffset(currentSnap.current);
                translateY.setValue(0);
            },
            onPanResponderMove: (_, gs) => {
                translateY.setValue(Math.max(0, gs.dy));
            },
            onPanResponderRelease: (_, gs) => {
                translateY.flattenOffset();
                if (gs.dy > DISMISS_THRESHOLD || gs.vy > 1.5) {
                    Animated.timing(translateY, {
                        toValue: SHEET_HEIGHT,
                        duration: 220,
                        useNativeDriver: true,
                    }).start(() => handleCloseRef.current());
                } else {
                    currentSnap.current = 0;
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
    // ─────────────────────────────────────────────────────────────────────────

    if (!item || !editedItem) return null;

    const healthColor = getHealthScoreColor(item.healthScore);

    const handleSave = async () => {
        if (editedItem) {
            await updateScannedItem(editedItem);
            setIsEditing(false);
            onUpdate(editedItem);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Food',
            `Are you sure you want to delete "${item.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteScannedItem(item.id);
                        onUpdate();
                        dismiss();
                    }
                },
            ]
        );
    };

    const updateField = (field: keyof ScannedItem, value: number | string) => {
        if (editedItem) setEditedItem({ ...editedItem, [field]: value });
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={dismiss}>
                    <View style={StyleSheet.absoluteFill} />
                </TouchableWithoutFeedback>

                <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
                    {/* Drag handle */}
                    <View style={styles.dragHandleArea} {...panResponder.panHandlers}>
                        <View style={styles.dragHandle} />
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={dismiss} style={styles.closeButton}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                        {isEditing ? (
                            <TextInput
                                style={styles.titleInput}
                                value={editedItem.name}
                                onChangeText={(val) => updateField('name', val)}
                                autoFocus
                            />
                        ) : (
                            <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
                        )}
                        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editButton}>
                            <Text style={styles.editText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
                        </TouchableOpacity>
                    </View>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={{ flex: 1 }}
                    >
                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            {item.imageUri && (
                                <Image source={{ uri: item.imageUri }} style={styles.image} />
                            )}

                            <View style={[styles.healthScoreCard, { backgroundColor: `${healthColor}15` }]}>
                                <Text style={[styles.healthScoreValue, { color: healthColor }]}>{item.healthScore}</Text>
                                <Text style={styles.healthScoreLabel}>/ 10 Health Score</Text>
                            </View>

                            <View style={styles.portionSection}>
                                <Text style={styles.sectionTitle}>Portion Eaten</Text>
                                {isEditing ? (
                                    <View>
                                        <Slider
                                            style={styles.slider}
                                            minimumValue={0}
                                            maximumValue={100}
                                            step={25}
                                            value={editedItem.portionPercent}
                                            onValueChange={(val) => updateField('portionPercent', val)}
                                            minimumTrackTintColor={looviColors.accent.primary}
                                            maximumTrackTintColor="rgba(0,0,0,0.1)"
                                        />
                                        <Text style={styles.portionValue}>{editedItem.portionPercent}%</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.portionValue}>{item.portionPercent}%</Text>
                                )}
                            </View>

                            <View style={styles.macrosSection}>
                                <Text style={styles.sectionTitle}>Nutrition Facts</Text>
                                <View style={styles.macroCard}>
                                    <MacroRow label="Calories" value={isEditing ? editedItem.calories.toString() : item.calories.toString()} unit="kcal" isEditing={isEditing} onChangeText={(val) => updateField('calories', parseFloat(val) || 0)} />
                                    <MacroRow label="Protein" value={isEditing ? editedItem.protein.toString() : item.protein.toString()} unit="g" isEditing={isEditing} onChangeText={(val) => updateField('protein', parseFloat(val) || 0)} />
                                    <MacroRow label="Carbohydrates" value={isEditing ? editedItem.carbs.toString() : item.carbs.toString()} unit="g" subValue={`(${item.carbsSugars}g sugars)`} isEditing={isEditing} onChangeText={(val) => updateField('carbs', parseFloat(val) || 0)} />
                                    <MacroRow label="Fat" value={isEditing ? editedItem.fat.toString() : item.fat.toString()} unit="g" subValue={`(${item.fatSaturated}g sat)`} isEditing={isEditing} onChangeText={(val) => updateField('fat', parseFloat(val) || 0)} />
                                    <MacroRow label="Fiber" value={isEditing ? editedItem.fiber.toString() : item.fiber.toString()} unit="g" isEditing={isEditing} onChangeText={(val) => updateField('fiber', parseFloat(val) || 0)} />
                                    <MacroRow label="Sugar (Total)" value={isEditing ? editedItem.sugar.toString() : item.sugar.toString()} unit="g" isEditing={isEditing} onChangeText={(val) => updateField('sugar', parseFloat(val) || 0)} />
                                    <MacroRow label="Sodium" value={isEditing ? editedItem.sodium.toString() : item.sodium.toString()} unit="mg" isEditing={isEditing} onChangeText={(val) => updateField('sodium', parseFloat(val) || 0)} />
                                </View>
                            </View>

                            <Text style={styles.timestamp}>
                                Logged {new Date(item.timestamp).toLocaleString()}
                            </Text>
                        </ScrollView>

                        <View style={styles.actions}>
                            {isEditing ? (
                                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                                    <Text style={styles.deleteButtonText}>Delete Food</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </KeyboardAvoidingView>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: SHEET_HEIGHT,
        width: '100%',
    },
    dragHandleArea: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 40,
    },
    dragHandle: {
        width: 44,
        height: 5,
        backgroundColor: '#CCCCCC',
        borderRadius: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    closeButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeText: {
        fontSize: 20,
        color: looviColors.text.tertiary,
    },
    title: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginHorizontal: spacing.md,
    },
    editButton: {
        paddingHorizontal: spacing.sm,
    },
    editText: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.accent.primary,
    },
    content: {
        padding: spacing.lg,
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    healthScoreCard: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
    },
    healthScoreValue: {
        fontSize: 48,
        fontWeight: '800',
    },
    healthScoreLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: looviColors.text.secondary,
        marginLeft: spacing.xs,
    },
    portionSection: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.sm,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    portionValue: {
        fontSize: 24,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
    },
    macrosSection: {
        marginBottom: spacing.lg,
    },
    macroCard: {
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
    },
    macroRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    macroLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: looviColors.text.primary,
    },
    macroValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    macroValue: {
        fontSize: 16,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    macroUnit: {
        fontSize: 12,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        marginLeft: 2,
    },
    macroSub: {
        fontSize: 11,
        fontWeight: '400',
        color: looviColors.text.muted,
        marginLeft: spacing.xs,
    },
    timestamp: {
        fontSize: 12,
        fontWeight: '400',
        color: looviColors.text.muted,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    actions: {
        padding: spacing.lg,
        paddingTop: 0,
    },
    saveButton: {
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 14,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    deleteButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingVertical: 14,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EF4444',
    },
    titleInput: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginHorizontal: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: looviColors.accent.primary,
        paddingBottom: 4,
    },
    macroEditContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    macroInput: {
        fontSize: 16,
        fontWeight: '700',
        color: looviColors.text.primary,
        minWidth: 40,
        textAlign: 'right',
        paddingVertical: 0,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
});
