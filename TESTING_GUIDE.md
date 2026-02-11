# Testing Guide: Notifications, Cancellation Offers, and Subscriptions

## Testing Scheduled Notifications

### View Scheduled Notifications

1. **Open the app** in development mode
2. **Go to Profile** → Scroll to **Developer** section
3. **Tap "View Scheduled Notifications"**
4. You'll see:
   - All scheduled notifications
   - Their scheduled times
   - Notification types (trial_expiration_reminder, grace_period_warning, etc.)
   - Option to clear all notifications

### Test Trial Expiration Notification

1. **Go to Profile** → **Developer** → **"Test Trial Notification"**
2. This schedules a test notification for **2 days from now at 10 AM**
3. **Verify it's scheduled:**
   - Go back to "View Scheduled Notifications"
   - You should see: "⏰ Your trial ends soon!" scheduled for 2 days from now
4. **To test immediately** (for development):
   - The notification will fire in 2 days
   - Or manually trigger by changing device time (not recommended)

### Test Real Trial Notification

1. **Start a real trial:**
   - Go through Paywall flow
   - Start 3-day free trial
2. **Notification is automatically scheduled** 2 days before trial expires
3. **Check it's scheduled:**
   - Profile → Developer → "View Scheduled Notifications"
   - Should see trial expiration reminder

## Testing Cancellation Offers

### Method 1: Direct Test (Easiest)

1. **Go to Profile** → **Developer** → **"Test Cancellation Offers"**
2. **Cancellation offer modal appears** with:
   - Offer 1: $15/year or $25 lifetime
   - Close button (X) to see next offer
3. **Test the flow:**
   - Tap X → See Offer 2 ($15 lifetime)
   - Tap X again → See Free tier option
   - Tap "Continue with Free" → Modal closes

### Method 2: Via Paywall Screen

1. **Navigate to Paywall** (Profile → Developer → "Test Paywall Flow")
2. **On the intro step**, press the **back button** (or swipe back)
3. **Cancellation offer appears** automatically

### Method 3: Real Subscription Cancellation

1. **Start a subscription** (monthly or yearly)
2. **Cancel it** in App Store/Play Store settings
3. **RevenueCat webhook** sends event to your server
4. **Next time user opens app**, cancellation offer should appear
   - (This requires webhook setup - see REVENUECAT_WEBHOOK_SETUP.md)

## Testing Subscription Flow

### Test Paywall Flow

1. **Profile** → **Developer** → **"Test Paywall Flow"**
2. **Go through the 3-step flow:**
   - Step 1: Intro screen
   - Step 2: Reminder screen
   - Step 3: Plans selection
3. **Start trial:**
   - Select yearly plan
   - Tap "Start My 3-Day Free Trial"
   - Trial notification should be scheduled automatically

### Test Subscription Purchase

1. **In development mode**, purchases are mocked
2. **In production/test mode**, use RevenueCat test accounts
3. **Verify purchase:**
   - Check Profile → Subscription section
   - Should show "Premium Active" if purchase succeeded

## Testing Lifetime Package

### Setup Lifetime Package

1. **In RevenueCat Dashboard:**
   - Create product: `premium_lifetime`
   - Add to offering with identifier: `lifetime`
   - Link to App Store/Play Store product

2. **In App:**
   - Lifetime package should appear automatically
   - Or use mock data in development (already configured)

### Test Lifetime Purchase

1. **Via Cancellation Offer:**
   - Test Cancellation Offers → Accept Lifetime
   - Should show "Lifetime subscription accepted!"

2. **Via Paywall:**
   - Lifetime package should appear in plans (if configured)
   - Purchase directly from paywall

## Developer Menu Visibility

✅ **Already configured correctly!**

The Developer section only appears when `__DEV__` is true:
- ✅ Shows in development mode (`npx expo start`)
- ❌ Hidden in production builds

**Location:** `src/screens/ProfileScreen.tsx:77`
```typescript
...(__DEV__ ? [{
    title: 'Developer',
    items: [...]
}] : []),
```

## Quick Test Checklist

- [ ] View Scheduled Notifications - Shows all scheduled notifications
- [ ] Test Trial Notification - Schedules test notification for 2 days
- [ ] Test Cancellation Offers - Shows full 3-step offer flow
- [ ] Test Paywall Flow - Navigate through paywall steps
- [ ] Verify Developer menu only shows in dev mode

## Troubleshooting

### Notifications Not Showing
- Check notification permissions are granted
- Verify notification service is working
- Check device time is correct
- Use "View Scheduled Notifications" to debug

### Cancellation Offers Not Appearing
- Verify `CancellationOfferScreen` is imported
- Check `showCancellationOffer` state is set
- Verify RevenueCat is initialized
- Check webhook is configured (for real cancellations)

### Lifetime Package Not Available
- Check RevenueCat Dashboard → Offerings
- Verify `lifetime` package identifier matches
- Check product is linked in App Store/Play Store
- In development, mock data includes lifetime package

