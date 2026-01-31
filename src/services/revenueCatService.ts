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
  Offerings,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// Development mode flag - set to true to use mocked data
const USE_MOCK_DATA = __DEV__ && false; // Change to true to enable mock mode

// Mock data for development
const createMockOffering = (): PurchasesOffering => {
  const monthlyPackage: PurchasesPackage = {
    identifier: 'monthly',
    packageType: 'MONTHLY',
    product: {
      identifier: 'premium_monthly',
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
      identifier: 'premium_yearly',
      description: 'Premium Annual Subscription',
      title: 'Premium Annual',
      price: 99.99,
      priceString: '$99.99',
      currencyCode: 'USD',
      introPrice: {
        price: 0,
        priceString: '$0.00',
        period: 'P1W',
        cycles: 1,
        periodNumberOfUnits: 1,
        periodUnit: 'WEEK',
      },
    },
    offeringIdentifier: 'default',
  } as PurchasesPackage;

  return {
    identifier: 'default',
    serverDescription: 'Premium Subscription',
    metadata: {},
    availablePackages: [monthlyPackage, yearlyPackage],
    lifetime: null,
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
              productIdentifier: 'premium_monthly',
              isSandbox: true,
              unsubscribeDetectedAt: null,
              billingIssueDetectedAt: null,
            },
          }
        : {},
      all: {},
    },
    activeSubscriptions: isPremium ? ['premium_monthly'] : [],
    allPurchasedProductIdentifiers: isPremium ? ['premium_monthly'] : [],
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
  getOfferings: () => Promise<Offerings | null>;

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
      const apiKey = Platform.select({
        ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
        android:
          process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
      });

      if (!apiKey) {
        console.warn('⚠️ RevenueCat: No API key found in environment variables');
        return;
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

  async getOfferings(): Promise<Offerings | null> {
    if (USE_MOCK_DATA) {
      const mockOffering = createMockOffering();
      return {
        current: mockOffering,
        all: { default: mockOffering },
      } as Offerings;
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
      return customerInfo.entitlements.active['premium'] !== undefined;
    } catch (error) {
      console.error('❌ Failed to check premium status:', error);
      return false;
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

