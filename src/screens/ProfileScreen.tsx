/**
 * ProfileScreen
 * 
 * User profile and settings with sky theme.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image,
    Dimensions,
    Modal,
    TextInput,
    Linking,
    ActivityIndicator,
    Switch,
    Animated,
    PanResponder,
    TouchableWithoutFeedback,
    Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as StoreReview from 'expo-store-review';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { spacing, borderRadius } from '../theme';
import LooviBackground, { looviColors } from '../components/LooviBackground';
import { GlassCard } from '../components/GlassCard';
import { UserAvatar } from '../components/UserAvatar';
import { AVATAR_EMOJIS } from '../constants/avatarConfig';

import { useUserData } from '../context/UserDataContext';
import { userService } from '../services/userService';
import { dataCleanupService } from '../services/dataCleanupService';
import { onboardingService } from '../services/onboardingService';
import { useAuthContext } from '../context/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { useRevenueCat } from '../hooks/useRevenueCat';
import { revenueCatService } from '../services/revenueCatService';
import { storageService } from '../services/storageService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppIcon } from '../components/OnboardingIcon';
import * as Haptics from 'expo-haptics';
import { NotificationSettingsModal } from '../components/NotificationSettingsModal';
import CancellationOfferScreen from '../components/CancellationOfferScreen';

interface MenuItem {
    id: string;
    emoji: string;
    label: string;
    action?: () => void;
    hasToggle?: boolean;
}

const menuSections: { title: string; items: MenuItem[] }[] = [
    {
        title: 'Account',
        items: [
            { id: 'profile', emoji: '👤', label: 'Edit Profile' },
            { id: 'restore', emoji: '🔄', label: 'Restore Purchases' },
            { id: 'deleteAccount', emoji: '⚠️', label: 'Delete Account' },
        ],
    },
    {
        title: 'Preferences',
        items: [
            { id: 'notifications', emoji: '🔔', label: 'Notifications' },
        ],
    },
    {
        title: 'Support',
        items: [
            { id: 'help', emoji: '❓', label: 'Help & FAQ' },
            { id: 'feedback', emoji: '💬', label: 'Send Feedback' },
            { id: 'rate', emoji: '⭐', label: 'Rate the App' },
        ],
    },
    ...(__DEV__ ? [{
        title: 'Developer',
        items: [
            { id: 'viewNotifications', emoji: '📅', label: 'View Scheduled Notifications' },
            { id: 'scheduleTestNotifications', emoji: '🔔', label: 'Schedule Test Notifications' },
            { id: 'testPaywall', emoji: '💳', label: 'Test Paywall Flow' },
            { id: 'testCancellationOffer', emoji: '🎁', label: 'Test Cancellation Offers' },
            { id: 'testTrialNotification', emoji: '⏰', label: 'Test Trial Notification' },
            { id: 'resetOnboarding', emoji: '🔄', label: 'Reset Onboarding' },
            { id: 'clearData', emoji: '🗑️', label: 'Clear All Data' },
            { id: 'cleanupCommunity', emoji: '🧹', label: 'Clean Community Data' },
            { id: 'migrateUsernames', emoji: '👤', label: 'Migrate Usernames (GDPR)' },
        ],
    }] : []),
    {
        title: 'Legal',
        items: [
            { id: 'privacy', emoji: '🔒', label: 'Privacy Policy' },
            { id: 'terms', emoji: '📄', label: 'Terms of Service' },
        ],
    },
];

export default function ProfileScreen() {
    const { onboardingData, streakData, updateOnboardingData, latestHealthScore, todayCheckIn } = useUserData();
    const { user, isAuthenticated, firebaseUser, refreshUser } = useAuthContext();
    const { signOut } = useAuth();
    const { restorePurchases, isPremium, customerInfo, currentOffering, purchasePackage } = useRevenueCat();
    const navigation = useNavigation<any>();
    const [showCancellationOffer, setShowCancellationOffer] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editNameState, setEditNameState] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [selectedAvatarType, setSelectedAvatarType] = useState<'photo' | 'emoji' | 'initial'>('initial');
    const [selectedAvatarValue, setSelectedAvatarValue] = useState<string>('');
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [showNotificationSettings, setShowNotificationSettings] = useState(false);
    const [hasPledgedToday, setHasPledgedToday] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [selectedRating, setSelectedRating] = useState(0);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);
    const SHEET_HEIGHT = Dimensions.get('window').height * 0.55;
    const ratingSheetAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

    const ratingPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 10,
            onPanResponderGrant: () => {
                ratingSheetAnim.stopAnimation();
                ratingSheetAnim.setOffset(0);
            },
            onPanResponderMove: (_, gs) => {
                ratingSheetAnim.setValue(Math.max(0, gs.dy));
            },
            onPanResponderRelease: (_, gs) => {
                ratingSheetAnim.flattenOffset();
                if (gs.dy > SHEET_HEIGHT * 0.3 || gs.vy > 0.8) {
                    closeRatingModal();
                } else {
                    Animated.spring(ratingSheetAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 4,
                        speed: 12,
                    }).start();
                }
            },
        })
    ).current;

    const closeRatingModal = () => {
        Animated.timing(ratingSheetAnim, {
            toValue: SHEET_HEIGHT,
            duration: 200,
            useNativeDriver: true,
        }).start(() => setShowRatingModal(false));
    };

    // Fetch pledge status from Firebase (same source as UserProfilePopup)
    useEffect(() => {
        const loadPledgeStatus = async () => {
            if (!firebaseUser?.uid) {
                // Fallback to context if not authenticated
                setHasPledgedToday(!!todayCheckIn);
                return;
            }

            try {
                const { doc, getDoc } = await import('firebase/firestore');
                const { db } = await import('../config/firebase');
                const statsDoc = await getDoc(doc(db, 'userStats', firebaseUser.uid));

                if (statsDoc.exists()) {
                    const data = statsDoc.data();
                    setHasPledgedToday(data.pledgedToday || false);
                } else {
                    setHasPledgedToday(false);
                }
            } catch (error) {
                console.warn('Failed to fetch pledge status:', error);
                // Fallback to context
                setHasPledgedToday(!!todayCheckIn);
            }
        };

        loadPledgeStatus();
    }, [firebaseUser?.uid, todayCheckIn]);

    // Determine auth provider type
    const authProvider = useMemo((): 'google' | 'apple' | 'email' | 'unknown' => {
        if (!firebaseUser || !firebaseUser.providerData || firebaseUser.providerData.length === 0) {
            return 'unknown';
        }

        // Debug: log all providers
        console.log('🔑 Provider data:', firebaseUser.providerData.map(p => p?.providerId));

        // Check ALL providers in the array, not just the first one
        for (const provider of firebaseUser.providerData) {
            const providerId = provider?.providerId || '';
            if (providerId.includes('google')) return 'google';
            if (providerId.includes('apple')) return 'apple';
            if (providerId.includes('password')) return 'email';
        }

        return 'unknown';
    }, [firebaseUser]);

    // Get user data from context

    // Get user data from context
    const startDateString = onboardingData.startDate || new Date().toISOString();
    const startDate = useMemo(() => new Date(startDateString), [startDateString]);

    // Get user data from context
    const name = onboardingData.nickname || user?.displayName || firebaseUser?.displayName || 'Guest';
    const email = firebaseUser?.email || user?.email || 'Not signed in';
    const daysSugarFree = streakData?.currentStreak || 0;

    // Health score display
    const healthScoreDisplay = latestHealthScore > 0 ? latestHealthScore : '--';

    const handleRestorePurchases = async () => {
        try {
            setIsRestoring(true);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await restorePurchases();

            // Check if restore was successful
            if (isPremium) {
                Alert.alert('Success', 'Your purchases have been restored!');
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Alert.alert('No Purchases Found', 'We couldn\'t find any purchases to restore.');
            }
        } catch (error: any) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(
                'Restore Failed',
                error.message || 'Unable to restore purchases. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsRestoring(false);
        }
    };

    const handleClearAllData = () => {
        Alert.alert(
            'Clear All Data',
            'This will clear all local app data, log you out, and reset the app to its initial state. This cannot be undone.\n\nAre you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Clear all AsyncStorage
                            await AsyncStorage.clear();
                            console.log('✅ Cleared all AsyncStorage');

                            // Log out from RevenueCat (clears anonymous ID)
                            try {
                                await revenueCatService.logOut();
                                console.log('✅ Cleared RevenueCat anonymous ID');
                            } catch (rcError) {
                                console.warn('⚠️ Failed to clear RevenueCat:', rcError);
                            }

                            // Sign out from Firebase (this clears the persisted auth state)
                            await signOut();
                            console.log('✅ Signed out from Firebase');

                            // Also clear Firebase auth persistence explicitly
                            try {
                                const { signOut: firebaseSignOut } = require('firebase/auth');
                                const { auth } = require('../config/firebase');
                                await firebaseSignOut(auth);
                                console.log('✅ Firebase auth state cleared');
                            } catch (e) {
                                console.warn('⚠️ Error clearing Firebase auth:', e);
                            }

                            Alert.alert(
                                'Data Cleared',
                                'All app data has been cleared. The app will restart.',
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            // Force app restart by navigating to onboarding
                                            navigation.getParent()?.reset({
                                                index: 0,
                                                routes: [{ name: 'Onboarding' }],
                                            });
                                        },
                                    },
                                ]
                            );
                        } catch (error: any) {
                            console.error('Error clearing data:', error);
                            Alert.alert('Error', 'Failed to clear all data: ' + error.message);
                        }
                    },
                },
            ]
        );
    };

    const handleCleanupCommunityData = async () => {
        Alert.alert(
            'Clean Community Data',
            'This will:\n• Remove posts from deleted users\n• Remove comments from deleted users\n• Update author names to current profiles\n\nThis may take a moment.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Preview',
                    onPress: async () => {
                        try {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            const preview = await dataCleanupService.previewCleanup();
                            Alert.alert(
                                'Cleanup Preview',
                                `Found:\n• ${preview.orphanedPosts.length} orphaned posts\n• ${preview.orphanedComments.length} orphaned comments\n• ${preview.outdatedNames.length} outdated names\n\nRun cleanup to fix these issues.`
                            );
                        } catch (error: any) {
                            Alert.alert('Error', 'Failed to preview: ' + error.message);
                        }
                    },
                },
                {
                    text: 'Clean Now',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                            const result = await dataCleanupService.performFullCleanup();
                            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert(
                                'Cleanup Complete',
                                `Results:\n• Posts removed: ${result.postsRemoved}\n• Posts updated: ${result.postsUpdated}\n• Comments removed: ${result.commentsRemoved}\n• Comments updated: ${result.commentsUpdated}${result.errors.length > 0 ? `\n\nErrors: ${result.errors.length}` : ''}`
                            );
                        } catch (error: any) {
                            Alert.alert('Error', 'Cleanup failed: ' + error.message);
                        }
                    },
                },
            ]
        );
    };

    const handleMigrateUsernames = async () => {
        Alert.alert(
            'Migrate Usernames',
            'This will generate Reddit-style usernames for all existing users.\n\n⚠️ This requires server-side access with admin privileges.\n\nTo run the migration:\n1. Set ADMIN_SECRET in Vercel environment variables\n2. Call the API endpoint:\n\ncurl -X POST https://craveless.info/api/admin/migrate-usernames \\\n  -H "Authorization: Bearer YOUR_ADMIN_SECRET"\n\nOr use the website admin panel if available.',
            [
                { text: 'OK', style: 'default' },
                {
                    text: 'Try Client-Side (Limited)',
                    style: 'default',
                    onPress: async () => {
                        try {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            Alert.alert(
                                'Note',
                                'Client-side migration will only update users you have permission to modify (your own account). For full migration, use the server API endpoint.',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Continue',
                                        onPress: async () => {
                                            // This will only work for the current user's own account
                                            // Full migration requires server-side API
                                            Alert.alert(
                                                'Migration Started',
                                                'Attempting client-side migration...',
                                                [{ text: 'OK' }]
                                            );

                                            // Try to update current user if they don't have username
                                            if (user?.id && !user.username) {
                                                try {
                                                    const { db } = await import('../config/firebase');
                                                    const { generateUniqueUsername } = await import('../utils/usernameGenerator');
                                                    const username = await generateUniqueUsername(db);
                                                    await userService.updateDisplayName(user.id, user.displayName || '');
                                                    // Note: We can't update username via client due to security rules
                                                    // This is just a placeholder - real migration needs server API
                                                    Alert.alert(
                                                        'Limited Migration',
                                                        'Client-side migration is limited by security rules. Please use the server API endpoint for full migration.'
                                                    );
                                                } catch (error: any) {
                                                    Alert.alert('Error', 'Migration failed: ' + (error.message || 'Unknown error'));
                                                }
                                            } else {
                                                Alert.alert('Already Complete', 'Your account already has a username.');
                                            }
                                        }
                                    }
                                ]
                            );
                        } catch (error: any) {
                            Alert.alert('Error', 'Failed to start migration: ' + (error.message || 'Unknown error'));
                        }
                    },
                },
            ]
        );
    };

    const handleViewNotifications = async () => {
        try {
            const { notificationService } = await import('../services/notificationService');
            const summary = await notificationService.getNotificationsSummary();

            if (summary.count === 0) {
                Alert.alert(
                    'Scheduled Notifications',
                    'No notifications scheduled.\n\nTo test:\n• Use "Test Trial Notification" to schedule a test reminder',
                    [{ text: 'OK' }]
                );
                return;
            }

            // Format notification details more clearly
            const notificationList = summary.notifications
                .map((n, i) => {
                    const details = [
                        `${i + 1}. ${n.title}`,
                        `   Scheduled: ${n.scheduledFor}`,
                        `   Type: ${n.type}`,
                        `   ID: ${n.id}`
                    ];
                    return details.join('\n');
                })
                .join('\n\n');

            Alert.alert(
                `Scheduled Notifications (${summary.count})`,
                notificationList,
                [
                    { text: 'OK' },
                    {
                        text: 'Clear All',
                        style: 'destructive',
                        onPress: async () => {
                            await notificationService.clearAllNotifications();
                            Alert.alert('Cleared', 'All notifications cleared.');
                        },
                    },
                ]
            );
        } catch (error: any) {
            Alert.alert('Error', 'Failed to load notifications: ' + error.message);
        }
    };

    const handleScheduleTestNotifications = async () => {
        try {
            const { notificationService } = await import('../services/notificationService');
            const Notifications = await import('expo-notifications');

            // Check permissions first
            const { status } = await Notifications.default.getPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permissions Required',
                    'Notification permissions are not granted. Please enable notifications in your device settings.',
                    [{ text: 'OK' }]
                );
                return;
            }

            // Schedule all daily reminders
            await notificationService.scheduleDailyReminder(20, 0);
            await notificationService.scheduleAllDailyReminders();

            // Also schedule a test notification for 1 minute from now
            const testDate = new Date();
            testDate.setMinutes(testDate.getMinutes() + 1);

            await Notifications.default.scheduleNotificationAsync({
                content: {
                    title: '🧪 Test Notification',
                    body: 'This is a test notification scheduled for 1 minute from now.',
                    sound: true,
                    data: {
                        type: 'test',
                    },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: testDate,
                },
                identifier: 'test-notification',
            });

            Alert.alert(
                'Notifications Scheduled',
                `✅ All daily reminders scheduled!\n\n• Daily check-in: 20:00\n• Food logging: 15:00\n• Wellness check-in: 21:00\n• Test notification: ${testDate.toLocaleTimeString()}\n\nUse "View Scheduled Notifications" to verify.`,
                [{ text: 'OK' }]
            );
        } catch (error: any) {
            Alert.alert('Error', 'Failed to schedule notifications: ' + error.message);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Clear ALL cached data to prevent data from showing for other accounts
                            // This includes wellness logs, food logs, pledges, and all other local storage
                            await AsyncStorage.clear();
                            console.log('✅ Cleared all AsyncStorage data on logout');

                            await signOut();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Onboarding' }],
                            });
                        } catch (error) {
                            console.error('Error signing out:', error);
                        }
                    }
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        if (!isAuthenticated || !firebaseUser) {
            Alert.alert('Not Signed In', 'You need to be signed in to delete your account.');
            return;
        }

        Alert.alert(
            'Delete Account',
            'Are you sure you want to permanently delete your account? This action cannot be undone. All your data, progress, and streak history will be lost forever.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Account',
                    style: 'destructive',
                    onPress: () => {
                        // Second confirmation
                        Alert.alert(
                            'Final Confirmation',
                            'This will permanently delete your account and all associated data. Type DELETE to confirm.',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'I Understand, Delete',
                                    style: 'destructive',
                                    onPress: async () => {
                                        setIsDeletingAccount(true);
                                        try {
                                            // Delete user data from Firestore
                                            const { doc, deleteDoc, collection, getDocs, writeBatch } = await import('firebase/firestore');
                                            const { db } = await import('../config/firebase');
                                            const { deleteUser } = await import('firebase/auth');

                                            const userId = firebaseUser.uid;
                                            const batch = writeBatch(db);

                                            // Delete user document
                                            batch.delete(doc(db, 'users', userId));

                                            // Delete user stats
                                            batch.delete(doc(db, 'userStats', userId));

                                            // Delete user's friends subcollection
                                            try {
                                                const friendsSnap = await getDocs(collection(db, 'users', userId, 'friends'));
                                                friendsSnap.forEach((friendDoc) => {
                                                    batch.delete(friendDoc.ref);
                                                });
                                            } catch (e) { }

                                            // Delete user's posts
                                            try {
                                                const { query, where } = await import('firebase/firestore');
                                                const postsRef = collection(db, 'posts');
                                                const postsQuery = query(postsRef, where('authorId', '==', userId));
                                                const postsSnap = await getDocs(postsQuery);
                                                postsSnap.forEach((postDoc) => {
                                                    batch.delete(postDoc.ref);
                                                });
                                            } catch (e) { }

                                            // Commit batch delete
                                            await batch.commit();

                                            // Clear local data
                                            await AsyncStorage.clear();

                                            // Delete Firebase Auth account
                                            await deleteUser(firebaseUser);

                                            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                                            // Navigate to onboarding
                                            navigation.reset({
                                                index: 0,
                                                routes: [{ name: 'Onboarding' }],
                                            });

                                            Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
                                        } catch (error: any) {
                                            console.error('Error deleting account:', error);
                                            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

                                            // Handle re-authentication requirement
                                            if (error.code === 'auth/requires-recent-login') {
                                                Alert.alert(
                                                    'Re-authentication Required',
                                                    'For security reasons, please sign out and sign back in, then try deleting your account again.',
                                                    [{ text: 'OK' }]
                                                );
                                            } else {
                                                Alert.alert('Error', 'Failed to delete account: ' + (error.message || 'Unknown error'));
                                            }
                                        } finally {
                                            setIsDeletingAccount(false);
                                        }
                                    },
                                },
                            ]
                        );
                    },
                },
            ]
        );
    };

    const handleEditProfile = async () => {
        if (!user) return;
        setEditNameState(name);
        // Set current avatar selection
        setSelectedAvatarType(user.avatarType || (user.photoURL ? 'photo' : 'initial'));
        setSelectedAvatarValue(user.avatarValue || user.photoURL || '');
        setShowEditProfile(true);
    };

    const handleSelectAvatar = (type: 'photo' | 'emoji', value: string) => {
        setSelectedAvatarType(type);
        setSelectedAvatarValue(value);
        setShowAvatarPicker(false);
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSavingProfile(true);

        try {
            const trimmedName = editNameState.trim();

            // Update displayName locally in onboarding data
            if (trimmedName !== name) {
                await updateOnboardingData({ nickname: trimmedName });

                // Also sync to Firestore for friend search
                await userService.updateDisplayName(user.id, trimmedName);
            }

            // Save avatar if changed
            if (selectedAvatarType && selectedAvatarValue) {
                await userService.updateAvatar(user.id, selectedAvatarType, selectedAvatarValue);
            }

            // Refresh user data to update UI immediately
            await refreshUser();

            setShowEditProfile(false);
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            console.error('Error saving profile:', error);
            Alert.alert('Error', 'Failed to save profile');
        } finally {
            setIsSavingProfile(false);
        }
    };

    return (
        <>
            <LooviBackground variant="coralLeft">
                <SafeAreaView style={styles.container}>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Profile</Text>
                        </View>

                        {/* User Profile Section - Floating Design */}
                        <View style={styles.userProfileSection}>
                            {/* Avatar with shadow */}
                            <View style={styles.avatarWrapper}>
                                <View style={styles.avatarShadow}>
                                    <UserAvatar
                                        size={80}
                                        photoURL={user?.photoURL}
                                        avatarType={user?.avatarType}
                                        avatarValue={user?.avatarValue}
                                        name={name}
                                    />
                                </View>
                            </View>

                            {/* Name and Email */}
                            <Text style={styles.userName}>{name}</Text>
                            <Text style={styles.userEmail}>{email}</Text>



                            {/* Stats Cards - Streak, Health, Pledge */}
                            <View style={styles.floatingStatsRow}>
                                {/* Streak */}
                                <View style={styles.floatingStatCard}>
                                    <View style={{ marginBottom: 4 }}>
                                        <Ionicons name="flame" size={24} color="#F97316" />
                                    </View>
                                    <Text style={styles.floatingStatValue}>{daysSugarFree}</Text>
                                    <Text style={styles.floatingStatLabel}>Streak</Text>
                                </View>

                                {/* Health */}
                                <View style={styles.floatingStatCard}>
                                    <View style={{ marginBottom: 4 }}>
                                        <Ionicons name="heart" size={24} color={looviColors.accent.primary} />
                                    </View>
                                    <Text style={styles.floatingStatValue}>{healthScoreDisplay}</Text>
                                    <Text style={styles.floatingStatLabel}>Health</Text>
                                </View>

                                {/* Pledge */}
                                <View style={styles.floatingStatCard}>
                                    <View style={{ marginBottom: 4 }}>
                                        <Ionicons
                                            name={hasPledgedToday ? "hand-left" : "hand-left-outline"}
                                            size={24}
                                            color={hasPledgedToday ? "#22C55E" : looviColors.text.tertiary}
                                        />
                                    </View>
                                    <Text style={[
                                        styles.floatingStatValue,
                                        { color: hasPledgedToday ? "#22C55E" : looviColors.text.primary }
                                    ]}>
                                        {hasPledgedToday ? 'Yes' : 'No'}
                                    </Text>
                                    <Text style={styles.floatingStatLabel}>Pledge</Text>
                                </View>
                            </View>
                        </View>

                        {/* Subscription Status */}
                        <View style={styles.menuSection}>
                            <Text style={styles.sectionTitle}>Subscription</Text>
                            {isPremium ? (
                                <View style={styles.premiumCard}>
                                    <View style={styles.premiumContent}>
                                        <Text style={styles.premiumTitle}>Premium Active</Text>
                                        <Text style={styles.premiumSubtitle}>
                                            {customerInfo?.entitlements.active['premium']?.periodType === 'TRIAL' && customerInfo?.entitlements.active['premium']?.expirationDate
                                                ? `Trial ends: ${new Date(customerInfo.entitlements.active['premium'].expirationDate || '').toLocaleDateString()}`
                                                : 'You have full access to all features'}
                                        </Text>
                                    </View>
                                    <View style={styles.premiumBadge}>
                                        <Text style={styles.premiumBadgeText}>PRO</Text>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.upgradeCard}
                                    onPress={() => navigation.navigate('Paywall')}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.upgradeContent}>
                                        <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
                                        <Text style={styles.upgradeSubtitle}>Unlock all features & analytics</Text>
                                    </View>
                                    <View style={styles.upgradeButton}>
                                        <Text style={styles.upgradeButtonText}>Upgrade</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Reasons Section */}


                        {/* Menu Sections */}
                        {menuSections.map((section, sectionIndex) => (
                            <View key={sectionIndex} style={styles.menuSection}>
                                <Text style={styles.sectionTitle}>{section.title}</Text>
                                <GlassCard variant="light" padding="none" style={styles.menuCard}>
                                    {section.items.map((item, itemIndex) => (
                                        <TouchableOpacity
                                            key={item.id}
                                            style={[
                                                styles.menuItem,
                                                itemIndex < section.items.length - 1 && styles.menuItemBorder,
                                                item.id === 'deleteAccount' && styles.deleteMenuItem,
                                            ]}
                                            activeOpacity={0.6}
                                            onPress={() => {
                                                switch (item.id) {
                                                    case 'profile': handleEditProfile(); break;
                                                    case 'restore': handleRestorePurchases(); break;
                                                    case 'deleteAccount': handleDeleteAccount(); break;
                                                    case 'notifications': setShowNotificationSettings(true); break;
                                                    case 'help': Linking.openURL('mailto:support@sugar-reset.com'); break;
                                                    case 'feedback': Linking.openURL('mailto:feedback@sugar-reset.com'); break;
                                                    case 'rate': {
                                                        setSelectedRating(0);
                                                        setRatingSubmitted(false);
                                                        setShowRatingModal(true);
                                                        Animated.spring(ratingSheetAnim, {
                                                            toValue: 0,
                                                            useNativeDriver: true,
                                                            bounciness: 4,
                                                            speed: 12,
                                                        }).start();
                                                        break;
                                                    }
                                                    case 'viewNotifications': handleViewNotifications(); break;
                                                    case 'scheduleTestNotifications': handleScheduleTestNotifications(); break;
                                                    case 'testPaywall': navigation.navigate('Paywall', { showFullFlow: true }); break;
                                                    case 'testCancellationOffer': {
                                                        setShowCancellationOffer(true);
                                                        break;
                                                    }
                                                    case 'testTrialNotification': {
                                                        // Schedule a test trial notification (2 days from now)
                                                        const testExpirationDate = new Date();
                                                        testExpirationDate.setDate(testExpirationDate.getDate() + 2);
                                                        testExpirationDate.setHours(10, 0, 0, 0);

                                                        import('../services/notificationService').then(({ notificationService }) => {
                                                            notificationService.scheduleTrialExpirationReminder(testExpirationDate)
                                                                .then(() => {
                                                                    Alert.alert(
                                                                        'Test Notification Scheduled',
                                                                        `Trial expiration reminder scheduled for:\n${testExpirationDate.toLocaleString()}\n\nThis simulates a trial ending in 2 days.`,
                                                                        [{ text: 'OK' }]
                                                                    );
                                                                })
                                                                .catch((error) => {
                                                                    Alert.alert('Error', 'Failed to schedule test notification: ' + error.message);
                                                                });
                                                        });
                                                        break;
                                                    }
                                                    case 'resetOnboarding':
                                                        Alert.alert(
                                                            'Reset Onboarding',
                                                            'This will reset your onboarding progress but keep you logged in. App will restart.',
                                                            [
                                                                { text: 'Cancel', style: 'cancel' },
                                                                {
                                                                    text: 'Reset',
                                                                    style: 'destructive',
                                                                    onPress: async () => {
                                                                        try {
                                                                            // Clear local flags
                                                                            await AsyncStorage.removeItem('has_seen_onboarding');
                                                                            await AsyncStorage.removeItem('onboarding_data');

                                                                            // Navigate to Onboarding
                                                                            navigation.getParent()?.reset({
                                                                                index: 0,
                                                                                routes: [{ name: 'Onboarding' }],
                                                                            });
                                                                        } catch (e) {
                                                                            Alert.alert('Error', 'Failed to reset onboarding');
                                                                        }
                                                                    }
                                                                }
                                                            ]
                                                        );
                                                        break;
                                                    case 'clearData': handleClearAllData(); break;
                                                    case 'cleanupCommunity': handleCleanupCommunityData(); break;
                                                    case 'migrateUsernames': handleMigrateUsernames(); break;
                                                    case 'privacy': navigation.navigate('PrivacyPolicy'); break;
                                                    case 'terms': navigation.navigate('TermsOfService'); break;
                                                }
                                            }}
                                            disabled={(item.id === 'restore' && isRestoring) || (item.id === 'deleteAccount' && isDeletingAccount)}
                                        >
                                            <AppIcon emoji={item.emoji} size={20} />
                                            <View style={styles.menuLabelContainer}>
                                                <Text style={[
                                                    styles.menuLabel,
                                                    item.id === 'deleteAccount' && styles.deleteMenuLabel
                                                ]}>{item.label}</Text>
                                            </View>
                                            {item.id === 'restore' && isRestoring ? (
                                                <ActivityIndicator size="small" color={looviColors.accent.primary} />
                                            ) : item.id === 'deleteAccount' && isDeletingAccount ? (
                                                <ActivityIndicator size="small" color="#FF3B30" />
                                            ) : (
                                                <Text style={[
                                                    styles.menuArrow,
                                                    item.id === 'deleteAccount' && styles.deleteMenuArrow
                                                ]}>›</Text>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </GlassCard>
                            </View>
                        ))}

                        {/* Logout */}
                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={handleLogout}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.logoutText}>Log Out</Text>
                        </TouchableOpacity>

                        {/* Logo */}
                        <Image
                            source={require('../public/cravelesslogo.png')}
                            style={styles.footerLogo}
                            resizeMode="contain"
                        />

                        {/* Version */}
                        <Text style={styles.version}>Craveless v1.0.0</Text>
                    </ScrollView>


                    {/* ── Rating Modal (Bottom Sheet Refactor) ── */}
                    <Modal
                        visible={showRatingModal}
                        transparent
                        animationType="none"
                        onRequestClose={closeRatingModal}
                    >
                        <View style={styles.sheetOverlay}>
                            <TouchableWithoutFeedback onPress={closeRatingModal}>
                                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                            </TouchableWithoutFeedback>

                            <Animated.View
                                style={[
                                    styles.ratingSheet,
                                    { transform: [{ translateY: ratingSheetAnim }] }
                                ]}
                            >
                                {/* Drag Handle */}
                                <View {...ratingPanResponder.panHandlers} style={styles.sheetHandleContainer}>
                                    <View style={styles.sheetHandle} />
                                </View>

                                <View style={styles.ratingContent}>
                                    {!ratingSubmitted ? (
                                        <>
                                            {/* Icon Header */}
                                            <View style={styles.ratingIconContainer}>
                                                <LinearGradient
                                                    colors={[looviColors.coralOrange, '#E8A87C']}
                                                    style={styles.ratingIconGradient}
                                                >
                                                    <Text style={styles.ratingIconEmoji}>⭐</Text>
                                                </LinearGradient>
                                            </View>

                                            <Text style={styles.ratingSheetTitle}>Enjoying Craveless?</Text>
                                            <Text style={styles.ratingSheetSubtitle}>
                                                Your feedback helps us create a better experience for everyone.
                                            </Text>

                                            {/* Stars Section */}
                                            <View style={styles.ratingStarsBox}>
                                                <View style={styles.starsRow}>
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <TouchableOpacity
                                                            key={star}
                                                            onPress={async () => {
                                                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                                setSelectedRating(star);
                                                            }}
                                                            activeOpacity={0.7}
                                                        >
                                                            <Ionicons
                                                                name={selectedRating >= star ? "star" : "star-outline"}
                                                                size={44}
                                                                color={selectedRating >= star ? looviColors.accent.warning : 'rgba(0,0,0,0.1)'}
                                                            />
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            </View>

                                            {/* Actions */}
                                            <TouchableOpacity
                                                style={[
                                                    styles.ratingSubmitAction,
                                                    selectedRating === 0 && styles.ratingSubmitActionDisabled,
                                                ]}
                                                disabled={selectedRating === 0}
                                                activeOpacity={0.8}
                                                onPress={async () => {
                                                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                    if (selectedRating >= 4) {
                                                        closeRatingModal();
                                                        setTimeout(() => {
                                                            StoreReview.requestReview();
                                                        }, 500);
                                                    } else {
                                                        setRatingSubmitted(true);
                                                    }
                                                }}
                                            >
                                                <Text style={styles.ratingSubmitActionText}>Submit Feedback</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={closeRatingModal}
                                                style={styles.ratingLaterBtn}
                                            >
                                                <Text style={styles.ratingLaterText}>Maybe Later</Text>
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        /* Thank-you state */
                                        <View style={styles.ratingThankContainer}>
                                            <View style={styles.ratingThankIcon}>
                                                <Ionicons name="checkmark-circle" size={80} color={looviColors.accent.success} />
                                            </View>
                                            <Text style={styles.ratingSheetTitle}>Thank You!</Text>
                                            <Text style={styles.ratingSheetSubtitle}>
                                                We really appreciate you sharing your thoughts. Every bit of feedback helps us improve.
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.ratingSubmitAction}
                                                activeOpacity={0.8}
                                                onPress={closeRatingModal}
                                            >
                                                <Text style={styles.ratingSubmitActionText}>Done</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </Animated.View>
                        </View>
                    </Modal>


                    {/* Edit Savings Goal Modal */}

                    {/* Edit Profile Modal */}

                    {/* Edit Profile Modal */}
                    <Modal
                        visible={showEditProfile}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setShowEditProfile(false)}
                    >
                        <TouchableOpacity
                            style={styles.modalOverlay}
                            activeOpacity={1}
                            onPress={() => setShowEditProfile(false)}
                        >
                            <TouchableOpacity activeOpacity={1} style={styles.editModalContent}>
                                <Text style={styles.editModalTitle}>Edit Profile</Text>

                                {/* Avatar Selection */}
                                <Text style={styles.inputLabel}>Profile Picture</Text>
                                <View style={styles.avatarPickerSection}>
                                    <TouchableOpacity
                                        style={styles.currentAvatarPreview}
                                        onPress={() => setShowAvatarPicker(!showAvatarPicker)}
                                    >
                                        <UserAvatar
                                            size={56}
                                            photoURL={selectedAvatarType === 'photo' ? selectedAvatarValue : undefined}
                                            avatarType={selectedAvatarType}
                                            avatarValue={selectedAvatarValue}
                                            name={name}
                                        />
                                        <Text style={styles.changeAvatarText}>Tap to change</Text>
                                    </TouchableOpacity>

                                    {/* Google/Apple Photo Option */}
                                    {firebaseUser?.photoURL && (
                                        <TouchableOpacity
                                            style={[
                                                styles.photoOption,
                                                selectedAvatarType === 'photo' && selectedAvatarValue === firebaseUser.photoURL && styles.avatarOptionSelected
                                            ]}
                                            onPress={() => handleSelectAvatar('photo', firebaseUser.photoURL!)}
                                        >
                                            <UserAvatar size={40} photoURL={firebaseUser.photoURL} avatarType="photo" avatarValue={firebaseUser.photoURL} name={name} />
                                            <Text style={styles.photoOptionText}>Use {authProvider === 'google' ? 'Google' : 'Apple'} photo</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Emoji Picker Grid */}
                                {showAvatarPicker && (
                                    <View style={styles.emojiPickerGrid}>
                                        <Text style={styles.emojiPickerTitle}>Choose an emoji</Text>
                                        <View style={styles.emojiGrid}>
                                            {AVATAR_EMOJIS.map((emoji) => (
                                                <TouchableOpacity
                                                    key={emoji}
                                                    style={[
                                                        styles.emojiOption,
                                                        selectedAvatarType === 'emoji' && selectedAvatarValue === emoji && styles.avatarOptionSelected
                                                    ]}
                                                    onPress={() => handleSelectAvatar('emoji', emoji)}
                                                >
                                                    <Text style={styles.emojiText}>{emoji}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Email (Read-only) */}
                                <Text style={styles.inputLabel}>Email</Text>
                                <View style={styles.readOnlyField}>
                                    <Text style={styles.readOnlyText}>{email}</Text>
                                    {(authProvider === 'google' || authProvider === 'apple') && (
                                        <Text style={styles.readOnlyHint}>Managed by {authProvider === 'google' ? 'Google' : 'Apple'}</Text>
                                    )}
                                </View>

                                {/* Username (Read-only) */}
                                {user?.username && (
                                    <>
                                        <Text style={styles.inputLabel}>Username</Text>
                                        <View style={styles.readOnlyField}>
                                            <Text style={styles.readOnlyText}>@{user.username}</Text>
                                            <Text style={styles.readOnlyHint}>This helps friends find you. Cannot be changed.</Text>
                                        </View>
                                    </>
                                )}

                                {/* Display Name */}
                                <Text style={styles.inputLabel}>Your Name</Text>
                                <TextInput
                                    style={styles.editInput}
                                    value={editNameState}
                                    onChangeText={setEditNameState}
                                    placeholder="Your Name"
                                    placeholderTextColor={looviColors.text.muted}
                                    autoCapitalize="words"
                                />
                                <Text style={styles.fieldHint}>This is how friends can find you in the app</Text>

                                <View style={styles.editModalButtons}>
                                    <TouchableOpacity
                                        style={styles.editCancelButton}
                                        onPress={() => setShowEditProfile(false)}
                                        disabled={isSavingProfile}
                                    >
                                        <Text style={styles.editCancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.editSaveButton, isSavingProfile && { opacity: 0.7 }]}
                                        onPress={handleSaveProfile}
                                        disabled={isSavingProfile}
                                    >
                                        <Text style={styles.editSaveText}>{isSavingProfile ? 'Saving...' : 'Save'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </Modal>

                    {/* Notification Settings Modal */}
                    <NotificationSettingsModal
                        visible={showNotificationSettings}
                        onClose={() => setShowNotificationSettings(false)}
                    />

                    {/* Cancellation Offer Modal (Developer Testing) */}
                    {__DEV__ && (
                        <CancellationOfferScreen
                            visible={showCancellationOffer}
                            onClose={() => setShowCancellationOffer(false)}
                            onAcceptYearly={async () => {
                                if (currentOffering?.annual) {
                                    try {
                                        await purchasePackage(currentOffering.annual);
                                        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                        Alert.alert('Success', 'Yearly subscription accepted!');
                                        setShowCancellationOffer(false);
                                    } catch (error: any) {
                                        if (error.message !== 'Purchase cancelled') {
                                            Alert.alert('Error', error.message || 'Purchase failed');
                                        }
                                    }
                                }
                            }}
                            onAcceptLifetime={async () => {
                                if (currentOffering?.lifetime) {
                                    try {
                                        await purchasePackage(currentOffering.lifetime);
                                        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                        Alert.alert('Success', 'Lifetime subscription accepted!');
                                        setShowCancellationOffer(false);
                                    } catch (error: any) {
                                        if (error.message !== 'Purchase cancelled') {
                                            Alert.alert('Error', error.message || 'Purchase failed');
                                        }
                                    }
                                } else {
                                    Alert.alert('Not Available', 'Lifetime package not configured in RevenueCat. Check RevenueCat Dashboard → Offerings.');
                                }
                            }}
                            onContinueFree={() => {
                                Alert.alert('Free Tier', 'Continuing with free tier');
                                setShowCancellationOffer(false);
                            }}
                        />
                    )}
                </SafeAreaView>
            </LooviBackground >
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing.lg,
        paddingBottom: spacing['3xl'],
    },
    header: {
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: looviColors.text.primary,
        letterSpacing: -0.5,
    },
    // Floating User Profile Styles
    userProfileSection: {
        alignItems: 'center',
        marginBottom: spacing.xl,
        paddingVertical: spacing.lg,
    },
    avatarWrapper: {
        marginBottom: spacing.md,
    },
    avatarShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
        borderRadius: 40,
    },
    userName: {
        fontSize: 26,
        fontWeight: '800',
        color: looviColors.text.primary,
        marginBottom: spacing.xs,
        letterSpacing: -0.5,
    },
    userEmail: {
        fontSize: 15,
        fontWeight: '500',
        color: looviColors.text.secondary,
        marginBottom: spacing.md,
    },
    subscriptionBadge: {
        backgroundColor: 'rgba(217, 123, 102, 0.15)',
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        marginBottom: spacing.lg,
    },
    subscriptionText: {
        fontSize: 13,
        fontWeight: '600',
        color: looviColors.coralOrange,
    },
    floatingStatsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    floatingStatCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.65)',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        minWidth: 90,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    floatingStatValue: {
        fontSize: 20,
        fontWeight: '800',
        color: looviColors.text.primary,
        letterSpacing: -0.3,
    },
    floatingStatEmoji: {
        fontSize: 22,
        marginBottom: 2,
    },
    floatingStatLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: looviColors.text.secondary,
        marginTop: spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    // Legacy styles (kept for compatibility)
    userCard: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    avatarEmoji: {
        fontSize: 40,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    // Reasons/Savings Section Styles
    profileSection: {
        marginBottom: spacing.xl,
    },
    profileSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingHorizontal: spacing.sm,
    },
    profileSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: looviColors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    editIcon: {
        fontSize: 14,
    },
    reasonsContainer: {
        gap: spacing.sm,
    },
    reasonCard: {
        marginBottom: spacing.xs,
    },
    reasonText: {
        fontSize: 15,
        fontWeight: '500',
        color: looviColors.text.primary,
    },
    savingsCard: {
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.1)',
    },
    savingsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    savingsLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    savingsGoalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.md,
    },
    savingsProgress: {
        gap: spacing.xs,
    },
    savingsProgressBar: {
        height: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    savingsProgressFill: {
        height: '100%',
        backgroundColor: looviColors.accent.success,
        borderRadius: 4,
    },
    savingsProgressText: {
        fontSize: 12,
        fontWeight: '500',
        color: looviColors.text.tertiary,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.screen.horizontal,
    },
    editModalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius['2xl'],
        padding: spacing.xl,
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    editModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    editInput: {
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        fontSize: 16,
        color: looviColors.text.primary,
        marginBottom: spacing.md,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.secondary,
        marginBottom: spacing.xs,
        marginLeft: spacing.xs,
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444',
        marginBottom: spacing.md,
        marginTop: -spacing.sm,
        marginLeft: spacing.xs,
    },
    readOnlyField: {
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        borderStyle: 'dashed',
    },
    readOnlyText: {
        fontSize: 16,
        color: looviColors.text.tertiary,
    },
    readOnlyHint: {
        fontSize: 11,
        color: looviColors.text.muted,
        marginTop: spacing.xs,
        fontStyle: 'italic',
    },
    fieldHint: {
        fontSize: 11,
        color: looviColors.text.muted,
        marginBottom: spacing.md,
        marginTop: -spacing.sm,
        marginLeft: spacing.xs,
    },
    editModalButtons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    editCancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    editCancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.secondary,
    },
    editSaveButton: {
        flex: 2,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
        backgroundColor: looviColors.accent.primary,
    },
    editSaveText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    menuSection: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: looviColors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.md,
        marginLeft: spacing.sm,
    },
    menuCard: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md + 2,
        paddingHorizontal: spacing.md,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.04)',
    },
    menuEmoji: {
        fontSize: 22,
        marginRight: spacing.md,
    },
    menuLabelContainer: {
        flex: 1,
        marginLeft: spacing.md,
    },
    menuLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    menuValue: {
        fontSize: 13,
        fontWeight: '500',
        color: looviColors.text.secondary,
        marginTop: 2,
    },
    menuSubtext: {
        fontSize: 12,
        fontWeight: '500',
        color: looviColors.text.secondary,
        marginTop: 2,
    },
    menuArrow: {
        fontSize: 22,
        fontWeight: '300',
        color: looviColors.text.muted,
    },
    logoutButton: {
        alignItems: 'center',
        paddingVertical: spacing.md,
        marginTop: spacing.md,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#EF4444',
    },
    footerLogo: {
        width: Dimensions.get('window').width * 0.70,
        height: 80,
        alignSelf: 'center',
        marginTop: spacing.xl,
        opacity: 0.6,
    },
    version: {
        fontSize: 12,
        fontWeight: '400',
        color: looviColors.text.muted,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
    // Avatar picker styles
    avatarPickerSection: {
        alignItems: 'center',
        marginBottom: spacing.md,
        gap: spacing.md,
    },
    currentAvatarPreview: {
        alignItems: 'center',
        gap: spacing.xs,
    },
    changeAvatarText: {
        fontSize: 12,
        color: looviColors.accent.primary,
        fontWeight: '500',
    },
    photoOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
    },
    avatarOptionSelected: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderWidth: 2,
        borderColor: looviColors.accent.primary,
    },
    photoOptionText: {
        fontSize: 14,
        color: looviColors.text.secondary,
        fontWeight: '500',
    },
    emojiPickerGrid: {
        marginBottom: spacing.md,
    },
    emojiPickerTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: looviColors.text.secondary,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    emojiOption: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
    },
    emojiText: {
        fontSize: 24,
    },
    deleteMenuItem: {
        // Optional: could add a subtle red tint background
    },
    deleteMenuLabel: {
        color: '#FF3B30',
    },
    deleteMenuArrow: {
        color: '#FF3B30',
    },
    premiumCard: {
        borderRadius: 20,
        backgroundColor: looviColors.accent.primary,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: looviColors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    premiumContent: {
        flex: 1,
    },
    premiumTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    premiumSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    premiumBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 8,
    },
    premiumBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    upgradeCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    upgradeContent: {
        flex: 1,
    },
    upgradeTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: 2,
    },
    upgradeSubtitle: {
        fontSize: 13,
        color: looviColors.text.secondary,
    },
    upgradeButton: {
        backgroundColor: looviColors.accent.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        borderRadius: 20,
    },
    upgradeButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // ── Rating Bottom Sheet ──
    sheetOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    ratingSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        width: '100%',
        paddingBottom: Platform.OS === 'ios' ? 44 : 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 25,
    },
    sheetHandleContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 14,
    },
    sheetHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
    },
    ratingContent: {
        paddingHorizontal: spacing.xl,
        alignItems: 'center',
    },
    ratingIconContainer: {
        marginBottom: 20,
    },
    ratingIconGradient: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: looviColors.coralOrange,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    ratingIconEmoji: {
        fontSize: 32,
    },
    ratingSheetTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: 10,
    },
    ratingSheetSubtitle: {
        fontSize: 16,
        color: looviColors.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 28,
        paddingHorizontal: 10,
    },
    ratingStarsBox: {
        width: '100%',
        backgroundColor: 'rgba(242, 228, 216, 0.3)',
        paddingVertical: 24,
        borderRadius: 24,
        marginBottom: 28,
        alignItems: 'center',
    },
    starsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    ratingSubmitAction: {
        width: '100%',
        backgroundColor: looviColors.accent.primary,
        borderRadius: 30,
        paddingVertical: 18,
        alignItems: 'center',
    },
    ratingSubmitActionDisabled: {
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    ratingSubmitActionText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    ratingLaterBtn: {
        marginTop: 16,
        paddingVertical: 8,
    },
    ratingLaterText: {
        fontSize: 15,
        color: looviColors.text.tertiary,
        fontWeight: '600',
    },
    ratingThankContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    ratingThankIcon: {
        marginBottom: 20,
    },
});
