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
    const { updateOnboardingData, completeOnboarding, onboardingData } = useUserData();
    const nickname = route.params?.nickname || onboardingData?.nickname || 'Friend';
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const [hasSignature, setHasSignature] = useState(false);
    const [scrollEnabled, setScrollEnabled] = useState(true);

    // #region agent log
    useEffect(() => {
        fetch('http://127.0.0.1:7247/ingest/b38713cc-db3b-41be-bf27-fcffc891ae5f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PromiseScreen.tsx:scrollEnabled',message:'scrollEnabled changed',data:{scrollEnabled},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2,H4'})}).catch(()=>{});
    }, [scrollEnabled]);
    // #endregion

    // #region agent log
    useEffect(() => {
        fetch('http://127.0.0.1:7247/ingest/b38713cc-db3b-41be-bf27-fcffc891ae5f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PromiseScreen.tsx:hasSignature',message:'hasSignature changed',data:{hasSignature},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5,H8'})}).catch(()=>{});
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
        // Mark promise as confirmed and complete onboarding
        await updateOnboardingData({ promiseConfirmed: true });
        await completeOnboarding();
        navigation.navigate('Paywall');
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
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Make a promise, {nickname}</Text>
                        </View>

                        {/* Promise Card */}
                        <GlassCard variant="light" padding="lg" style={styles.promiseCard}>
                            <Text style={styles.promiseTitle}>My Promise</Text>

                            <Text style={styles.promiseText}>
                                I, <Text style={styles.highlight}>{nickname}</Text>, promise to choose{' '}
                                <Text style={styles.highlight}>health</Text> over quick fixes.
                            </Text>

                            <Text style={styles.promiseText}>
                                I choose <Text style={styles.highlight}>energy and clarity</Text> over
                                sugar crashes and brain fog.
                            </Text>

                            <Text style={styles.promiseText}>
                                I choose my <Text style={styles.highlight}>future self</Text> over
                                momentary temptations.
                            </Text>

                            <Text style={styles.promiseText}>
                                I choose <Text style={styles.highlight}>healthy habits</Text> that
                                serve my goals and dreams.
                            </Text>

                        </GlassCard>

                        {/* Signature Field */}
                        <View style={styles.signatureSection}>
                            <SignatureField 
                                onSignatureChange={(hasSignature) => {
                                    // #region agent log
                                    fetch('http://127.0.0.1:7247/ingest/b38713cc-db3b-41be-bf27-fcffc891ae5f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PromiseScreen.tsx:onSignatureChange',message:'onSignatureChange callback',data:{hasSignature},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5,H8'})}).catch(()=>{});
                                    // #endregion
                                    setHasSignature(hasSignature);
                                }}
                                onBegin={() => {
                                    // #region agent log
                                    fetch('http://127.0.0.1:7247/ingest/b38713cc-db3b-41be-bf27-fcffc891ae5f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PromiseScreen.tsx:onBegin',message:'onBegin callback',data:{scrollEnabledBefore:scrollEnabled},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2'})}).catch(()=>{});
                                    // #endregion
                                    setScrollEnabled(false);
                                }}
                                onEnd={() => {
                                    // #region agent log
                                    fetch('http://127.0.0.1:7247/ingest/b38713cc-db3b-41be-bf27-fcffc891ae5f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PromiseScreen.tsx:onEnd',message:'onEnd callback',data:{scrollEnabledBefore:scrollEnabled},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2'})}).catch(()=>{});
                                    // #endregion
                                    setScrollEnabled(true);
                                }}
                            />
                        </View>
                    </Animated.View>
                </ScrollView>

                {/* Save Button */}
                {hasSignature && (
                    <View style={styles.bottomContainer}>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleMakePromise}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                )}
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
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
    },
    content: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    promiseCard: {
        marginBottom: spacing.xl,
    },
    promiseTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: looviColors.accent.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    promiseText: {
        fontSize: 17,
        fontWeight: '400',
        color: looviColors.text.secondary,
        lineHeight: 26,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    highlight: {
        fontWeight: '700',
        color: looviColors.text.primary,
    },
    signatureSection: {
        marginTop: spacing.lg,
        marginBottom: spacing.xl,
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
    saveButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
