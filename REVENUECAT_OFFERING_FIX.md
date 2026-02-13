# RevenueCat Offering Setup - Important Fix Needed

## ❌ Current Problem

You've created **separate offerings** for each product:
- `monthly` offering
- `annual` offering
- `annual_offer1` offering
- `lifetime_offer1` offering
- `lifetime_offer2` offering

## ✅ What the Code Expects

The code uses `getCurrentOffering()` which returns **ONE offering** (the "default" offering). It then looks for all packages within that single offering's `availablePackages` array.

## 🔧 Solution: Add All Packages to DEFAULT Offering

You need to add **all packages** to your **`default`** offering, not create separate offerings.

### Step 1: Edit the Default Offering

1. Go to RevenueCat Dashboard → **Product catalog** → **Offerings**
2. Click on the **`default`** offering (the one with the checkmark ✓)
3. Click **"Edit"**

### Step 2: Edit Package Identifiers in Default Offering

In the **Packages** tab, you'll see existing packages with RevenueCat default identifiers:
- `$rc_monthly` (Monthly)
- `$rc_annual` (Annual)

**⚠️ CRITICAL:** You MUST rename these identifiers to match what the code expects:

1. **Edit Monthly Package:**
   - Click on the `$rc_monthly` package
   - Change **Identifier** from `$rc_monthly` to `monthly` (exactly - no `$rc_` prefix!)
   - Description: "Monthly Subscription"
   - Product: `monthly_subscription` (from Craveless: Sugar reset - Apple)
   - **Save**

2. **Edit Annual Package:**
   - Click on the `$rc_annual` package
   - Change **Identifier** from `$rc_annual` to `annual` (exactly - no `$rc_` prefix!)
   - Description: "Yearly Subscription"
   - Product: `yearly_subscription` (from Craveless: Sugar reset - Apple)
   - **Save**

3. **Annual Offer 1 - Special Case:**
   
   **⚠️ IMPORTANT:** RevenueCat doesn't allow multiple ANNUAL packages in the same offering.
   
   **Solution:** Keep `annual_offer1` in a **separate offering** (you already created `annual_offer1` offering). The code has been updated to search across **all offerings** to find packages, so this will work!
   
   - The `annual_offer1` offering you created is fine
   - Make sure it has:
     - Package Identifier: `annual_offer1` (in the package, not the offering)
     - Product: `yearly_subscription_offer` (from Craveless: Sugar reset - Apple)

4. **Add Lifetime Offer 1 Package:**
   - Click **"+ New Package"** in the default offering
   - Identifier: `lifetime_offer1` (exactly - no `$rc_` prefix!)
   - Description: "Lifetime Offer 1"
   - Product: `lifetime_offer_1` (from Craveless: Sugar reset - Apple)
   - **Save**

5. **Lifetime Offer 2 - Special Case:**
   
   **⚠️ IMPORTANT:** RevenueCat doesn't allow multiple LIFETIME packages in the same offering.
   
   **Solution:** Keep `lifetime_offer2` in a **separate offering** (you already created `lifetime_offer2` offering). The code has been updated to search across **all offerings** to find packages, so this will work!
   
   - The `lifetime_offer2` offering you created is fine
   - Make sure it has:
     - Package Identifier: `lifetime_offer2` (in the package, not the offering)
     - Product: `lifetime_offer_2` (from Craveless: Sugar reset - Apple)

### Step 3: Set Default Offering as Current

1. Make sure the **`default`** offering is set as the **current offering**
2. It should have a checkmark ✓ next to it

### Step 4: What to Do with Separate Offerings

You can either:
- **Option A:** Delete the separate offerings (`monthly`, `annual`, `annual_offer1`, `lifetime_offer1`, `lifetime_offer2`) since they're not needed
- **Option B:** Keep them for future use (they won't interfere, but won't be used by the current code)

## 📋 Package Identifiers Must Match Exactly

**⚠️ IMPORTANT:** The identifiers must be EXACTLY as shown below (no `$rc_` prefix, no typos):

The code looks for packages by these exact identifiers:
- `monthly` → Used for main paywall monthly option (NOT `$rc_monthly`)
- `annual` → Used for main paywall yearly option (NOT `$rc_annual`)
- `annual_offer1` → Used for cancellation Offer 1 yearly
- `lifetime_offer1` → Used for cancellation Offer 1 lifetime
- `lifetime_offer2` → Used for cancellation Offer 2 lifetime

**Why this matters:**
- The code uses `currentOffering.monthly` and `currentOffering.annual`
- RevenueCat maps these properties based on the package identifier
- If the identifier is `$rc_monthly`, `currentOffering.monthly` will be `null`

## ✅ Verification

After adding all packages:

1. The `default` offering should show **3 packages**:
   - `monthly`
   - `annual`
   - `lifetime_offer1`

2. The `annual_offer1` offering should have **1 package**:
   - `annual_offer1` → `yearly_subscription_offer`

3. The `lifetime_offer2` offering should have **1 package**:
   - `lifetime_offer2` → `lifetime_offer_2`

4. All packages should have the correct identifiers
5. All packages should be linked to the correct products
6. The `default` offering should be set as current (checkmark ✓)

**Note:** The code now searches across **all offerings** to find packages, so having `annual_offer1` and `lifetime_offer2` in separate offerings works perfectly!

## 🎯 Why This Matters

The code structure:
```typescript
// Gets ONE offering (the default)
const offering = await getCurrentOffering();

// Looks for packages within that offering
offering.availablePackages.find(pkg => pkg.identifier === 'annual_offer1')
```

If packages are in separate offerings, they won't be found because `getCurrentOffering()` only returns the default offering.

