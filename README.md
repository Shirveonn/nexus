# NEXUS

A fully customizable Windows desktop hub for our friend group: gaming, anime, friends, chat, mini-games and PC stats in one place. Built only with free tools and free services.

**Current version: `0.2.0` – Make NEXUS yours.** See [ROADMAP.md](ROADMAP.md) for what's done and what's next.

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

Accounts, friends, game library, anime, chat, arcade and PC monitoring are still placeholders; they arrive in later versions.

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
npm run dev
```

`npm run dev` opens the NEXUS window with hot reload: save a file and the app updates instantly.

### Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app in development mode |
| `npm test` | Run the unit tests |
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
      dashboard/         Home page, widget grid, widgets, layout logic
      settings/          Settings page and its tabs
      placeholder/       "Under construction" page for upcoming modules
    store/               Zustand stores (settingsStore = saved; uiStore = session only)
    theme/               Palettes, wallpapers, presets, theme-file import/export + validation
    lib/                 Small helpers (colors, files/images)
    styles/              CSS split by area (base, layout, dashboard, settings)
    types/               Shared TypeScript types
tests/                   Unit tests (Vitest)
.github/workflows/       CI: test + build + package on Windows
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
| Supabase | *(0.3.0+)* accounts, database and realtime |
| SQLite | *(later)* larger local data such as game libraries |

## Working together with Git

1. `git pull` before you start.
2. Make a branch for your feature: `git checkout -b feature/anime-watchlist`.
3. Commit small steps with clear messages.
4. Run `npm run check` before pushing.
5. Push and open a Pull Request on GitHub so someone else can review it.

## Security notes

- Never store passwords yourself. Supabase Auth handles authentication from 0.3.0.
- Only the Supabase **publishable/anon** key belongs in the app. Never put a service-role key or any other secret in this repo.
- Never commit `.env` files (they are already in `.gitignore`).
- Electron runs with context isolation, no Node integration and a sandboxed renderer.
- Production builds ship a strict Content-Security-Policy (`electron.vite.config.ts`). When Supabase is added, its URL must be added to `connect-src`.
- Imported theme files are untrusted. Every value is validated, and only embedded `data:` images are accepted, never remote URLs.
- External `https` links open in your normal browser, never inside NEXUS.
