# App Store Requirements Checklist for Craveless (SugarReset)

This document outlines all the crucial components needed on your website and in your app submission for Google Play and Apple App Store approval.

## ✅ Required Website Pages (Must be publicly accessible URLs)

### 1. **Privacy Policy** ✅
- **URL Required**: `https://yourdomain.com/privacy-policy`
- **Status**: Created at `/privacy-policy`
- **Requirements**:
  - Must be accessible without login
  - Must explain what data you collect
  - Must explain how data is used
  - Must explain data storage and security
  - Must include contact information
  - Must include data deletion rights
  - Must be updated date

### 2. **Terms of Service** ✅
- **URL Required**: `https://yourdomain.com/terms-of-service`
- **Status**: Created at `/terms-of-service`
- **Requirements**:
  - Must be accessible without login
  - Must include user conduct rules
  - Must include intellectual property rights
  - Must include disclaimers
  - Must include contact information
  - Must be updated date

### 3. **Contact Information** ✅
- **Email**: hello@craveless.info
- **Status**: Updated in all pages
- **Requirements**:
  - Must be a valid, monitored email address
  - Should respond within 48 hours
  - Should be displayed on privacy policy and terms pages

## 📋 Additional Policies You May Need

### 4. **Cookie Policy** (If applicable)
- **When Required**: If your website uses cookies or tracking
- **URL**: `https://yourdomain.com/cookie-policy`
- **Content Should Include**:
  - Types of cookies used
  - Purpose of cookies
  - How to manage/disable cookies
  - Third-party cookies (if any)

### 5. **Data Processing Agreement / GDPR Compliance** (If serving EU users)
- **When Required**: If your app is available in EU countries
- **URL**: Can be part of Privacy Policy or separate
- **Content Should Include**:
  - Legal basis for processing
  - User rights (access, rectification, erasure, portability)
  - Data retention periods
  - International data transfers
  - Data Protection Officer contact (if applicable)

### 6. **CCPA Compliance** (If serving California users)
- **When Required**: If your app is available in California
- **Content Should Include**:
  - Right to know what data is collected
  - Right to delete personal information
  - Right to opt-out of sale (if applicable)
  - Non-discrimination policy

### 7. **Children's Privacy Policy** (If app targets users under 13)
- **When Required**: If your app is designed for or knowingly collects data from children under 13
- **URL**: `https://yourdomain.com/children-privacy-policy`
- **Content Should Include**:
  - COPPA compliance statement
  - Parental consent requirements
  - Limited data collection for children
  - Parental rights and controls

### 8. **Refund Policy** (If app has in-app purchases)
- **When Required**: Required by both Apple and Google for apps with paid features
- **URL**: `https://yourdomain.com/refund-policy`
- **Content Should Include**:
  - Refund eligibility criteria
  - Refund request process
  - Time limits for refunds
  - Contact information for refund requests
  - Platform-specific refund policies (Apple/Google)

### 9. **Subscription Terms** (If app has subscriptions)
- **When Required**: If your app uses RevenueCat or any subscription model
- **URL**: Can be part of Terms of Service or separate
- **Content Should Include**:
  - Subscription pricing
  - Billing cycle information
  - Auto-renewal terms
  - Cancellation process
  - Free trial terms (if applicable)
  - Price changes policy

### 10. **Health Data Disclosure** (Specific to your app)
- **When Required**: Your app uses HealthKit/Google Fit for nutrition data
- **URL**: Can be part of Privacy Policy
- **Content Should Include**:
  - What health data is accessed
  - How health data is used
  - Health data storage and security
  - Third-party sharing (if any)
  - User control over health data

## 🍎 Apple App Store Specific Requirements

### Required Information:
1. **Privacy Policy URL** ✅ - Must be provided during app submission
2. **Support URL** ✅ - Link to support page at `/support`
3. **Marketing URL** - Your main website
4. **App Privacy Details** - Detailed breakdown in App Store Connect:
   - Data types collected
   - Data linked to user
   - Data used to track user
   - Data not collected

### HealthKit/Health Data:
- Must declare HealthKit usage in Info.plist (already done: `NSHealthUpdateUsageDescription`)
- Must explain health data usage in Privacy Policy ✅
- Must not share health data with third parties without explicit consent

### In-App Purchases:
- Must have clear refund policy
- Must explain subscription terms
- Must comply with Apple's subscription guidelines

