/**
 * PremiumGate Component
 * 
 * Conditionally renders children based on premium status.
 * Shows fallback or paywall prompt for non-premium users.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRevenueCat } from '../hooks/useRevenueCat';
import { PremiumGateProps } from '../utils/premiumUtils';
import { colors, spacing } from '../theme';

interface PremiumGateComponentProps extends PremiumGateProps {
  /**
   * Custom message to show when user doesn't have premium
   */
  message?: string;
  /**
   * Show a button to upgrade
   */
  showUpgradeButton?: boolean;
}

export function PremiumGate({
  children,
  fallback,
  showPaywall,
  message = 'This feature requires a premium subscription',
  showUpgradeButton = true,
}: PremiumGateComponentProps) {
  const { isPremium, isLoading } = useRevenueCat();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (isPremium) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {showUpgradeButton && showPaywall && (
        <TouchableOpacity style={styles.upgradeButton} onPress={showPaywall}>
          <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  message: {
    color: colors.text.secondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  upgradeButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 20,
    marginTop: spacing.sm,
  },
  upgradeButtonText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default PremiumGate;

