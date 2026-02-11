# RevenueCat Webhook Setup Guide

## Overview

This guide explains how to set up RevenueCat webhooks to automatically handle subscription cancellations, trial expirations, and trigger cancellation offers.

## Webhook Endpoint

**URL:** `https://craveless.info/api/webhooks/revenuecat`

The endpoint is already created at `website/src/app/api/webhooks/revenuecat/route.ts`

## Setup Steps

### 1. Deploy the Webhook Endpoint

The webhook endpoint is part of your Next.js website. Make sure it's deployed to Vercel:

```bash
cd website
# The endpoint will be automatically deployed when you push to main
# Or deploy manually:
vercel deploy --prod
```

### 2. Configure in RevenueCat Dashboard

1. **Go to RevenueCat Dashboard**
   - Navigate to: https://app.revenuecat.com
   - Select your project: **sugar-reset** (or your project name)

2. **Add Webhook**
   - Go to **Project Settings** → **Webhooks**
   - Click **"Add Webhook"**
   - Enter URL: `https://craveless.info/api/webhooks/revenuecat`
   - **Status:** Enabled

3. **Select Events to Listen For**
   Check the following events:
   - ✅ `SUBSCRIPTION_CANCELLED` - When user cancels subscription
   - ✅ `TRIAL_EXPIRED` - When trial period ends
   - ✅ `SUBSCRIPTION_RENEWED` - When subscription renews
   - ✅ `SUBSCRIPTION_DID_CHANGE` - Any subscription change

4. **Optional: Add Webhook Secret** (Recommended for Production)
   - Generate a secret key
   - Add to your `.env` file: `REVENUECAT_WEBHOOK_SECRET=your_secret_here`
   - Update webhook route to verify signature

### 3. Test the Webhook

#### Option A: Use RevenueCat Test Mode
1. In RevenueCat Dashboard, go to **Test Mode**
2. Create a test purchase
3. Cancel the subscription
4. Check webhook logs in RevenueCat Dashboard → **Webhooks** → **Logs**

#### Option B: Test Locally (Development)
1. Use a tool like [ngrok](https://ngrok.com/) to expose local server:
   ```bash
   ngrok http 3000
   ```
2. Use the ngrok URL in RevenueCat webhook settings
3. Test subscription events

#### Option C: Use Developer Tools in App
- Go to Profile → Developer → "Test Cancellation Offers"
- This will show the cancellation offer flow directly

## How It Works

### Subscription Cancellation Flow

1. **User cancels subscription** in App Store/Play Store
2. **RevenueCat sends webhook** to your endpoint
3. **Webhook handler** (`route.ts`) processes the event:
   - Logs the cancellation
   - Stores event in database (TODO: implement)
   - Optionally sends email notification
4. **App detects cancellation** (on next app open):
   - Checks customer info from RevenueCat
   - Shows cancellation offer if subscription was cancelled

### Trial Expiration Flow

1. **Trial expires** (after 3 days)
2. **RevenueCat sends webhook** with `TRIAL_EXPIRED` event
3. **Webhook handler** processes event
4. **App shows upgrade prompt** when user opens app

## Current Implementation Status

### ✅ Implemented
- Webhook endpoint created
- Handles subscription cancellations
- Handles trial expirations
- Handles subscription renewals
- Handles subscription changes

### ⚠️ TODO (Optional Enhancements)
- [ ] Store webhook events in Firestore database
- [ ] Send email notifications for cancellations
- [ ] Implement webhook signature verification
- [ ] Add retry logic for failed webhook processing
- [ ] Create admin dashboard to view webhook events

## Testing Cancellation Offers

### Method 1: Direct Test (Development)
1. Open app in development mode
2. Go to Profile → Developer → "Test Cancellation Offers"
3. This shows the full 3-step offer flow

### Method 2: Via Paywall
1. Navigate to Paywall screen
2. Press back button on intro step
3. Cancellation offer will appear

### Method 3: Real Cancellation (Production)
1. User starts trial
2. User cancels subscription in App Store/Play Store
3. RevenueCat sends webhook
4. Next time user opens app, show cancellation offer

## Adding Lifetime Package

### Important: Product Type Selection

**⚠️ Use "Non-consumable" NOT "Subscription"!**

For a lifetime purchase, you must select **"Non-consumable"** in RevenueCat:
- ✅ **Non-consumable**: One-time purchase that never expires (correct for lifetime)
- ❌ **Subscription**: Recurring payment (wrong for lifetime)
- ❌ **Consumable**: Can be purchased multiple times (wrong for lifetime)

### In RevenueCat Dashboard

1. **Create Product in App Store Connect / Google Play Console**
   - Product ID: `premium_lifetime`
   - Type: **Non-Consumable** (one-time purchase)
   - Price: Set your lifetime price

2. **Add to RevenueCat**
   - Go to RevenueCat Dashboard → **Products** → **Add Product**
   - Display name: "Lifetime Subscription" (or your preferred name)
   - **Product type: Select "Non-consumable"** ⚠️
   - Product ID: `premium_lifetime`
   - Link to App Store/Play Store product

3. **Add to Offering**
   - Go to **Offerings** → Edit your offering
   - Add `premium_lifetime` package
   - Set package identifier: `lifetime`

4. **Update App Code**
   - The mock data already includes lifetime package
   - Real RevenueCat will return it automatically once configured

## Environment Variables

Add to your `.env` file (for production):

```env
REVENUECAT_WEBHOOK_SECRET=your_webhook_secret_here
```

## Monitoring Webhooks

### View Webhook Logs
1. RevenueCat Dashboard → **Webhooks** → **Logs**
2. See all webhook events and responses
3. Check for any failed deliveries

### Debug Locally
- Check Vercel function logs
- Check console logs in webhook route
- Use RevenueCat webhook testing tool

## Troubleshooting

### Webhook Not Receiving Events
- ✅ Verify webhook URL is correct and accessible
- ✅ Check webhook is enabled in RevenueCat
- ✅ Verify events are selected
- ✅ Check Vercel deployment is live
- ✅ Check Vercel function logs for errors

### Cancellation Offers Not Showing
- ✅ Verify webhook is processing `SUBSCRIPTION_CANCELLED` events
- ✅ Check app is checking customer info on launch
- ✅ Verify cancellation offer component is imported
- ✅ Test using developer tools

### Trial Notifications Not Scheduling
- ✅ Check trial purchase completes successfully
- ✅ Verify `scheduleTrialExpirationReminder` is called
- ✅ Check notification permissions are granted
- ✅ Use "View Scheduled Notifications" in developer menu

## Next Steps

1. **Deploy webhook endpoint** to Vercel
2. **Configure webhook** in RevenueCat Dashboard
3. **Add lifetime package** to RevenueCat offering
4. **Test the flow** using developer tools
5. **Monitor webhook logs** for any issues

