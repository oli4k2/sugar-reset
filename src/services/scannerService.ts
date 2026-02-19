/**
 * Scanner Service
 *
 * Handles storage and retrieval of scanned food items.
 * Uses AsyncStorage for persistence.
 * Food analysis is powered by Google Gemini AI (see geminiService.ts).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateFoodHealthScore } from './healthScoringService';
import { analyzeFood as geminiAnalyzeFood } from './geminiService';

const SCANNED_ITEMS_KEY = '@sugar_reset_scanned_items';
const PINNED_ITEMS_KEY = '@sugar_reset_pinned_items';

export interface ScannedItem {
    id: string;
    imageUri: string;
    name: string;
    timestamp: string;
    portionPercent: number;  // 0-100%
    // Macros
    calories: number;
    protein: number;
    carbs: number;
    carbsSugars: number;
    fat: number;
    fatSaturated: number;
    fiber: number;
    sugar: number;          // Total sugars (grams) - includes both added and natural
    addedSugar?: number;    // Added/processed sugar (grams) - for more accurate scoring
    naturalSugar?: number;  // Natural sugar from fruits, dairy (grams)
    sodium: number;         // mg
    healthScore: number;    // 0-10
    // Optional
    suggestion?: string;
    confidence: number;
    pinned?: boolean;  // Whether this item is pinned for quick access
}

export interface AnalysisResult {
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    carbsSugars: number;
    fat: number;
    fatSaturated: number;
    fiber: number;
    sugar: number;
    addedSugar?: number;
    naturalSugar?: number;
    sodium: number;
    healthScore: number;
    confidence: number;
    suggestion?: string;
}

/**
 * Get all scanned items from storage
 */
