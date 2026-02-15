/**
 * UserProfilePopup Component
 * 
 * A modal popup that displays user profile information when clicking on any user.
 * Shows: profile picture, name, and summary statistics (streak, health score).
 * Includes option to add user as friend to Inner Circle.
 * 
 * Size matches the "Edit Profile" modal for consistency.
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import { UserAvatar } from './UserAvatar';
import { friendService } from '../services/friendService';
import { useAuthContext } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { UserStats } from '../types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

type FriendStatus = 'loading' | 'self' | 'friend' | 'pending_sent' | 'pending_received' | 'none';

interface UserProfilePopupProps {
    visible: boolean;
    onClose: () => void;
    userId: string;
    displayName: string;
    photoURL?: string | null;
    avatarType?: 'photo' | 'emoji' | 'initial' | null;
    avatarValue?: string | null;
}

export function UserProfilePopup({
    visible,
    onClose,
    userId,
    displayName,
    photoURL,
    avatarType,
    avatarValue,
}: UserProfilePopupProps) {
    const { user } = useAuthContext();
    const { latestHealthScore, streakData } = useUserData();
    const [stats, setStats] = useState<UserStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [friendStatus, setFriendStatus] = useState<FriendStatus>('loading');
    const [isAddingFriend, setIsAddingFriend] = useState(false);
    const isSelf = user?.id === userId;

    // Check friend status when popup becomes visible
    const checkFriendStatus = async () => {
        if (!user || !userId) return;

        // Self check
        if (user.id === userId) {
            setFriendStatus('self');
            return;
        }

        try {
            // Check if already friends
            const friendDoc = await getDoc(doc(db, 'users', user.id, 'friends', userId));
            if (friendDoc.exists()) {
                setFriendStatus('friend');
                return;
            }

            // Check for pending outgoing request
            const outgoingQuery = query(
                collection(db, 'friendRequests'),
                where('fromUid', '==', user.id),
                where('toUid', '==', userId),
                where('status', '==', 'pending')
            );
            const outgoing = await getDocs(outgoingQuery);
            if (!outgoing.empty) {
                setFriendStatus('pending_sent');
                return;
            }

            // Check for pending incoming request
            const incomingQuery = query(
                collection(db, 'friendRequests'),
                where('fromUid', '==', userId),
                where('toUid', '==', user.id),
                where('status', '==', 'pending')
            );
            const incoming = await getDocs(incomingQuery);
            if (!incoming.empty) {
                setFriendStatus('pending_received');
                return;
            }

            setFriendStatus('none');
        } catch (error) {
            console.error('Error checking friend status:', error);
            setFriendStatus('none');
        }
    };

    // Fetch user stats when popup becomes visible
    useEffect(() => {
        if (visible && userId) {
            setIsLoading(true);
            setFriendStatus('loading');

            // Fetch stats
            friendService.getFriendStats(userId)
                .then(fetchedStats => {
                    if (fetchedStats) {
                        // goalAchieved and pledgedToday are daily flags —
                        // only trust them if updatedAt is from today
                        const today = new Date().toISOString().split('T')[0];
                        const statsDate = fetchedStats.updatedAt
                            ? new Date(fetchedStats.updatedAt).toISOString().split('T')[0]
                            : null;
                        const isFromToday = statsDate === today;

                        const adjustedStats = {
                            ...fetchedStats,
                            goalAchieved: isFromToday ? fetchedStats.goalAchieved : false,
                            pledgedToday: isFromToday ? fetchedStats.pledgedToday : false,
                        };

                        // For self: use fresh local values instead of potentially stale Firestore data
                        if (isSelf) {
                            adjustedStats.healthScore = latestHealthScore || adjustedStats.healthScore;
                            adjustedStats.currentStreak = streakData?.currentStreak ?? adjustedStats.currentStreak;
                        }

                        setStats(adjustedStats);
                    } else {
                        setStats(fetchedStats);
                    }
                })
                .catch(error => {
                    console.error('Error fetching user stats:', error);
                })
                .finally(() => {
                    setIsLoading(false);
                });

            // Check friend status
            checkFriendStatus();
        }
    }, [visible, userId, user?.id]);

    // Reset state when closing
    useEffect(() => {
        if (!visible) {
            setStats(null);
            setIsLoading(true);
            setFriendStatus('loading');
            setIsAddingFriend(false);
        }
    }, [visible]);

    const handleAddFriend = async () => {
        if (!user || friendStatus !== 'none') return;

        setIsAddingFriend(true);
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            await friendService.sendFriendRequest(
                user.id,
                user.displayName || 'User',
                user.username, // Pass username for GDPR compliance
                userId,
                displayName
            );

            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setFriendStatus('pending_sent');
            Alert.alert('Request Sent! 🎉', `Friend request sent to ${displayName}!`);
        } catch (error: any) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            if (error.message?.includes('Already friends')) {
                setFriendStatus('friend');
            } else if (error.message?.includes('already sent')) {
                setFriendStatus('pending_sent');
            } else {
                Alert.alert('Error', error.message || 'Failed to send friend request');
            }
        } finally {
            setIsAddingFriend(false);
        }
    };

    const [isRemovingFriend, setIsRemovingFriend] = useState(false);

    const handleRemoveFriend = () => {
        if (!user) return;

        Alert.alert(
            'Remove Friend',
            `Are you sure you want to remove ${displayName} from your Inner Circle?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        setIsRemovingFriend(true);
                        try {
                            await friendService.removeFriend(user.id, userId);
                            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            setFriendStatus('none');
                        } catch (error) {
                            console.error('Error removing friend:', error);
                            Alert.alert('Error', 'Failed to remove friend');
                        } finally {
                            setIsRemovingFriend(false);
                        }
                    },
                },
            ]
        );
    };

    const renderFriendButton = () => {
        if (friendStatus === 'loading' || friendStatus === 'self') {
            return null;
        }

        if (friendStatus === 'friend') {
            return (
                <View>
                    <View style={styles.friendBadge}>
                        <Ionicons name="people" size={16} color={looviColors.accent.primary} />
                        <Text style={styles.friendBadgeText}>In Your Inner Circle</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.removeFriendButton}
                        onPress={handleRemoveFriend}
                        disabled={isRemovingFriend}
                        activeOpacity={0.7}
                    >
                        {isRemovingFriend ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                            <>
                                <Ionicons name="person-remove-outline" size={16} color="#EF4444" />
                                <Text style={styles.removeFriendButtonText}>Remove as Friend</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            );
        }

        if (friendStatus === 'pending_sent') {
            return (
                <View style={[styles.friendButton, styles.friendButtonPending]}>
                    <Ionicons name="hourglass-outline" size={18} color={looviColors.text.tertiary} />
                    <Text style={styles.friendButtonPendingText}>Request Pending</Text>
                </View>
            );
        }

        if (friendStatus === 'pending_received') {
            return (
                <View style={[styles.friendButton, styles.friendButtonReceived]}>
                    <Ionicons name="mail" size={18} color="#F97316" />
                    <Text style={styles.friendButtonReceivedText}>Has Sent You a Request</Text>
                </View>
            );
        }

        // Can add friend
        return (
            <TouchableOpacity
                style={styles.friendButton}
                onPress={handleAddFriend}
                disabled={isAddingFriend}
                activeOpacity={0.8}
            >
                {isAddingFriend ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                    <>
                        <Ionicons name="person-add" size={18} color="#FFFFFF" />
                        <Text style={styles.friendButtonText}>Add to Inner Circle</Text>
                    </>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity activeOpacity={1} style={styles.content}>
                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={20} color={looviColors.text.tertiary} />
                    </TouchableOpacity>

                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        <UserAvatar
                            size={80}
                            photoURL={photoURL}
                            avatarType={avatarType}
                            avatarValue={avatarValue}
                            name={displayName}
                        />
                    </View>

                    {/* Name */}
                    <Text style={styles.userName}>{displayName}</Text>

                    {/* Stats Section */}
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={looviColors.accent.primary} />
                            <Text style={styles.loadingText}>Loading stats...</Text>
                        </View>
                    ) : stats ? (
                        <View style={styles.statsContainer}>
                            {/* Streak */}
                            <View style={styles.statItem}>
                                <View style={styles.statIconContainer}>
                                    <Ionicons name="flame" size={20} color="#F97316" />
                                </View>
                                <Text style={styles.statValue}>{stats.currentStreak}</Text>
                                <Text style={styles.statLabel}>Day Streak</Text>
                            </View>

                            {/* Divider */}
                            <View style={styles.statDivider} />

                            {/* Health Score */}
                            <View style={styles.statItem}>
                                <View style={styles.statIconContainer}>
                                    <Ionicons name="heart" size={20} color={looviColors.accent.primary} />
                                </View>
                                <Text style={styles.statValue}>{stats.healthScore}</Text>
                                <Text style={styles.statLabel}>Health Score</Text>
                            </View>

                            {/* Divider */}
                            <View style={styles.statDivider} />

                            {/* Pledge */}
                            <View style={styles.statItem}>
                                <View style={styles.statIconContainer}>
                                    <Ionicons
                                        name={stats.pledgedToday ? "hand-left" : "hand-left-outline"}
                                        size={20}
                                        color={stats.pledgedToday ? "#22C55E" : looviColors.text.tertiary}
                                    />
                                </View>
                                <Text style={[
                                    styles.statValue,
                                    { color: stats.pledgedToday ? "#22C55E" : looviColors.text.tertiary }
                                ]}>
                                    {stats.pledgedToday ? 'Yes' : 'No'}
                                </Text>
                                <Text style={styles.statLabel}>Pledge</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.noStatsContainer}>
                            <Ionicons name="stats-chart-outline" size={32} color={looviColors.text.muted} />
                            <Text style={styles.noStatsText}>Stats not available yet</Text>
                        </View>
                    )}

                    {/* Goal Achievement Badge */}
                    {stats?.goalAchieved && (
                        <View style={styles.achievementBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                            <Text style={styles.achievementText}>Today's goal achieved!</Text>
                        </View>
                    )}

                    {/* Add Friend Button */}
                    {renderFriendButton()}
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.screen.horizontal,
    },
    content: {
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius['2xl'],
        padding: spacing.xl,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    closeButton: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        padding: spacing.xs,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    avatarContainer: {
        marginTop: spacing.sm,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    loadingText: {
        marginTop: spacing.sm,
        fontSize: 14,
        color: looviColors.text.tertiary,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-around',
        width: '100%',
        paddingVertical: spacing.md,
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: borderRadius.lg,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statIconContainer: {
        marginBottom: spacing.xs,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    statDivider: {
        width: 1,
        height: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
    },
    feelingEmoji: {
        fontSize: 20,
    },
    noStatsContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    noStatsText: {
        marginTop: spacing.sm,
        fontSize: 14,
        color: looviColors.text.tertiary,
    },
    achievementBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        marginTop: spacing.md,
        gap: spacing.xs,
    },
    achievementText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#22C55E',
    },
    // Friend button styles
    friendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: looviColors.accent.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.xl,
        marginTop: spacing.lg,
        gap: spacing.sm,
        width: '100%',
    },
    friendButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    friendButtonPending: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    friendButtonPendingText: {
        fontSize: 14,
        fontWeight: '500',
        color: looviColors.text.tertiary,
    },
    friendButtonReceived: {
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
    },
    friendButtonReceivedText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#F97316',
    },
    friendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        marginTop: spacing.lg,
        gap: spacing.xs,
    },
    friendBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: looviColors.accent.primary,
    },
    removeFriendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.sm,
        paddingVertical: spacing.sm,
        gap: spacing.xs,
    },
    removeFriendButtonText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#EF4444',
    },
});

export default UserProfilePopup;

