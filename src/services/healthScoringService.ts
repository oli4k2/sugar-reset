/**
 * Health Scoring Service
 *
 * Implements scientifically-backed algorithms for calculating health scores
 * based on nutrition, wellness metrics, and behavioral patterns.
 *
 * Scientific References:
 * - Dietary Guidelines for Americans 2020-2025 (USDA)
 * - WHO Healthy Diet Recommendations
 * - Harvard T.H. Chan School of Public Health Nutrition Studies
 * - American Heart Association Guidelines
 * - Sleep Foundation Research
 */

import { ScannedItem } from './scannerService';

export interface DailyNutritionProfile {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalSugar: number;
    totalFiber: number;
    totalSodium: number;
    saturatedFat: number;
    foodItems: number;
}

export interface WellnessMetrics {
    mood: number; // 1-5 scale
    energy: number; // 1-5 scale
    focus: number; // 1-5 scale
    sleepHours: number; // actual hours
}

export interface ComprehensiveHealthScore {
    overall: number; // 0-100
    nutrition: number; // 0-100
    wellness: number; // 0-100
    breakdown: {
        macroBalance: number;
        sugarIntake: number;
        micronutrients: number;
        mentalWellbeing: number;
        sleepQuality: number;
        consistency: number;
    };
    insights: string[];
    recommendations: string[];
}

/**
 * Calculate food health score based on nutritional content
 *
 * Algorithm based on:
 * - Nutrient density (protein, fiber)
 * - Added sugars limitation (WHO recommends <10% of energy)
 * - Saturated fat limitation (AHA recommends <7% of energy)
 * - Sodium limitation (FDA recommends <2300mg/day)
 */
export function calculateFoodHealthScore(item: ScannedItem): number {
    let score = 70; // Base score

    // Protein bonus (up to +15 points)
    // High protein foods promote satiety and muscle maintenance
    const proteinRatio = item.protein / (item.calories / 100);
    if (proteinRatio > 8) score += 15;
    else if (proteinRatio > 5) score += 10;
    else if (proteinRatio > 3) score += 5;

    // Fiber bonus (up to +10 points)
    // Fiber aids digestion, blood sugar control, and heart health
    if (item.fiber >= 5) score += 10;
    else if (item.fiber >= 3) score += 6;
    else if (item.fiber >= 1) score += 3;

    // Sugar penalty (up to -30 points)
    // WHO recommends limiting added sugars to <10% of total energy intake
    // Differentiate between added sugar (heavily penalized) and natural sugar (lightly penalized)
    const addedSugar = item.addedSugar !== undefined ? item.addedSugar : item.sugar;
    const naturalSugar = item.naturalSugar || 0;

    // Added sugar penalty (primary concern)
    const addedSugarPercentOfCalories = (addedSugar * 4 / item.calories) * 100;
    if (addedSugarPercentOfCalories > 30) score -= 30;
    else if (addedSugarPercentOfCalories > 20) score -= 20;
    else if (addedSugarPercentOfCalories > 10) score -= 10;
    else if (addedSugarPercentOfCalories > 5) score -= 5;

    // Natural sugar penalty (minimal - only for excessive amounts)
    const naturalSugarPercentOfCalories = (naturalSugar * 4 / item.calories) * 100;
    if (naturalSugarPercentOfCalories > 40) score -= 5; // Only penalize very high natural sugar

    // Saturated fat penalty (up to -15 points)
    // AHA recommends <7% of calories from saturated fat
    const satFatPercentOfCalories = (item.fatSaturated * 9 / item.calories) * 100;
    if (satFatPercentOfCalories > 15) score -= 15;
    else if (satFatPercentOfCalories > 10) score -= 10;
    else if (satFatPercentOfCalories > 7) score -= 5;

    // Sodium penalty (up to -10 points)
    // High sodium linked to hypertension and cardiovascular disease
    if (item.sodium > 800) score -= 10;
    else if (item.sodium > 600) score -= 7;
    else if (item.sodium > 400) score -= 4;

    // Calorie density consideration
    // Very high calorie foods may need moderation
    if (item.calories > 600) score -= 5;

    return Math.max(0, Math.min(100, score));
}

/**
 * Calculate daily nutrition score from all food items
 */
