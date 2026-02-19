
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { spacing, colors } from '../theme';
import { Feather } from '@expo/vector-icons';
import LooviBackground from '../components/LooviBackground';
import { GlassCard } from '../components/GlassCard';

export default function PrivacyPolicyScreen() {
    const navigation = useNavigation();

    return (
        <LooviBackground variant="blueRight">
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Privacy Policy</Text>
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                    <GlassCard variant="light" padding="lg" style={styles.card}>
                        <Text style={styles.sectionTitle}>1. Data Storage & Security</Text>
                        <Text style={styles.paragraph}>
                            Your privacy is our top priority. We want to be completely transparent about how your data is handled:
                        </Text>
                        <View style={styles.bulletPoint}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>
                                <Text style={styles.bold}>Google Firebase:</Text> All user profile data is securely stored using Google Firebase, an industry-standard backend platform.
                            </Text>
                        </View>
                        <View style={styles.bulletPoint}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>
                                <Text style={styles.bold}>Password Encryption:</Text> Your passwords are fully encrypted. No one, including our development team, has access to your actual password.
                            </Text>
                        </View>
                        <View style={styles.bulletPoint}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>
                                <Text style={styles.bold}>Community Stats:</Text> Aggregated community statistics are stored to power social features, but these are identified securely.
                            </Text>
                        </View>
                    </GlassCard>

                    <GlassCard variant="light" padding="lg" style={styles.card}>
                        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
                        <Text style={styles.paragraph}>
                            We collect only the information necessary to provide you with a personalized experience:
                        </Text>
                        <Text style={styles.paragraph}>
                            • Account information (email, nickname)
                            {'\n'}• App usage data (streak progress, goals)
                            {'\n'}• Optional mood and craving logs
                        </Text>
                    </GlassCard>

                    <GlassCard variant="light" padding="lg" style={styles.card}>
                        <Text style={styles.sectionTitle}>3. How We Use Your Data</Text>
                        <Text style={styles.paragraph}>
                            Your data is used solely for:
                        </Text>
                        <Text style={styles.paragraph}>
                            • Tracking your sugar-free journey
                            {'\n'}• Personalizing your experience
                            {'\n'}• Improving app performance
                            {'\n'}• Facilitating the community features
                        </Text>
                    </GlassCard>

                    <GlassCard variant="light" padding="lg" style={styles.card}>
                        <Text style={styles.sectionTitle}>4. Data Deletion</Text>
                        <Text style={styles.paragraph}>
                            You have the right to request the deletion of your account and all associated data at any time. You can do this by contacting our support or using the delete account option in the app settings.
                        </Text>
                    </GlassCard>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Last updated: January 2026</Text>
                        <Text style={[styles.footerText, { marginTop: 8 }]}>Contact: hello@craveless.info</Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LooviBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    backButton: {
        padding: spacing.xs,
        marginRight: spacing.md,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text.primary,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: spacing['3xl'],
    },
    card: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000000',
        marginBottom: spacing.md,
    },
    paragraph: {
        fontSize: 15,
        lineHeight: 24,
        color: '#000000',
        marginBottom: spacing.sm,
    },
    bulletPoint: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
        paddingLeft: spacing.sm,
    },
    bullet: {
        fontSize: 15,
        color: '#000000',
        marginRight: spacing.sm,
        marginTop: 2,
    },
    bulletText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 24,
        color: '#000000',
    },
    bold: {
        fontWeight: '600',
        color: '#000000',
    },
    footer: {
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    footerText: {
        fontSize: 13,
        color: colors.text.tertiary,
    },
});
