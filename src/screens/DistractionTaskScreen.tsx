
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '../theme';

const { width } = Dimensions.get('window');

const THEME = {
    bgColors: ['#0F172A', '#1E1B4B'],
    accent: '#818CF8',
    text: '#F8FAFC',
    textDim: '#94A3B8',
};

type DistractionTask = {
    id: string;
    title: string;
    icon: string;
    instruction: string;
    duration?: string;
    tip: string;
    color: string;
};

const TASKS: Record<string, DistractionTask> = {
    walk: {
        id: 'walk',
        title: 'QUICK WALK',
        icon: 'navigation',
        instruction: 'Get up and walk for 5 minutes. Movement releases dopamine and creates a physical "reset" for your brain.',
        duration: '5 MINS',
        tip: 'Walking reduces craving intensity by over 50%.',
        color: '#34D399',
    },
    water: {
        id: 'water',
        title: 'WATER CHALLENGE',
        icon: 'droplet',
        instruction: 'Drink a full 8oz glass of water. Thirst is often misinterpreted as a sugar craving by your body.',
        duration: 'ASAP',
        tip: 'Once finished, wait 60 seconds. You\'ll likely feel the craving subside.',
        color: '#60A5FA',
    },
    call: {
        id: 'call',
        title: 'CALL A FRIEND',
        icon: 'phone',
        instruction: 'Call or text someone from your inner circle. A brief social connection shifts your mental focus.',
        duration: '2-5 MINS',
        tip: 'Connection is the opposite of addiction.',
        color: '#F472B6',
    },
    music: {
        id: 'music',
        title: 'UPBEAT TRACK',
        icon: 'music',
        instruction: 'Put on one fast-paced, uplifting song. Let the music change your neurochemistry.',
        duration: '3 MINS',
        tip: 'Audio stimulation is one of the fastest ways to shift your mood.',
        color: '#FBBF24',
    }
};

export default function DistractionTaskScreen() {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<{ params: { taskId: string } }, 'params'>>();
    const { taskId } = route.params;
    const task = TASKS[taskId];

    if (!task) return null;

    return (
        <View style={styles.container}>
            <LinearGradient colors={THEME.bgColors as any} style={StyleSheet.absoluteFillObject} />
            <SafeAreaView style={styles.safeArea}>

                {/* Unified Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                        <Feather name="x" size={24} color={THEME.textDim} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{task.title}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.content}>
                    {/* Visual Hero */}
                    <View style={styles.heroContainer}>
                        <View style={[styles.iconBg, { borderColor: task.color }]}>
                            <Feather name={task.icon as any} size={48} color={task.color} />
                        </View>
                        {task.duration && (
                            <View style={styles.durationBadge}>
                                <Text style={styles.durationText}>{task.duration}</Text>
                            </View>
                        )}
                    </View>

                    {/* Instructions */}
                    <View style={styles.textContainer}>
                        <Text style={styles.instructionTitle}>ACTION PLAN</Text>
                        <Text style={styles.instructionText}>{task.instruction}</Text>
                    </View>

                    {/* Scientific Tip */}
                    <View style={styles.bottomSection}>
                        <View style={styles.tipCard}>
                            <Feather name="zap" size={20} color={task.color} style={{ marginRight: 12 }} />
                            <Text style={styles.tipText}>{task.tip}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.doneButton}
                            activeOpacity={0.9}
                            onPress={() => navigation.goBack()}
                        >
                            <LinearGradient
                                colors={['#6366F1', '#4338CA']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={StyleSheet.absoluteFillObject}
                            />
                            <Text style={styles.doneText}>I'm good now</Text>
                        </TouchableOpacity>
                    </View>

                </View>
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
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 2,
        color: THEME.textDim,
    },
    iconBtn: {
        padding: 8,
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
        justifyContent: 'space-between',
        paddingVertical: 40,
    },
    heroContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    iconBg: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    durationBadge: {
        marginTop: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    durationText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
    textContainer: {
        alignItems: 'center',
    },
    instructionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: THEME.accent,
        letterSpacing: 1.5,
        marginBottom: 16,
    },
    instructionText: {
        fontSize: 22,
        color: '#FFF',
        textAlign: 'center',
        lineHeight: 32,
        fontWeight: '500',
    },
    bottomSection: {
        width: '100%',
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 20,
        borderRadius: 24,
        marginBottom: 32,
    },
    tipText: {
        flex: 1,
        fontSize: 14,
        color: THEME.textDim,
        lineHeight: 20,
    },
    doneButton: {
        height: 56,
        width: '100%',
        borderRadius: 28,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    doneText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: 0.5,
    }
});
