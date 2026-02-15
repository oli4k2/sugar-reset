/**
 * Firebase Cloud Functions for SugarReset
 * 
 * These functions provide a reliable way to fetch data from Firestore
 * when the client SDK has connection issues.
 */

const { setGlobalOptions } = require("firebase-functions");
const { onCall, HttpsError } = require("firebase-functions/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// Initialize Firebase Admin
initializeApp();
// Use 'default' database ID explicitly (this project uses 'default' not '(default)')
const db = getFirestore('default');

// Set global options for cost control
setGlobalOptions({ maxInstances: 10 });

/**
 * Get community stats
 * This function fetches community stats from Firestore and returns them.
 * Use this as a fallback when the client SDK can't connect.
 */
exports.getCommunityStats = onCall(async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
        const statsDoc = await db.collection('communityStats').doc('latest').get();

        if (!statsDoc.exists) {
            // Return default stats if document doesn't exist
            return {
                totalUsers: 0,
                activeUsers: 0,
                averageStreak: 0,
                averageHealthScore: 0,
                totalDaysSugarFree: 0,
                topStreak: 0,
                topHealthScore: 0,
                updatedAt: new Date().toISOString(),
            };
        }

        const data = statsDoc.data();
        return {
            totalUsers: data.totalUsers || 0,
            activeUsers: data.activeUsers || 0,
            averageStreak: data.averageStreak || 0,
            averageHealthScore: data.averageHealthScore || 0,
            totalDaysSugarFree: data.totalDaysSugarFree || 0,
            topStreak: data.topStreak || 0,
            topHealthScore: data.topHealthScore || 0,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error fetching community stats:', error);
        throw new HttpsError('internal', 'Failed to fetch community stats');
    }
});

/**
 * Get posts for the community feed
 */
exports.getPosts = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const sortBy = request.data?.sortBy || 'hot';
    const limitCount = request.data?.limit || 20;

    try {
        let query = db.collection('posts');

        if (sortBy === 'new') {
            query = query.orderBy('createdAt', 'desc');
        } else if (sortBy === 'top') {
            query = query.orderBy('upvotes', 'desc');
        } else {
            // Hot - order by recent
            query = query.orderBy('createdAt', 'desc');
        }

        query = query.limit(limitCount);
        const snapshot = await query.get();

        const posts = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                authorId: data.authorId,
                authorName: data.authorName,
                authorUsername: data.authorUsername,
                title: data.title,
                content: data.content,
                tags: data.tags || [],
                upvotes: data.upvotes || 0,
                commentCount: data.commentCount || 0,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            };
        });

        return { posts };
    } catch (error) {
        console.error('Error fetching posts:', error);
        throw new HttpsError('internal', 'Failed to fetch posts');
    }
});

/**
 * Get leaderboard data
 * Only includes users who have been active in the last 7 days
 * Health scores are based on rolling 7-day data synced by the client
 */
exports.getLeaderboard = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const limitCount = request.data?.limit || 10;

    // Calculate date 7 days ago — only show recently active users
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
        const snapshot = await db.collection('userStats')
            .where('updatedAt', '>=', sevenDaysAgo)
            .orderBy('updatedAt', 'desc')
            .orderBy('healthScore', 'desc')
            .limit(limitCount * 2)
            .get();

        const now = new Date();
        const entries = snapshot.docs.map((doc) => {
            const data = doc.data();
            const updatedAt = data.updatedAt?.toDate?.();
            // Zero-out streak if user hasn't updated in 2+ days (grace period exceeded)
            let adjustedStreak = data.currentStreak || 0;
            if (updatedAt) {
                const daysSince = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSince > 2) adjustedStreak = 0;
            }
            return {
                userId: doc.id,
                healthScore: data.healthScore || 0,
                currentStreak: adjustedStreak,
            };
        });

        // Sort by healthScore (Firestore compound ordering may not be exact)
        entries.sort((a, b) => b.healthScore - a.healthScore);

        // Add ranks and trim to requested limit
        const ranked = entries.slice(0, limitCount).map((entry, index) => ({
            ...entry,
            rank: index + 1,
        }));

        return { entries: ranked };
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        throw new HttpsError('internal', 'Failed to fetch leaderboard');
    }
});

/**
 * Recalculate and update community stats
 * 
 * This callable function aggregates all user stats and updates communityStats/latest.
 * Call this after syncing user stats to keep community stats up-to-date.
 */
exports.updateCommunityStats = onCall(async (request) => {
    // Authentication is optional for this function - it's just aggregating public data
    console.log('📊 Recalculating community stats...');

    try {
        // Fetch all user stats
        const snapshot = await db.collection('userStats').get();

        if (snapshot.empty) {
            console.log('📊 No user stats found, setting defaults');
            await db.collection('communityStats').doc('latest').set({
                totalUsers: 0,
                activeUsers: 0,
                averageStreak: 0,
                averageHealthScore: 0,
                totalDaysSugarFree: 0,
                topStreak: 0,
                topHealthScore: 0,
                updatedAt: FieldValue.serverTimestamp(),
            });
            return { success: true, totalUsers: 0 };
        }

        // Calculate aggregated stats
        let totalStreak = 0;
        let totalHealthScore = 0;
        let topStreak = 0;
        let topHealthScore = 0;
        let activeCount = 0;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const streak = data.currentStreak || 0;
            const healthScore = data.healthScore || 0;
            const updatedAt = data.updatedAt?.toDate?.();

            totalStreak += streak;
            totalHealthScore += healthScore;

            if (streak > topStreak) topStreak = streak;
            if (healthScore > topHealthScore) topHealthScore = healthScore;

            // Count as active if updated in last 7 days
            if (updatedAt && updatedAt > sevenDaysAgo) {
                activeCount++;
            }
        });

        const totalUsers = snapshot.size;
        const averageStreak = totalUsers > 0 ? Math.round(totalStreak / totalUsers * 10) / 10 : 0;
        const averageHealthScore = totalUsers > 0 ? Math.round(totalHealthScore / totalUsers) : 0;

        // Update the communityStats/latest document
        await db.collection('communityStats').doc('latest').set({
            totalUsers,
            activeUsers: activeCount,
            averageStreak,
            averageHealthScore,
            totalDaysSugarFree: totalStreak,
            topStreak,
            topHealthScore,
            updatedAt: FieldValue.serverTimestamp(),
        });

        console.log(`✅ Community stats updated: ${totalUsers} users, ${activeCount} active, avg streak ${averageStreak}`);
        return { success: true, totalUsers, activeUsers: activeCount };
    } catch (error) {
        console.error('❌ Error recalculating community stats:', error);
        throw new HttpsError('internal', 'Failed to update community stats');
    }
});