export function calculateDailyNutritionScore(profile: DailyNutritionProfile): number {
    if (profile.foodItems === 0) return 0;

    let score = 70; // Base score

    // Calorie range assessment (based on typical 2000 calorie diet)
    if (profile.totalCalories >= 1600 && profile.totalCalories <= 2400) {
        score += 10;
    } else if (profile.totalCalories < 1200 || profile.totalCalories > 3000) {
        score -= 10;
    }

    // Macro balance (40% carbs, 30% protein, 30% fat is optimal)
    const totalMacros = (profile.totalProtein * 4) + (profile.totalCarbs * 4) + (profile.totalFat * 9);
    if (totalMacros > 0) {
        const proteinPercent = (profile.totalProtein * 4 / totalMacros) * 100;
        const carbsPercent = (profile.totalCarbs * 4 / totalMacros) * 100;
        const fatPercent = (profile.totalFat * 9 / totalMacros) * 100;

        // Protein optimal range: 25-35%
        if (proteinPercent >= 25 && proteinPercent <= 35) score += 8;
        else if (proteinPercent < 15) score -= 8;

        // Carbs optimal range: 35-50%
        if (carbsPercent >= 35 && carbsPercent <= 50) score += 7;
        else if (carbsPercent > 65) score -= 10;

        // Fat optimal range: 20-35%
        if (fatPercent >= 20 && fatPercent <= 35) score += 5;
        else if (fatPercent > 40) score -= 7;
    }

    // Sugar limit (WHO: <50g per day, ideally <25g)
    if (profile.totalSugar <= 25) score += 10;
    else if (profile.totalSugar <= 50) score += 5;
    else if (profile.totalSugar > 75) score -= 15;
    else if (profile.totalSugar > 100) score -= 25;

    // Fiber (recommended 25-35g per day)
    if (profile.totalFiber >= 25) score += 10;
    else if (profile.totalFiber >= 15) score += 5;
    else if (profile.totalFiber < 10) score -= 5;

    // Sodium (FDA: <2300mg per day)
    if (profile.totalSodium <= 2000) score += 5;
    else if (profile.totalSodium > 3000) score -= 10;
    else if (profile.totalSodium > 4000) score -= 20;

    // Saturated fat (<10% of calories)
    const satFatCalories = profile.saturatedFat * 9;
    const satFatPercent = (satFatCalories / profile.totalCalories) * 100;
    if (satFatPercent < 7) score += 5;
    else if (satFatPercent > 10) score -= 10;
    else if (satFatPercent > 13) score -= 15;

    return Math.max(0, Math.min(100, score));
}

/**
 * Calculate wellness score from mental and physical metrics
 *
 * Based on research showing correlation between:
 * - Sleep and cognitive function (Walker, 2017)
 * - Mood and health outcomes (Pressman & Cohen, 2005)
 * - Energy and metabolic health
 */
export function calculateWellnessScore(metrics: WellnessMetrics): number {
    let score = 0;

    // Mood contribution (25 points max)
    // Positive mood correlates with better health outcomes
    score += (metrics.mood / 5) * 25;

    // Energy contribution (25 points max)
    // Energy levels reflect metabolic health
    score += (metrics.energy / 5) * 25;

    // Focus contribution (20 points max)
    // Cognitive function is key health indicator
    score += (metrics.focus / 5) * 20;

    // Sleep contribution (30 points max)
    // Sleep is critical for recovery and health (7-9 hours optimal)
    if (metrics.sleepHours >= 7 && metrics.sleepHours <= 9) {
        score += 30;
    } else if (metrics.sleepHours >= 6 && metrics.sleepHours <= 10) {
        score += 20;
    } else if (metrics.sleepHours >= 5) {
        score += 10;
    } else {
        score += 5;
    }

    return Math.round(score);
}

/**
 * Calculate comprehensive health score combining all factors
 */
