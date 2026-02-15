# Android Build & Testing Guide

## 📋 Prerequisites

**IMPORTANT:** You must set up subscriptions in Google Play Console **BEFORE** building, as the app needs the product IDs to work with RevenueCat.

---

## 🛒 Step 1: Set Up Subscriptions in Google Play Console

### 1.1 Create Your App in Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app (if not already created)
3. Fill in app details:
   - App name: "Craveless"
   - Default language: English
   - App type: App
   - Free or paid: Free

### 1.2 Create Subscription Products

You need to create these subscriptions (matching your iOS products):

#### Required Subscriptions:

1. **Monthly Subscription**
   - Product ID: `monthly_subscription`
   - Price: $8.99/month
   - Type: Auto-renewing subscription
   - Billing period: Monthly

2. **Yearly Subscription** (with 3-day free trial)
   - Product ID: `yearly_subscription`
   - Price: $14.99/year
   - Type: Auto-renewing subscription
   - Billing period: Yearly
   - **Free trial:** 3 days

3. **Yearly Subscription Offer** (for cancellation offers)
   - Product ID: `yearly_subscription_offer`
   - Price: $12.99/year
   - Type: Auto-renewing subscription
   - Billing period: Yearly

#### Required Non-Consumables (One-time purchases):

4. **Lifetime Offer 1**
   - Product ID: `lifetime_offer_1`
   - Price: $24.99
   - Type: Non-consumable (one-time purchase)

5. **Lifetime Offer 2**
   - Product ID: `lifetime_offer_2`
   - Price: $14.99
   - Type: Non-consumable (one-time purchase)

### 1.3 Steps to Create Subscriptions:

1. **Go to Monetize → Products → Subscriptions**
2. **Click "Create subscription"**
3. **For each subscription:**
   - Enter Product ID (e.g., `monthly_subscription`)
   - Enter name (e.g., "Premium Monthly")
   - Enter description
   - Set price and billing period
   - **For yearly_subscription:** Add 3-day free trial
   - Click "Save"

4. **For Non-Consumables:**
   - Go to **Monetize → Products → In-app products**
   - Click "Create product"
   - Enter Product ID (e.g., `lifetime_offer_1`)
   - Set price
   - Type: Non-consumable
   - Click "Save"

### 1.4 Activate Products

- After creating, you need to **activate** each product
- Products must be **Active** before they can be used in the app

---

## 🔗 Step 2: Link Products in RevenueCat

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Select your project
3. Go to **Products** tab
4. For each Google Play product:
   - Click "Add Product"
   - Select **Google Play**
   - Enter Product ID (e.g., `monthly_subscription`)
   - Link to your Google Play product
   - Save

5. **Update Offerings:**
   - Go to **Offerings** tab
   - Update your offerings to include Google Play products
   - Make sure package identifiers match:
     - `monthly` → `monthly_subscription`
     - `annual` → `yearly_subscription`
     - `annual_offer1` → `yearly_subscription_offer`
     - `lifetime_offer1` → `lifetime_offer_1`
     - `lifetime_offer2` → `lifetime_offer_2`

---

## 📱 Step 3: Build for Android

### 3.1 Build Command

```bash
eas build --platform android --profile production
```

**OR for internal testing (faster):**

```bash
eas build --platform android --profile preview
```

### 3.2 Build Process

1. **EAS builds in the cloud** (no Android Studio needed)
2. **Build takes ~15-30 minutes**
3. **EAS uploads to Google Play Console automatically** (if configured)
4. **OR download APK/AAB and upload manually**

---

## 🧪 Step 4: Set Up Internal Testing

### 4.1 Upload Build to Internal Testing Track

