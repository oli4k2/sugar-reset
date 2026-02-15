# TestFlight vs Production: Payment Differences

## 🎯 Quick Answer

**TestFlight = Testing Environment**
- Uses **Sandbox accounts** for testing (FREE purchases)
- Uses **Production accounts** for real payments (REAL charges)
- Same build, different payment environment based on account type

**App Store Production = Live App**
- Always uses **Production payments** (REAL charges)
- App is live and available to everyone
- Real users pay real money

---

## 💳 Payment Behavior in TestFlight

### Scenario 1: Sandbox Account (Testing - FREE)
**When:** You sign in with a **sandbox Apple ID** (test account)

**What happens:**
- ✅ Purchases are **FREE** (no real charges)
- ✅ Full RevenueCat functionality works
- ✅ You can test all subscription flows
- ✅ Perfect for testing without spending money

**How to use:**
1. Create sandbox testers in App Store Connect
2. Sign in with sandbox account on device
3. Make purchases - they're free!

### Scenario 2: Production Account (Real Payment)
**When:** You sign in with a **real Apple ID** (your personal account)

**What happens:**
- ⚠️ Purchases are **REAL** (you'll be charged!)
- ⚠️ Real money is deducted
- ⚠️ Real subscription is created
- ⚠️ You'll be billed monthly/yearly

**How to avoid:**
- Always use sandbox accounts for testing
- Don't sign in with your personal Apple ID when testing

---

## 📊 Comparison Table

| Feature | TestFlight (Sandbox) | TestFlight (Production Account) | App Store Production |
|---------|---------------------|--------------------------------|---------------------|
| **Build Type** | Production build | Production build | Production build |
| **Environment** | Testing | Testing | Live |
| **Payment Type** | Sandbox (FREE) | Production (REAL) | Production (REAL) |
| **Account Needed** | Sandbox Apple ID | Real Apple ID | Real Apple ID |
| **Charges** | ❌ No charges | ✅ Real charges | ✅ Real charges |
| **RevenueCat** | ✅ Works | ✅ Works | ✅ Works |
| **Available To** | Testers only | Testers only | Everyone |
| **App Store Review** | ❌ Not needed | ❌ Not needed | ✅ Required |
| **Can Make Changes** | ✅ Yes | ✅ Yes | ⚠️ Requires update |

---

## 🔍 Key Differences

### 1. **Payment Environment**

**TestFlight:**
- Uses **Sandbox Store** when signed in with sandbox account
- Uses **Production Store** when signed in with real account
- Same build, different store based on account

**App Store Production:**
- Always uses **Production Store**
- Always real payments
- No sandbox option

### 2. **Account Types**

**Sandbox Account:**
- Created in App Store Connect → Users and Access → Sandbox Testers
- Email format: `test@example.com` (doesn't need to be real)
- Password: Set when creating
- **FREE purchases** - no real charges

**Production Account:**
- Your real Apple ID
- Real payment method on file
- **REAL charges** - you'll be billed

### 3. **Build Type**

**Both TestFlight and App Store use the same:**
- Production build (`eas build --platform ios --profile production`)
- Same code, same features
- Same RevenueCat configuration

**The difference is:**
- **TestFlight:** Testing environment, limited to testers
- **App Store:** Live environment, available to everyone

---

## ⚠️ Important Warnings

### In TestFlight:

1. **If you use a REAL Apple ID:**
   - ⚠️ You WILL be charged real money
   - ⚠️ Real subscription will be created
   - ⚠️ You'll need to cancel manually
   - ⚠️ Refunds may be possible but not guaranteed

2. **If you use a SANDBOX account:**
   - ✅ No charges
   - ✅ Safe to test
   - ✅ Can test all flows

### Best Practice:

**Always use sandbox accounts for testing!**

---

## 🧪 How to Test Safely

### Step 1: Create Sandbox Testers

1. Go to **App Store Connect** → **Users and Access**
2. Go to **Sandbox Testers** tab
3. Click **"+"** to add tester
4. Enter email (can be fake, like `test@example.com`)
5. Set password
6. Save

### Step 2: Sign Out of Real Apple ID

1. On your iPhone: **Settings → [Your Name] → Media & Purchases**
2. Sign out (or use a different device for testing)

### Step 3: Test in App

1. Open your app from TestFlight
2. Try to make a purchase
3. iOS will prompt for Apple ID
4. **Sign in with sandbox account** (the test@example.com you created)
5. Purchase will be **FREE** ✅

### Step 4: Verify It's Sandbox

- Look for "Sandbox" in the purchase confirmation
- Check App Store Connect → Sales and Trends (won't show sandbox purchases)
- No real charge on your payment method

---

## 📱 TestFlight vs App Store Production

### TestFlight (Testing):

**What it is:**
- Beta testing platform
- Same production build
- Limited to invited testers
- Can use sandbox OR production payments

**Use cases:**
- Testing before release
- Getting feedback from team
- Testing with sandbox accounts (free)
- Testing with real accounts (real payments)

**Limitations:**
- Only testers can install
- Build expires after 90 days
- Need to rebuild to update

### App Store Production (Live):

**What it is:**
- Live app in App Store
- Available to everyone
- Always uses production payments
- Requires App Store review

**Use cases:**
- Public release
- Real users
- Real revenue

**Requirements:**
- App Store review approval
- Privacy Policy URL
- Support URL
- Screenshots
- App description
- Age rating

---

## 🎯 Summary

### For Testing (TestFlight):

✅ **Use Sandbox Accounts:**
- FREE purchases
- Safe testing
- Full functionality
- No real charges

⚠️ **Don't Use Real Apple ID:**
- Real charges
- Real subscriptions
- Need to cancel manually

### For Production (App Store):

- Always real payments
- Always real users
- Requires review
- Live to everyone

---

## 💡 Pro Tips

1. **Always test with sandbox first** - verify everything works
2. **Create multiple sandbox accounts** - test different scenarios
3. **Use sandbox for all TestFlight testing** - avoid accidental charges
4. **Only use real account** when you're ready to actually subscribe
5. **Test cancellation flows** with sandbox accounts

---

## ❓ FAQ

**Q: Will I be charged in TestFlight?**
A: Only if you sign in with a REAL Apple ID. Use sandbox accounts for free testing.

**Q: Is TestFlight the same as production?**
A: Same build, but different environment. TestFlight = testing, App Store = live.

**Q: Can I test subscriptions for free?**
A: Yes! Use sandbox accounts - all purchases are free.

**Q: What's the difference between TestFlight and App Store?**
A: TestFlight is for testing (limited testers), App Store is live (everyone can download).

**Q: Do I need to rebuild for App Store?**
A: No! The same production build can go to both TestFlight and App Store. You just need to submit it for App Store review when ready.

---

## ✅ Bottom Line

**TestFlight:**
- Same production build
- Can use sandbox (free) or production (real) payments
- Testing environment only

**App Store:**
- Same production build
- Always production (real) payments
- Live to everyone

**For safe testing:** Always use sandbox accounts in TestFlight! 🎯

