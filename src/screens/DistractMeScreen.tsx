/**
 * DistractMeScreen - Distraction Options
 * 
 * Dedicated screen for distraction activities during cravings
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
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
    accent: '#F5B461',
    cardBg: 'rgba(255, 255, 255, 0.08)',
};

const distractions = [
    {
        id: 'breathing',
        icon: 'wind' as const,
        title: 'Breathing Exercise',
        description: 'Calm your mind with guided breathing',
        screen: 'BreathingExercise',
        color: '#88A4D6',
    },
    {
        id: 'walk',
        icon: 'navigation' as const,
        title: 'Quick 5-Minute Walk',
        description: 'Movement reduces cravings by 50%',
        shortDesc: '5 min movement',
        action: 'timer',
        color: '#7FB069',
    },
    {
        id: 'water',
        icon: 'droplet' as const,
        title: 'Drink Water Challenge',
        description: 'Finish a full glass, then reassess',
        shortDesc: '1 big glass',
        action: 'challenge',
        color: '#88A4D6',
    },
    {
        id: 'call',
        icon: 'phone' as const,
        title: 'Call a Friend',
        description: 'A quick chat can shift your mindset',
        shortDesc: '2 min connection',
        action: 'call',
        color: '#C997A8',
    },
    {
        id: 'music',
        icon: 'music' as const,
        title: 'Listen to Music',
        description: 'Put on your favorite uplifting song',
        shortDesc: '1 upbeat song',
        action: 'music',
        color: '#F5B461',
    },
];

const THEME = {
    bgColors: ['#0F172A', '#1E1B4B'],
    accent: '#818CF8',
    text: '#F8FAFC',
    textDim: '#94A3B8',
    cardBg: 'rgba(255, 255, 255, 0.05)',
};

export default function DistractMeScreen() {
    const navigation = useNavigation<any>();

    const handleDistractionSelect = (distraction: typeof distractions[0]) => {
        if (distraction.screen) {
            navigation.navigate(distraction.screen);
        } else {
            // Navigate to unified task screen instead of system alert
            navigation.navigate('DistractionTask', { taskId: distraction.id });
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={THEME.bgColors as any}
                style={StyleSheet.absoluteFillObject}
            />

            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                {/* Unified Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                        <Feather name="x" size={24} color={THEME.textDim} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>DISTRACT ME</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Compact Title Area */}
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Choose a Distraction</Text>
                        <Text style={styles.subtitle}>
                            Shift your focus for just a few minutes. Cravings typically pass quickly.
                        </Text>
                    </View>

                    {/* Hero Tool: Breathing (Interactive) */}
                    <TouchableOpacity
                        style={styles.heroCard}
                        onPress={() => navigation.navigate('BreathingExercise')}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['rgba(99, 102, 241, 0.2)', 'rgba(67, 56, 202, 0.1)']}
                            style={StyleSheet.absoluteFillObject}
                        />
                        <View style={styles.heroIconBg}>
                            <Feather name="wind" size={32} color="#818CF8" />
                        </View>
                        <View style={styles.heroInfo}>
                            <Text style={styles.heroLabel}>PRIMARY TOOL</Text>
                            <Text style={styles.heroTitle}>Breathing Exercise</Text>
                            <Text style={styles.heroDesc}>A 4-minute guided session to reset your neurochemistry.</Text>
                        </View>
                        <Feather name="chevron-right" size={24} color="#818CF8" />
                    </TouchableOpacity>

                    {/* Compact 2x2 Suggestions Grid */}
                    <View style={styles.gridSection}>
                        <Text style={styles.sectionLabel}>QUICK SUGGESTIONS</Text>
                        <View style={styles.suggestionList}>
                            {distractions.filter(d => d.id !== 'breathing').map((item: any) => (
                                <View key={item.id} style={styles.suggestionItem}>
                                    <View style={[styles.suggestionIcon, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                                        <Feather name={item.icon} size={20} color={THEME.textDim} />
                                    </View>
                                    <Text style={styles.suggestionTitle}>{item.title}</Text>
                                    <Text style={styles.suggestionDesc}>{item.shortDesc}</Text>
                                </View>
                            ))}
                        </View>
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
        paddingTop: 10,
        paddingBottom: 40,
    },
    titleContainer: {
        marginBottom: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: THEME.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '400',
        color: THEME.textDim,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    // Hero Card (Interactive)
    heroCard: {
        width: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(129, 140, 248, 0.3)',
    },
    heroIconBg: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(129, 140, 248, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    heroInfo: {
        flex: 1,
    },
    heroLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#818CF8',
        letterSpacing: 1,
        marginBottom: 4,
    },
    heroTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 2,
    },
    heroDesc: {
        fontSize: 13,
        color: THEME.textDim,
        lineHeight: 18,
    },


    // Ideas Grid (Instructional)
    gridSection: {
        width: '100%',
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: THEME.textDim,
        letterSpacing: 1.5,
        marginBottom: 12,
        paddingLeft: 4,
    },
    suggestionList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    suggestionItem: {
        width: (width - 60 - 12) / 2, // 2-column grid
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    suggestionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    suggestionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: THEME.text,
        marginBottom: 4,
        textAlign: 'center',
    },
    suggestionDesc: {
        fontSize: 11,
        color: THEME.textDim,
        textAlign: 'center',
    },

});