1. Go to **Google Play Console** → Your App
2. Go to **Testing → Internal testing**
3. Click **"Create new release"**
4. Upload your build (AAB file from EAS)
5. Add release notes
6. Click **"Save"** (don't publish yet)

### 4.2 Add Testers

1. In **Internal testing** section
2. Click **"Testers"** tab
3. Click **"Create email list"**
4. Add coworkers' Gmail addresses
5. **OR** use **"Join on the web"** link (share with coworkers)

### 4.3 Publish to Internal Testing

1. Click **"Review release"**
2. Review and click **"Start rollout to Internal testing"**
3. Build will be available to testers within minutes

---

## 👥 Step 5: Coworkers Test the App

### 5.1 For Testers (Coworkers)

1. **Accept invitation:**
   - They receive email invitation
   - OR use the "Join on the web" link you share

2. **Install the app:**
   - Open the link on their Android device
   - Click "Become a tester"
   - Click "Download it on Google Play"
   - Install from Google Play Store

3. **Test with sandbox accounts:**
   - Create test Google accounts in Play Console
   - Sign in with test account on device
   - Test purchases (they're free in sandbox)

### 5.2 Sandbox Testing Setup

1. **Create test accounts:**
   - Google Play Console → **Settings → License testing**
   - Add Gmail addresses as testers
   - These accounts can test purchases for free

2. **Test purchases:**
   - Sign in with test account on Android device
   - Make purchases in app
   - Purchases are free (no real charges)
   - Full RevenueCat functionality works

---

## 🔄 Step 6: Update and Rebuild

When you make changes:

1. **Update subscriptions in Play Console** (if needed)
2. **Rebuild:**
   ```bash
   eas build --platform android --profile production
   ```
3. **Upload new build to Internal testing**
4. **Testers get notified** of new version
5. **Update automatically** (or manually from Play Store)

---

## 📊 Comparison: iOS vs Android

| Feature | iOS (TestFlight) | Android (Internal Testing) |
|---------|------------------|---------------------------|
| **Build Command** | `eas build --platform ios --profile production` | `eas build --platform android --profile production` |
| **Testing Platform** | TestFlight | Google Play Internal Testing |
| **Setup Required** | App Store Connect | Google Play Console |
| **Subscription Setup** | App Store Connect | Google Play Console |
| **Tester Access** | TestFlight app | Google Play Store link |
| **Sandbox Testing** | ✅ Yes | ✅ Yes |
| **Processing Time** | 10-30 minutes | 5-15 minutes |
| **Automatic Updates** | ✅ Yes | ✅ Yes |
| **No Mac/Android Studio** | ✅ Yes | ✅ Yes |

---

## ⚠️ Important Notes

### Before Building:

1. ✅ **Subscriptions must be created in Google Play Console**
2. ✅ **Products must be Active**
3. ✅ **Products must be linked in RevenueCat**
4. ✅ **Offerings must include Google Play products**

### Testing:

- ✅ **Sandbox accounts work** (free testing)
- ✅ **No real charges** during testing
- ✅ **Full RevenueCat functionality** works
- ✅ **Can test all subscription flows**

### Production vs Testing:

- ✅ **Internal testing = still testing** (not live in Play Store)
- ✅ **Safe to make changes** and rebuild
- ✅ **No review needed** for internal testing
- ✅ **Can iterate quickly**

---

## 🚀 Quick Start Checklist

### Before First Build:

- [ ] Create app in Google Play Console
- [ ] Create all 5 products (3 subscriptions + 2 non-consumables)
- [ ] Activate all products
- [ ] Link products in RevenueCat
- [ ] Update RevenueCat offerings
- [ ] Set up internal testing track

### Build & Test:

- [ ] Run: `eas build --platform android --profile production`
- [ ] Wait for build (~15-30 minutes)
- [ ] Upload to Internal testing track
- [ ] Add testers (coworkers' Gmail addresses)
- [ ] Publish to Internal testing
- [ ] Share testing link with coworkers
- [ ] Test with sandbox accounts

---

## 💡 Pro Tips

1. **Use Internal Testing** for quick iterations (no review)
2. **Create test Google accounts** for each tester
3. **Test all subscription flows** before production
4. **Keep product IDs consistent** between iOS and Android
5. **Use sandbox accounts** for all testing (free and safe)

---

## ❓ FAQ

**Q: Do I need Android Studio?**
A: No! EAS builds in the cloud. You only need an Android device for testing.

**Q: Can coworkers test without Google Play Console access?**
A: Yes! Share the "Join on the web" link - they don't need console access.

**Q: Do sandbox accounts work in Internal Testing?**
A: Yes! Sandbox accounts work perfectly for testing purchases.

**Q: How long does it take to set up subscriptions?**
A: ~30-60 minutes to create all products and link them in RevenueCat.

**Q: Can I make changes after building?**
A: Yes! Just rebuild and upload a new version to Internal testing.

**Q: Do I need to submit for review for Internal Testing?**
A: No! Internal testing doesn't require review - it's for testing only.

---

## 🎯 Summary

1. **Set up subscriptions in Google Play Console first** (required!)
2. **Link products in RevenueCat**
3. **Build:** `eas build --platform android --profile production`
4. **Upload to Internal testing track**
5. **Add testers and share link**
6. **Test with sandbox accounts**

That's it! 🎉

