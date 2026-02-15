# RevenueCat Admin Tool - Setup Guide

## What Was Created

A complete admin tool for managing RevenueCat customers, including:

1. **API Routes** (`website/src/app/api/admin/revenuecat/`):
   - `customers/route.ts` - Search and fetch customers
   - `customers/[appUserId]/route.ts` - Get detailed customer info

2. **Admin Page** (`website/src/app/admin/revenuecat/page.tsx`):
   - User-friendly web interface
   - Search by User ID, Email, or Transaction ID
   - View customer purchase history
   - See anonymous customers
   - Instructions for linking purchases

3. **Documentation** (`website/src/app/admin/revenuecat/README.md`):
   - Complete usage guide
   - API documentation
   - Troubleshooting tips

## Quick Setup

### 1. Add Environment Variables

Add to your Vercel project settings (or `.env.local` for local development):

```env
# RevenueCat REST API Key (for fetching customer data)
# Get from RevenueCat Dashboard → Project Settings → API Keys
REVENUECAT_API_KEY=rc_xxxxxxxxxxxxx

# Admin Secret (for securing admin endpoints)
# Use a strong random string (e.g., generate with: openssl rand -hex 32)
ADMIN_SECRET=your_strong_random_secret_here

# Optional: Webhook Secret (for webhook signature verification)
# This is different from REVENUECAT_API_KEY and is optional
# REVENUECAT_WEBHOOK_SECRET=your_webhook_secret_here
```

### 2. Get RevenueCat API Key

**Important:** You need a **Secret API Key** (not the SDK/public key)!

1. Go to https://app.revenuecat.com
2. Select your project
3. Go to **Project Settings** → **API Keys**
4. In the **"Secret API keys"** section, click **"+ New secret API key"**
5. Give it a label (e.g., "Admin Tool API Key")
6. Copy the **Secret API Key** (it will be shown once - save it immediately!)
7. This is the `REVENUECAT_API_KEY` - used for REST API calls to fetch customer data
8. Add it to environment variables

**Important Notes:**
- Use **Secret API Key** (from "Secret API keys" section) - NOT the SDK/public key
- Secret keys start with `sk_` or similar (not `rc_`)
- You can only see the full key once when you create it - save it immediately!
- This key should NEVER be exposed in frontend code or GitHub

**Key Types:**
- `REVENUECAT_API_KEY` = Secret API Key (for REST API - used by admin tool) ✅ **This one!**
- SDK API Keys = For mobile apps (different purpose)
- `REVENUECAT_WEBHOOK_SECRET` = For webhook signature verification (optional, different purpose)

### 3. Deploy

The admin page will be available at:
```
https://your-domain.com/admin/revenuecat
```

## How to Use

### Finding Anonymous Customers

1. **In RevenueCat Dashboard:**
   - Go to **Customers**
   - Look for customers with IDs starting with `$RCAnonymousID:`
   - Note the full ID (e.g., `$RCAnonymousID:abc123xyz`)

2. **In Admin Tool:**
   - Select "User ID" search type
   - Paste the anonymous ID
   - Click "Search"
   - View purchase history

### Linking Anonymous Purchases

**Automatic (Recommended):**
- When user signs up, the app automatically calls `Purchases.logIn(userId)`
- This merges anonymous purchases with their Firebase UID
- No manual action needed!

**Manual (If Needed):**
- Use RevenueCat dashboard to manually identify customers
- Or use the admin tool to verify purchases when users contact support

### Support Workflow

When a user contacts support about a purchase:

1. **Get Information:**
   - Receipt from App Store/Play Store
   - Transaction ID
   - Email (if they remember)
   - Purchase date

2. **Find Customer:**
   - Use RevenueCat dashboard to search by transaction ID
   - Get the `app_user_id` (might be anonymous)
   - Use admin tool to search by that ID

3. **Verify Purchase:**
   - Check entitlements, subscriptions, purchase date
   - Confirm it matches what user described

4. **Link Purchase (if needed):**
   - If anonymous, wait for user to sign up (automatic)
   - Or manually identify in RevenueCat dashboard
   - Or instruct user to sign up and purchase will link automatically

## Features

✅ **Search Customers** - By User ID, Email, or Transaction ID  
✅ **View Purchase History** - See all subscriptions and one-time purchases  
✅ **Identify Anonymous Customers** - Find customers who purchased before sign-up  
✅ **See Active Entitlements** - Check premium status, subscriptions, etc.  
✅ **Direct RevenueCat Links** - Quick access to customer in RevenueCat dashboard  
✅ **Secure** - Requires admin secret for access  

## Security Notes

- Admin secret is required for all API calls
- Secret can be saved in browser localStorage for convenience (optional)
- Never commit `ADMIN_SECRET` to version control
- Use a strong, random string (32+ characters recommended)

## Example Workflow

**Scenario:** User purchased anonymously, then contacts support

1. User says: "I paid for premium but can't access it"
2. Support asks for: Receipt or transaction ID
3. Support uses RevenueCat dashboard to find customer by transaction ID
4. Finds: `$RCAnonymousID:xyz789` with active premium subscription
5. Support uses admin tool to verify: Search for `$RCAnonymousID:xyz789`
6. Confirms: User has active premium entitlement
7. Support checks: Is user signed up? If not, instructs them to sign up
8. When user signs up: Purchase automatically links to their account
9. User now has premium access!

## Next Steps

1. ✅ Add environment variables to Vercel
2. ✅ Deploy the website
3. ✅ Test the admin tool at `/admin/revenuecat`
4. ✅ Bookmark the page for easy access
5. ✅ Train support team on how to use it

## Troubleshooting

See `website/src/app/admin/revenuecat/README.md` for detailed troubleshooting guide.

