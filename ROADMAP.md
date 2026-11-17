# NEXUS – Development roadmap

Goal: a fully customizable Windows desktop hub for our friend group, built with free tools and free services only.

## Phase 1 – Foundation · v0.1.0 – Desktop shell ✅

- [x] Create the starter project
- [x] Electron desktop framework
- [x] React + TypeScript
- [x] Sidebar navigation
- [x] Initial dashboard
- [x] Basic theme switching
- [ ] Test and run on Windows. *CI now builds and packages on Windows automatically; still needs a person to install and click through it on a real PC.*
- [x] Organize the project structure

## Phase 2 – Customization · v0.2.0 – Make NEXUS yours ✅

- [x] Multiple color themes: 6 palettes, including a light theme, plus 7 one-click looks
- [x] Custom backgrounds and wallpapers: 6 gradients or your own image, with dim and blur
- [x] Custom accent colors: presets, a color picker and hex input
- [x] Rearrangeable dashboard widgets: drag and drop or arrow buttons
- [x] Resize widgets: drag the edge or pick S/M/L/XL
- [x] Custom sidebar appearance: width, style, side and section labels
- [x] Save settings locally: automatic, with validation so corrupt data can't break the app
- [x] Import and export themes: `.json` files, safely validated

Extras that came along: Clock and Notes widgets, interface scale, reduce motion, saved theme library, bundled fonts (works offline), production Content-Security-Policy.

## Phase 3 – Accounts and profiles · v0.3.0 – User accounts

- [ ] Registration
- [ ] Login and logout
- [ ] Username system
- [ ] Profile pictures
- [ ] Custom profile information
- [ ] Account settings
- [ ] Secure authentication through Supabase

> **Before starting:** create a free Supabase project at supabase.com. We'll need its **Project URL** and **publishable (anon) key**. Never share the service-role key.

## Phase 4 – Friends · v0.4.0 – Social system

- [ ] Add friends
- [ ] Friend requests
- [ ] Accept and decline requests
- [ ] Online/offline status
- [ ] Friend profiles
- [ ] Recently active friends
- [ ] Friend list management

## Phase 5 – Gaming center · v0.5.0 – Gaming hub

- [ ] Personal game library
- [ ] Custom game covers
- [ ] Game launch buttons
- [ ] Roblox game collections
- [ ] Recently played games
- [ ] Favourite games
- [ ] Game information and descriptions

## Phase 6 – Anime center · v0.6.0 – Anime tracking

- [ ] Anime watchlist
- [ ] Currently watching
- [ ] Completed anime
- [ ] Plan to watch
- [ ] Ratings
- [ ] Favourite anime
- [ ] Favourite characters
- [ ] Search and anime information

## Phase 7 – Community · v0.7.0 – Communication

- [ ] Private messaging
- [ ] Group chats
- [ ] Community groups
- [ ] Polls
- [ ] Notifications
- [ ] Activity feed
- [ ] User status messages
- [ ] Message history

## Phase 8 – Arcade · v0.8.0 – Games inside NEXUS

- [ ] Trivia quizzes
- [ ] Reaction-time games
- [ ] Multiplayer rooms
- [ ] Private game sessions
- [ ] Leaderboards
- [ ] XP system
- [ ] Achievements

## Phase 9 – PC center · v0.9.0 – PC monitoring

- [ ] CPU usage
- [ ] GPU usage
- [ ] RAM usage
- [ ] Storage information
- [ ] CPU and GPU temperatures where supported
- [ ] Network information
- [ ] System information

## Phase 10 – Release · v1.0.0

- [ ] Fix bugs
- [ ] Improve performance
- [ ] Test all features
- [ ] Review security
- [x] Create Windows installer *(electron-builder + CI artifact; needs an app icon and testing)*
- [ ] Add automatic updates
- [ ] Prepare installation instructions
- [ ] Release NEXUS to friends

## Extra ideas for later

- Shared themes between friends *(file-based sharing already works; in-app sharing after accounts)*
- Custom plugins and extensions
- More mini-games
- Discord integration
- Game activity status
- Custom profile badges
- Personal dashboard layouts *(done locally in 0.2.0; sync to your account after 0.3.0)*
- More PC tools
