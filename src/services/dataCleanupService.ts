/**
 * Data Cleanup Service
 * 
 * Handles data integrity operations:
 * - Remove orphaned posts/comments from non-existent users
 * - Update author names to match current user profiles
 * - Clean up stale data
 */

import {
    doc,
    getDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    collection,
    query,
    writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface CleanupResult {
    postsRemoved: number;
    postsUpdated: number;
    commentsRemoved: number;
    commentsUpdated: number;
    errors: string[];
}

export const dataCleanupService = {
    /**
     * Check if a user exists in the database
     */
    async userExists(userId: string): Promise<boolean> {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            return userSnap.exists();
        } catch (error) {
            console.error('Error checking user existence:', error);
            return false;
        }
    },

    /**
     * Get user profile data (for updating author names)
     */
    async getUserProfile(userId: string): Promise<{ displayName: string; photoURL?: string; avatarType?: string; avatarValue?: string } | null> {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) return null;

            const data = userSnap.data();
            return {
                displayName: data.displayName || data.email || 'Anonymous',
                photoURL: data.photoURL,
                avatarType: data.avatarType,
                avatarValue: data.avatarValue,
            };
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    },

    /**
     * Clean up all orphaned posts and comments, and update author names
     * This is a comprehensive cleanup that:
     * 1. Removes posts from non-existent users
     * 2. Removes comments from non-existent users
     * 3. Updates author names to match current user profiles
     */
    async performFullCleanup(): Promise<CleanupResult> {
        const result: CleanupResult = {
            postsRemoved: 0,
            postsUpdated: 0,
            commentsRemoved: 0,
            commentsUpdated: 0,
            errors: [],
        };

        console.log('🧹 Starting data cleanup...');

        try {
            // Cache user profiles to avoid repeated lookups
            const userCache = new Map<string, { exists: boolean; profile: any }>();

            const getUserData = async (userId: string) => {
                if (userCache.has(userId)) {
                    return userCache.get(userId)!;
                }
                const profile = await this.getUserProfile(userId);
                const userData = {
                    exists: profile !== null,
                    profile,
                };
                userCache.set(userId, userData);
                return userData;
            };

            // --- STEP 1: Process Posts ---
            console.log('📝 Processing posts...');
            const postsRef = collection(db, 'posts');
            const postsSnap = await getDocs(query(postsRef));

            for (const postDoc of postsSnap.docs) {
                const postData = postDoc.data();
                const authorId = postData.authorId;

                try {
                    const userData = await getUserData(authorId);

                    if (!userData.exists) {
                        // User doesn't exist - delete the post
                        console.log(`🗑️ Removing orphaned post: ${postDoc.id} (author: ${authorId})`);
                        await deleteDoc(doc(db, 'posts', postDoc.id));
                        result.postsRemoved++;

                        // Also delete all comments on this post
                        const commentsRef = collection(db, 'posts', postDoc.id, 'comments');
                        const commentsSnap = await getDocs(query(commentsRef));
                        for (const commentDoc of commentsSnap.docs) {
                            await deleteDoc(doc(db, 'posts', postDoc.id, 'comments', commentDoc.id));
                            result.commentsRemoved++;
                        }
                    } else {
                        // User exists - check if name needs updating
                        const currentName = userData.profile.displayName;
                        const storedName = postData.authorName;

                        if (currentName !== storedName) {
                            console.log(`✏️ Updating post author name: ${storedName} -> ${currentName}`);
                            await updateDoc(doc(db, 'posts', postDoc.id), {
                                authorName: currentName,
                                photoURL: userData.profile.photoURL || null,
                                avatarType: userData.profile.avatarType || null,
                                avatarValue: userData.profile.avatarValue || null,
                            });
                            result.postsUpdated++;
                        }

                        // Process comments on this post
                        const commentsRef = collection(db, 'posts', postDoc.id, 'comments');
                        const commentsSnap = await getDocs(query(commentsRef));

                        for (const commentDoc of commentsSnap.docs) {
                            const commentData = commentDoc.data();
                            const commentAuthorId = commentData.authorId;

                            try {
                                const commentUserData = await getUserData(commentAuthorId);

                                if (!commentUserData.exists) {
                                    // Comment author doesn't exist - delete comment
                                    console.log(`🗑️ Removing orphaned comment: ${commentDoc.id} (author: ${commentAuthorId})`);
                                    await deleteDoc(doc(db, 'posts', postDoc.id, 'comments', commentDoc.id));
                                    result.commentsRemoved++;

                                    // Update post comment count
                                    const currentCount = postData.commentCount || 0;
                                    if (currentCount > 0) {
                                        await updateDoc(doc(db, 'posts', postDoc.id), {
                                            commentCount: currentCount - 1,
                                        });
                                    }
                                } else {
                                    // Check if comment author name needs updating
                                    const commentCurrentName = commentUserData.profile.displayName;
                                    const commentStoredName = commentData.authorName;

                                    if (commentCurrentName !== commentStoredName) {
                                        console.log(`✏️ Updating comment author name: ${commentStoredName} -> ${commentCurrentName}`);
                                        await updateDoc(doc(db, 'posts', postDoc.id, 'comments', commentDoc.id), {
                                            authorName: commentCurrentName,
                                            photoURL: commentUserData.profile.photoURL || null,
                                            avatarType: commentUserData.profile.avatarType || null,
                                            avatarValue: commentUserData.profile.avatarValue || null,
                                        });
                                        result.commentsUpdated++;
                                    }
                                }
                            } catch (commentError: any) {
                                result.errors.push(`Comment ${commentDoc.id}: ${commentError.message}`);
                            }
                        }
                    }
                } catch (postError: any) {
                    result.errors.push(`Post ${postDoc.id}: ${postError.message}`);
                }
            }

            console.log('✅ Cleanup complete!');
            console.log(`   Posts removed: ${result.postsRemoved}`);
            console.log(`   Posts updated: ${result.postsUpdated}`);
            console.log(`   Comments removed: ${result.commentsRemoved}`);
            console.log(`   Comments updated: ${result.commentsUpdated}`);
            if (result.errors.length > 0) {
                console.log(`   Errors: ${result.errors.length}`);
            }

        } catch (error: any) {
            console.error('❌ Cleanup failed:', error);
            result.errors.push(`General error: ${error.message}`);
        }

        return result;
    },

    /**
     * Preview what cleanup would do without making changes
     * Useful for debugging before running actual cleanup
     */
    async previewCleanup(): Promise<{
        orphanedPosts: string[];
        orphanedComments: string[];
        outdatedNames: { id: string; type: string; oldName: string; newName: string }[];
    }> {
        const result = {
            orphanedPosts: [] as string[],
            orphanedComments: [] as string[],
            outdatedNames: [] as { id: string; type: string; oldName: string; newName: string }[],
        };

        console.log('👀 Previewing cleanup (no changes will be made)...');

        const userCache = new Map<string, { exists: boolean; profile: any }>();

        const getUserData = async (userId: string) => {
            if (userCache.has(userId)) {
                return userCache.get(userId)!;
            }
            const profile = await this.getUserProfile(userId);
            const userData = {
                exists: profile !== null,
                profile,
            };
            userCache.set(userId, userData);
            return userData;
        };

        // Process posts
        const postsRef = collection(db, 'posts');
        const postsSnap = await getDocs(query(postsRef));

        for (const postDoc of postsSnap.docs) {
            const postData = postDoc.data();
            const authorId = postData.authorId;
            const userData = await getUserData(authorId);

            if (!userData.exists) {
                result.orphanedPosts.push(`${postDoc.id} (author: ${postData.authorName})`);
            } else {
                const currentName = userData.profile.displayName;
                const storedName = postData.authorName;
                if (currentName !== storedName) {
                    result.outdatedNames.push({
                        id: postDoc.id,
                        type: 'post',
                        oldName: storedName,
                        newName: currentName,
                    });
                }
            }

            // Process comments
            const commentsRef = collection(db, 'posts', postDoc.id, 'comments');
            const commentsSnap = await getDocs(query(commentsRef));

            for (const commentDoc of commentsSnap.docs) {
                const commentData = commentDoc.data();
                const commentAuthorId = commentData.authorId;
                const commentUserData = await getUserData(commentAuthorId);

                if (!commentUserData.exists) {
                    result.orphanedComments.push(`${commentDoc.id} on post ${postDoc.id} (author: ${commentData.authorName})`);
                } else {
                    const currentName = commentUserData.profile.displayName;
                    const storedName = commentData.authorName;
                    if (currentName !== storedName) {
                        result.outdatedNames.push({
                            id: commentDoc.id,
                            type: 'comment',
                            oldName: storedName,
                            newName: currentName,
                        });
                    }
                }
            }
        }

        console.log('📋 Preview Results:');
        console.log(`   Orphaned posts: ${result.orphanedPosts.length}`);
        console.log(`   Orphaned comments: ${result.orphanedComments.length}`);
        console.log(`   Outdated names: ${result.outdatedNames.length}`);

        return result;
    },
};

export default dataCleanupService;
