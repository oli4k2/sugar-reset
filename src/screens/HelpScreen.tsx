
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { spacing, colors } from '../theme';
import { Feather } from '@expo/vector-icons';
import LooviBackground from '../components/LooviBackground';
import { GlassCard } from '../components/GlassCard';

export default function HelpScreen() {
    const navigation = useNavigation();

    const handleOpenSupport = () => {
        Linking.openURL('https://craveless.info/support');
    };

    const handleEmailSupport = () => {
        Linking.openURL('mailto:hello@craveless.info');
    };

    return (
        <LooviBackground variant="blueRight">
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Help & FAQ</Text>
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                    <GlassCard variant="light" padding="lg" style={styles.card}>
                        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

                        <View style={styles.faqItem}>
                            <Text style={styles.question}>How do I change my plan?</Text>
                            <Text style={styles.answer}>
                                You can change your plan at any time by going to Profile → My Plan and tapping on the "Switch Plan" button.
                            </Text>
                        </View>

                        <View style={styles.faqItem}>
                            <Text style={styles.question}>Can I edit my past logs?</Text>
                            <Text style={styles.answer}>
                                Currently, you can only log data for the current day to ensure accuracy and engagement with the process.
                            </Text>
                        </View>

                        <View style={styles.faqItem}>
                            <Text style={styles.question}>Is my data private?</Text>
                            <Text style={styles.answer}>
                                Yes! Your data is stored securely and we prioritize your privacy. Check our Privacy Policy for more details.
                            </Text>
                        </View>
                    </GlassCard>

                    <GlassCard variant="light" padding="lg" style={styles.card}>
                        <Text style={styles.sectionTitle}>Need More Help?</Text>
                        <Text style={styles.paragraph}>
                            Visit our support page for more answers and to contact our team.
                        </Text>
                        <TouchableOpacity style={styles.emailButton} onPress={handleOpenSupport}>
                            <Feather name="external-link" size={20} color="#FFFFFF" style={styles.emailIcon} />
                            <Text style={styles.emailButtonText}>Visit Support Page</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.emailButton} onPress={handleEmailSupport}>
                            <Feather name="mail" size={20} color="#FFFFFF" style={styles.emailIcon} />
                            <Text style={styles.emailButtonText}>Email: hello@craveless.info</Text>
                        </TouchableOpacity>
                    </GlassCard>
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
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    faqItem: {
        marginBottom: spacing.md,
    },
    question: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: 4,
    },
    answer: {
        fontSize: 14,
        lineHeight: 22,
        color: colors.text.secondary,
    },
    paragraph: {
        fontSize: 15,
        lineHeight: 24,
        color: colors.text.secondary,
        marginBottom: spacing.md,
    },
    emailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.accent.primary,
        paddingVertical: spacing.md,
        borderRadius: 12,
        marginTop: spacing.xs,
    },
    emailIcon: {
        marginRight: spacing.sm,
    },
    emailButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
