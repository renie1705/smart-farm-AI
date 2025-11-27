# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/81ab4ef0-041a-4ee1-8b8e-fc0f322a1c78

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/81ab4ef0-041a-4ee1-8b8e-fc0f322a1c78) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Environment Variables

This project requires the following environment variables. Create a `.env` file in the root directory:

```env
# OpenWeatherMap API Key (for real-time weather data)
# Get your API key from: https://openweathermap.org/api
VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here

# Gemini API Key (for AI features like chatbot, crop prediction, disease analysis)
# Get your API key from: https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Configuration (optional)
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- OpenWeatherMap API (for weather data)
- Google Gemini API (for AI features)
- e-NAM Integration (for agricultural market prices from [enam.gov.in](https://enam.gov.in))
- Decision Tree Algorithm (for crop prediction)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/81ab4ef0-041a-4ee1-8b8e-fc0f322a1c78) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
