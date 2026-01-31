# RevenueCat Setup Guide for SugarReset

## ✅ Completed Steps

- [x] Installed `react-native-purchases` SDK
- [x] Created RevenueCat service with testing modes support
- [x] Created RevenueCat context and hook for easy access
- [x] Updated PaywallScreen with full RevenueCat integration
- [x] Added premium feature utilities and PremiumGate component
- [x] Integrated RevenueCat provider in App.tsx
- [x] Configured environment variables for API keys

## 📋 What You Need to Do in RevenueCat Dashboard

### 1. **Create Your App in RevenueCat**
   - Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
   - Navigate to **Projects** → Select your project
   - Add your iOS and Android apps

### 2. **Configure Platform Settings**

#### For iOS:
- **App Store Connect**:
  - Add your iOS app's Bundle ID (found in `app.json`)
  - Upload App Store Connect API Key (or use shared secret)
  - This allows RevenueCat to validate App Store purchases

#### For Android:
- **Google Play Console**:
  - Add your Android app's Package Name (found in `app.json`)
  - Upload Google Play Service Account JSON credentials
  - This allows RevenueCat to validate Google Play purchases

### 3. **Create Products & Offerings**

#### Products:
1. Go to **Products** in the RevenueCat dashboard
2. Add your products that match your App Store/Google Play products:
   - Example: `premium_monthly`, `premium_yearly`
   - Make sure these IDs match what you created in App Store Connect and Google Play Console

#### Offerings:
1. Go to **Offerings** in the RevenueCat dashboard
2. Create an offering (e.g., "Premium")
3. Add packages to the offering:
   - Monthly subscription
   - Yearly subscription
   - Lifetime purchase (if applicable)

### 4. **Create Your In-App Purchases**

#### App Store Connect (iOS):
1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Select your app
3. Go to **Monetization** → **Subscriptions** (or In-App Purchases)
4. Create your subscription products:
   - Product ID: `premium_monthly`
   - Product ID: `premium_yearly`

#### Google Play Console (Android):
1. Go to [Google Play Console](https://play.google.com/console/)
2. Select your app
3. Go to **Monetize** → **Subscriptions** (or In-App Products)
4. Create your subscription products:
   - Product ID: `premium_monthly`
   - Product ID: `premium_yearly`

### 5. **Update Your .env File**

Make sure your `.env` file has the RevenueCat API key:

```bash
# Use test key for development
EXPO_PUBLIC_REVENUECAT_API_KEY=test_GwoLayASWqVLmysxxVOAQrvtTXz

# For production, use platform-specific keys:
# EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=your_production_ios_key
# EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your_production_android_key
```

### 6. **Test Your Integration**

Before building for production, test with sandbox accounts:

#### iOS Testing:
1. Create a sandbox tester account in App Store Connect
2. Sign in with that account on your test device
3. Test purchases in your app

#### Android Testing:
1. Add test account emails in Google Play Console
2. Sign in with those accounts on your test device
3. Test purchases in your app

## 🔑 Getting Your API Keys

### From RevenueCat Dashboard:
1. Go to **Project Settings** → **API Keys**
2. You'll see:
   - **Public SDK Keys** (use these in your app):
     - iOS Key
     - Android Key
     - Or a shared key for both platforms
   - **Secret API Keys** (use these for server-side operations only)

### Current Setup:
The app is configured to use:
- A single `EXPO_PUBLIC_REVENUECAT_API_KEY` for both platforms (good for testing)
- Or platform-specific keys: `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` and `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`

## 🎯 Testing Modes

The RevenueCat integration supports multiple testing modes:

### 1. **Mock Data Mode** (Development)
To enable mock data for UI development, edit `src/services/revenueCatService.ts`:

```typescript
const USE_MOCK_DATA = __DEV__ && true; // Change to true
```

This allows you to:
- Test the paywall UI without store setup
- See subscription options with mock prices
- Simulate purchases (no real transactions)

### 2. **Test Mode** (Sandbox Testing)
Use your test API key (`test_GwoLayASWqVLmysxxVOAQrvtTXz`) with:
- Real RevenueCat API calls
- Sandbox purchases (no real charges)
- Full purchase flow testing

### 3. **Production Mode**
Use production API keys from RevenueCat dashboard for real purchases.

## 📱 Using Premium Features

### Check Premium Status in Components:

```typescript
import { useRevenueCat } from '../hooks/useRevenueCat';

function MyComponent() {
  const { isPremium, isLoading } = useRevenueCat();
  
  if (isLoading) return <Loading />;
  
  if (!isPremium) {
    return <PaywallPrompt />;
  }
  
  return <PremiumFeature />;
}
```

### Gate Premium Features:

```typescript
import { PremiumGate } from '../components/PremiumGate';

function MyScreen() {
  const navigation = useNavigation();
  
  return (
    <View>
      <FreeFeature />
      
      <PremiumGate 
        showPaywall={() => navigation.navigate('Paywall')}
        message="Unlock advanced analytics with Premium"
      >
        <AdvancedAnalytics />
      </PremiumGate>
    </View>
  );
}
```

### Check Premium Outside Components:

```typescript
import { checkPremiumAccess } from '../utils/premiumUtils';

const hasAccess = await checkPremiumAccess();
if (hasAccess) {
  // Show premium feature
}
```

## 🛠️ Build Requirements

Since RevenueCat requires native code, you'll need to:

```bash
# Build a development client
npx expo prebuild

# Then run on your device
npx expo run:ios
# or
npx expo run:android
```

You cannot test in-app purchases in Expo Go - you must use a development build or production build.

## 🧪 Testing Checklist

Before going to production:

- [ ] Test with mock data mode (UI works correctly)
- [ ] Test with test API key (real API calls work)
- [ ] Test purchase flow on iOS (sandbox account)
- [ ] Test purchase flow on Android (test account)
- [ ] Test restore purchases functionality
- [ ] Verify premium features unlock after purchase
- [ ] Test subscription cancellation flow
- [ ] Verify entitlements sync correctly after login
- [ ] Test error handling (network errors, cancelled purchases)

## 🚀 Production Checklist

Before launching:

- [ ] Create products in App Store Connect
- [ ] Create products in Google Play Console
- [ ] Set up offerings in RevenueCat dashboard
- [ ] Configure entitlements in RevenueCat
- [ ] Add production API keys to `.env`
- [ ] Test with production API keys (sandbox still)
- [ ] Set up webhook endpoints (optional, for server-side validation)
- [ ] Configure subscription management URLs
- [ ] Test restore purchases with real accounts
- [ ] Monitor RevenueCat dashboard for errors

## 📚 Additional Resources

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [RevenueCat React Native SDK](https://docs.revenuecat.com/docs/reactnative)
- [Testing Purchases](https://docs.revenuecat.com/docs/sandbox)
- [Expo with RevenueCat](https://docs.revenuecat.com/docs/reactnative-expo)

