# NEXUS

A customizable gaming and social desktop hub.

## Current status

Version `0.1.0` is the first local desktop UI prototype. Navigation and accent-color switching work. Accounts, friends, game data, chat, and PC monitoring are not connected yet.

## Requirements

- Windows 10 or 11 (64-bit)
- Node.js 20.19+ or 22.12+
- npm

## Run locally

1. Install Node.js from https://nodejs.org/
2. Extract this project folder.
3. Open a terminal in the `NEXUS` folder.
4. Run:

   ```bash
   npm install
   npm run dev
   ```

## Build

```bash
npm run build
```

## Security notes

- Do not store passwords in the app or database yourself.
- Supabase Auth will handle authentication when we add accounts.
- Only the Supabase publishable/anon key belongs in the desktop client.
- Never put a Supabase service-role key or other server secret in the app.
- Electron uses context isolation, disabled Node integration, and a sandboxed renderer.

## Next milestone

Build a proper onboarding/authentication flow, then connect Supabase profiles and friend requests.
