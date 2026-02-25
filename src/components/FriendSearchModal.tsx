/**
 * FriendSearchModal
 *
 * Modal for searching and adding friends by name or email.
 * Refactored to a gesture-driven bottom sheet.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Animated,
    PanResponder,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import { GlassCard } from './GlassCard';
import { friendService } from '../services/friendService';
import { userService } from '../services/userService';
import { User } from '../types';
import { useAuthContext } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.4;

interface FriendSearchModalProps {
    visible: boolean;
    onClose: () => void;
    onRequestSent?: () => void;
}

export function FriendSearchModal({ visible, onClose, onRequestSent }: FriendSearchModalProps) {
    const { user } = useAuthContext();
    const { onboardingData } = useUserData();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [sendingTo, setSendingTo] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
    const [pendingRequestIds, setPendingRequestIds] = useState<Set<string>>(new Set());
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

    const dismiss = useCallback(() => {
        Keyboard.dismiss();
        Animated.timing(translateY, {
            toValue: SHEET_HEIGHT,
            duration: 220,
            useNativeDriver: true,
        }).start(() => {
            onClose();
            setSearchQuery('');
            setSearchResults([]);
            setHasSearched(false);
            setSearchError(null);
        });
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

    const handleSearch = useCallback(async (query: string) => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery || trimmedQuery.length < 2) {
            setSearchResults([]);
            setHasSearched(false);
            setSearchError(null);
            return;
        }

        setIsSearching(true);
        setHasSearched(true);
        setSearchError(null);
        try {
            console.log('🔍 FriendSearchModal: Searching for:', trimmedQuery);
            const results = await friendService.searchUsers(trimmedQuery);
            const filtered = results.filter(u => u.id !== user?.id);
            setSearchResults(filtered);
        } catch (error: any) {
            console.error('Search error:', error);
            setSearchError(error?.message || 'Search failed');
        } finally {
            setIsSearching(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        if (searchQuery.trim().length >= 2) {
            debounceTimer.current = setTimeout(() => {
                handleSearch(searchQuery);
            }, 300);
        } else {
            setSearchResults([]);
            setHasSearched(false);
        }

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [searchQuery, handleSearch]);

    const loadFriendsAndRequests = async () => {
        if (!user?.id) return;
        try {
            const friends = await friendService.getInnerCircle(user.id);
            setFriendIds(new Set(friends.map(f => f.uid)));
            const outgoing = await friendService.getOutgoingRequests(user.id);
            setPendingRequestIds(new Set(outgoing.map(r => r.toUid)));
        } catch (error) {
            console.error('Error loading friends/requests:', error);
        }
    };

    useEffect(() => {
        if (visible && user?.id) {
            loadFriendsAndRequests();
        }
    }, [visible, user?.id]);

    const handleSendRequest = async (toUser: User) => {
        if (!user) return;

        setSendingTo(toUser.id);
        try {
            await friendService.sendFriendRequest(
                user.id,
                onboardingData.nickname || user.displayName || user.email,
                user.username,
                toUser.id,
                toUser.displayName,
                toUser.email
            );
            Alert.alert('Success', `Friend request sent to ${toUser.displayName || toUser.username || 'user'}!`);
            onRequestSent?.();
            setSearchResults(prev => prev.filter(u => u.id !== toUser.id));
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send friend request');
        } finally {
            setSendingTo(null);
        }
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

    const renderUserItem = ({ item }: { item: User }) => {
        const isFriend = friendIds.has(item.id);
        const isPending = pendingRequestIds.has(item.id);

        return (
            <GlassCard variant="light" padding="md" style={styles.userCard}>
                <View style={styles.userRow}>
                    <View style={[styles.avatar, { backgroundColor: looviColors.accent.primary }]}>
                        <Text style={styles.avatarText}>
                            {(item.displayName || item.username || '?')?.[0]?.toUpperCase() || '?'}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{item.displayName || 'Anonymous'}</Text>
                        {item.username && <Text style={styles.userEmail}>@{item.username}</Text>}
                    </View>
                    {isFriend ? (
                        <View style={styles.friendsButton}>
                            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                            <Text style={styles.friendsButtonText}>Friends</Text>
                        </View>
                    ) : isPending ? (
                        <View style={styles.pendingButton}>
                            <Ionicons name="time" size={16} color={looviColors.text.tertiary} />
                            <Text style={styles.pendingButtonText}>Pending</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.addButton, sendingTo === item.id && styles.addButtonDisabled]}
                            onPress={() => handleSendRequest(item)}
                            disabled={sendingTo === item.id}
                        >
                            {sendingTo === item.id ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Ionicons name="person-add" size={16} color="#FFFFFF" />
                                    <Text style={styles.addButtonText}>Add</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </GlassCard>
        );
    };

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

                    <View style={styles.header}>
                        <Text style={styles.title}>Find Friends</Text>
                        <Text style={styles.subtitle}>Inner Circle members support each other.</Text>
                    </View>

                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color={looviColors.text.muted} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Enter name or username..."
                            placeholderTextColor={looviColors.text.muted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={Keyboard.dismiss}
                            returnKeyType="search"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {isSearching && <ActivityIndicator size="small" color={looviColors.accent.primary} />}
                    </View>

                    <FlatList
                        data={searchResults}
                        keyExtractor={(item) => item.id}
                        renderItem={renderUserItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                        keyboardShouldPersistTaps="handled"
                        ListEmptyComponent={
                            hasSearched && !isSearching ? (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No users found</Text>
                                    <Text style={styles.emptySubText}>Try a different name or username.</Text>
                                </View>
                            ) : null
                        }
                    />
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
        height: SHEET_HEIGHT,
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
    header: {
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.md,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    subtitle: {
        fontSize: 14,
        color: looviColors.text.tertiary,
        marginTop: 2,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: spacing.xl,
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: looviColors.text.primary,
    },
    listContent: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xl,
    },
    userCard: {
        marginBottom: spacing.sm,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    userInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    userEmail: {
        fontSize: 13,
        color: looviColors.text.tertiary,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: looviColors.accent.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
    },
    addButtonDisabled: {
        opacity: 0.7,
    },
    addButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    friendsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
    },
    friendsButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#22C55E',
    },
    pendingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
    },
    pendingButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.tertiary,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.secondary,
    },
    emptySubText: {
        fontSize: 14,
        color: looviColors.text.tertiary,
        marginTop: 4,
    },
});

export default FriendSearchModal;
