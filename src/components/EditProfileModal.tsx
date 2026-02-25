/**
 * EditProfileModal Component
 * 
 * A gesture-driven bottom sheet for editing user profile (name and avatar).
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    Animated,
    PanResponder,
    Dimensions,
    TouchableWithoutFeedback,
    Platform,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import { UserAvatar } from './UserAvatar';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.4;

const AVATAR_EMOJIS = ['🥑', '🦁', '🐱', '🐶', '🦊', '🐼', '🐨', '🐯', '🐸', '🦄', '🌈', '🔥', '✨', '🌊', '🌙', '☀️'];

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (name: string, type: 'photo' | 'emoji', value: string) => Promise<void>;
    initialName: string;
    initialAvatarType: 'photo' | 'emoji' | 'initial' | null;
    initialAvatarValue: string | null;
    firebasePhotoURL: string | null;
    email: string;
    username: string | null;
    authProvider: string | null;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
    visible,
    onClose,
    onSave,
    initialName,
    initialAvatarType,
    initialAvatarValue,
    firebasePhotoURL,
    email,
    username,
    authProvider,
}) => {
    const [name, setName] = useState(initialName);
    const [selectedType, setSelectedType] = useState<'photo' | 'emoji'>(
        initialAvatarType === 'emoji' ? 'emoji' : 'photo'
    );
    const [selectedValue, setSelectedValue] = useState(initialAvatarValue || firebasePhotoURL || '');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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
            setName(initialName);
            setSelectedType(initialAvatarType === 'emoji' ? 'emoji' : 'photo');
            setSelectedValue(initialAvatarValue || firebasePhotoURL || '');
            setShowEmojiPicker(false);

            translateY.setValue(SHEET_HEIGHT);
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 3,
                speed: 14,
            }).start();
        }
    }, [visible, initialName, initialAvatarType, initialAvatarValue, firebasePhotoURL]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(name, selectedType, selectedValue);
            dismiss();
        } catch (error) {
            console.error('Error saving profile:', error);
        } finally {
            setIsSaving(false);
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
                        <Text style={styles.title}>Edit Profile</Text>
                        <TouchableOpacity onPress={dismiss}>
                            <Ionicons name="close" size={24} color={looviColors.text.tertiary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Avatar Section */}
                        <View style={styles.avatarSection}>
                            <View style={styles.mainAvatarWrapper}>
                                <UserAvatar
                                    size={100}
                                    photoURL={selectedType === 'photo' ? selectedValue : undefined}
                                    avatarType={selectedType}
                                    avatarValue={selectedValue}
                                    name={name}
                                />
                                <TouchableOpacity
                                    style={styles.editAvatarBadge}
                                    onPress={() => setShowEmojiPicker(!showEmojiPicker)}
                                >
                                    <Ionicons name="camera" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.avatarOptions}>
                                {firebasePhotoURL && (
                                    <TouchableOpacity
                                        style={[
                                            styles.avatarOption,
                                            selectedType === 'photo' && selectedValue === firebasePhotoURL && styles.avatarOptionSelected
                                        ]}
                                        onPress={() => {
                                            setSelectedType('photo');
                                            setSelectedValue(firebasePhotoURL);
                                        }}
                                    >
                                        <UserAvatar size={44} photoURL={firebasePhotoURL} avatarType="photo" avatarValue={firebasePhotoURL} name={name} />
                                        <View style={styles.checkBadge}>
                                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                                        </View>
                                    </TouchableOpacity>
                                )}

                                {AVATAR_EMOJIS.slice(0, 4).map(emoji => (
                                    <TouchableOpacity
                                        key={emoji}
                                        style={[
                                            styles.avatarOption,
                                            selectedType === 'emoji' && selectedValue === emoji && styles.avatarOptionSelected
                                        ]}
                                        onPress={() => {
                                            setSelectedType('emoji');
                                            setSelectedValue(emoji);
                                        }}
                                    >
                                        <Text style={styles.emojiOptionText}>{emoji}</Text>
                                    </TouchableOpacity>
                                ))}

                                <TouchableOpacity
                                    style={styles.moreOptionsButton}
                                    onPress={() => setShowEmojiPicker(!showEmojiPicker)}
                                >
                                    <Ionicons name="apps-outline" size={24} color={looviColors.text.secondary} />
                                </TouchableOpacity>
                            </View>

                            {showEmojiPicker && (
                                <View style={styles.emojiPicker}>
                                    {AVATAR_EMOJIS.map(emoji => (
                                        <TouchableOpacity
                                            key={emoji}
                                            style={[
                                                styles.emojiPickerItem,
                                                selectedType === 'emoji' && selectedValue === emoji && styles.emojiPickerItemSelected
                                            ]}
                                            onPress={() => {
                                                setSelectedType('emoji');
                                                setSelectedValue(emoji);
                                            }}
                                        >
                                            <Text style={styles.emojiText}>{emoji}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Form Section */}
                        <View style={styles.formSection}>
                            <Text style={styles.inputLabel}>Display Name</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Your display name"
                                placeholderTextColor={looviColors.text.muted}
                            />
                            <Text style={styles.inputHint}>This is how friends will see you.</Text>

                            <Text style={styles.inputLabel}>Username</Text>
                            <View style={styles.readOnlyField}>
                                <Text style={styles.readOnlyText}>@{username || 'not_set'}</Text>
                                <Ionicons name="lock-closed" size={14} color={looviColors.text.muted} />
                            </View>
                            <Text style={styles.inputHint}>Username cannot be changed.</Text>

                            <Text style={styles.inputLabel}>Email</Text>
                            <View style={styles.readOnlyField}>
                                <Text style={styles.readOnlyText}>{email}</Text>
                                <Ionicons name="lock-closed" size={14} color={looviColors.text.muted} />
                            </View>
                            <Text style={styles.inputHint}>
                                Managed by {authProvider === 'google' ? 'Google' : authProvider === 'apple' ? 'Apple' : 'System'}.
                            </Text>
                        </View>

                        <View style={{ height: 40 }} />
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
                            onPress={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

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
        maxHeight: SHEET_HEIGHT,
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    scrollContent: {
        paddingHorizontal: spacing.xl,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    mainAvatarWrapper: {
        position: 'relative',
        marginBottom: spacing.xl,
    },
    editAvatarBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: looviColors.accent.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    avatarOptions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    avatarOption: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(0,0,0,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    avatarOptionSelected: {
        borderColor: looviColors.accent.primary,
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
    },
    emojiOptionText: {
        fontSize: 24,
    },
    checkBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: looviColors.accent.primary,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    moreOptionsButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(0,0,0,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emojiPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.sm,
        marginTop: spacing.lg,
        padding: spacing.md,
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: borderRadius.xl,
    },
    emojiPickerItem: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
    },
    emojiPickerItemSelected: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    emojiText: {
        fontSize: 22,
    },
    formSection: {
        gap: spacing.sm,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginTop: spacing.md,
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.03)',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        fontSize: 16,
        color: looviColors.text.primary,
    },
    readOnlyField: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.01)',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    readOnlyText: {
        fontSize: 16,
        color: looviColors.text.tertiary,
    },
    inputHint: {
        fontSize: 12,
        color: looviColors.text.tertiary,
        marginTop: -4,
    },
    footer: {
        padding: spacing.xl,
        paddingTop: spacing.md,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    saveButton: {
        backgroundColor: looviColors.accent.primary,
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default EditProfileModal;
