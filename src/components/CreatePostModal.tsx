/**
 * CreatePostModal
 *
 * Modal for creating new community posts.
 * Gesture-driven bottom sheet: drag handle to dismiss.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated,
    PanResponder,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import { postService } from '../services/postService';
import { useAuthContext } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.88;
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.3;

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

    // ── Bottom-sheet gesture ──────────────────────────────────────────────────
    const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
    const currentSnap = useRef(0);
    const handleCloseRef = useRef(onClose);
    useEffect(() => { handleCloseRef.current = onClose; });

    const dismiss = useCallback(() => {
        Animated.timing(translateY, {
            toValue: SHEET_HEIGHT,
            duration: 220,
            useNativeDriver: true,
        }).start(() => handleCloseRef.current());
    }, [translateY]);

    useEffect(() => {
        if (visible) {
            translateY.setValue(SHEET_HEIGHT);
            currentSnap.current = 0;
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 3,
                speed: 14,
            }).start();
        }
    }, [visible, translateY]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 8,
            onPanResponderGrant: () => {
                translateY.stopAnimation();
                translateY.setOffset(currentSnap.current);
                translateY.setValue(0);
            },
            onPanResponderMove: (_, gs) => {
                translateY.setValue(Math.max(0, gs.dy));
            },
            onPanResponderRelease: (_, gs) => {
                translateY.flattenOffset();
                if (gs.dy > DISMISS_THRESHOLD || gs.vy > 1.5) {
                    Animated.timing(translateY, {
                        toValue: SHEET_HEIGHT,
                        duration: 220,
                        useNativeDriver: true,
                    }).start(() => handleCloseRef.current());
                } else {
                    currentSnap.current = 0;
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
    // ─────────────────────────────────────────────────────────────────────────

    const handleClose = () => {
        setTitle('');
        setContent('');
        setSelectedTags([]);
        dismiss();
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
                undefined,
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
            console.error('Error creating post:', error);
            const message = error?.message || 'Failed to create post. Please try again.';
            Alert.alert('Error', message);
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={handleClose}>
                    <View style={StyleSheet.absoluteFill} />
                </TouchableWithoutFeedback>

                <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
                    {/* Drag handle */}
                    <View style={styles.dragHandleArea} {...panResponder.panHandlers}>
                        <View style={styles.dragHandle} />
                    </View>

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

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            <TextInput
                                style={styles.titleInput}
                                placeholder="Title"
                                placeholderTextColor={looviColors.text.muted}
                                value={title}
                                onChangeText={setTitle}
                                maxLength={100}
                            />

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

                            <Text style={styles.tagsLabel}>Add tags (up to 3)</Text>
                            <View style={styles.tagsContainer}>
                                {SUGGESTED_TAGS.map((tag) => (
                                    <TouchableOpacity
                                        key={tag}
                                        style={[styles.tag, selectedTags.includes(tag) && styles.tagSelected]}
                                        onPress={() => toggleTag(tag)}
                                    >
                                        <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextSelected]}>
                                            #{tag}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.guidelines}>
                                <Ionicons name="information-circle-outline" size={16} color={looviColors.text.muted} />
                                <Text style={styles.guidelinesText}>
                                    Be supportive and respectful. We're all in this together!
                                </Text>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </Animated.View>
            </View>
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
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: SHEET_HEIGHT,
        width: '100%',
    },
    dragHandleArea: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 40,
    },
    dragHandle: {
        width: 44,
        height: 5,
        backgroundColor: '#CCCCCC',
        borderRadius: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
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
