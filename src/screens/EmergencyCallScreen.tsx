/**
 * EmergencyCallScreen - Call Emergency Number
 * 
 * Dedicated screen for calling emergency support numbers
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking,
    Alert,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

const calmColors = {
    darkBg: '#1A1A2E',
    darkerBg: '#0F0F1E',
    text: '#E8E8F0',
    textSecondary: '#B0B0C8',
    accent: '#88A4D6',
    cardBg: 'rgba(255, 255, 255, 0.08)',
};

const emergencyContacts = [
    {
        name: 'National Crisis Line',
        number: '988',
        description: '24/7 Mental health and crisis support',
        availability: 'Available 24/7',
    },
    {
        name: 'Crisis Text Line',
        number: 'Text HOME to 741741',
        description: 'Free 24/7 support via text message',
        availability: 'Available 24/7',
        isText: true,
    },
    {
        name: 'SAMHSA Helpline',
        number: '1-800-662-4357',
        description: 'Substance use and mental health support',
        availability: 'Available 24/7',
    },
];

export default function EmergencyCallScreen() {
    const navigation = useNavigation();

    const handleCall = (contact: typeof emergencyContacts[0]) => {
        if (contact.isText) {
            Alert.alert(
                'Text Support',
                'Text "HOME" to 741741 to connect with a crisis counselor',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Open Messages', onPress: () => Linking.openURL('sms:741741&body=HOME') }
                ]
            );
        } else {
            Alert.alert(
                `Call ${contact.name}?`,
                `You'll be connected to ${contact.name}`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Call Now', onPress: () => Linking.openURL(`tel:${contact.number}`) }
                ]
            );
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[calmColors.darkerBg, calmColors.darkBg, calmColors.darkerBg]}
                locations={[0, 0.5, 1]}
                style={styles.gradient}
            />

            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Feather name="arrow-left" size={24} color={calmColors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Emergency Support</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <View style={styles.iconBg}>
                            <Feather name="phone" size={48} color={calmColors.accent} />
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Professional Support</Text>
                    <Text style={styles.subtitle}>
                        Trained counselors are available 24/7 to help you through this.
                    </Text>

                    {/* Emergency Contacts */}
                    <View style={styles.contactsContainer}>
                        {emergencyContacts.map((contact, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.contactCard}
                                onPress={() => handleCall(contact)}
                                activeOpacity={0.85}
                            >
                                <View style={styles.contactIcon}>
                                    <Feather 
                                        name={contact.isText ? "message-circle" : "phone"} 
                                        size={24} 
                                        color={calmColors.accent} 
                                    />
                                </View>
                                <View style={styles.contactInfo}>
                                    <Text style={styles.contactName}>{contact.name}</Text>
                                    <Text style={styles.contactNumber}>{contact.number}</Text>
                                    <Text style={styles.contactDescription}>{contact.description}</Text>
                                    <View style={styles.availabilityBadge}>
                                        <View style={styles.availabilityDot} />
                                        <Text style={styles.availabilityText}>{contact.availability}</Text>
                                    </View>
                                </View>
                                <Feather name="arrow-right" size={20} color={calmColors.textSecondary} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Reminder */}
                    <View style={styles.reminderCard}>
                        <Feather name="info" size={20} color={calmColors.accent} style={{ marginRight: spacing.md }} />
                        <Text style={styles.reminderText}>
                            These services are free, confidential, and available anytime you need support.
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: calmColors.darkerBg,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: calmColors.text,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        paddingBottom: spacing.xxl,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: spacing.xl,
    },
    iconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: calmColors.cardBg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: calmColors.accent,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: calmColors.text,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: calmColors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: spacing.xxl,
    },
    contactsContainer: {
        width: '100%',
        marginBottom: spacing.xl,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: calmColors.cardBg,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    contactIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(136, 164, 214, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '700',
        color: calmColors.text,
        marginBottom: 2,
    },
    contactNumber: {
        fontSize: 15,
        fontWeight: '600',
        color: calmColors.accent,
        marginBottom: 4,
    },
    contactDescription: {
        fontSize: 13,
        color: calmColors.textSecondary,
        marginBottom: spacing.xs,
    },
    availabilityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    availabilityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#7FB069',
        marginRight: 6,
    },
    availabilityText: {
        fontSize: 12,
        fontWeight: '500',
        color: calmColors.textSecondary,
    },
    reminderCard: {
        flexDirection: 'row',
        backgroundColor: calmColors.cardBg,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(136, 164, 214, 0.2)',
    },
    reminderText: {
        flex: 1,
        fontSize: 14,
        color: calmColors.textSecondary,
        lineHeight: 20,
    },
});



