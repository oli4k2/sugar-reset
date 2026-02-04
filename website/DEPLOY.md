# Deploying the Website to Vercel

## Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Make sure you're logged in: `vercel login`

## First Time Deployment

1. Navigate to the website directory:
   ```bash
   cd website
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

3. Follow the prompts:
   - Link to existing project? (If you already have one on Vercel, choose Yes)
   - Project name: `craveless-website` (or your preferred name)
   - Directory: `./` (current directory)
   - Override settings? No

## Set Environment Variables

After deployment, set these environment variables in Vercel Dashboard:

1. Go to your project on Vercel: https://vercel.com/dashboard
2. Click on your project → Settings → Environment Variables
3. Add these variables:

   - **RESEND_API_KEY**: Your Resend API key
   - **FIREBASE_PRIVATE_KEY**: Your Firebase private key (full key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
   - **FIREBASE_PROJECT_ID**: Your Firebase project ID (e.g., `sugar-reset`)
   - **FIREBASE_CLIENT_EMAIL**: Your Firebase service account email
   - **RESEND_FROM_EMAIL**: `auth@craveless.info`
   - **FIREBASE_AUTH_DOMAIN**: `sugar-reset.firebaseapp.com` (optional)

4. **Important**: After adding environment variables, you need to redeploy:
   - Go to Deployments tab
   - Click the "..." menu on the latest deployment
   - Click "Redeploy"

## Update Domain (if needed)

If you need to use `www.craveless.info`:

1. Go to Project Settings → Domains
2. Add `www.craveless.info`
3. Follow DNS configuration instructions

## Subsequent Deployments

After the first deployment, you can deploy updates by:

```bash
cd website
vercel --prod
```

Or simply push to your Git repository if you have Vercel connected to GitHub/GitLab.

## Testing the API

After deployment, test the API endpoint:

```bash
curl -X POST https://www.craveless.info/api/auth/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","redirectUrl":"https://sugar-reset.firebaseapp.com/auth/email-signin"}'
```

You should get a response with `{"success": true, ...}` if it's working.

