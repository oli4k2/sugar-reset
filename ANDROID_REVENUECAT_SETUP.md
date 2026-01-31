# Android RevenueCat Setup Guide

## Step 1: Google Play Console Setup

### 1.1 Create Subscription Products

1. Go to [Google Play Console](https://play.google.com/console/)
2. Select your app (or create it if you haven't)
3. Navigate to: **Monetize** → **Subscriptions** → **Subscriptions**
4. Click **Create subscription**

#### Monthly Subscription:
- **Product ID**: `monthly_subscription` (must match iOS!)
- **Name**: "Monthly Subscription"
- **Description**: "Unlock unlimited tracking, insights, and premium features"
- **Billing period**: 1 month
- **Price**: Set your price (e.g., $9.99/month)
- **Free trial**: Optional (e.g., 7 days)
- **Grace period**: Optional

#### Yearly Subscription:
- **Product ID**: `yearly_subscription` (must match iOS!)
- **Name**: "Yearly Subscription"
- **Description**: "Unlock unlimited tracking, insights, and premium features"
- **Billing period**: 1 year
- **Price**: Set your price (e.g., $99.99/year)
- **Free trial**: Optional
- **Grace period**: Optional

### 1.2 Activate Products

- Products need to be **Active** to test
- For testing, you can activate them immediately (they don't need to be published)
- Go to each product → **Activate**

### 1.3 Set Up Test Accounts (Important!)

1. Go to **Settings** → **License testing**
2. Add test account emails (Gmail accounts)
3. These accounts can test purchases without being charged

---

## Step 2: RevenueCat Dashboard Setup

### 2.1 Add Android App (if not already)

1. Go to RevenueCat Dashboard
2. **Apps & providers** → **Apps**
3. If you don't have Android app:
   - Click **Add app**
   - Select **Android**
   - **Package name**: `com.craveless.app` (from your app.json)
   - **Google Play service account**: Upload your service account JSON
     - Get this from Google Play Console → **Setup** → **API access** → **Service accounts**

### 2.2 Create/Update Products

1. Go to **Product catalog** → **Products**
2. For each product (`monthly_subscription`, `yearly_subscription`):
   - Click on the product
   - Under **Apps**, make sure Android app is linked
   - **Product ID** should match Google Play Console exactly

### 2.3 Attach to Entitlement

1. Go to your product (e.g., `monthly_subscription`)
2. Scroll to **Associated Entitlements**
3. Click **Attach**
4. Select `premium` entitlement (create it if it doesn't exist)

### 2.4 Add to Offering

1. Go to **Offerings**
2. Edit your offering (e.g., `default`)
3. Make sure both products are added as packages:
   - Monthly package → Product: `monthly_subscription`
   - Annual package → Product: `yearly_subscription`
4. Set as **Current Offering**

---

## Step 3: Update Your .env File

Make sure you have the Android API key (or use the shared test key):

```bash
# Test key (works for both iOS and Android)
EXPO_PUBLIC_REVENUECAT_API_KEY=test_GwoLayASWqVLmysxxVOAQrvtTXz

# Or use platform-specific keys:
# EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your_android_key_here
```

---

## Step 4: Build and Test Locally

### 4.1 Prerequisites

Make sure you have:
- Android Studio installed
- Android SDK installed
- Android device connected OR Android emulator running

### 4.2 Build Development Client

```bash
# Generate native Android code
npx expo prebuild --platform android

# Build and run on connected device/emulator
npx expo run:android
```

This will:
- Build the Android app
- Install it on your device/emulator
- Launch the app

### 4.3 Test RevenueCat

1. **Sign in with test account** (from Google Play Console license testing)
2. Navigate to paywall screen
3. You should see your subscription options
4. Try purchasing (won't charge real money with test account)
5. Verify premium unlocks after purchase

---

## Step 5: Verify Everything Works

### Checklist:

- [ ] Products created in Google Play Console
- [ ] Products activated in Google Play Console
- [ ] Test accounts added in Google Play Console
- [ ] Android app added in RevenueCat
- [ ] Products linked in RevenueCat
- [ ] Products attached to `premium` entitlement
- [ ] Products added to offering (set as current)
- [ ] App builds and runs on Android
- [ ] Paywall shows subscription options
- [ ] Purchase flow works
- [ ] Premium status unlocks after purchase

---

## Troubleshooting

### "No offerings found"
- Check that offering is set as "Current Offering" in RevenueCat
- Verify products are in the offering

### "Purchase failed"
- Make sure you're signed in with a test account
- Verify product IDs match exactly between Google Play and RevenueCat
- Check that products are activated in Google Play Console

### "Premium not unlocking"
- Verify `premium` entitlement exists in RevenueCat
- Check that products are attached to the entitlement
- Look at RevenueCat dashboard → Customer to see purchase status

---

## Next Steps

Once Android is working:
1. Test all purchase flows
2. Test restore purchases
3. Verify premium features unlock correctly
4. Then set up iOS with EAS Build (if needed)

