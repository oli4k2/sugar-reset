/**
 * FriendRequestCard
 * 
 * Card component for displaying incoming friend requests with accept/decline buttons.
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';
import { looviColors } from './LooviBackground';
import { GlassCard } from './GlassCard';
import { FriendRequest } from '../types';

interface FriendRequestCardProps {
    request: FriendRequest;
    onAccept: (requestId: string) => Promise<void>;
    onDecline: (requestId: string) => Promise<void>;
}

export function FriendRequestCard({ request, onAccept, onDecline }: FriendRequestCardProps) {
    const [isAccepting, setIsAccepting] = useState(false);
    const [isDeclining, setIsDeclining] = useState(false);

    const handleAccept = async () => {
        setIsAccepting(true);
        try {
            await onAccept(request.id);
        } finally {
            setIsAccepting(false);
        }
    };

    const handleDecline = async () => {
        setIsDeclining(true);
        try {
            await onDecline(request.id);
        } finally {
            setIsDeclining(false);
        }
    };

    const timeAgo = getTimeAgo(request.createdAt);

    return (
        <GlassCard variant="light" padding="md" style={styles.card}>
            <View style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: looviColors.skyBlue }]}>
                    <Text style={styles.avatarText}>
                        {request.fromName?.[0]?.toUpperCase() || '?'}
                    </Text>
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{request.fromName || 'Unknown'}</Text>
                    {request.fromUsername && (
                        <Text style={styles.username}>@{request.fromUsername}</Text>
                    )}
                    {timeAgo ? <Text style={styles.time}>{timeAgo}</Text> : null}
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.declineButton}
                    onPress={handleDecline}
                    disabled={isDeclining || isAccepting}
                >
                    {isDeclining ? (
                        <ActivityIndicator size="small" color={looviColors.text.tertiary} />
                    ) : (
                        <>
                            <Ionicons name="close" size={18} color={looviColors.text.tertiary} />
                            <Text style={styles.declineText}>Decline</Text>
                        </>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={handleAccept}
                    disabled={isAccepting || isDeclining}
                >
                    {isAccepting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <>
                            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                            <Text style={styles.acceptText}>Accept</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </GlassCard>
    );
}

function getTimeAgo(date: Date | null | undefined): string {
    // Handle null/undefined dates to prevent text rendering errors
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return '';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

const styles = StyleSheet.create({
    card: {
        marginBottom: spacing.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    info: {
        flex: 1,
        marginLeft: spacing.md,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: looviColors.text.primary,
    },
    username: {
        fontSize: 13,
        color: looviColors.text.tertiary,
        marginTop: 2,
    },
    time: {
        fontSize: 12,
        color: looviColors.text.muted,
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    declineButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    declineText: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.tertiary,
    },
    acceptButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        backgroundColor: looviColors.accent.success,
    },
    acceptText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default FriendRequestCard;
