# How to Clear App Data

## Quick Method (In-App - Development Only)

If you're in development mode, you can use the in-app option:

1. Open the app
2. Go to **Profile** screen
3. Scroll down to **Developer** section (only visible in dev mode)
4. Tap **"Clear All Data"**
5. Confirm the action

This will:
- Clear all AsyncStorage data
- Sign you out from Firebase
- Reset the app to initial state

---

## Manual Methods

### iOS (Simulator or Device)

#### Method 1: Delete and Reinstall
1. Long press the app icon
2. Tap the "X" to delete
3. Reinstall from Xcode or App Store

#### Method 2: Reset Simulator (iOS Simulator Only)
1. Open **Simulator** menu
2. Go to **Device** → **Erase All Content and Settings...**
3. Confirm

#### Method 3: Clear via Settings (Physical Device)
1. Go to **Settings** → **General** → **iPhone Storage**
2. Find your app
3. Tap **Offload App** or **Delete App**
4. Reinstall

---

### Android (Emulator or Device)

#### Method 1: Delete and Reinstall
1. Long press the app icon
2. Drag to "Uninstall"
3. Reinstall from Android Studio or Play Store

#### Method 2: Clear App Data (Android Settings)
1. Go to **Settings** → **Apps** → **Sugar Reset** (or your app name)
2. Tap **Storage**
3. Tap **Clear Data** or **Clear Storage**
4. Tap **Clear Cache** (optional)

#### Method 3: Reset Emulator (Android Emulator Only)
1. Open **Android Studio**
2. Go to **Tools** → **Device Manager**
3. Click the dropdown arrow next to your emulator
4. Click **Wipe Data**

#### Method 4: Using ADB (Command Line)
```bash
# Connect your device/emulator first
adb shell pm clear com.sugarreset.app
```

Or for Expo:
```bash
adb shell pm clear host.exp.exponent
```

---

## Clear Specific Data Types

### Clear Onboarding Data Only

If you just want to reset onboarding (but keep login):

1. Use the in-app "Clear All Data" option, OR
2. Manually clear via code:
   ```typescript
   import { storageService } from './services/storageService';
   await storageService.remove(storageService.KEYS.ONBOARDING_DATA);
   await storageService.remove(storageService.KEYS.HAS_COMPLETED_ONBOARDING);
   ```

### Clear Firebase Auth Only

Sign out from the app:
1. Go to Profile screen
2. Tap "Log Out"

Or programmatically:
```typescript
import { signOut } from 'firebase/auth';
await signOut(auth);
```

### Clear RevenueCat Data

RevenueCat data is stored server-side, but you can reset the local user ID:
```typescript
import Purchases from 'react-native-purchases';
await Purchases.logOut(); // Clears local RevenueCat user ID
```

---

## Complete Reset (Nuclear Option)

To completely reset everything:

1. **Clear App Data** (use methods above)
2. **Sign out from Firebase** (if logged in)
3. **Clear RevenueCat user ID** (if needed)
4. **Uninstall and reinstall** the app

---

## Troubleshooting

### "App still remembers my data after clearing"

- Make sure you cleared **both** AsyncStorage AND signed out from Firebase
- RevenueCat data is server-side, so purchases persist (but you can restore them)
- Try uninstalling and reinstalling the app

### "Can't find the Clear Data option"

- The option only appears in **development mode** (`__DEV__ === true`)
- Make sure you're running a development build, not a production build
- Check that you're on the Profile screen

### "App crashes after clearing data"

- This shouldn't happen, but if it does:
  1. Force close the app
  2. Reopen it
  3. It should start fresh at the Welcome screen

---

## What Gets Cleared

When you clear all data:

✅ **Cleared:**
- Onboarding data (quiz answers, plan selection, etc.)
- Local preferences
- Check-in cache
- Firebase auth session
- AsyncStorage data

❌ **NOT Cleared:**
- RevenueCat purchases (server-side, can be restored)
- Firebase user account (still exists, just logged out)
- App Store/Play Store purchase records

---

## For Testing

If you're testing the onboarding flow repeatedly:

1. Use the in-app "Clear All Data" option (fastest)
2. Or use ADB command: `adb shell pm clear <package-name>`
3. Or reset the emulator/simulator

This ensures you get a fresh start every time! 🎉

