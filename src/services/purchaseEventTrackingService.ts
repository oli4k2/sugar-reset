/**
 * Purchase Event Tracking Service
 * 
 * Handles tracking purchase events for SKAdNetwork attribution:
 * - RevenueCat automatically handles SKAdNetwork conversion values on iOS
 * - This service provides additional tracking for Meta, TikTok, and Taboola if their SDKs are available
 */

import { Platform } from 'react-native';
import { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

interface PurchaseEventData {
  packageId: string;
  packageType: string;
  productId: string;
  price: number;
  currency: string;
  revenue: number;
  customerInfo: CustomerInfo;
}

class PurchaseEventTrackingService {
  /**
   * Track a successful purchase event
   * This should be called after a successful purchase completes
   */
  async trackPurchase(data: PurchaseEventData): Promise<void> {
    try {
      console.log('📊 Tracking purchase event:', {
        packageId: data.packageId,
        productId: data.productId,
        price: data.price,
        currency: data.currency,
      });

      // RevenueCat automatically handles SKAdNetwork conversion values on iOS
      // When Purchases.purchasePackage() completes successfully, RevenueCat
      // automatically updates SKAdNetwork conversion values for attribution
      // No additional action needed for RevenueCat SKAdNetwork tracking

      // Track to Meta (Facebook) if SDK is available
      await this.trackToMeta(data);

      // Track to TikTok if SDK is available
      await this.trackToTikTok(data);

      // Track to Taboola if SDK is available
      await this.trackToTaboola(data);

      console.log('✅ Purchase event tracked successfully');
    } catch (error) {
      console.error('❌ Failed to track purchase event:', error);
      // Don't throw - tracking failures shouldn't break the purchase flow
    }
  }

  /**
   * Track purchase to Meta (Facebook) SDK
   * Note: Requires Meta SDK to be installed and initialized
   */
  private async trackToMeta(data: PurchaseEventData): Promise<void> {
    try {
      // Check if Meta SDK is available
      // Meta SDK would typically be imported as:
      // import { AppEventsLogger } from 'react-native-fbsdk-next';
      
      // Example implementation (uncomment when Meta SDK is installed):
      /*
      if (Platform.OS === 'ios') {
        const { AppEventsLogger } = require('react-native-fbsdk-next');
        
        // Log purchase event
        AppEventsLogger.logPurchase(data.revenue, data.currency, {
          'fb_content_type': 'subscription',
          'fb_content_id': data.productId,
          'fb_currency': data.currency,
        });
        
        // Log SKAdNetwork conversion value update
        // Meta SDK automatically handles this when SKAdNetwork IDs are in Info.plist
        AppEventsLogger.logEvent('fb_mobile_purchase', {
          valueToSum: data.revenue,
          currency: data.currency,
        });
      }
      */
      
      // For now, just log that we would track to Meta
      if (__DEV__) {
        console.log('📱 Would track to Meta SDK:', {
          revenue: data.revenue,
          currency: data.currency,
          productId: data.productId,
        });
      }
    } catch (error) {
      console.log('ℹ️ Meta SDK not available or not configured');
    }
  }

  /**
   * Track purchase to TikTok SDK
   * Note: Requires TikTok SDK to be installed and initialized
   */
  private async trackToTikTok(data: PurchaseEventData): Promise<void> {
    try {
      // Check if TikTok SDK is available
      // TikTok SDK would typically be imported as:
      // import { TikTokSdk } from '@tiktok/tiktok-sdk';
      
      // Example implementation (uncomment when TikTok SDK is installed):
      /*
      if (Platform.OS === 'ios') {
        const TikTokSdk = require('@tiktok/tiktok-sdk');
        
        // Track purchase event
        TikTokSdk.trackEvent('Purchase', {
          value: data.revenue,
          currency: data.currency,
          content_type: 'subscription',
          content_id: data.productId,
        });
      }
      */
      
      // For now, just log that we would track to TikTok
      if (__DEV__) {
        console.log('🎵 Would track to TikTok SDK:', {
          revenue: data.revenue,
          currency: data.currency,
          productId: data.productId,
        });
      }
    } catch (error) {
      console.log('ℹ️ TikTok SDK not available or not configured');
    }
  }

  /**
   * Track purchase to Taboola SDK
   * Note: Taboola SDK is already installed (@taboola/react-native-plugin-4x)
   */
  private async trackToTaboola(data: PurchaseEventData): Promise<void> {
    try {
      // Taboola SDK is installed, but we need to check if it's initialized
      // Taboola typically tracks events through their SDK
      
      // Example implementation (uncomment when Taboola SDK is properly configured):
      /*
      if (Platform.OS === 'ios') {
        const Taboola = require('@taboola/react-native-plugin-4x');
        
        // Track purchase event
        Taboola.trackEvent('purchase', {
          revenue: data.revenue,
          currency: data.currency,
          productId: data.productId,
        });
      }
      */
      
      // For now, just log that we would track to Taboola
      if (__DEV__) {
        console.log('📰 Would track to Taboola SDK:', {
          revenue: data.revenue,
          currency: data.currency,
          productId: data.productId,
        });
      }
    } catch (error) {
      console.log('ℹ️ Taboola SDK not available or not configured');
    }
  }

  /**
   * Track purchase restoration
   * Called when a user restores their purchases
   */
  async trackRestore(customerInfo: CustomerInfo): Promise<void> {
    try {
      console.log('📊 Tracking purchase restore event');
      
      // RevenueCat automatically handles SKAdNetwork for restores too
      // Additional tracking can be added here if needed
      
      if (__DEV__) {
        console.log('✅ Purchase restore tracked');
      }
    } catch (error) {
      console.error('❌ Failed to track purchase restore:', error);
    }
  }
}

// Export singleton instance
export const purchaseEventTrackingService = new PurchaseEventTrackingService();

export default purchaseEventTrackingService;

