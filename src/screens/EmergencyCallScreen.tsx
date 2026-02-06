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

const THEME = {
    bgColors: ['#0F172A', '#1E1B4B'],
    accent: '#818CF8',
    text: '#F8FAFC',
    textDim: '#94A3B8',
    cardBg: 'rgba(255, 255, 255, 0.05)',
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
    const navigation = useNavigation<any>();

    const handleCall = (contact: typeof emergencyContacts[0]) => {
        // ... (existing alert logic)
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
            <LinearGradient colors={THEME.bgColors as any} style={StyleSheet.absoluteFillObject} />

            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                {/* Unified Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                        <Feather name="x" size={24} color={THEME.textDim} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>EMERGENCY</Text>
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
                            <Feather name="phone" size={48} color={THEME.accent} />
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
                                        color={THEME.accent}
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
                                <Feather name="arrow-right" size={20} color={THEME.textDim} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Reminder */}
                    <View style={styles.reminderCard}>
                        <Feather name="info" size={20} color={THEME.accent} style={{ marginRight: spacing.md }} />
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
        backgroundColor: '#0F172A',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 60,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 2,
        color: '#FFF',
    },
    iconBtn: {
        padding: 8,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 30,
        paddingTop: 20,
        paddingBottom: 40,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: spacing.xl,
    },
    iconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: THEME.cardBg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: THEME.accent,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: THEME.text,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: THEME.textDim,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    contactsContainer: {
        width: '100%',
        marginBottom: spacing.xl,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.cardBg,
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    contactIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '700',
        color: THEME.text,
        marginBottom: 2,
    },
    contactNumber: {
        fontSize: 15,
        fontWeight: '600',
        color: THEME.accent,
        marginBottom: 4,
    },
    contactDescription: {
        fontSize: 13,
        color: THEME.textDim,
        marginBottom: 8,
    },
    availabilityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    availabilityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#34D399',
        marginRight: 6,
    },
    availabilityText: {
        fontSize: 12,
        fontWeight: '500',
        color: THEME.textDim,
    },
    reminderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 20,
        width: '100%',
    },
    reminderText: {
        flex: 1,
        fontSize: 14,
        color: THEME.textDim,
        lineHeight: 20,
    },
});


