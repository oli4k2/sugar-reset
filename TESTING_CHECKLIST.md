# Testing Checklist - Before You Start

## ⚠️ Critical Fix Needed First

**In your default offering, you still have:**
- `$rc_monthly` → **Must rename to** `monthly`
- `$rc_annual` → **Must rename to** `annual`
- `$rc_lifetime` → **Must rename to** `lifetime_offer1`

**To fix:**
1. Go to RevenueCat → Offerings → `default`
2. Click **Edit**
3. For each package, click on it and change the **Identifier**:
   - `$rc_monthly` → `monthly`
   - `$rc_annual` → `annual`
   - `$rc_lifetime` → `lifetime_offer1`
4. **Save** each package

**Also verify:**
- `annual_offer1` offering: Package identifier should be `annual_offer1` (not `$rc_annual`)
- `lifetime_offer2` offering: Package identifier should be `lifetime_offer2` (not `$rc_lifetime`)

---

## ✅ Pre-Testing Checklist

### 1. RevenueCat Setup
- [ ] All 5 products created and linked to App Store Connect
- [ ] Default offering has packages: `monthly`, `annual`, `lifetime_offer1`
- [ ] `annual_offer1` offering has package: `annual_offer1`
- [ ] `lifetime_offer2` offering has package: `lifetime_offer2`
- [ ] All package identifiers are correct (no `$rc_` prefix)
- [ ] Default offering is set as current (checkmark ✓)
- [ ] All products linked to `premium` entitlement

### 2. App Store Connect
- [ ] Monthly subscription: `monthly_subscription` - $8.99
- [ ] Yearly subscription: `yearly_subscription` - $14.99
- [ ] Yearly offer: `yearly_subscription_offer` - $12.99
- [ ] Lifetime offer 1: `lifetime_offer_1` - $24.99 (Non-Consumable)
- [ ] Lifetime offer 2: `lifetime_offer_2` - $14.99 (Non-Consumable)
- [ ] 3-day free trial added to `yearly_subscription`
- [ ] All products have metadata (display names, descriptions)
- [ ] All products submitted for review (or at least "Ready to Submit")

### 3. Code Updates
- [ ] Code uses correct product IDs
- [ ] Code uses correct package identifiers
- [ ] Webhook endpoint is implemented
- [ ] Environment variables set (RevenueCat API keys)

### 4. Webhook Deployment
- [ ] Webhook deployed to Vercel/Firebase
- [ ] Webhook URL configured in RevenueCat
- [ ] Authorization header set in RevenueCat webhook settings
- [ ] Webhook secret matches between RevenueCat and your code

### 5. iOS Build
- [ ] App built with latest code
- [ ] RevenueCat SDK properly configured
- [ ] API keys in environment variables
- [ ] TestFlight build ready (or local build for testing)

---

## 🧪 Testing Steps

### Step 1: Deploy Webhook

1. **Push to Vercel/Firebase:**
   ```bash
   git add .
   git commit -m "Update RevenueCat integration"
   git push
   ```

2. **Verify Webhook URL:**
   - Go to RevenueCat Dashboard → **Project Settings** → **Webhooks**
   - Add webhook URL: `https://sugar-reset.firebaseapp.com/api/revenuecat/webhook`
   - Set Authorization header (same as in your code)
   - Enable events: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `UNCANCELLATION`

### Step 2: Build iOS App

1. **Update Environment Variables:**
   - Make sure `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` is set
   - Or `EXPO_PUBLIC_REVENUECAT_API_KEY` for both platforms

2. **Build for Testing:**
   ```bash
   # For TestFlight
   eas build --platform ios --profile production
   
   # Or for local testing
   npx expo run:ios
   ```

3. **Install on Device:**
   - Use TestFlight or install directly on device

### Step 3: Create Sandbox Test Account

1. **In App Store Connect:**
   - Go to **Users and Access** → **Sandbox Testers**
   - Click **"+"** to add new tester
   - Create test account (use a real email you can access)
   - Note: Sandbox accounts are separate from regular Apple IDs

### Step 4: Test in Sandbox

1. **Sign Out of App Store:**
   - On your test device, go to **Settings** → **App Store**
   - Sign out of your regular Apple ID

2. **Test Purchases:**
   - Open your app
   - Go through paywall flow
   - When prompted, sign in with **sandbox test account**
   - Purchases will be **FREE** in sandbox
   - Test all scenarios:
     - ✅ Monthly subscription purchase
     - ✅ Yearly subscription with 3-day trial
     - ✅ Cancellation offer flow (Offer 1: yearly or lifetime)
     - ✅ Cancellation offer flow (Offer 2: lifetime)
     - ✅ Restore purchases

