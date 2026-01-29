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
        toUid: string
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
            fromUsername,
            toUid,
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
            displayName: senderProfile.displayName || senderProfile.email,
            email: senderProfile.email,
            photoURL: senderProfile.photoURL || null,
            addedAt: serverTimestamp(),
        });

        // Add receiver to sender's friends
        const senderFriendRef = doc(db, 'users', requestData.fromUid, 'friends', acceptingUid);
        batch.set(senderFriendRef, {
            uid: acceptingUid,
            displayName: receiverProfile.displayName || receiverProfile.email,
            email: receiverProfile.email,
            photoURL: receiverProfile.photoURL || null,
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
     */
    async getInnerCircle(userId: string): Promise<Friend[]> {
        const friendsRef = collection(db, 'users', userId, 'friends');
        const snapshot = await getDocs(friendsRef);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                uid: doc.id,
                displayName: data.displayName,
                email: data.email,
                photoURL: data.photoURL,
                addedAt: toDate(data.addedAt) as Date,
            };
        });
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
            feeling: data.feeling || null,
            updatedAt: toDate(data.updatedAt) as Date,
        };
    },

    /**
     * Get leaderboard data (top users by health score)
     */
    async getLeaderboard(limitCount: number = 10): Promise<UserStats[]> {
        const statsRef = collection(db, 'userStats');
        const q = query(
            statsRef,
            orderBy('healthScore', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                userId: doc.id,
                currentStreak: data.currentStreak || 0,
                healthScore: data.healthScore || 0,
                goalAchieved: data.goalAchieved || false,
                feeling: data.feeling || null,
                updatedAt: toDate(data.updatedAt) as Date,
            };
        });
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
