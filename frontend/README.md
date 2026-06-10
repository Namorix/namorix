# Namorix Frontend

[![License: AGPL v3](https://img.shields.io/badge/License-AGPLv3-blue.svg)](../LICENSE)

Vite + React desktop shell — window manager, taskbar, launcher, and built-in system addons.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | React 19 |
| Build | Vite 8 |
| State | Redux Toolkit (normalized) |
| Routing | react-router-dom 7 |
| i18n | i18next + react-i18next |
| Realtime | SignalR (`@microsoft/signalr`) |
| Styling | SCSS modules + CSS variables |
| Package manager | pnpm workspace |

## Quick Start

```bash
pnpm install
pnpm dev          # Vite dev server (port 5174)
pnpm build        # TypeScript check + production build
pnpm preview      # Preview production build
```

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx                     # Entry: imports styles, configureCore, ThemeProvider, i18n, addons
│   ├── main.scss                    # Forwards @namorix/styles + @namorix/styles/shell
│   ├── App.tsx                      # Router: blocked check, /login, /register, / (guarded)
│   ├── Root.tsx                     # Provider (Redux + NmxHostContext) wrapping App
│   │
│   ├── addons/                      # Built-in system addons (M3)
│   │   ├── registry.ts              # registerAddon, resolveAddon, listAddons
│   │   ├── index.ts                 # Bootstrap — imports all *.addon.ts + addonToItems helper
│   │   ├── LogViewer/               # Log entry viewer with level chips, source search, pagination, detail dialog
│   │   ├── NetworkTraffic/          # Network traffic overview, logs (SignalR + flat file), detail dialog
│   │   ├── About/                   # Version info, meta-list, GitHub links
│   │   ├── Settings/                # Appearance (theme, accent, density, font, language, date/time format), System, Account tabs
│   │   ├── SystemMonitor/           # System resource monitoring
│   │   ├── FileManager/             # File browser scaffold
│   │   ├── Terminal/                # Terminal emulator scaffold
│   │   ├── NotificationCenter/      # System notifications scaffold
│   │   └── PackageCenter/           # External addon management scaffold
│   │
│   ├── components/
│   │   ├── AuthView.tsx             # Two-column layout (hero + form panel)
│   │   ├── WindowManager.tsx        # Renders all open windows by zOrder
│   │   ├── Taskbar/                 # Clock, start button, window buttons, SignalR status
│   │   ├── DesktopArea/             # Desktop icon shortcuts, grid layout
│   │   ├── Launcher/                # Start menu with search + system app list
│   │   ├── WindowFrame/             # Draggable, resizable window chrome
│   │   └── Auth/                    # (empty — reserved)
│   │
│   ├── store/                       # Redux Toolkit
│   │   ├── index.ts                 # configureStore (windowsState, launcher, taskbar slices)
│   │   ├── hooks.ts                 # useAppDispatch, useAppSelector (shallowEqual default)
│   │   ├── types.ts                 # RootState, AppDispatch, WindowRect
│   │   ├── slices/                  # windowsSlice, launcherSlice, taskbarSlice
│   │   └── selectors/               # windowSelectors, launcherSelectors, taskbarSelectors
│   │
│   ├── types/
│   │   ├── windowing.ts             # rectToOrigin helper
│   │   └── addon-item.ts            # AddonItem, OnOpenApp types
│   │
│   ├── config/
│   │   └── windowDefaults.ts        # CSS variable cache for window geometry defaults
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts       # login, register, logout, loadAppearance, loadSystemDefaults
│   │   ├── settings.controller.ts   # getUserSettings, getAppearanceOptions, getThemes, updateProfile, changePassword
│   │   ├── log.controller.ts        # listLogs with level/source filters
│   │   └── health.controller.ts     # Health check, untrusted proxy detection
│   │
│   ├── hooks/
│   │   ├── useTaskbarClock.ts       # Live clock for taskbar (uses appearance date/time format)
│   │   ├── useAppearanceSync.ts     # Theme loading + content language + SignalR listener
│   │   └── useDateTimeFormat.ts     # Reactive hook for useAppearanceStore time/date format
│   │
│   ├── i18n/
│   │   ├── index.ts                 # NmxI18n instance with core + translation namespaces
│   │   └── locales/
│   │       ├── en.json              # English translations
│   │       └── vi.json              # Vietnamese translations (TODO)
│   │
│   ├── pages/
│   │   ├── Login.tsx                # Username + password + remember-me toggle
│   │   ├── Register.tsx             # Username + email + password + name
│   │   ├── Desktop.tsx              # Full shell layout: taskbar, desktop, windows, launcher
│   │   └── Blocked.tsx              # Untrusted proxy / blocked access screen
│   │
│   └── constants/                   # (empty — reserved)
│
├── packages/
│   ├── core/                        # @namorix/core — types, auth, http, i18n, SignalR hooks, store
│   ├── styles/                      # @namorix/styles — SCSS tokens, reset, themes, icomoon icons
│   └── ui/                          # @namorix/ui — React primitives + composite components
│
├── public/themes/                   # Compiled theme CSS (default, dark)
├── vite.config.ts                   # Vite config with /api and /hubs proxy
└── .env.example                     # VITE_API_URL=http://localhost:3000
```

## Key Patterns

### Guarded Routes
```typescript
<GuardedRoute guard={authGuard}><Desktop /></GuardedRoute>
<GuardedRoute guard={loginGuard}><Login /></GuardedRoute>
```

Guards are async — they call `GET /api/auth/session` to validate auth state. Three guards exist: `authGuard`, `loginGuard`, `registerGuard`.

### State Management (Redux Toolkit)
```typescript
import { useAppDispatch, useAppSelector } from "../../store"

const dispatch = useAppDispatch()
const windows = useAppSelector((s) => s.windowsState)
dispatch(closeWindow(windowId))
```

Slices: `windowsSlice` (open/close/focus/minimize/maximize/move/resize/cascade), `launcherSlice` (toggle), `taskbarSlice` (window buttons). Selectors use `createSelector` for memoization. `useAppSelector` defaults to `shallowEqual`.

### Client-side Validation
```typescript
import { validate, ValidationFields as F, formatApiError } from "@namorix/core"

const error = validate(t)
  .required(F.USERNAME, username)
  .minLength(F.PASSWORD, password, 6)
  .first()
```

### i18n Layering
```
@namorix/core (namespace "core")  →  common.validation.*, common.fields.*
frontend (namespace "translation") →  auth.login.*, auth.register.*
```

### SignalR Realtime
```typescript
import { useSignalR, useSignalREvent, useSignalRStatus } from "@namorix/core"

const connection = useSignalR()           // Get connection instance
const status = useSignalRStatus()         // "connected" | "disconnected" | "reconnecting"
useSignalREvent("LogEntry", handler)      // Subscribe to event
```

Auto-reconnects with exponential backoff (5s → 30s cap, infinite retry).

## Dependencies

| Package | Purpose |
|---------|---------|
| `@namorix/core` | Types, auth service, http client, i18n, SignalR hooks, store, guards |
| `@namorix/styles` | SCSS design tokens, reset, variables, theme files |
| `@namorix/ui` | Primitives (NmxButton, NmxForm, NmxInlineAlert, NmxToggle, NmxChip, NmxIcon) |
| `react-router-dom` | Client-side routing with GuardedRoute pattern |
| `react-i18next` / `i18next` | i18n with layered namespaces |
| `@reduxjs/toolkit` / `react-redux` | State management |
| `@microsoft/signalr` | Realtime event streaming |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3000` | Backend API URL |

## Addon Architecture

Built-in addons use the same contract as external addons (M4):

- **AddonEntry**: `mount(container, context)` / `unmount()` lifecycle
- **NmxAddonManifest**: id, displayName, description?, icon?
- **AddonContext**: addonId, locale, theme

Four system addons are implemented: LogViewer, NetworkTraffic (SignalR + flat file), Settings, SystemMonitor.

## Milestones

- **M1** — Static shell UI + mock auth ✅
- **M2** — Full auth backend ✅
- **M3** — System Addons (Built-in): addon contract + registry, LogViewer, NetworkTraffic, SystemMonitor, Settings, theme system, SignalR realtime ✅
- **M4** — External addon system (Docker lifecycle, addon manager)
- **M5** — `@namorix/core` publish npm + addon integration guide
