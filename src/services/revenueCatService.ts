/**
 * RevenueCat Service
 * 
 * Handles subscription management with support for:
 * - Development mode (mocked data)
 * - Test mode (real API, test purchases)
 * - Production mode (real purchases)
 */

import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// Development mode flag - set to true to use mocked data
const USE_MOCK_DATA = __DEV__ && true; // ← ENABLED for development - bypasses real payments

// Mock data for development
const createMockOffering = (): PurchasesOffering => {
  const monthlyPackage: PurchasesPackage = {
    identifier: 'monthly',
    packageType: 'MONTHLY',
    product: {
      identifier: 'monthly_subscription',
      description: 'Premium Monthly Subscription',
      title: 'Premium Monthly',
      price: 9.99,
      priceString: '$9.99',
      currencyCode: 'USD',
      introPrice: null,
    },
    offeringIdentifier: 'default',
  } as PurchasesPackage;

  const yearlyPackage: PurchasesPackage = {
    identifier: 'annual',
    packageType: 'ANNUAL',
    product: {
      identifier: 'yearly_subscription',
      description: 'Premium Annual Subscription',
      title: 'Premium Annual',
      price: 29.99,
      priceString: '$29.99',
      currencyCode: 'USD',
      introPrice: {
        price: 0,
        priceString: '$0.00',
        period: 'P3D',
        cycles: 1,
        periodNumberOfUnits: 3,
        periodUnit: 'DAY',
      },
    },
    offeringIdentifier: 'default',
  } as PurchasesPackage;

  // Cancellation offer packages
  const yearlyOfferPackage: PurchasesPackage = {
    identifier: 'annual_offer1',
    packageType: 'ANNUAL',
    product: {
      identifier: 'yearly_subscription_offer',
      description: 'Premium Annual Subscription - Special Offer',
      title: 'Premium Annual - Special Offer',
      price: 14.99,
      priceString: '$14.99',
      currencyCode: 'USD',
      introPrice: null,
    },
    offeringIdentifier: 'default',
  } as PurchasesPackage;

  const lifetimeOffer1Package: PurchasesPackage = {
    identifier: 'lifetime_offer1',
    packageType: 'LIFETIME',
    product: {
      identifier: 'lifetime_offer_1',
      description: 'Premium Lifetime Access - Offer 1',
      title: 'Premium Lifetime - Offer 1',
      price: 24.99,
      priceString: '$24.99',
      currencyCode: 'USD',
      introPrice: null,
    },
    offeringIdentifier: 'default',
  } as PurchasesPackage;

  const lifetimeOffer2Package: PurchasesPackage = {
    identifier: 'lifetime_offer2',
    packageType: 'LIFETIME',
    product: {
      identifier: 'lifetime_offer_2',
      description: 'Premium Lifetime Access - Offer 2',
      title: 'Premium Lifetime - Offer 2',
      price: 14.99,
      priceString: '$14.99',
      currencyCode: 'USD',
      introPrice: null,
    },
    offeringIdentifier: 'default',
  } as PurchasesPackage;

  // Use lifetime_offer1 as the default lifetime package (no regular lifetime)
  const lifetimePackage = lifetimeOffer1Package;

  return {
    identifier: 'default',
    serverDescription: 'Premium Subscription',
    metadata: {},
    availablePackages: [
      monthlyPackage,
      yearlyPackage,
      yearlyOfferPackage,
      lifetimeOffer1Package,
      lifetimeOffer2Package,
    ],
    lifetime: lifetimePackage,
    annual: yearlyPackage,
    sixMonth: null,
    threeMonth: null,
    twoMonth: null,
    monthly: monthlyPackage,
    weekly: null,
  } as PurchasesOffering;
};

