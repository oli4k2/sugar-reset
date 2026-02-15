# Upload iOS Build to TestFlight

## ✅ Your Build is Ready!

Your build completed successfully:
- **Build ID**: `1bbf0d31-d457-4758-bc75-44fc636b6a0e`
- **Status**: Finished
- **Version**: 1.0.0
- **Build Number**: 12
- **IPA URL**: `https://expo.dev/artifacts/eas/4qHQKd8sWaxoF2WJiA4KtL.ipa`

---

## 🚀 Option 1: Auto-Upload with EAS Submit (Recommended)

EAS can automatically upload your build to App Store Connect:

```bash
eas submit --platform ios --latest
```

**What this does:**
- Downloads your latest build
- Uploads it to App Store Connect
- Processes it for TestFlight automatically

**Follow the prompts:**
- Select your Apple ID
- EAS handles the upload

**Time:** ~5-10 minutes for upload, then 10-30 minutes for processing

---

## 📤 Option 2: Manual Upload via App Store Connect

If you prefer to upload manually:

### Step 1: Download the IPA

1. Go to: `https://expo.dev/artifacts/eas/4qHQKd8sWaxoF2WJiA4KtL.ipa`
2. Download the `.ipa` file

### Step 2: Upload via App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app: **"Craveless: Sugar reset"**
3. Go to **TestFlight** tab
4. Click **"Builds"** (left sidebar)
5. Click **"+"** or **"Upload Build"**
6. Drag and drop your `.ipa` file
7. Wait for processing (~10-30 minutes)

### Step 3: Wait for Processing

- Apple processes the build
- You'll get an email when it's ready
- Build will appear in TestFlight → Builds

---

## ⏱️ Processing Time

After upload:
- **Upload**: 5-10 minutes
- **Apple Processing**: 10-30 minutes
- **Total**: ~15-40 minutes

You'll receive an email when the build is ready in TestFlight.

---

## ✅ After Processing

Once the build appears in TestFlight:

1. **Go to TestFlight → Builds**
2. **Select your build**
3. **Add to Internal Testing** (if not already)
4. **Add testers** (coworkers' Apple IDs)
5. **Testers receive invitations**

---

## 🎯 Quick Command

**Just run this:**

```bash
eas submit --platform ios --latest
```

This will automatically upload your build to TestFlight! 🚀

