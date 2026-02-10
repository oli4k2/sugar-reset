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
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types';
import { spacing } from '../../theme';
import LooviBackground, { looviColors } from '../../components/LooviBackground';

const graphSource = require('../../../assets/images/illustrations/sugar-reset-graph.png');

type SugarResetGraphScreenProps = {
    navigation: NativeStackNavigationProp<OnboardingStackParamList, 'SugarResetGraph'>;
};

export default function SugarResetGraphScreen({ navigation }: SugarResetGraphScreenProps) {
    const handleContinue = () => {
        navigation.navigate('Goals');
    };

    return (
        <LooviBackground variant="subtle">
            <SafeAreaView style={styles.container}>
                <View style={styles.main}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={styles.title}>From cravings to control</Text>
                        </View>
                        <Image
                            source={graphSource}
                            style={styles.graph}
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
        justifyContent: 'center',
    },
    content: {
        flex: 1,
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
        flex: 1,
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
