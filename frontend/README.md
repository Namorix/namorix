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
pnpm dev          # Vite dev server (port 5000)
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
│   │   ├── types.ts                 # NmxAddonManifest, AddonContext, AddonEntry, ExternalAddonManifest, etc.
│   │   ├── About/                   # Version info, meta-list, GitHub links
│   │   ├── FileManager/             # File browser scaffold
│   │   ├── LogViewer/               # Log entry viewer with level chips, source search, pagination, detail dialog
│   │   ├── NetworkTraffic/          # Network traffic overview, logs (SignalR + flat file), detail dialog, API/Proxy source filter
│   │   ├── PackageCenter/           # External addon management (catalog browse, install, start/stop, grid view)
│   │   ├── Settings/                # Appearance (theme, accent, density, font, language, date/time), System, Account
│   │   ├── SystemMonitor/           # CPU, memory, uptime, disk, IO real-time (SignalR)
│   │   └── Terminal/                # Terminal emulator scaffold
│   │   │
│   │   ├── Frontgate/               # Reverse proxy management (YARP integration, CRUD UI, routing rules, access control, dry-run, audit log, cert download)
│   │   ├── Beacon/                  # DDNS updater — updates DNS when IP changes (provider multi-host, activity, settings)
│   │   └── Warden/                  # Security — ban IP (scaffold)
│   │
│   ├── components/
│   │   ├── AuthView.tsx             # Two-column layout (hero + form panel)
│   │   ├── WindowManager.tsx        # Renders all open windows by zOrder
│   │   ├── DesktopArea/             # Desktop icon shortcuts (builtin + external addons)
│   │   ├── Launcher/                # Start menu with search + system app list
│   │   ├── Taskbar/                 # Clock, start button, window buttons, SignalR status, notification badge
│   │   └── WindowFrame/             # Draggable, resizable window chrome (6 hooks)
│   │
│   ├── store/                       # Redux Toolkit
│   │   ├── index.ts                 # configureStore (windows, launcher, taskbar, notifications, externalAddons)
│   │   ├── hooks.ts                 # useAppDispatch, useAppSelector (shallowEqual default)
│   │   ├── types.ts                 # RootState, AppDispatch, WindowRect
│   │   ├── slices/                  # windowsSlice, launcherSlice, taskbarSlice, notificationsSlice, externalAddonsSlice
│   │   └── selectors/               # windowSelectors, launcherSelectors, taskbarSelectors, notificationSelectors
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
│   │   ├── notification.controller.ts  # fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead, delete
│   │   ├── settings.controller.ts   # getUserSettings, getAppearanceOptions, getThemes, updateProfile, changePassword
│   │   ├── log.controller.ts        # listLogs with level/source filters
│   │   ├── health.controller.ts     # Health check, untrusted proxy detection
│   │   └── addon.controller.ts      # Addon install/start/stop/uninstall/list/catalog
│   │   └── frontgate.controller.ts  # Frontgate reverse proxy CRUD + audit + cert download (listRules, createRule, updateRule, deleteRule, listAudit, clearAudit, downloadCert)
│   │   └── beacon.controller.ts     # Beacon DDNS (hostnames, activity, settings, providers, dry-run check)
│   │
│   ├── hooks/
│   │   ├── useTaskbarClock.ts       # Live clock for taskbar (uses appearance date/time format)
│   │   ├── useAppearanceSync.ts     # Theme loading + content language + SignalR listener
│   │   ├── useDateTimeFormat.ts     # Reactive hook for useAppearanceStore time/date format
│   │   └── useNotificationEvents.ts # SignalR listener for notification:* events
│   │
│   ├── i18n/
│   │   ├── index.ts                 # NmxI18n instance with core + translation namespaces
│   │   └── locales/
│   │       ├── en.json              # English translations
│   │       ├── vi.json              # Vietnamese translations
│   │       └── notification/        # Notification content keys (en.json, vi.json)
│   │
│   ├── pages/
│   │   ├── Login.tsx                # Username + password + remember-me toggle
│   │   ├── Register.tsx             # Username + email + password + name
│   │   ├── Desktop.tsx              # Full shell layout: taskbar, desktop, windows, launcher
│   │   └── Blocked.tsx              # Untrusted proxy / blocked access screen
│   │
│   └── services/
│       └── externalAddonEntry.ts    # Module Federation loader for widget addons
│
├── packages/
│   ├── core/                        # @namorix/core — types, auth, http, i18n, SignalR, store, theme,
│   │                                 # fingerprint, cache, toast, oauth, mount (createMount, AddonModeProvider)
│   ├── styles/                      # @namorix/styles — SCSS tokens, reset, themes, icomoon icons
│   └── ui/                          # @namorix/ui — React primitives + composite components + layouts
│
├── public/themes/                   # Compiled theme CSS (default, dark)
├── vite.config.ts                   # Vite config with /api and /hubs proxy
└── .env.example                     # VITE_API_URL=http://localhost:5001
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

