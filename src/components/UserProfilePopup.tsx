/**
 * UserProfilePopup Component
 * 
 * A modal popup that displays user profile information when clicking on any user.
 * Refactored to a gesture-driven bottom sheet.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Animated,
    PanResponder,
    Dimensions,
    TouchableWithoutFeedback,
    Platform,
} from 'react-native';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import { UserAvatar } from './UserAvatar';
import { friendService } from '../services/friendService';
import { useAuthContext } from '../context/AuthContext';
import { UserStats } from '../types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.65;
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.4;

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
    const [stats, setStats] = useState<UserStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [friendStatus, setFriendStatus] = useState<FriendStatus>('loading');
    const [isAddingFriend, setIsAddingFriend] = useState(false);
    const [isRemovingFriend, setIsRemovingFriend] = useState(false);

    const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

    const dismiss = useCallback(() => {
        Animated.timing(translateY, {
            toValue: SHEET_HEIGHT,
            duration: 220,
            useNativeDriver: true,
        }).start(() => onClose());
    }, [translateY, onClose]);

    useEffect(() => {
        if (visible) {
            translateY.setValue(SHEET_HEIGHT);
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 3,
                speed: 14,
            }).start();
        }
    }, [visible]);

    const checkFriendStatus = async () => {
        if (!user || !userId) return;
        if (user.id === userId) {
            setFriendStatus('self');
            return;
        }

        try {
            const friendDoc = await getDoc(doc(db, 'users', user.id, 'friends', userId));
            if (friendDoc.exists()) {
                setFriendStatus('friend');
                return;
            }

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

    useEffect(() => {
        if (visible && userId) {
            setIsLoading(true);
            setFriendStatus('loading');
            friendService.getFriendStats(userId)
                .then(fetchedStats => setStats(fetchedStats))
                .catch(error => console.error('Error fetching user stats:', error))
                .finally(() => setIsLoading(false));
            checkFriendStatus();
        }
    }, [visible, userId, user?.id]);

    const handleAddFriend = async () => {
        if (!user || friendStatus !== 'none') return;
        setIsAddingFriend(true);
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await friendService.sendFriendRequest(
                user.id,
                user.displayName || 'User',
                user.username,
                userId,
                displayName
            );
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setFriendStatus('pending_sent');
            Alert.alert('Request Sent! 🎉', `Friend request sent to ${displayName}!`);
        } catch (error: any) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', error.message || 'Failed to send friend request');
        } finally {
            setIsAddingFriend(false);
        }
    };

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

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 10,
            onPanResponderGrant: () => {
                translateY.stopAnimation();
                translateY.setOffset(0);
            },
            onPanResponderMove: (_, gs) => {
                translateY.setValue(Math.max(0, gs.dy));
            },
            onPanResponderRelease: (_, gs) => {
                translateY.flattenOffset();
                if (gs.dy > DISMISS_THRESHOLD || gs.vy > 1.0) {
                    dismiss();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 4,
                        speed: 14,
                    }).start();
                }
            },
        })
    ).current;

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={dismiss}>
                    <View style={StyleSheet.absoluteFill} />
                </TouchableWithoutFeedback>

                <Animated.View
                    style={[
                        styles.sheet,
                        { transform: [{ translateY }] }
                    ]}
                >
                    <View {...panResponder.panHandlers} style={styles.handleContainer}>
                        <View style={styles.handle} />
                    </View>

                    <View style={styles.content}>
                        <View style={styles.avatarContainer}>
                            <UserAvatar
                                size={100}
                                photoURL={photoURL}
                                avatarType={avatarType}
                                avatarValue={avatarValue}
                                name={displayName}
                            />
                        </View>

                        <Text style={styles.userName}>{displayName}</Text>

                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={looviColors.accent.primary} />
                                <Text style={styles.loadingText}>Loading stats...</Text>
                            </View>
                        ) : stats ? (
                            <View style={styles.statsContainer}>
                                <View style={styles.statItem}>
                                    <Ionicons name="flame" size={24} color="#F97316" />
                                    <Text style={styles.statValue}>{stats.currentStreak}</Text>
                                    <Text style={styles.statLabel}>Day Streak</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Ionicons name="heart" size={24} color={looviColors.accent.primary} />
                                    <Text style={styles.statValue}>{stats.healthScore}</Text>
                                    <Text style={styles.statLabel}>Health Score</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Ionicons
                                        name={stats.pledgedToday ? "hand-left" : "hand-left-outline"}
                                        size={24}
                                        color={stats.pledgedToday ? "#22C55E" : looviColors.text.tertiary}
                                    />
                                    <Text style={[styles.statValue, { color: stats.pledgedToday ? "#22C55E" : looviColors.text.tertiary }]}>
                                        {stats.pledgedToday ? 'Yes' : 'No'}
                                    </Text>
                                    <Text style={styles.statLabel}>Pledged</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.noStatsContainer}>
                                <Text style={styles.noStatsText}>Stats not available</Text>
                            </View>
                        )}

                        <View style={styles.buttonContainer}>
                            {friendStatus === 'friend' ? (
                                <TouchableOpacity style={styles.removeButton} onPress={handleRemoveFriend} disabled={isRemovingFriend}>
                                    <Text style={styles.removeButtonText}>Remove Friend</Text>
                                </TouchableOpacity>
                            ) : friendStatus === 'pending_sent' ? (
                                <View style={styles.pendingButton}>
                                    <Text style={styles.pendingButtonText}>Request Sent</Text>
                                </View>
                            ) : friendStatus === 'pending_received' ? (
                                <View style={styles.receivedButton}>
                                    <Text style={styles.receivedButtonText}>Check Your Requests</Text>
                                </View>
                            ) : friendStatus === 'none' ? (
                                <TouchableOpacity style={styles.addButton} onPress={handleAddFriend} disabled={isAddingFriend}>
                                    {isAddingFriend ? <ActivityIndicator color="#FFF" /> : <Text style={styles.addButtonText}>Add to Inner Circle</Text>}
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        width: '100%',
        minHeight: SHEET_HEIGHT,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    handleContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 14,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
    },
    content: {
        paddingHorizontal: spacing.xl,
        alignItems: 'center',
    },
    avatarContainer: {
        marginBottom: spacing.md,
    },
    userName: {
        fontSize: 26,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.xl,
    },
    statsContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.xl,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginVertical: 4,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: looviColors.text.tertiary,
        textTransform: 'uppercase',
    },
    statDivider: {
        width: 1,
        height: '80%',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        alignSelf: 'center',
    },
    loadingContainer: {
        paddingVertical: spacing.xl,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: spacing.sm,
        color: looviColors.text.tertiary,
    },
    noStatsContainer: {
        paddingVertical: spacing.xl,
    },
    noStatsText: {
        color: looviColors.text.muted,
    },
    buttonContainer: {
        width: '100%',
        marginTop: spacing.md,
    },
    addButton: {
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    removeButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
    },
    removeButtonText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '600',
    },
    pendingButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
    },
    pendingButtonText: {
        color: looviColors.text.tertiary,
        fontSize: 16,
        fontWeight: '600',
    },
    receivedButton: {
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
    },
    receivedButtonText: {
        color: '#F97316',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default UserProfilePopup;
