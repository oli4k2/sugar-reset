import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing, Text } from 'react-native';
import { looviColors } from './LooviBackground';

const { width, height } = Dimensions.get('window');

interface PlanBuildingAnimationProps {
    onComplete: () => void;
    answers: any;
}

export const PlanBuildingAnimation = ({ onComplete, answers }: PlanBuildingAnimationProps) => {
    const [subline, setSubline] = useState('Analysing responses');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Initial fade in
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        const sequence = [
            { text: 'Analysing responses', duration: 1200 },
            { text: 'Identifying relationships', duration: 1200 },
            { text: 'Detecting behavioral patterns', duration: 1600 },
            { text: 'Building your profile', duration: 2000 },
        ];

        let accumulatedTime = 0;

        // Schedule text updates
        sequence.forEach((step, index) => {
            if (index > 0) { // First text is initial state
                setTimeout(() => {
                    setSubline(step.text);
                }, accumulatedTime);
            }
            accumulatedTime += step.duration;
        });

        // Completion
        const completionTimer = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start(() => onComplete());
        }, accumulatedTime);

        return () => {
            clearTimeout(completionTimer);
        };
    }, []);

    return (
        <View style={styles.fullScreenOverlay}>
            <View style={styles.background} />
            
            <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
                <Text style={styles.headline}>We'll have your results in a moment!</Text>
                
                <View style={styles.loaderContainer}>
                    <ActivityRing />
                </View>

                <Text style={styles.subline}>{subline}</Text>
            </Animated.View>
        </View>
    );
};

const ActivityRing = () => {
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(rotate, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const spin = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View style={[styles.ring, { transform: [{ rotate: spin }] }]}>
            <View style={styles.ringKnob} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    fullScreenOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 250, 245, 0.98)',
    },
    contentContainer: {
        alignItems: 'center',
        paddingHorizontal: 40,
        width: '100%',
    },
    headline: {
        fontSize: 24,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 32,
    },
    loaderContainer: {
        marginBottom: 40,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subline: {
        fontSize: 18,
        fontWeight: '500',
        color: looviColors.text.secondary,
        textAlign: 'center',
        height: 24, // Fixed height to prevent layout shifts
    },
    ring: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 4,
        borderColor: 'rgba(217, 123, 102, 0.2)', // Light primary color
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    ringKnob: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: looviColors.accent.primary,
        marginTop: -6, // Position on the ring
    }
});
