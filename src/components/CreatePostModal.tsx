/**
 * CreatePostModal
 * 
 * Modal for creating new community posts.
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import { postService } from '../services/postService';
import { useAuthContext } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { handleError, handleValidationError, handleRateLimitError } from '../utils/errorHandler';

interface CreatePostModalProps {
    visible: boolean;
    onClose: () => void;
    onPostCreated?: () => void;
}

const SUGGESTED_TAGS = ['milestone', 'tips', 'support', 'question', 'motivation', 'relapse', 'victory'];

export function CreatePostModal({ visible, onClose, onPostCreated }: CreatePostModalProps) {
    const { user } = useAuthContext();
    const { onboardingData } = useUserData();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isPosting, setIsPosting] = useState(false);

    const handleClose = () => {
        setTitle('');
        setContent('');
        setSelectedTags([]);
        onClose();
    };

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(prev => prev.filter(t => t !== tag));
        } else if (selectedTags.length < 3) {
            setSelectedTags(prev => [...prev, tag]);
        }
    };

    const handlePost = async () => {
        if (!user) {
            Alert.alert('Error', 'You must be logged in to post');
            return;
        }

        if (!title.trim()) {
            Alert.alert('Missing Title', 'Please add a title to your post');
            return;
        }

        if (!content.trim()) {
            Alert.alert('Missing Content', 'Please add some content to your post');
            return;
        }

        setIsPosting(true);
        try {
            const authorName = onboardingData.nickname || user.displayName || 'Anonymous';
            await postService.createPost(
                user.id,
                authorName,
                undefined, // username no longer used
                title.trim(),
                content.trim(),
                selectedTags,
                {
                    photoURL: user.photoURL,
                    avatarType: user.avatarType,
                    avatarValue: user.avatarValue
                }
            );

            Alert.alert('Posted!', 'Your post has been shared with the community', [
                { text: 'OK', onPress: handleClose }
            ]);
            onPostCreated?.();
        } catch (error: any) {
            // Check for specific error types to show appropriate messages
            if (error?.message?.includes('too quickly') || error?.message?.includes('rate limit')) {
                handleRateLimitError(error);
            } else if (error?.message?.includes('invalid') || error?.message?.includes('Invalid')) {
                handleValidationError(error);
            } else {
                // Show user-friendly error message (profanity filter, validation, etc.)
                const message = error?.message || 'Failed to create post. Please try again.';
                handleError(error, message, 'CreatePost');
            }
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={looviColors.text.primary} />
                        </TouchableOpacity>
                        <Text style={styles.title}>Share Your Journey</Text>
                        <TouchableOpacity
                            style={[styles.postButton, (!title.trim() || !content.trim()) && styles.postButtonDisabled]}
                            onPress={handlePost}
                            disabled={isPosting || !title.trim() || !content.trim()}
                        >
                            {isPosting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.postButtonText}>Post</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Title Input */}
                        <TextInput
                            style={styles.titleInput}
                            placeholder="Title"
                            placeholderTextColor={looviColors.text.muted}
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                        />

                        {/* Content Input */}
                        <TextInput
                            style={styles.contentInput}
                            placeholder="Share your thoughts, ask for advice, or celebrate a win..."
                            placeholderTextColor={looviColors.text.muted}
                            value={content}
                            onChangeText={setContent}
                            multiline
                            maxLength={1000}
                            textAlignVertical="top"
                        />

                        {/* Tags */}
                        <Text style={styles.tagsLabel}>Add tags (up to 3)</Text>
                        <View style={styles.tagsContainer}>
                            {SUGGESTED_TAGS.map((tag) => (
                                <TouchableOpacity
                                    key={tag}
                                    style={[
                                        styles.tag,
                                        selectedTags.includes(tag) && styles.tagSelected
                                    ]}
                                    onPress={() => toggleTag(tag)}
                                >
                                    <Text style={[
                                        styles.tagText,
                                        selectedTags.includes(tag) && styles.tagTextSelected
                                    ]}>
                                        #{tag}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Guidelines */}
                        <View style={styles.guidelines}>
                            <Ionicons name="information-circle-outline" size={16} color={looviColors.text.muted} />
                            <Text style={styles.guidelinesText}>
                                Be supportive and respectful. We're all in this together!
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: borderRadius['2xl'],
        borderTopRightRadius: borderRadius['2xl'],
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    closeButton: {
        padding: spacing.xs,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    postButton: {
        backgroundColor: looviColors.accent.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
    },
    postButtonDisabled: {
        opacity: 0.5,
    },
    postButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    content: {
        padding: spacing.lg,
    },
    titleInput: {
        fontSize: 18,
        fontWeight: '600',
        color: looviColors.text.primary,
        marginBottom: spacing.md,
        paddingVertical: spacing.sm,
    },
    contentInput: {
        fontSize: 15,
        color: looviColors.text.primary,
        lineHeight: 22,
        minHeight: 150,
        marginBottom: spacing.lg,
    },
    tagsLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.secondary,
        marginBottom: spacing.sm,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    tag: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.lg,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    tagSelected: {
        backgroundColor: looviColors.accent.primary,
    },
    tagText: {
        fontSize: 13,
        fontWeight: '500',
        color: looviColors.text.tertiary,
    },
    tagTextSelected: {
        color: '#FFFFFF',
    },
    guidelines: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        padding: spacing.md,
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        borderRadius: borderRadius.lg,
        marginBottom: spacing.xl,
    },
    guidelinesText: {
        flex: 1,
        fontSize: 12,
        color: looviColors.text.muted,
    },
});

export default CreatePostModal;
