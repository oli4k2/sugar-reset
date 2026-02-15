# RevenueCat Customer Management Admin Tool

This admin tool allows you to search for RevenueCat customers, view their purchase history, and manage anonymous purchases.

## Setup

### 1. Environment Variables

Add these to your `.env` file (or Vercel environment variables):

```env
# RevenueCat REST API Key
# Get this from: RevenueCat Dashboard → Project Settings → API Keys
REVENUECAT_API_KEY=your_revenuecat_api_key_here

# Admin Secret (for securing the admin endpoints)
# Use a strong random string
ADMIN_SECRET=your_strong_random_secret_here
```

### 2. Get RevenueCat API Key

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Select your project
3. Go to **Project Settings** → **API Keys**
4. Copy the **Public API Key** (starts with `rc_`)
5. Add it to your environment variables

## Usage

### Access the Admin Page

Navigate to: `https://your-domain.com/admin/revenuecat`

### Search for Customers

You can search by:

1. **User ID** (Firebase UID or Anonymous ID)
   - Example: `user_abc123` or `$RCAnonymousID:xyz789`
   - This is the most direct way to find a customer

2. **Email** (if stored as attribute)
   - Note: RevenueCat doesn't directly support email search via API
   - Use RevenueCat dashboard to find the customer, then use their app_user_id here

3. **Transaction ID**
   - Note: Transaction ID search requires iterating through all customers
   - Use RevenueCat dashboard to find the customer by transaction ID, then use their app_user_id here

### View Customer Details

Once you find a customer, you'll see:

- **Basic Information**: App User ID, First Seen, Last Seen
- **Entitlements**: Active and inactive entitlements (e.g., "premium")
- **Subscriptions**: Active and inactive subscriptions
- **One-Time Purchases**: Lifetime purchases, etc.
- **Management URL**: Direct link to RevenueCat dashboard

### Handle Anonymous Customers

When you find an anonymous customer (`$RCAnonymousID:...`):

1. **Automatic Linking**: When the user signs up, the app automatically calls `Purchases.logIn(userId)`, which merges the anonymous purchase with their Firebase UID.

2. **Manual Linking**: 
   - Use RevenueCat dashboard to manually identify the customer
   - Or wait for the user to sign up (automatic)

3. **Support Workflow**:
   - User contacts support with a receipt/transaction ID
   - Use RevenueCat dashboard to find the anonymous customer
   - Search for that customer here to verify purchase
   - When user signs up, purchase is automatically linked

## API Endpoints

### GET `/api/admin/revenuecat/customers?app_user_id=<user_id>`

Fetch customer by app user ID.

**Headers:**
```
Authorization: Bearer <ADMIN_SECRET>
```

**Response:**
```json
{
  "customer": {
    "app_user_id": "user_abc123",
    "is_anonymous": false,
    "first_seen": "2024-01-15T10:30:00Z",
    "last_seen": "2024-01-20T14:20:00Z",
    "entitlements": ["premium"],
    "active_entitlements": ["premium"],
    "subscriptions": ["yearly_subscription"],
    "active_subscriptions": ["yearly_subscription"],
    "non_subscriptions": [],
    "raw": { /* full RevenueCat customer object */ }
  }
}
```

### GET `/api/admin/revenuecat/customers/[appUserId]`

Alternative endpoint for fetching customer details.

## Security

- All endpoints require `Authorization: Bearer <ADMIN_SECRET>` header
- Admin secret is stored in browser localStorage for convenience (optional)
- Never commit the admin secret to version control
- Use a strong, random string for `ADMIN_SECRET`

## Troubleshooting

### "RevenueCat API key not configured"
- Make sure `REVENUECAT_API_KEY` is set in environment variables
- Restart your server after adding the variable

### "Unauthorized"
- Make sure `ADMIN_SECRET` is set correctly
- Check that you're sending the `Authorization: Bearer <ADMIN_SECRET>` header

### "Customer not found"
- Verify the app_user_id is correct
- Check RevenueCat dashboard to confirm the customer exists
- Anonymous IDs start with `$RCAnonymousID:`

### Email/Transaction Search Not Working
- RevenueCat REST API doesn't support direct email/transaction search
- Use RevenueCat dashboard to find the customer first, then use their app_user_id here

## Related Documentation

- [RevenueCat REST API Docs](https://docs.revenuecat.com/reference)
- [RevenueCat Dashboard](https://app.revenuecat.com)
- [RevenueCat Customer Identification](https://docs.revenuecat.com/docs/user-ids)

