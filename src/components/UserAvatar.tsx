/**
 * UserAvatar Component
 * 
 * Reusable avatar component that displays:
 * - Photo URL (Google/Apple OAuth)
 * - Emoji avatar
 * - Fallback initial letter
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { looviColors } from './LooviBackground';

interface UserAvatarProps {
    size?: number;
    photoURL?: string | null;
    avatarType?: 'photo' | 'emoji' | 'initial' | null;
    avatarValue?: string | null;
    name?: string;
    backgroundColor?: string;
}

export function UserAvatar({
    size = 40,
    photoURL,
    avatarType,
    avatarValue,
    name,
    backgroundColor,
}: UserAvatarProps) {
    // Determine what to display
    const displayType = avatarType || (photoURL ? 'photo' : 'initial');
    const displayValue = avatarType === 'emoji'
        ? avatarValue
        : avatarType === 'photo'
            ? (avatarValue || photoURL)
            : name?.[0]?.toUpperCase() || '?';

    const containerStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: backgroundColor || '#FFFFFF',
    };

    // Photo avatar
    if (displayType === 'photo' && displayValue) {
        return (
            <Image
                source={{ uri: displayValue }}
                style={[styles.image, containerStyle]}
            />
        );
    }

    // Emoji avatar
    if (displayType === 'emoji' && displayValue) {
        return (
            <View style={[styles.container, containerStyle]}>
                <Text style={[styles.emoji, { fontSize: size * 0.5 }]}>
                    {displayValue}
                </Text>
            </View>
        );
    }

    // Initial fallback
    return (
        <View style={[styles.container, containerStyle]}>
            <Text style={[styles.initial, { fontSize: size * 0.4 }]}>
                {name?.[0]?.toUpperCase() || '?'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        resizeMode: 'cover',
    },
    emoji: {
        textAlign: 'center',
    },
    initial: {
        fontWeight: '600',
        color: looviColors.accent.primary,
        textAlign: 'center',
    },
});

export default UserAvatar;
