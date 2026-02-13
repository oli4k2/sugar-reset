# Subscription & Free Tier Functionality

## 📋 How Subscription/Offering Works

### 1. **RevenueCat Integration**

**Flow:**
1. App loads → RevenueCat initializes with API keys
2. `RevenueCatContext` loads current offering and customer info
3. Premium status checked via `isPremium` (from RevenueCat entitlements)
4. `useRevenueCat()` hook provides premium status throughout app

**Key Components:**
- `RevenueCatContext` - Global state for premium status
- `useRevenueCat()` hook - Access premium status anywhere
- `PremiumGate` component - Conditionally render premium features

### 2. **Purchase Flow**

**Main Paywall:**
- User sees paywall during onboarding
- Can choose: Monthly ($8.99) or Yearly ($14.99 with 3-day trial)
- Purchase → `isPremium = true` → Full access

**Cancellation Offers:**
- If user cancels or trial expires → Cancellation offer screen
- Offer 1: $12.99/year OR $24.99 lifetime
- Offer 2: $14.99 lifetime
- If declined → Free tier

**Free Tier:**
- User completes onboarding without purchasing
- `isPremium = false`
- Limited features (see below)

### 3. **Package Structure**

**Default Offering:**
- `monthly` → `monthly_subscription` ($8.99)
- `annual` → `yearly_subscription` ($14.99, 3-day trial)
- `lifetime_offer1` → `lifetime_offer_1` ($24.99)

**Separate Offerings:**
- `annual_offer1` → `yearly_subscription_offer` ($12.99)
- `lifetime_offer2` → `lifetime_offer_2` ($14.99)

Code searches across all offerings to find packages.

---

## 🆓 Free Tier Features

### ✅ **Available for Free Users:**

1. **Manual Food Entry**
   - Text input in Food Scanner Modal
   - Can type food name and get analysis
   - Can add food manually to maintain streak

2. **Food Logging**
   - View food logs
   - Track what they've eaten
   - Streak calculation works

3. **Basic Tracking**
   - Wellness check-ins
   - Journal entries
   - Basic analytics

4. **Community Features**
   - View community posts
   - Basic engagement

### ❌ **Premium-Only Features:**

1. **Food Scanning**
   - Camera scan (take photo)
   - Gallery image analysis
   - AI-powered food recognition from images

2. **Inner Circle**
   - Accountability partners
   - SOS panic button
   - Friend connections
   - Support network features

3. **Advanced Analytics**
   - Detailed insights
   - Advanced tracking features

---

## 🔒 Feature Gating Implementation

### Current State:
- ❌ Food Scanner Modal - NOT gated (allows scan for free users)
- ❌ Inner Circle Screen - NOT gated (accessible to free users)
- ✅ PremiumGate component exists but not used

### What Needs to Be Done:
1. Gate camera/gallery scan in FoodScannerModal
2. Gate Inner Circle screen completely
3. Allow text input in scanner for free users
4. Ensure manual food entry maintains streak

---

## 📱 User Flow: Free Tier

1. **Onboarding:**
   - User sees paywall
   - Declines all offers → "Continue with Free"
   - Completes onboarding
   - `isPremium = false`

2. **Using App:**
   - Can add food via text input
   - Cannot use camera scan
   - Cannot access Inner Circle
   - Can maintain streak with manual entries

3. **Upgrade Path:**
   - Premium prompts throughout app
   - Can upgrade anytime from Profile/Settings

---

## 🎯 Implementation Plan

1. **Update FoodScannerModal:**
   - Check `isPremium` on open
   - If free: Skip to text-input step
   - Hide camera/gallery buttons for free users
   - Show upgrade prompt

2. **Gate Inner Circle:**
   - Wrap Inner Circle screen with PremiumGate
   - Show upgrade prompt if free user tries to access

3. **Verify Manual Entry:**
   - Ensure text input works for free users
   - Verify streak calculation works with manual entries

