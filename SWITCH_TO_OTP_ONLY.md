# Switch to OTP-Only Authentication

## Overview

This guide explains how to remove password authentication and implement OTP (One-Time Password) phone authentication only.

## Current Issues Fixed

1. **Auth State Caching**: Fixed authentication state check to properly handle OAuth providers vs email/password
2. **Navigation Logging**: Added detailed logging to debug navigation issues
3. **Clear Data**: Improved clear data function to properly sign out from Firebase

## Next Steps: Implement OTP

### Step 1: Install Required Packages

```bash
npm install firebase
# Firebase Phone Auth is included in firebase/auth
```

### Step 2: Enable Phone Auth in Firebase Console

1. Go to Firebase Console → Authentication → Sign-in method
2. Enable "Phone" provider
3. Configure reCAPTCHA (for web) or use native verification (for mobile)

### Step 3: Update useAuth Hook

Replace password auth with phone auth:
- Remove `signIn` (email/password)
- Remove `signUp` (email/password)  
- Remove `resetPassword`
- Add `signInWithPhoneNumber` (sends OTP)
- Add `verifyOTP` (verifies OTP code)

### Step 4: Update Login/SignUp Screens

- Remove email/password inputs
- Add phone number input
- Add OTP code input (after phone verification)
- Update UI to show phone → OTP flow

### Step 5: Update Navigation

- Ensure Auth screens work with OTP flow
- Update any references to password auth

## Important Notes

- **Phone Auth requires reCAPTCHA** on web, native verification on mobile
- **Test phone numbers** can be used in development
- **Production** requires real phone numbers and SMS verification
- **Cost**: Firebase Phone Auth charges per SMS sent

## Quick Implementation

Would you like me to:
1. Implement OTP authentication now?
2. Or just fix the auth state caching issue first?

Let me know and I'll proceed!