export function calculateComprehensiveScore(
    nutritionProfile: DailyNutritionProfile,
    wellnessMetrics: WellnessMetrics,
    consistencyDays: number = 0
): ComprehensiveHealthScore {
    const nutritionScore = calculateDailyNutritionScore(nutritionProfile);
    const wellnessScore = calculateWellnessScore(wellnessMetrics);

    // Calculate breakdown scores
    const macroBalance = calculateMacroBalanceScore(nutritionProfile);
    const sugarIntake = calculateSugarScore(nutritionProfile);
    const micronutrients = calculateMicronutrientScore(nutritionProfile);
    const mentalWellbeing = ((wellnessMetrics.mood + wellnessMetrics.energy + wellnessMetrics.focus) / 15) * 100;
    const sleepQuality = calculateSleepScore(wellnessMetrics.sleepHours);
    const consistency = Math.min(100, (consistencyDays / 7) * 100);

    // Overall score (weighted average)
    const overall = Math.round(
        nutritionScore * 0.45 +
        wellnessScore * 0.40 +
        consistency * 0.15
    );

    // Generate insights and recommendations
    const insights = generateInsights(nutritionProfile, wellnessMetrics, overall);
    const recommendations = generateRecommendations(nutritionProfile, wellnessMetrics);

    return {
        overall,
        nutrition: Math.round(nutritionScore),
        wellness: Math.round(wellnessScore),
        breakdown: {
            macroBalance: Math.round(macroBalance),
            sugarIntake: Math.round(sugarIntake),
            micronutrients: Math.round(micronutrients),
            mentalWellbeing: Math.round(mentalWellbeing),
            sleepQuality: Math.round(sleepQuality),
            consistency: Math.round(consistency),
        },
        insights,
        recommendations,
    };
}

function calculateMacroBalanceScore(profile: DailyNutritionProfile): number {
    const totalMacros = (profile.totalProtein * 4) + (profile.totalCarbs * 4) + (profile.totalFat * 9);
    if (totalMacros === 0) return 50;

    const proteinPercent = (profile.totalProtein * 4 / totalMacros) * 100;
    const carbsPercent = (profile.totalCarbs * 4 / totalMacros) * 100;
    const fatPercent = (profile.totalFat * 9 / totalMacros) * 100;

    let score = 100;

    // Optimal: 30% protein, 40% carbs, 30% fat
    score -= Math.abs(proteinPercent - 30) * 2;
    score -= Math.abs(carbsPercent - 40) * 1.5;
    score -= Math.abs(fatPercent - 30) * 2;

    return Math.max(0, Math.min(100, score));
}

function calculateSugarScore(profile: DailyNutritionProfile): number {
    // WHO recommends <25g ideally, <50g maximum
    if (profile.totalSugar <= 25) return 100;
    if (profile.totalSugar <= 50) return 75;
    if (profile.totalSugar <= 75) return 50;
    if (profile.totalSugar <= 100) return 25;
    return 0;
}

function calculateMicronutrientScore(profile: DailyNutritionProfile): number {
    // Simplified score based on fiber and variety
    let score = 50;

    // Fiber is a proxy for vegetable/whole food intake
    if (profile.totalFiber >= 30) score += 30;
    else if (profile.totalFiber >= 20) score += 20;
    else if (profile.totalFiber >= 10) score += 10;

    // Food variety (more items suggests diverse diet)
    if (profile.foodItems >= 5) score += 20;
    else if (profile.foodItems >= 3) score += 10;

    return Math.min(100, score);
}

function calculateSleepScore(sleepHours: number): number {
    // Optimal: 7-9 hours
    if (sleepHours >= 7 && sleepHours <= 9) return 100;
    if (sleepHours >= 6 && sleepHours <= 10) return 75;
    if (sleepHours >= 5 && sleepHours <= 11) return 50;
    return 25;
}

function generateInsights(
    profile: DailyNutritionProfile,
    wellness: WellnessMetrics,
    overall: number
): string[] {
    const insights: string[] = [];

    if (overall >= 80) {
        insights.push("Excellent health habits! You're on the right track.");
    } else if (overall >= 60) {
        insights.push("Good progress, with room for improvement.");
    } else {
        insights.push("Focus on building healthier habits consistently.");
    }

    if (profile.totalSugar <= 25) {
        insights.push("Sugar intake is well-controlled.");
    } else if (profile.totalSugar > 50) {
        insights.push("High sugar intake may affect energy and mood.");
    }

    if (wellness.sleepHours < 7) {
        insights.push("More sleep could boost your energy and focus.");
    }

    return insights;
}