const createMockCustomerInfo = (isPremium: boolean = false): CustomerInfo => {
  return {
    entitlements: {
      active: isPremium
        ? {
            premium: {
              identifier: 'premium',
              isActive: true,
              willRenew: true,
              periodType: 'NORMAL',
              latestPurchaseDate: new Date().toISOString(),
              originalPurchaseDate: new Date().toISOString(),
              expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              store: Platform.OS === 'ios' ? 'APP_STORE' : 'PLAY_STORE',
              productIdentifier: 'monthly_subscription',
              isSandbox: true,
              unsubscribeDetectedAt: null,
              billingIssueDetectedAt: null,
            },
          }
        : {},
      all: {},
    },
    activeSubscriptions: isPremium ? ['monthly_subscription', 'yearly_subscription'] : [],
    allPurchasedProductIdentifiers: isPremium ? ['monthly_subscription', 'yearly_subscription', 'lifetime_offer_1', 'lifetime_offer_2'] : [],
    latestExpirationDate: isPremium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
    firstSeen: new Date().toISOString(),
    originalAppUserId: 'mock_user',
    managementURL: null,
    requestDate: new Date().toISOString(),
  } as CustomerInfo;
};

export interface RevenueCatService {
  /**
   * Initialize RevenueCat SDK
   */
  initialize: () => Promise<void>;

  /**
   * Get available offerings (subscription packages)
   */
  getOfferings: () => Promise<Awaited<ReturnType<typeof Purchases.getOfferings>> | null>;

  /**
   * Get current offering
   */
  getCurrentOffering: () => Promise<PurchasesOffering | null>;

  /**
   * Purchase a package
   */
  purchasePackage: (pkg: PurchasesPackage) => Promise<CustomerInfo>;

  /**
   * Restore purchases
   */
  restorePurchases: () => Promise<CustomerInfo>;

  /**
   * Get customer info (subscription status)
   */
  getCustomerInfo: () => Promise<CustomerInfo>;

  /**
   * Check if user has premium entitlement
   */
  isPremium: () => Promise<boolean>;

  /**
   * Set user ID (for identifying users)
   */
  setUserId: (userId: string) => Promise<void>;

  /**
   * Sync purchases (call after login)
   */
  syncPurchases: () => Promise<void>;
}

class RevenueCatServiceImpl implements RevenueCatService {
  private isInitialized = false;
  private mockIsPremium = false; // For development mode

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (USE_MOCK_DATA) {
      console.log('🎭 RevenueCat: Using MOCK DATA mode');
      this.isInitialized = true;
      return;
    }

    try {
      // Prioritize platform-specific keys over the generic fallback
      const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
      const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
      const fallbackKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

      const apiKey = Platform.select({
        ios: iosKey || fallbackKey,
        android: androidKey || fallbackKey,
      });

      if (!apiKey) {
        console.warn('⚠️ RevenueCat: No API key found in environment variables');
        return;
      }

      // Log which key is being used (for debugging)
      if (__DEV__) {
        const keySource = Platform.select({
          ios: iosKey ? 'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY' : 'EXPO_PUBLIC_REVENUECAT_API_KEY (fallback)',
          android: androidKey ? 'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY' : 'EXPO_PUBLIC_REVENUECAT_API_KEY (fallback)',
        });
        console.log(`🔑 RevenueCat: Using ${keySource}`);
        
        // Warn if using fallback key when platform-specific key should be used
        if (Platform.OS === 'ios' && !iosKey && fallbackKey) {
          console.warn('⚠️ RevenueCat: Using fallback key for iOS. Consider setting EXPO_PUBLIC_REVENUECAT_IOS_API_KEY for production.');
        } else if (Platform.OS === 'android' && !androidKey && fallbackKey) {
          console.warn('⚠️ RevenueCat: Using fallback key for Android. Consider setting EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY for production.');
        }
      }

      // Enable debug logs in development
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
      }

