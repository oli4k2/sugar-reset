/**
 * FoodScannerModal
 * 
 * High-end, premium modal for scanning food items.
 * Prioritizes the "Scan" action while keeping other options accessible.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    Animated,
    Easing,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    getScannedItemsForDate,
    getPinnedItems,
    pinItem,
    unpinItem,
} from '../services/scannerService';
import { useUserData } from '../context/UserDataContext';
import { useRevenueCat } from '../hooks/useRevenueCat';

const DAILY_SCAN_LIMIT = 25;

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
    const { isPremium, isLoading: isPremiumLoading } = useRevenueCat();
    
    // Debug premium status - log when modal opens to help diagnose premium access issues
    useEffect(() => {
        if (visible && !isPremiumLoading) {
            console.log('🔍 FoodScannerModal - Premium status:', { 
                isPremium, 
                isPremiumLoading, 
                selectedDate,
                timestamp: new Date().toISOString()
            });
            
            // Warn if premium check seems incorrect
            if (!isPremium && visible) {
                console.warn('⚠️ Camera feature may be blocked - isPremium is false');
            }
        }
    }, [visible, isPremium, isPremiumLoading, selectedDate]);
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
    const [todayScanCount, setTodayScanCount] = useState(0);

    // Editable result fields
    const [editCalories, setEditCalories] = useState('');
    const [editProtein, setEditProtein] = useState('');
    const [editCarbs, setEditCarbs] = useState('');
    const [editFat, setEditFat] = useState('');
    const [editSugar, setEditSugar] = useState('');
    const [editAddedSugar, setEditAddedSugar] = useState('');
    const [editNaturalSugar, setEditNaturalSugar] = useState('');
    const [editFiber, setEditFiber] = useState('');
    const [editSodium, setEditSodium] = useState('');

    // Manual entry state
    const [manualCalories, setManualCalories] = useState('');
    const [manualSugar, setManualSugar] = useState('');
    const [manualNaturalSugar, setManualNaturalSugar] = useState('');
    const [manualCarbs, setManualCarbs] = useState('');
    const [manualProtein, setManualProtein] = useState('');
    const [manualFat, setManualFat] = useState('');
    const [manualFiber, setManualFiber] = useState('');
    const [manualSodium, setManualSodium] = useState('');
    const [manualImageUri, setManualImageUri] = useState<string | null>(null);

    // Scan animation state
    const [scanComplete, setScanComplete] = useState(false);
    const scanLineAnim = useRef(new Animated.Value(0)).current;
    const scanFlashAnim = useRef(new Animated.Value(0)).current;
    const scanLineLoop = useRef<Animated.CompositeAnimation | null>(null);

    const { refreshStreakFromFoodLogs } = useUserData();

    useEffect(() => {
        if (visible) {
            console.log('FoodScannerModal visible');
            loadRecentFoods();
            loadTodayScanCount();
            // Always start at select step
            setStep('select');
        }
    }, [visible, isPremium]);

    // Start / stop scan line animation when step changes
    useEffect(() => {
        if (step === 'analyzing' && imageUri) {
            // Only start scan animation if there's an image
            setScanComplete(false);
            scanFlashAnim.setValue(0);
            scanLineAnim.setValue(0);
            const loop = Animated.loop(
                Animated.sequence([
                    Animated.timing(scanLineAnim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(scanLineAnim, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                ])
            );
            scanLineLoop.current = loop;
            loop.start();
        } else {
            scanLineLoop.current?.stop();
            scanLineLoop.current = null;
        }
    }, [step, imageUri]);

    const loadTodayScanCount = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const todayItems = await getScannedItemsForDate(today);
            setTodayScanCount(todayItems.length);
        } catch (e) {
            console.error('Error loading scan count:', e);
        }
    };

    const checkDailyLimit = (): boolean => {
        if (todayScanCount >= DAILY_SCAN_LIMIT) {
            Alert.alert(
                'Daily Limit Reached',
                `You've reached the maximum of ${DAILY_SCAN_LIMIT} scans for today. Come back tomorrow!`,
                [{ text: 'OK' }]
            );
            return false;
        }
        return true;
    };

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
        setScanComplete(false);
        scanFlashAnim.setValue(0);
        // Reset manual fields
        setManualCalories('');
        setManualSugar('');
        setManualNaturalSugar('');
        setManualCarbs('');
        setManualProtein('');
        setManualFat('');
        setManualFiber('');
        setManualSodium('');
        setManualImageUri(null);
        // Reset editable result fields
        setEditCalories('');
        setEditProtein('');
        setEditCarbs('');
        setEditFat('');
        setEditSugar('');
        setEditAddedSugar('');
        setEditNaturalSugar('');
        setEditFiber('');
        setEditSodium('');
    };

    /** Show green success flash then transition to result step */
    const showScanSuccess = useCallback((res: AnalysisResult) => {
        setResult(res);
        setEditedName(res.foodName);
        populateEditFields(res);
        setScanComplete(true);

        // Green flash animation
        Animated.timing(scanFlashAnim, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        }).start(() => {
            // Hold green briefly then transition
            setTimeout(() => {
                setStep('result');
                setScanComplete(false);
                scanFlashAnim.setValue(0);
            }, 400);
        });
    }, []);

    // Populate edit fields when result arrives
    const populateEditFields = (res: AnalysisResult) => {
        setEditCalories(String(res.calories));
        setEditProtein(String(res.protein));
        setEditCarbs(String(res.carbs));
        setEditFat(String(res.fat));
        setEditSugar(String(res.sugar));
        setEditAddedSugar(String(res.addedSugar ?? 0));
        setEditNaturalSugar(String(res.naturalSugar ?? 0));
        setEditFiber(String(res.fiber ?? 0));
        setEditSodium(String(res.sodium ?? 0));
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
        if (!checkDailyLimit()) return;

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
        if (!checkDailyLimit()) return;

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
            showScanSuccess(res);
        } catch (error: any) {
            const message = error?.message ?? '';
            if (message.includes('GEMINI_API_KEY_MISSING')) {
                Alert.alert(
                    'API Key Required',
                    'Please add your Gemini API key to the .env file as EXPO_PUBLIC_GEMINI_API_KEY.',
                    [{ text: 'OK' }]
                );
            } else if (message.includes('API Key not found') || message.includes('API_KEY_INVALID')) {
                Alert.alert(
                    'API Key Issue',
                    'The Gemini API key appears invalid or not loaded. Please restart the dev server to pick up .env changes.\n\n(Ctrl+C, then npx expo start --dev-client -c)',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert('Analysis Failed', `Could not analyse the image. ${message ? message : 'Please try again.'}`);
            }
            resetState();
        }
    };

    const processTextOnly = async () => {
        if (!textOnlyInput.trim()) return;

        // When the user is on the manual entry step (text-input), ALWAYS use
        // their entered values — never send to AI.  AI analysis is only used
        // when the quick-input on the select screen is submitted.
        const isManualEntry = step === 'text-input';

        if (isManualEntry || manualCalories || manualSugar) {
            const addedSugarVal = parseFloat(manualSugar) || 0;
            const naturalSugarVal = parseFloat(manualNaturalSugar) || 0;
            const totalSugar = addedSugarVal + naturalSugarVal;
            const manualResult: AnalysisResult = {
                foodName: textOnlyInput.trim(),
                calories: parseInt(manualCalories) || 0,
                protein: parseFloat(manualProtein) || 0,
                carbs: parseFloat(manualCarbs) || 0,
                carbsSugars: totalSugar,
                fat: parseFloat(manualFat) || 0,
                fatSaturated: 0,
                fiber: parseFloat(manualFiber) || 0,
                sugar: totalSugar,
                addedSugar: addedSugarVal,
                naturalSugar: naturalSugarVal,
                sodium: parseFloat(manualSodium) || 0,
                healthScore: 0, // Will be calculated
                confidence: 1.0,
                suggestion: 'Manually entered — only added sugar counts toward your streak.'
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
            populateEditFields(manualResult);
            if (manualImageUri) setImageUri(manualImageUri);
            setStep('result');
            return;
        }

        // AI text analysis (from the quick-input on the select screen)
        if (!checkDailyLimit()) return;
        setStep('analyzing');
        try {
            const res = await analyzeFood('', textOnlyInput.trim());
            showScanSuccess(res);
        } catch (error: any) {
            const message = error?.message ?? '';
            if (message.includes('GEMINI_API_KEY_MISSING')) {
                Alert.alert(
                    'API Key Required',
                    'Please add your Gemini API key to the .env file as EXPO_PUBLIC_GEMINI_API_KEY.',
                    [{ text: 'OK' }]
                );
            } else if (message.includes('API Key not found') || message.includes('API_KEY_INVALID')) {
                Alert.alert(
                    'API Key Issue',
                    'The Gemini API key appears invalid or not loaded. Please restart the dev server to pick up .env changes.\n\n(Ctrl+C, then npx expo start --dev-client -c)',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert('Analysis Failed', `Could not analyse the food. ${message ? message : 'Please try again.'}`);
            }
            resetState();
        }
    };

    const handleSave = async () => {
        if (!result) return;
        const portionMultiplier = portionPercent / 100;
        const timestamp = selectedDate ? new Date(selectedDate + 'T12:00:00').toISOString() : new Date().toISOString();

        // Use edited values instead of raw result
        const cal = parseFloat(editCalories) || result.calories;
        const prot = parseFloat(editProtein) || result.protein;
        const carb = parseFloat(editCarbs) || result.carbs;
        const fatVal = parseFloat(editFat) || result.fat;
        const sug = parseFloat(editSugar) || result.sugar;
        const addSug = parseFloat(editAddedSugar) || (result.addedSugar ?? 0);
        const natSug = parseFloat(editNaturalSugar) || (result.naturalSugar ?? 0);
        const fib = parseFloat(editFiber) || (result.fiber ?? 0);
        const sod = parseFloat(editSodium) || (result.sodium ?? 0);

        const scannedItem: ScannedItem = {
            id: generateScanId(),
            imageUri: imageUri || manualImageUri || '',
            name: editedName || result.foodName,
            timestamp,
            portionPercent,
            calories: Math.round(cal * portionMultiplier),
            protein: Math.round(prot * portionMultiplier * 10) / 10,
            carbs: Math.round(carb * portionMultiplier * 10) / 10,
            carbsSugars: Math.round(sug * portionMultiplier * 10) / 10,
            fat: Math.round(fatVal * portionMultiplier * 10) / 10,
            fatSaturated: Math.round(result.fatSaturated * portionMultiplier * 10) / 10,
            fiber: Math.round(fib * portionMultiplier * 10) / 10,
            sugar: Math.round(sug * portionMultiplier * 10) / 10,
            addedSugar: Math.round(addSug * portionMultiplier * 10) / 10,
            naturalSugar: Math.round(natSug * portionMultiplier * 10) / 10,
            sodium: Math.round(sod * portionMultiplier),
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
                            <TouchableOpacity
                                style={styles.heroButton}
                                onPress={takePhoto}
                                activeOpacity={0.9}
                            >
                                <View style={styles.heroContent}>
                                    <View style={styles.shutterRing}><View style={styles.shutterInner} /></View>
                                    <View style={styles.heroTextContainer}>
                                        <Text style={styles.heroTitle}>Scan Meal</Text>
                                        <Text style={styles.heroSubtitle}>Capture or upload food</Text>
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

                        {/* Quick AI Text Input - Premium Only */}
                        {isPremium ? (
                            <View style={styles.quickInputContainer}>
                                <TextInput
                                    style={styles.quickInput}
                                    placeholder="Describe meal (e.g. Oatmeal with berries)..."
                                    placeholderTextColor={looviColors.text.tertiary}
                                    value={textOnlyInput}
                                    onChangeText={setTextOnlyInput}
                                    onSubmitEditing={processTextOnly}
                                    returnKeyType="go"
                                />
                                <TouchableOpacity
                                    style={[styles.quickSendButton, { opacity: textOnlyInput.trim() ? 1 : 0.6 }]}
                                    onPress={processTextOnly}
                                    disabled={!textOnlyInput.trim()}
                                >
                                    <Feather name="arrow-up" size={20} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.quickInputContainer, { opacity: 0.8, backgroundColor: '#F5F5F5', borderColor: '#EEE' }]}
                                onPress={() => {
                                    Alert.alert(
                                        'Premium Feature',
                                        'AI food analysis from text description is a premium feature.',
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
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.quickInput, { color: looviColors.text.muted, textAlignVertical: 'center', paddingVertical: 12 }]}>Describe meal (Premium)</Text>
                                <View style={[styles.quickSendButton, { backgroundColor: '#E0E0E0' }]}>
                                    <Ionicons name="lock-closed" size={16} color={looviColors.text.muted} />
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
                                <Text style={styles.secondaryText}>Manual Entry</Text>
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
                                                <Text style={styles.recentDetails}>{item.calories}Cal • {item.addedSugar ?? 0}g Added Sugar</Text>
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
                                                <Text style={styles.recentDetails}>{item.calories}Cal • {item.addedSugar ?? 0}g Added Sugar</Text>
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
                            <View style={styles.describeTitleRow}>
                                <Feather name="message-circle" size={22} color={looviColors.coralOrange} />
                                <Text style={styles.stepTitle}>Help us get it right! ✨</Text>
                            </View>
                            <Text style={styles.describeHint}>Tell us a little about your meal — anything that helps us identify it better, like brand, portion size, or dietary notes.</Text>
                            <TextInput
                                style={styles.descriptionInput}
                                placeholder="e.g. 'It's a small portion', 'Sugar-free version', 'Homemade with oat milk'..."
                                placeholderTextColor={looviColors.text.muted}
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
                                        <View>
                                            <Text style={styles.nutritionLabel}>Added Sugar</Text>
                                            <Text style={styles.nutritionHint}>Counts toward streak</Text>
                                        </View>
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
                                    <View style={styles.nutritionRow}>
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
                                    <View style={styles.nutritionRow}>
                                        <View>
                                            <Text style={styles.nutritionLabel}>Natural Sugar</Text>
                                            <Text style={styles.nutritionHint}>From fruit, dairy</Text>
                                        </View>
                                        <View style={styles.nutritionInputContainer}>
                                            <TextInput
                                                style={styles.nutritionInput}
                                                placeholder="0"
                                                keyboardType="numeric"
                                                value={manualNaturalSugar}
                                                onChangeText={setManualNaturalSugar}
                                            />
                                            <Text style={styles.nutritionUnit}>g</Text>
                                        </View>
                                    </View>
                                    <View style={styles.nutritionRow}>
                                        <Text style={styles.nutritionLabel}>Fiber</Text>
                                        <View style={styles.nutritionInputContainer}>
                                            <TextInput
                                                style={styles.nutritionInput}
                                                placeholder="0"
                                                keyboardType="numeric"
                                                value={manualFiber}
                                                onChangeText={setManualFiber}
                                            />
                                            <Text style={styles.nutritionUnit}>g</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.nutritionRow, styles.nutritionRowLast]}>
                                        <Text style={styles.nutritionLabel}>Sodium</Text>
                                        <View style={styles.nutritionInputContainer}>
                                            <TextInput
                                                style={styles.nutritionInput}
                                                placeholder="0"
                                                keyboardType="numeric"
                                                value={manualSodium}
                                                onChangeText={setManualSodium}
                                            />
                                            <Text style={styles.nutritionUnit}>mg</Text>
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
                                                    <Text style={styles.recentDetails}>{item.calories}Cal • {item.addedSugar ?? 0}g Added Sugar</Text>
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
                                                    <Text style={styles.recentDetails}>{item.calories}Cal • {item.addedSugar ?? 0}g Added Sugar</Text>
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
                const scanImageHeight = 260;
                
                // If no image (text-only input), show simple circular loading animation
                if (!imageUri) {
                    return (
                        <View style={styles.analyzingContainer}>
                            <View style={styles.simpleLoadingContainer}>
                                <ActivityIndicator size="large" color={looviColors.coralOrange} />
                            </View>
                            <View style={styles.analyzingTextContainer}>
                                {scanComplete ? (
                                    <>
                                        <Text style={[styles.analyzingTitle, { color: '#10B981' }]}>Analysis Complete ✓</Text>
                                        <Text style={styles.analyzingSubtitle}>Preparing your results…</Text>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.analyzingTitle}>Analyzing with AI...</Text>
                                        <Text style={styles.analyzingSubtitle}>Craveless is identifying sugars & macros</Text>
                                    </>
                                )}
                            </View>
                        </View>
                    );
                }
                
                // If image exists, show scan animation
                return (
                    <View style={styles.analyzingContainer}>
                        {/* Image or placeholder */}
                        <View style={styles.scanImageWrapper}>
                            <Image source={{ uri: imageUri }} style={styles.scanImage} />

                            {/* Scan line overlay */}
                            <Animated.View
                                style={[
                                    styles.scanLineContainer,
                                    {
                                        transform: [{
                                            translateY: scanLineAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, scanImageHeight - 4],
                                            }),
                                        }],
                                    },
                                ]}
                            >
                                <LinearGradient
                                    colors={[
                                        'transparent',
                                        scanComplete ? 'rgba(16, 185, 129, 0.6)' : 'rgba(232, 168, 124, 0.6)',
                                        scanComplete ? 'rgba(16, 185, 129, 0.9)' : 'rgba(232, 168, 124, 0.9)',
                                        scanComplete ? 'rgba(16, 185, 129, 0.6)' : 'rgba(232, 168, 124, 0.6)',
                                        'transparent',
                                    ]}
                                    style={styles.scanLineGradient}
                                />
                                <View style={[
                                    styles.scanLineBright,
                                    scanComplete && styles.scanLineBrightSuccess,
                                ]} />
                            </Animated.View>

                            {/* Corner brackets */}
                            <View style={[styles.scanCorner, styles.scanCornerTL]} />
                            <View style={[styles.scanCorner, styles.scanCornerTR]} />
                            <View style={[styles.scanCorner, styles.scanCornerBL]} />
                            <View style={[styles.scanCorner, styles.scanCornerBR]} />

                            {/* Green success overlay */}
                            <Animated.View
                                style={[
                                    StyleSheet.absoluteFill,
                                    styles.scanSuccessOverlay,
                                    { opacity: scanFlashAnim },
                                ]}
                                pointerEvents="none"
                            >
                                <Feather name="check-circle" size={56} color="#FFF" />
                            </Animated.View>
                        </View>

                        {/* Status text */}
                        <View style={styles.analyzingTextContainer}>
                            {scanComplete ? (
                                <>
                                    <Text style={[styles.analyzingTitle, { color: '#10B981' }]}>Analysis Complete ✓</Text>
                                    <Text style={styles.analyzingSubtitle}>Preparing your results…</Text>
                                </>
                            ) : (
                                <>
                                    <ActivityIndicator size="small" color={looviColors.coralOrange} style={{ marginBottom: 8 }} />
                                    <Text style={styles.analyzingTitle}>Scanning with AI...</Text>
                                    <Text style={styles.analyzingSubtitle}>We are analyzing sugars & macros</Text>
                                </>
                            )}
                        </View>
                    </View>
                );

            case 'result':
                const healthColor = result ? getHealthScoreColor(result.healthScore) : looviColors.accent.success;
                const pMul = portionPercent / 100;
                return (
                    <View style={styles.resultContainer}>
                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <View style={styles.resultHeader}>
                                {imageUri ? <Image source={{ uri: imageUri }} style={styles.resultImage} /> : <View style={styles.resultPlaceholder}><Feather name="list" size={40} color={looviColors.text.muted} /></View>}
                                <View style={styles.resultTitleOverlay}>
                                    <Text style={styles.resultFoodName}>{editedName || result?.foodName}</Text>
                                </View>
                            </View>

                            {/* Editable hint */}
                            <View style={styles.editHintRow}>
                                <Feather name="edit-3" size={12} color={looviColors.text.muted} />
                                <Text style={styles.editHintText}>All values can be edited — tap any number to adjust</Text>
                            </View>

                            <View style={styles.resultBody}>
                                {/* AI Interpretation */}
                                {result?.suggestion && result.suggestion !== 'Manually entered' && result.suggestion !== 'Manually entered — only added sugar counts toward your streak.' && (
                                    <View style={styles.aiInterpretation}>
                                        <Feather name="cpu" size={14} color={looviColors.text.tertiary} />
                                        <Text style={styles.aiInterpretationText}>{result.suggestion}</Text>
                                    </View>
                                )}

                                {/* Portion — always visible */}
                                <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Portion</Text><Text style={styles.sectionValue}>{portionPercent}%</Text></View>
                                <Slider style={styles.sliderCompact} minimumValue={0} maximumValue={100} step={10} value={portionPercent} onValueChange={(value) => setPortionPercent(Math.min(100, value))} minimumTrackTintColor={looviColors.coralOrange} thumbTintColor={looviColors.coralOrange} />

                                {/* Score + Macros combined card */}
                                <View style={styles.scoreCard}>
                                    <View style={styles.scoreTopRow}>
                                        <View style={styles.scoreLeft}>
                                            <Text style={styles.scoreLabel}>Health Score</Text>
                                            <Text style={[styles.scoreValue, { color: healthColor }]}>{result?.healthScore}<Text style={styles.scoreTotal}>/100</Text></Text>
                                        </View>
                                        <View style={styles.scoreRight}>
                                            <Text style={styles.sugarValue}>{((parseFloat(editSugar) || 0) * pMul).toFixed(1)}g</Text>
                                            <Text style={styles.sugarLabel}>Total Sugar</Text>
                                        </View>
                                    </View>
                                    {/* Inline macros row */}
                                    <View style={styles.inlineMacrosRow}>
                                        <View style={styles.inlineMacroItem}>
                                            <TextInput style={styles.inlineMacroValue} value={editCalories} onChangeText={setEditCalories} keyboardType="numeric" />
                                            <Text style={styles.inlineMacroLabel}>kcal</Text>
                                        </View>
                                        <View style={styles.inlineMacroDivider} />
                                        <View style={styles.inlineMacroItem}>
                                            <TextInput style={styles.inlineMacroValue} value={editProtein} onChangeText={setEditProtein} keyboardType="numeric" />
                                            <Text style={styles.inlineMacroLabel}>Protein</Text>
                                        </View>
                                        <View style={styles.inlineMacroDivider} />
                                        <View style={styles.inlineMacroItem}>
                                            <TextInput style={styles.inlineMacroValue} value={editCarbs} onChangeText={setEditCarbs} keyboardType="numeric" />
                                            <Text style={styles.inlineMacroLabel}>Carbs</Text>
                                        </View>
                                        <View style={styles.inlineMacroDivider} />
                                        <View style={styles.inlineMacroItem}>
                                            <TextInput style={styles.inlineMacroValue} value={editFat} onChangeText={setEditFat} keyboardType="numeric" />
                                            <Text style={styles.inlineMacroLabel}>Fat</Text>
                                        </View>
                                        <View style={styles.inlineMacroDivider} />
                                        <View style={styles.inlineMacroItem}>
                                            <TextInput style={styles.inlineMacroValue} value={editFiber} onChangeText={setEditFiber} keyboardType="numeric" />
                                            <Text style={styles.inlineMacroLabel}>Fiber</Text>
                                        </View>
                                        <View style={styles.inlineMacroDivider} />
                                        <View style={styles.inlineMacroItem}>
                                            <TextInput style={styles.inlineMacroValue} value={editSodium} onChangeText={setEditSodium} keyboardType="numeric" />
                                            <Text style={styles.inlineMacroLabel}>Sodium</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Sugar Breakdown - Added vs Natural */}
                                <View style={styles.sugarBreakdownCard}>
                                    <Text style={styles.sugarBreakdownTitle}>Sugar Breakdown</Text>
                                    <View style={styles.sugarBreakdownRow}>
                                        <View style={styles.sugarBreakdownItem}>
                                            <View style={styles.sugarIconRow}>
                                                <View style={[styles.sugarDot, { backgroundColor: '#EF4444' }]} />
                                                <Ionicons name="warning" size={12} color="#EF4444" />
                                            </View>
                                            <View style={styles.sugarEditRow}>
                                                <TextInput
                                                    style={[styles.sugarBreakdownValue, { color: '#EF4444' }]}
                                                    value={editAddedSugar}
                                                    onChangeText={setEditAddedSugar}
                                                    keyboardType="numeric"
                                                />
                                                <Text style={[styles.sugarBreakdownUnit, { color: '#EF4444' }]}>g</Text>
                                            </View>
                                            <Text style={styles.sugarBreakdownLabel}>Added Sugar</Text>
                                            <Text style={styles.sugarStreakHint}>Counts toward streak</Text>
                                        </View>
                                        <View style={styles.sugarBreakdownDivider} />
                                        <View style={styles.sugarBreakdownItem}>
                                            <View style={styles.sugarIconRow}>
                                                <View style={[styles.sugarDot, { backgroundColor: '#22C55E' }]} />
                                                <Ionicons name="leaf" size={12} color="#22C55E" />
                                            </View>
                                            <View style={styles.sugarEditRow}>
                                                <TextInput
                                                    style={[styles.sugarBreakdownValue, { color: '#22C55E' }]}
                                                    value={editNaturalSugar}
                                                    onChangeText={setEditNaturalSugar}
                                                    keyboardType="numeric"
                                                />
                                                <Text style={[styles.sugarBreakdownUnit, { color: '#22C55E' }]}>g</Text>
                                            </View>
                                            <Text style={styles.sugarBreakdownLabel}>Natural Sugar</Text>
                                            <Text style={styles.sugarStreakHint}>From fruit, dairy</Text>
                                        </View>
                                    </View>
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

    // Analyzing / scan effect
    analyzingContainer: { alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.xl },
    simpleLoadingContainer: { 
        width: 120, 
        height: 120, 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    scanImageWrapper: {
        width: '88%',
        height: 260,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#111',
        alignSelf: 'center',
    },
    scanImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    scanImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center' },
    scanLineContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 4,
        zIndex: 10,
    },
    scanLineGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: -18,
        height: 40,
    },
    scanLineBright: {
        height: 2,
        backgroundColor: 'rgba(232, 168, 124, 0.95)',
        shadowColor: looviColors.coralOrange,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
        elevation: 6,
    },
    scanLineBrightSuccess: {
        backgroundColor: 'rgba(16, 185, 129, 0.95)',
        shadowColor: '#10B981',
    },
    scanCorner: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    scanCornerTL: { top: 8, left: 8, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 6 },
    scanCornerTR: { top: 8, right: 8, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 6 },
    scanCornerBL: { bottom: 8, left: 8, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 6 },
    scanCornerBR: { bottom: 8, right: 8, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 6 },
    scanSuccessOverlay: {
        backgroundColor: 'rgba(16, 185, 129, 0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
    },
    analyzingTextContainer: { alignItems: 'center', marginTop: spacing.lg },
    analyzingTitle: { fontSize: 18, fontWeight: '600', color: looviColors.text.primary },
    analyzingSubtitle: { fontSize: 13, color: looviColors.text.tertiary, marginTop: 6, textAlign: 'center' },

    // Describe step
    describeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    describeHint: { fontSize: 13, color: looviColors.text.tertiary, lineHeight: 18, marginBottom: 12 },

    resultContainer: { width: '100%', flex: 1 },
    resultHeader: { width: '100%', height: 200 },
    resultImage: { width: '100%', height: '100%' },
    resultPlaceholder: { width: '100%', height: '100%', backgroundColor: '#EEE', alignItems: 'center', justifyContent: 'center' },
    resultTitleOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.4)' },
    resultFoodName: { fontSize: 22, fontWeight: '700', color: '#FFF' },
    resultBody: { padding: spacing.md },

    // AI interpretation
    aiInterpretation: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#F9F9F9', borderRadius: 12, marginBottom: 16, gap: 8 },
    aiInterpretationText: { flex: 1, fontSize: 13, fontStyle: 'italic', color: looviColors.text.tertiary, lineHeight: 18 },

    // Edit hint row below image
    editHintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, backgroundColor: '#FAFAFA' },
    editHintText: { fontSize: 11, color: looviColors.text.muted, fontStyle: 'italic' },

    scoreCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
    scoreTopRow: { flexDirection: 'row', marginBottom: 8 },
    scoreLeft: { flex: 1 },
    scoreLabel: { fontSize: 11, color: looviColors.text.tertiary, fontWeight: '600' },
    scoreValue: { fontSize: 26, fontWeight: '800' },
    scoreTotal: { fontSize: 14, color: looviColors.text.muted },
    scoreRight: { alignItems: 'flex-end', justifyContent: 'center' },
    sugarValue: { fontSize: 16, fontWeight: '700', color: looviColors.text.primary },
    sugarLabel: { fontSize: 11, color: looviColors.text.muted },

    // Inline macros row inside scoreCard
    inlineMacrosRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 8 },
    inlineMacroItem: { flex: 1, alignItems: 'center' },
    inlineMacroValue: { fontSize: 14, fontWeight: '700', color: looviColors.text.primary, textAlign: 'center', minWidth: 36, paddingVertical: 0, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
    inlineMacroLabel: { fontSize: 9, color: looviColors.text.muted, marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.3 },
    inlineMacroDivider: { width: 1, height: 24, backgroundColor: '#F0F0F0' },

    // Sugar breakdown
    sugarBreakdownCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
    sugarBreakdownTitle: { fontSize: 11, fontWeight: '700', color: looviColors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    sugarBreakdownRow: { flexDirection: 'row', alignItems: 'center' },
    sugarBreakdownItem: { flex: 1, alignItems: 'center' },
    sugarIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
    sugarDot: { width: 8, height: 8, borderRadius: 4 },
    sugarEditRow: { flexDirection: 'row', alignItems: 'baseline' },
    sugarBreakdownValue: { fontSize: 20, fontWeight: '800', textAlign: 'center', minWidth: 36, paddingVertical: 0 },
    sugarBreakdownUnit: { fontSize: 12, fontWeight: '600' },
    sugarBreakdownLabel: { fontSize: 10, color: looviColors.text.tertiary, marginTop: 1 },
    sugarStreakHint: { fontSize: 8, color: looviColors.text.muted, fontStyle: 'italic', marginTop: 1 },
    sugarBreakdownDivider: { width: 1, height: 36, backgroundColor: '#EEE' },

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
    sliderCompact: { width: '100%', height: 32, marginBottom: 10 },

    // Editable macros
    editableMacrosCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 4, paddingHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: '#EEE' },
    editMacroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    editMacroLabel: { fontSize: 15, fontWeight: '500', color: looviColors.text.primary },
    editMacroInputRow: { flexDirection: 'row', alignItems: 'center' },
    editMacroInput: { fontSize: 16, fontWeight: '700', color: looviColors.text.primary, minWidth: 50, textAlign: 'right', paddingVertical: 0, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)' },
    editMacroUnit: { fontSize: 12, fontWeight: '500', color: looviColors.text.tertiary, marginLeft: 4 },

    macrosGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    macroBox: { alignItems: 'center', flex: 1 },
    macroVal: { fontSize: 16, fontWeight: '700' },
    macroLbl: { fontSize: 11, color: looviColors.text.tertiary },
    resultFooter: { flexDirection: 'row', padding: spacing.lg, gap: 12 },
    retryButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
    saveButtonFull: { flex: 1, backgroundColor: looviColors.coralOrange, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', paddingVertical: 14 },
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
    nutritionHint: { fontSize: 11, color: looviColors.text.muted, fontStyle: 'italic', marginTop: 1 },

    // Quick Input
    quickInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 4,
        paddingLeft: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#EEE',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    quickInput: {
        flex: 1,
        height: 48,
        fontSize: 15,
        color: looviColors.text.primary,
    },
    quickSendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: looviColors.coralOrange,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 4,
    },
});
