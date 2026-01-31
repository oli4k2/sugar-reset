/**
 * Premium Feature Utilities
 * 
 * Helper functions for checking premium access and gating features.
 */

import { useRevenueCat } from '../hooks/useRevenueCat';

/**
 * Hook to check if a feature requires premium and if user has access
 */
export function usePremiumFeature(featureName?: string) {
  const { isPremium, isLoading } = useRevenueCat();

  return {
    hasAccess: isPremium,
    isLoading,
    requiresPremium: true, // All features require premium for now
    featureName,
  };
}

/**
 * Check if user has premium access (non-hook version for use outside components)
 * Note: This requires the RevenueCat service to be initialized
 */
export async function checkPremiumAccess(): Promise<boolean> {
  try {
    const { revenueCatService } = await import('../services/revenueCatService');
    return await revenueCatService.isPremium();
  } catch (error) {
    console.error('Failed to check premium access:', error);
    return false;
  }
}

/**
 * Premium feature gate component props
 */
export interface PremiumGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showPaywall?: () => void;
}

/**
 * Premium feature names (for analytics/tracking)
 */
export const PremiumFeatures = {
  UNLIMITED_TRACKING: 'unlimited_tracking',
  SCIENCE_INSIGHTS: 'science_insights',
  PERSONALIZED_RECOMMENDATIONS: 'personalized_recommendations',
  PROGRESS_ANALYTICS: 'progress_analytics',
  COMMUNITY_SUPPORT: 'community_support',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  EXPORT_DATA: 'export_data',
  CUSTOM_GOALS: 'custom_goals',
} as const;

export type PremiumFeatureName = typeof PremiumFeatures[keyof typeof PremiumFeatures];

