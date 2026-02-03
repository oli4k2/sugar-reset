
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { spacing, colors } from '../theme';
import { Feather } from '@expo/vector-icons';
import LooviBackground from '../components/LooviBackground';
import { GlassCard } from '../components/GlassCard';

export default function TermsOfServiceScreen() {
    const navigation = useNavigation();

    return (
        <LooviBackground variant="coralRight">
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Terms of Service</Text>
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                    <GlassCard variant="light" padding="lg" style={styles.card}>
                        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                        <Text style={styles.paragraph}>
                            By accessing and using the Craveless application, you accept and agree to be bound by the terms and provision of this agreement.
                        </Text>
                    </GlassCard>

                    <GlassCard variant="light" padding="lg" style={styles.card}>
                        <Text style={styles.sectionTitle}>2. Educational Purpose</Text>
                        <Text style={styles.paragraph}>
                            The content provided in Craveless is for educational and informational purposes only. It is not intended to substitute for professional medical advice, diagnosis, or treatment.
                        </Text>
                        <Text style={styles.paragraph}>
                            Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
                        </Text>
                    </GlassCard>

                    <GlassCard variant="light" padding="lg" style={styles.card}>
                        <Text style={styles.sectionTitle}>3. User Conduct</Text>
                        <Text style={styles.paragraph}>
                            You agree to use the application only for lawful purposes. You are prohibited from posting or transmitting any unlawful, threatening, libelous, defamatory, obscene, or profane material in the community features.
                        </Text>
                    </GlassCard>

                    <GlassCard variant="light" padding="lg" style={styles.card}>
                        <Text style={styles.sectionTitle}>4. Intellectual Property</Text>
                        <Text style={styles.paragraph}>
                            All content included on this app, such as text, graphics, logos, button icons, images, and software, is the property of Craveless or its content suppliers and protected by international copyright laws.
                        </Text>
                    </GlassCard>

                    <GlassCard variant="light" padding="lg" style={styles.card}>
                        <Text style={styles.sectionTitle}>5. Disclaimer of Warranties</Text>
                        <Text style={styles.paragraph}>
                            This app is provided "as is" without any representations or warranties, express or implied. Craveless makes no representations or warranties in relation to this app or the information and materials provided.
                        </Text>
                    </GlassCard>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Last updated: January 2026</Text>
                        <Text style={[styles.footerText, { marginTop: 8 }]}>Contact: hello@scriptcollective.com</Text>
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
    footer: {
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    footerText: {
        fontSize: 13,
        color: colors.text.tertiary,
    },
});