export const getScannedItems = async (): Promise<ScannedItem[]> => {
    try {
        const stored = await AsyncStorage.getItem(SCANNED_ITEMS_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        return [];
    } catch (error) {
        console.error('Error loading scanned items:', error);
        return [];
    }
};

/**
 * Get scanned items for a specific date
 */
export const getScannedItemsForDate = async (date: string): Promise<ScannedItem[]> => {
    const items = await getScannedItems();
    return items.filter(item => item.timestamp.split('T')[0] === date);
};

/**
 * Save a new scanned item
 * Keeps the 500 most recent items (across all time, not per day)
 */
export const saveScannedItem = async (item: ScannedItem): Promise<void> => {
    try {
        const existing = await getScannedItems();
        const updated = [item, ...existing].slice(0, 500); // Keep last 500 items
        await AsyncStorage.setItem(SCANNED_ITEMS_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Error saving scanned item:', error);
        throw error;
    }
};

/**
 * Update an existing scanned item
 */
export const updateScannedItem = async (item: ScannedItem): Promise<void> => {
    try {
        const existing = await getScannedItems();
        const updated = existing.map(i => i.id === item.id ? item : i);
        await AsyncStorage.setItem(SCANNED_ITEMS_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Error updating scanned item:', error);
        throw error;
    }
};

/**
 * Delete a scanned item by ID
 */
export const deleteScannedItem = async (id: string): Promise<void> => {
    try {
        const existing = await getScannedItems();
        const updated = existing.filter(item => item.id !== id);
        await AsyncStorage.setItem(SCANNED_ITEMS_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Error deleting scanned item:', error);
        throw error;
    }
};

/**
 * Clear all scanned items
 */
export const clearScannedItems = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(SCANNED_ITEMS_KEY);
    } catch (error) {
        console.error('Error clearing scanned items:', error);
        throw error;
    }
};

/**
 * Get all pinned items
 */
export const getPinnedItems = async (): Promise<ScannedItem[]> => {
    try {
        const stored = await AsyncStorage.getItem(PINNED_ITEMS_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        return [];
    } catch (error) {
        console.error('Error loading pinned items:', error);
        return [];
    }
};

/**
 * Pin an item (add to favorites for quick access)
 */
export const pinItem = async (item: ScannedItem): Promise<void> => {
    try {
        const existing = await getPinnedItems();
        // Check if already pinned (by name to avoid duplicates)
        const alreadyPinned = existing.some(p => p.name === item.name);
        if (alreadyPinned) return;

        const pinnedItem = { ...item, pinned: true };
        const updated = [pinnedItem, ...existing].slice(0, 20); // Keep max 20 pinned items
        await AsyncStorage.setItem(PINNED_ITEMS_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Error pinning item:', error);
        throw error;
    }
};

/**
 * Unpin an item (remove from favorites)
 */
export const unpinItem = async (itemName: string): Promise<void> => {
    try {
        const existing = await getPinnedItems();
        const updated = existing.filter(item => item.name !== itemName);
        await AsyncStorage.setItem(PINNED_ITEMS_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Error unpinning item:', error);
        throw error;
    }
};

/**
 * Check if an item is pinned (by name)
 */
export const isItemPinned = async (itemName: string): Promise<boolean> => {
    const pinned = await getPinnedItems();
    return pinned.some(item => item.name === itemName);
};

/**
 * Get food count per day for calendar coloring
 */
export const getFoodCountsByDate = async (): Promise<Record<string, number>> => {
    const items = await getScannedItems();
    const counts: Record<string, number> = {};

    items.forEach(item => {
        const date = item.timestamp.split('T')[0];
        counts[date] = (counts[date] || 0) + 1;
    });

    return counts;
};

/**
 * Analyze food using Google Gemini AI.
 *
 * - If imageUri is provided → Gemini Vision (multimodal image + optional text).
 * - If only description is provided → Gemini text analysis.
 * - Falls back to demo mock data when no API key is set.
 */
export const analyzeFood = async (
    imageUri: string,
    description?: string
): Promise<AnalysisResult> => {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
    const hasKey = apiKey.length > 0 && apiKey !== 'YOUR_GEMINI_API_KEY_HERE';

    if (hasKey) {
        // ── Real Gemini call ────────────────────────────────────────────────
        try {
            return await geminiAnalyzeFood(imageUri, description);
        } catch (error: any) {
            console.error('[scannerService] Gemini analysis failed:', error?.message ?? error);
            // Re-throw so the UI can display the real error rather than silently
            // falling back to incorrect demo data.
            throw error;
        }
    }

    // ── Demo / no-key fallback ──────────────────────────────────────────────
    console.warn('[scannerService] No Gemini API key — returning demo data.');
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockFoods: Omit<AnalysisResult, 'healthScore'>[] = [
        {
            foodName: 'Apple',
            calories: 95, protein: 0.5, carbs: 25, carbsSugars: 19,
            fat: 0.3, fatSaturated: 0.1, fiber: 4.4, sugar: 19,
            addedSugar: 0, naturalSugar: 19,
            sodium: 2, confidence: 0.85,
        },
        {
            foodName: 'Coca-Cola (330ml)',
            calories: 139, protein: 0, carbs: 39, carbsSugars: 39,
            fat: 0, fatSaturated: 0, fiber: 0, sugar: 39,
            addedSugar: 39, naturalSugar: 0,
            sodium: 45, confidence: 0.92,
        },
        {
            foodName: 'Grilled Chicken Breast',
            calories: 165, protein: 31, carbs: 0, carbsSugars: 0,
            fat: 3.6, fatSaturated: 1, fiber: 0, sugar: 0,
            addedSugar: 0, naturalSugar: 0,
            sodium: 74, confidence: 0.88,
        },
        {
            foodName: 'Chocolate Bar',
            calories: 235, protein: 3, carbs: 26, carbsSugars: 24,
            fat: 13, fatSaturated: 8, fiber: 1.5, sugar: 24,
            addedSugar: 22, naturalSugar: 2,
            sodium: 35, confidence: 0.78,
        },
        {
            foodName: 'Greek Yogurt (plain)',
            calories: 100, protein: 17, carbs: 6, carbsSugars: 4,
            fat: 0.7, fatSaturated: 0.3, fiber: 0, sugar: 4,
            addedSugar: 0, naturalSugar: 4,
            sodium: 65, confidence: 0.82,
        },
        {
            foodName: 'Caesar Salad',
            calories: 320, protein: 12, carbs: 14, carbsSugars: 3,
            fat: 24, fatSaturated: 5, fiber: 3, sugar: 3,
            addedSugar: 2, naturalSugar: 1,
            sodium: 580, confidence: 0.75,
        },
    ];

    const randomFood = mockFoods[Math.floor(Math.random() * mockFoods.length)];
    const mockItem: ScannedItem = {
        id: 'temp',
        imageUri: '',
        name: randomFood.foodName,
        timestamp: '',
        portionPercent: 100,
        ...randomFood,
        healthScore: 0,
        confidence: randomFood.confidence,
    };

    const healthScore = calculateFoodHealthScore(mockItem);

    return {
        ...randomFood,
        healthScore: healthScore, // Score is 0-100
        suggestion: '💡 Demo data — add your Gemini API key in .env to enable real AI analysis.',
    };
};

/**
 * Generate unique ID for scanned items
 */
export const generateScanId = (): string => {
    return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate health score color
 */
export const getHealthScoreColor = (score: number): string => {
    if (score >= 7) return '#22C55E'; // Green
    if (score >= 4) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
};
