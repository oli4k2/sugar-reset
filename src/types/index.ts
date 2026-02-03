/**
 * Type Definitions for Craveless
 */

// User profile
export interface User {
    id: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    avatarType?: 'photo' | 'emoji' | 'initial' | null;
    avatarValue?: string | null;
    createdAt: Date;
    updatedAt: Date;
    preferences: UserPreferences;
    streak: StreakData;
}

// Social & Community Types
export interface UserStats {
    userId: string;
    currentStreak: number;
    healthScore: number;
    goalAchieved: boolean; // Daily goal met?
    pledgedToday: boolean; // Has the user made their morning pledge?
    updatedAt: Date;
}

export interface Friend {
    uid: string;
    displayName: string;
    email?: string;
    photoURL?: string;
    avatarType?: 'photo' | 'emoji' | 'initial' | null;
    avatarValue?: string | null;
    addedAt: Date;
}

export interface FriendRequest {
    id: string;
    fromUid: string;
    fromName: string;
    fromUsername?: string | null; // Optional, can be null for Firestore compatibility
    toUid: string;
    toName?: string | null; // Recipient's name for display in pending requests
    toEmail?: string | null; // Recipient's email for display
    status: 'pending' | 'accepted' | 'declined';
    createdAt: Date;
}

export interface UserPreferences {
    notifications: boolean;
    dailyReminderTime?: string; // HH:mm format
    weeklyReportDay?: number; // 0-6 (Sunday-Saturday)
    theme: 'dark' | 'system'; // Currently only dark mode
}

// Streak and progress tracking
export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastCheckIn: Date | null;
    startDate: Date;
    totalDaysSugarFree: number;
}

// Daily check-in
export interface DailyCheckIn {
    id: string;
    userId: string;
    date: string; // YYYY-MM-DD format
    sugarFree: boolean;
    grams?: number; // Sugar intake in grams (for gradual plan)
    notes?: string;
    cravingLevel?: 1 | 2 | 3 | 4 | 5; // 1 = none, 5 = intense
    mood?: 1 | 2 | 3 | 4 | 5; // 1 = poor, 5 = excellent
    energyLevel?: 1 | 2 | 3 | 4 | 5;
    sleepQuality?: 1 | 2 | 3 | 4 | 5;
    createdAt: Date;
}

// Science-backed benefits (for UI facts)
export interface Benefit {
    id: string;
    category: 'glucose' | 'skin' | 'sleep' | 'energy' | 'weight';
    title: string;
    description: string;
    dayToUnlock: number; // Days sugar-free before this benefit appears
    icon: string;
    source?: string; // Scientific source
}

// Milestone achievements
export interface Milestone {
    id: string;
    title: string;
    description: string;
    daysRequired: number;
    icon: string;
    unlockedAt?: Date;
}

// Navigation types
export type RootStackParamList = {
    Onboarding: undefined;
    Auth: undefined;
    Main: undefined;
    Reasons: undefined; // Anti-relapse reasons screen
    BreathingExercise: undefined; // Guided breathing exercise
    Journal: undefined; // Journal entries screen
    Profile: undefined; // User profile screen
    PrivacyPolicy: undefined;
    TermsOfService: undefined;
    Help: undefined;
    DistractMe: undefined;
    Alternatives: undefined;
    InnerCircle: undefined;
    EmergencyCall: undefined;
    DistractionTask: { taskId: string };
    PostDetail: { post: Post };
    VerificationPending: undefined;
};

// Community Posts
export interface Post {
    id: string;
    authorId: string;
    authorName: string;
    authorUsername?: string; // Optional, might be deprecated
    photoURL?: string;
    avatarType?: 'photo' | 'emoji' | 'initial' | null;
    avatarValue?: string | null;
    title: string;
    content: string;
    tags: string[];
    upvotes: number;
    commentCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export type AuthStackParamList = {
    Welcome: undefined;
    Login: undefined;
    SignUp: undefined;
};

export type OnboardingStackParamList = {
    // Phase 1: Quiz
    Welcome: undefined;
    QuizIntro: undefined;
    ComprehensiveQuiz: undefined;
    Symptoms: undefined;

    // Phase 2: Education & Social Proof
    SugarDangers: undefined;
    SugarestWelcome: undefined;
    SuccessStories: undefined;
    SugarResetGraph: undefined;
    FeatureShowcase: undefined;

    // Phase 3: Commitment
    Goals: undefined;
    Promise: { nickname?: string };
    Paywall: undefined;

    // Legacy (keep for backwards compatibility)
    QualificationQuiz: undefined;
    SugarProfile: undefined;
    SugarIntake: undefined;
    SugarScience: undefined;
    AppBenefits: undefined;
    IntentSelection: undefined;
    ScienceFraming: undefined;
    BaselineSetup: undefined;
    SugarSpending: { dailySugarGrams?: number };
    SavingsGoal: { dailySpendingCents?: number; dailySugarGrams?: number };
    DistractMe: undefined;
    Alternatives: undefined;
};

export type MainTabParamList = {
    Home: undefined;
    Analytics: undefined;
    Track: undefined;
    Panic: undefined;
    Social: undefined;
};

// App state
export interface AppState {
    isLoading: boolean;
    isAuthenticated: boolean;
    hasCompletedOnboarding: boolean;
    user: User | null;
}