## 🤖 Google Play Store Specific Requirements

### Required Information:
1. **Privacy Policy URL** ✅ - Must be provided during app submission
2. **Support Email** ✅ - hello@craveless.info
3. **Support URL** ✅ - Link to support page at `/support`
4. **Data Safety Section** - Detailed breakdown in Play Console:
   - Data types collected
   - Data shared with third parties
   - Security practices
   - Data deletion options

### Health Data (Google Fit):
- Must declare permissions in AndroidManifest.xml (already done)
- Must explain health data usage in Privacy Policy ✅
- Must comply with Google Fit API policies

### In-App Purchases:
- Must have clear refund policy
- Must explain subscription terms
- Must comply with Google Play billing policies

## 📝 Content Requirements Checklist

### Privacy Policy Must Include:
- ✅ What data you collect
- ✅ How data is collected
- ✅ How data is used
- ✅ How data is stored and secured
- ✅ Third-party services (Firebase, RevenueCat, etc.)
- ✅ User rights (access, deletion, etc.)
- ✅ Contact information
- ✅ Last updated date
- ⚠️ **Add**: Health data specific section (HealthKit/Google Fit)
- ⚠️ **Add**: Third-party services details (Firebase, RevenueCat, Google Sign-In, Apple Sign-In)
- ⚠️ **Add**: Data retention periods
- ⚠️ **Add**: International data transfers (if applicable)

### Terms of Service Must Include:
- ✅ Acceptance of terms
- ✅ User conduct rules
- ✅ Intellectual property rights
- ✅ Disclaimers (medical, warranties)
- ✅ Contact information
- ✅ Last updated date
- ⚠️ **Add**: Subscription terms (if using RevenueCat)
- ⚠️ **Add**: Account termination policy
- ⚠️ **Add**: Limitation of liability
- ⚠️ **Add**: Dispute resolution

## 🔍 Pre-Submission Checklist

### Website:
- [x] Privacy Policy page created with URL
- [x] Terms of Service page created with URL
- [x] Contact email updated to hello@craveless.info
- [x] Support page created at `/support`
- [x] Account Deletion page created at `/account-deletion`
- [ ] Website is live and accessible
- [ ] All links work correctly
- [ ] Mobile-responsive design
- [ ] SSL certificate installed (HTTPS)

### App Store Connect (Apple):
- [ ] Privacy Policy URL added
- [ ] Support URL added
- [ ] App Privacy details completed
- [ ] HealthKit usage declared
- [ ] Subscription details configured (if applicable)

### Play Console (Google):
- [ ] Privacy Policy URL added
- [ ] Support email added
- [ ] Data Safety section completed
- [ ] Health permissions declared
- [ ] Subscription details configured (if applicable)

## 🚨 Critical Missing Items to Add

1. **Health Data Section in Privacy Policy**
   - Explain HealthKit/Google Fit usage
   - Explain what nutrition data is accessed
   - Explain how it's used and stored

2. **Third-Party Services Disclosure**
   - Firebase (data storage)
   - RevenueCat (subscriptions)
   - Google Sign-In
   - Apple Sign-In

3. **Refund Policy** (if using subscriptions)
   - Required by both platforms
   - Should explain Apple/Google refund processes

4. **Subscription Terms** (if using RevenueCat)
   - Billing cycles
   - Auto-renewal
   - Cancellation
   - Free trial terms

5. **Data Retention Policy**
   - How long data is kept
   - When data is deleted
   - Account deletion process

## 📧 Contact Information

- **Support Email**: hello@craveless.info ✅
- **Website**: [Your domain]
- **Support URL**: `/support`
- **Account Deletion URL**: `/account-deletion`

## 📅 Next Steps

1. ✅ Privacy Policy and Terms pages created
2. ⚠️ Add health data section to Privacy Policy
3. ⚠️ Add third-party services section to Privacy Policy
4. ⚠️ Create Refund Policy page (if using subscriptions)
5. ⚠️ Add subscription terms to Terms of Service
6. ⚠️ Deploy website and verify all URLs are accessible
7. ⚠️ Test all links and mobile responsiveness
8. ⚠️ Submit URLs to Apple App Store Connect
9. ⚠️ Submit URLs to Google Play Console

---

**Last Updated**: January 2026
**Contact**: hello@craveless.info

















