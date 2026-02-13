# Sharing Builds with Coworkers

## ✅ Your Setup is Correct!

**Good news:** You don't need to change `$rc_monthly`, `$rc_annual`, or `$rc_lifetime` identifiers. RevenueCat automatically maps these standard identifiers to `currentOffering.monthly`, `currentOffering.annual`, and `currentOffering.lifetime` in the code.

The code uses:
- `currentOffering.monthly` → automatically finds `$rc_monthly` package
- `currentOffering.annual` → automatically finds `$rc_annual` package  
- `currentOffering.lifetime` → automatically finds `$rc_lifetime` package

**Your offer packages** (`annual_offer1`, `lifetime_offer1`, `lifetime_offer2`) are already set up correctly in separate offerings with custom identifiers.

---

## 📱 Sharing Builds - Best Options

### Option 1: TestFlight (Recommended) ⭐

**Best for:** Sharing with team members who have access to your App Store Connect

**Steps:**
1. **Build for TestFlight:**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Upload to App Store Connect:**
   - EAS will automatically upload the build
   - Or manually upload via App Store Connect → TestFlight

3. **Add Internal Testers:**
   - Go to App Store Connect → **TestFlight** → **Internal Testing**
   - Add your coworkers' Apple IDs
   - They'll receive an email invitation

4. **Install:**
   - Coworkers install TestFlight app
   - Accept invitation
   - Install your app from TestFlight

**Pros:**
- ✅ Easy to share
- ✅ Works with sandbox accounts
- ✅ Automatic updates
- ✅ No device registration needed
- ✅ Works with RevenueCat (full native support)

**Cons:**
- ⚠️ Requires App Store Connect access
- ⚠️ Builds need to be processed (can take 10-30 minutes)

---

### Option 2: EAS Build with Internal Distribution

**Best for:** Quick testing without App Store Connect processing

**Steps:**
1. **Build with internal distribution:**
   ```bash
   eas build --platform ios --profile preview
   ```

2. **Share build URL:**
   - EAS provides a download link
   - Share link with coworkers
   - They download and install via link

**Pros:**
- ✅ Fast (no App Store processing)
- ✅ Direct download
- ✅ Works with sandbox accounts

**Cons:**
- ⚠️ Requires device registration (UDID)
- ⚠️ Need to add devices in Apple Developer Portal
- ⚠️ More manual setup

---

### Option 3: Expo Go (Limited)

**Best for:** Quick UI testing (NOT for RevenueCat testing)

**Limitations:**
- ❌ RevenueCat may not work (native module)
- ❌ Limited native functionality
- ❌ Not representative of production build

**Steps:**
```bash
npx expo start
# Share QR code with coworkers
# They scan with Expo Go app
```

**Note:** Don't use this for testing RevenueCat - it won't work properly.

---

## 🎯 Recommended Approach

### For RevenueCat Testing:
1. **Use TestFlight** (best option)
   - Build: `eas build --platform ios --profile production`
   - Add coworkers as internal testers
   - They install via TestFlight
   - Test with sandbox accounts

### For Quick UI Testing:
1. **Use EAS Preview Build**
   - Build: `eas build --platform ios --profile preview`
   - Share download link
   - Install directly (requires device registration)

---

## 📋 TestFlight Setup Steps

### 1. Build for TestFlight

```bash
# Make sure you're in the project root
eas build --platform ios --profile production

# Follow prompts:
# - Select your Apple Developer account
# - EAS will handle code signing
# - Build will be uploaded automatically
```

### 2. Wait for Processing

- Build takes ~10-20 minutes
- App Store Connect processing: ~10-30 minutes
- You'll get an email when ready

### 3. Add Internal Testers

1. Go to **App Store Connect** → Your App → **TestFlight**
2. Click **Internal Testing**
3. Click **"+"** to add testers
4. Enter coworkers' Apple IDs (emails)
5. They'll receive invitation emails

### 4. Coworkers Install

1. Install **TestFlight** app from App Store
2. Open invitation email
3. Tap "View in TestFlight"
4. Install your app
5. Sign in with sandbox account when testing purchases

---

## 🔧 EAS Build Configuration

Make sure your `eas.json` has the right profiles:

```json
{
  "build": {
    "production": {
      "ios": {
        "buildConfiguration": "Release"
      }
    },
    "preview": {
      "ios": {
        "buildConfiguration": "Release",
        "distribution": "internal"
      }
    }
  }
}
```

---

## ⚠️ Important Notes

### Sandbox Accounts
- **TestFlight builds:** Sandbox accounts work perfectly
- **Production builds:** Sandbox accounts DON'T work (need real Apple IDs)
- **Recommendation:** Always test in TestFlight with sandbox accounts first

### Device Requirements
- **TestFlight:** No device registration needed
- **EAS Preview:** Requires device UDID registration in Apple Developer Portal
- **Expo Go:** No registration, but limited functionality

### RevenueCat Testing
- ✅ **TestFlight:** Full RevenueCat support
- ✅ **EAS Preview:** Full RevenueCat support
- ❌ **Expo Go:** RevenueCat may not work (native module)

---

## 🚀 Quick Start for Your Team

1. **You build:**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Add coworkers in App Store Connect:**
   - TestFlight → Internal Testing → Add testers

3. **Coworkers:**
   - Install TestFlight
   - Accept invitation
   - Install app
   - Test with sandbox accounts

That's it! 🎉

---

## 💡 Pro Tips

1. **Use TestFlight for all RevenueCat testing** - it's the most reliable
2. **Create a sandbox account for each tester** - easier to track
3. **Use TestFlight's automatic updates** - new builds auto-update
4. **Test with sandbox accounts** - free and safe
5. **Don't use Expo Go for RevenueCat** - it won't work properly

---

## ❓ FAQ

**Q: Can I share builds without App Store Connect?**
A: Yes, use EAS Preview builds, but you'll need to register device UDIDs.

**Q: Do sandbox accounts work in TestFlight?**
A: Yes! TestFlight is perfect for sandbox testing.

**Q: How long does TestFlight processing take?**
A: Usually 10-30 minutes after build completes.

**Q: Can coworkers test purchases?**
A: Yes, with sandbox accounts. Purchases are free in sandbox.

**Q: Do I need to rebuild for each change?**
A: Yes, but TestFlight makes it easy - just upload new build and testers get notified.

