# Fix: Expo Start Opens TestFlight Instead of Expo Go

## 🔍 The Problem

When you run `npx expo start` and scan the QR code, it opens the **TestFlight app** instead of **Expo Go**.

**Why this happens:**
- Your app's URL scheme (`craveless://`) is registered by the TestFlight app
- iOS sees the scheme and opens the TestFlight version
- Expo Go can't intercept it because TestFlight app is already installed

---

## ✅ Solutions

### Option 1: Use Expo Go App (Recommended for Quick Dev)

**Steps:**
1. **Install Expo Go** from App Store (if not already)
2. **Uninstall TestFlight version** temporarily (or use a different device)
3. **Run:** `npx expo start`
4. **Scan QR code** → Opens in Expo Go ✅

**Limitations:**
- ⚠️ RevenueCat won't work (native module)
- ⚠️ Some native features limited
- ✅ Perfect for UI/feature development

---

### Option 2: Use Development Client (Best for Full Testing)

**Build a development client:**
```bash
eas build --platform ios --profile development
```

**Then:**
1. Install the development build on your device
2. Run: `npx expo start --dev-client`
3. Scan QR code → Opens in development client ✅

**Benefits:**
- ✅ Full native functionality
- ✅ RevenueCat works (with mock data)
- ✅ Same as production but for development

---

### Option 3: Use Tunnel Mode (Bypass URL Scheme)

**Run with tunnel:**
```bash
npx expo start --tunnel
```

**Then:**
- Use the tunnel URL
- Manually open in Expo Go
- Or use `--dev-client` flag

---

### Option 4: Use Different Device/Simulator

**For iOS Simulator:**
```bash
npx expo start
# Press 'i' to open in iOS Simulator
```

**For Android:**
```bash
npx expo start
# Press 'a' to open in Android emulator
```

---

## 🎯 Recommended Approach

### For Quick UI Development:
1. **Uninstall TestFlight app** temporarily
2. **Install Expo Go** from App Store
3. **Run:** `npx expo start`
4. **Scan QR code** → Opens in Expo Go

### For Full Feature Testing:
1. **Build development client:**
   ```bash
   eas build --platform ios --profile development
   ```
2. **Install development build** on device
3. **Run:** `npx expo start --dev-client`
4. **Scan QR code** → Opens in development client

---

## 🔧 Quick Fix Right Now

**Easiest solution:**
1. **Temporarily delete** the TestFlight app from your iPhone
2. **Install Expo Go** from App Store
3. **Run:** `npx expo start`
4. **Scan QR code** → Should open in Expo Go now

**Or use simulator:**
```bash
npx expo start
# Press 'i' for iOS Simulator (if you have Xcode)
```

---

## 📱 Why This Happens

**URL Scheme Conflict:**
- Your app uses scheme: `craveless://`
- TestFlight app registered this scheme
- iOS opens TestFlight when it sees the scheme
- Expo Go can't intercept it

**Solution:**
- Use Expo Go (different scheme)
- Or use development client (same scheme, but dev build)
- Or uninstall TestFlight temporarily

---

## ✅ Summary

**The issue:** TestFlight app intercepts the QR code

**Solutions:**
1. ✅ Uninstall TestFlight → Use Expo Go
2. ✅ Build development client → Use that instead
3. ✅ Use iOS Simulator → No conflict
4. ✅ Use tunnel mode → Bypass scheme

**Best for you:** Build development client once, then use `npx expo start --dev-client` for all future development!

