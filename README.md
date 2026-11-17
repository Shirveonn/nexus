# NEXUS

A fully customizable Windows desktop hub for our friend group: gaming, anime, friends, chat, mini-games and PC stats in one place. Built only with free tools and free services.

**Current version: `0.3.0` – User accounts.** See [ROADMAP.md](ROADMAP.md) for what's done and what's next.

## What works right now

- Desktop app (Electron) with sidebar navigation and a dashboard
- **6 color themes** (Midnight, Obsidian, Nebula, Forest, Ember, Daylight) plus 7 one-click "looks"
- **Any accent color**: 8 presets, a color picker or a hex code. Text on the accent stays readable automatically.
- **Wallpapers**: 6 built-in gradients or your own image, with dim and blur sliders
- **Sidebar customization**: compact, standard or wide; solid, glass or minimal style; left or right side
- **Dashboard widgets**: show or hide, drag to rearrange, drag the edge (or pick S/M/L/XL) to resize. Clock and Notes widgets included.
- **Interface scale** (80–130%) and a reduce-motion option
- **Saved themes**, plus **import and export** as `.json` files to share with friends
- Everything saves automatically on your PC
- **Accounts** (Supabase): sign up with a username, confirm with a 6-digit email code, sign in or out, reset a forgotten password
- **Profiles**: profile picture, display name, bio, favourite game and anime, profile color
- **Account settings**: change email or password, sign out on this PC or everywhere, delete your account
- **Guest mode**: use NEXUS without an account (local features only)

Friends, game library, anime, chat, arcade and PC monitoring are still placeholders; they arrive in later versions.

> **First time?** Accounts need a free Supabase project. Follow **[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)**. Without it, NEXUS runs in guest mode.

## Requirements

- Windows 10 or 11 (64-bit)
- [Node.js](https://nodejs.org/) 22 LTS (20.19+ also works)
- [Git](https://git-scm.com/download/win)
- [VS Code](https://code.visualstudio.com/) (recommended)

## Getting started

```bash
git clone https://github.com/Shirveonn/nexus.git
cd nexus
npm install
cp .env.example .env   # then fill in your Supabase details (Windows: copy .env.example .env)
npm run dev
```

`npm run dev` opens the NEXUS window with hot reload: save a file and the app updates instantly.

### Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app in development mode |
| `npm test` | Run the unit tests |
| `npm run test:db` | Run the database security tests (needs `npm run db:start` and Docker) |
| `npm run db:start` / `db:stop` / `db:reset` | Run a local Supabase for development |
| `npm run db:types` | Regenerate TypeScript types after changing the database |
| `npm run check` | Type-check and run the tests (run this before pushing) |
| `npm run build` | Production build into `out/` |
| `npm run dist:win` | Build a Windows installer into `release/` |

### No Node.js? Download a ready-made build

Every push to `main` runs the **CI** workflow on a real Windows machine. It type-checks, tests and builds a Windows installer. To get the installer, open the repo on GitHub → **Actions** → the latest **CI** run → **Artifacts** → `NEXUS-windows-installer`.

The installer isn't code-signed (that costs money), so Windows SmartScreen will warn you. Click **More info → Run anyway**.

## Project structure

```
electron/
  main/index.ts          Electron main process: creates the window, blocks unsafe navigation
  preload/index.ts       The small, safe bridge between Electron and the UI (window.nexus)
src/renderer/
  index.html
  src/
    main.tsx             React entry point
    app/                 App shell + navigation config (pages, sidebar items)
    components/
      layout/            Sidebar, Topbar, wallpaper layer
      ui/                Reusable controls (toggle, slider, segmented, panel, toasts)
    features/            One folder per module
      auth/              Sign-in screen, auth state (authStore), account actions, input rules
      profile/           Profile page, avatars, profile API
      dashboard/         Home page, widget grid, widgets, layout logic
      settings/          Settings page and its tabs
      placeholder/       "Under construction" page for upcoming modules
    store/               Zustand stores (settingsStore = saved; uiStore = session only)
    theme/               Palettes, wallpapers, presets, theme-file import/export + validation
    lib/                 Helpers: Supabase client, colors, files/images
    styles/              CSS split by area (base, layout, dashboard, settings)
    types/               Shared TypeScript types
supabase/
  migrations/            Database tables + security rules (SQL), applied in order
  templates/             Email templates (6-digit codes)
  config.toml            Settings for the local development Supabase
tests/
  unit/                  Fast tests, no network (`npm test`)
  db/                    Security tests against a real local Supabase (`npm run test:db`)
docs/                    Setup guides
.github/workflows/       CI: Windows build + installer, database tests
```

**Adding a new module** (e.g. Friends in 0.4.0): create `src/renderer/src/features/friends/FriendsPage.tsx`, then render it in `app/App.tsx` in place of the placeholder.

**Adding a dashboard widget**: add its id to `WidgetId` in `types/settings.ts`, add a default entry in `theme/defaults.ts`, and register the component in `features/dashboard/widgets/index.tsx`. Existing users get new widgets automatically (hidden until switched on).

## Our tech stack

| Technology | Purpose |
| --- | --- |
| React + TypeScript | Interface and application |
| Electron | Windows desktop app |
| Vite (electron-vite) | Development and builds |
| CSS custom properties | Styling and live theming (Tailwind can be added later if we want it) |
| Zustand | State management, with saving to local storage |
| Vitest | Unit tests |
| electron-builder | Windows installer |
| GitHub Actions | Free CI on Windows |
| Supabase | Accounts, database, file storage (avatars); realtime later |
| SQLite | *(later)* larger local data such as game libraries |

## Working together with Git

1. `git pull` before you start.
2. Make a branch for your feature: `git checkout -b feature/anime-watchlist`.
3. Commit small steps with clear messages.
4. Run `npm run check` before pushing.
5. Push and open a Pull Request on GitHub so someone else can review it.

## Security notes

- Never store passwords yourself. Supabase Auth handles authentication.
- Only the Supabase **publishable/anon** key belongs in the app. Never put a secret/service-role key in this repo; the app refuses to start with one.
- Every table has Row Level Security. Users can only change their own profile and avatar, and the tests in `tests/db/` prove it.
- Changing your password requires your current password, and deleting your account requires typing your username.
- Never commit `.env` files (they are already in `.gitignore`).
- Electron runs with context isolation, no Node integration and a sandboxed renderer.
- Production builds ship a strict Content-Security-Policy (`electron.vite.config.ts`) that only allows connections to your own Supabase project.
- Imported theme files are untrusted. Every value is validated, and only embedded `data:` images are accepted, never remote URLs.
- External `https` links open in your normal browser, never inside NEXUS.
