/**
 * FoodScannerModal
 * 
 * High-end, premium modal for scanning food items.
 * Prioritizes the "Scan" action while keeping other options accessible.
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Slider from '@react-native-community/slider';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import {
    analyzeFood,
    saveScannedItem,
    generateScanId,
    ScannedItem,
    AnalysisResult,
    getHealthScoreColor,
    getScannedItems,
    getPinnedItems,
    pinItem,
    unpinItem,
} from '../services/scannerService';
import { useUserData } from '../context/UserDataContext';
import { useRevenueCat } from '../hooks/useRevenueCat';

interface FoodScannerModalProps {
    visible: boolean;
    onClose: () => void;
    onScanComplete: (item: ScannedItem) => void;
    selectedDate?: string;
    onShowPaywall?: () => void;
}

type ScanStep = 'select' | 'describe' | 'text-input' | 'analyzing' | 'result';

export default function FoodScannerModal({
    visible,
    onClose,
    onScanComplete,
    selectedDate,
    onShowPaywall,
}: FoodScannerModalProps) {
    const { isPremium } = useRevenueCat();
    const [step, setStep] = useState<ScanStep>('select');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [textOnlyInput, setTextOnlyInput] = useState('');
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [portionPercent, setPortionPercent] = useState(100);
    const [editedName, setEditedName] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [recentFoods, setRecentFoods] = useState<ScannedItem[]>([]);
    const [pinnedFoods, setPinnedFoods] = useState<ScannedItem[]>([]);

    // Manual entry state
    const [manualCalories, setManualCalories] = useState('');
    const [manualSugar, setManualSugar] = useState('');
    const [manualCarbs, setManualCarbs] = useState('');
    const [manualProtein, setManualProtein] = useState('');
    const [manualFat, setManualFat] = useState('');
    const [manualImageUri, setManualImageUri] = useState<string | null>(null);

    const { refreshStreakFromFoodLogs } = useUserData();

    useEffect(() => {
        if (visible) {
            console.log('FoodScannerModal visible');
            loadRecentFoods();
            // Always start at select step
            setStep('select');
        }
    }, [visible, isPremium]);

    // Load recent foods when entering text-input step
    useEffect(() => {
        if (step === 'text-input') {
            loadRecentFoods();
        }
    }, [step]);

    const loadRecentFoods = async () => {
        try {
            const pinned = await getPinnedItems();
            setPinnedFoods(pinned);

            const items = await getScannedItems();
            const pinnedNames = new Set(pinned.map(p => p.name));
            const uniqueMap = new Map<string, ScannedItem>();
            items.forEach(item => {
                if (!uniqueMap.has(item.name) && !pinnedNames.has(item.name)) {
                    uniqueMap.set(item.name, item);
                }
            });
            setRecentFoods(Array.from(uniqueMap.values()).slice(0, 5));
        } catch (error) {
            console.error('Error loading recent foods:', error);
        }
    };

    const resetState = () => {
        setStep('select');
        setImageUri(null);
        setDescription('');
        setTextOnlyInput('');
        setResult(null);
        setPortionPercent(100);
        setEditedName('');
        setIsEditing(false);
        // Reset manual fields
        setManualCalories('');
        setManualSugar('');
        setManualCarbs('');
        setManualProtein('');
        setManualFat('');
        setManualImageUri(null);
    };

    const pickImageForManual = async () => {
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!res.canceled && res.assets[0]) {
            setManualImageUri(res.assets[0].uri);
        }
    };

    const quickAddRecent = async (item: ScannedItem) => {
        const timestamp = selectedDate
            ? new Date(selectedDate + 'T12:00:00').toISOString()
            : new Date().toISOString();

        const newItem: ScannedItem = {
            ...item,
            id: generateScanId(),
            timestamp,
        };

        try {
            await saveScannedItem(newItem);
            onScanComplete(newItem);
            handleClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to add food item.');
        }
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera access is needed.');
            return;
        }

        const res = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!res.canceled && res.assets[0]) {
            setImageUri(res.assets[0].uri);
            setStep('describe');
        }
    };

    const pickFromGallery = async () => {
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!res.canceled && res.assets[0]) {
            setImageUri(res.assets[0].uri);
            setStep('describe');
        }
    };

    const processImage = async () => {
        if (!imageUri) return;
        setStep('analyzing');
        try {
            const res = await analyzeFood(imageUri, description);
            setResult(res);
            setEditedName(res.foodName);
            setStep('result');
        } catch (error) {
            Alert.alert('Error', 'Analysis failed.');
            resetState();
        }
    };

    const processTextOnly = async () => {
        if (!textOnlyInput.trim()) return;

        // If we have manual values, skip analysis and go straight to result or save
        if (manualCalories || manualSugar) {
            const manualResult: AnalysisResult = {
                foodName: textOnlyInput.trim(),
                calories: parseInt(manualCalories) || 0,
                protein: parseFloat(manualProtein) || 0,
                carbs: parseFloat(manualCarbs) || 0,
                carbsSugars: parseFloat(manualSugar) || 0,
                fat: parseFloat(manualFat) || 0,
                fatSaturated: 0,
                fiber: 0,
                sugar: parseFloat(manualSugar) || 0,
                sodium: 0,
                healthScore: 0, // Will be calculated
                confidence: 1.0,
                suggestion: 'Manually entered'
            };

            // Calculate health score for manual entry
            const tempItem: ScannedItem = {
                id: 'temp',
                imageUri: manualImageUri || '',
                name: manualResult.foodName,
                timestamp: '',
                portionPercent: 100,
                ...manualResult,
                healthScore: 0,
                confidence: 1.0
            };

            // Calculate health score
            const { calculateFoodHealthScore } = await import('../services/healthScoringService');
            manualResult.healthScore = calculateFoodHealthScore(tempItem);

            setResult(manualResult);
            setEditedName(manualResult.foodName);
            setStep('result');
            return;
        }

        setStep('analyzing');
        try {
            const res = await analyzeFood('', textOnlyInput.trim());
            setResult(res);
            setEditedName(res.foodName);
            setStep('result');
        } catch (error) {
            Alert.alert('Error', 'Analysis failed.');
            resetState();
        }
    };

    const handleSave = async () => {
        if (!result) return;
        const portionMultiplier = portionPercent / 100;
        const timestamp = selectedDate ? new Date(selectedDate + 'T12:00:00').toISOString() : new Date().toISOString();

        const scannedItem: ScannedItem = {
            id: generateScanId(),
            imageUri: imageUri || manualImageUri || '',
            name: editedName || result.foodName,
            timestamp,
            portionPercent,
            calories: Math.round(result.calories * portionMultiplier),
            protein: Math.round(result.protein * portionMultiplier * 10) / 10,
            carbs: Math.round(result.carbs * portionMultiplier * 10) / 10,
            carbsSugars: Math.round(result.carbsSugars * portionMultiplier * 10) / 10,
            fat: Math.round(result.fat * portionMultiplier * 10) / 10,
            fatSaturated: Math.round(result.fatSaturated * portionMultiplier * 10) / 10,
            fiber: Math.round(result.fiber * portionMultiplier * 10) / 10,
            sugar: Math.round(result.sugar * portionMultiplier * 10) / 10,
            sodium: Math.round(result.sodium * portionMultiplier),
            healthScore: result.healthScore,
            confidence: result.confidence,
            suggestion: result.suggestion,
        };

        await saveScannedItem(scannedItem);

        // Refresh streak immediately to reflect new sugar totals - await to ensure it completes
        if (refreshStreakFromFoodLogs) {
            await refreshStreakFromFoodLogs();
        }

        onScanComplete(scannedItem);
        handleClose();
    };

    const renderContent = () => {
        switch (step) {
            case 'select':
                return (
                    <ScrollView 
                        style={styles.scrollContainer}
                        contentContainerStyle={styles.selectContainer}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Analyze Food</Text>
                            <Text style={styles.headerSubtitle}>Identify sugars & macros instantly</Text>
                        </View>

                        {/* Camera Scan - Premium Only */}
                        {isPremium ? (
                            <TouchableOpacity style={styles.heroButton} onPress={takePhoto} activeOpacity={0.9}>
                                <View style={styles.heroContent}>
                                    <View style={styles.shutterRing}><View style={styles.shutterInner} /></View>
                                    <View style={styles.heroTextContainer}>
                                        <Text style={styles.heroTitle}>Scan Meal</Text>
                                        <Text style={styles.heroSubtitle}>Capture food to analyze</Text>
                                    </View>
                                    <Feather name="chevron-right" size={24} color="#FFF" />
                                </View>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.heroButton, { opacity: 0.6 }]}
                                onPress={() => {
                                    Alert.alert(
                                        'Premium Feature',
                                        'Food scanning with camera is a premium feature. Upgrade to unlock instant food analysis!',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Upgrade',
                                                onPress: () => {
                                                    handleClose();
                                                    onShowPaywall?.();
                                                }
                                            }
                                        ]
                                    );
                                }}
                                activeOpacity={0.9}
                            >
                                <View style={styles.heroContent}>
                                    <View style={styles.shutterRing}><View style={styles.shutterInner} /></View>
                                    <View style={styles.heroTextContainer}>
                                        <Text style={styles.heroTitle}>Scan Meal</Text>
                                        <Text style={styles.heroSubtitle}>Premium Feature - Upgrade to unlock</Text>
                                    </View>
                                    <Ionicons name="lock-closed" size={24} color="#FFF" />
                                </View>
                            </TouchableOpacity>
                        )}

                        <View style={styles.secondaryRow}>
                            {/* Gallery - Premium Only */}
                            {isPremium ? (
                                <TouchableOpacity style={styles.secondaryButton} onPress={pickFromGallery}>
                                    <Feather name="image" size={20} color={looviColors.text.primary} />
                                    <Text style={styles.secondaryText}>Gallery</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.secondaryButton, { opacity: 0.6 }]}
                                    onPress={() => {
                                        Alert.alert(
                                            'Premium Feature',
                                            'Image analysis is a premium feature. You can still add food manually by typing.',
                                            [
                                                { text: 'OK' },
                                                {
                                                    text: 'Upgrade',
                                                    onPress: () => {
                                                        handleClose();
                                                        onShowPaywall?.();
                                                    }
                                                }
                                            ]
                                        );
                                    }}
                                >
                                    <Ionicons name="lock-closed" size={20} color={looviColors.text.primary} />
                                    <Text style={styles.secondaryText}>Gallery</Text>
                                </TouchableOpacity>
                            )}
                            {/* Text Input / Manual Entry - Available for All */}
                            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('text-input')}>
                                <Feather name="edit-2" size={20} color={looviColors.text.primary} />
                                <Text style={styles.secondaryText}>{isPremium ? 'Type' : 'Manual Entry'}</Text>
                            </TouchableOpacity>
                        </View>

                        {pinnedFoods.length > 0 && (
                            <View style={styles.recentSection}>
                                <Text style={styles.recentHeader}>PINNED FOODS</Text>
                                {pinnedFoods.map((item) => (
                                    <View key={item.id} style={styles.recentRow}>
                                        <TouchableOpacity
                                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                                            onPress={() => quickAddRecent(item)}
                                        >
                                            <View style={styles.recentIconWrapper}><Text>📌</Text></View>
                                            <View style={styles.recentInfo}>
                                                <Text style={styles.recentName} numberOfLines={1}>{item.name}</Text>
                                                <Text style={styles.recentDetails}>{item.calories}Cal • {item.sugar}g Sugar</Text>
                                            </View>
                                            <Feather name="plus-circle" size={20} color={looviColors.coralOrange} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={{ paddingLeft: 12, paddingVertical: 4 }}
                                            onPress={async () => {
                                                await unpinItem(item.name);
                                                loadRecentFoods();
                                            }}
                                        >
                                            <Feather name="x" size={16} color={looviColors.text.tertiary} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        {recentFoods.length > 0 && (
                            <View style={styles.recentSection}>
                                <Text style={styles.recentHeader}>Recently Logged</Text>
                                {recentFoods.map((item) => (
                                    <View key={item.id} style={styles.recentRow}>
                                        <TouchableOpacity
                                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                                            onPress={() => quickAddRecent(item)}
                                        >
                                            <View style={styles.recentIconWrapper}><Feather name="clock" size={14} color={looviColors.text.tertiary} /></View>
                                            <View style={styles.recentInfo}>
                                                <Text style={styles.recentName} numberOfLines={1}>{item.name}</Text>
                                                <Text style={styles.recentDetails}>{item.calories}Cal • {item.sugar}g Sugar</Text>
                                            </View>
                                            <Feather name="plus-circle" size={20} color={looviColors.coralOrange} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={{ paddingLeft: 12, paddingVertical: 4 }}
                                            onPress={async () => {
                                                await pinItem(item);
                                                loadRecentFoods();
                                            }}
                                        >
                                            <Feather name="bookmark" size={18} color={looviColors.text.tertiary} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                );

            case 'describe':
                return (
                    <View style={styles.stepContainer}>
                        <Image source={{ uri: imageUri! }} style={styles.reviewImage} />
                        <View style={styles.reviewContent}>
                            <Text style={styles.stepTitle}>Any specifics?</Text>
                            <TextInput
                                style={styles.descriptionInput}
                                placeholder="e.g. 'Low fat', 'No sugar added'..."
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                blurOnSubmit
                            />
                            <View style={styles.actionRow}>
                                <TouchableOpacity style={styles.ghostButton} onPress={processImage}><Text style={styles.ghostButtonText}>Skip</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.primaryButton} onPress={processImage}>
                                    <Text style={styles.primaryButtonText}>Analyze</Text>
                                    <Feather name="arrow-right" size={18} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                );

            case 'text-input':
                return (
                    <ScrollView 
                        style={styles.scrollContainer}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.scrollContent}
                    >
                        <View style={styles.stepContainer}>
                            <View style={styles.header}>
                                <Text style={styles.headerTitle}>Manual Entry</Text>
                            </View>

                            {/* Food Name */}
                            <View style={styles.foodNameSection}>
                                <Text style={styles.sectionTitle}>Food Name</Text>
                                <TextInput
                                    style={styles.foodNameInput}
                                    placeholder="e.g. Banana, Sandwich..."
                                    value={textOnlyInput}
                                    onChangeText={setTextOnlyInput}
                                    autoFocus
                                />
                            </View>

                            {/* Image Picker */}
                            <View style={styles.imageSection}>
                                <Text style={styles.sectionTitle}>Photo (Optional)</Text>
                                {manualImageUri ? (
                                    <View style={styles.imagePreviewContainer}>
                                        <Image source={{ uri: manualImageUri }} style={styles.imagePreview} />
                                        <TouchableOpacity 
                                            style={styles.removeImageButton}
                                            onPress={() => setManualImageUri(null)}
                                        >
                                            <Feather name="x" size={16} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity 
                                        style={styles.addImageButton}
                                        onPress={pickImageForManual}
                                    >
                                        <Feather name="image" size={20} color={looviColors.text.secondary} />
                                        <Text style={styles.addImageText}>Add Photo</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Nutrition Facts */}
                            <View style={styles.nutritionSection}>
                                <Text style={styles.sectionTitle}>Nutrition Facts</Text>
                                <View style={styles.nutritionCard}>
                                    <View style={styles.nutritionRow}>
                                        <Text style={styles.nutritionLabel}>Calories</Text>
                                        <View style={styles.nutritionInputContainer}>
                                            <TextInput
                                                style={styles.nutritionInput}
                                                placeholder="0"
                                                keyboardType="numeric"
                                                value={manualCalories}
                                                onChangeText={setManualCalories}
                                            />
                                            <Text style={styles.nutritionUnit}>kcal</Text>
                                        </View>
                                    </View>
                                    <View style={styles.nutritionRow}>
                                        <Text style={styles.nutritionLabel}>Sugar (Total)</Text>
                                        <View style={styles.nutritionInputContainer}>
                                            <TextInput
                                                style={styles.nutritionInput}
                                                placeholder="0"
                                                keyboardType="numeric"
                                                value={manualSugar}
                                                onChangeText={setManualSugar}
                                            />
                                            <Text style={styles.nutritionUnit}>g</Text>
                                        </View>
                                    </View>
                                    <View style={styles.nutritionRow}>
                                        <Text style={styles.nutritionLabel}>Protein</Text>
                                        <View style={styles.nutritionInputContainer}>
                                            <TextInput
                                                style={styles.nutritionInput}
                                                placeholder="0"
                                                keyboardType="numeric"
                                                value={manualProtein}
                                                onChangeText={setManualProtein}
                                            />
                                            <Text style={styles.nutritionUnit}>g</Text>
                                        </View>
                                    </View>
                                    <View style={styles.nutritionRow}>
                                        <Text style={styles.nutritionLabel}>Carbohydrates</Text>
                                        <View style={styles.nutritionInputContainer}>
                                            <TextInput
                                                style={styles.nutritionInput}
                                                placeholder="0"
                                                keyboardType="numeric"
                                                value={manualCarbs}
                                                onChangeText={setManualCarbs}
                                            />
                                            <Text style={styles.nutritionUnit}>g</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.nutritionRow, styles.nutritionRowLast]}>
                                        <Text style={styles.nutritionLabel}>Fat</Text>
                                        <View style={styles.nutritionInputContainer}>
                                            <TextInput
                                                style={styles.nutritionInput}
                                                placeholder="0"
                                                keyboardType="numeric"
                                                value={manualFat}
                                                onChangeText={setManualFat}
                                            />
                                            <Text style={styles.nutritionUnit}>g</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Recent Foods */}
                            {pinnedFoods.length > 0 && (
                                <View style={styles.recentSection}>
                                    <Text style={styles.recentHeader}>PINNED FOODS</Text>
                                    {pinnedFoods.map((item) => (
                                        <View key={item.id} style={styles.recentRow}>
                                            <TouchableOpacity
                                                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                                                onPress={() => quickAddRecent(item)}
                                            >
                                                <View style={styles.recentIconWrapper}><Text>📌</Text></View>
                                                <View style={styles.recentInfo}>
                                                    <Text style={styles.recentName} numberOfLines={1}>{item.name}</Text>
                                                    <Text style={styles.recentDetails}>{item.calories}Cal • {item.sugar}g Sugar</Text>
                                                </View>
                                                <Feather name="plus-circle" size={20} color={looviColors.coralOrange} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {recentFoods.length > 0 && (
                                <View style={styles.recentSection}>
                                    <Text style={styles.recentHeader}>Recently Logged</Text>
                                    {recentFoods.map((item) => (
                                        <View key={item.id} style={styles.recentRow}>
                                            <TouchableOpacity
                                                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                                                onPress={() => quickAddRecent(item)}
                                            >
                                                <View style={styles.recentIconWrapper}><Feather name="clock" size={14} color={looviColors.text.tertiary} /></View>
                                                <View style={styles.recentInfo}>
                                                    <Text style={styles.recentName} numberOfLines={1}>{item.name}</Text>
                                                    <Text style={styles.recentDetails}>{item.calories}Cal • {item.sugar}g Sugar</Text>
                                                </View>
                                                <Feather name="plus-circle" size={20} color={looviColors.coralOrange} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}

                            <View style={styles.bottomActions}>
                                <TouchableOpacity onPress={() => {
                                    if (isPremium) {
                                        setStep('select');
                                    } else {
                                        // Free users go back to select step (which shows locked features)
                                        setStep('select');
                                    }
                                }}>
                                    <Text style={styles.ghostButtonText}>Back</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.primaryButton, !textOnlyInput.trim() && { opacity: 0.5 }]}
                                    onPress={processTextOnly}
                                    disabled={!textOnlyInput.trim()}
                                >
                                    <Text style={styles.primaryButtonText}>Review & Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                );

            case 'analyzing':
                return (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={looviColors.coralOrange} />
                        <Text style={styles.analyzingTitle}>Identifying...</Text>
                    </View>
                );

            case 'result':
                const healthColor = result ? getHealthScoreColor(result.healthScore) : looviColors.accent.success;
                return (
                    <View style={styles.resultContainer}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.resultHeader}>
                                {imageUri ? <Image source={{ uri: imageUri }} style={styles.resultImage} /> : <View style={styles.resultPlaceholder}><Feather name="list" size={40} color={looviColors.text.muted} /></View>}
                                <View style={styles.resultTitleOverlay}>
                                    <Text style={styles.resultFoodName}>{editedName || result?.foodName}</Text>
                                </View>
                            </View>
                            <View style={styles.resultBody}>
                                <View style={styles.scoreCard}>
                                    <View style={styles.scoreLeft}>
                                        <Text style={styles.scoreLabel}>Health Score</Text>
                                        <Text style={[styles.scoreValue, { color: healthColor }]}>{result?.healthScore}<Text style={styles.scoreTotal}>/10</Text></Text>
                                    </View>
                                    <View style={styles.scoreRight}>
                                        <Text style={styles.sugarValue}>{(result ? result.sugar * portionPercent / 100 : 0).toFixed(1)}g</Text>
                                        <Text style={styles.sugarLabel}>Sugar</Text>
                                    </View>
                                </View>
                                <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Portion</Text><Text style={styles.sectionValue}>{portionPercent}%</Text></View>
                                <Slider style={styles.slider} minimumValue={0} maximumValue={150} step={10} value={portionPercent} onValueChange={setPortionPercent} minimumTrackTintColor={looviColors.coralOrange} thumbTintColor={looviColors.coralOrange} />
                                <View style={styles.macrosGrid}>
                                    <View style={styles.macroBox}><Text style={styles.macroVal}>{Math.round((result?.calories || 0) * portionPercent / 100)}</Text><Text style={styles.macroLbl}>kcal</Text></View>
                                    <View style={styles.macroBox}><Text style={styles.macroVal}>{((result?.protein || 0) * portionPercent / 100).toFixed(1)}</Text><Text style={styles.macroLbl}>Prot</Text></View>
                                    <View style={styles.macroBox}><Text style={styles.macroVal}>{((result?.carbs || 0) * portionPercent / 100).toFixed(1)}</Text><Text style={styles.macroLbl}>Carb</Text></View>
                                    <View style={styles.macroBox}><Text style={styles.macroVal}>{((result?.fat || 0) * portionPercent / 100).toFixed(1)}</Text><Text style={styles.macroLbl}>Fat</Text></View>
                                </View>
                            </View>
                        </ScrollView>
                        <View style={styles.resultFooter}>
                            <TouchableOpacity style={styles.retryButton} onPress={resetState}><Feather name="refresh-ccw" size={20} color={looviColors.text.tertiary} /></TouchableOpacity>
                            <TouchableOpacity style={styles.saveButtonFull} onPress={handleSave}><Text style={styles.saveButtonText}>Log Food</Text><Feather name="check" size={20} color="#FFF" /></TouchableOpacity>
                        </View>
                    </View>
                );
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={styles.keyboardAvoidingView}
            >
                <TouchableWithoutFeedback onPress={handleClose}>
                    <View style={styles.overlay}>
                        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                            <View style={styles.modalCard}>
                                <View style={styles.dragHandle} />
                                {step === 'select' && <TouchableOpacity style={styles.closeBtn} onPress={handleClose}><Feather name="x" size={20} color={looviColors.text.secondary} /></TouchableOpacity>}
                                {renderContent()}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    keyboardAvoidingView: { flex: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', alignItems: 'center' },
    modalCard: { width: '100%', maxWidth: 450, backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', paddingBottom: spacing.xl, marginTop: 60, flex: 1, marginHorizontal: spacing.lg },
    dragHandle: { width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginVertical: 12 },
    closeBtn: { position: 'absolute', top: 16, right: 20, zIndex: 10, padding: 8, backgroundColor: '#F5F5F5', borderRadius: 20 },
    selectContainer: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl },
    header: { marginBottom: spacing.lg, alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: looviColors.text.primary, marginBottom: 4 },
    headerSubtitle: { fontSize: 13, color: looviColors.text.tertiary },
    heroButton: { height: 130, borderRadius: 24, backgroundColor: looviColors.coralOrange, marginBottom: spacing.md, overflow: 'hidden' },
    heroContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl },
    shutterRing: { width: 50, height: 50, borderRadius: 25, borderWidth: 3, borderColor: '#FFF', padding: 4, marginRight: spacing.md },
    shutterInner: { flex: 1, backgroundColor: '#FFF', borderRadius: 20 },
    heroTextContainer: { flex: 1 },
    heroTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
    heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
    secondaryRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
    secondaryButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F7F7', paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: '#EEE' },
    secondaryText: { marginLeft: 8, fontSize: 15, fontWeight: '600', color: looviColors.text.primary },
    recentSection: { marginTop: spacing.sm },
    recentHeader: { fontSize: 11, fontWeight: '800', color: looviColors.text.muted, marginBottom: spacing.sm, textTransform: 'uppercase' },
    recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    recentIconWrapper: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F9F9F9', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    recentInfo: { flex: 1 },
    recentName: { fontSize: 15, fontWeight: '600', color: looviColors.text.primary },
    recentDetails: { fontSize: 12, color: looviColors.text.tertiary },
    stepContainer: { width: '100%', minHeight: 400, padding: spacing.lg },
    reviewImage: { width: '100%', height: 250 },
    reviewContent: { padding: spacing.lg },
    stepTitle: { fontSize: 20, fontWeight: '700', color: looviColors.text.primary, marginBottom: 12 },
    descriptionInput: { backgroundColor: '#F9F9F9', borderRadius: 12, padding: spacing.md, fontSize: 16, minHeight: 80, marginBottom: spacing.xl },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    ghostButton: { paddingHorizontal: 16, paddingVertical: 10 },
    ghostButtonText: { fontSize: 16, color: looviColors.text.tertiary, fontWeight: '600' },
    primaryButton: { backgroundColor: looviColors.coralOrange, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, flexDirection: 'row', alignItems: 'center' },
    primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginRight: 8 },
    textOnlyInput: { backgroundColor: '#F9F9F9', borderRadius: 16, padding: spacing.md, fontSize: 18, minHeight: 120, marginHorizontal: spacing.lg, marginBottom: spacing.lg },
    bottomActions: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.lg, marginTop: spacing.md },
    centerContainer: { padding: 60, alignItems: 'center' },
    analyzingTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
    resultContainer: { width: '100%', flex: 1 },
    resultHeader: { width: '100%', height: 200 },
    resultImage: { width: '100%', height: '100%' },
    resultPlaceholder: { width: '100%', height: '100%', backgroundColor: '#EEE', alignItems: 'center', justifyContent: 'center' },
    resultTitleOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.4)' },
    resultFoodName: { fontSize: 22, fontWeight: '700', color: '#FFF' },
    resultBody: { padding: spacing.lg },
    scoreCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#EEE' },
    scoreLeft: { flex: 1 },
    scoreLabel: { fontSize: 12, color: looviColors.text.tertiary, fontWeight: '600' },
    scoreValue: { fontSize: 32, fontWeight: '800' },
    scoreTotal: { fontSize: 16, color: looviColors.text.muted },
    scoreRight: { alignItems: 'flex-end', justifyContent: 'center' },
    sugarValue: { fontSize: 18, fontWeight: '700', color: looviColors.text.primary },
    sugarLabel: { fontSize: 12, color: looviColors.text.muted },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    sectionTitle: { 
        fontSize: 14, 
        fontWeight: '600', 
        color: looviColors.text.tertiary, 
        textTransform: 'uppercase', 
        letterSpacing: 0.5, 
        marginBottom: spacing.sm 
    },
    sectionValue: { fontSize: 15, fontWeight: '700', color: looviColors.coralOrange },
    slider: { width: '100%', height: 40, marginBottom: 20 },
    macrosGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    macroBox: { alignItems: 'center', flex: 1 },
    macroVal: { fontSize: 16, fontWeight: '700' },
    macroLbl: { fontSize: 11, color: looviColors.text.tertiary },
    resultFooter: { flexDirection: 'row', padding: spacing.lg, gap: 12 },
    retryButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
    saveButtonFull: { flex: 1, backgroundColor: looviColors.coralOrange, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
    saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginRight: 8 },
    // Manual Entry Styles
    scrollContainer: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        paddingBottom: spacing.xl + 100, // Extra padding for keyboard
    },
    foodNameSection: {
        marginBottom: spacing.xl,
    },
    imageSection: {
        marginBottom: spacing.xl,
    },
    imagePreviewContainer: {
        position: 'relative',
        marginTop: spacing.sm,
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: borderRadius.lg,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    removeImageButton: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addImageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        borderStyle: 'dashed',
        marginTop: spacing.sm,
        gap: spacing.xs,
    },
    addImageText: {
        fontSize: 15,
        fontWeight: '500',
        color: looviColors.text.secondary,
    },
    foodNameInput: {
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        fontSize: 16,
        color: looviColors.text.primary,
        marginTop: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    nutritionSection: {
        marginBottom: spacing.xl,
    },
    nutritionCard: {
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginTop: spacing.sm,
    },
    nutritionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    nutritionRowLast: {
        borderBottomWidth: 0,
    },
    nutritionLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: looviColors.text.primary,
    },
    nutritionInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nutritionInput: {
        fontSize: 16,
        fontWeight: '700',
        color: looviColors.text.primary,
        minWidth: 50,
        textAlign: 'right',
        paddingVertical: 0,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    nutritionUnit: {
        fontSize: 12,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        marginLeft: 4,
    },
});
