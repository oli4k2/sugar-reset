/**
 * ProfileScreen
 * 
 * User profile and settings with sky theme.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image,
    Dimensions,
    Modal,
    TextInput,
    Linking,
} from 'react-native';
import * as StoreReview from 'expo-store-review';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { spacing, borderRadius } from '../theme';
import LooviBackground, { looviColors } from '../components/LooviBackground';
import { GlassCard } from '../components/GlassCard';
import PlanDetailsModal from '../components/PlanDetailsModal';
import EditGoalsModal from '../components/EditGoalsModal';
import { UserAvatar } from '../components/UserAvatar';
import { AVATAR_EMOJIS } from '../constants/avatarConfig';

import { useUserData } from '../context/UserDataContext';
import { userService } from '../services/userService';
import { useAuthContext } from '../context/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { AppIcon } from '../components/OnboardingIcon';

interface MenuItem {
    id: string;
    emoji: string;
    label: string;
    action?: () => void;
}

const menuSections = [
    {
        title: 'Account',
        items: [
            { id: 'profile', emoji: '👤', label: 'Edit Profile' },
            { id: 'plan', emoji: '📋', label: 'My Plan' },
        ],
    },
    {
        title: 'Preferences',
        items: [
            { id: 'notifications', emoji: '🔔', label: 'Notifications' },
            { id: 'reminders', emoji: '⏰', label: 'Daily Reminders' },
        ],
    },
    {
        title: 'Support',
        items: [
            { id: 'help', emoji: '❓', label: 'Help & FAQ' },
            { id: 'feedback', emoji: '💬', label: 'Send Feedback' },
            { id: 'rate', emoji: '⭐', label: 'Rate the App' },
        ],
    },
    {
        title: 'Legal',
        items: [
            { id: 'privacy', emoji: '🔒', label: 'Privacy Policy' },
            { id: 'terms', emoji: '📄', label: 'Terms of Service' },
        ],
    },
];

export default function ProfileScreen() {
    const { onboardingData, streakData, updateOnboardingData } = useUserData();
    const { user, isAuthenticated, firebaseUser, refreshUser } = useAuthContext();
    const { signOut } = useAuth();
    const navigation = useNavigation<any>();
    const [showPlanDetails, setShowPlanDetails] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editNameState, setEditNameState] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [selectedAvatarType, setSelectedAvatarType] = useState<'photo' | 'emoji' | 'initial'>('initial');
    const [selectedAvatarValue, setSelectedAvatarValue] = useState<string>('');
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);

    // Determine auth provider type
    const authProvider = useMemo((): 'google' | 'apple' | 'email' | 'unknown' => {
        if (!firebaseUser || !firebaseUser.providerData || firebaseUser.providerData.length === 0) {
            return 'unknown';
        }

        // Debug: log all providers
        console.log('🔑 Provider data:', firebaseUser.providerData.map(p => p?.providerId));

        // Check ALL providers in the array, not just the first one
        for (const provider of firebaseUser.providerData) {
            const providerId = provider?.providerId || '';
            if (providerId.includes('google')) return 'google';
            if (providerId.includes('apple')) return 'apple';
            if (providerId.includes('password')) return 'email';
        }

        return 'unknown';
    }, [firebaseUser]);

    // Get user data from context

    // Get user data from context
    const startDateString = onboardingData.startDate || new Date().toISOString();
    const startDate = useMemo(() => new Date(startDateString), [startDateString]);

    // Get user data from context
    const name = onboardingData.nickname || user?.displayName || firebaseUser?.displayName || 'Guest';
    const email = firebaseUser?.email || user?.email || 'Not signed in';
    const daysSugarFree = streakData?.currentStreak || 0;
    const currentPlan = onboardingData.plan === 'cold_turkey' ? 'Cold Turkey' : 'Gradual Reduction';
    const plan = isAuthenticated ? 'Premium' : 'Free';

    const handleViewPlanDetails = () => {
        setShowPlanDetails(true);
    };

    const handleChangePlan = () => {
        const newPlan = onboardingData.plan === 'cold_turkey' ? 'gradual' : 'cold_turkey';
        const newPlanName = newPlan === 'cold_turkey' ? 'Cold Turkey' : 'Gradual Reduction';

        Alert.alert(
            'Change Plan',
            `Switch to ${newPlanName}?\n\n${newPlan === 'cold_turkey'
                ? '0g sugar from day 1 for 90 days. Maximum discipline.'
                : '50g → 45g → ... → 20g → 0g at week 8, then maintain.'}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Switch',
                    onPress: async () => {
                        await updateOnboardingData({ plan: newPlan });
                        Alert.alert('Plan Updated', `You're now on the ${newPlanName} plan.`);
                    }
                },
            ]
        );
    };

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Onboarding' }],
                            });
                        } catch (error) {
                            console.error('Error signing out:', error);
                        }
                    }
                },
            ]
        );
    };

    const handleEditProfile = async () => {
        if (!user) return;
        setEditNameState(name);
        // Set current avatar selection
        setSelectedAvatarType(user.avatarType || (user.photoURL ? 'photo' : 'initial'));
        setSelectedAvatarValue(user.avatarValue || user.photoURL || '');
        setShowEditProfile(true);
    };

    const handleSelectAvatar = (type: 'photo' | 'emoji', value: string) => {
        setSelectedAvatarType(type);
        setSelectedAvatarValue(value);
        setShowAvatarPicker(false);
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSavingProfile(true);

        try {
            const trimmedName = editNameState.trim();

            // Update displayName locally in onboarding data
            if (trimmedName !== name) {
                await updateOnboardingData({ nickname: trimmedName });

                // Also sync to Firestore for friend search
                await userService.updateDisplayName(user.id, trimmedName);
            }

            // Save avatar if changed
            if (selectedAvatarType && selectedAvatarValue) {
                await userService.updateAvatar(user.id, selectedAvatarType, selectedAvatarValue);
            }

            // Refresh user data to update UI immediately
            await refreshUser();

            setShowEditProfile(false);
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            console.error('Error saving profile:', error);
            Alert.alert('Error', 'Failed to save profile');
        } finally {
            setIsSavingProfile(false);
        }
    };

    return (
        <>
            <LooviBackground variant="coralLeft">
                <SafeAreaView style={styles.container}>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Profile</Text>
                        </View>

                        {/* User Card */}
                        <GlassCard variant="light" padding="lg" style={styles.userCard}>
                            <View style={styles.avatarContainer}>
                                <UserAvatar
                                    size={64}
                                    photoURL={user?.photoURL}
                                    avatarType={user?.avatarType}
                                    avatarValue={user?.avatarValue}
                                    name={name}
                                />
                            </View>
                            <Text style={styles.userName}>{name}</Text>
                            <Text style={styles.userEmail}>{email}</Text>
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{daysSugarFree}</Text>
                                    <Text style={styles.statLabel}>Days Free</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <AppIcon emoji="🌟" size={24} />
                                    <Text style={styles.statLabel}>{plan}</Text>
                                </View>
                            </View>
                        </GlassCard>

                        {/* Reasons Section */}


                        {/* Menu Sections */}
                        {menuSections.map((section, sectionIndex) => (
                            <View key={sectionIndex} style={styles.menuSection}>
                                <Text style={styles.sectionTitle}>{section.title}</Text>
                                <GlassCard variant="light" padding="none" style={styles.menuCard}>
                                    {section.items.map((item, itemIndex) => (
                                        <TouchableOpacity
                                            key={item.id}
                                            style={[
                                                styles.menuItem,
                                                itemIndex < section.items.length - 1 && styles.menuItemBorder,
                                            ]}
                                            activeOpacity={0.6}
                                            onPress={
                                                item.id === 'plan'
                                                    ? handleViewPlanDetails
                                                    : item.id === 'profile'
                                                        ? handleEditProfile
                                                        : item.id === 'journal'
                                                            ? () => navigation.navigate('Journal')
                                                            : item.id === 'help'
                                                                ? () => navigation.navigate('Help')
                                                                : item.id === 'rate'
                                                                    ? async () => {
                                                                        if (await StoreReview.hasAction()) {
                                                                            StoreReview.requestReview();
                                                                        } else {
                                                                            Alert.alert('Rate App', 'You can rate us on the App Store!');
                                                                        }
                                                                    }
                                                                    : item.id === 'feedback'
                                                                        ? () => Linking.openURL('mailto:hello@scriptcollective.com')
                                                                        : item.id === 'privacy'
                                                                            ? () => navigation.navigate('PrivacyPolicy')
                                                                            : item.id === 'terms'
                                                                                ? () => navigation.navigate('TermsOfService')
                                                                                : undefined
                                            }
                                        >
                                            <AppIcon emoji={item.emoji} size={20} />
                                            <View style={styles.menuLabelContainer}>
                                                <Text style={styles.menuLabel}>{item.label}</Text>
                                                {item.id === 'plan' && (
                                                    <Text style={styles.menuValue}>{currentPlan}</Text>
                                                )}
                                            </View>
                                            <Text style={styles.menuArrow}>›</Text>
                                        </TouchableOpacity>
                                    ))}
                                </GlassCard>
                            </View>
                        ))}

                        {/* Logout */}
                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={handleLogout}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.logoutText}>Log Out</Text>
                        </TouchableOpacity>

                        {/* Logo */}
                        <Image
                            source={require('../public/cravelesslogo.png')}
                            style={styles.footerLogo}
                            resizeMode="contain"
                        />

                        {/* Version */}
                        <Text style={styles.version}>SugarReset v1.0.0</Text>
                    </ScrollView>



                    {/* Edit Savings Goal Modal */}

                    {/* Edit Profile Modal */}

                    {/* Edit Profile Modal */}
                    <Modal
                        visible={showEditProfile}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setShowEditProfile(false)}
                    >
                        <TouchableOpacity
                            style={styles.modalOverlay}
                            activeOpacity={1}
                            onPress={() => setShowEditProfile(false)}
                        >
                            <TouchableOpacity activeOpacity={1} style={styles.editModalContent}>
                                <Text style={styles.editModalTitle}>Edit Profile</Text>

                                {/* Auth Provider Badge */}
                                {authProvider !== 'unknown' && (
                                    <View style={styles.authProviderBadge}>
                                        <Text style={styles.authProviderIcon}>
                                            {authProvider === 'google' ? '🔵' : authProvider === 'apple' ? '🍎' : '✉️'}
                                        </Text>
                                        <Text style={styles.authProviderText}>
                                            Signed in with {authProvider === 'google' ? 'Google' : authProvider === 'apple' ? 'Apple' : 'Email'}
                                        </Text>
                                    </View>
                                )}

                                {/* Avatar Selection */}
                                <Text style={styles.inputLabel}>Profile Picture</Text>
                                <View style={styles.avatarPickerSection}>
                                    <TouchableOpacity
                                        style={styles.currentAvatarPreview}
                                        onPress={() => setShowAvatarPicker(!showAvatarPicker)}
                                    >
                                        <UserAvatar
                                            size={56}
                                            photoURL={selectedAvatarType === 'photo' ? selectedAvatarValue : undefined}
                                            avatarType={selectedAvatarType}
                                            avatarValue={selectedAvatarValue}
                                            name={name}
                                        />
                                        <Text style={styles.changeAvatarText}>Tap to change</Text>
                                    </TouchableOpacity>

                                    {/* Google/Apple Photo Option */}
                                    {firebaseUser?.photoURL && (
                                        <TouchableOpacity
                                            style={[
                                                styles.photoOption,
                                                selectedAvatarType === 'photo' && selectedAvatarValue === firebaseUser.photoURL && styles.avatarOptionSelected
                                            ]}
                                            onPress={() => handleSelectAvatar('photo', firebaseUser.photoURL!)}
                                        >
                                            <UserAvatar size={40} photoURL={firebaseUser.photoURL} avatarType="photo" avatarValue={firebaseUser.photoURL} name={name} />
                                            <Text style={styles.photoOptionText}>Use {authProvider === 'google' ? 'Google' : 'Apple'} photo</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Emoji Picker Grid */}
                                {showAvatarPicker && (
                                    <View style={styles.emojiPickerGrid}>
                                        <Text style={styles.emojiPickerTitle}>Choose an emoji</Text>
                                        <View style={styles.emojiGrid}>
                                            {AVATAR_EMOJIS.map((emoji) => (
                                                <TouchableOpacity
                                                    key={emoji}
                                                    style={[
                                                        styles.emojiOption,
                                                        selectedAvatarType === 'emoji' && selectedAvatarValue === emoji && styles.avatarOptionSelected
                                                    ]}
                                                    onPress={() => handleSelectAvatar('emoji', emoji)}
                                                >
                                                    <Text style={styles.emojiText}>{emoji}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Email (Read-only) */}
                                <Text style={styles.inputLabel}>Email</Text>
                                <View style={styles.readOnlyField}>
                                    <Text style={styles.readOnlyText}>{email}</Text>
                                    {(authProvider === 'google' || authProvider === 'apple') && (
                                        <Text style={styles.readOnlyHint}>Managed by {authProvider === 'google' ? 'Google' : 'Apple'}</Text>
                                    )}
                                </View>

                                {/* Display Name */}
                                <Text style={styles.inputLabel}>Your Name</Text>
                                <TextInput
                                    style={styles.editInput}
                                    value={editNameState}
                                    onChangeText={setEditNameState}
                                    placeholder="Your Name"
                                    placeholderTextColor={looviColors.text.muted}
                                    autoCapitalize="words"
                                />
                                <Text style={styles.fieldHint}>This is how friends can find you in the app</Text>

                                <View style={styles.editModalButtons}>
                                    <TouchableOpacity
                                        style={styles.editCancelButton}
                                        onPress={() => setShowEditProfile(false)}
                                        disabled={isSavingProfile}
                                    >
                                        <Text style={styles.editCancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.editSaveButton, isSavingProfile && { opacity: 0.7 }]}
                                        onPress={handleSaveProfile}
                                        disabled={isSavingProfile}
                                    >
                                        <Text style={styles.editSaveText}>{isSavingProfile ? 'Saving...' : 'Save'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </Modal>


                    {/* Plan Details Modal */}
                    <PlanDetailsModal
                        visible={showPlanDetails}
                        planType={onboardingData.plan || 'cold_turkey'}
                        onClose={() => setShowPlanDetails(false)}
                        onSwitchPlan={handleChangePlan}
                    />
                </SafeAreaView>
            </LooviBackground>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing.lg,
        paddingBottom: spacing['3xl'],
    },
    header: {
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: looviColors.text.primary,
        letterSpacing: -0.5,
    },
    userCard: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    avatarEmoji: {
        fontSize: 40,
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.xs,
    },
    userEmail: {
        fontSize: 14,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        marginBottom: spacing.lg,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    // Reasons/Savings Section Styles
    profileSection: {
        marginBottom: spacing.xl,
    },
    profileSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingHorizontal: spacing.sm,
    },
    profileSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: looviColors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    editIcon: {
        fontSize: 14,
    },
    reasonsContainer: {
        gap: spacing.sm,
    },
    reasonCard: {
        marginBottom: spacing.xs,
    },
    reasonText: {
        fontSize: 15,
        fontWeight: '500',
        color: looviColors.text.primary,
    },
    savingsCard: {
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.1)',
    },
    savingsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    savingsLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: looviColors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    savingsGoalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.md,
    },
    savingsProgress: {
        gap: spacing.xs,
    },
    savingsProgressBar: {
        height: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    savingsProgressFill: {
        height: '100%',
        backgroundColor: looviColors.accent.success,
        borderRadius: 4,
    },
    savingsProgressText: {
        fontSize: 12,
        fontWeight: '500',
        color: looviColors.text.tertiary,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.screen.horizontal,
    },
    editModalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius['2xl'],
        padding: spacing.xl,
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    editModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: looviColors.text.primary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    editInput: {
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        fontSize: 16,
        color: looviColors.text.primary,
        marginBottom: spacing.md,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.secondary,
        marginBottom: spacing.xs,
        marginLeft: spacing.xs,
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444',
        marginBottom: spacing.md,
        marginTop: -spacing.sm,
        marginLeft: spacing.xs,
    },
    authProviderBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.lg,
        gap: spacing.xs,
    },
    authProviderIcon: {
        fontSize: 14,
    },
    authProviderText: {
        fontSize: 13,
        fontWeight: '500',
        color: looviColors.text.secondary,
    },
    readOnlyField: {
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        borderStyle: 'dashed',
    },
    readOnlyText: {
        fontSize: 16,
        color: looviColors.text.tertiary,
    },
    readOnlyHint: {
        fontSize: 11,
        color: looviColors.text.muted,
        marginTop: spacing.xs,
        fontStyle: 'italic',
    },
    fieldHint: {
        fontSize: 11,
        color: looviColors.text.muted,
        marginBottom: spacing.md,
        marginTop: -spacing.sm,
        marginLeft: spacing.xs,
    },
    editModalButtons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    editCancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    editCancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.text.secondary,
    },
    editSaveButton: {
        flex: 2,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
        backgroundColor: looviColors.accent.primary,
    },
    editSaveText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    menuSection: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: looviColors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.sm,
        marginLeft: spacing.sm,
    },
    menuCard: {},
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    menuEmoji: {
        fontSize: 20,
        marginRight: spacing.md,
    },
    menuLabelContainer: {
        flex: 1,
        marginLeft: spacing.md,
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '400',
        color: looviColors.text.primary,
    },
    menuValue: {
        fontSize: 13,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        marginTop: 2,
    },
    menuSubtext: {
        fontSize: 12,
        fontWeight: '400',
        color: looviColors.text.tertiary,
        marginTop: 2,
    },
    menuArrow: {
        fontSize: 20,
        color: looviColors.text.muted,
    },
    logoutButton: {
        alignItems: 'center',
        paddingVertical: spacing.md,
        marginTop: spacing.md,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#EF4444',
    },
    footerLogo: {
        width: Dimensions.get('window').width * 0.70,
        height: 80,
        alignSelf: 'center',
        marginTop: spacing.xl,
        opacity: 0.6,
    },
    version: {
        fontSize: 12,
        fontWeight: '400',
        color: looviColors.text.muted,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
    // Avatar picker styles
    avatarPickerSection: {
        alignItems: 'center',
        marginBottom: spacing.md,
        gap: spacing.md,
    },
    currentAvatarPreview: {
        alignItems: 'center',
        gap: spacing.xs,
    },
    changeAvatarText: {
        fontSize: 12,
        color: looviColors.accent.primary,
        fontWeight: '500',
    },
    photoOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
    },
    avatarOptionSelected: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderWidth: 2,
        borderColor: looviColors.accent.primary,
    },
    photoOptionText: {
        fontSize: 14,
        color: looviColors.text.secondary,
        fontWeight: '500',
    },
    emojiPickerGrid: {
        marginBottom: spacing.md,
    },
    emojiPickerTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: looviColors.text.secondary,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    emojiOption: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
    },
    emojiText: {
        fontSize: 24,
    },
});
