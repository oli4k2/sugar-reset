/**
 * User Service
 * 
 * Firestore operations for user profiles and data.
 */

import {
    doc,
    getDoc,
    getDocFromServer,
    getDocFromCache,
    setDoc,
    updateDoc,
    serverTimestamp,
    Timestamp,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    addDoc,
} from 'firebase/firestore';
import { db, isFirebaseReady } from '../config/firebase';
import { User, UserStats, UserPreferences, StreakData, DailyCheckIn, Friend } from '../types';

/**
 * Convert Firestore timestamp to Date
 */
const toDate = (timestamp: Timestamp | null): Date | null => {
    return timestamp ? timestamp.toDate() : null;
};

/**
 * Helper to handle Firestore errors gracefully
 */
const handleFirestoreError = (error: any, operation: string): null => {
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
        console.log(`📴 Firestore offline for: ${operation}`);
    } else if (!isFirebaseReady()) {
        // Don't log if Firebase isn't configured - expected behavior
    } else {
        console.warn(`⚠️ ${operation} failed:`, error?.code || error?.message);
    }
    return null;
};

/**
 * User profile operations
 */
export const userService = {
    /**
     * Get user profile by ID with retry logic
     */
    async getUserProfile(userId: string, retryCount = 0): Promise<User | null> {
        if (!isFirebaseReady()) {
            console.log('📴 Firebase not ready, skipping getUserProfile');
            return null;
        }

        try {
            console.log(`📖 Fetching user profile for: ${userId} (attempt ${retryCount + 1})`);
            const docRef = doc(db, 'users', userId);

            // Try to get from server first (bypasses flaky offline detection)
            let docSnap;
            try {
                docSnap = await getDocFromServer(docRef);
                console.log('✅ User profile fetch completed from SERVER, exists:', docSnap.exists());
            } catch (serverError: any) {
                // If server fails, try cache
                console.log('⚠️ Server fetch failed for user profile, trying cache...', serverError?.code);
                try {
                    docSnap = await getDocFromCache(docRef);
                    console.log('✅ User profile fetch completed from CACHE, exists:', docSnap.exists());
                } catch (cacheError: any) {
                    // Neither worked, throw the server error
                    console.log('❌ Cache also failed for user profile:', cacheError?.code);
                    throw serverError;
                }
            }

            if (!docSnap.exists()) {
                return null;
            }

            const data = docSnap.data();
            return {
                id: docSnap.id,
                email: data.email,
                displayName: data.displayName,
                photoURL: data.photoURL,
                createdAt: toDate(data.createdAt) as Date,
                updatedAt: toDate(data.updatedAt) as Date,
                preferences: data.preferences,
                streak: {
                    ...data.streak,
                    lastCheckIn: toDate(data.streak?.lastCheckIn),
                    startDate: toDate(data.streak?.startDate) as Date,
                },
            };
        } catch (error: any) {
            // Retry once on network errors
            if (retryCount < 1 && (error?.code === 'unavailable' || error?.message?.includes('offline'))) {
                console.log('🔄 Retrying getUserProfile after network error...');
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                return this.getUserProfile(userId, retryCount + 1);
            }
            return handleFirestoreError(error, 'getUserProfile');
        }
    },

    /**
     * Create new user profile on sign up
     */
    async createUserProfile(
        userId: string,
        email: string,
        displayName?: string
    ): Promise<User | null> {
        if (!isFirebaseReady()) return null;

        try {
            const now = new Date();
            const defaultPreferences: UserPreferences = {
                notifications: true,
                dailyReminderTime: '09:00',
                weeklyReportDay: 0,
                theme: 'dark',
            };

            const defaultStreak: StreakData = {
                currentStreak: 0,
                longestStreak: 0,
                lastCheckIn: null,
                startDate: now,
                totalDaysSugarFree: 0,
            };

            const newUser: Omit<User, 'id'> = {
                email,
                displayName,
                createdAt: now,
                updatedAt: now,
                preferences: defaultPreferences,
                streak: defaultStreak,
            };

            await setDoc(doc(db, 'users', userId), {
                ...newUser,
                // Store lowercase version for search
                displayNameLower: displayName?.toLowerCase() || '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                streak: {
                    ...defaultStreak,
                    startDate: serverTimestamp(),
                },
            });

            return { id: userId, ...newUser };
        } catch (error) {
            handleFirestoreError(error, 'createUserProfile');
            return null;
        }
    },

    /**
     * Update user preferences
     */
    async updatePreferences(
        userId: string,
        preferences: Partial<UserPreferences>
    ): Promise<void> {
        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, {
            preferences,
            updatedAt: serverTimestamp(),
        });
    },

    /**
     * Update streak data
     */
    async updateStreak(userId: string, streak: Partial<StreakData>): Promise<void> {
        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, {
            streak,
            updatedAt: serverTimestamp(),
        });
    },

    /**
     * Record a daily check-in
     */
    async recordCheckIn(
        userId: string,
        checkIn: Omit<DailyCheckIn, 'id' | 'userId' | 'createdAt'>
    ): Promise<string> {
        const checkInsRef = collection(db, 'users', userId, 'checkIns');

        // Check if already checked in today
        const todayQuery = query(
            checkInsRef,
            where('date', '==', checkIn.date),
            limit(1)
        );
        const existing = await getDocs(todayQuery);

        if (!existing.empty) {
            // Update existing check-in
            const existingDoc = existing.docs[0];
            await updateDoc(existingDoc.ref, {
                ...checkIn,
                updatedAt: serverTimestamp(),
            });
            return existingDoc.id;
        }

        // Create new check-in
        const docRef = await addDoc(checkInsRef, {
            ...checkIn,
            userId,
            createdAt: serverTimestamp(),
        });

        return docRef.id;
    },

    /**
     * Get check-ins for a date range
     */
    async getCheckIns(
        userId: string,
        startDate: string,
        endDate: string
    ): Promise<DailyCheckIn[]> {
        const checkInsRef = collection(db, 'users', userId, 'checkIns');
        const q = query(
            checkInsRef,
            where('date', '>=', startDate),
            where('date', '<=', endDate),
            orderBy('date', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                userId: data.userId,
                date: data.date,
                sugarFree: data.sugarFree,
                notes: data.notes,
                cravingLevel: data.cravingLevel,
                mood: data.mood,
                energyLevel: data.energyLevel,
                sleepQuality: data.sleepQuality,
                createdAt: toDate(data.createdAt) as Date,
            };
        });
    },

    /**
     * Get today's check-in if exists
     */
    async getTodayCheckIn(userId: string): Promise<DailyCheckIn | null> {
        const today = new Date().toISOString().split('T')[0];
        const checkInsRef = collection(db, 'users', userId, 'checkIns');
        const q = query(checkInsRef, where('date', '==', today), limit(1));

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return null;
        }

        const doc = snapshot.docs[0];
        const data = doc.data();
        return {
            id: doc.id,
            userId: data.userId,
            date: data.date,
            sugarFree: data.sugarFree,
            notes: data.notes,
            cravingLevel: data.cravingLevel,
            mood: data.mood,
            energyLevel: data.energyLevel,
            sleepQuality: data.sleepQuality,
            createdAt: toDate(data.createdAt) as Date,
        };
    },

    /**
     * Update user's display name
     * This syncs the nickname from onboarding to the Firestore profile
     */
    async updateDisplayName(userId: string, displayName: string): Promise<void> {
        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, {
            displayName,
            // Store lowercase version for search
            displayNameLower: displayName.toLowerCase(),
            updatedAt: serverTimestamp(),
        });
    },

    /**
     * Sync user stats to public collection
     * Phase 1: Use Profiles & Stats Sync
     */
    async syncUserStats(userId: string, stats: Partial<UserStats>): Promise<void> {
        const docRef = doc(db, 'userStats', userId);

        // We use setDoc with merge: true to create if not exists or update
        await setDoc(docRef, {
            ...stats,
            userId,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    },

    /**
     * Search users by display name or email
     * Phase 2: Friend System
     */
    async searchUsers(queryText: string): Promise<User[]> {
        if (!isFirebaseReady()) return [];

        const searchText = queryText.toLowerCase().trim();
        if (searchText.length < 2) return [];

        const usersRef = collection(db, 'users');
        const results: User[] = [];
        const seenIds = new Set<string>();

        try {
            // Search by displayNameLower (prefix match)
            const nameQuery = query(
                usersRef,
                where('displayNameLower', '>=', searchText),
                where('displayNameLower', '<=', searchText + '\uf8ff'),
                limit(10)
            );

            const nameSnapshot = await getDocs(nameQuery);
            nameSnapshot.docs.forEach(doc => {
                if (!seenIds.has(doc.id)) {
                    seenIds.add(doc.id);
                    const data = doc.data();
                    results.push({
                        id: doc.id,
                        email: data.email,
                        displayName: data.displayName,
                        photoURL: data.photoURL,
                        createdAt: toDate(data.createdAt) as Date,
                        updatedAt: toDate(data.updatedAt) as Date,
                        preferences: data.preferences,
                        streak: {
                            ...data.streak,
                            lastCheckIn: toDate(data.streak?.lastCheckIn),
                            startDate: toDate(data.streak?.startDate) as Date,
                        },
                    });
                }
            });

            // Also search by email if it looks like an email
            if (searchText.includes('@') || searchText.includes('.')) {
                const emailQuery = query(
                    usersRef,
                    where('email', '>=', searchText),
                    where('email', '<=', searchText + '\uf8ff'),
                    limit(5)
                );

                const emailSnapshot = await getDocs(emailQuery);
                emailSnapshot.docs.forEach(doc => {
                    if (!seenIds.has(doc.id)) {
                        seenIds.add(doc.id);
                        const data = doc.data();
                        results.push({
                            id: doc.id,
                            email: data.email,
                            displayName: data.displayName,
                            photoURL: data.photoURL,
                            createdAt: toDate(data.createdAt) as Date,
                            updatedAt: toDate(data.updatedAt) as Date,
                            preferences: data.preferences,
                            streak: {
                                ...data.streak,
                                lastCheckIn: toDate(data.streak?.lastCheckIn),
                                startDate: toDate(data.streak?.startDate) as Date,
                            },
                        });
                    }
                });
            }

            return results;
        } catch (error) {
            handleFirestoreError(error, 'searchUsers');
            return [];
        }
    },
};

export default userService;
