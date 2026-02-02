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
    ScrollView,
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
                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>
                        <Image
                            source={graphSource}
                            style={styles.graph}
                            resizeMode="contain"
                        />
                        <Text style={styles.subtitle}>
                            Beat the sugar cycle 82% faster with Craveless.
                        </Text>
                    </View>
                </ScrollView>

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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingBottom: 100,
    },
    content: {
        paddingHorizontal: spacing.screen.horizontal,
        alignItems: 'center',
    },
    subtitle: {
        fontSize: 14.5,
        fontWeight: '600',
        color: looviColors.text.primary,
        textAlign: 'center',
        marginTop: spacing['3xl'],
    },
    graph: {
        width: '85%',
        height: 280,
    },
    footer: {
        paddingHorizontal: spacing.screen.horizontal,
        paddingBottom: spacing.xl,
        paddingTop: spacing.md,
        backgroundColor: 'rgba(255,250,245,0.95)',
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
