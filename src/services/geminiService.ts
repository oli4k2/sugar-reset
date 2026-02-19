/**
 * Gemini AI Service
 *
 * Integrates Google Gemini for food analysis:
 *  - Image analysis (multimodal): converts food photo → nutritional data
 *  - Text analysis: converts food description → nutritional data
 *
 * Uses the @google/generative-ai SDK.
 * API key is read from EXPO_PUBLIC_GEMINI_API_KEY in .env
 */

import * as FileSystem from 'expo-file-system/legacy';
import { AnalysisResult } from './scannerService';
import { calculateFoodHealthScore } from './healthScoringService';
import { ScannedItem } from './scannerService';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

// Model names
const VISION_MODEL = 'gemini-2.0-flash';
const TEXT_MODEL = 'gemini-2.0-flash';

// ─── Prompt ─────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a precise nutritional analysis assistant embedded in a sugar-tracking app for people reducing sugar intake.

Your task: Analyse the provided food item and return ONLY a valid JSON object with nutritional data. No extra text, no markdown, no code blocks — pure JSON only.

Required JSON shape:
{
  "foodName": "string (specific, e.g. 'Banana Medium', 'McDonald's Big Mac')",
  "calories": number,
  "protein": number,
  "carbs": number,
  "carbsSugars": number,
  "fat": number,
  "fatSaturated": number,
  "fiber": number,
  "sugar": number,
  "addedSugar": number,
  "naturalSugar": number,
  "sodium": number,
  "confidence": number,
  "suggestion": "string (1-2 sentence sugar-relevant tip for the user)"
}

Units: calories in kcal, all macros in grams, sodium in mg, confidence 0.0–1.0.
Be as accurate as possible based on standard nutritional databases (USDA, etc.).
Distinguish added sugar (processed/refined) from natural sugar (fruit, dairy).
If unsure, give a reasonable midpoint estimate and lower the confidence accordingly.`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert a local file URI to a base64 string.
 */
async function uriToBase64(uri: string): Promise<string> {
    const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as any,
    });
    return base64;
}

/**
 * Guess the MIME type from a URI/path.
 */
function getMimeType(uri: string): string {
    const lower = uri.toLowerCase();
    if (lower.includes('.png')) return 'image/png';
    if (lower.includes('.gif')) return 'image/gif';
    if (lower.includes('.webp')) return 'image/webp';
    return 'image/jpeg'; // default
}

/**
 * Parse the Gemini response text into an AnalysisResult.
 * Strips any accidental markdown code fences before parsing.
 */
function parseGeminiResponse(text: string, imageUri: string): AnalysisResult {
    // Strip markdown code fences if model adds them anyway
    const cleaned = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();

    const parsed = JSON.parse(cleaned);

    // Build a temp ScannedItem so we can run the health scoring engine
    const tempItem: ScannedItem = {
        id: 'temp',
        imageUri,
        name: parsed.foodName ?? 'Unknown',
        timestamp: '',
        portionPercent: 100,
        calories: Number(parsed.calories) || 0,
        protein: Number(parsed.protein) || 0,
        carbs: Number(parsed.carbs) || 0,
        carbsSugars: Number(parsed.carbsSugars) || 0,
        fat: Number(parsed.fat) || 0,
        fatSaturated: Number(parsed.fatSaturated) || 0,
        fiber: Number(parsed.fiber) || 0,
        sugar: Number(parsed.sugar) || 0,
        addedSugar: Number(parsed.addedSugar) || 0,
        naturalSugar: Number(parsed.naturalSugar) || 0,
        sodium: Number(parsed.sodium) || 0,
        healthScore: 0,
        confidence: Number(parsed.confidence) || 0.7,
    };

    const healthScore = calculateFoodHealthScore(tempItem); // Score is 0-100

    return {
        foodName: tempItem.name,
        calories: tempItem.calories,
        protein: tempItem.protein,
        carbs: tempItem.carbs,
        carbsSugars: tempItem.carbsSugars,
        fat: tempItem.fat,
        fatSaturated: tempItem.fatSaturated,
        fiber: tempItem.fiber,
        sugar: tempItem.sugar,
        addedSugar: tempItem.addedSugar,
        naturalSugar: tempItem.naturalSugar,
        sodium: tempItem.sodium,
        healthScore,
        confidence: tempItem.confidence,
        suggestion: parsed.suggestion ?? undefined,
    };
}

// ─── Core API Call (direct REST – no Node.js-only SDK internals) ─────────────

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 2000; // 2s → 4s → 8s

/**
 * Sleep helper for retry backoff.
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Call Gemini via the REST API directly, supporting both text and image parts.
 * Includes automatic retry with exponential backoff for 429 rate-limit errors.
 */
async function callGeminiREST(parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>): Promise<string> {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Error('GEMINI_API_KEY_MISSING');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const body = {
        system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
            {
                role: 'user',
                parts,
            },
        ],
        generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 512,
        },
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (response.ok) {
            const json = await response.json();
            const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            if (!text) throw new Error('Gemini returned an empty response.');
            return text;
        }

        // Rate-limited — retry with backoff
        if (response.status === 429 && attempt < MAX_RETRIES) {
            const delay = BASE_DELAY_MS * Math.pow(2, attempt);
            console.warn(`[Gemini] Rate limited (429). Retrying in ${delay / 1000}s… (attempt ${attempt + 1}/${MAX_RETRIES})`);
            await sleep(delay);
            continue;
        }

        // Final 429 — give a friendly message
        if (response.status === 429) {
            throw new Error('Hang tight! Too many scans in a short time. Wait a moment and try again.');
        }

        // Other errors
        const errorBody = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
    }

    // Should never reach here, but TypeScript needs it
    throw lastError ?? new Error('Unexpected error in Gemini API call.');
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Analyse a food image (and optional description) using Gemini Vision.
 * @param imageUri  Local file URI from expo-image-picker
 * @param description  Optional user context (e.g. "this is low-fat")
 */
export async function analyzeFoodImage(
    imageUri: string,
    description?: string
): Promise<AnalysisResult> {
    const base64 = await uriToBase64(imageUri);
    const mimeType = getMimeType(imageUri);

    const parts: Parameters<typeof callGeminiREST>[0] = [
        {
            inlineData: { mimeType, data: base64 },
        },
        {
            text: description
                ? `Analyse this food image. Additional user context: "${description}". Return the JSON nutritional breakdown.`
                : 'Analyse this food image. Return the JSON nutritional breakdown.',
        },
    ];

    const rawText = await callGeminiREST(parts);
    return parseGeminiResponse(rawText, imageUri);
}

/**
 * Analyse a food description (text only) using Gemini.
 * @param description Food name / description provided by the user
 */
export async function analyzeFoodText(description: string): Promise<AnalysisResult> {
    const parts: Parameters<typeof callGeminiREST>[0] = [
        {
            text: `Analyse this food item: "${description}". Return the JSON nutritional breakdown.`,
        },
    ];

    const rawText = await callGeminiREST(parts);
    return parseGeminiResponse(rawText, '');
}

/**
 * Unified entry-point – decides whether to use vision or text-only Gemini.
 * Matches the existing `analyzeFood(imageUri, description?)` signature used across the app.
 */
export async function analyzeFood(
    imageUri: string,
    description?: string
): Promise<AnalysisResult> {
    const hasImage = imageUri && imageUri.length > 0;

    if (hasImage) {
        return analyzeFoodImage(imageUri, description);
    } else if (description && description.trim().length > 0) {
        return analyzeFoodText(description.trim());
    } else {
        throw new Error('Must provide either an image URI or a food description.');
    }
}
