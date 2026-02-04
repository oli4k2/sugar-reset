/**
 * Admin Service
 * 
 * Handles admin-related functionality for content moderation.
 * Admins are identified by their Firebase UID stored in the 'admins' collection.
 */

import { doc, getDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

// Cache for admin status to avoid repeated Firestore calls
const adminCache: Map<string, { isAdmin: boolean; timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const adminService = {
    /**
     * Check if a user is an admin
     * Checks the 'admins' collection in Firestore
     */
    async isAdmin(userId: string): Promise<boolean> {
        if (!userId) return false;

        // Check cache first
        const cached = adminCache.get(userId);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.isAdmin;
        }

        try {
            const adminRef = doc(db, 'admins', userId);
            const adminSnap = await getDoc(adminRef);
            const isAdmin = adminSnap.exists();

            // Update cache
            adminCache.set(userId, { isAdmin, timestamp: Date.now() });

            return isAdmin;
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    },

    /**
     * Delete a post as admin (no author check)
     */
    async deletePostAsAdmin(postId: string): Promise<boolean> {
        try {
            // Delete all comments first
            const commentsRef = collection(db, 'posts', postId, 'comments');
            const commentsSnap = await getDocs(commentsRef);

            const deletePromises = commentsSnap.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);

            // Delete all votes
            const votesRef = collection(db, 'posts', postId, 'votes');
            const votesSnap = await getDocs(votesRef);

            const voteDeletePromises = votesSnap.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(voteDeletePromises);

            // Delete the post
            const postRef = doc(db, 'posts', postId);
            await deleteDoc(postRef);

            console.log(`✅ Admin deleted post: ${postId}`);
            return true;
        } catch (error) {
            console.error('Error deleting post as admin:', error);
            return false;
        }
    },

    /**
     * Delete a comment as admin (no author check)
     */
    async deleteCommentAsAdmin(postId: string, commentId: string): Promise<boolean> {
        try {
            const commentRef = doc(db, 'posts', postId, 'comments', commentId);
            await deleteDoc(commentRef);

            console.log(`✅ Admin deleted comment: ${commentId} from post: ${postId}`);
            return true;
        } catch (error) {
            console.error('Error deleting comment as admin:', error);
            return false;
        }
    },

    /**
     * Clear the admin cache (useful after role changes)
     */
    clearCache(): void {
        adminCache.clear();
    },
};

export default adminService;
