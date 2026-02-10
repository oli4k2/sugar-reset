/**
 * PromiseScreen
 * 
 * User makes a personal promise/commitment to themselves.
 */

import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { spacing, borderRadius } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';
import { GlassCard } from '../../components/GlassCard';
import { useUserData } from '../../context/UserDataContext';
import SignatureField from '../../components/SignatureField';

type PromiseScreenProps = {
    navigation: NativeStackNavigationProp<any, 'Promise'>;
    route: RouteProp<{ Promise: { nickname?: string } }, 'Promise'>;
};

export default function PromiseScreen({ navigation, route }: PromiseScreenProps) {
    const { updateOnboardingData, onboardingData, setOnboardingCheckpoint } = useUserData();
    const nickname = route.params?.nickname || onboardingData?.nickname || 'Friend';
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const [hasSignature, setHasSignature] = useState(false);
    const [scrollEnabled, setScrollEnabled] = useState(true);

    // #region agent log
    useEffect(() => {
        fetch('http://127.0.0.1:7247/ingest/b38713cc-db3b-41be-bf27-fcffc891ae5f', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'PromiseScreen.tsx:scrollEnabled', message: 'scrollEnabled changed', data: { scrollEnabled }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H2,H4' }) }).catch(() => { });
    }, [scrollEnabled]);
    // #endregion

    // #region agent log
    useEffect(() => {
        fetch('http://127.0.0.1:7247/ingest/b38713cc-db3b-41be-bf27-fcffc891ae5f', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'PromiseScreen.tsx:hasSignature', message: 'hasSignature changed', data: { hasSignature }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H5,H8' }) }).catch(() => { });
    }, [hasSignature]);
    // #endregion

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleMakePromise = async () => {
        // Mark promise as confirmed and set the journey start date (without completing onboarding yet)
        await updateOnboardingData({
            promiseConfirmed: true,
            startDate: onboardingData.startDate || new Date().toISOString(),
        });

        // Save a resume checkpoint so if the app closes, they restart from here (not Auth)
        await setOnboardingCheckpoint('PersonalizedPlan');
        navigation.navigate('PersonalizedPlan');
    };

    return (
        <LooviBackground variant="blueDominant">
            <SafeAreaView style={styles.container}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={scrollEnabled}
                    nestedScrollEnabled={false}
                >
                    <Animated.View
                        style={[
                            styles.content,
                            {
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }],
                            },
                        ]}
                    >
                        {/* 1. Header Title */}
                        <Text style={styles.title}>Sign your commitment</Text>

                        {/* 2. Commitment Statement - Centered above signature */}
                        <View style={styles.statementContainer}>
                            <Text style={styles.simplePromiseText}>
                                I, <Text style={styles.highlight}>{nickname}</Text>, commit to prioritizing my health and breaking the cycle.
                            </Text>
                        </View>

                        {/* 3. Signature Field - The Hero Element */}
                        <View style={styles.signatureSection}>
                            <SignatureField
                                key="signature-300"
                                label={`Sign here, ${nickname}`}
                                onSignatureChange={(hasSignature) => {
                                    // #region agent log
                                    fetch('http://127.0.0.1:7247/ingest/b38713cc-db3b-41be-bf27-fcffc891ae5f', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'PromiseScreen.tsx:onSignatureChange', message: 'onSignatureChange callback', data: { hasSignature }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H5,H8' }) }).catch(() => { });
                                    // #endregion
                                    setHasSignature(hasSignature);
                                }}
                                onBegin={() => {
                                    // #region agent log
                                    fetch('http://127.0.0.1:7247/ingest/b38713cc-db3b-41be-bf27-fcffc891ae5f', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'PromiseScreen.tsx:onBegin', message: 'onBegin callback', data: { scrollEnabledBefore: scrollEnabled }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H1,H2' }) }).catch(() => { });
                                    // #endregion
                                    setScrollEnabled(false);
                                }}
                                onEnd={() => {
                                    // #region agent log
                                    fetch('http://127.0.0.1:7247/ingest/b38713cc-db3b-41be-bf27-fcffc891ae5f', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'PromiseScreen.tsx:onEnd', message: 'onEnd callback', data: { scrollEnabledBefore: scrollEnabled }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H1,H2' }) }).catch(() => { });
                                    // #endregion
                                    setScrollEnabled(true);
                                }}
                            />
                        </View>
                    </Animated.View>
                </ScrollView>

                {/* Save Button - Always present to prevent layout shift */}
                <View style={styles.bottomContainer}>
                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            !hasSignature && styles.saveButtonHidden
                        ]}
                        onPress={handleMakePromise}
                        disabled={!hasSignature}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LooviBackground>
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
        paddingBottom: spacing.lg,
        flexGrow: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 50,
        paddingBottom: 80, // Visual offset to account for bottom button area
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        letterSpacing: -0.5,
        marginTop: spacing['3xl'], // Push down from top
        marginBottom: spacing.xl,
    },
    statementContainer: {
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        marginBottom: spacing['3xl'], // Push signature down
    },
    simplePromiseText: {
        fontSize: 21,
        fontWeight: '600',
        color: looviColors.text.primary,
        lineHeight: 32,
        textAlign: 'center',
    },
    highlight: {
        fontWeight: '800',
        color: looviColors.accent.primary,
    },
    signatureSection: {
        width: '100%',
        alignItems: 'center',
    },
    bottomContainer: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingTop: spacing.md,
        paddingBottom: spacing['2xl'],
    },
    saveButton: {
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: looviColors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
    },
    saveButtonHidden: {
        opacity: 0,
        pointerEvents: 'none',
    },
    saveButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
