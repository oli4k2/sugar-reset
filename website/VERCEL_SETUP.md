# Vercel Configuration for Website

## Important: Root Directory Setting

If you're getting 405 errors, check your Vercel project settings:

1. Go to your Vercel project dashboard
2. Click **Settings** → **General**
3. Scroll to **Root Directory**
4. Make sure it's set to: **`website`**

If it's not set, or set to something else:
1. Click **Edit**
2. Set Root Directory to: `website`
3. Click **Save**
4. **Redeploy** the project

## Why This Matters

The API routes are in `website/src/app/api/`, so Vercel needs to know that `website` is the root directory, not the repository root.

## Verify Deployment

After setting the root directory and redeploying, test the endpoint:

```bash
# Should return a message (not 405)
curl https://www.craveless.info/api/auth/send-magic-link

# Should send an email (POST request)
curl -X POST https://www.craveless.info/api/auth/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","redirectUrl":"https://sugar-reset.firebaseapp.com/auth/email-signin"}'
```

