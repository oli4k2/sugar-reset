import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserData } from '../context/UserDataContext';
import { getCurrentWeek, getPlanDetails, PlanType } from '../utils/planUtils';
import { looviColors } from './LooviBackground';
import LooviBackground from './LooviBackground';
import { spacing } from '../theme';

interface StreakInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function StreakInfoModal({ visible, onClose }: StreakInfoModalProps) {
  const { onboardingData, streakData, streakResult } = useUserData();
  const [dailyLimit, setDailyLimit] = useState<number>(25); // Default to 25g

  const planType = (onboardingData?.plan || 'cold_turkey') as PlanType;
  // Plan start date - fixed from onboarding, never resets (independent of streak)
  const planStartDate = onboardingData?.startDate ? new Date(onboardingData.startDate) : new Date();
  const currentWeek = getCurrentWeek(planStartDate);
  const planDetails = getPlanDetails(planType);
  
  // Use todayStatus from streakResult instead of useStreak hook
  const todayStatus = streakResult?.todayStatus || null;

  // Get actual daily limit (not the 999 placeholder)
  useEffect(() => {
    const loadDailyLimit = async () => {
      try {
        const { getDailyAddedSugarLimit } = await import('../services/streakService');
        const limit = await getDailyAddedSugarLimit();
        setDailyLimit(limit);
      } catch (error) {
        console.warn('Could not load daily limit:', error);
      }
    };
    loadDailyLimit();
  }, []);
  
  // Calculate plan progress (with safety checks) - based on fixed plan start date
  const now = new Date();
  const daysSinceStart = Math.max(0, Math.floor((now.getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24)));
  const planDuration = 90; // All plans are now 90 days
  const planProgressPercent = Math.min(100, Math.max(0, Math.round((daysSinceStart / planDuration) * 100)));
  const daysRemaining = Math.max(0, planDuration - daysSinceStart);

  const getStatusColor = () => {
    if (!todayStatus) return looviColors.text.tertiary;
    if (todayStatus.isStreakDay) return looviColors.accent.success;
    if (!todayStatus.hasLogs) return looviColors.accent.warning;
    return looviColors.accent.error;
  };

  const getStatusText = () => {
    if (!todayStatus) return 'Loading...';
    if (todayStatus.isStreakDay) return 'Sugar-free today!';
    if (!todayStatus.hasLogs) return 'Log your food to continue';
    return 'Over sugar limit today';
  };

  const getStatusIcon = () => {
    if (!todayStatus) return 'time-outline';
    if (todayStatus.isStreakDay) return 'checkmark-circle';
    if (!todayStatus.hasLogs) return 'hourglass-outline';
    return 'close-circle';
  };
  
  // Get current week's limit for gradual plan
  const getCurrentWeekLimit = () => {
    if (planType === 'cold_turkey') return 0;
    const weekLimit = planDetails.weeklyLimits.find(w => w.week === currentWeek);
    return weekLimit?.dailyGrams ?? 0;
  };

