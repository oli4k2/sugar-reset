# Google Play + RevenueCat Setup Guide

## Overview

To enable RevenueCat to validate Google Play purchases, you need to:
1. Create a Google Play service account
2. Link it in Google Play Console
3. Upload the credentials to RevenueCat

---

## Step 1: Create Google Play Service Account

### 1.1 Go to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one if you don't have it)
3. Make sure billing is enabled (required for API access)

### 1.2 Enable Google Play Android Developer API

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google Play Android Developer API"
3. Click on it and click **Enable**

### 1.3 Create Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Fill in:
   - **Service account name**: `revenuecat-service` (or any name)
   - **Service account ID**: Auto-generated (or customize)
   - **Description**: "Service account for RevenueCat integration"
4. Click **Create and Continue**

### 1.4 Grant Permissions

1. **Grant this service account access to project**:
   - Role: **Editor** (or **Owner** for full access)
   - Click **Continue**

2. **Grant users access to this service account** (optional):
   - Skip this step
   - Click **Done**

### 1.5 Create and Download JSON Key

1. Click on the service account you just created
2. Go to **Keys** tab
3. Click **Add Key** → **Create new key**
4. Select **JSON** format
5. Click **Create**
6. **IMPORTANT**: The JSON file will download automatically - **SAVE THIS FILE SECURELY**
   - You'll need to upload this to RevenueCat
   - Keep it secure (don't commit to git!)

---

## Step 2: Link Service Account in Google Play Console

### 2.1 Go to Google Play Console

1. Go to [Google Play Console](https://play.google.com/console/)
2. Select your app (or create it if needed)

### 2.2 Navigate to API Access

1. Go to **Setup** → **API access** (or **Settings** → **API access**)
2. You'll see a section for **Service accounts**

### 2.3 Link Service Account

1. Click **Link service account** (or **Create new service account**)
2. You'll see a list of service accounts from Google Cloud Console
3. Find the service account you just created (e.g., `revenuecat-service@your-project.iam.gserviceaccount.com`)
4. Click **Grant access**

### 2.4 Grant Permissions

1. **Financial data**: 
   - Check **View financial data, orders, and cancellation survey responses**
   - This allows RevenueCat to validate purchases
2. Click **Invite user** (or **Grant access**)

### 2.5 Accept Invitation

1. Go back to **API access** page
2. You should see your service account listed
3. Status should show as **Active** or **Invitation sent**
4. If invitation sent, check the service account email and accept

---

## Step 3: Upload Credentials to RevenueCat

### 3.1 Go to RevenueCat Dashboard

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Navigate to **Apps & providers** → **Apps**

### 3.2 Add or Edit Android App

**If you don't have Android app yet:**
1. Click **Add app**
2. Select **Android**
3. **Package name**: `com.craveless.app` (from your app.json)
4. Click **Create**

**If Android app already exists:**
1. Click on your Android app
2. Go to **Settings** or **Google Play** section

### 3.3 Upload Service Account JSON

1. Find the **Google Play** section
2. Look for **Service account** or **Credentials** upload
3. Click **Upload** or **Choose file**
4. Select the JSON file you downloaded in Step 1.5
5. Click **Save** or **Upload**

### 3.4 Verify Connection

1. RevenueCat will validate the credentials
2. You should see a success message
3. Status should show as **Connected** or **Active**

---

## Step 4: Create Products in Google Play Console

### 4.1 Navigate to Subscriptions

1. In Google Play Console, go to **Monetize** → **Subscriptions**
2. Click **Create subscription**

### 4.2 Create Monthly Subscription

1. **Product ID**: `monthly_subscription` (must match iOS!)
2. **Name**: "Monthly Subscription"
3. **Description**: "Unlock unlimited tracking, insights, and premium features"
4. **Billing period**: 1 month
5. **Price**: Set your price (e.g., $9.99/month)
6. **Free trial**: Optional (e.g., 7 days)
7. Click **Save**

### 4.3 Create Yearly Subscription

1. **Product ID**: `yearly_subscription` (must match iOS!)
2. **Name**: "Yearly Subscription"
3. **Description**: "Unlock unlimited tracking, insights, and premium features"
4. **Billing period**: 1 year
5. **Price**: Set your price (e.g., $99.99/year)
6. **Free trial**: Optional
7. Click **Save**

### 4.4 Activate Products

1. Go to each product
2. Click **Activate** (products need to be active to test)
3. For testing, you can activate immediately

---

## Step 5: Link Products in RevenueCat

### 5.1 Go to Products

1. In RevenueCat, go to **Product catalog** → **Products**
2. You should see your products listed (or create them if needed)

### 5.2 Link to Google Play

1. Click on a product (e.g., `monthly_subscription`)
2. Under **Apps** section, make sure Android app is listed
3. If not, click **Link app** and select your Android app
4. The product should automatically sync from Google Play

### 5.3 Verify Product Details

1. Check that:
   - **Product ID** matches Google Play Console exactly
   - **Price** is synced from Google Play
   - **Status** shows as active

---

## Step 6: Set Up Test Accounts

### 6.1 Add License Testers

1. In Google Play Console, go to **Settings** → **License testing**
2. Under **License testers**, add Gmail addresses:
   - Your test account email
   - Any other test accounts
3. Click **Save**

### 6.2 Test Purchases

- Accounts listed here can test purchases without being charged
- They'll see "Test purchase" in the purchase dialog
- No real money is charged

---

## Step 7: Complete RevenueCat Setup

### 7.1 Attach to Entitlement

1. Go to your product in RevenueCat
2. Scroll to **Associated Entitlements**
3. Click **Attach**
4. Select `premium` entitlement (create if needed)

### 7.2 Add to Offering

1. Go to **Offerings**
2. Edit your offering (e.g., `default`)
3. Add packages:
   - Monthly package → Product: `monthly_subscription`
   - Annual package → Product: `yearly_subscription`
4. Set as **Current Offering**

---

## Verification Checklist

- [ ] Google Cloud service account created
- [ ] Google Play Android Developer API enabled
- [ ] Service account JSON key downloaded
- [ ] Service account linked in Google Play Console
- [ ] Financial data permissions granted
- [ ] Service account JSON uploaded to RevenueCat
- [ ] RevenueCat shows Google Play as "Connected"
- [ ] Products created in Google Play Console
- [ ] Products activated in Google Play Console
- [ ] Products linked in RevenueCat
- [ ] Products attached to `premium` entitlement
- [ ] Products added to offering
- [ ] Test accounts added in Google Play Console

---

## Troubleshooting

### "Service account not found"
- Make sure you're using the same Google account for both Cloud Console and Play Console
- Verify the service account email matches

### "Permission denied"
- Check that financial data permission is granted in Google Play Console
- Verify the service account has Editor/Owner role in Google Cloud

### "Products not syncing"
- Wait a few minutes for sync
- Manually refresh in RevenueCat
- Verify product IDs match exactly

### "Can't test purchases"
- Make sure you're signed in with a license tester account
- Verify products are activated in Google Play Console
- Check that app is published (or in internal testing track)

---

## Security Notes

⚠️ **Important Security Practices:**

1. **Never commit the JSON key to git**
   - Add it to `.gitignore`
   - Keep it secure and private

2. **Limit service account permissions**
   - Only grant necessary permissions
   - Use principle of least privilege

3. **Rotate keys periodically**
   - Create new keys if compromised
   - Revoke old keys

---

## Next Steps

Once everything is set up:
1. Build Android app: `npx expo run:android`
2. Test purchases with test account
3. Verify premium unlocks correctly
4. Test restore purchases

