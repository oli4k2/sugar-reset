# Admin API Endpoints

This directory contains admin-only API endpoints that require special permissions.

## Username Migration

**Endpoint:** `/api/admin/migrate-usernames`

**Method:** POST

**Authentication:** Requires `Authorization: Bearer <ADMIN_SECRET>` header

**Purpose:** Migrates usernames for all existing users who don't have one. Uses Firebase Admin SDK to bypass security rules.

### Setup

1. Set the `ADMIN_SECRET` environment variable in Vercel:
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add `ADMIN_SECRET` with a secure random string (e.g., generate with `openssl rand -hex 32`)

2. Redeploy the website after adding the environment variable

### Usage

```bash
curl -X POST https://craveless.info/api/admin/migrate-usernames \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json"
```

### Response

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

### Security Notes

- This endpoint bypasses Firestore security rules using Admin SDK
- Only call this from trusted environments
- Keep `ADMIN_SECRET` secure and never commit it to git
- Consider adding IP whitelisting for additional security

