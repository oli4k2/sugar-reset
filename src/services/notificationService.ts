/**
 * Notification Service
 * 
 * Handles push notifications for:
 * - SOS alerts to Inner Circle
 * - Low health score alerts
 * - Friend request notifications
 * - Encouragement messages
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import { doc, setDoc, getDoc, collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { friendService } from './friendService';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface NotificationPayload {
    type: 'sos' | 'low_score' | 'friend_request' | 'encouragement' | 'friend_accepted';
    title: string;
    body: string;
    data?: Record<string, any>;
}

export const notificationService = {
    /**
     * Register for push notifications and store the token
     */
    async registerForPushNotifications(userId: string): Promise<string | null> {
        if (!Device.isDevice) {
            console.log('Push notifications require a physical device');
            return null;
        }

        // Check existing permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // Request permission if not granted
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Push notification permission not granted');
            return null;
        }

        // Get the Expo push token
        try {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId;
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: projectId,
            });
            const token = tokenData.data;

            // Store the token in Firestore
            await this.savePushToken(userId, token);

            // Configure Android notification channel
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'Default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF6B6B',
                });

                await Notifications.setNotificationChannelAsync('sos', {
                    name: 'SOS Alerts',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 500, 250, 500],
                    lightColor: '#FF0000',
                    sound: 'default',
                });
            }

            return token;
        } catch (error) {
            console.error('Error getting push token:', error);
            return null;
        }
    },

    /**
     * Save the push token to Firestore
     */
    async savePushToken(userId: string, token: string): Promise<void> {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            pushToken: token,
            pushTokenUpdatedAt: serverTimestamp(),
            platform: Platform.OS,
        }, { merge: true });
    },

    /**
     * Get a user's push token
     */
    async getUserPushToken(userId: string): Promise<string | null> {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return null;
        return userSnap.data()?.pushToken || null;
    },

    /**
     * Send local notification (for testing/immediate alerts)
     */
    async sendLocalNotification(payload: NotificationPayload): Promise<void> {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: payload.title,
                body: payload.body,
                data: { type: payload.type, ...payload.data },
                sound: true,
            },
            trigger: null, // Immediate
        });
    },

    /**
     * Send SOS alert to all friends in Inner Circle
     * This creates a notification record in Firestore that Cloud Functions can pick up
     * OR we can send directly using Expo's push notification service
     */
    async sendSOSAlert(
        userId: string,
        userName: string,
        message?: string
    ): Promise<{ success: boolean; notifiedCount: number }> {
        try {
            // Get user's friends
            const friends = await friendService.getInnerCircle(userId);

            if (friends.length === 0) {
                return { success: false, notifiedCount: 0 };
            }

            // Get push tokens for all friends
            const notifications: { to: string; title: string; body: string; data: any }[] = [];

            for (const friend of friends) {
                const token = await this.getUserPushToken(friend.uid);
                if (token) {
                    notifications.push({
                        to: token,
                        title: '🆘 SOS Alert',
                        body: `${userName} needs support right now!${message ? ` "${message}"` : ''}`,
                        data: {
                            type: 'sos',
                            fromUserId: userId,
                            fromUserName: userName,
                            message,
                        },
                    });
                }
            }

            // Send notifications via Expo Push API
            if (notifications.length > 0) {
                await this.sendExpoPushNotifications(notifications);
            }

            // Also store the SOS event in Firestore for history
            await this.storeSOSEvent(userId, userName, message);

            return { success: true, notifiedCount: notifications.length };
        } catch (error) {
            console.error('Error sending SOS alert:', error);
            return { success: false, notifiedCount: 0 };
        }
    },

    /**
     * Store SOS event in Firestore
     */
    async storeSOSEvent(userId: string, userName: string, message?: string): Promise<void> {
        const sosRef = doc(collection(db, 'sosEvents'));
        await setDoc(sosRef, {
            userId,
            userName,
            message: message || null,
            createdAt: serverTimestamp(),
        });
    },

    /**
     * Send push notifications via Expo's push service
     */
    async sendExpoPushNotifications(
        notifications: { to: string; title: string; body: string; data?: any }[]
    ): Promise<void> {
        const messages = notifications.map(n => ({
            to: n.to,
            sound: 'default' as const,
            title: n.title,
            body: n.body,
            data: n.data || {},
            priority: 'high' as const,
        }));

        // Send to Expo Push API
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
        });

        const result = await response.json();

        if (result.errors) {
            console.error('Push notification errors:', result.errors);
        }
    },

    /**
     * Send low health score alert to friends
     */
    async sendLowScoreAlert(
        userId: string,
        userName: string,
        score: number
    ): Promise<void> {
        const friends = await friendService.getInnerCircle(userId);
        const notifications: { to: string; title: string; body: string; data: any }[] = [];

        for (const friend of friends) {
            const token = await this.getUserPushToken(friend.uid);
            if (token) {
                notifications.push({
                    to: token,
                    title: '💪 Your friend needs support',
                    body: `${userName}'s health score dropped to ${score}. Send some encouragement!`,
                    data: {
                        type: 'low_score',
                        fromUserId: userId,
                        score,
                    },
                });
            }
        }

        if (notifications.length > 0) {
            await this.sendExpoPushNotifications(notifications);
        }
    },

    /**
     * Send encouragement to a friend
     */
    async sendEncouragement(
        fromUserId: string,
        fromUserName: string,
        toUserId: string,
        message: string
    ): Promise<boolean> {
        try {
            const token = await this.getUserPushToken(toUserId);

            if (!token) {
                console.log('Friend does not have push notifications enabled');
                return false;
            }

            await this.sendExpoPushNotifications([{
                to: token,
                title: '💝 Encouragement from ' + fromUserName,
                body: message,
                data: {
                    type: 'encouragement',
                    fromUserId,
                    fromUserName,
                },
            }]);

            return true;
        } catch (error) {
            console.error('Error sending encouragement:', error);
            return false;
        }
    },

    /**
     * Send streak milestone notification to friends
     */
    async sendStreakMilestoneNotification(
        userId: string,
        userName: string,
        streak: number
    ): Promise<void> {
        // Only send for milestone numbers
        const milestones = [7, 14, 21, 30, 60, 90, 100, 180, 365];
        if (!milestones.includes(streak)) return;

        const friends = await friendService.getInnerCircle(userId);
        const emoji = streak >= 30 ? '🏆' : streak >= 14 ? '🌟' : '🔥';

        const notifications: { to: string; title: string; body: string; data: any }[] = [];

        for (const friend of friends) {
            const token = await this.getUserPushToken(friend.uid);
            if (token) {
                notifications.push({
                    to: token,
                    title: `${emoji} ${userName} hit ${streak} days!`,
                    body: `Send them some encouragement to keep going!`,
                    data: {
                        type: 'streak_milestone',
                        fromUserId: userId,
                        streak,
                    },
                });
            }
        }

        if (notifications.length > 0) {
            await this.sendExpoPushNotifications(notifications);
        }
    },

    /**
     * Schedule a local daily check-in reminder
     */
    async scheduleDailyReminder(hour: number = 20, minute: number = 0): Promise<void> {
        // Cancel existing reminders first
        await Notifications.cancelAllScheduledNotificationsAsync();

        // Schedule daily reminder at specified time
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '📝 Daily Check-in',
                body: "How are you doing today? Log your progress!",
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
            },
        });
    },

    /**
     * Send friend request notification
     */
    async sendFriendRequestNotification(
        fromUserId: string,
        fromUserName: string,
        toUserId: string
    ): Promise<void> {
        const token = await this.getUserPushToken(toUserId);

        if (!token) return;

        await this.sendExpoPushNotifications([{
            to: token,
            title: '👋 New Friend Request',
            body: `${fromUserName} wants to join your Inner Circle!`,
            data: {
                type: 'friend_request',
                fromUserId,
                fromUserName,
            },
        }]);
    },

    /**
     * Send friend accepted notification
     */
    async sendFriendAcceptedNotification(
        accepterName: string,
        toUserId: string
    ): Promise<void> {
        const token = await this.getUserPushToken(toUserId);

        if (!token) return;

        await this.sendExpoPushNotifications([{
            to: token,
            title: '🎉 Friend Request Accepted',
            body: `${accepterName} accepted your friend request!`,
            data: {
                type: 'friend_accepted',
            },
        }]);
    },

    /**
     * Add notification listener
     */
    addNotificationReceivedListener(
        callback: (notification: Notifications.Notification) => void
    ): Notifications.EventSubscription {
        return Notifications.addNotificationReceivedListener(callback);
    },

    /**
     * Add notification response listener (when user taps notification)
     */
    addNotificationResponseListener(
        callback: (response: Notifications.NotificationResponse) => void
    ): Notifications.EventSubscription {
        return Notifications.addNotificationResponseReceivedListener(callback);
    },

    /**
     * Get badge count
     */
    async getBadgeCount(): Promise<number> {
        return await Notifications.getBadgeCountAsync();
    },

    /**
     * Set badge count
     */
    async setBadgeCount(count: number): Promise<void> {
        await Notifications.setBadgeCountAsync(count);
    },

    /**
     * Clear all notifications
     */
    async clearAllNotifications(): Promise<void> {
        await Notifications.dismissAllNotificationsAsync();
        await this.setBadgeCount(0);
    },
};

export default notificationService;
