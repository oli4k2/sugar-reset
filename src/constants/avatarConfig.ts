/**
 * Avatar Configuration
 * 
 * Defines emoji avatar options and avatar type system.
 */

// Available emoji avatars for selection
export const AVATAR_EMOJIS = [
    // People & Faces
    '😊', '😎', '🤓', '🥳', '😇',
    '🤗', '🧑‍💻', '👨‍🎓', '👩‍🎓', '🧑‍🍳',
    // Health & Wellness
    '💪', '🏃', '🧘', '🍎', '💚',
    '🏋️', '🧗', '🚴', '🏄', '⚡',
    // Fruits & Food
    '🍊', '🍋', '🍇', '🍓', '🫐',
    '🍑', '🍌', '🥝', '🥑', '🥕',
    '🥗', '🥒', '🍉', '🥭', '🫒',
    // Nature & Leafs
    '🌿', '🍃', '🌱', '🌸', '🌻',
    '🍀', '🌳', '🌺', '🌷', '🌼',
    '⭐', '🌈', '☀️', '🔥', '✨',
    // Animals
    '🦋', '🦊', '🐱', '🐶', '🐼', '🦄',
] as const;

export type AvatarEmoji = typeof AVATAR_EMOJIS[number];

export type AvatarType = 'photo' | 'emoji' | 'initial';

export interface AvatarConfig {
    type: AvatarType;
    value: string; // URL for photo, emoji character, or empty for initial
}

// Get a default avatar based on name
export function getDefaultAvatar(name?: string): AvatarConfig {
    return {
        type: 'initial',
        value: name?.[0]?.toUpperCase() || '?',
    };
}

// Get avatar display info
export function getAvatarDisplay(
    config: AvatarConfig | null | undefined,
    name?: string,
    photoURL?: string
): { type: AvatarType; value: string } {
    // Priority: explicit config > photoURL > initial
    if (config?.type === 'emoji' && config.value) {
        return { type: 'emoji', value: config.value };
    }

    if (config?.type === 'photo' && config.value) {
        return { type: 'photo', value: config.value };
    }

    // Fallback to OAuth photo if available
    if (photoURL) {
        return { type: 'photo', value: photoURL };
    }

    // Last resort: initial
    return { type: 'initial', value: name?.[0]?.toUpperCase() || '?' };
}
