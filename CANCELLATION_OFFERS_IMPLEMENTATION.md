# Cancellation Offers Implementation

## Changes Made

### 1. **Removed "Continue with Free" from Onboarding**
- Back button on intro step no longer shows cancellation offer
- Users must complete paywall flow to start free trial
- No way to skip/decline during onboarding

### 2. **Updated Cancellation Offer Screen**
- Removed free tier step from cancellation offers
- After declining both offers, user automatically goes to free tier
- `onContinueFree` is now optional

### 3. **Updated Food Scanner Modal**
- Text input field is now for future AI prompt (not manual food entry)
- Free users can type but analysis is gated
- Shows "Coming Soon" message for free users
- Premium users can analyze text input

### 4. **Trial Expiration & Cancellation Detection** (TODO)
- Need to detect when trial expires
- Need to detect when subscription is cancelled
- Show cancellation offers once when app opens
- Track in AsyncStorage that offers were shown

## Implementation Plan

1. Add detection logic in RevenueCatContext
2. Track cancellation offer shown status in AsyncStorage
3. Show cancellation offers in HomeScreen when detected
4. Ensure offers only show once per cancellation event

