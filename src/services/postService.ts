/**
 * Post Service
 * 
 * Handles community forum posts:
 * - Creating posts
 * - Upvoting/downvoting
 * - Comments
 * - Fetching posts with sorting
 */

import {
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    addDoc,
    serverTimestamp,
    increment,
    Timestamp,
    QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Post } from '../types';
import { profanityFilter } from './profanityFilter';

// Remove local Post interface definition
/* export interface Post ... (removed) */

export interface Comment {
    id: string;
    postId: string;
    authorId: string;
    authorName: string;
    photoURL?: string;
    avatarType?: 'photo' | 'emoji' | 'initial' | null;
    avatarValue?: string | null;
    content: string;
    createdAt: Date;
}

export interface UserVote {
    postId: string;
    vote: 'up' | 'down';
}

const toDate = (timestamp: Timestamp | null): Date => {
    return timestamp ? timestamp.toDate() : new Date();
};

const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};

export const postService = {
    /**
     * Create a new post
     */
    async createPost(
        authorId: string,
        authorName: string,
        authorUsername: string | undefined,
        title: string,
        content: string,
        tags: string[] = [],
        avatarData?: {
            photoURL?: string;
            avatarType?: 'photo' | 'emoji' | 'initial' | null;
            avatarValue?: string | null;
        }
    ): Promise<string> {
        // Check for profanity in title and content
        if (profanityFilter.containsProfanity(title)) {
            throw new Error('Your title contains inappropriate language. Please revise and try again.');
        }
        if (profanityFilter.containsProfanity(content)) {
            throw new Error('Your post contains inappropriate language. Please revise and try again.');
        }

        const postsRef = collection(db, 'posts');

        const newPost = {
            authorId,
            authorName,
            authorUsername: authorUsername || null,
            photoURL: avatarData?.photoURL || null,
            avatarType: avatarData?.avatarType || null,
            avatarValue: avatarData?.avatarValue || null,
            title: title.trim(),
            content: content.trim(),
            tags: tags.map(t => t.toLowerCase().trim()).filter(Boolean),
            upvotes: 0,
            commentCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(postsRef, newPost);
        return docRef.id;
    },

    /**
     * Get posts with sorting
     */
    async getPosts(
        sortBy: 'new' | 'hot' | 'top' = 'hot',
        limitCount: number = 20
    ): Promise<Post[]> {
        const postsRef = collection(db, 'posts');
        let q;

        switch (sortBy) {
            case 'new':
                q = query(postsRef, orderBy('createdAt', 'desc'), limit(limitCount));
                break;
            case 'top':
                q = query(postsRef, orderBy('upvotes', 'desc'), limit(limitCount));
                break;
            case 'hot':
            default:
                // Hot = combination of recent + upvotes (simplified: recent with upvotes)
                q = query(postsRef, orderBy('createdAt', 'desc'), limit(limitCount));
                break;
        }

        const snapshot = await getDocs(q);
        const posts = snapshot.docs.map(doc => this.docToPost(doc));

        // For 'hot', sort by a combination of time and upvotes
        if (sortBy === 'hot') {
            posts.sort((a, b) => {
                const ageA = (Date.now() - a.createdAt.getTime()) / (1000 * 60 * 60); // hours
                const ageB = (Date.now() - b.createdAt.getTime()) / (1000 * 60 * 60);
                const scoreA = a.upvotes / (ageA + 2); // +2 to prevent division issues
                const scoreB = b.upvotes / (ageB + 2);
                return scoreB - scoreA;
            });
        }

        return posts;
    },

    /**
     * Convert Firestore document to Post
     */
    docToPost(doc: QueryDocumentSnapshot): Post {
        const data = doc.data();
        return {
            id: doc.id,
            authorId: data.authorId,
            authorName: data.authorName,
            authorUsername: data.authorUsername,
            photoURL: data.photoURL,
            avatarType: data.avatarType,
            avatarValue: data.avatarValue,
            title: data.title,
            content: data.content,
            tags: data.tags || [],
            upvotes: data.upvotes || 0,
            commentCount: data.commentCount || 0,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
        };
    },

    /**
     * Get a single post by ID
     */
    async getPost(postId: string): Promise<Post | null> {
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) return null;

        const data = postSnap.data();
        return {
            id: postSnap.id,
            authorId: data.authorId,
            authorName: data.authorName,
            authorUsername: data.authorUsername,
            photoURL: data.photoURL,
            avatarType: data.avatarType,
            avatarValue: data.avatarValue,
            title: data.title,
            content: data.content,
            tags: data.tags || [],
            upvotes: data.upvotes || 0,
            commentCount: data.commentCount || 0,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
        };
    },

    /**
     * Upvote a post
     */
    async upvotePost(postId: string, userId: string): Promise<boolean> {
        // Check if user already voted
        const voteRef = doc(db, 'posts', postId, 'votes', userId);
        const voteSnap = await getDoc(voteRef);

        if (voteSnap.exists()) {
            const existingVote = voteSnap.data().vote;
            if (existingVote === 'up') {
                // Remove upvote
                await deleteDoc(voteRef);
                await updateDoc(doc(db, 'posts', postId), { upvotes: increment(-1) });
                return false; // Vote removed
            } else {
                // Change from down to up
                await setDoc(voteRef, { vote: 'up' });
                await updateDoc(doc(db, 'posts', postId), { upvotes: increment(2) });
                return true;
            }
        } else {
            // New upvote
            await setDoc(voteRef, { vote: 'up' });
            await updateDoc(doc(db, 'posts', postId), { upvotes: increment(1) });
            return true;
        }
    },

    /**
     * Get user's vote on a post
     */
    async getUserVote(postId: string, userId: string): Promise<'up' | 'down' | null> {
        const voteRef = doc(db, 'posts', postId, 'votes', userId);
        const voteSnap = await getDoc(voteRef);

        if (!voteSnap.exists()) return null;
        return voteSnap.data().vote;
    },

    /**
     * Add a comment to a post
     */
    async addComment(
        postId: string,
        authorId: string,
        authorName: string,
        content: string,
        avatarData?: {
            photoURL?: string;
            avatarType?: 'photo' | 'emoji' | 'initial' | null;
            avatarValue?: string | null;
        }
    ): Promise<string> {
        // Check for profanity in comment
        if (profanityFilter.containsProfanity(content)) {
            throw new Error('Your comment contains inappropriate language. Please revise and try again.');
        }

        const commentsRef = collection(db, 'posts', postId, 'comments');

        const newComment = {
            postId,
            authorId,
            authorName,
            photoURL: avatarData?.photoURL || null,
            avatarType: avatarData?.avatarType || null,
            avatarValue: avatarData?.avatarValue || null,
            content: content.trim(),
            createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(commentsRef, newComment);

        // Update comment count on post
        await updateDoc(doc(db, 'posts', postId), {
            commentCount: increment(1)
        });

        return docRef.id;
    },

    /**
     * Get comments for a post
     */
    async getComments(postId: string): Promise<Comment[]> {
        const commentsRef = collection(db, 'posts', postId, 'comments');
        const q = query(commentsRef, orderBy('createdAt', 'asc'));

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                postId: data.postId,
                authorId: data.authorId,
                authorName: data.authorName,
                photoURL: data.photoURL,
                avatarType: data.avatarType,
                avatarValue: data.avatarValue,
                content: data.content,
                createdAt: toDate(data.createdAt),
            };
        });
    },

    /**
     * Delete a post (only by author)
     */
    async deletePost(postId: string, userId: string): Promise<boolean> {
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) return false;
        if (postSnap.data().authorId !== userId) return false;

        await deleteDoc(postRef);
        return true;
    },

    /**
     * Delete a comment (only by author)
     */
    async deleteComment(postId: string, commentId: string, userId: string): Promise<boolean> {
        const commentRef = doc(db, 'posts', postId, 'comments', commentId);
        const commentSnap = await getDoc(commentRef);

        if (!commentSnap.exists()) return false;
        if (commentSnap.data().authorId !== userId) return false;

        await deleteDoc(commentRef);

        // Decrement comment count on post
        await updateDoc(doc(db, 'posts', postId), {
            commentCount: increment(-1)
        });

        return true;
    },

    /**
     * Helper: Get time ago string
     */
    getTimeAgo,
};

export default postService;