function generateRecommendations(
    profile: DailyNutritionProfile,
    wellness: WellnessMetrics
): string[] {
    const recommendations: string[] = [];

    if (profile.totalSugar > 50) {
        recommendations.push("Reduce added sugars - try fruit for sweetness instead");
    }

    if (profile.totalProtein < 50) {
        recommendations.push("Increase protein intake for better satiety and energy");
    }

    if (profile.totalFiber < 20) {
        recommendations.push("Add more vegetables and whole grains for fiber");
    }

    if (wellness.sleepHours < 7) {
        recommendations.push("Aim for 7-9 hours of sleep for optimal recovery");
    }

    if (wellness.mood < 3 || wellness.energy < 3) {
        recommendations.push("Consider regular exercise to boost mood and energy");
    }

    return recommendations;
}

/**
 * Calculate aggregated health data for a time period
 */
export function aggregateHealthData(
    foodItems: ScannedItem[],
    wellnessLogs: WellnessMetrics[],
    days: number = 7
): {
    avgNutritionScore: number;
    avgWellnessScore: number;
    avgOverallScore: number;
    dailyProfiles: DailyNutritionProfile[];
} {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Filter items within time range
    const recentFood = foodItems.filter(item =>
        new Date(item.timestamp) >= cutoffDate
    );

    // Group by day
    const dailyProfiles: DailyNutritionProfile[] = [];
    const dayMap = new Map<string, ScannedItem[]>();

    recentFood.forEach(item => {
        const day = item.timestamp.split('T')[0];
        if (!dayMap.has(day)) {
            dayMap.set(day, []);
        }
        dayMap.get(day)!.push(item);
    });

    // Calculate daily profiles
    dayMap.forEach((items, day) => {
        const profile: DailyNutritionProfile = {
            totalCalories: items.reduce((sum, i) => sum + i.calories, 0),
            totalProtein: items.reduce((sum, i) => sum + i.protein, 0),
            totalCarbs: items.reduce((sum, i) => sum + i.carbs, 0),
            totalFat: items.reduce((sum, i) => sum + i.fat, 0),
            totalSugar: items.reduce((sum, i) => sum + i.sugar, 0),
            totalFiber: items.reduce((sum, i) => sum + i.fiber, 0),
            totalSodium: items.reduce((sum, i) => sum + i.sodium, 0),
            saturatedFat: items.reduce((sum, i) => sum + i.fatSaturated, 0),
            foodItems: items.length,
        };
        dailyProfiles.push(profile);
    });

    // Calculate average scores
    const nutritionScores = dailyProfiles.map(p => calculateDailyNutritionScore(p));
    const wellnessScores = wellnessLogs.map(w => calculateWellnessScore(w));

    const avgNutritionScore = nutritionScores.length > 0
        ? nutritionScores.reduce((a, b) => a + b, 0) / nutritionScores.length
        : 0;

    const avgWellnessScore = wellnessScores.length > 0
        ? wellnessScores.reduce((a, b) => a + b, 0) / wellnessScores.length
        : 0;

    const avgOverallScore = (avgNutritionScore + avgWellnessScore) / 2;

    return {
        avgNutritionScore: Math.round(avgNutritionScore),
        avgWellnessScore: Math.round(avgWellnessScore),
        avgOverallScore: Math.round(avgOverallScore),
        dailyProfiles,
    };
}

/**
 * Get detailed nutrition insights for display
 */
