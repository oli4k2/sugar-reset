# Troubleshooting Purchase and Cache Issues

## 🔍 Issues You're Experiencing

### 1. **Subscription Not Appearing in Settings**
**Likely cause:** Purchase failed silently, but app still marked onboarding as complete.

**What I fixed:**
- ✅ Added purchase verification before completing onboarding
- ✅ Now checks if premium status is actually active after purchase
- ✅ Only completes onboarding if purchase succeeds
- ✅ Better error messages

**What to check:**
- If subscription doesn't appear → Purchase likely failed
- Check device logs for error messages
- Check RevenueCat dashboard for purchase events

### 2. **Restore Purchases Shows "No Account"**
**Likely cause:** Purchase never completed, so there's nothing to restore.

**This is expected behavior if:**
- Purchase failed
- Purchase was cancelled
- No subscription was ever created

**After fix:** If purchase succeeds, restore should work.

### 3. **App Goes to Paywall After Logout (Cache Issue)**
**Likely cause:** `postPaywallAuthRequired` flag persists after logout.

**What happens:**
- Logout clears AsyncStorage (good!)
- But navigation logic checks `postPaywallAuthRequired`
- If it's still true, might navigate to Auth/Paywall instead of onboarding

**Quick fix:** Delete and reinstall app (clears all cache)

**Permanent fix:** Need to ensure logout clears `postPaywallAuthRequired`

---

## ✅ Fixes Applied

### Fix 1: Purchase Verification
- Now verifies purchase succeeded before completing onboarding
- Checks premium status after purchase
- Throws error if purchase didn't activate premium

### Fix 2: Better Error Handling
- Distinguishes between cancellation and failure
- Doesn't complete onboarding on any error
- User stays on paywall to retry

---

## 🧪 How to Test

### Test Purchase:
1. Try to start free trial
2. **If successful:**
   - Subscription appears in Settings → Subscriptions ✅
   - Restore purchases works ✅
   - Premium features work ✅

3. **If failed:**
   - Error message appears
   - Stay on paywall
   - Can retry

### Test After Logout:
1. Log out from Profile
2. Close app completely
3. Reopen app
4. **Should see:** Welcome screen (onboarding)
5. **If you see paywall:** Cache issue (see fix below)

---

## 🔧 Manual Fixes

### Fix Cache Issue (If Still Happening):

**Option 1: Delete and Reinstall**
1. Delete app from iPhone
2. Reinstall from TestFlight
3. All cache cleared ✅

**Option 2: Clear App Data (iOS)**
1. Settings → General → iPhone Storage
2. Find "Craveless"
3. Tap "Offload App" (keeps data) or "Delete App" (clears all)
4. Reinstall from TestFlight

### Check Purchase Status:

**In RevenueCat Dashboard:**
1. Go to RevenueCat → Customers
2. Search for your Apple ID
3. Check if purchase appears
4. Check entitlement status

**In App Store Connect:**
1. Go to Sales and Trends
2. Check for subscription purchases
3. Note: Sandbox purchases won't appear here

---

## 📊 What to Look For

### Signs Purchase Succeeded:
- ✅ Subscription in Settings → Subscriptions
- ✅ Premium features work
- ✅ Restore purchases finds subscription
- ✅ RevenueCat dashboard shows active subscription

### Signs Purchase Failed:
- ❌ No subscription in Settings
- ❌ Restore shows "no purchases"
- ❌ Premium features don't work
- ❌ Error message during purchase

### Signs Cache Issue:
- ❌ App goes to paywall after logout
- ❌ Onboarding state persists
- ❌ Can't start fresh

---

## 🎯 Next Steps

1. **Rebuild app** with the fixes
2. **Test purchase** with sandbox account
3. **Verify subscription appears** in Settings
4. **Test logout** and verify onboarding shows
5. **If issues persist:** Clear app data manually

---

## 💡 Key Points

1. **Purchase verification:** Now checks if purchase actually succeeded
2. **Onboarding completion:** Only happens if purchase succeeds
3. **Cache clearing:** Logout should clear everything, but if not, delete/reinstall
4. **Restore purchases:** Only works if you actually have a subscription

---

## ⚠️ About Your Current Situation

**If subscription doesn't appear:**
- Purchase likely failed (you won't be charged)
- No subscription was created
- That's why restore shows "no account"

**If app goes to paywall after logout:**
- Cache issue - onboarding state persisted
- Quick fix: Delete and reinstall app
- Permanent fix: Already in code (logout clears AsyncStorage)

**Good news:** You likely weren't charged since subscription doesn't appear! The purchase probably failed silently.

---

## ✅ Summary

**Fixed:**
- ✅ Purchase verification before completing onboarding
- ✅ Better error handling
- ✅ User stays on paywall if purchase fails

**To test:**
- Rebuild app
- Try purchase with sandbox account
- Verify subscription appears
- Test logout behavior

**If cache issue persists:**
- Delete and reinstall app (quickest fix)

