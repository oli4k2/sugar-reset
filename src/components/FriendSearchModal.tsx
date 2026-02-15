/**
 * FriendSearchModal
 *
 * Modal for searching and adding friends by name or email.
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
            console.log('🔍 FriendSearchModal: Got results:', results.length, results.map(r => r.username || r.displayName));
            // Filter out current user
            const filtered = results.filter(u => u.id !== user?.id);
            console.log('🔍 FriendSearchModal: After filtering self:', filtered.length);
            setSearchResults(filtered);
        } catch (error: any) {
            console.error('Search error:', error);
            setSearchError(error?.message || 'Search failed');
            Alert.alert('Error', 'Failed to search users. Please check your internet connection.');
        } finally {
            setIsSearching(false);
        }
    }, [user?.id]);

    // Auto-search with debounce as user types
    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        if (searchQuery.trim().length >= 2) {
            debounceTimer.current = setTimeout(() => {
                handleSearch(searchQuery);
            }, 300); // 300ms debounce
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

    // Ensure current user has displayNameLower when modal opens
    const hasSyncedSelf = useRef(false);
    useEffect(() => {
        if (visible && !hasSyncedSelf.current && user?.id) {
            hasSyncedSelf.current = true;

            // Debug: List all users to see what's in the database
            userService.listAllUsers(10);

            // Backfill search fields for current user
            userService.backfillSearchFields(user.id).then(() => {
                console.log('✅ Search fields check complete');
            }).catch(err => {
                console.warn('⚠️ Failed to check search fields:', err);
            });

            const displayName = onboardingData.nickname || user.displayName;
            if (displayName) {
                userService.updateDisplayName(user.id, displayName).then(() => {
                    console.log('✅ Synced own displayNameLower for search');
                }).catch(err => {
                    console.warn('⚠️ Failed to sync displayNameLower:', err);
                });
            }

            // Load friends and outgoing requests to check status
            loadFriendsAndRequests();
        }
    }, [visible, user, onboardingData.nickname]);

    // Load current friends and pending outgoing requests
    const loadFriendsAndRequests = async () => {
        if (!user?.id) return;
        try {
            // Get current friends
            const friends = await friendService.getInnerCircle(user.id);
            setFriendIds(new Set(friends.map(f => f.uid)));

            // Get outgoing friend requests
            const outgoing = await friendService.getOutgoingRequests(user.id);
            setPendingRequestIds(new Set(outgoing.map(r => r.toUid)));
        } catch (error) {
            console.error('Error loading friends/requests:', error);
        }
    };

    const handleSendRequest = async (toUser: User) => {
        if (!user) return;

        setSendingTo(toUser.id);
        try {
            await friendService.sendFriendRequest(
                user.id,
                onboardingData.nickname || user.displayName || user.email,
                user.username, // Pass username for GDPR compliance
                toUser.id,
                toUser.displayName, // recipient's name
                toUser.email // recipient's email (not displayed, but kept for compatibility)
            );
            Alert.alert('Success', `Friend request sent to ${toUser.displayName || toUser.username || 'user'}!`);
            onRequestSent?.();

            // Remove from results to prevent duplicate sends
            setSearchResults(prev => prev.filter(u => u.id !== toUser.id));
        } catch (error: any) {
            if (error.message === 'Already friends with this user') {
                Alert.alert('Already Friends', 'You are already friends with this user.');
            } else if (error.message === 'Friend request already sent') {
                Alert.alert('Already Sent', 'You have already sent a friend request to this user.');
            } else {
                console.error('Send request error:', error);
                Alert.alert('Error', 'Failed to send friend request');
            }
        } finally {
            setSendingTo(null);
        }
    };

    const handleClose = () => {
        setSearchQuery('');
        setSearchResults([]);
        setHasSearched(false);
        setSearchError(null);
        onClose();
    };

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
                        <Text style={styles.userName}>
                            {item.displayName || 'Anonymous'}
                        </Text>
                        {item.username && (
                            <Text style={styles.userEmail}>@{item.username}</Text>
                        )}
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
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.overlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.keyboardAvoid}
                    >
                        <View style={styles.container}>
                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.title}>Find Friends</Text>
                                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                                    <Ionicons name="close" size={24} color={looviColors.text.primary} />
                                </TouchableOpacity>
                            </View>

                            {/* Search Input */}
                            <View style={styles.searchContainer}>
                                <Ionicons name="search" size={20} color={looviColors.text.muted} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search by name or username..."
                                    placeholderTextColor={looviColors.text.muted}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    onSubmitEditing={() => handleSearch(searchQuery)}
                                    returnKeyType="search"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoFocus
                                />
                                {isSearching ? (
                                    <ActivityIndicator size="small" color={looviColors.text.muted} />
                                ) : searchQuery.length > 0 ? (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <Ionicons name="close-circle" size={20} color={looviColors.text.muted} />
                                    </TouchableOpacity>
                                ) : null}
                            </View>

                            {/* Results */}
                            <View style={styles.resultsContainer}>
                                {searchError && (
                                    <View style={styles.noResultsContainer}>
                                        <Text style={styles.noResults}>Search error</Text>
                                        <Text style={styles.noResultsHint}>{searchError}</Text>
                                    </View>
                                )}
                                {!searchError && searchResults.length === 0 && !isSearching && hasSearched && (
                                    <View style={styles.noResultsContainer}>
                                        <Text style={styles.noResults}>No users found</Text>
                                        <Text style={styles.noResultsHint}>
                                            Search matches the start of names or usernames.
                                            Try typing the first few letters of their name or username.
                                        </Text>
                                        <Text style={styles.noResultsTip}>
                                            Example: "john" finds "John" or "johnstar45"
                                        </Text>
                                    </View>
                                )}
                                <FlatList
                                    data={searchResults}
                                    keyExtractor={(item) => item.id}
                                    renderItem={renderUserItem}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.resultsList}
                                    keyboardShouldPersistTaps="handled"
                                />
                            </View>

                            {/* Hint */}
                            <Text style={styles.hint}>
                                Enter the beginning of their name or username
                            </Text>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        paddingHorizontal: spacing.md,
    },
    keyboardAvoid: {
        flex: 1,
        justifyContent: 'center',
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius['2xl'],
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xl,
        maxHeight: '80%',
        overflow: 'hidden', // Ensure content stays within bounds
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    closeButton: {
        padding: spacing.xs,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: looviColors.text.primary,
    },
    resultsContainer: {
        flexGrow: 1,
        flexShrink: 1,
        marginTop: spacing.lg,
        maxHeight: 300, // Max height for scrollable area
    },
    resultsList: {
        gap: spacing.sm,
    },
    noResultsContainer: {
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        marginTop: spacing.xl,
    },
    noResults: {
        fontSize: 15,
        fontWeight: '600',
        color: looviColors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    noResultsHint: {
        fontSize: 13,
        color: looviColors.text.tertiary,
        textAlign: 'center',
        marginBottom: spacing.xs,
        lineHeight: 18,
    },
    noResultsTip: {
        fontSize: 12,
        color: looviColors.text.muted,
        textAlign: 'center',
        fontStyle: 'italic',
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
        marginTop: 2,
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
    hint: {
        fontSize: 12,
        color: looviColors.text.tertiary,
        textAlign: 'center',
        marginTop: spacing.md,
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
});

export default FriendSearchModal;