export function getNutritionInsights(
    foodItems: ScannedItem[],
    days: number = 7
): {
    avgCalories: number;
    avgProtein: number;
    avgCarbs: number;
    avgFat: number;
    avgSugar: number;
    avgAddedSugar: number;
    avgNaturalSugar: number;
    avgFiber: number;
    avgSodium: number;
    avgFatSaturated: number;
    macroBalance: { protein: number; carbs: number; fat: number };
    sugarStatus: 'excellent' | 'good' | 'high' | 'very-high';
    recommendations: string[];
} {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentFood = foodItems.filter(item =>
        new Date(item.timestamp) >= cutoffDate
    );

    if (recentFood.length === 0) {
        return {
            avgCalories: 0,
            avgProtein: 0,
            avgCarbs: 0,
            avgFat: 0,
            avgSugar: 0,
            avgAddedSugar: 0,
            avgNaturalSugar: 0,
            avgFiber: 0,
            avgSodium: 0,
            avgFatSaturated: 0,
            macroBalance: { protein: 0, carbs: 0, fat: 0 },
            sugarStatus: 'excellent',
            recommendations: ['Start logging food to see nutrition insights'],
        };
    }

    // Group by day and calculate daily averages
    const dayMap = new Map<string, ScannedItem[]>();
    recentFood.forEach(item => {
        const day = item.timestamp.split('T')[0];
        if (!dayMap.has(day)) dayMap.set(day, []);
        dayMap.get(day)!.push(item);
    });

    const daysWithData = dayMap.size;
    const totals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        sugar: 0,
        addedSugar: 0,
        naturalSugar: 0,
        fiber: 0,
        sodium: 0,
        fatSaturated: 0,
    };

    dayMap.forEach((items) => {
        totals.calories += items.reduce((sum, i) => sum + i.calories, 0);
        totals.protein += items.reduce((sum, i) => sum + i.protein, 0);
        totals.carbs += items.reduce((sum, i) => sum + i.carbs, 0);
        totals.fat += items.reduce((sum, i) => sum + i.fat, 0);
        totals.sugar += items.reduce((sum, i) => sum + i.sugar, 0);
        totals.addedSugar += items.reduce((sum, i) => sum + (i.addedSugar ?? i.sugar ?? 0), 0);
        totals.naturalSugar += items.reduce((sum, i) => sum + (i.naturalSugar ?? 0), 0);
        totals.fiber += items.reduce((sum, i) => sum + i.fiber, 0);
        totals.sodium += items.reduce((sum, i) => sum + (i.sodium ?? 0), 0);
        totals.fatSaturated += items.reduce((sum, i) => sum + (i.fatSaturated ?? 0), 0);
    });

    const avgCalories = Math.round(totals.calories / daysWithData);
    const avgProtein = Math.round(totals.protein / daysWithData);
    const avgCarbs = Math.round(totals.carbs / daysWithData);
    const avgFat = Math.round(totals.fat / daysWithData);
    const avgSugar = Math.round(totals.sugar / daysWithData);
    const avgAddedSugar = Math.round(totals.addedSugar / daysWithData);
    const avgNaturalSugar = Math.round(totals.naturalSugar / daysWithData);
    const avgFiber = Math.round(totals.fiber / daysWithData);
    const avgSodium = Math.round(totals.sodium / daysWithData);
    const avgFatSaturated = Math.round((totals.fatSaturated / daysWithData) * 10) / 10;

    // Calculate macro percentages
    const totalMacroCalories = (avgProtein * 4) + (avgCarbs * 4) + (avgFat * 9);
    const macroBalance = {
        protein: totalMacroCalories > 0 ? Math.round((avgProtein * 4 / totalMacroCalories) * 100) : 0,
        carbs: totalMacroCalories > 0 ? Math.round((avgCarbs * 4 / totalMacroCalories) * 100) : 0,
        fat: totalMacroCalories > 0 ? Math.round((avgFat * 9 / totalMacroCalories) * 100) : 0,
    };

    // Sugar status
    let sugarStatus: 'excellent' | 'good' | 'high' | 'very-high';
    if (avgAddedSugar <= 25) sugarStatus = 'excellent';
    else if (avgAddedSugar <= 50) sugarStatus = 'good';
    else if (avgAddedSugar <= 75) sugarStatus = 'high';
    else sugarStatus = 'very-high';

    // Generate recommendations
    const recommendations: string[] = [];
    if (avgAddedSugar > 50) {
        recommendations.push('Reduce added sugars - try whole fruits instead');
    }
    if (avgProtein < 50) {
        recommendations.push('Increase protein to 15-20% of calories for satiety');
    }
    if (avgFiber < 25) {
        recommendations.push('Add more vegetables and whole grains for fiber');
    }
    if (macroBalance.protein < 25) {
        recommendations.push('Balance your diet with more protein-rich foods');
    }
    if (macroBalance.fat > 35) {
        recommendations.push('Consider reducing fat intake slightly');
    }

    if (recommendations.length === 0) {
        recommendations.push('Great macro balance! Keep up the good work.');
    }

    return {
        avgCalories,
        avgProtein,
        avgCarbs,
        avgFat,
        avgSugar,
        avgAddedSugar,
        avgNaturalSugar,
        avgFiber,
        avgSodium,
        avgFatSaturated,
        macroBalance,
        sugarStatus,
        recommendations,
    };
}