Slices: `windowsSlice` (open/close/focus/minimize/maximize/move/resize/cascade/closeWindowsByAddonId), `launcherSlice` (toggle), `taskbarSlice` (window buttons), `notificationsSlice` (unread count, pagination, mark read), `externalAddonsSlice` (external addon list + status + catalog). Selectors use `createSelector` for memoization. `useAppSelector` defaults to `shallowEqual`.

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
frontend (namespace "translation") →  auth.login.*, auth.register.*, addon.*
frontend (namespace "notification") →  notification.* (content keys for notification center)
```

### SignalR Realtime
```typescript
import { useSignalR, useSignalREvent, useSignalRStatus, useSignalRGroup } from "@namorix/core"

const connection = useSignalR()           // Get connection instance
const status = useSignalRStatus()         // "connected" | "disconnected" | "reconnecting"
useSignalREvent(eventName, handler)       // Subscribe to event (deferred registration support)
```

Auto-reconnects with exponential backoff (5s → 30s cap, infinite retry).

### Controller Pattern
```typescript
import { nmxHttp, getApiBaseUrl } from "@namorix/core"

export const addonController = {
  list: async () => {
    const data = await nmxHttp.url(getApiBaseUrl() + "/api/addon").get().json()
    if (!data.success) throw ApiError.fromResponse(data)
    return data.data
  },
}
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `@namorix/core` | Types, auth service, http client, i18n, SignalR hooks, store, guards, theme, toast, oauth (PKCE), mount (createMount, AddonModeProvider) |
| `@namorix/styles` | SCSS design tokens, reset, variables, theme files, icomoon icons |
| `@namorix/ui` | Primitives (NmxButton, NmxForm {NmxFormField.rowFlex}, NmxInlineAlert, NmxToggle, NmxChip, NmxIcon, NmxBadge, NmxSpinner, NmxSelect, NmxSlider, NmxSearchInput, etc.) + Composite (NmxCard, NmxDataTable, NmxDialog {NmxAlertDialog.noSpacingBody}, NmxMetaList, NmxRail, NmxSettings, NmxToolbar, NmxAddon, NmxToastProvider, NmxTabContext, NmxTabs, NmxFormRow, etc.) + Layouts (NmxHorizontalWrap, NmxGrid) |
| `react-router-dom` | Client-side routing with GuardedRoute pattern |
| `react-i18next` / `i18next` | i18n with layered namespaces |
| `@reduxjs/toolkit` / `react-redux` | State management |
| `@microsoft/signalr` | Realtime event streaming |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:5001` | Backend API URL |

## Addon Architecture

Built-in addons use the same contract as external addons (M4):

- **AddonEntry**: `mount(container, context)` / `unmount()` lifecycle
- **NmxAddonManifest**: id, name, description?, localeKey?, icon?, defaultWidth?, defaultHeight?, preferFullSize?, role?, instanceMode?
- **AddonContext**: addonId, nmxStore?, store?, isExternal?, sendCommand?

Eleven built-in addons: About, LogViewer, NetworkTraffic, SystemMonitor, Settings, FileManager (scaffold), Terminal (scaffold), PackageCenter, Frontgate, Beacon, Warden (scaffold).

### External Addons (Docker-based)

External addons integrate via two modes:

| Mode | Mechanism | Auth |
|------|-----------|------|
| **Widget** | Module Federation mount in desktop window, shares React + Redux | HttpOnly cookie (same-origin) |
| **Standalone** | Runs on own port, own `index.html`, user navigates directly | OAuth2 authorization_code + PKCE (auto-handled by `createMount`) |

- **Server-to-server**: gRPC bidirectional streaming for widget event forwarding + heartbeat
- **Shell ↔ Addon (Widget)**: Event bus via `@namorix/core` (`shell:*` and `addon:*` events)
- **PackageCenter**: UI for catalog browsing, install/start/stop/uninstall with live status via SignalR

## Milestones

- **M1** — Static shell UI + mock auth ✅
- **M2** — Full auth backend ✅
- **M3** — System Addons (Built-in): addon contract + registry, 11 built-in addons, theme system, SignalR realtime ✅
- **M4** — External addon system: Docker lifecycle, OAuth2 (PKCE + client_credentials), gRPC, addon catalog, standalone mode ✅
    - **Frontgate addon**: YARP reverse proxy with runtime config reload, CRUD API and management UI (Phase 1 ✅), certificate management (Phase 2 ✅ — LE HTTP-01 + dry-run, custom cert; DNS-01 dropped), access control (Phase 3 ✅ — Access Policy CRUD, IP allowlist/denylist, Geo blocking, BasicAuth, dry-run), audit log + rate limit + backend health (Phase 4 ✅)
    - **NetworkTraffic**: source filter API/Proxy — tách traffic từ API port vs proxy ports (cùng buffer, lọc theo `source` query param)
- **M5** — `@namorix/core` publish npm + addon integration guide
