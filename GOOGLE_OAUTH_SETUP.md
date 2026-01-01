# Google OAuth Setup Guide

## Fixed the Redirect URI Mismatch Error

The error you encountered was due to OAuth configuration. Here's how to fix it:

### Step 1: Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**

### Step 2: Update OAuth 2.0 Credentials
1. Click on your OAuth 2.0 Client ID (the one we used)
2. Go to **Application type**: Web application
3. Look for **Authorized JavaScript origins**

### Step 3: Add Authorized Origins
Add the following origins to the list:
```
http://localhost:5173
http://localhost:3000
http://localhost:4173
http://127.0.0.1:5173
```

### Step 4: Add Authorized Redirect URIs
Add the following URIs:
```
http://localhost:5173/
http://localhost:3000/
http://localhost:4173/
```

### Step 5: Save Changes
- Click **Save**
- Wait a few seconds for changes to propagate

## What Changed in the Code

✅ **Switched to Google Sign-In Button Component** (`GoogleLogin`)
✅ **Uses ID Token Flow** (no need for access tokens)
✅ **Decodes JWT Token** to extract user information
✅ **No Redirect Required** (popup/modal based)
✅ **Better Error Handling**

## How It Works Now

1. User clicks Google Sign-In button
2. Google popup appears
3. User authenticates with their Google account
4. ID token is received directly
5. User info is extracted and stored locally
6. Automatic redirect to dashboard

## Testing Locally

The app now works on:
- `http://localhost:5173` (default Vite port)
- You can test immediately after saving OAuth credentials

## Troubleshooting

If you still see errors:
1. Clear browser cookies/cache
2. Wait 1-2 minutes after updating Google Console
3. Try in an incognito window
4. Check browser console for detailed error messages

## For Production

When deploying to production, add your domain:
```
https://yourdomain.com
https://www.yourdomain.com
```

And update the redirect URIs:
```
https://yourdomain.com/
https://www.yourdomain.com/
```
