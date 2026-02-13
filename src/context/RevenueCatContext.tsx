/**
 * RevenueCat Context
 * 
 * Provides global access to subscription state and methods throughout the app.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { revenueCatService } from '../services/revenueCatService';
import { useAuthContext } from './AuthContext';

interface RevenueCatContextType {
  // State
  isPremium: boolean;
  isLoading: boolean;
  currentOffering: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  error: string | null;

  // Methods
  purchasePackage: (pkg: PurchasesPackage) => Promise<CustomerInfo | null>;
  restorePurchases: () => Promise<void>;
  refreshData: () => Promise<void>;
  checkPremiumStatus: () => Promise<void>;
  findPackageByIdentifier: (identifier: string) => Promise<PurchasesPackage | null>;
}

const RevenueCatContext = createContext<RevenueCatContextType | null>(null);

export function useRevenueCat(): RevenueCatContextType {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error('useRevenueCat must be used within RevenueCatProvider');
  }
  return context;
}

interface RevenueCatProviderProps {
  children: ReactNode;
}

export function RevenueCatProvider({ children }: RevenueCatProviderProps) {
  const { user, isAuthenticated } = useAuthContext();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize RevenueCat
  useEffect(() => {
    const init = async () => {
      try {
        await revenueCatService.initialize();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize RevenueCat:', err);
        setError('Failed to initialize subscription service');
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Load offerings and customer info
  const loadData = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setIsLoading(true);
      setError(null);

      // Load offerings
      const offering = await revenueCatService.getCurrentOffering();
      setCurrentOffering(offering);

      // Load customer info
      const info = await revenueCatService.getCustomerInfo();
      setCustomerInfo(info);

      // Check premium status (RevenueCat subscription)
      let premium = await revenueCatService.isPremium();

      // Also check if user earned premium through referrals
      if (!premium && user?.id) {
        try {
          const { referralService } = await import('../services/referralService');
          const hasReferralPremium = await referralService.hasEarnedPremiumThroughReferrals(user.id);
          if (hasReferralPremium) {
            console.log('✅ User has premium from referrals');
            premium = true;
          }
        } catch (e) {
          console.log('Could not check referral premium:', e);
        }
      }

      setIsPremium(premium);
    } catch (err: any) {
      console.error('Failed to load RevenueCat data:', err);
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, user?.id]);

  // Load data when initialized
  useEffect(() => {
    if (isInitialized) {
      loadData();
    }
  }, [isInitialized, loadData]);

  // Sync user ID when authenticated and restore purchases
  useEffect(() => {
    if (isInitialized && isAuthenticated && user?.id) {
      revenueCatService.setUserId(user.id).then(async () => {
        // Restore purchases to link any anonymous purchases to this user
        try {
          await revenueCatService.restorePurchases();
          console.log('✅ Purchases restored after login');
        } catch (error) {
          console.log('ℹ️ No purchases to restore or restore failed:', error);
        }
        // Refresh data after setting user ID
        loadData();
      });
    }
  }, [isInitialized, isAuthenticated, user?.id, loadData]);

  // Purchase a package
  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage) => {
      try {
        setIsLoading(true);
        setError(null);

        const info = await revenueCatService.purchasePackage(pkg);
        setCustomerInfo(info);

        // Check premium status
        const premium = await revenueCatService.isPremium();
        setIsPremium(premium);

        // Refresh offerings in case they changed
        const offering = await revenueCatService.getCurrentOffering();
        setCurrentOffering(offering);

        return info;
      } catch (err: any) {
        console.error('Purchase failed:', err);
        setError(err.message || 'Purchase failed');
        throw err; // Re-throw so UI can handle it
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Restore purchases
  const restorePurchases = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const info = await revenueCatService.restorePurchases();
      setCustomerInfo(info);

      // Check premium status
      const premium = await revenueCatService.isPremium();
      setIsPremium(premium);

      // Refresh offerings
      const offering = await revenueCatService.getCurrentOffering();
      setCurrentOffering(offering);
    } catch (err: any) {
      console.error('Restore failed:', err);
      setError(err.message || 'Failed to restore purchases');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check premium status
  const checkPremiumStatus = useCallback(async () => {
    try {
      const premium = await revenueCatService.isPremium();
      setIsPremium(premium);
    } catch (err) {
      console.error('Failed to check premium status:', err);
    }
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Find a package by identifier across all offerings
  const findPackageByIdentifier = useCallback(async (identifier: string): Promise<PurchasesPackage | null> => {
    try {
      // First check current offering
      if (currentOffering?.availablePackages) {
        const pkg = currentOffering.availablePackages.find(p => p.identifier === identifier);
        if (pkg) return pkg;
      }

      // If not found, search all offerings
      const offerings = await revenueCatService.getOfferings();
      if (offerings?.all) {
        for (const offering of Object.values(offerings.all)) {
          if (offering?.availablePackages) {
            const pkg = offering.availablePackages.find(p => p.identifier === identifier);
            if (pkg) return pkg;
          }
        }
      }

      return null;
    } catch (err) {
      console.error('Failed to find package:', err);
      return null;
    }
  }, [currentOffering]);

  const value: RevenueCatContextType = {
    isPremium,
    isLoading,
    currentOffering,
    customerInfo,
    error,
    purchasePackage,
    restorePurchases,
    refreshData,
    checkPremiumStatus,
    findPackageByIdentifier,
  };

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
}

export default RevenueCatContext;

