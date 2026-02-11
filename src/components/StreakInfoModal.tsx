import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserData } from '../context/UserDataContext';
import { getCurrentWeek, getPlanDetails, PlanType } from '../utils/planUtils';
import { looviColors } from './LooviBackground';
import { spacing } from '../theme';

interface StreakInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function StreakInfoModal({ visible, onClose }: StreakInfoModalProps) {
  const { onboardingData, streakData, streakResult } = useUserData();

  const planType = (onboardingData?.plan || 'cold_turkey') as PlanType;
  const startDate = onboardingData?.startDate ? new Date(onboardingData.startDate) : new Date();
  const currentWeek = getCurrentWeek(startDate);
  const planDetails = getPlanDetails(planType);
  
  // Use todayStatus from streakResult instead of useStreak hook
  const todayStatus = streakResult?.todayStatus || null;
  
  // Calculate plan progress (with safety checks)
  const now = new Date();
  const daysSinceStart = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const planDuration = planType === 'cold_turkey' ? 30 : 90;
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
    if (todayStatus.isStreakDay) return '✅ Sugar-free today!';
    if (!todayStatus.hasLogs) return '⏳ Log your food to continue';
    return '❌ Over sugar limit today';
  };
  
  // Get current week's limit for gradual plan
  const getCurrentWeekLimit = () => {
    if (planType === 'cold_turkey') return 0;
    const weekLimit = planDetails.weeklyLimits.find(w => w.week === currentWeek);
    return weekLimit?.dailyGrams ?? 0;
  };

  return (
    <Modal
      visible={visible}
      transparent
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
                  <Text style={styles.subtitle}>Track your progress and stay motivated</Text>
                </View>
              </View>

              <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Current Status */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Today's Status</Text>
                  <View style={[styles.statusCard, { borderLeftColor: getStatusColor() }]}>
                    <Text style={styles.statusText}>{getStatusText()}</Text>
                    {todayStatus && (
                      <Text style={styles.detailText}>
                        Added sugar: {todayStatus.totalAddedSugar}g / {todayStatus.dailyTarget}g
                      </Text>
                    )}
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

                {/* Current Stats */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Your Progress</Text>
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
                </View>

                {/* Plan Progress */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Your Plan Progress</Text>
                  <View style={styles.planCard}>
                    <View style={styles.planHeader}>
                      <Text style={styles.planText}>
                        {planDetails.name}
                      </Text>
                      <Text style={styles.planProgressPercent}>{planProgressPercent}%</Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBar, { width: `${planProgressPercent}%` }]} />
                    </View>
                    <Text style={styles.planDetail}>
                      Week {currentWeek} of {planType === 'cold_turkey' ? '4' : '13'}
                      {daysRemaining > 0 && ` • ${daysRemaining} days remaining`}
                    </Text>
                    {planType === 'gradual' && currentWeek > 0 && currentWeek <= planDetails.weeklyLimits.length && (
                      <View style={styles.weekLimitCard}>
                        <Text style={styles.weekLimitLabel}>This Week's Target</Text>
                        <Text style={styles.weekLimitValue}>{getCurrentWeekLimit()}g added sugar/day</Text>
                        {planDetails.weeklyLimits[currentWeek - 1] && (
                          <Text style={styles.weekLimitDescription}>
                            {planDetails.weeklyLimits[currentWeek - 1].description}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
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
    padding: spacing.xl,
    paddingTop: spacing.xl + 8,
    marginBottom: spacing.md,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(232, 168, 124, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: looviColors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: looviColors.text.secondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingTop: 0,
  },
  section: {
    marginBottom: spacing.lg,
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
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: looviColors.text.primary,
    marginBottom: 4,
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
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: looviColors.accent.primary,
  },
  statLabel: {
    fontSize: 12,
    color: looviColors.text.secondary,
    marginTop: 4,
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
  planText: {
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
