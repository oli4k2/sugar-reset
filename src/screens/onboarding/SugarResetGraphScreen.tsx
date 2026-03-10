/**
 * SugarResetGraphScreen
 *
 * Shows the sugar reset graph before goals selection.
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    useWindowDimensions,
} from 'react-native';
import { usePostHog } from 'posthog-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types';
import { spacing } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';

import { useUserData } from '../../context/UserDataContext';
import { useEffect } from 'react';

const graphSource = require('../../../assets/images/illustrations/sugar-reset-graph.png');

type SugarResetGraphScreenProps = {
    navigation: NativeStackNavigationProp<OnboardingStackParamList, 'SugarResetGraph'>;
};

// Max content height so layout stays consistent on tablet (iPad) instead of stretching
const MAX_GRAPH_HEIGHT = 380;
const CONTENT_TOP_RATIO = 0.06; // Title ~6% from top for consistent placement across devices

export default function SugarResetGraphScreen({ navigation }: SugarResetGraphScreenProps) {
    const { height: windowHeight } = useWindowDimensions();
    const { setOnboardingCheckpoint } = useUserData();
    const posthog = usePostHog();

    const contentTopPadding = Math.max(spacing.xl, windowHeight * CONTENT_TOP_RATIO);
    const graphMaxHeight = Math.min(windowHeight * 0.42, MAX_GRAPH_HEIGHT);

    useEffect(() => {
        setOnboardingCheckpoint('SugarResetGraph').catch(() => { });
    }, []);
    const handleContinue = () => {
        posthog?.capture('onboarding_graph_completed');
        navigation.navigate('Goals');
    };

    return (
        <LooviBackground variant="subtle">
            <SafeAreaView style={styles.container}>
                <View style={[styles.main, { paddingTop: contentTopPadding }]}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={styles.title}>From cravings to control</Text>
                        </View>
                        <Image
                            source={graphSource}
                            style={[styles.graph, { maxHeight: graphMaxHeight }]}
                            resizeMode="contain"
                        />
                        <Text style={styles.subtitle}>
                            Beat the sugar cycle 82% faster with Craveless.
                        </Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleContinue}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.continueButtonText}>Continue</Text>
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
    main: {
        flex: 1,
    },
    content: {
        paddingHorizontal: spacing.screen.horizontal,
        alignItems: 'center',
        width: '100%',
        paddingVertical: spacing.md,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: looviColors.text.primary,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14.5,
        fontWeight: '600',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    graph: {
        width: '100%',
        marginVertical: spacing.sm,
    },
    footer: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingBottom: spacing.xl,
        paddingTop: spacing.md,
        backgroundColor: 'transparent',
    },
    continueButton: {
        backgroundColor: looviColors.accent.primary,
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: looviColors.coralOrange,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 5,
    },
    continueButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
