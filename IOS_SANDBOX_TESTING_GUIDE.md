# iOS Sandbox Testing Guide for RevenueCat

## How RevenueCat Detects Sandbox Accounts

**Good news:** RevenueCat **automatically detects** iOS sandbox accounts. You don't need to configure anything special. The iOS SDK automatically identifies when purchases are made with a sandbox account.

## How It Works

### 1. **Before Login (Anonymous User)**
- RevenueCat initializes with an **anonymous user ID** (e.g., `$RCAnonymousID:abc123`)
- If a purchase is made before login, it's stored under this anonymous ID
- RevenueCat automatically detects if it's a sandbox purchase

### 2. **After Login (Authenticated User)**
- When the user logs in, your app calls `revenueCatService.setUserId(user.id)` 
- This uses `Purchases.logIn(userId)` to link the anonymous purchases to the authenticated user
- Any sandbox purchases made before login are automatically transferred to the authenticated user
- RevenueCat continues to detect sandbox purchases automatically

### 3. **Sandbox Detection**
- RevenueCat's iOS SDK automatically detects sandbox purchases
- The `CustomerInfo` object includes an `isSandbox` flag
- You can check this in your code if needed (though it's usually not necessary)

## Setting Up Sandbox Testing

### Step 1: Create Sandbox Test Accounts in App Store Connect

1. Go to **App Store Connect** → **Users and Access** → **Sandbox Testers**
2. Click **"+"** to create a new sandbox tester
3. Fill in:
   - **First Name** and **Last Name**
   - **Email** (must be unique, doesn't need to be real)
   - **Password** (must meet Apple's requirements)
   - **Country/Region** (choose your test region)
4. Save the account

### Step 2: Sign Out of Your Real Apple ID on Test Device

**Important:** You MUST sign out of your real Apple ID to use sandbox accounts.

1. On your iOS device, go to **Settings** → **App Store**
2. Tap on your Apple ID at the top
3. Tap **"Sign Out"**
4. Confirm sign out

### Step 3: Make a Test Purchase

1. Open your app
2. Navigate to the paywall (during onboarding or from Profile)
3. Tap a subscription option
4. When prompted to sign in, use your **sandbox test account** credentials
5. Complete the purchase
6. RevenueCat will automatically detect this is a sandbox purchase

### Step 4: Verify Sandbox Purchase

You can verify sandbox purchases in several ways:

#### In Your App Code:
```typescript
const customerInfo = await revenueCatService.getCustomerInfo();
console.log('Is Sandbox:', customerInfo.isSandbox); // Will be true for sandbox purchases
```

#### In RevenueCat Dashboard:
1. Go to **RevenueCat Dashboard** → **Customers**
2. Find your test user
3. Check the purchase details - sandbox purchases are marked

#### In App Store Connect:
1. Go to **App Store Connect** → **Sales and Trends**
2. Sandbox purchases appear separately from production purchases

## Current Implementation in Your App

### User ID Linking Flow

Your app correctly handles the post-paywall login scenario:

1. **Paywall shown** (user is anonymous)
   - RevenueCat uses anonymous ID
   - Purchases can be made (will be sandbox if using sandbox account)

2. **User logs in** (after paywall)
   - `RevenueCatContext.tsx` detects authentication
   - Calls `revenueCatService.setUserId(user.id)` 
   - This uses `Purchases.logIn(userId)` to link purchases
   - Any anonymous purchases (including sandbox) are transferred to the authenticated user

3. **Purchase restoration**
   - After login, `restorePurchases()` is called
   - This ensures all purchases (including sandbox) are linked to the user

### Code Location

The user ID linking happens in:
- **File:** `src/context/RevenueCatContext.tsx`
- **Lines:** 117-131
- **Function:** `useEffect` that watches `isAuthenticated` and `user?.id`

```typescript
// Sync user ID when authenticated and restore purchases
useEffect(() => {
  if (isInitialized && isAuthenticated && user?.id) {
    revenueCatService.setUserId(user.id).then(async () => {
      // Restore purchases to link any anonymous purchases to this user
      await revenueCatService.restorePurchases();
      loadData();
    });
  }
}, [isInitialized, isAuthenticated, user?.id, loadData]);
```

## Testing Checklist

### ✅ Pre-Testing Setup
- [ ] Created sandbox test accounts in App Store Connect
- [ ] Signed out of real Apple ID on test device
- [ ] Disabled mock data mode (`USE_MOCK_DATA = false` in `revenueCatService.ts`)
- [ ] Built app with production RevenueCat API keys

### ✅ Test Scenarios

#### Scenario 1: Purchase Before Login
1. [ ] Open app (anonymous)
2. [ ] Navigate to paywall
3. [ ] Make purchase with sandbox account
4. [ ] Verify purchase appears in RevenueCat Dashboard (marked as sandbox)
5. [ ] Complete login
6. [ ] Verify purchase is linked to authenticated user
7. [ ] Verify premium features are unlocked

#### Scenario 2: Purchase After Login
1. [ ] Complete login first
2. [ ] Navigate to paywall
3. [ ] Make purchase with sandbox account
4. [ ] Verify purchase is immediately linked to user
5. [ ] Verify premium features unlock

#### Scenario 3: Restore Purchases
1. [ ] Make a sandbox purchase
2. [ ] Delete and reinstall app
3. [ ] Login with same account
4. [ ] Verify purchases are restored
5. [ ] Verify premium status is correct

## Verifying Payments Work Correctly

### 1. Check RevenueCat Dashboard

1. Go to **RevenueCat Dashboard** → **Customers**
2. Search for your test user ID (Firebase UID)
3. Check:
   - ✅ Subscription status shows as "Active"
   - ✅ Entitlements show "premium" as active
   - ✅ Purchase is marked as "Sandbox" (if testing)
   - ✅ Expiration date is correct

### 2. Check App Functionality

1. **Premium Features:**
   - [ ] Food scanning works
   - [ ] AI analysis works
   - [ ] All premium features accessible

2. **Subscription Status:**
   - [ ] Profile shows premium status
   - [ ] Paywall doesn't show for premium users
   - [ ] Subscription management works

### 3. Check Console Logs

Enable verbose logging (already enabled in dev mode):
```typescript
// In revenueCatService.ts, line 259
if (__DEV__) {
  Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
}
```

Look for:
- ✅ "✅ RevenueCat initialized"
- ✅ "✅ Purchases restored after login"
- ✅ Customer info logs showing sandbox status

### 4. Test Subscription Lifecycle

#### Test Trial Period:
1. [ ] Start 3-day trial
2. [ ] Verify trial expiration reminder is scheduled
3. [ ] Wait for trial to expire (or manually expire in App Store Connect)
4. [ ] Verify app detects expiration
5. [ ] Verify premium features are locked

#### Test Cancellation:
1. [ ] Cancel subscription in App Store settings
2. [ ] Verify cancellation offer appears in app
3. [ ] Verify webhook receives cancellation event (if configured)

## Common Issues & Solutions

### Issue: Sandbox purchases not detected

**Solution:**
- ✅ Make sure you're signed out of your real Apple ID
- ✅ Use a sandbox test account (not your real Apple ID)
- ✅ Check that `USE_MOCK_DATA = false` in production builds
- ✅ Verify RevenueCat API keys are correct

### Issue: Purchases not linking after login

**Solution:**
- ✅ Check console logs for `setUserId` calls
- ✅ Verify `user.id` is not null when calling `setUserId`
- ✅ Check that `restorePurchases()` is called after login
- ✅ Verify Firebase authentication is working

### Issue: Premium status not updating

**Solution:**
- ✅ Call `loadData()` after purchase completes
- ✅ Check `isPremium()` function returns correct value
- ✅ Verify entitlements in RevenueCat Dashboard
- ✅ Check for errors in console logs

## Production vs Sandbox

### Development/Testing
- Use **sandbox test accounts** for testing
- Purchases are free and don't charge real money
- Sandbox purchases are marked in RevenueCat Dashboard
- Test subscriptions expire quickly (for testing)

### Production
- Real users use their **real Apple IDs**
- Purchases charge real money
- RevenueCat automatically handles both sandbox and production
- No code changes needed between sandbox and production

## Important Notes

1. **No Code Changes Needed:** RevenueCat automatically detects sandbox vs production. Your code doesn't need to differentiate.

2. **User ID Timing:** Even though login happens after paywall, RevenueCat handles this correctly:
   - Anonymous purchases are stored temporarily
   - When user logs in, `Purchases.logIn()` links them
   - All purchases (sandbox or production) are preserved

3. **Testing in Production Build:** For final testing, create a TestFlight build with:
   - `USE_MOCK_DATA = false`
   - Production RevenueCat API keys
   - Real App Store Connect products configured

4. **Sandbox Account Limits:**
   - Sandbox accounts can only be used for testing
   - They don't work in production App Store
   - You can create up to 200 sandbox testers per app

## Quick Test Command

To quickly test if sandbox detection is working, add this to your code temporarily:

```typescript
const customerInfo = await revenueCatService.getCustomerInfo();
console.log('🔍 Sandbox Status:', {
  isSandbox: customerInfo.isSandbox,
  userId: customerInfo.originalAppUserId,
  hasPremium: customerInfo.entitlements.active['premium'] !== undefined,
});
```

This will log whether RevenueCat detected a sandbox purchase.

