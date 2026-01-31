# RevenueCat Complete Setup Checklist

## ✅ What You've Done
- [x] Created product in App Store Connect with ID: `monthly_subscription`
- [x] Created product in RevenueCat with identifier: `monthly_subscription`
- [x] Updated product IDs to match

## 📋 What's Left to Complete

### 1. **App Store Connect - Complete Subscription Setup**

#### Required:
- [ ] **Add Pricing** (REQUIRED)
  - Set the subscription price (e.g., $9.99/month)
  - Choose at least one country/region
  - You can add more countries later

- [ ] **Add Localization** (REQUIRED for at least your primary language)
  - Go to the "Localization" section
  - Add at minimum:
    - **Display Name**: "Monthly Subscription" (or your preferred name)
    - **Description**: Brief description of what the subscription includes
  - Add for your primary language (usually English)
  - You can add more languages later

- [ ] **Subscription Group** (REQUIRED)
  - Make sure your subscription is in a subscription group
  - If you don't have one, create it first
  - This groups related subscriptions together

- [ ] **Review Information** (REQUIRED before submission)
  - Add subscription review notes (for App Review)
  - Add support URL
  - Add privacy policy URL

#### Optional (but recommended):
- [ ] Add promotional pricing (intro offers, free trials)
- [ ] Add subscription duration options
- [ ] Add family sharing (if applicable)

---

### 2. **RevenueCat - Complete Setup**

#### Required:
- [ ] **Create Entitlement** (REQUIRED - Your code checks for `premium`)
  1. Go to RevenueCat Dashboard → **Entitlements**
  2. Create a new entitlement with identifier: `premium`
  3. Description: "Premium subscription access" (or similar)
  4. **Attach your product** (`monthly_subscription`) to this entitlement
     - Go to your product → "Associated Entitlements" section
     - Click "Attach" and select the `premium` entitlement

- [ ] **Create/Update Offering** (REQUIRED)
  1. Go to RevenueCat Dashboard → **Offerings**
  2. Create or edit an offering (e.g., "default" or "Premium")
  3. Add your product as a package:
     - Package Identifier: `monthly` (or `monthly_subscription`)
     - Product: Select `monthly_subscription`
     - Package Type: `MONTHLY`
  4. Make sure this offering is set as "Current Offering"

#### Optional:
- [ ] Add annual/yearly product if you want both options
- [ ] Create multiple offerings for A/B testing
- [ ] Set up promotional offers

---

### 3. **Link Everything Together**

The flow should be:
```
App Store Connect Product (`monthly_subscription`)
    ↓
RevenueCat Product (Identifier: `monthly_subscription`)
    ↓
RevenueCat Entitlement (`premium`)
    ↓
RevenueCat Offering (contains package with product)
    ↓
Your App (checks for `premium` entitlement)
```

**Verify:**
- [ ] App Store Connect Product ID = RevenueCat Product Identifier ✅ (You've done this!)
- [ ] RevenueCat Product is attached to `premium` entitlement
- [ ] RevenueCat Product is in an offering
- [ ] Offering is set as "Current Offering"

---

### 4. **Test Your Setup**

Once everything is configured:

- [ ] Build development client: `npx expo prebuild && npx expo run:ios`
- [ ] Test fetching offerings (should see your product)
- [ ] Test purchase flow (use sandbox account)
- [ ] Verify premium status unlocks after purchase
- [ ] Test restore purchases

---

## 🎯 Quick Answers to Your Questions

### Q: Do I need to add prices?
**A: YES** - Required in App Store Connect. Set at least one price tier for your primary market.

### Q: Do I need to add Localization?
**A: YES** - Required in App Store Connect. Add at minimum:
- Display Name
- Description
For your primary language (usually English). More languages are optional.

### Q: Do I need to add entitlement in RevenueCat?
**A: YES** - Required! Your code checks for `entitlements.active['premium']`, so you need:
1. Create entitlement with identifier: `premium`
2. Attach your product (`monthly_subscription`) to this entitlement

---

## 🚨 Common Issues

### Issue: "No offerings found"
- **Fix**: Make sure your offering is set as "Current Offering" in RevenueCat
- **Fix**: Make sure your product is added to the offering as a package

### Issue: "Purchase failed"
- **Fix**: Make sure product is approved in App Store Connect (for production)
- **Fix**: Use sandbox account for testing
- **Fix**: Make sure product ID matches exactly

### Issue: "Premium not unlocking"
- **Fix**: Make sure entitlement `premium` exists and product is attached
- **Fix**: Check RevenueCat dashboard → Customer → see if purchase is recorded
- **Fix**: Verify entitlement identifier is exactly `premium` (case-sensitive)

---

## 📝 Next Steps (In Order)

1. **Complete App Store Connect subscription** (pricing + localization)
2. **Create `premium` entitlement in RevenueCat**
3. **Attach product to entitlement**
4. **Add product to offering**
5. **Test with sandbox account**

Once these are done, you can test the full purchase flow! 🎉

