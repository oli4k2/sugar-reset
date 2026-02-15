/**
 * FoodItemModal
 * 
 * Modal showing full macro breakdown for a food item.
 * Allows editing and deleting.
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import { ScannedItem, getHealthScoreColor, updateScannedItem, deleteScannedItem } from '../services/scannerService';
import Slider from '@react-native-community/slider';

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
        if (item) {
            setEditedItem({ ...item });
        }
    }, [item]);

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
                        onClose();
                    }
                },
            ]
        );
    };

    const updateField = (field: keyof ScannedItem, value: number | string) => {
        if (editedItem) {
            setEditedItem({ ...editedItem, [field]: value });
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.keyboardAvoidingView}
                >
                    <View style={styles.container}>
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
                            <TouchableOpacity
                                onPress={() => setIsEditing(!isEditing)}
                                style={styles.editButton}
                            >
                                <Text style={styles.editText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            {/* Image */}
                            {item.imageUri && (
                                <Image source={{ uri: item.imageUri }} style={styles.image} />
                            )}

                            {/* Health Score */}
                            <View style={[styles.healthScoreCard, { backgroundColor: `${healthColor}15` }]}>
                                <Text style={[styles.healthScoreValue, { color: healthColor }]}>
                                    {item.healthScore}
                                </Text>
                                <Text style={styles.healthScoreLabel}>/ 10 Health Score</Text>
                            </View>

                            {/* Portion */}
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

                            {/* Macros */}
                            <View style={styles.macrosSection}>
                                <Text style={styles.sectionTitle}>Nutrition Facts</Text>
                                <View style={styles.macroCard}>
                                    <MacroRow
                                        label="Calories"
                                        value={isEditing ? editedItem.calories.toString() : item.calories.toString()}
                                        unit="kcal"
                                        isEditing={isEditing}
                                        onChangeText={(val) => updateField('calories', parseFloat(val) || 0)}
                                    />
                                    <MacroRow
                                        label="Protein"
                                        value={isEditing ? editedItem.protein.toString() : item.protein.toString()}
                                        unit="g"
                                        isEditing={isEditing}
                                        onChangeText={(val) => updateField('protein', parseFloat(val) || 0)}
                                    />
                                    <MacroRow
                                        label="Carbohydrates"
                                        value={isEditing ? editedItem.carbs.toString() : item.carbs.toString()}
                                        unit="g"
                                        subValue={`(${item.carbsSugars}g sugars)`}
                                        isEditing={isEditing}
                                        onChangeText={(val) => updateField('carbs', parseFloat(val) || 0)}
                                    />
                                    <MacroRow
                                        label="Fat"
                                        value={isEditing ? editedItem.fat.toString() : item.fat.toString()}
                                        unit="g"
                                        subValue={`(${item.fatSaturated}g sat)`}
                                        isEditing={isEditing}
                                        onChangeText={(val) => updateField('fat', parseFloat(val) || 0)}
                                    />
                                    <MacroRow
                                        label="Fiber"
                                        value={isEditing ? editedItem.fiber.toString() : item.fiber.toString()}
                                        unit="g"
                                        isEditing={isEditing}
                                        onChangeText={(val) => updateField('fiber', parseFloat(val) || 0)}
                                    />
                                    <MacroRow
                                        label="Sugar (Total)"
                                        value={isEditing ? editedItem.sugar.toString() : item.sugar.toString()}
                                        unit="g"
                                        isEditing={isEditing}
                                        onChangeText={(val) => updateField('sugar', parseFloat(val) || 0)}
                                    />
                                    <MacroRow
                                        label="Sodium"
                                        value={isEditing ? editedItem.sodium.toString() : item.sodium.toString()}
                                        unit="mg"
                                        isEditing={isEditing}
                                        onChangeText={(val) => updateField('sodium', parseFloat(val) || 0)}
                                    />
                                </View>
                            </View>

                            {/* Timestamp */}
                            <Text style={styles.timestamp}>
                                Logged {new Date(item.timestamp).toLocaleString()}
                            </Text>
                        </ScrollView>

                        {/* Actions */}
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
                    </View>
                </KeyboardAvoidingView>
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
        borderTopLeftRadius: borderRadius['2xl'],
        borderTopRightRadius: borderRadius['2xl'],
        maxHeight: '90%',
        marginHorizontal: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.lg,
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
    keyboardAvoidingView: {
        width: '100%',
        justifyContent: 'flex-end',
        flex: 1,
    },
});
