/**
 * Username Migration API Endpoint
 * 
 * Server-side endpoint to migrate usernames for all existing users.
 * Uses Firebase Admin SDK to bypass security rules.
 * 
 * This should be called once to backfill usernames for GDPR compliance.
 * 
 * Security: Requires ADMIN_SECRET environment variable to prevent unauthorized access.
 */

import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

// Initialize Firebase Admin (prevent re-initialization)
if (!admin.apps.length) {
    try {
        const privateKeyMatch = process.env.FIREBASE_PRIVATE_KEY?.match(/-----BEGIN PRIVATE KEY-----[\s\S]+-----END PRIVATE KEY-----/);
        const privateKey = privateKeyMatch
            ? privateKeyMatch[0].replace(/\\n/g, "\n")
            : undefined;

        if (!privateKey) {
            console.error("FIREBASE_PRIVATE_KEY is missing or malformed");
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
        console.log("Firebase Admin initialized successfully");
    } catch (error) {
        console.error("Firebase admin initialization error", error);
    }
}

// Username generation (same logic as client-side)
const ADJECTIVES = [
    'cool', 'swift', 'bright', 'brave', 'calm', 'clever', 'daring', 'gentle',
    'happy', 'jolly', 'kind', 'lively', 'mighty', 'noble', 'proud', 'quick',
    'radiant', 'silent', 'smooth', 'tough', 'witty', 'zealous', 'bold', 'fierce',
    'graceful', 'heroic', 'jovial', 'keen', 'loyal', 'merry', 'nifty', 'peppy',
    'quirky', 'robust', 'serene', 'tidy', 'vivid', 'warm', 'zesty', 'active',
    'breezy', 'cosmic', 'dazzling', 'eager', 'fancy', 'gigantic', 'harmonious',
    'infinite', 'jubilant', 'kaleidoscopic', 'luminous', 'majestic', 'nimble',
    'optimistic', 'peaceful', 'quantum', 'resilient', 'stellar', 'tranquil',
    'unified', 'vibrant', 'whimsical', 'xenial', 'youthful', 'zenith'
];

const NOUNS = [
    'star', 'moon', 'sun', 'ocean', 'river', 'mountain', 'forest', 'valley',
    'cloud', 'wind', 'storm', 'rain', 'snow', 'fire', 'earth', 'sky',
    'bird', 'eagle', 'hawk', 'wolf', 'lion', 'tiger', 'bear', 'deer',
    'dolphin', 'whale', 'shark', 'turtle', 'butterfly', 'dragon', 'phoenix',
    'unicorn', 'pegasus', 'griffin', 'knight', 'warrior', 'wizard', 'ranger',
    'explorer', 'traveler', 'adventurer', 'pioneer', 'champion', 'hero', 'legend',
    'sage', 'scholar', 'artist', 'musician', 'poet', 'writer', 'thinker',
    'dreamer', 'seeker', 'wanderer', 'hiker', 'climber', 'runner', 'swimmer',
    'surfer', 'sailor', 'pilot', 'captain', 'commander', 'leader', 'guide',
    'mentor', 'teacher', 'student', 'friend', 'ally', 'partner', 'companion',
    'guardian', 'protector', 'defender', 'keeper', 'watcher', 'observer',
    'discoverer', 'creator', 'builder', 'maker', 'designer', 'architect',
    'engineer', 'scientist', 'researcher', 'explorer', 'investigator', 'detective',
    'philosopher', 'visionary', 'innovator', 'pioneer', 'trailblazer', 'pathfinder'
];

function generateUsername(): string {
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const includeNumber = Math.random() > 0.3;
    const number = includeNumber ? Math.floor(Math.random() * 10000) : null;
    
    return number !== null 
        ? `${adjective}${noun}${number}`.toLowerCase()
        : `${adjective}${noun}`.toLowerCase();
}

async function isUsernameTaken(username: string, db: admin.firestore.Firestore): Promise<boolean> {
    const snapshot = await db.collection('users')
        .where('usernameLower', '==', username.toLowerCase())
        .limit(1)
        .get();
    return !snapshot.empty;
}

async function generateUniqueUsername(db: admin.firestore.Firestore): Promise<string> {
    const maxAttempts = 50;
    let attempts = 0;

    while (attempts < maxAttempts) {
        const username = generateUsername();
        const taken = await isUsernameTaken(username, db);
        
        if (!taken) {
            return username;
        }

        attempts++;
    }

    // Fallback: add random suffix
    const baseUsername = generateUsername();
    const randomSuffix = Math.floor(Math.random() * 1000000);
    return `${baseUsername}${randomSuffix}`;
}

export async function POST(request: NextRequest) {
    try {
        // Security check: require admin secret
        const authHeader = request.headers.get('authorization');
        const adminSecret = process.env.ADMIN_SECRET || 'change-me-in-production';
        
        if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
            return NextResponse.json(
                { error: "Unauthorized. Admin secret required." },
                { status: 401 }
            );
        }

        const db = admin.firestore();
        const usersRef = db.collection('users');
        const snapshot = await usersRef.get();

        const results = {
            total: snapshot.docs.length,
            success: 0,
            failed: 0,
            skipped: 0,
            errors: [] as string[]
        };

        console.log(`🔄 Starting username migration for ${results.total} users...`);

        // Process users in batches to avoid overwhelming Firestore
        const batchSize = 10;
        for (let i = 0; i < snapshot.docs.length; i += batchSize) {
            const batch = db.batch();
            const batchDocs = snapshot.docs.slice(i, i + batchSize);

            for (const userDoc of batchDocs) {
                try {
                    const data = userDoc.data();
                    
                    // Skip if user already has a username
                    if (data.username && data.usernameLower) {
                        results.skipped++;
                        continue;
                    }

                    // Generate unique username
                    const username = await generateUniqueUsername(db);
                    console.log(`✅ Generated username for ${userDoc.id}: ${username}`);

                    // Update user document in batch
                    batch.update(userDoc.ref, {
                        username,
                        usernameLower: username.toLowerCase(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });

                    results.success++;
                } catch (error: any) {
                    console.error(`❌ Failed to migrate username for ${userDoc.id}:`, error);
                    results.failed++;
                    results.errors.push(`${userDoc.id}: ${error.message || 'Unknown error'}`);
                }
            }

            // Commit batch
            if (results.success > 0 || results.failed > 0) {
                await batch.commit();
            }
        }

        console.log(`✅ Username migration complete: ${results.success} succeeded, ${results.failed} failed, ${results.skipped} skipped`);

        return NextResponse.json({
            success: true,
            results: {
                total: results.total,
                success: results.success,
                failed: results.failed,
                skipped: results.skipped,
                errors: results.errors.slice(0, 10) // Limit error details
            }
        });
    } catch (error: any) {
        console.error('❌ Username migration failed:', error);
        return NextResponse.json(
            { 
                success: false,
                error: error.message || 'Unknown error',
                results: null
            },
            { status: 500 }
        );
    }
}

// GET endpoint for status/health check
export async function GET(request: NextRequest) {
    return NextResponse.json({
        message: "Username Migration API",
        method: "Use POST with Authorization header to run migration",
        endpoint: "/api/admin/migrate-usernames",
        note: "Requires Authorization: Bearer <ADMIN_SECRET>"
    });
}

