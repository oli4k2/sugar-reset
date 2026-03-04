/**
 * Firebase Configuration
 * 
 * Configure with your Firebase project credentials via environment variables.
 * 
 * Create a .env file in the project root with:
 * EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
 * EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
 * EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
 * EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
 * EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
 * EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
// @ts-ignore - Some firebase types don't export getReactNativePersistence in newer versions
import { initializeAuth, getReactNativePersistence, getAuth as getAuthFallback } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeFirestore, Firestore, doc, getDoc, setDoc, enableNetwork, disableNetwork } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT_ID.firebaseapp.com',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT_ID.appspot.com',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'YOUR_APP_ID',
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'YOUR_MEASUREMENT_ID',
};

// Check if Firebase is properly configured (just check the loaded values, not env vars directly)
const isFirebaseConfigured =
    firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
    firebaseConfig.projectId !== 'YOUR_PROJECT_ID' &&
    firebaseConfig.apiKey.length > 10; // Valid API keys are long

// Debug: Log config status
console.log('🔥 Firebase Config Status:', {
    projectId: firebaseConfig.projectId,
    hasApiKey: firebaseConfig.apiKey !== 'YOUR_API_KEY',
    isConfigured: isFirebaseConfigured,
});

if (!isFirebaseConfigured) {
    console.warn('⚠️ Firebase is NOT configured! Create a .env file with your Firebase credentials.');
    console.warn('⚠️ The app will run in offline/demo mode.');
} else {
    console.log('✅ Firebase is configured and ready!');
}

// Initialize Firebase
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage persistence
let auth: Auth;
try {
    auth = initializeAuth(app, {
        persistence: (getReactNativePersistence as any)(ReactNativeAsyncStorage)
    });
    console.log('🔐 Firebase Auth initialized with AsyncStorage persistence');
} catch (error: any) {
    // If already initialized (error code auth/already-initialized), get existing instance
    if (error?.code === 'auth/already-initialized') {
        auth = getAuthFallback(app);
        console.log('🔐 Using existing Firebase Auth instance');
    } else {
        console.error('❌ Firebase Auth initialization error:', error);
        auth = getAuthFallback(app);
    }
}

// Initialize Firestore with settings optimized for Expo/React Native
// NOTE: This project uses a database with ID 'default' (literal string) not '(default)' (reserved)
let db: Firestore;
try {
    db = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
    }, 'default'); // Explicitly specify the database ID
    console.log('🔥 Firestore initialized with database ID: default');
} catch (error) {
    // If already initialized, get existing instance
    console.log('⚠️ Firestore already initialized, getting existing instance');
    const { getFirestore } = require('firebase/firestore');
    db = getFirestore(app, 'default'); // Explicitly specify the database ID
}

console.log('🔥 Firestore initialized for project:', firebaseConfig.projectId);

/**
 * Force reconnect Firestore (useful after network issues)
 */
export async function reconnectFirestore(): Promise<void> {
    try {
        await disableNetwork(db);
        await enableNetwork(db);
        console.log('🔄 Firestore network reconnected');
    } catch (error) {
        console.error('❌ Failed to reconnect Firestore:', error);
    }
}

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseReady(): boolean {
    return isFirebaseConfigured;
}

/**
 * Test Firestore connection with a simple write and read
 */
export async function testFirestoreConnection(): Promise<{ success: boolean; message: string }> {
    console.log('🧪 Testing Firestore connection...');
    try {
        const testRef = doc(db, 'test', 'connection');

        // Try to write
        console.log('📝 Attempting to write test document...');
        await setDoc(testRef, {
            timestamp: new Date().toISOString(),
            test: 'Firestore connection test'
        });
        console.log('✅ Write successful!');

        // Try to read it back
        console.log('📖 Attempting to read test document...');
        const docSnap = await getDoc(testRef);

        if (docSnap.exists()) {
            console.log('✅ Read successful! Data:', docSnap.data());
            return { success: true, message: 'Firestore is working!' };
        } else {
            return { success: false, message: 'Document was written but not found' };
        }
    } catch (error: any) {
        console.error('❌ Firestore test failed:', error);
        return {
            success: false,
            message: `Firestore error: ${error.code || error.message}`
        };
    }
}

export { app, auth, db };
export default app;