      Purchases.configure({ apiKey });
      this.isInitialized = true;
      console.log('✅ RevenueCat initialized');
    } catch (error) {
      console.error('❌ RevenueCat initialization failed:', error);
      throw error;
    }
  }

  async getOfferings() {
    if (USE_MOCK_DATA) {
      const mockOffering = createMockOffering();
      return {
        current: mockOffering,
        all: { default: mockOffering },
      } as Awaited<ReturnType<typeof Purchases.getOfferings>>;
    }

    try {
      return await Purchases.getOfferings();
    } catch (error) {
      console.error('❌ Failed to get offerings:', error);
      return null;
    }
  }

  async getCurrentOffering(): Promise<PurchasesOffering | null> {
    if (USE_MOCK_DATA) {
      return createMockOffering();
    }

    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('❌ Failed to get current offering:', error);
      return null;
    }
  }

  async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
    if (USE_MOCK_DATA) {
      // Simulate purchase in mock mode
      console.log('🎭 Mock purchase:', pkg.identifier);
      this.mockIsPremium = true;
      return createMockCustomerInfo(true);
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return customerInfo;
    } catch (error: any) {
      // Handle user cancellation gracefully
      if (error.userCancelled) {
        throw new Error('Purchase cancelled');
      }
      console.error('❌ Purchase failed:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    if (USE_MOCK_DATA) {
      // In mock mode, restore doesn't do anything
      return createMockCustomerInfo(this.mockIsPremium);
    }

    try {
      return await Purchases.restorePurchases();
    } catch (error) {
      console.error('❌ Restore purchases failed:', error);
      throw error;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    if (USE_MOCK_DATA) {
      return createMockCustomerInfo(this.mockIsPremium);
    }

    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('❌ Failed to get customer info:', error);
      throw error;
    }
  }

  async isPremium(): Promise<boolean> {
    if (USE_MOCK_DATA) {
      return this.mockIsPremium;
    }

    try {
      const customerInfo = await this.getCustomerInfo();
      
      // Check if premium entitlement exists and is active
      const premiumEntitlement = customerInfo.entitlements.active['premium'];
      const hasPremium = premiumEntitlement !== undefined;
      
      // IMPORTANT: Don't trust anonymous purchases during onboarding
      // Only trust premium if user is identified (not anonymous)
      const isAnonymous = customerInfo.originalAppUserId?.startsWith('$RCAnonymousID:') ?? false;
      
      // Debug logging
      if (__DEV__) {
        console.log('🔍 Premium check:', {
          hasPremium,
          isAnonymous,
          originalAppUserId: customerInfo.originalAppUserId,
          premiumEntitlement: premiumEntitlement ? {
            identifier: premiumEntitlement.identifier,
            isActive: premiumEntitlement.isActive,
            willRenew: premiumEntitlement.willRenew,
            periodType: premiumEntitlement.periodType,
          } : null,
          activeEntitlements: Object.keys(customerInfo.entitlements.active),
          allEntitlements: Object.keys(customerInfo.entitlements.all || {}),
        });
      }
      
      // If user is anonymous, don't trust premium status (likely from previous test)
      if (isAnonymous && hasPremium) {
        console.log('⚠️ Premium detected but user is anonymous - ignoring for onboarding flow');
        return false;
      }
      
      // Double-check: entitlement must exist AND be active
      if (hasPremium && premiumEntitlement) {
        return premiumEntitlement.isActive === true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Failed to check premium status:', error);
      // On error, default to false (not premium)
      return false;
    }
  }

  async logOut(): Promise<void> {
    if (USE_MOCK_DATA) {
      return;
    }

    try {
      await Purchases.logOut();
      console.log('✅ RevenueCat: Logged out (cleared anonymous ID)');
    } catch (error) {
      console.error('❌ Failed to log out from RevenueCat:', error);
      throw error;
    }
  }

  async setUserId(userId: string): Promise<void> {
    if (USE_MOCK_DATA) {
      console.log('🎭 Mock setUserId:', userId);
      return;
    }

    try {
      await Purchases.logIn(userId);
    } catch (error) {
      console.error('❌ Failed to set user ID:', error);
      // Don't throw - this is not critical
    }
  }

  async syncPurchases(): Promise<void> {
    if (USE_MOCK_DATA) {
      return;
    }

    try {
      // Just fetch customer info to sync
      await this.getCustomerInfo();
    } catch (error) {
      console.error('❌ Failed to sync purchases:', error);
    }
  }
}

// Export singleton instance
export const revenueCatService = new RevenueCatServiceImpl();

export default revenueCatService;