3. **Verify Webhook:**
   - Check Firebase Functions logs
   - Verify webhook receives events
   - Check that user premium status updates

### Step 5: Test Cancellation Offers

1. **Trigger Cancellation Offer:**
   - Start a trial or subscription
   - Try to cancel (or wait for trial to expire)
   - Verify cancellation offer screen appears
   - Test both offers:
     - Offer 1: $12.99/year or $24.99 lifetime
     - Offer 2: $14.99 lifetime

---

## 📱 Sandbox vs Production

### Sandbox Testing
- **Works in:** Development builds, TestFlight builds
- **Purchases:** Always FREE (no real charges)
- **Accounts:** Separate sandbox test accounts
- **Limitations:**
  - Can't test real payment flows
  - Some features may behave differently
  - Webhooks still work

### Production
- **Works in:** App Store releases only
- **Purchases:** REAL charges (use small amounts for testing!)
- **Accounts:** Real Apple IDs
- **Important:** 
  - ⚠️ Sandbox accounts DO NOT work in production
  - You need real Apple IDs for production testing
  - Use small test purchases ($0.99) if possible

### Best Practice
1. **Test thoroughly in sandbox first**
2. **Use TestFlight for beta testing**
3. **Only test in production with small amounts**

---

## 🔍 What to Check During Testing

### Paywall Screen
- [ ] Monthly price shows: $8.99
- [ ] Yearly price shows: $14.99
- [ ] "Try for $0.00" button shows (3-day trial)
- [ ] Monthly equivalent calculated correctly

### Purchase Flow
- [ ] Purchase completes successfully
- [ ] Premium access granted immediately
- [ ] User sees success message
- [ ] App navigates correctly after purchase

### Trial Period
- [ ] 3-day trial starts correctly
- [ ] Trial expiration reminder scheduled
- [ ] User can cancel during trial
- [ ] No charge if cancelled during trial

### Cancellation Offers
- [ ] Offer 1 appears with correct prices ($12.99/year, $24.99 lifetime)
- [ ] Offer 2 appears with correct price ($14.99 lifetime)
- [ ] Purchases work from cancellation offers
- [ ] Premium access granted after purchase

### Restore Purchases
- [ ] "Restore Purchases" button works
- [ ] Previous purchases restored
- [ ] Premium access restored

### Webhook Events
- [ ] `INITIAL_PURCHASE` event received
- [ ] User premium status updated in database
- [ ] Webhook logs show successful processing

---

## 🐛 Common Issues & Fixes

### Issue: "Package not found"
**Fix:** 
- Verify package identifiers match exactly (no `$rc_` prefix)
- Check that packages are in correct offerings
- Ensure default offering is set as current

### Issue: "Product not available"
**Fix:**
- Check App Store Connect - products must be approved or "Ready to Submit"
- Verify product IDs match exactly between App Store and RevenueCat
- Check that products are linked in RevenueCat

### Issue: "Webhook not receiving events"
**Fix:**
- Verify webhook URL is correct
- Check Authorization header matches
- Check Firebase Functions logs for errors
- Verify webhook is enabled in RevenueCat

### Issue: "Trial not showing"
**Fix:**
- Verify 3-day trial is configured in App Store Connect
- Check that trial is set as "Introductory Offer"
- Ensure trial is approved (if required)

### Issue: "Sandbox purchase not working"
**Fix:**
- Sign out of regular Apple ID
- Use sandbox test account
- Make sure device is signed out of App Store

---

## 🚀 Next Steps After Testing

1. **Fix any issues found during testing**
2. **Complete App Store Connect metadata** (if not done)
3. **Submit app for review** with all products
4. **Wait for approval**
5. **Test in production** with small purchases
6. **Monitor webhook logs** for any issues
7. **Monitor RevenueCat dashboard** for purchase events

---

## 📝 Notes

- **Google Play:** You mentioned you haven't added Google subscriptions yet. That's fine - you can test iOS first, then add Android later.
- **Webhook:** Make sure to deploy webhook before testing, or premium status won't update in your database.
- **Sandbox:** Sandbox testing is free and safe - use it extensively before going to production.
- **Production Testing:** Only test in production with small amounts, and be aware that sandbox accounts won't work.

---

## ✅ Ready to Test?

Once you've:
1. ✅ Fixed package identifiers (removed `$rc_` prefix)
2. ✅ Deployed webhook to Vercel/Firebase
3. ✅ Built iOS app
4. ✅ Created sandbox test account
5. ✅ All products approved/ready in App Store Connect

You're ready to start testing! 🎉

