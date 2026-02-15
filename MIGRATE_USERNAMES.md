# Username Migration Guide

This guide explains how to migrate usernames for all existing users.

## Prerequisites

1. Set the `ADMIN_SECRET` environment variable in Vercel:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `ADMIN_SECRET` with a secure random string
   - Redeploy the website after adding the variable

## Running the Migration

### Option 1: PowerShell (Windows)

```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_ADMIN_SECRET"
    "Content-Type" = "application/json"
}

Invoke-WebRequest -Uri "https://craveless.info/api/admin/migrate-usernames" `
    -Method POST `
    -Headers $headers
```

Or as a one-liner:

```powershell
Invoke-WebRequest -Uri "https://craveless.info/api/admin/migrate-usernames" -Method POST -Headers @{"Authorization"="Bearer YOUR_ADMIN_SECRET"; "Content-Type"="application/json"}
```

### Option 2: Bash/curl (Linux/Mac/Git Bash)

```bash
curl -X POST https://craveless.info/api/admin/migrate-usernames \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json"
```

### Option 3: Using Node.js

```javascript
const response = await fetch('https://craveless.info/api/admin/migrate-usernames', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_SECRET',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```

## Expected Response

```json
{
  "success": true,
  "results": {
    "total": 100,
    "success": 95,
    "failed": 2,
    "skipped": 3,
    "errors": []
  }
}
```

## What It Does

- Scans all users in the database
- Generates unique Reddit-style usernames (e.g., "coolstar42", "bravemountain15")
- Skips users who already have usernames
- Updates users in batches for efficiency
- Returns a summary of results

## Security Notes

- The `ADMIN_SECRET` should be a strong, random string
- Never commit the secret to git
- Only call this endpoint from trusted environments
- Consider adding IP whitelisting for additional security

