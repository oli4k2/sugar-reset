/**
 * SocialScreen
 *
 * Community features with tabs:
 * - Community: Public forum for support and sharing (mock for now)
 * - Inner Circle: Private friends and accountability (REAL DATA)
 * - Leaderboard: Top scores and consistency (REAL DATA)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    TextInput,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Image,
    Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../theme';
import LooviBackground, { looviColors } from '../components/LooviBackground';
import { GlassCard } from '../components/GlassCard';

import { FriendSearchModal } from '../components/FriendSearchModal';
import { FriendRequestCard } from '../components/FriendRequestCard';
import { CommunityStatsWidget } from '../components/CommunityStatsWidget';
import { CreatePostModal } from '../components/CreatePostModal';
import { friendService } from '../services/friendService';
import { postService } from '../services/postService';
import { useAuthContext } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { useUserProfile } from '../context/UserProfileContext';
import { UserAvatar } from '../components/UserAvatar';
import { Friend, FriendRequest, UserStats, User, Post } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Tab = 'community' | 'circle' | 'leaderboard';

interface FriendWithStats extends Friend {
    healthScore?: number;
    streak?: number;
}

interface LeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    score: number;
    streak: number;
    badge: string;
    photoURL?: string;
    avatarType?: 'photo' | 'emoji' | 'initial' | null;
    avatarValue?: string | null;
}

export default function SocialScreen() {
    const navigation = useNavigation<any>();
    const { user, isAuthenticated } = useAuthContext();
    const { streakData, latestHealthScore } = useUserData();
    const { showUserProfile } = useUserProfile();

    const [activeTab, setActiveTab] = useState<Tab>('community');
    const [sortFilter, setSortFilter] = useState<'new' | 'hot' | 'top'>('hot');
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showCreatePostModal, setShowCreatePostModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Real data state
    const [posts, setPosts] = useState<Post[]>([]);
    const [friends, setFriends] = useState<FriendWithStats[]>([]);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [userVotes, setUserVotes] = useState<Map<string, 'up' | 'down'>>(new Map());

    // Load data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (isAuthenticated && user) {
                loadData();
            }
        }, [isAuthenticated, user?.id]) // Use user.id for exact dependency
    );

    // Clear all data when user changes (logout/login to different account)
    useEffect(() => {
        // Reset all state when user ID changes
        setFriends([]);
        setFriendRequests([]);
        setOutgoingRequests([]);
        setLeaderboard([]);
        setPosts([]);
        setUserVotes(new Map());
    }, [user?.id]);

    // Handle openAddFriends navigation param (from InnerCircle SOS)
    const route = useRoute<any>();
    useEffect(() => {
        if (route.params?.openAddFriends) {
            setActiveTab('circle');
            setShowSearchModal(true);
            // Clear the param to prevent re-opening on focus
            navigation.setParams({ openAddFriends: undefined });
        }
    }, [route.params?.openAddFriends]);

    const loadData = async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            await Promise.all([
                loadPosts(),
                loadFriends(),
                loadFriendRequests(),
                loadOutgoingRequests(),
                loadLeaderboard(),
            ]);
        } catch (error) {
            console.error('Error loading social data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadPosts = async () => {
        try {
            const fetchedPosts = await postService.getPosts(sortFilter, 20);
            setPosts(fetchedPosts);

            // Load user votes for all posts
            if (user) {
                const votesMap = new Map<string, 'up' | 'down'>();
                await Promise.all(
                    fetchedPosts.map(async (post) => {
                        const vote = await postService.getUserVote(post.id, user.id);
                        if (vote) {
                            votesMap.set(post.id, vote);
                        }
                    })
                );
                setUserVotes(votesMap);
            }
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    };

    // Reload posts when sort filter changes
    useEffect(() => {
        if (activeTab === 'community') {
            loadPosts();
        }
    }, [sortFilter]);

    const loadFriends = async () => {
        if (!user) return;

        try {
            const friendsList = await friendService.getInnerCircle(user.id);

            // Fetch stats for each friend
            const friendsWithStats = await Promise.all(
                friendsList.map(async (friend) => {
                    const stats = await friendService.getFriendStats(friend.uid);
                    return {
                        ...friend,
                        healthScore: stats?.healthScore || 0,
                        streak: stats?.currentStreak || 0,
                    };
                })
            );

            setFriends(friendsWithStats);
        } catch (error) {
            console.error('Error loading friends:', error);
        }
    };

    const loadFriendRequests = async () => {
        if (!user) return;

        try {
            const requests = await friendService.getIncomingRequests(user.id);
            setFriendRequests(requests);
        } catch (error) {
            console.error('Error loading friend requests:', error);
        }
    };

    const loadOutgoingRequests = async () => {
        if (!user) return;

        try {
            const requests = await friendService.getOutgoingRequests(user.id);
            setOutgoingRequests(requests);
        } catch (error) {
            console.error('Error loading outgoing requests:', error);
        }
    };

    const loadLeaderboard = async () => {
        try {
            const stats = await friendService.getLeaderboard(10);
            const userIds = stats.map(s => s.userId);
            const usersMap = await friendService.getUsersByIds(userIds);

            // Filter out users without a valid displayName (deleted/anonymous accounts)
            const validStats = stats.filter(stat => {
                const userInfo = usersMap.get(stat.userId);
                return userInfo && userInfo.displayName && userInfo.displayName.trim() !== '';
            });

            const entries: LeaderboardEntry[] = validStats.map((stat, index) => {
                const userInfo = usersMap.get(stat.userId);
                const badge = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

                return {
                    rank: index + 1,
                    userId: stat.userId,
                    name: userInfo?.displayName || 'User',
                    score: stat.healthScore,
                    streak: stat.currentStreak,
                    badge,
                    photoURL: userInfo?.photoURL,
                    avatarType: userInfo?.avatarType,
                    avatarValue: userInfo?.avatarValue,
                };
            });

            setLeaderboard(entries);
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadData();
        setIsRefreshing(false);
    };

    const handleAcceptRequest = async (requestId: string) => {
        if (!user) return;

        try {
            await friendService.acceptFriendRequest(requestId, user.id);
            Alert.alert('Success', 'Friend request accepted!');
            await loadData(); // Refresh all data
        } catch (error) {
            console.error('Error accepting request:', error);
            Alert.alert('Error', 'Failed to accept friend request');
        }
    };

    const handleDeclineRequest = async (requestId: string) => {
        if (!user) return;

        try {
            await friendService.declineFriendRequest(requestId, user.id);
            setFriendRequests(prev => prev.filter(r => r.id !== requestId));
        } catch (error) {
            console.error('Error declining request:', error);
            Alert.alert('Error', 'Failed to decline friend request');
        }
    };

    const handleRemoveFriend = async (friendId: string, friendName: string) => {
        if (!user) return;

        Alert.alert(
            'Remove Friend',
            `Are you sure you want to remove ${friendName} from your Inner Circle?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await friendService.removeFriend(user.id, friendId);
                            setFriends(prev => prev.filter(f => f.uid !== friendId));
                        } catch (error) {
                            console.error('Error removing friend:', error);
                            Alert.alert('Error', 'Failed to remove friend');
                        }
                    },
                },
            ]
        );
    };

    const handleProfilePress = () => {
        navigation.navigate('Profile');
    };

    const handleSearchInline = async () => {
        if (!searchQuery.trim() || searchQuery.length < 2) return;
        setShowSearchModal(true);
    };

    const handleCancelRequest = async (requestId: string) => {
        if (!user) return;

        try {
            await friendService.cancelFriendRequest(requestId, user.id);
            setOutgoingRequests(prev => prev.filter(r => r.id !== requestId));
        } catch (error) {
            console.error('Error cancelling request:', error);
            Alert.alert('Error', 'Failed to cancel friend request');
        }
    };

    const handleInviteFriends = async () => {
        if (!user) return;

        const userName = user.displayName || 'Someone';
        const inviteLink = `https://craveless.info/invite/${user.id}`;

        try {
            await Share.share({
                message: `Hey! I'm using Craveless: Sugar reset to track my sugar-free journey and would love for you to join my Inner Circle! 🍃\n\nDownload the app and add me as a friend:\n${inviteLink}`,
                title: `${userName} invited you to Craveless: Sugar reset`,
            });
        } catch (error) {
            console.error('Error sharing invite:', error);
        }
    };

    const handleCongratulate = async (friend: FriendWithStats, message: string) => {
        if (!user) return;

        try {
            const { notificationService } = await import('../services/notificationService');
            const userName = user.displayName || 'A friend';

            await notificationService.sendEncouragement(
                user.id,
                userName,
                friend.uid,
                message
            );

            Alert.alert('Sent! 🎉', `Your encouragement was sent to ${friend.displayName}!`);
        } catch (error) {
            console.error('Error sending congratulation:', error);
            Alert.alert('Oops', 'Could not send encouragement right now.');
        }
    };

    const showCongratulateOptions = (friend: FriendWithStats) => {
        Alert.alert(
            `Cheer on ${friend.displayName}! 🎉`,
            'Send a quick encouragement:',
            [
                { text: '🔥 Way to go!', onPress: () => handleCongratulate(friend, 'Way to go! Keep crushing it! 🔥') },
                { text: '💪 Keep pushing!', onPress: () => handleCongratulate(friend, 'Keep pushing! You\'ve got this! 💪') },
                { text: '🌟 So proud!', onPress: () => handleCongratulate(friend, 'So proud of your progress! 🌟') },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    // Calculate user's rank in leaderboard
    const userRank = leaderboard.findIndex(e => e.userId === user?.id) + 1;
    const userScore = latestHealthScore || 0;
    const userStreak = streakData?.currentStreak || 0;

    const renderCommunityTab = () => {
        const handleUpvote = async (postId: string) => {
            if (!user) return;

            const hasVoted = userVotes.has(postId);

            try {
                // Optimistic update
                setPosts(prev => prev.map(p => {
                    if (p.id === postId) {
                        // Toggle: if already voted, remove vote; otherwise add
                        return { ...p, upvotes: hasVoted ? p.upvotes - 1 : p.upvotes + 1 };
                    }
                    return p;
                }));

                // Optimistic vote state update
                setUserVotes(prev => {
                    const newMap = new Map(prev);
                    if (hasVoted) {
                        newMap.delete(postId);
                    } else {
                        newMap.set(postId, 'up');
                    }
                    return newMap;
                });

                await postService.upvotePost(postId, user.id);
            } catch (error) {
                console.error('Error upvoting:', error);
                // Revert on error
                loadPosts();
            }
        };

        return (
            <View style={styles.tabContent}>
                {/* Community Stats Widget */}
                <CommunityStatsWidget />

                {/* Filter Tabs - Minimal Design */}
                <View style={styles.filterRow}>
                    {(['new', 'hot', 'top'] as const).map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[styles.filterTab, sortFilter === filter && styles.filterTabActive]}
                            onPress={() => setSortFilter(filter)}
                        >
                            <Text style={[styles.filterText, sortFilter === filter && styles.filterTextActive]}>
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Post List */}
                {isLoading && posts.length === 0 ? (
                    <ActivityIndicator size="large" color={looviColors.accent.primary} style={styles.loader} />
                ) : posts.length === 0 ? (
                    <GlassCard variant="light" padding="lg" style={styles.emptyCard}>
                        <Ionicons name="chatbubbles-outline" size={48} color={looviColors.text.muted} />
                        <Text style={styles.emptyTitle}>No posts yet</Text>
                        <Text style={styles.emptyText}>
                            Be the first to share your journey with the community!
                        </Text>
                    </GlassCard>
                ) : (
                    posts.map((post: Post) => (
                        <TouchableOpacity
                            key={post.id}
                            activeOpacity={0.9}
                            onPress={() => navigation.navigate('PostDetail', {
                                post: {
                                    ...post,
                                    createdAt: post.createdAt.toISOString(),
                                    updatedAt: post.updatedAt.toISOString(),
                                }
                            })}
                        >
                            <GlassCard variant="light" padding="lg" style={styles.postCard}>
                                {/* Post Header */}
                                <View style={styles.postHeader}>
                                    <TouchableOpacity
                                        style={styles.authorInfo}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            showUserProfile({
                                                userId: post.authorId,
                                                displayName: post.authorName,
                                                photoURL: post.photoURL,
                                                avatarType: post.avatarType,
                                                avatarValue: post.avatarValue,
                                            });
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.postAvatarContainer}>
                                            <UserAvatar
                                                size={32}
                                                photoURL={post.photoURL}
                                                avatarType={post.avatarType}
                                                avatarValue={post.avatarValue}
                                                name={post.authorName}
                                            />
                                        </View>
                                        <View>
                                            <Text style={styles.authorName}>{post.authorName || 'Unknown'}</Text>
                                        </View>
                                    </TouchableOpacity>
                                    {postService.getTimeAgo(post.createdAt) ? (
                                        <Text style={styles.postTime}>{postService.getTimeAgo(post.createdAt)}</Text>
                                    ) : null}
                                </View>

                                {/* Post Content */}
                                <Text style={styles.postTitle}>{post.title}</Text>
                                <Text style={styles.postContent} numberOfLines={4}>{post.content}</Text>

                                {/* Simple Footer: Tags & Upvote */}
                                <View style={styles.postFooter}>
                                    <View style={styles.tagsRow}>
                                        {post.tags.slice(0, 3).map((tag: string, idx: number) => (
                                            <Text key={idx} style={styles.tagText}>#{tag}</Text>
                                        ))}
                                    </View>

                                    <View style={styles.postActions}>
                                        <View style={styles.commentIndicator}>
                                            <Ionicons name="chatbubble-outline" size={14} color={looviColors.text.secondary} />
                                            <Text style={styles.commentCountText}>{post.commentCount || 0}</Text>
                                        </View>

                                        <TouchableOpacity
                                            style={[
                                                styles.minimalUpvoteButton,
                                                userVotes.has(post.id) && styles.minimalUpvoteButtonActive
                                            ]}
                                            onPress={() => handleUpvote(post.id)}
                                        >
                                            <Ionicons
                                                name={userVotes.has(post.id) ? "arrow-up-circle" : "arrow-up"}
                                                size={16}
                                                color={userVotes.has(post.id) ? looviColors.accent.primary : looviColors.text.secondary}
                                            />
                                            <Text style={[
                                                styles.minimalUpvoteText,
                                                userVotes.has(post.id) && styles.minimalUpvoteTextActive
                                            ]}>{post.upvotes}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </GlassCard>
                        </TouchableOpacity>
                    ))
                )
                }


            </View >
        );
    };

    const renderInnerCircleTab = () => (
        <View style={styles.tabContent}>
            {/* Incoming Friend Requests Section */}
            {friendRequests.length > 0 && (
                <View style={styles.requestsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Requests</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{friendRequests.length}</Text>
                        </View>
                    </View>
                    {friendRequests.map((request) => (
                        <FriendRequestCard
                            key={request.id}
                            request={request}
                            onAccept={handleAcceptRequest}
                            onDecline={handleDeclineRequest}
                        />
                    ))}
                </View>
            )}

            {/* Outgoing (Pending) Friend Requests Section */}
            {outgoingRequests.length > 0 && (
                <View style={styles.requestsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Pending</Text>
                        <View style={[styles.badge, { backgroundColor: looviColors.accent.secondary }]}>
                            <Text style={styles.badgeText}>{outgoingRequests.length}</Text>
                        </View>
                    </View>
                    {outgoingRequests.map((request) => (
                        <GlassCard key={request.id} variant="light" padding="md" style={styles.pendingCard}>
                            <View style={styles.friendRow}>
                                <View style={[styles.friendAvatar, { backgroundColor: looviColors.accent.warning }]}>
                                    <Ionicons name="hourglass-outline" size={18} color="#FFFFFF" />
                                </View>
                                <View style={styles.friendInfo}>
                                    <Text style={styles.friendName}>
                                        {request.toName || 'User'}
                                    </Text>
                                    <Text style={styles.friendUsername}>
                                        {request.toEmail || 'Awaiting response...'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => handleCancelRequest(request.id)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </GlassCard>
                    ))}
                </View>
            )}

            {/* Friends List */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Circle</Text>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color={looviColors.accent.primary} style={styles.loader} />
            ) : friends.length === 0 ? (
                <GlassCard variant="light" padding="lg" style={styles.emptyCard}>
                    <Ionicons name="people-outline" size={48} color={looviColors.text.muted} />
                    <Text style={styles.emptyTitle}>No friends yet</Text>
                    <Text style={styles.emptyText}>
                        Find accountability partners to support each other on your sugar-free journey!
                    </Text>
                </GlassCard>
            ) : (
                friends.map((friend) => (
                    <GlassCard key={friend.uid} variant="light" padding="md" style={styles.friendCard}>
                        <View style={styles.friendRow}>
                            <TouchableOpacity
                                onPress={() => showUserProfile({
                                    userId: friend.uid,
                                    displayName: friend.displayName,
                                    photoURL: friend.photoURL,
                                    avatarType: friend.avatarType,
                                    avatarValue: friend.avatarValue,
                                })}
                                activeOpacity={0.7}
                            >
                                <UserAvatar
                                    size={48}
                                    photoURL={friend.photoURL}
                                    avatarType={friend.avatarType}
                                    avatarValue={friend.avatarValue}
                                    name={friend.displayName}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.friendInfo}
                                onPress={() => showUserProfile({
                                    userId: friend.uid,
                                    displayName: friend.displayName,
                                    photoURL: friend.photoURL,
                                    avatarType: friend.avatarType,
                                    avatarValue: friend.avatarValue,
                                })}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.friendName}>
                                    {friend.displayName || 'Unknown'}
                                </Text>
                                <View style={styles.friendProgressRow}>
                                    <View style={styles.friendMiniStat}>
                                        <Ionicons name="flame" size={12} color={looviColors.accent.warning} />
                                        <Text style={styles.friendMiniStatText}>{friend.streak || 0} days</Text>
                                    </View>
                                    {friend.healthScore !== undefined && friend.healthScore !== null && (
                                        <View style={styles.friendMiniStat}>
                                            <Ionicons name="heart" size={12} color={looviColors.accent.primary} />
                                            <Text style={styles.friendMiniStatText}>{friend.healthScore}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.celebrateButton}
                                onPress={() => showCongratulateOptions(friend)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.celebrateEmoji}>🎉</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.removeFriendHint}
                            onPress={() => handleRemoveFriend(friend.uid, friend.displayName)}
                        >
                            <Text style={styles.removeFriendText}>Hold to remove</Text>
                        </TouchableOpacity>
                    </GlassCard>
                ))
            )}

            {/* Add Friends CTA - moved above Grow Your Circle */}
            <TouchableOpacity
                style={styles.outlineButton}
                activeOpacity={0.8}
                onPress={() => setShowSearchModal(true)}
            >
                <Ionicons name="person-add-outline" size={20} color={looviColors.accent.primary} />
                <Text style={styles.outlineButtonText}>Find Partners</Text>
            </TouchableOpacity>

            {/* Invite CTA Card */}
            <GlassCard variant="light" padding="lg" style={styles.inviteCtaCard}>
                <View style={styles.inviteCtaContent}>
                    <View style={styles.inviteCtaIconBg}>
                        <Ionicons name="gift-outline" size={28} color={looviColors.accent.primary} />
                    </View>
                    <View style={styles.inviteCtaTextContainer}>
                        <Text style={styles.inviteCtaTitle}>Grow Your Circle</Text>
                        <Text style={styles.inviteCtaSubtitle}>
                            Invite friends & stay accountable together
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.inviteCtaButton}
                    onPress={handleInviteFriends}
                    activeOpacity={0.8}
                >
                    <Ionicons name="share-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.inviteCtaButtonText}>Share Invite Link</Text>
                </TouchableOpacity>
            </GlassCard>
        </View>
    );

    const renderLeaderboardTab = () => (
        <View style={styles.tabContent}>
            {/* Leaderboard Type Selector */}
            <View style={styles.leaderboardHeader}>
                <Text style={styles.leaderboardTitle}>Top Users This Week</Text>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color={looviColors.accent.primary} style={styles.loader} />
            ) : leaderboard.length === 0 ? (
                <GlassCard variant="light" padding="lg" style={styles.emptyCard}>
                    <Ionicons name="trophy-outline" size={48} color={looviColors.text.muted} />
                    <Text style={styles.emptyTitle}>No leaderboard data</Text>
                    <Text style={styles.emptyText}>
                        Start tracking your wellness to appear on the leaderboard!
                    </Text>
                </GlassCard>
            ) : (
                <>
                    {/* Leaderboard List */}
                    {leaderboard.map((entry) => (
                        <TouchableOpacity
                            key={entry.userId}
                            activeOpacity={0.8}
                            onPress={() => showUserProfile({
                                userId: entry.userId,
                                displayName: entry.name,
                                photoURL: entry.photoURL,
                                avatarType: entry.avatarType,
                                avatarValue: entry.avatarValue,
                            })}
                        >
                            <GlassCard variant="light" padding="md" style={styles.leaderboardCard}>
                                <View style={styles.leaderboardRow}>
                                    <View style={styles.rankBadge}>
                                        {entry.rank <= 3 ? (
                                            <Text style={styles.rankEmoji}>
                                                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                                            </Text>
                                        ) : (
                                            <Text style={styles.rankNumber}>{entry.rank}</Text>
                                        )}
                                    </View>
                                    <View style={styles.leaderboardInfo}>
                                        <View style={styles.leaderboardUserRow}>
                                            <UserAvatar
                                                size={32}
                                                photoURL={entry.photoURL}
                                                avatarType={entry.avatarType}
                                                avatarValue={entry.avatarValue}
                                                name={entry.name}
                                            />
                                            <View style={{ marginLeft: spacing.sm }}>
                                                <Text style={styles.leaderboardName}>{entry.name}</Text>
                                                <Text style={styles.leaderboardScore}>{entry.score} pts</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.streakBadge}>
                                        <Ionicons name="flame" size={14} color="#FFFFFF" />
                                        <Text style={styles.streakBadgeText}>{entry.streak}</Text>
                                    </View>
                                </View>
                            </GlassCard>
                        </TouchableOpacity>
                    ))}
                </>
            )
            }

            {/* Your Rank */}
            {
                userRank > 0 && (
                    <View style={styles.yourRankContainer}>
                        <Text style={styles.yourRankLabel}>Your Rank</Text>
                        <GlassCard variant="light" padding="md" style={[styles.leaderboardCard, styles.yourRankCard]}>
                            <View style={styles.leaderboardRow}>
                                <View style={styles.rankBadge}>
                                    <Text style={styles.rankNumber}>{userRank}</Text>
                                </View>
                                <View style={styles.leaderboardInfo}>
                                    <View style={styles.leaderboardUserRow}>
                                        <UserAvatar
                                            size={32}
                                            photoURL={user?.photoURL}
                                            avatarType={user?.avatarType}
                                            avatarValue={user?.avatarValue}
                                            name={'You'}
                                        />
                                        <View style={{ marginLeft: spacing.sm }}>
                                            <Text style={styles.leaderboardName}>You</Text>
                                            <Text style={styles.leaderboardScore}>{userScore} pts</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.streakBadge}>
                                    <Ionicons name="flame" size={14} color="#FFFFFF" />
                                    <Text style={styles.streakBadgeText}>{userStreak}</Text>
                                </View>
                            </View>
                        </GlassCard>
                    </View>
                )
            }
        </View >
    );

    return (
        <LooviBackground variant="blueTop">
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.title}>Community</Text>
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={handleProfilePress}
                    >
                        <UserAvatar
                            size={36}
                            photoURL={user?.photoURL}
                            avatarType={user?.avatarType}
                            avatarValue={user?.avatarValue}
                            name={user?.displayName || 'User'}
                        />
                    </TouchableOpacity>
                </View>

                {/* Main Tab Selector */}
                <View style={styles.tabSelector}>
                    <TouchableOpacity
                        style={[styles.mainTab, activeTab === 'community' && styles.mainTabActive]}
                        onPress={() => setActiveTab('community')}
                    >
                        <Text style={[styles.mainTabText, activeTab === 'community' && styles.mainTabTextActive]}>
                            Feed
                        </Text>
                        {activeTab === 'community' && <View style={styles.activeIndicator} />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.mainTab, activeTab === 'circle' && styles.mainTabActive]}
                        onPress={() => setActiveTab('circle')}
                    >
                        <View style={styles.tabLabelContainer}>
                            <Text style={[styles.mainTabText, activeTab === 'circle' && styles.mainTabTextActive]}>
                                Inner Circle
                            </Text>
                            {friendRequests.length > 0 && (
                                <View style={styles.tabBadge}>
                                    <Text style={styles.tabBadgeText}>{friendRequests.length}</Text>
                                </View>
                            )}
                        </View>
                        {activeTab === 'circle' && <View style={styles.activeIndicator} />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.mainTab, activeTab === 'leaderboard' && styles.mainTabActive]}
                        onPress={() => setActiveTab('leaderboard')}
                    >
                        <Text style={[styles.mainTabText, activeTab === 'leaderboard' && styles.mainTabTextActive]}>
                            Leaderboard
                        </Text>
                        {activeTab === 'leaderboard' && <View style={styles.activeIndicator} />}
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {activeTab === 'community' && renderCommunityTab()}
                    {activeTab === 'circle' && renderInnerCircleTab()}
                    {activeTab === 'leaderboard' && renderLeaderboardTab()}
                </ScrollView>

                {/* Floating Action Button - Fixed position */}
                {activeTab === 'community' && (
                    <TouchableOpacity
                        style={styles.floatingFab}
                        activeOpacity={0.9}
                        onPress={() => setShowCreatePostModal(true)}
                    >
                        <Ionicons name="add" size={30} color="#FFFFFF" />
                    </TouchableOpacity>
                )}

                <FriendSearchModal
                    visible={showSearchModal}
                    onClose={() => setShowSearchModal(false)}
                />

                <CreatePostModal
                    visible={showCreatePostModal}
                    onClose={() => setShowCreatePostModal(false)}
                    onPostCreated={loadPosts}
                />
            </SafeAreaView>
        </LooviBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.screen.horizontal,
        paddingVertical: spacing.md,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: looviColors.text.primary,
        letterSpacing: -1,
    },
    profileButton: {
        padding: 4,
    },
    profileAvatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    profileInitial: {
        fontSize: 14,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    /* Main Tab Selector */
    tabSelector: {
        flexDirection: 'row',
        paddingHorizontal: spacing.screen.horizontal,
        marginBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    mainTab: {
        marginRight: spacing.xl,
        paddingVertical: spacing.sm,
        position: 'relative',
    },
    mainTabActive: {
        // Active state styling if needed
    },
    mainTabText: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.tertiary,
    },
    mainTabTextActive: {
        color: looviColors.text.primary,
        fontWeight: '700',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: -1, // Overlap border
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: looviColors.accent.primary,
        borderRadius: 1.5,
    },
    tabLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tabBadge: {
        backgroundColor: looviColors.accent.primary,
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 10,
        minWidth: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    /* Content */
    content: {
        flex: 1,
        overflow: 'hidden', // Creates carousel-like clipping effect
    },
    scrollContent: {
        padding: spacing.screen.horizontal,
        paddingBottom: 140, // Space for FAB (increased from 100)
    },
    tabContent: {
        gap: spacing.md,
    },
    loader: {
        marginTop: spacing.xl,
    },
    emptyCard: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    emptyText: {
        fontSize: 14,
        color: looviColors.text.tertiary,
        textAlign: 'center',
        maxWidth: 260,
        lineHeight: 20,
    },
    /* Filter Tabs */
    filterRow: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
        gap: spacing.lg,
        paddingHorizontal: spacing.xs,
    },
    filterTab: {
        paddingVertical: spacing.xs,
    },
    filterTabActive: {
        borderBottomWidth: 2,
        borderBottomColor: looviColors.text.primary,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.tertiary,
    },
    filterTextActive: {
        color: looviColors.text.primary,
    },
    /* Post Card */
    postCard: {
        marginBottom: spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postAvatarContainer: {
        marginRight: spacing.sm,
    },
    authorName: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    postDot: {
        marginHorizontal: 6,
        color: looviColors.text.muted,
        fontSize: 10,
    },
    postTime: {
        fontSize: 12,
        color: looviColors.text.muted,
    },
    postTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: 6,
        lineHeight: 22,
    },
    postContent: {
        fontSize: 14,
        color: looviColors.text.secondary,
        lineHeight: 20,
        marginBottom: spacing.md,
    },
    postFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    tagsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '500',
        color: looviColors.accent.primary,
    },
    minimalUpvoteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    minimalUpvoteText: {
        fontSize: 12,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    minimalUpvoteButtonActive: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },
    minimalUpvoteTextActive: {
        color: looviColors.accent.primary,
    },
    postActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    commentIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    commentCountText: {
        fontSize: 12,
        fontWeight: '500',
        color: looviColors.text.secondary,
    },
    /* Floating Action Button */
    floatingFab: {
        position: 'absolute',
        bottom: 110,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: looviColors.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        // Make sure it's above everything
        zIndex: 9999,
    },
    /* Inner Circle Styles */
    requestsSection: {
        marginBottom: spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.md,
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.xs,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    badge: {
        backgroundColor: looviColors.accent.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    friendCard: {
        marginBottom: spacing.sm,
    },
    friendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    friendAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    friendInitial: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    friendInfo: {
        flex: 1,
    },
    friendName: {
        fontSize: 15,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    friendUsername: {
        fontSize: 12,
        color: looviColors.text.tertiary,
    },
    friendStats: {
        alignItems: 'flex-end',
    },
    miniStat: {
        alignItems: 'flex-end',
    },
    miniStatValue: {
        fontSize: 16,
        fontWeight: '700',
        color: looviColors.accent.warning,
    },
    miniStatLabel: {
        fontSize: 10,
        color: looviColors.text.tertiary,
    },
    outlineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: looviColors.accent.primary,
        borderStyle: 'dashed',
        marginTop: spacing.md,
        gap: spacing.sm,
    },
    outlineButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.accent.primary,
    },
    pendingCard: {
        marginBottom: spacing.sm,
    },
    cancelButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    cancelButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: looviColors.text.tertiary,
    },
    /* Leaderboard Styles */
    leaderboardHeader: {
        marginBottom: spacing.md,
    },
    leaderboardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    leaderboardCard: {
        marginBottom: spacing.sm,
    },
    leaderboardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rankBadge: {
        width: 30,
        alignItems: 'center',
        marginRight: spacing.md,
    },
    rankEmoji: {
        fontSize: 22,
    },
    rankNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: looviColors.text.tertiary,
    },
    leaderboardInfo: {
        flex: 1,
    },
    leaderboardName: {
        fontSize: 15,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    leaderboardScore: {
        fontSize: 12,
        color: looviColors.text.tertiary,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: looviColors.accent.warning,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    streakBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    yourRankContainer: {
        marginTop: spacing.xl,
        paddingTop: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
    },
    yourRankLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: looviColors.text.tertiary,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
    },
    yourRankCard: {
        // specific styles for your rank card if needed
    },
    profileAvatarImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    leaderboardUserRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inviteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: looviColors.accent.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    inviteButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    // Friend card enhancements
    friendProgressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
    },
    friendMiniStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    friendMiniStatText: {
        fontSize: 12,
        color: looviColors.text.secondary,
        fontWeight: '500',
    },
    celebrateButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    celebrateEmoji: {
        fontSize: 20,
    },
    removeFriendHint: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
        alignItems: 'center',
    },
    removeFriendText: {
        fontSize: 11,
        color: looviColors.text.tertiary,
    },
    // Invite CTA card
    inviteCtaCard: {
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    inviteCtaContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    inviteCtaIconBg: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    inviteCtaTextContainer: {
        flex: 1,
    },
    inviteCtaTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: 2,
    },
    inviteCtaSubtitle: {
        fontSize: 13,
        color: looviColors.text.secondary,
    },
    inviteCtaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    inviteCtaButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
