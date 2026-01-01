# Google OAuth Redirect URI Configuration Guide

## Your Client ID
```
1079135397924-pue7sajdua90gp19e622pr5bdth21d37.apps.googleusercontent.com
```

## The Problem
Error: `400: redirect_uri_mismatch` - This occurs because your Google Cloud Console hasn't been configured with the correct authorized origins and redirect URIs.

## Complete Setup Instructions

### Step 1: Open Google Cloud Console
1. Go to https://console.cloud.google.com/
2. Make sure you're signed in with the Google account that owns this project
3. Select your project from the top dropdown

### Step 2: Navigate to OAuth Credentials
1. In the left sidebar, click **APIs & Services**
2. Click **Credentials**
3. Look for your OAuth 2.0 Client ID in the list (it should show your Client ID)
4. Click on it to open the configuration page

### Step 3: Configure Authorized JavaScript Origins
Under "Authorized JavaScript origins", add these exact URLs:

**For Local Development (Vite default port 5173):**
```
http://localhost:5173
http://127.0.0.1:5173
```

**For Alternative Ports:**
```
http://localhost:3000
http://localhost:4173
http://localhost:8080
```

**For Production (Update with your actual domain):**
```
https://yourdomain.com
https://www.yourdomain.com
```

### Step 4: Configure Authorized Redirect URIs
Under "Authorized redirect URIs", add these exact URLs:

**For Local Development:**
```
http://localhost:5173/
http://127.0.0.1:5173/
```

**For Alternative Ports:**
```
http://localhost:3000/
http://localhost:4173/
http://localhost:8080/
```

**For Production:**
```
https://yourdomain.com/
https://www.yourdomain.com/
```

### Step 5: Save Configuration
1. Click the **Save** button at the bottom
2. Wait 1-2 minutes for the changes to propagate through Google's servers
3. Don't proceed with testing until after this wait period

### Step 6: Test the Configuration
1. Clear your browser cache and cookies:
   - **Chrome/Edge**: Ctrl+Shift+Delete → Clear "All time"
   - **Firefox**: Ctrl+Shift+Delete → Clear "Everything"
2. Try logging in with Google again
3. If still having issues, try an incognito/private window

## Visual Reference

Your Google Cloud Console should look like this:

```
OAuth 2.0 Client IDs
├── Name: Web client 1
├── Client ID: 1079135397924-pue7sajdua90gp19e622pr5bdth21d37.apps.googleusercontent.com
├── Client secret: [hidden]
├── Authorized JavaScript origins:
│   ├── http://localhost:5173
│   └── http://127.0.0.1:5173
└── Authorized redirect URIs:
    ├── http://localhost:5173/
    └── http://127.0.0.1:5173/
```

## Troubleshooting

### Issue: Still getting redirect_uri_mismatch error
**Solution:**
- Wait 2-3 minutes after saving (Google needs time to propagate)
- Clear browser cache completely
- Try a different browser or incognito window
- Verify you copied the URLs exactly (no extra spaces or characters)

### Issue: Google button doesn't appear
**Solution:**
- Check browser console (F12 → Console tab) for errors
- Verify your Client ID is correct in App.tsx
- Make sure GoogleOAuthProvider wraps your entire app

### Issue: Login works but user data not showing
**Solution:**
- Check browser console for JWT decode errors
- Verify the user data is being stored in localStorage
- Check the Network tab to see the token response

## Important Notes

1. **Localhost vs 127.0.0.1**: Both should be added - they're treated as different origins
2. **Trailing Slash**: URLs in "Authorized redirect URIs" must end with `/`
3. **https vs http**: Local development uses `http://`, production must use `https://`
4. **Case Sensitive**: URLs are case-sensitive, ensure exact matching
5. **No Query Parameters**: Don't include `?` or parameters in the URLs

## Current App Configuration

Your app is already set up with:
- ✅ Client ID configured in App.tsx
- ✅ GoogleOAuthProvider wrapping the entire app
- ✅ GoogleLogin component in Login.tsx
- ✅ JWT token decoding for user info extraction
- ✅ User data storage in localStorage

## Next Steps

1. Add the authorized origins and redirect URIs to Google Cloud Console (see above)
2. Wait 1-2 minutes for propagation
3. Clear browser cache
4. Test the Google Sign-In button on your login page
5. Google login should now work successfully!

## For Production Deployment

When you deploy your app to production:

1. Get your actual domain name (e.g., smartfarm.example.com)
2. Add these to Google Cloud Console:
   ```
   https://smartfarm.example.com
   https://www.smartfarm.example.com
   ```
   And:
   ```
   https://smartfarm.example.com/
   https://www.smartfarm.example.com/
   ```
3. Make sure your SSL certificate is valid (https://)
4. Update domain settings in your hosting provider

Your Google OAuth will then work for both local development and production!
