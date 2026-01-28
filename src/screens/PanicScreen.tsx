
import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Easing,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { spacing } from '../theme';

const { width, height } = Dimensions.get('window');

/**
 * PanicScreen V8 - "The SOS Command Deck"
 * 
 * THEME: Serious Cosmos
 * - Deep Midnight/Indigo base (Serious, SOS vibes)
 * - Pulsing "Urgency" orbs (Soft Crimson/Orange)
 * - Glassmorphism UI for high trust
 */

const BG_GRADIENT = ['#0F172A', '#1E293B'] as const; // Deep Slate/Midnight

// Cosmos Particle Component
const Particle = ({ delay, duration, size, startX, startY }: any) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(anim, {
                    toValue: 1,
                    duration: duration,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const translateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -height],
    });

    const opacity = anim.interpolate({
        inputRange: [0, 0.2, 0.8, 1],
        outputRange: [0, 0.4, 0.4, 0],
    });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                left: startX,
                top: startY,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                transform: [{ translateY }],
                opacity,
                shadowColor: '#FFF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 2,
            }}
        />
    );
};

export default function PanicScreen() {
    const navigation = useNavigation<any>();

    // Generate particles
    const particles = Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        size: Math.random() * 3 + 1,
        startX: Math.random() * width,
        startY: Math.random() * height + 100,
        duration: Math.random() * 10000 + 20000,
        delay: Math.random() * 5000,
    }));

    const breatheAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const breatheSequence = Animated.loop(
            Animated.sequence([
                Animated.timing(breatheAnim, {
                    toValue: 1,
                    duration: 5000, // Slightly faster for serious focus
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(breatheAnim, {
                    toValue: 0,
                    duration: 5000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );

        breatheSequence.start();
    }, []);

    const bgScale = breatheAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.15],
    });

    const circleScale = breatheAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.3],
    });

    const handlePress = (screen: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        navigation.navigate(screen);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient colors={BG_GRADIENT as any} style={StyleSheet.absoluteFillObject} />

            {/* Cosmos Particles Layer */}
            {particles.map((p) => (
                <Particle key={p.id} {...p} />
            ))}

            <Animated.View
                style={[
                    styles.ambientOrb,
                    {
                        backgroundColor: 'rgba(239, 68, 68, 0.2)', // Slightly brighter SOS pulse
                        top: -50, right: -50,
                        transform: [{ scale: bgScale }]
                    }
                ]}
            />
            <Animated.View
                style={[
                    styles.ambientOrb,
                    {
                        backgroundColor: 'rgba(99, 102, 241, 0.25)', // Brighter Support Indigo
                        bottom: -50, left: -50,
                        transform: [{ scale: bgScale }]
                    }
                ]}
            />

            <BlurView intensity={20} style={StyleSheet.absoluteFillObject} tint="dark" />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.contentContainer}>

                    {/* Serious Header */}
                    <View style={styles.header}>
                        <View style={styles.emergencyTag}>
                            <View style={styles.pulseDot} />
                            <Text style={styles.headerSubtitle}>SUPPORT MODE ACTIVE</Text>
                        </View>
                    </View>

                    {/* HERO: The Explanation & Visual Anchor */}
                    <View style={styles.heroSection}>
                        <View style={styles.breathingContainer}>
                            <Animated.View
                                style={[
                                    styles.breathingCircle,
                                    { transform: [{ scale: circleScale }] }
                                ]}
                            >
                                <LinearGradient
                                    colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
                                    style={styles.circleGradient}
                                />
                            </Animated.View>

                            <View style={styles.centerIcon}>
                                <Feather name="activity" size={32} color="#FFF" />
                            </View>
                        </View>

                        <Text style={styles.heroTitle}>Ride the Wave</Text>
                        <Text style={styles.heroDescription}>
                            Cravings peak in 3-5m. This intensity is temporary.
                        </Text>
                    </View>

                    {/* THE SERIOUS BENTO GRID */}
                    <View style={styles.bentoGrid}>
                        {/* 1. Distract Me */}
                        <TouchableOpacity
                            style={[styles.bentoCard, styles.cardLarge]}
                            activeOpacity={0.9}
                            onPress={() => handlePress('DistractMe')}
                        >
                            <LinearGradient
                                colors={['#4F46E5', '#312E81']} // Warm Indigo (Violin)
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFillObject}
                            />
                            <View style={styles.cardContent}>
                                <View style={[styles.iconContainer, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                                    <Feather name="zap" size={24} color="#FBBF24" />
                                </View>
                                <View style={styles.cardTextContainer}>
                                    <Text style={styles.cardLabel}>Distract Me</Text>
                                    <Text style={styles.cardTag}>Shift your focus</Text>
                                </View>
                                <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.4)" />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.row}>
                            {/* 2. My Why */}
                            <TouchableOpacity
                                style={[styles.bentoCard, styles.cardSquare]}
                                activeOpacity={0.9}
                                onPress={() => handlePress('Reasons')}
                            >
                                <LinearGradient colors={['#4F46E5', '#312E81']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
                                <View style={styles.cardContentSquare}>
                                    <View style={[styles.iconContainerSmall, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
                                        <Feather name="anchor" size={22} color="#34D399" />
                                    </View>
                                    <Text style={styles.cardLabelSmall}>My Why</Text>
                                </View>
                            </TouchableOpacity>

                            {/* 3. SOS */}
                            <TouchableOpacity
                                style={[styles.bentoCard, styles.cardSquare]}
                                activeOpacity={0.9}
                                onPress={() => handlePress('InnerCircle')}
                            >
                                <LinearGradient colors={['#4F46E5', '#312E81']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
                                <View style={styles.cardContentSquare}>
                                    <View style={[styles.iconContainerSmall, { backgroundColor: 'rgba(248, 113, 113, 0.15)' }]}>
                                        <Feather name="users" size={22} color="#F87171" />
                                    </View>
                                    <Text style={styles.cardLabelSmall}>Inner Circle</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
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
    contentContainer: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? 90 : 70,
        paddingTop: spacing.xs,
    },
    ambientOrb: {
        position: 'absolute',
        width: 350,
        height: 350,
        borderRadius: 175,
        opacity: 0.6,
    },
    header: {
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    emergencyTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EF4444',
        marginRight: 8,
    },
    headerSubtitle: {
        fontSize: 10,
        color: '#EF4444',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    heroSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 180,
    },
    breathingContainer: {
        width: height < 700 ? 120 : 160,
        height: height < 700 ? 120 : 160,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: height < 700 ? 12 : 20,
    },
    breathingCircle: {
        width: height < 700 ? 100 : 140,
        height: height < 700 ? 100 : 140,
        borderRadius: height < 700 ? 50 : 70,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    circleGradient: {
        flex: 1,
        borderRadius: height < 700 ? 50 : 70,
    },
    centerIcon: {
        position: 'absolute',
    },
    heroTitle: {
        fontSize: height < 700 ? 28 : 34,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -1,
        marginBottom: 4,
    },
    heroDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        fontWeight: '500',
        paddingHorizontal: 30,
        lineHeight: 20,
    },
    bentoGrid: {
        gap: 12,
        justifyContent: 'flex-end',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    bentoCard: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardLarge: {
        width: '100%',
        height: height < 700 ? 90 : 110,
    },
    cardSquare: {
        flex: 1,
        aspectRatio: 1,
    },
    cardContent: {
        flex: 1,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardTextContainer: {
        flex: 1,
        marginLeft: 16,
    },
    cardContentSquare: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainerSmall: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    cardLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    cardLabelSmall: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
        textAlign: 'center',
    },
    cardTag: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: 2,
    },
});
