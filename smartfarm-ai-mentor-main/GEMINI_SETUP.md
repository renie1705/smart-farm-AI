# Gemini API Setup Guide

## How to Get Your Gemini API Key

1. **Visit Google AI Studio:**
   - Go to: https://aistudio.google.com/app/apikey
   - Sign in with your Google account

2. **Create an API Key:**
   - Click "Create API Key" button
   - Select "Create API key in new project" or choose an existing project
   - Copy the generated API key

3. **Add to .env file:**
   - Open the `.env` file in the root directory
   - Replace `your_gemini_api_key_here` with your actual API key:
   ```
   VITE_GEMINI_API_KEY=YOUR_ACTUAL_API_KEY_HERE
   ```

4. **Restart Development Server:**
   - Stop the current server (Ctrl+C)
   - Run `npm run dev` again

## Example .env file:

```
VITE_SUPABASE_URL=https://grfrqvlvrccimvbtyiwo.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## Important Notes:

- Never commit your `.env` file to version control (it's already in .gitignore)
- Keep your API key secure and don't share it publicly
- The API key is free to use with reasonable rate limits