  // Calculate current phase (same as PlanProgressBar)
  const progressPercent = Math.min(100, Math.max(0, Math.round((daysSinceStart / planDuration) * 100)));
  const PHASES = [
    { minPercent: 0, maxPercent: 5, name: 'Phase 1: Starting Out', feeling: 'taking your first steps', endFeeling: 'you\'ve begun your journey' },
    { minPercent: 5, maxPercent: 10, name: 'Phase 2: First Steps', feeling: 'building your foundation', endFeeling: 'establishing new routines' },
    { minPercent: 10, maxPercent: 15, name: 'Phase 3: Building Foundation', feeling: 'creating healthy habits', endFeeling: 'patterns are forming' },
    { minPercent: 15, maxPercent: 20, name: 'Phase 4: Early Progress', feeling: 'seeing initial results', endFeeling: 'momentum is building' },
    { minPercent: 20, maxPercent: 25, name: 'Phase 5: Gaining Momentum', feeling: 'feeling more in control', endFeeling: 'habits are strengthening' },
    { minPercent: 25, maxPercent: 35, name: 'Phase 6: Detox', feeling: 'experiencing cravings and adjustment', endFeeling: 'cravings will start to decrease' },
    { minPercent: 35, maxPercent: 50, name: 'Phase 7: Adaptation', feeling: 'adapting to lower sugar intake', endFeeling: 'energy levels will stabilize' },
    { minPercent: 50, maxPercent: 65, name: 'Phase 8: Momentum', feeling: 'building healthy habits', endFeeling: 'taste preferences will change' },
    { minPercent: 65, maxPercent: 80, name: 'Phase 9: Strengthening', feeling: 'habits becoming second nature', endFeeling: 'confidence is growing' },
    { minPercent: 80, maxPercent: 100, name: 'Phase 10: Mastery', feeling: 'mastering your sugar-free lifestyle', endFeeling: 'feel in complete control' },
  ];
  const currentPhase = PHASES.find(
    phase => progressPercent >= phase.minPercent && progressPercent < phase.maxPercent
  ) || PHASES[PHASES.length - 1];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.modalContainer}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.content}>
              {/* Close Button */}
              <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={looviColors.text.secondary} />
              </TouchableOpacity>
              
              <View style={styles.header}>
                <View style={styles.headerIcon}>
                  <Ionicons name="flame" size={26} color={looviColors.coralOrange} />
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.title}>Your Sugar-Free Journey</Text>
                </View>
              </View>

              <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Today's Status */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Today's Status</Text>
                  <View style={[styles.statusCard, { borderLeftColor: getStatusColor() }]}>
                    <View style={styles.statusRow}>
                      <Ionicons name={getStatusIcon()} size={20} color={getStatusColor()} style={styles.statusIcon} />
                      <Text style={styles.statusText}>{getStatusText()}</Text>
                    </View>
                    {todayStatus && (
                      <Text style={styles.detailText}>
                        Added sugar: {todayStatus.totalAddedSugar}g / {todayStatus.dailyTarget === 999 ? dailyLimit : todayStatus.dailyTarget}g
                      </Text>
                    )}
                  </View>
                </View>

                {/* Stats Grid - Compact */}
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{streakData?.currentStreak || 0}</Text>
                    <Text style={styles.statLabel}>Current Streak</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{streakData?.longestStreak || 0}</Text>
                    <Text style={styles.statLabel}>Longest Streak</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{streakData?.totalDaysSugarFree || 0}</Text>
                    <Text style={styles.statLabel}>Total Days</Text>
                  </View>
                </View>

                {/* Plan Progress */}
                <View style={[styles.section, styles.planProgressSection]}>
                  <Text style={styles.sectionTitle}>Plan Progress</Text>
                  <View style={styles.planCard}>
                    <View style={styles.planHeader}>
                      <Text style={styles.planPhaseTitle}>{currentPhase.name}</Text>
                      <Text style={styles.planProgressPercent}>{planProgressPercent}%</Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBar, { width: `${planProgressPercent}%` }]} />
                    </View>
                    <Text style={styles.planDetail}>
                      Week {currentWeek} of 13{daysRemaining > 0 && ` • ${daysRemaining} days remaining`}
                    </Text>
                    <Text style={styles.phaseDescription}>
                      {currentPhase.feeling.charAt(0).toUpperCase() + currentPhase.feeling.slice(1)} → {currentPhase.endFeeling}
                    </Text>
                  </View>
                </View>

                {/* Streak Algorithm */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>How Your Streak Works</Text>
                  <View style={styles.algorithmSteps}>
                    <View style={styles.step}>
                      <Text style={styles.stepNumber}>1</Text>
                      <Text style={styles.stepText}>Log your food daily</Text>
                    </View>
                    <View style={styles.step}>
                      <Text style={styles.stepNumber}>2</Text>
                      <Text style={styles.stepText}>Stay under your added sugar limit</Text>
                    </View>
                    <View style={styles.step}>
                      <Text style={styles.stepNumber}>3</Text>
                      <Text style={styles.stepText}>Keep the streak alive!</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.infoText}>
                    • Only <Text style={styles.bold}>added sugar</Text> counts (not natural sugars from fruit/dairy)
                  </Text>
                  <Text style={styles.infoText}>
                    • You have <Text style={styles.bold}>2 days grace period</Text> to log missed days
                  </Text>
                  <Text style={styles.infoText}>
                    • Limits based on WHO recommendations: 25g (women) / 36g (men)
                  </Text>
                </View>

                {/* Tips */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Pro Tips</Text>
                  <View style={styles.tips}>
                    <Text style={styles.tip}>💡 Log food before eating to stay aware</Text>
                    <Text style={styles.tip}>🎯 Focus on added sugars, not natural ones</Text>
                    <Text style={styles.tip}>📱 Use the 2-day grace period wisely</Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    maxHeight: '100%',
    overflow: 'hidden',
  },
  scrollView: {
    maxHeight: 600,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.md,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.lg + 8,
    marginBottom: spacing.sm,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(232, 168, 124, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: looviColors.text.primary,
  },
  section: {
    marginBottom: spacing.md,
  },
  planProgressSection: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: looviColors.text.primary,
    marginBottom: spacing.sm,
  },
  statusCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: spacing.md,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusIcon: {
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: looviColors.text.primary,
  },
  detailText: {
    fontSize: 14,
    color: looviColors.text.secondary,
  },
  algorithmSteps: {
    gap: spacing.xs,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: looviColors.accent.primary,
    color: looviColors.text.light,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 14,
    color: looviColors.text.primary,
  },
  infoText: {
    fontSize: 14,
    color: looviColors.text.secondary,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  bold: {
    fontWeight: '600',
    color: looviColors.text.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: spacing.sm,
    paddingVertical: spacing.xs + 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: looviColors.accent.primary,
  },
  statLabel: {
    fontSize: 11,
    color: looviColors.text.secondary,
    marginTop: 2,
  },
  planCard: {
    backgroundColor: 'rgba(232, 168, 124, 0.1)',
    padding: spacing.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: looviColors.accent.primary,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  planPhaseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: looviColors.text.primary,
    flex: 1,
  },
  planProgressPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: looviColors.accent.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: spacing.xs,
  },
  progressBar: {
    height: '100%',
    backgroundColor: looviColors.accent.primary,
    borderRadius: 4,
  },
  planDetail: {
    fontSize: 14,
    color: looviColors.text.secondary,
    marginTop: spacing.xs,
  },
  phaseDescription: {
    fontSize: 13,
    color: looviColors.text.secondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  weekLimitCard: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
  },
  weekLimitLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: looviColors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  weekLimitValue: {
    fontSize: 18,
    fontWeight: '700',
    color: looviColors.accent.primary,
    marginBottom: 4,
  },
  weekLimitDescription: {
    fontSize: 13,
    color: looviColors.text.secondary,
    lineHeight: 18,
  },
  tips: {
    gap: spacing.xs,
  },
  tip: {
    fontSize: 14,
    color: looviColors.text.secondary,
    lineHeight: 20,
  },
});
