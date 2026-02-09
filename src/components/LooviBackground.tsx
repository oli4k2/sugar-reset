/**
 * LooviBackground
 * 
 * A modern, calming background with organic gradient blobs
 * inspired by loovi health Instagram aesthetic.
 * Features matte coral/orange and sky blue colors with
 * ultra-soft, organic gradient transitions that blend seamlessly.
 * Includes floating particles and subtle grain texture.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Loovi-inspired color palette
export const looviColors = {
    // Main background - light warm gray/beige
    background: '#F5F0EB',

    // Blob colors - matte, soft
    coralOrange: '#E8A87C',      // Matte peachy coral
    coralDark: '#D4896A',        // Darker coral
    coralSoft: '#EEC4A0',        // Softer coral
    skyBlue: '#A8D8E8',          // Matte sky blue
    skyBlueSoft: '#C5E4F0',      // Softer sky blue
    skyBlueDark: '#7BC0D4',      // Deeper sky blue
    warmBeige: '#F2E4D8',        // Warm beige transition

    // Text colors - optimized for loovi palette
    text: {
        primary: '#2D2D2D',       // Almost black, excellent contrast
        secondary: '#4A4A4A',     // Dark gray for body text
        tertiary: '#6B6B6B',      // Medium gray for captions
        muted: '#9A9A9A',         // Light gray for hints
        light: '#FFFFFF',         // White for dark backgrounds
        onDark: '#FFFFFF',        // White on dark
        coral: '#C97B5D',         // Coral accent text
        blue: '#5BA3B8',          // Blue accent text
    },

    // Accent for buttons
    accent: {
        primary: '#E8A87C',       // Coral as primary action
        secondary: '#A8D8E8',     // Blue as secondary
        success: '#7FB069',       // Soft green
        warning: '#F5B461',       // Warm amber/orange
        error: '#E57373',         // Soft red
    },

    // Glass card styles
    glass: {
        background: 'rgba(255, 255, 255, 0.65)',
        border: 'rgba(255, 255, 255, 0.8)',
        light: 'rgba(255, 255, 255, 0.4)',
        borderLight: 'rgba(255, 255, 255, 0.5)',
    },
};

// Floating particle component
const PARTICLE_COUNT = 30;

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
}

const generateParticles = (): Particle[] => {
    return Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
        id: i,
        x: Math.random() * SCREEN_WIDTH,
        y: Math.random() * SCREEN_HEIGHT,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 8000 + 6000,
        delay: Math.random() * 3000,
    }));
};

const particles = generateParticles();

function FloatingParticle({ particle }: { particle: Particle }) {
    const translateY = useRef(new Animated.Value(0)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = () => {
            translateY.setValue(0);
            translateX.setValue(0);
            opacity.setValue(0);

            Animated.sequence([
                Animated.delay(particle.delay),
                Animated.parallel([
                    Animated.timing(translateY, {
                        toValue: -80 - Math.random() * 60,
                        duration: particle.duration,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateX, {
                        toValue: (Math.random() - 0.5) * 80,
                        duration: particle.duration,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.sequence([
                        Animated.timing(opacity, {
                            toValue: 0.6,
                            duration: particle.duration * 0.2,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacity, {
                            toValue: 0.6,
                            duration: particle.duration * 0.5,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacity, {
                            toValue: 0,
                            duration: particle.duration * 0.3,
                            useNativeDriver: true,
                        }),
                    ]),
                ]),
            ]).start(() => animate());
        };

        animate();
    }, []);

    return (
        <Animated.View
            style={[
                styles.particle,
                {
                    left: particle.x,
                    top: particle.y,
                    width: particle.size,
                    height: particle.size,
                    opacity,
                    transform: [{ translateY }, { translateX }],
                },
            ]}
        />
    );
}

// Background variant types for different screens
export type BackgroundVariant =
    | 'coralTop'        // Coral blob at top, blue at bottom
    | 'coralBottom'     // Coral blob at bottom, blue at top
    | 'coralLeft'       // Coral on left side
    | 'blueTop'         // Blue dominant at top
    | 'blueBottom'      // Blue at bottom
    | 'mixed'           // Both colors mixed organically
    | 'subtle'          // Very subtle, mostly beige
    | 'coralDominant'   // Large coral presence
    | 'blueDominant'   // Large blue presence
    | 'blueRight'      // Blue on right side
    | 'coralRight'     // Coral on right side
    | 'solidCrimson'   // Solid #B22222 (Deep Crimson) - for high-impact danger slides
    | 'solidNavy'      // Solid #1A237E (Deep Navy) - for recovery/hope slides
    | 'white';         // Clean white background - for minimal screens like paywall

interface LooviBackgroundProps {
    children?: React.ReactNode;
    variant?: BackgroundVariant;
    showParticles?: boolean;
}

export default function LooviBackground({
    children,
    variant = 'coralTop',
    showParticles = true,
}: LooviBackgroundProps) {

    const renderVariant = () => {
        switch (variant) {
            case 'coralTop':
                return (
                    <>
                        {/* Large coral gradient from top-left corner */}
                        <LinearGradient
                            colors={[
                                'rgba(232, 168, 124, 0.95)',
                                'rgba(238, 196, 160, 0.7)',
                                'rgba(242, 228, 216, 0.4)',
                                'rgba(245, 240, 235, 0.1)',
                                'transparent',
                            ]}
                            locations={[0, 0.2, 0.4, 0.6, 1]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0.8 }}
                            style={styles.gradient}
                        />
                        {/* Subtle blue wash at bottom */}
                        <LinearGradient
                            colors={[
                                'transparent',
                                'transparent',
                                'rgba(197, 228, 240, 0.2)',
                                'rgba(168, 216, 232, 0.35)',
                            ]}
                            locations={[0, 0.5, 0.75, 1]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradient}
                        />
                    </>
                );

            case 'coralBottom':
                return (
                    <>
                        {/* Coral from bottom-left */}
                        <LinearGradient
                            colors={[
                                'transparent',
                                'transparent',
                                'rgba(238, 196, 160, 0.5)',
                                'rgba(232, 168, 124, 0.85)',
                            ]}
                            locations={[0, 0.4, 0.7, 1]}
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.gradient}
                        />
                        {/* Light blue wash at top */}
                        <LinearGradient
                            colors={[
                                'rgba(168, 216, 232, 0.35)',
                                'rgba(197, 228, 240, 0.2)',
                                'transparent',
                                'transparent',
                            ]}
                            locations={[0, 0.25, 0.5, 1]}
                            start={{ x: 1, y: 0 }}
                            end={{ x: 0, y: 0.6 }}
                            style={styles.gradient}
                        />
                    </>
                );

            case 'coralLeft':
                return (
                    <>
                        {/* Coral from left side */}
                        <LinearGradient
                            colors={[
                                'rgba(232, 168, 124, 0.9)',
                                'rgba(238, 196, 160, 0.6)',
                                'rgba(242, 228, 216, 0.3)',
                                'transparent',
                            ]}
                            locations={[0, 0.25, 0.5, 1]}
                            start={{ x: 0, y: 0.3 }}
                            end={{ x: 1, y: 0.5 }}
                            style={styles.gradient}
                        />
                        {/* Blue accent bottom-right */}
                        <LinearGradient
                            colors={[
                                'transparent',
                                'transparent',
                                'rgba(168, 216, 232, 0.25)',
                                'rgba(168, 216, 232, 0.4)',
                            ]}
                            locations={[0, 0.5, 0.75, 1]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradient}
                        />
                    </>
                );

            case 'blueTop':
                return (
                    <>
                        {/* Blue from top */}
                        <LinearGradient
                            colors={[
                                'rgba(168, 216, 232, 0.85)',
                                'rgba(197, 228, 240, 0.6)',
                                'rgba(197, 228, 240, 0.3)',
                                'transparent',
                            ]}
                            locations={[0, 0.25, 0.45, 1]}
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 0.7 }}
                            style={styles.gradient}
                        />
                        {/* Coral at bottom */}
                        <LinearGradient
                            colors={[
                                'transparent',
                                'transparent',
                                'rgba(238, 196, 160, 0.25)',
                                'rgba(232, 168, 124, 0.5)',
                            ]}
                            locations={[0, 0.5, 0.75, 1]}
                            start={{ x: 0.5, y: 0.4 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.gradient}
                        />
                    </>
                );

            case 'blueBottom':
                return (
                    <>
                        {/* Subtle coral top */}
                        <LinearGradient
                            colors={[
                                'rgba(232, 168, 124, 0.3)',
                                'rgba(238, 196, 160, 0.15)',
                                'transparent',
                                'transparent',
                            ]}
                            locations={[0, 0.25, 0.5, 1]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0.5 }}
                            style={styles.gradient}
                        />
                        {/* Blue from bottom */}
                        <LinearGradient
                            colors={[
                                'transparent',
                                'transparent',
                                'rgba(197, 228, 240, 0.4)',
                                'rgba(168, 216, 232, 0.7)',
                            ]}
                            locations={[0, 0.4, 0.7, 1]}
                            start={{ x: 0.5, y: 0.3 }}
                            end={{ x: 0.5, y: 1 }}
                            style={styles.gradient}
                        />
                    </>
                );

            case 'mixed':
                return (
                    <>
                        {/* Coral from top-left corner - larger spread */}
                        <LinearGradient
                            colors={[
                                'rgba(232, 168, 124, 0.9)',
                                'rgba(238, 196, 160, 0.6)',
                                'rgba(242, 228, 216, 0.3)',
                                'transparent',
                            ]}
                            locations={[0, 0.25, 0.5, 1]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0.9, y: 0.7 }}
                            style={styles.gradient}
                        />
                        {/* Blue from bottom-right - overlapping blend */}
                        <LinearGradient
                            colors={[
                                'transparent',
                                'transparent',
                                'rgba(197, 228, 240, 0.35)',
                                'rgba(168, 216, 232, 0.65)',
                            ]}
                            locations={[0, 0.35, 0.65, 1]}
                            start={{ x: 0, y: 0.3 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradient}
                        />
                    </>
                );

            case 'subtle':
                return (
                    <>
                        {/* Very subtle coral wash */}
                        <LinearGradient
                            colors={[
                                'rgba(232, 168, 124, 0.18)',
                                'rgba(242, 228, 216, 0.12)',
                                'transparent',
                            ]}
                            locations={[0, 0.4, 1]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0.5 }}
                            style={styles.gradient}
                        />
                        {/* Very subtle blue */}
                        <LinearGradient
                            colors={[
                                'transparent',
                                'rgba(168, 216, 232, 0.12)',
                            ]}
                            locations={[0, 1]}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradient}
                        />
                    </>
                );

            case 'coralDominant':
                return (
                    <>
                        {/* Large coral presence */}
                        <LinearGradient
                            colors={[
                                'rgba(232, 168, 124, 0.9)',
                                'rgba(238, 196, 160, 0.7)',
                                'rgba(238, 196, 160, 0.5)',
                                'rgba(242, 228, 216, 0.3)',
                            ]}
                            locations={[0, 0.3, 0.55, 1]}
                            start={{ x: 0.2, y: 0 }}
                            end={{ x: 0.8, y: 1 }}
                            style={styles.gradient}
                        />
                        {/* Subtle blue edge */}
                        <LinearGradient
                            colors={[
                                'transparent',
                                'transparent',
                                'rgba(168, 216, 232, 0.2)',
                            ]}
                            locations={[0, 0.7, 1]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradient}
                        />
                    </>
                );



            case 'blueRight':
                return (
                    <>
                        {/* Blue from right side */}
                        <LinearGradient
                            colors={[
                                'rgba(168, 216, 232, 0.9)',
                                'rgba(197, 228, 240, 0.6)',
                                'rgba(197, 228, 240, 0.3)',
                                'transparent',
                            ]}
                            locations={[0, 0.25, 0.5, 1]}
                            start={{ x: 1, y: 0.3 }}
                            end={{ x: 0, y: 0.5 }}
                            style={styles.gradient}
                        />
                        {/* Coral accent bottom-left */}
                        <LinearGradient
                            colors={[
                                'transparent',
                                'transparent',
                                'rgba(232, 168, 124, 0.25)',
                                'rgba(238, 196, 160, 0.4)',
                            ]}
                            locations={[0, 0.5, 0.75, 1]}
                            start={{ x: 1, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.gradient}
                        />
                    </>
                );

            case 'coralRight':
                return (
                    <>
                        {/* Coral from right side */}
                        <LinearGradient
                            colors={[
                                'rgba(232, 168, 124, 0.9)',
                                'rgba(238, 196, 160, 0.6)',
                                'rgba(242, 228, 216, 0.3)',
                                'transparent',
                            ]}
                            locations={[0, 0.25, 0.5, 1]}
                            start={{ x: 1, y: 0.3 }}
                            end={{ x: 0, y: 0.5 }}
                            style={styles.gradient}
                        />
                        {/* Blue accent bottom-left */}
                        <LinearGradient
                            colors={[
                                'transparent',
                                'transparent',
                                'rgba(168, 216, 232, 0.25)',
                                'rgba(168, 216, 232, 0.4)',
                            ]}
                            locations={[0, 0.5, 0.75, 1]}
                            start={{ x: 1, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.gradient}
                        />
                    </>
                );

            case 'blueDominant':
                return (
                    <>
                        {/* Large blue presence */}
                        <LinearGradient
                            colors={[
                                'rgba(168, 216, 232, 0.8)',
                                'rgba(197, 228, 240, 0.6)',
                                'rgba(197, 228, 240, 0.35)',
                                'rgba(245, 240, 235, 0.1)',
                            ]}
                            locations={[0, 0.3, 0.55, 1]}
                            start={{ x: 0.8, y: 0 }}
                            end={{ x: 0.2, y: 1 }}
                            style={styles.gradient}
                        />
                        {/* Subtle coral accent */}
                        <LinearGradient
                            colors={[
                                'transparent',
                                'transparent',
                                'rgba(232, 168, 124, 0.25)',
                                'rgba(238, 196, 160, 0.4)',
                            ]}
                            locations={[0, 0.5, 0.75, 1]}
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.gradient}
                        />
                    </>
                );

            case 'solidCrimson':
                // Solid Deep Crimson background (#B22222) for high-impact danger slides
                return (
                    <View style={[styles.gradient, { backgroundColor: '#B22222' }]} />
                );

            case 'solidNavy':
                // Solid Deep Navy background (#1A237E) for recovery/hope slides
                return (
                    <View style={[styles.gradient, { backgroundColor: '#1A237E' }]} />
                );

            case 'white':
                // Clean white background for minimal screens like paywall
                return (
                    <View style={[styles.gradient, { backgroundColor: '#FFFFFF' }]} />
                );

            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            {/* Base background */}
            <View style={styles.baseBackground} />

            {/* Gradient layers */}
            {renderVariant()}

            {/* Subtle grain overlay */}
            <View style={styles.grain} />

            {/* Floating particles */}
            {showParticles && particles.map((particle) => (
                <FloatingParticle key={particle.id} particle={particle} />
            ))}

            {/* Content */}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: looviColors.background,
    },
    baseBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: looviColors.background,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    grain: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.03,
        backgroundColor: 'transparent',
        // Create grain effect using a repeating pattern
        // This is subtle and adds texture
    },
    particle: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 999,
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
        zIndex: 5,
    },
    content: {
        flex: 1,
        zIndex: 10,
    },
});
