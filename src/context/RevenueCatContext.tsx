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
  showCancellationOffer: boolean; // Trigger for showing cancellation offer

  // Methods
  purchasePackage: (pkg: PurchasesPackage) => Promise<CustomerInfo | null>;
  restorePurchases: () => Promise<void>;
  refreshData: () => Promise<void>;
  checkPremiumStatus: () => Promise<void>;
  findPackageByIdentifier: (identifier: string) => Promise<PurchasesPackage | null>;
  dismissCancellationOffer: () => void; // Dismiss the cancellation offer
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
  const [previousPremium, setPreviousPremium] = useState<boolean | null>(null); // Track previous state
  const [isLoading, setIsLoading] = useState(true);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showCancellationOffer, setShowCancellationOffer] = useState(false);
  const [hasShownCancellationOffer, setHasShownCancellationOffer] = useState(false); // Track if we've shown it for this cancellation

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

      // Detect subscription cancellation: premium changed from true to false
      // Only show once per cancellation event (not every time app loads)
      if (previousPremium === true && premium === false && isAuthenticated && !hasShownCancellationOffer) {
        console.log('⚠️ Subscription cancelled detected - showing cancellation offer');
        setShowCancellationOffer(true);
        setHasShownCancellationOffer(true);
      }
      
      // Reset the flag if user becomes premium again (they resubscribed)
      if (previousPremium === false && premium === true) {
        setHasShownCancellationOffer(false);
      }
      
      setPreviousPremium(premium);
      setIsPremium(premium);
    } catch (err: any) {
      console.error('Failed to load RevenueCat data:', err);
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, user?.id, previousPremium, isAuthenticated, hasShownCancellationOffer]);

  // Load data when initialized
  useEffect(() => {
    if (isInitialized) {
      loadData();
    }
  }, [isInitialized, loadData]);

  // Sync user ID when authenticated and restore purchases
  // This ensures premium status syncs across devices when user logs in
  useEffect(() => {
    if (isInitialized && isAuthenticated && user?.id) {
      const syncUserAndRestore = async () => {
        try {
          // Step 1: Identify the user with RevenueCat (links purchases to this user ID)
          // This is critical for cross-device sync - RevenueCat will link all purchases
          // made with this user ID, regardless of which device they were purchased on
          await revenueCatService.setUserId(user.id);
          console.log('✅ RevenueCat user ID set:', user.id);
          
          // Step 2: Restore purchases from the app store
          // This ensures any purchases made on this device (before login) are restored
          // RevenueCat's logIn() already links purchases, but restorePurchases() is
          // good practice to ensure everything is synced
          try {
            await revenueCatService.restorePurchases();
            console.log('✅ Purchases restored after login');
          } catch (error) {
            // Not critical - restorePurchases might fail if no purchases exist
            console.log('ℹ️ No purchases to restore or restore failed:', error);
          }
          
          // Step 3: Refresh premium status to get the latest subscription state
          // This will check RevenueCat for the user's active subscriptions
          await loadData();
          console.log('✅ Premium status refreshed after login');
        } catch (error) {
          console.error('❌ Failed to sync user and restore purchases:', error);
          // Still try to load data even if sync failed
          await loadData();
        }
      };
      
      syncUserAndRestore();
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

        // Track purchase event for SKAdNetwork attribution
        // RevenueCat automatically handles SKAdNetwork conversion values on iOS
        // This additional tracking is for Meta, TikTok, and Taboola SDKs if available
        try {
          const { purchaseEventTrackingService } = await import('../services/purchaseEventTrackingService');
          await purchaseEventTrackingService.trackPurchase({
            packageId: pkg.identifier,
            packageType: pkg.packageType,
            productId: pkg.product.identifier,
            price: pkg.product.price,
            currency: pkg.product.currencyCode || 'USD',
            revenue: pkg.product.price,
            customerInfo: info,
          });
        } catch (trackingError) {
          // Don't fail purchase if tracking fails
          console.log('ℹ️ Purchase event tracking failed (non-critical):', trackingError);
        }

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

      // Track purchase restore event
      try {
        const { purchaseEventTrackingService } = await import('../services/purchaseEventTrackingService');
        await purchaseEventTrackingService.trackRestore(info);
      } catch (trackingError) {
        // Don't fail restore if tracking fails
        console.log('ℹ️ Restore event tracking failed (non-critical):', trackingError);
      }
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

  // Dismiss cancellation offer
  const dismissCancellationOffer = useCallback(() => {
    setShowCancellationOffer(false);
    // Note: We keep hasShownCancellationOffer as true so it doesn't show again
    // until they resubscribe (which resets it)
  }, []);

  const value: RevenueCatContextType = {
    isPremium,
    isLoading,
    currentOffering,
    customerInfo,
    error,
    showCancellationOffer,
    purchasePackage,
    restorePurchases,
    refreshData,
    checkPremiumStatus,
    findPackageByIdentifier,
    dismissCancellationOffer,
  };

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
}

export default RevenueCatContext;

