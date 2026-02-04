/**
 * PostDetailScreen
 * 
 * Displays a single post and its comments.
 * Allows users to add new comments.
 * Uses Glassmorphism design.
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    FlatList,
    Alert,
    Keyboard,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { spacing, borderRadius } from '../theme';
import LooviBackground, { looviColors } from '../components/LooviBackground';
import { GlassCard } from '../components/GlassCard';
import { useAuthContext } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { useUserProfile } from '../context/UserProfileContext';
import postService, { Comment } from '../services/postService';
import { Post } from '../types';
import { UserAvatar } from '../components/UserAvatar';
import { adminService } from '../services/adminService';

type PostDTO = Omit<Post, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
};

type RootStackParamList = {
    PostDetail: { post: Post | PostDTO };
};

type Props = NativeStackScreenProps<RootStackParamList, 'PostDetail'>;

export default function PostDetailScreen({ route, navigation }: Props) {
    const { post: paramsPost } = route.params;
    const { user } = useAuthContext();
    const { onboardingData } = useUserData();
    const { showUserProfile } = useUserProfile();

    // Helper to hydrate post from params (handles string dates from serialization)
    const initialPost: Post = {
        ...paramsPost,
        createdAt: typeof paramsPost.createdAt === 'string' ? new Date(paramsPost.createdAt) : paramsPost.createdAt,
        updatedAt: typeof paramsPost.updatedAt === 'string' ? new Date(paramsPost.updatedAt) : paramsPost.updatedAt,
    };

    const [post, setPost] = useState<Post>(initialPost);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Check admin status and fetch data on mount
    useEffect(() => {
        loadData();
        checkAdminStatus();
    }, []);

    const checkAdminStatus = async () => {
        if (user?.id) {
            const adminStatus = await adminService.isAdmin(user.id);
            setIsAdmin(adminStatus);
        }
    };

    const loadData = async () => {
        try {
            // Fetch latest post data (for upvote count etc)
            const freshPost = await postService.getPost(post.id);
            if (freshPost) {
                setPost(freshPost);
            }
            // Fetch comments
            const fetchedComments = await postService.getComments(post.id);
            setComments(fetchedComments);
        } catch (error) {
            console.error('Error loading post details:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleUpvote = async () => {
        if (!user) return;
        try {
            // Optimistic update
            setPost(prev => ({ ...prev, upvotes: prev.upvotes + 1 }));
            await postService.upvotePost(post.id, user.id);
        } catch (error) {
            console.error('Error upvoting:', error);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !user) return;

        Keyboard.dismiss();
        setSubmitting(true);
        try {
            // Use onboarding nickname first, then user displayName, then email, fallback            
            const authorName = onboardingData?.nickname || user.displayName || user.email || 'Anonymous';

            await postService.addComment(
                post.id,
                user.id,
                authorName,
                newComment,
                {
                    photoURL: user.photoURL,
                    avatarType: user.avatarType,
                    avatarValue: user.avatarValue
                }
            );
            setNewComment('');
            // Refresh comments
            await loadData();
        } catch (error: any) {
            console.error('Error submitting comment:', error);
            // Show the error message (includes profanity filter message)
            const message = error?.message || 'Failed to post comment. Please try again.';
            Alert.alert('Error', message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePost = async () => {
        const canDelete = user && (user.id === post.authorId || isAdmin);
        if (!canDelete) return;

        Alert.alert(
            'Delete Post',
            isAdmin && user?.id !== post.authorId
                ? 'Admin: Are you sure you want to delete this post? This cannot be undone.'
                : 'Are you sure you want to delete this post? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (isAdmin && user?.id !== post.authorId) {
                                await adminService.deletePostAsAdmin(post.id);
                            } else if (user) {
                                await postService.deletePost(post.id, user.id);
                            }
                            navigation.goBack();
                        } catch (error) {
                            console.error('Error deleting post:', error);
                            Alert.alert('Error', 'Failed to delete post.');
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteComment = async (comment: Comment) => {
        const canDelete = user && (user.id === comment.authorId || isAdmin);
        if (!canDelete) return;

        Alert.alert(
            'Delete Comment',
            isAdmin && user?.id !== comment.authorId
                ? 'Admin: Are you sure you want to delete this comment?'
                : 'Are you sure you want to delete this comment?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (isAdmin && user?.id !== comment.authorId) {
                                await adminService.deleteCommentAsAdmin(post.id, comment.id);
                            } else if (user) {
                                await postService.deleteComment(post.id, comment.id, user.id);
                            }
                            // Refresh comments
                            await loadData();
                        } catch (error) {
                            console.error('Error deleting comment:', error);
                            Alert.alert('Error', 'Failed to delete comment.');
                        }
                    },
                },
            ]
        );
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={looviColors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Post</Text>
            {(user?.id === post.authorId || isAdmin) ? (
                <TouchableOpacity onPress={handleDeletePost} style={styles.backButton}>
                    <Ionicons name="trash-outline" size={22} color={looviColors.accent.warning} />
                </TouchableOpacity>
            ) : (
                <View style={{ width: 24 }} />
            )}
        </View>
    );

    const renderPost = () => (
        <GlassCard padding="lg" style={styles.postCard}>
            {/* Author */}
            <TouchableOpacity
                style={styles.postHeader}
                onPress={() => showUserProfile({
                    userId: post.authorId,
                    displayName: post.authorName,
                    photoURL: post.photoURL,
                    avatarType: post.avatarType,
                    avatarValue: post.avatarValue,
                })}
                activeOpacity={0.7}
            >
                <View style={styles.avatarPlaceholder}>
                    <UserAvatar
                        size={40}
                        photoURL={post.photoURL}
                        avatarType={post.avatarType}
                        avatarValue={post.avatarValue}
                        name={post.authorName}
                    />
                </View>
                <View style={styles.authorInfo}>
                    <Text style={styles.authorName}>{post.authorName}</Text>
                    <Text style={styles.timeInfo}>
                        {postService.getTimeAgo(post.createdAt)}
                    </Text>
                </View>
            </TouchableOpacity>

            {/* Content */}
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postContent}>{post.content}</Text>

            {/* Footer */}
            <View style={styles.postFooter}>
                <View style={styles.tagsRow}>
                    {post.tags.map((tag, idx) => (
                        <View key={idx} style={styles.tagBadge}>
                            <Text style={styles.tagText}>#{tag}</Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={styles.upvoteButton} onPress={handleUpvote}>
                    <Ionicons name="arrow-up" size={18} color={looviColors.text.secondary} />
                    <Text style={styles.upvoteText}>{post.upvotes}</Text>
                </TouchableOpacity>
            </View>
        </GlassCard>
    );

    const renderComment = ({ item }: { item: Comment }) => (
        <GlassCard variant="light" padding="md" style={styles.commentCard}>
            <View style={styles.commentHeader}>
                <TouchableOpacity
                    style={styles.commentAuthorRow}
                    onPress={() => showUserProfile({
                        userId: item.authorId,
                        displayName: item.authorName,
                        photoURL: item.photoURL,
                        avatarType: item.avatarType,
                        avatarValue: item.avatarValue,
                    })}
                    activeOpacity={0.7}
                >
                    <View style={styles.commentAvatarContainer}>
                        <UserAvatar
                            size={32}
                            photoURL={item.photoURL}
                            avatarType={item.avatarType}
                            avatarValue={item.avatarValue}
                            name={item.authorName}
                        />
                    </View>
                    <View style={styles.commentHeaderInfo}>
                        <Text style={styles.commentAuthor}>{item.authorName}</Text>
                        <Text style={styles.commentTime}>{postService.getTimeAgo(item.createdAt)}</Text>
                    </View>
                </TouchableOpacity>
                {(user?.id === item.authorId || isAdmin) && (
                    <TouchableOpacity
                        onPress={() => handleDeleteComment(item)}
                        style={styles.deleteCommentButton}
                    >
                        <Ionicons name="trash-outline" size={16} color={looviColors.text.tertiary} />
                    </TouchableOpacity>
                )}
            </View>
            <Text style={styles.commentContent}>{item.content}</Text>
        </GlassCard>
    );

    return (
        <LooviBackground variant="blueTop">
            <SafeAreaView style={styles.container}>
                {renderHeader()}

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
                >
                    <FlatList
                        data={comments}
                        renderItem={renderComment}
                        keyExtractor={item => item.id}
                        ListHeaderComponent={() => (
                            <View style={styles.listHeader}>
                                {renderPost()}
                                <Text style={styles.commentsLabel}>Comments ({comments.length})</Text>
                            </View>
                        )}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={() => (
                            !loadingComments ? (
                                <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
                            ) : (
                                <ActivityIndicator style={{ marginTop: 20 }} color={looviColors.accent.primary} />
                            )
                        )}
                    />

                    {/* Input Area - Solid background for readability */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Add a comment..."
                            placeholderTextColor={looviColors.text.tertiary}
                            value={newComment}
                            onChangeText={setNewComment}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, (!newComment.trim() || submitting) && styles.sendButtonDisabled]}
                            onPress={handleAddComment}
                            disabled={!newComment.trim() || submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Ionicons name="send" size={20} color="#FFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.screen.horizontal,
        paddingBottom: spacing.md,
    },
    backButton: {
        padding: spacing.xs,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    listContent: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingBottom: 100, // Space for input
    },
    listHeader: {
        marginBottom: spacing.md,
    },
    postCard: {
        marginBottom: spacing.xl,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatarPlaceholder: {
        marginRight: spacing.sm,
    },
    authorInfo: {
        flex: 1,
    },
    authorName: {
        fontSize: 15,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    timeInfo: {
        fontSize: 12,
        color: looviColors.text.tertiary,
    },
    postTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.sm,
    },
    postContent: {
        fontSize: 15,
        lineHeight: 22,
        color: looviColors.text.secondary,
        marginBottom: spacing.lg,
    },
    postFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tagBadge: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 6,
    },
    tagText: {
        fontSize: 12,
        color: looviColors.text.secondary,
        fontWeight: '500',
    },
    upvoteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.4)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    upvoteText: {
        marginLeft: 4,
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.secondary,
    },
    commentsLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.primary,
        marginBottom: spacing.md,
        marginLeft: spacing.xs,
    },
    commentCard: {
        marginBottom: spacing.md,
    },
    commentHeader: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
        alignItems: 'center', // Changed to center alignment
    },
    commentAvatarContainer: {
        marginRight: spacing.sm,
    },
    commentAuthorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    commentHeaderInfo: {
        flex: 1,
    },
    commentAuthor: {
        fontSize: 13,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    commentTime: {
        fontSize: 11,
        color: looviColors.text.tertiary,
    },
    commentContent: {
        fontSize: 14,
        color: looviColors.text.secondary,
        lineHeight: 20,
    },
    emptyText: {
        textAlign: 'center',
        color: looviColors.text.tertiary,
        marginTop: spacing.xl,
    },
    deleteCommentButton: {
        padding: spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: spacing.screen.horizontal,
        marginBottom: spacing.md,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    input: {
        flex: 1,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        fontSize: 15,
        color: looviColors.text.primary,
        maxHeight: 100,
        minHeight: 40,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: looviColors.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.sm,
    },
    sendButtonDisabled: {
        backgroundColor: looviColors.text.muted,
        opacity: 0.5,
    },
});
