/**
 * WelcomeScreen
 * 
 * First screen: Animated logo splash, then main content.
 * Shows SugarReset logo with fade animation for 2 seconds,
 * then reveals Get Started / Log In buttons.
 */

import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Image,
    Dimensions,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';
import { useUserData } from '../../context/UserDataContext';

type WelcomeScreenProps = {
    navigation: NativeStackNavigationProp<any, 'Welcome'>;
};

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
    const [showSplash, setShowSplash] = useState(true);

    // Splash animations
    const logoFade = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.8)).current;
    const splashOpacity = useRef(new Animated.Value(1)).current;

    // Content animations
    const contentFade = useRef(new Animated.Value(0)).current;
    const contentSlide = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        // Phase 1: Animate logo (fade in + scale up)
        Animated.sequence([
            Animated.delay(200),
            Animated.parallel([
                Animated.timing(logoFade, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.spring(logoScale, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]),
            // Phase 2: Hold for a moment
            Animated.delay(2500),
            // Phase 3: Fade out splash
            Animated.timing(splashOpacity, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Automatically navigate to QuizIntro after splash
            navigation.navigate('QuizIntro');
        });
    }, []);

    const handleLogin = () => {
        navigation.navigate('Auth' as any, {
            screen: 'Login',
            params: { fromOnboardingWelcome: true },
        });
    };

    return (
        <LooviBackground variant="mixed">
            {/* Splash Screen with Logo Animation */}
            <Animated.View style={[styles.splashContainer, { opacity: splashOpacity }]}>
                <Animated.Image
                    source={require('../../../assets/images/craveless-logo.png')}
                    style={[
                        styles.splashLogo,
                        {
                            opacity: logoFade,
                            transform: [{ scale: logoScale }],
                        },
                    ]}
                    resizeMode="contain"
                />
            </Animated.View>
        </LooviBackground>
    );
}

const styles = StyleSheet.create({
    // Splash Screen
    splashContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    splashLogo: {
        width: width * 0.7,
        height: width * 0.4,
    },
});
