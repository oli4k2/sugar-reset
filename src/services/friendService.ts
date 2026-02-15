/**
 * Friend Service
 * 
 * Handles all friend-related operations:
 * - Searching users
 * - Sending/accepting/declining friend requests
 * - Managing Inner Circle (friends list)
 * - Real-time listeners for friend data
 */

import {
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    addDoc,
    serverTimestamp,
    onSnapshot,
    Unsubscribe,
    writeBatch,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, Friend, FriendRequest, UserStats } from '../types';
import { userService } from './userService';

/**
 * Convert Firestore timestamp to Date
 */
const toDate = (timestamp: Timestamp | null): Date | null => {
    return timestamp ? timestamp.toDate() : null;
};

export const friendService = {
    /**
     * Search for users by name or email
     * Delegates to userService.searchUsers
     */
    async searchUsers(queryText: string): Promise<User[]> {
        if (!queryText || queryText.length < 2) {
            return [];
        }
        return userService.searchUsers(queryText);
    },

    /**
     * Send a friend request to another user
     */
    async sendFriendRequest(
        fromUid: string,
        fromName: string,
        fromUsername: string | undefined,
        toUid: string,
        toName?: string,
        toEmail?: string
    ): Promise<string> {
        // Check if request already exists
        const requestsRef = collection(db, 'friendRequests');
        const existingQuery = query(
            requestsRef,
            where('fromUid', '==', fromUid),
            where('toUid', '==', toUid),
            where('status', '==', 'pending')
        );
        const existing = await getDocs(existingQuery);

        if (!existing.empty) {
            throw new Error('Friend request already sent');
        }

        // Check if already friends
        const friendDoc = await getDoc(doc(db, 'users', fromUid, 'friends', toUid));
        if (friendDoc.exists()) {
            throw new Error('Already friends with this user');
        }

        // Check if there's a pending request FROM the other user (auto-accept)
        const reverseQuery = query(
            requestsRef,
            where('fromUid', '==', toUid),
            where('toUid', '==', fromUid),
            where('status', '==', 'pending')
        );
        const reverseRequest = await getDocs(reverseQuery);

        if (!reverseRequest.empty) {
            // Auto-accept the existing request instead of creating a new one
            const existingRequestId = reverseRequest.docs[0].id;
            await this.acceptFriendRequest(existingRequestId, fromUid);
            return existingRequestId;
        }

        // Create new friend request
        const newRequest: Omit<FriendRequest, 'id'> = {
            fromUid,
            fromName,
            fromUsername: fromUsername || null, // Use null instead of undefined
            toUid,
            toName: toName || null,
            toEmail: toEmail || null,
            status: 'pending',
            createdAt: new Date(),
        };

        const docRef = await addDoc(requestsRef, {
            ...newRequest,
            createdAt: serverTimestamp(),
        });

        return docRef.id;
    },

    /**
     * Accept a friend request (mutual friendship)
     */
    async acceptFriendRequest(requestId: string, acceptingUid: string): Promise<void> {
        const requestRef = doc(db, 'friendRequests', requestId);
        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) {
            throw new Error('Friend request not found');
        }

        const requestData = requestSnap.data();

        // Verify the accepting user is the recipient
        if (requestData.toUid !== acceptingUid) {
            throw new Error('Cannot accept this request');
        }

        // Get both users' profiles for the friend records
        const [senderProfile, receiverProfile] = await Promise.all([
            userService.getUserProfile(requestData.fromUid),
            userService.getUserProfile(acceptingUid),
        ]);

        if (!senderProfile || !receiverProfile) {
            throw new Error('User profiles not found');
        }

        // Use batch write to add friends to both users atomically
        const batch = writeBatch(db);

        // Add sender to receiver's friends
        const receiverFriendRef = doc(db, 'users', acceptingUid, 'friends', requestData.fromUid);
        batch.set(receiverFriendRef, {
            uid: requestData.fromUid,
            displayName: senderProfile.displayName || senderProfile.email || 'Unknown',
            email: senderProfile.email || null,
            photoURL: senderProfile.photoURL || null,
            avatarType: senderProfile.avatarType || 'initial',
            avatarValue: senderProfile.avatarValue || null,
            addedAt: serverTimestamp(),
        });

        // Add receiver to sender's friends
        const senderFriendRef = doc(db, 'users', requestData.fromUid, 'friends', acceptingUid);
        batch.set(senderFriendRef, {
            uid: acceptingUid,
            displayName: receiverProfile.displayName || receiverProfile.email || 'Unknown',
            email: receiverProfile.email || null,
            photoURL: receiverProfile.photoURL || null,
            avatarType: receiverProfile.avatarType || 'initial',
            avatarValue: receiverProfile.avatarValue || null,
            addedAt: serverTimestamp(),
        });

        // Update request status
        batch.update(requestRef, {
            status: 'accepted',
            acceptedAt: serverTimestamp(),
        });

        await batch.commit();
    },

    /**
     * Decline a friend request
     */
    async declineFriendRequest(requestId: string, decliningUid: string): Promise<void> {
        const requestRef = doc(db, 'friendRequests', requestId);
        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) {
            throw new Error('Friend request not found');
        }

        const requestData = requestSnap.data();

        // Verify the declining user is the recipient
        if (requestData.toUid !== decliningUid) {
            throw new Error('Cannot decline this request');
        }

        // Update status to declined
        await setDoc(requestRef, { status: 'declined' }, { merge: true });
    },

    /**
     * Cancel an outgoing friend request
     */
    async cancelFriendRequest(requestId: string, cancellingUid: string): Promise<void> {
        const requestRef = doc(db, 'friendRequests', requestId);
        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) {
            throw new Error('Friend request not found');
        }

        const requestData = requestSnap.data();

        // Verify the cancelling user is the sender
        if (requestData.fromUid !== cancellingUid) {
            throw new Error('Cannot cancel this request');
        }

        await deleteDoc(requestRef);
    },

    /**
     * Remove a friend (mutual removal)
     */
    async removeFriend(userId: string, friendId: string): Promise<void> {
        const batch = writeBatch(db);

        // Remove from both users' friend lists
        batch.delete(doc(db, 'users', userId, 'friends', friendId));
        batch.delete(doc(db, 'users', friendId, 'friends', userId));

        await batch.commit();
    },

    /**
     * Get user's Inner Circle (friends list) - one-time fetch
     * Fetches LIVE user profiles to ensure names/avatars are current
     */
    async getInnerCircle(userId: string): Promise<Friend[]> {
        const friendsRef = collection(db, 'users', userId, 'friends');
        const snapshot = await getDocs(friendsRef);

        // Get friend UIDs
        const friendDocs = snapshot.docs.map(doc => ({
            uid: doc.id,
            addedAt: toDate(doc.data().addedAt) as Date,
        }));

        // Fetch live profiles for all friends
        const friends: Friend[] = await Promise.all(
            friendDocs.map(async ({ uid, addedAt }) => {
                try {
                    // Get live profile data
                    const profile = await userService.getUserProfile(uid);
                    if (profile) {
                        return {
                            uid,
                            displayName: profile.displayName || profile.email || 'Unknown',
                            email: profile.email,
                            photoURL: profile.photoURL,
                            avatarType: profile.avatarType,
                            avatarValue: profile.avatarValue,
                            addedAt,
                        };
                    }
                } catch (e) {
                    console.warn('Could not fetch live profile for friend:', uid);
                }
                // Fallback to stored data if live fetch fails
                const storedDoc = snapshot.docs.find(d => d.id === uid);
                const data = storedDoc?.data() || {};
                return {
                    uid,
                    displayName: data.displayName || 'Unknown',
                    email: data.email,
                    photoURL: data.photoURL,
                    avatarType: data.avatarType,
                    avatarValue: data.avatarValue,
                    addedAt,
                };
            })
        );

        return friends;
    },

    /**
     * Subscribe to Inner Circle updates (real-time)
     */
    subscribeToInnerCircle(
        userId: string,
        onUpdate: (friends: Friend[]) => void
    ): Unsubscribe {
        const friendsRef = collection(db, 'users', userId, 'friends');

        return onSnapshot(friendsRef, (snapshot) => {
            const friends = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    uid: doc.id,
                    displayName: data.displayName,
                    email: data.email,
                    photoURL: data.photoURL,
                    addedAt: toDate(data.addedAt) as Date,
                };
            });
            onUpdate(friends);
        });
    },

    /**
     * Get incoming friend requests
     */
    async getIncomingRequests(userId: string): Promise<FriendRequest[]> {
        const requestsRef = collection(db, 'friendRequests');
        const q = query(
            requestsRef,
            where('toUid', '==', userId),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                fromUid: data.fromUid,
                fromName: data.fromName,
                fromUsername: data.fromUsername,
                toUid: data.toUid,
                status: data.status,
                createdAt: toDate(data.createdAt) as Date,
            };
        });
    },

    /**
     * Subscribe to incoming friend requests (real-time)
     */
    subscribeToIncomingRequests(
        userId: string,
        onUpdate: (requests: FriendRequest[]) => void
    ): Unsubscribe {
        const requestsRef = collection(db, 'friendRequests');
        const q = query(
            requestsRef,
            where('toUid', '==', userId),
            where('status', '==', 'pending')
        );

        return onSnapshot(q, (snapshot) => {
            const requests = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    fromUid: data.fromUid,
                    fromName: data.fromName,
                    fromUsername: data.fromUsername,
                    toUid: data.toUid,
                    status: data.status,
                    createdAt: toDate(data.createdAt) as Date,
                };
            });
            onUpdate(requests);
        });
    },

    /**
     * Get outgoing friend requests
     */
    async getOutgoingRequests(userId: string): Promise<FriendRequest[]> {
        const requestsRef = collection(db, 'friendRequests');
        const q = query(
            requestsRef,
            where('fromUid', '==', userId),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                fromUid: data.fromUid,
                fromName: data.fromName,
                fromUsername: data.fromUsername,
                toUid: data.toUid,
                toName: data.toName || null,
                toEmail: data.toEmail || null,
                status: data.status,
                createdAt: toDate(data.createdAt) as Date,
            };
        });
    },

    /**
     * Get friend's stats (health score, streak)
     */
    async getFriendStats(friendUid: string): Promise<UserStats | null> {
        const statsRef = doc(db, 'userStats', friendUid);
        const statsSnap = await getDoc(statsRef);

        if (!statsSnap.exists()) {
            return null;
        }

        const data = statsSnap.data();
        return {
            userId: friendUid,
            currentStreak: data.currentStreak || 0,
            healthScore: data.healthScore || 0,
            goalAchieved: data.goalAchieved || false,
            pledgedToday: data.pledgedToday || false,
            updatedAt: toDate(data.updatedAt) as Date,
        };
    },

    /**
     * Get leaderboard data (top users by health score)
     * Only includes users who have been active in the past week
     */
    async getLeaderboard(limitCount: number = 10): Promise<UserStats[]> {
        // Calculate date 7 days ago
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const statsRef = collection(db, 'userStats');
        const q = query(
            statsRef,
            where('updatedAt', '>=', oneWeekAgo),
            orderBy('updatedAt', 'desc'), // Need to order by filtered field first
            orderBy('healthScore', 'desc'),
            limit(limitCount * 2) // Fetch more to account for filtered-out users
        );

        try {
            const snapshot = await getDocs(q);
            const now = new Date();
            const stats = snapshot.docs.map(doc => {
                const data = doc.data();
                const updatedAt = toDate(data.updatedAt) as Date;
                // Zero-out streak if user hasn't updated in 2+ days (grace period exceeded)
                let adjustedStreak = data.currentStreak || 0;
                if (updatedAt) {
                    const daysSince = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysSince > 2) adjustedStreak = 0;
                }
                return {
                    userId: doc.id,
                    currentStreak: adjustedStreak,
                    healthScore: data.healthScore || 0,
                    goalAchieved: data.goalAchieved || false,
                    pledgedToday: data.pledgedToday || false,
                    updatedAt,
                };
            });

            // Sort by healthScore since Firestore compound ordering may not be exact
            stats.sort((a, b) => b.healthScore - a.healthScore);

            // Return only the requested limit
            return stats.slice(0, limitCount);
        } catch (error: any) {
            // If query fails (e.g., missing index), fall back to simpler query
            console.warn('Leaderboard query with filters failed, using fallback:', error?.code);

            const fallbackQ = query(
                statsRef,
                orderBy('healthScore', 'desc'),
                limit(limitCount * 3) // Fetch extra to filter out stale users
            );

            const fallbackSnapshot = await getDocs(fallbackQ);
            const now2 = new Date();
            const oneWeekAgoFallback = new Date();
            oneWeekAgoFallback.setDate(oneWeekAgoFallback.getDate() - 7);

            const fallbackStats = fallbackSnapshot.docs
                .map(doc => {
                    const data = doc.data();
                    const updatedAt = toDate(data.updatedAt) as Date;
                    let adjustedStreak = data.currentStreak || 0;
                    if (updatedAt) {
                        const daysSince = Math.floor((now2.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
                        if (daysSince > 2) adjustedStreak = 0;
                    }
                    return {
                        userId: doc.id,
                        currentStreak: adjustedStreak,
                        healthScore: data.healthScore || 0,
                        goalAchieved: data.goalAchieved || false,
                        pledgedToday: data.pledgedToday || false,
                        updatedAt,
                    };
                })
                // Filter: only include users active in the last 7 days
                .filter(stat => stat.updatedAt && stat.updatedAt >= oneWeekAgoFallback);

            return fallbackStats.slice(0, limitCount);
        }
    },

    /**
     * Get leaderboard data by sugar-free streak
     * Only includes users who have been active in the past week
     */
    async getLeaderboardByStreak(limitCount: number = 10): Promise<UserStats[]> {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const statsRef = collection(db, 'userStats');
        const q = query(
            statsRef,
            where('updatedAt', '>=', oneWeekAgo),
            orderBy('updatedAt', 'desc'),
            orderBy('currentStreak', 'desc'),
            limit(limitCount * 2)
        );

        try {
            const snapshot = await getDocs(q);
            const now = new Date();
            const stats = snapshot.docs.map(doc => {
                const data = doc.data();
                const updatedAt = toDate(data.updatedAt) as Date;
                // Zero-out streak if user hasn't updated in 2+ days (grace period exceeded)
                let adjustedStreak = data.currentStreak || 0;
                if (updatedAt) {
                    const daysSince = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysSince > 2) adjustedStreak = 0;
                }
                return {
                    userId: doc.id,
                    currentStreak: adjustedStreak,
                    healthScore: data.healthScore || 0,
                    goalAchieved: data.goalAchieved || false,
                    pledgedToday: data.pledgedToday || false,
                    updatedAt,
                };
            });

            // Re-sort by adjusted streak
            stats.sort((a, b) => b.currentStreak - a.currentStreak);

            return stats.slice(0, limitCount);
        } catch (error: any) {
            console.warn('Streak leaderboard query with filters failed, using fallback:', error?.code);

            const fallbackQ = query(
                statsRef,
                orderBy('currentStreak', 'desc'),
                limit(limitCount * 3) // Fetch extra to filter out stale users
            );

            const fallbackSnapshot = await getDocs(fallbackQ);
            const now2 = new Date();
            const oneWeekAgoFallback = new Date();
            oneWeekAgoFallback.setDate(oneWeekAgoFallback.getDate() - 7);

            const fallbackStats = fallbackSnapshot.docs
                .map(doc => {
                    const data = doc.data();
                    const updatedAt = toDate(data.updatedAt) as Date;
                    let adjustedStreak = data.currentStreak || 0;
                    if (updatedAt) {
                        const daysSince = Math.floor((now2.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
                        if (daysSince > 2) adjustedStreak = 0;
                    }
                    return {
                        userId: doc.id,
                        currentStreak: adjustedStreak,
                        healthScore: data.healthScore || 0,
                        goalAchieved: data.goalAchieved || false,
                        pledgedToday: data.pledgedToday || false,
                        updatedAt,
                    };
                })
                // Filter: only include users active in the last 7 days
                .filter(stat => stat.updatedAt && stat.updatedAt >= oneWeekAgoFallback);

            fallbackStats.sort((a, b) => b.currentStreak - a.currentStreak);
            return fallbackStats.slice(0, limitCount);
        }
    },

    /**
     * Get multiple users' profiles by their IDs (for leaderboard display names)
     */
    async getUsersByIds(userIds: string[]): Promise<Map<string, User>> {
        const users = new Map<string, User>();

        // Firestore doesn't support 'in' queries with more than 10 items
        // So we batch the requests
        const batches = [];
        for (let i = 0; i < userIds.length; i += 10) {
            batches.push(userIds.slice(i, i + 10));
        }

        for (const batch of batches) {
            const promises = batch.map(uid => userService.getUserProfile(uid));
            const results = await Promise.all(promises);
            results.forEach((user, index) => {
                if (user) {
                    users.set(batch[index], user);
                }
            });
        }

        return users;
    },
};

export default friendService;
