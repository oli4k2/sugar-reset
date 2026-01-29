
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Dimensions,
    Image,
    Animated,
    Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useAuthContext } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { notificationService } from '../services/notificationService';
import { spacing } from '../theme';

const { width } = Dimensions.get('window');

// Theme: Deep Connection (Indigo/Violet)
const THEME = {
    bg: ['#0F172A', '#1E1B4B'],
    accent: '#818CF8',
    text: '#F8FAFC',
    textDim: '#94A3B8',
    cardBg: 'rgba(255, 255, 255, 0.05)',
    success: '#34D399',
};

const CONTEXT_CHIPS = [
    { id: 'store', label: 'At the store 🛒', message: "I'm at the grocery store and it's tough." },
    { id: 'home', label: 'Home alone 🏠', message: "I'm home alone and struggling with a craving." },
    { id: 'talk', label: 'Need to talk 🗣️', message: "Just need a 5-min distraction call." },
];

export default function InnerCircleScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthContext();
    const { onboardingData, innerCircle: friends } = useUserData();
    const [isSending, setIsSending] = useState(false);
    const [selectedChip, setSelectedChip] = useState<string | null>(null);

    // Pulse animation for the connection lines
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0,
                    duration: 3000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);



    const handleNotifyCircle = async () => {
        if (!user) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsSending(true);

        try {
            const userName = onboardingData.nickname || user.displayName || 'Friend';

            // Construct message with context if selected
            const contextMsg = selectedChip
                ? CONTEXT_CHIPS.find(c => c.id === selectedChip)?.message
                : "Need a hand with a craving. Are you free?";

            const result = await notificationService.sendSOSAlert(
                user.id,
                userName,
                contextMsg
            );

            if (result.success) {
                Alert.alert('Sent!', 'Your circle has been notified.');
                navigation.goBack();
            } else {
                Alert.alert('Tips', 'Add friends to your circle first!', [
                    { text: 'Add Friends', onPress: () => navigation.navigate('Social') }
                ]);
            }
        } catch (error) {
            Alert.alert('Error', 'Could not reach circle.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={THEME.bg as any} style={StyleSheet.absoluteFillObject} />

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                        <Feather name="x" size={24} color={THEME.textDim} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>INNER CIRCLE</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.content}>

                    {/* The Squad Visualization (Scalable Grid) */}
                    <View style={styles.gridContainer}>
                        <View style={styles.squadGrid}>
                            {/* User Node (Always First) */}
                            <View style={[styles.avatarNode, styles.userNode]}>
                                <Feather name="user" size={24} color="#FFF" />
                            </View>

                            {/* Friend Nodes */}
                            {friends.map((friend) => (
                                <View key={friend.id} style={[styles.avatarNode, { backgroundColor: friend.color }]}>
                                    <Text style={styles.initial}>{friend.name[0]}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Decorative Connection Line */}
                        <Animated.View style={[styles.pulseLine, { opacity: pulseAnim }]} />
                    </View>

                    {/* Context Chips (Actionable Prompt) */}
                    <View style={styles.contextContainer}>
                        <Text style={styles.contextLabel}>I AM...</Text>
                        <View style={styles.chipRow}>
                            {CONTEXT_CHIPS.map(chip => (
                                <TouchableOpacity
                                    key={chip.id}
                                    style={[
                                        styles.chip,
                                        selectedChip === chip.id && styles.chipSelected
                                    ]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setSelectedChip(selectedChip === chip.id ? null : chip.id);
                                    }}
                                >
                                    <View style={styles.chipContent}>
                                        <Feather
                                            name={selectedChip === chip.id ? "check" : "plus"}
                                            size={12}
                                            color={selectedChip === chip.id ? "#FFF" : THEME.textDim}
                                            style={{ marginRight: 6 }}
                                        />
                                        <Text style={[
                                            styles.chipText,
                                            selectedChip === chip.id && styles.chipTextSelected
                                        ]}>
                                            {chip.label}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Status Text */}
                    <View style={styles.statusContainer}>
                        <Text style={styles.statusTitle}>
                            {friends.length} {friends.length === 1 ? 'Ally' : 'Allies'} Connected
                        </Text>
                    </View>

                    {/* Primary Action */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[
                                styles.notifyBtn,
                                (isSending || friends.length === 0) && { opacity: 0.7 }
                            ]}
                            activeOpacity={0.9}
                            onPress={handleNotifyCircle}
                            disabled={isSending || friends.length === 0}
                        >
                            <LinearGradient
                                colors={friends.length === 0
                                    ? ['#475569', '#334155'] // Grey for disabled
                                    : ['#6366F1', '#4338CA'] // Indigo for active
                                }
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={StyleSheet.absoluteFillObject}
                            />
                            <Feather
                                name="bell"
                                size={24}
                                color={friends.length === 0 ? 'rgba(255,255,255,0.5)' : '#FFF'}
                                style={{ marginRight: 12 }}
                            />
                            <Text style={[
                                styles.notifyText,
                                friends.length === 0 && { color: 'rgba(255,255,255,0.5)' }
                            ]}>
                                {isSending ? 'Signaling...' : 'Alert My Circle'}
                            </Text>
                        </TouchableOpacity>

                        <Text style={styles.disclaimer}>
                            {friends.length === 0
                                ? 'Add allies to your circle to alert them.'
                                : 'This sends a push notification to their devices.'
                            }
                        </Text>
                    </View>

                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 60,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 2,
        color: '#FFF',
    },
    iconBtn: {
        padding: 8,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 40,
    },
    // Squad Grid Styles
    gridContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        marginVertical: 20,
    },
    squadGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        maxWidth: width * 0.8,
        zIndex: 10,
    },
    avatarNode: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#0F172A',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    userNode: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderColor: 'rgba(255,255,255,0.2)',
        borderWidth: 2,
    },
    addNode: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
    },
    initial: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 20,
    },
    pulseLine: {
        position: 'absolute',
        width: '120%',
        height: 1,
        backgroundColor: 'rgba(129, 140, 248, 0.4)',
        top: '50%',
        zIndex: 0,
    },

    // Empty State
    emptyStateContainer: {
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    emptyText: {
        color: THEME.textDim,
        fontSize: 14,
    },
    // Text Status
    statusContainer: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    statusTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 8,
    },
    // Context Chips
    contextContainer: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    contextLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: THEME.textDim,
        letterSpacing: 1,
        marginBottom: 16,
        textAlign: 'center',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
    },
    chip: {
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    chipContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    chipSelected: {
        backgroundColor: 'rgba(129, 140, 248, 0.2)',
        borderColor: '#818CF8',
    },
    chipText: {
        color: THEME.textDim,
        fontSize: 13,
        fontWeight: '600',
    },
    chipTextSelected: {
        color: '#FFF',
    },
    // Footer
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    notifyBtn: {
        height: 56,
        width: '100%',
        borderRadius: 28,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    notifyText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    disclaimer: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.3)',
        textAlign: 'center',
    },
});