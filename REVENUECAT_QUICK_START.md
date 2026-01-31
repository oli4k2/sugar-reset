# RevenueCat Quick Start Guide

## 🚀 What's Been Set Up

Your app now has a complete RevenueCat integration ready for testing and production!

### Files Created:
- ✅ `src/services/revenueCatService.ts` - Core service with testing modes
- ✅ `src/context/RevenueCatContext.tsx` - Global subscription state
- ✅ `src/hooks/useRevenueCat.ts` - Easy-to-use hook
- ✅ `src/components/PremiumGate.tsx` - Component for gating features
- ✅ `src/utils/premiumUtils.ts` - Premium feature utilities

### Files Updated:
- ✅ `App.tsx` - Added RevenueCatProvider
- ✅ `src/screens/onboarding/PaywallScreen.tsx` - Full RevenueCat integration

## 🎯 Quick Usage Examples

### 1. Check Premium Status
```typescript
import { useRevenueCat } from '../hooks/useRevenueCat';

const { isPremium, isLoading } = useRevenueCat();
```

### 2. Gate a Premium Feature
```typescript
import { PremiumGate } from '../components/PremiumGate';

<PremiumGate 
  showPaywall={() => navigation.navigate('Paywall')}
  message="This feature requires Premium"
>
  <YourPremiumFeature />
</PremiumGate>
```

### 3. Purchase a Subscription
```typescript
const { currentOffering, purchasePackage } = useRevenueCat();

const pkg = currentOffering?.monthly; // or .annual
await purchasePackage(pkg);
```

### 4. Restore Purchases
```typescript
const { restorePurchases } = useRevenueCat();
await restorePurchases();
```

## 🧪 Testing Modes

### Mock Mode (UI Development)
Edit `src/services/revenueCatService.ts`:
```typescript
const USE_MOCK_DATA = __DEV__ && true; // Enable mock mode
```

### Test Mode (Sandbox)
Use your test API key in `.env`:
```bash
EXPO_PUBLIC_REVENUECAT_API_KEY=test_GwoLayASWqVLmysxxVOAQrvtTXz
```

### Production Mode
Use production API keys from RevenueCat dashboard.

## 📋 Next Steps

1. **Set up products in stores** (App Store Connect & Google Play Console)
2. **Create offerings in RevenueCat dashboard**
3. **Test with sandbox accounts**
4. **Go live!**

See `REVENUECAT_SETUP_GUIDE.md` for detailed instructions.

