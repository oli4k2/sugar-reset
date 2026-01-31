# Testing RevenueCat on Windows

Since you're on Windows, you can't build iOS locally. Here are your options:

## Option 1: Test on Android First (Recommended) ⭐

**You can build Android on Windows!**

### Quick Setup:
1. **Set up Android products in Google Play Console** (similar to iOS)
2. **Link them in RevenueCat** (Android app section)
3. **Build and test:**

```bash
npx expo prebuild
npx expo run:android
```

This will:
- Build the Android app locally
- Install on connected Android device/emulator
- Let you test RevenueCat purchases

### Advantages:
- ✅ Works on Windows
- ✅ Faster iteration (local builds)
- ✅ Free to test
- ✅ Same RevenueCat code works for both platforms

---

## Option 2: Use EAS Build for iOS (Cloud Build)

If you want to test iOS specifically:

### Fix the EAS Config Error First:

The error shows a slug mismatch. Your EAS project expects `sugar-reset` but your app.json has `craveless`.

**Option A: Update app.json to match EAS project:**
```json
"slug": "sugar-reset"
```

**Option B: Create new EAS project (if you prefer `craveless`):**
```bash
eas init
```

### Then Build iOS:

```bash
# Install/upgrade EAS CLI
npm install -g eas-cli

# Build iOS development client
eas build --platform ios --profile development
```

This will:
- Build iOS app in the cloud
- Give you a download link
- Install on your iPhone via TestFlight or direct install

### Cost:
- Free tier: Limited builds per month
- Paid: More builds available

---

## Option 3: Use Expo Go (Limited - Won't Work for RevenueCat)

⚠️ **Expo Go doesn't support RevenueCat** because it requires native code.

You need a development build or production build.

---

## Recommended Approach

1. **Test Android first** (works on Windows, same code)
2. **Once Android works**, use EAS Build for iOS
3. **Both platforms use the same RevenueCat setup** (just different store products)

---

## Quick Android Test Setup

1. **Google Play Console:**
   - Create products: `monthly_subscription`, `yearly_subscription`
   - Set up pricing

2. **RevenueCat:**
   - Add Android app (if not already)
   - Link products
   - Attach to `premium` entitlement
   - Add to offering

3. **Build:**
   ```bash
   npx expo prebuild
   npx expo run:android
   ```

4. **Test with Google Play test account**

---

## Fix EAS Config (If Using Cloud Build)

If you want to use EAS Build for iOS, fix the slug mismatch:

**In `app.json`, change:**
```json
"slug": "craveless"
```

**To match your EAS project:**
```json
"slug": "sugar-reset"
```

Or create a new EAS project that matches `craveless`.

