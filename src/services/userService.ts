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
    writeBatch,
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
                // Store lowercase versions for search
                displayNameLower: displayName?.toLowerCase() || '',
                emailLower: email.toLowerCase(),
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
     * Also updates authorName in all posts and comments by this user
     */
    async updateDisplayName(userId: string, displayName: string): Promise<void> {
        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, {
            displayName,
            // Store lowercase version for search
            displayNameLower: displayName.toLowerCase(),
            updatedAt: serverTimestamp(),
        });

        // Propagate name change to all posts by this user
        try {
            const postsRef = collection(db, 'posts');
            const postsQuery = query(postsRef, where('authorId', '==', userId));
            const postsSnapshot = await getDocs(postsQuery);

            const batch = writeBatch(db);
            let batchCount = 0;

            postsSnapshot.docs.forEach((postDoc) => {
                batch.update(postDoc.ref, { authorName: displayName });
                batchCount++;
            });

            // Commit the batch if there are updates
            if (batchCount > 0) {
                await batch.commit();
                console.log(`✅ Updated authorName in ${batchCount} posts`);
            }

            // Also update comments in all posts where this user commented
            // We need to iterate through each post's comments subcollection
            const allPostsSnapshot = await getDocs(collection(db, 'posts'));
            let commentUpdateCount = 0;

            for (const postDoc of allPostsSnapshot.docs) {
                const commentsRef = collection(db, 'posts', postDoc.id, 'comments');
                const userCommentsQuery = query(commentsRef, where('authorId', '==', userId));
                const userCommentsSnapshot = await getDocs(userCommentsQuery);

                if (!userCommentsSnapshot.empty) {
                    const commentBatch = writeBatch(db);
                    userCommentsSnapshot.docs.forEach((commentDoc) => {
                        commentBatch.update(commentDoc.ref, { authorName: displayName });
                        commentUpdateCount++;
                    });
                    await commentBatch.commit();
                }
            }

            if (commentUpdateCount > 0) {
                console.log(`✅ Updated authorName in ${commentUpdateCount} comments`);
            }
        } catch (error) {
            console.warn('⚠️ Failed to update posts/comments with new name:', error);
            // Don't throw - profile update succeeded, post update is secondary
        }
    },

    /**
     * Update user's avatar preference
     */
    async updateAvatar(
        userId: string,
        avatarType: 'photo' | 'emoji' | 'initial',
        avatarValue: string
    ): Promise<void> {
        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, {
            avatarType,
            avatarValue,
            updatedAt: serverTimestamp(),
        });
        console.log('✅ Avatar updated:', avatarType, avatarValue);

        // Propagate avatar change to all posts by this user
        try {
            const postsRef = collection(db, 'posts');
            const postsQuery = query(postsRef, where('authorId', '==', userId));
            const postsSnapshot = await getDocs(postsQuery);

            const batch = writeBatch(db);
            let batchCount = 0;

            postsSnapshot.docs.forEach((postDoc) => {
                batch.update(postDoc.ref, {
                    avatarType,
                    avatarValue
                });
                batchCount++;
            });

            // Commit the batch if there are updates
            if (batchCount > 0) {
                await batch.commit();
                console.log(`✅ Updated avatar in ${batchCount} posts`);
            }

            // Also update comments in all posts where this user commented
            // We need to iterate through each post's comments subcollection
            // Optimization: If possible, use collectionGroup query in future
            const allPostsSnapshot = await getDocs(collection(db, 'posts'));
            let commentUpdateCount = 0;

            for (const postDoc of allPostsSnapshot.docs) {
                const commentsRef = collection(db, 'posts', postDoc.id, 'comments');
                const userCommentsQuery = query(commentsRef, where('authorId', '==', userId));
                const userCommentsSnapshot = await getDocs(userCommentsQuery);

                if (!userCommentsSnapshot.empty) {
                    const commentBatch = writeBatch(db);
                    userCommentsSnapshot.docs.forEach((commentDoc) => {
                        commentBatch.update(commentDoc.ref, {
                            avatarType,
                            avatarValue
                        });
                        commentUpdateCount++;
                    });
                    await commentBatch.commit();
                }
            }

            if (commentUpdateCount > 0) {
                console.log(`✅ Updated avatar in ${commentUpdateCount} comments`);
            }
        } catch (error) {
            console.warn('⚠️ Failed to update posts/comments with new avatar:', error);
        }

        // Propagate to friends (Inner Circle)
        try {
            // Get all friends of this user
            const friendsRef = collection(db, 'users', userId, 'friends');
            const friendsSnapshot = await getDocs(friendsRef);

            if (!friendsSnapshot.empty) {
                const batch = writeBatch(db);
                let friendUpdateCount = 0;

                friendsSnapshot.docs.forEach(friendDoc => {
                    const friendId = friendDoc.id;
                    // Update THIS user in the FRIEND's friend list
                    const friendRecordRef = doc(db, 'users', friendId, 'friends', userId);
                    batch.update(friendRecordRef, {
                        avatarType,
                        avatarValue
                    });
                    friendUpdateCount++;
                });

                await batch.commit();
                console.log(`✅ Updated avatar in ${friendUpdateCount} friends' lists`);
            }
        } catch (error) {
            console.warn('⚠️ Failed to update friends lists with new avatar:', error);
        }
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
     * Debug: List all users in the database (for troubleshooting)
     */
    async listAllUsers(limitCount: number = 5): Promise<void> {
        if (!isFirebaseReady()) {
            console.log('📴 Firebase not ready');
            return;
        }

        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, limit(limitCount));
            const snapshot = await getDocs(q);

            console.log(`📊 Found ${snapshot.docs.length} users in database:`);
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                console.log(`  - ${doc.id}:`);
                console.log(`    email: ${data.email}`);
                console.log(`    displayName: ${data.displayName || '(none)'}`);
                console.log(`    displayNameLower: ${data.displayNameLower || '(none)'}`);
            });
        } catch (error) {
            console.error('❌ listAllUsers failed:', error);
        }
    },

    /**
     * Backfill search fields for current user
     * This ensures the current user has displayNameLower and emailLower fields
     */
    async backfillSearchFields(userId: string): Promise<void> {
        if (!isFirebaseReady()) {
            console.log('📴 Firebase not ready, skipping backfill');
            return;
        }

        try {
            console.log('🔧 Checking search fields for current user...');
            const docRef = doc(db, 'users', userId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                console.log('⚠️ User document not found');
                return;
            }

            const data = docSnap.data();
            const updates: any = {};

            // Check if displayNameLower is missing
            if (data.displayName && !data.displayNameLower) {
                updates.displayNameLower = data.displayName.toLowerCase();
            }

            // Check if emailLower is missing
            if (data.email && !data.emailLower) {
                updates.emailLower = data.email.toLowerCase();
            }

            // Only update if there are missing fields
            if (Object.keys(updates).length > 0) {
                await updateDoc(docRef, {
                    ...updates,
                    updatedAt: serverTimestamp(),
                });
                console.log('✅ Updated current user search fields:', Object.keys(updates));
            } else {
                console.log('✅ Current user search fields already up to date');
            }
        } catch (error) {
            console.error('❌ backfillSearchFields failed:', error);
        }
    },

    /**
     * Search users by display name or email
     * Phase 2: Friend System
     *
     * Searches multiple fields for flexibility:
     * - displayNameLower (indexed, lowercase)
     * - email (always searched, not just when @ present)
     */

    async searchUsers(queryText: string): Promise<User[]> {
        if (!isFirebaseReady()) {
            console.log('🔍 searchUsers: Firebase not ready, returning empty');
            return [];
        }

        const searchText = queryText.toLowerCase().trim();
        if (searchText.length < 2) {
            console.log('🔍 searchUsers: Query too short:', searchText);
            return [];
        }

        const usersRef = collection(db, 'users');
        const results: User[] = [];
        const seenIds = new Set<string>();

        const addUserToResults = (docSnapshot: any) => {
            if (!seenIds.has(docSnapshot.id)) {
                seenIds.add(docSnapshot.id);
                const data = docSnapshot.data();
                results.push({
                    id: docSnapshot.id,
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
        };

        try {
            console.log('🔍 userService.searchUsers:', searchText);

            // Run all queries in parallel for speed
            const queries: Promise<any>[] = [];

            // 1. Search by displayNameLower (prefix match)
            const nameQuery = query(
                usersRef,
                where('displayNameLower', '>=', searchText),
                where('displayNameLower', '<=', searchText + '\uf8ff'),
                limit(10)
            );
            queries.push(getDocs(nameQuery).catch(e => {
                console.log('⚠️ displayNameLower query failed:', e?.code);
                return { docs: [] };
            }));

            // 2. Always search by emailLower (prefix match)
            const emailQuery = query(
                usersRef,
                where('emailLower', '>=', searchText),
                where('emailLower', '<=', searchText + '\uf8ff'),
                limit(10)
            );
            queries.push(getDocs(emailQuery).catch(e => {
                console.log('⚠️ emailLower query failed:', e?.code);
                return { docs: [] };
            }));

            // 3. Fallback: Search by original email (for legacy users without emailLower)
            const emailFallbackQuery = query(
                usersRef,
                where('email', '>=', searchText),
                where('email', '<=', searchText + '\uf8ff'),
                limit(10)
            );
            queries.push(getDocs(emailFallbackQuery).catch(e => {
                console.log('⚠️ email fallback query failed:', e?.code);
                return { docs: [] };
            }));

            // 4. Fallback: Search by original displayName (for legacy users without displayNameLower)
            const nameFallbackQuery = query(
                usersRef,
                where('displayName', '>=', queryText.trim()),
                where('displayName', '<=', queryText.trim() + '\uf8ff'),
                limit(10)
            );
            queries.push(getDocs(nameFallbackQuery).catch(e => {
                console.log('⚠️ displayName fallback query failed:', e?.code);
                return { docs: [] };
            }));

            // Execute all queries in parallel
            const [nameSnapshot, emailSnapshot, emailFallbackSnapshot, nameFallbackSnapshot] = await Promise.all(queries);

            console.log('🔍 Results - nameLower:', nameSnapshot.docs.length,
                'emailLower:', emailSnapshot.docs.length,
                'emailFallback:', emailFallbackSnapshot.docs.length,
                'nameFallback:', nameFallbackSnapshot.docs.length);

            // Add results from all queries
            nameSnapshot.docs.forEach(addUserToResults);
            emailSnapshot.docs.forEach(addUserToResults);
            emailFallbackSnapshot.docs.forEach(addUserToResults);
            nameFallbackSnapshot.docs.forEach(addUserToResults);

            console.log('🔍 Total unique results:', results.length);
            return results;
        } catch (error) {
            handleFirestoreError(error, 'searchUsers');
            return [];
        }
    },
};

export default userService;
