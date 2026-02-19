/**
 * Mock Data Service
 *
 * Provides client-side mock data for users, leaderboard entries, and community
 * posts so the app feels alive even with fewer than 10 real users.
 *
 * Firestore security rules prevent writing mock user/post documents from the
 * client, so all mock data lives here and is injected into the UI layer
 * directly (in SocialScreen, UserProfilePopup, etc.).
 *
 * • Mock users appear on the leaderboard with tappable profiles showing local stats.
 * • Mock posts appear in the community feed and are read-only (no comments/upvotes).
 * • Mock user streaks change daily via a deterministic cycle so the data
 *   feels dynamic without a Cloud Function.
 */

import { Post } from '../types';

// ──────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────

const MOCK_REF_DATE = new Date('2025-11-01').getTime();

// ──────────────────────────────────────────────────────────────────
// Mock user profiles
// ──────────────────────────────────────────────────────────────────

export interface MockUserProfile {
    id: string;
    name: string;
    emoji: string;
    cycleLength: number;
    offset: number;
    baseHealth: number;
}

export const MOCK_USERS: MockUserProfile[] = [
    { id: 'mock_user_0', name: 'Emma',            emoji: '🌿', cycleLength: 32, offset: 0,  baseHealth: 74 },
    { id: 'mock_user_1', name: 'Jake',             emoji: '💪', cycleLength: 25, offset: 8,  baseHealth: 70 },
    { id: 'mock_user_2', name: 'Mia_R',            emoji: '🍃', cycleLength: 20, offset: 3,  baseHealth: 66 },
    { id: 'mock_user_3', name: 'Max',              emoji: '🔥', cycleLength: 28, offset: 14, baseHealth: 62 },
    { id: 'mock_user_4', name: 'Lily',             emoji: '🌸', cycleLength: 18, offset: 6,  baseHealth: 58 },
    { id: 'mock_user_5', name: 'Daniel',           emoji: '⭐', cycleLength: 15, offset: 10, baseHealth: 55 },
    { id: 'mock_user_6', name: 'Sophie',           emoji: '🥝', cycleLength: 22, offset: 17, baseHealth: 52 },
    { id: 'mock_user_7', name: 'Leo_K',            emoji: '🏋️', cycleLength: 30, offset: 5,  baseHealth: 48 },
    { id: 'mock_user_8', name: 'Ava',              emoji: '🥗', cycleLength: 14, offset: 9,  baseHealth: 45 },
    { id: 'mock_user_9', name: 'Zoe',              emoji: '🍊', cycleLength: 12, offset: 2,  baseHealth: 42 },
];

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────

function daysSinceMockStart(): number {
    return Math.floor((Date.now() - MOCK_REF_DATE) / (1000 * 60 * 60 * 24));
}

/** Deterministic streak for a mock user that changes every day. */
function mockStreak(user: MockUserProfile): number {
    return (daysSinceMockStart() + user.offset) % user.cycleLength;
}

/** Health score with slight daily variation. */
function mockHealth(user: MockUserProfile, index: number): number {
    const day = daysSinceMockStart();
    const variation = Math.round(Math.sin((day + index * 7) * 0.3) * 3);
    return Math.min(99, Math.max(20, user.baseHealth + variation));
}

// ──────────────────────────────────────────────────────────────────
// Public helpers for community stats (keeps stats widget in sync)
// ──────────────────────────────────────────────────────────────────

/** The highest mock-user streak right now. */
export function getMockTopStreak(): number {
    return Math.max(...MOCK_USERS.map(u => mockStreak(u)));
}

/** Average mock-user streak right now. */
export function getMockAvgStreak(): number {
    const streaks = MOCK_USERS.map(u => mockStreak(u));
    return Math.round(streaks.reduce((a, b) => a + b, 0) / streaks.length * 10) / 10;
}

// ──────────────────────────────────────────────────────────────────
// Leaderboard mock entries
// ──────────────────────────────────────────────────────────────────

export interface MockLeaderboardEntry {
    userId: string;
    name: string;
    score: number;
    streak: number;
    avatarType: 'emoji';
    avatarValue: string;
}

/**
 * Returns mock leaderboard entries for client-side injection.
 * Sorted by the given type (health or streak) descending.
 */
export function getMockLeaderboardEntries(type: 'health' | 'streak'): MockLeaderboardEntry[] {
    const entries = MOCK_USERS.map((user, index) => ({
        userId: user.id,
        name: user.name,
        score: mockHealth(user, index),
        streak: mockStreak(user),
        avatarType: 'emoji' as const,
        avatarValue: user.emoji,
    }));

    if (type === 'streak') {
        entries.sort((a, b) => b.streak - a.streak);
    } else {
        entries.sort((a, b) => b.score - a.score);
    }

    return entries;
}

// ──────────────────────────────────────────────────────────────────
// Mock user stats (for UserProfilePopup)
// ──────────────────────────────────────────────────────────────────

export interface MockUserStats {
    currentStreak: number;
    healthScore: number;
    goalAchieved: boolean;
    pledgedToday: boolean;
}

/**
 * Returns the current mock stats for a given mock user ID.
 * Returns null if the userId is not a mock user.
 */
export function getMockUserStats(userId: string): MockUserStats | null {
    const index = MOCK_USERS.findIndex(u => u.id === userId);
    if (index === -1) return null;

    const user = MOCK_USERS[index];
    const streak = mockStreak(user);

    return {
        currentStreak: streak,
        healthScore: mockHealth(user, index),
        goalAchieved: streak > 3,
        pledgedToday: streak > 0,
    };
}

// ──────────────────────────────────────────────────────────────────
// Mock community posts
// ──────────────────────────────────────────────────────────────────

/**
 * Returns mock community posts for client-side injection.
 * Posts have realistic dates spanning Nov 2025 – Feb 2026.
 */
export function getMockPosts(): Post[] {
    return [
        {
            id: 'mock_post_1',
            authorId: 'mock_user_0',
            authorName: 'SugarFreeEmma',
            avatarType: 'emoji',
            avatarValue: '🌿',
            title: 'Day 14 sugar-free! 🎉',
            content: "Two weeks in and I can't believe how much better I feel. My energy levels are way more stable throughout the day and I'm not crashing at 3pm anymore. The first week was tough with cravings but it gets so much easier. Keep going everyone!",
            tags: ['milestone', 'motivation'],
            upvotes: 24,
            commentCount: 0,
            createdAt: new Date('2025-11-12T09:30:00'),
            updatedAt: new Date('2025-11-12T09:30:00'),
        },
        {
            id: 'mock_post_2',
            authorId: 'mock_user_1',
            authorName: 'Jake',
            avatarType: 'emoji',
            avatarValue: '💪',
            title: 'My go-to sugar-free snacks',
            content: "For anyone struggling with snack cravings, here's what works for me:\n\n• Greek yogurt with berries\n• Almonds and dark chocolate (85%+)\n• Apple slices with peanut butter\n• Hummus with veggies\n\nThe key is having them prepped and ready so you don't reach for the candy bar!",
            tags: ['tips', 'food'],
            upvotes: 31,
            commentCount: 0,
            createdAt: new Date('2025-11-18T14:15:00'),
            updatedAt: new Date('2025-11-18T14:15:00'),
        },
        {
            id: 'mock_post_3',
            authorId: 'mock_user_2',
            authorName: 'Mia_R',
            avatarType: 'emoji',
            avatarValue: '🍃',
            title: 'Hidden sugars that surprised me',
            content: "I've been reading labels more carefully and WOW some \"healthy\" foods are loaded with added sugar:\n\n- Granola bars (some have 15g+ added sugar!)\n- Flavored yogurt (up to 20g per cup)\n- Store-bought pasta sauce (8-12g per serving)\n- \"Healthy\" smoothies from shops\n\nThe food scanner in this app has been a game changer for spotting these!",
            tags: ['tips', 'awareness'],
            upvotes: 42,
            commentCount: 0,
            createdAt: new Date('2025-11-25T11:45:00'),
            updatedAt: new Date('2025-11-25T11:45:00'),
        },
        {
            id: 'mock_post_4',
            authorId: 'mock_user_3',
            authorName: 'Max',
            avatarType: 'emoji',
            avatarValue: '🔥',
            title: 'Broke my streak but not giving up',
            content: "Had a birthday party yesterday and had a slice of cake. Streak went back to 0 after 9 days. Feeling a bit disappointed but I know one day doesn't erase all the progress. Getting right back on track today! 💪\n\nAnyone else deal with social pressure around sugar? How do you handle it?",
            tags: ['support', 'discussion'],
            upvotes: 18,
            commentCount: 0,
            createdAt: new Date('2025-12-03T19:20:00'),
            updatedAt: new Date('2025-12-03T19:20:00'),
        },
        {
            id: 'mock_post_5',
            authorId: 'mock_user_4',
            authorName: 'Lily',
            avatarType: 'emoji',
            avatarValue: '🌸',
            title: 'Skin improvement after 3 weeks!',
            content: "Just wanted to share – my skin has cleared up significantly since cutting added sugar. I used to get breakouts regularly and they've almost completely stopped. Also sleeping better and my mood is more stable. The health score feature really helps me see the bigger picture beyond just sugar grams.",
            tags: ['results', 'health'],
            upvotes: 35,
            commentCount: 0,
            createdAt: new Date('2025-12-10T08:00:00'),
            updatedAt: new Date('2025-12-10T08:00:00'),
        },
        {
            id: 'mock_post_6',
            authorId: 'mock_user_5',
            authorName: 'Daniel',
            avatarType: 'emoji',
            avatarValue: '⭐',
            title: 'Tip: Log your food right after eating',
            content: "I found that if I wait until the end of the day to log my food, I forget things or estimate poorly. Now I scan/log right after every meal and my tracking is way more accurate. The AI food scanner makes it super quick – just snap a photo and done!\n\nSmall habit change, big difference in accuracy.",
            tags: ['tips', 'app'],
            upvotes: 19,
            commentCount: 0,
            createdAt: new Date('2025-12-18T13:30:00'),
            updatedAt: new Date('2025-12-18T13:30:00'),
        },
        {
            id: 'mock_post_7',
            authorId: 'mock_user_6',
            authorName: 'Kali',
            avatarType: 'emoji',
            avatarValue: '🥝',
            title: "Natural sugar vs added sugar – don't fear fruit! 🍎",
            content: "I see some people avoiding fruit because of sugar content. Remember: this app tracks ADDED sugar separately from natural sugar for a reason! Fruits come with fiber, vitamins, and water that slow sugar absorption.\n\nA banana has 0g added sugar. A candy bar might have 25g. Your body handles them very differently. Eat your fruits!",
            tags: ['education', 'food'],
            upvotes: 48,
            commentCount: 0,
            createdAt: new Date('2025-12-28T10:15:00'),
            updatedAt: new Date('2025-12-28T10:15:00'),
        },
        {
            id: 'mock_post_8',
            authorId: 'mock_user_7',
            authorName: 'Leo_K',
            avatarType: 'emoji',
            avatarValue: '🏋️',
            title: "30 day streak! Here's what I learned",
            content: "Just hit 30 days sugar-free! 🏆 My biggest takeaways:\n\n1. The first 5 days are the hardest\n2. Having accountability (this community!) helps SO much\n3. Meal prep on Sundays saves me during the week\n4. Reading labels becomes second nature\n5. You start tasting natural sweetness in foods you never noticed before\n\nDon't give up if you're in the early days. It's worth it!",
            tags: ['milestone', 'motivation'],
            upvotes: 56,
            commentCount: 0,
            createdAt: new Date('2026-01-08T16:45:00'),
            updatedAt: new Date('2026-01-08T16:45:00'),
        },
        {
            id: 'mock_post_9',
            authorId: 'mock_user_8',
            authorName: 'Ava',
            avatarType: 'emoji',
            avatarValue: '🥗',
            title: 'Sugar-free meal prep ideas for busy weekdays',
            content: "Here's my weekly meal prep that keeps me on track:\n\n🌅 Breakfast: Overnight oats with chia seeds + fresh berries\n🌞 Lunch: Grilled chicken salad with olive oil dressing\n🍽️ Dinner: Stir-fry veggies with brown rice\n🍿 Snacks: Mixed nuts, cucumber sticks, boiled eggs\n\nAll zero added sugar! Takes about 2 hours on Sunday to prep for the whole week.",
            tags: ['tips', 'food', 'mealprep'],
            upvotes: 37,
            commentCount: 0,
            createdAt: new Date('2026-01-22T12:00:00'),
            updatedAt: new Date('2026-01-22T12:00:00'),
        },
        {
            id: 'mock_post_10',
            authorId: 'mock_user_9',
            authorName: 'Zoe',
            avatarType: 'emoji',
            avatarValue: '🍊',
            title: 'New here! Starting my sugar-free journey today',
            content: "Hi everyone! Just downloaded the app and I'm excited (and nervous) to start. I've been consuming way too much sugar – probably 60-80g of added sugar per day. My goal is to get under 25g.\n\nAny tips for a complete beginner? What should I expect in the first week? 🙏",
            tags: ['introduction', 'support'],
            upvotes: 22,
            commentCount: 0,
            createdAt: new Date('2026-02-05T07:30:00'),
            updatedAt: new Date('2026-02-05T07:30:00'),
        },
    ];
}

// ──────────────────────────────────────────────────────────────────
// Identity check
// ──────────────────────────────────────────────────────────────────

/** Check if a userId belongs to a mock user. */
export function isMockUser(userId: string): boolean {
    return userId.startsWith('mock_user_');
}
