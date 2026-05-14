# System Patterns

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   Shell UI   │  │  Addon Tabs  │  │  Terminal App    │ │
│  │  (React)     │  │  (external)  │  │  (xterm.js)     │ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘ │
└─────────┼─────────────────┼────────────────────┼──────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│               Backend (ASP.NET Core 8)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   REST API   │  │ Shell WS    │  │  Terminal WS     │  │
│  │  (auth, etc) │  │ (Socket.IO) │  │  (PTY bridge)   │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
│         │                 │                    │           │
│         ▼                 ▼                    ▼           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │          EF Core / SQLite  │ JWT │ Logger           │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────┐         ┌─────────────────────────┐
│   SQLite DB     │         │   Docker (Unix socket)   │
│   (local file)  │         │   Addon containers        │
└─────────────────┘         └─────────────────────────┘
```

## Key Technical Decisions

### 1. Desktop as Only Auth Server
- Desktop issues access (15min) + refresh (7 days) JWT tokens
- Addons **verify** tokens via API call, not issue their own
- HttpOnly cookies reduce XSS risk
- **Why:** Simplicity, single source of truth for sessions

### 2. Monorepo with Publishable Packages
- `@namorix/core` — TypeScript contracts, zero deps, browser-only
- `@namorix/styles` — SCSS design tokens (--nmx-* CSS variables)
- `@namorix/ui` — React primitive components (NmxButton, NmxInput, etc.)
- **Why:** Type drift prevention, consistent design across addons

### 3. SQLite + EF Core for Database
- Single-node deployment simplicity
- No separate DB server needed for self-hosted
- **Why:** Simple, zero-config for personal/home server

### 4. Socket.IO for Realtime
- Shell events: `nmx:notification`, `nmx:addon-status`
- WebSocket endpoints: `/namorix-shell-ws`, `/namorix-terminal-ws`
- **Why:** Unified realtime layer, works behind proxies

### 5. Docker via Unix Socket
- Desktop backend runs on same machine as Docker
- Addon containers on `namorix_net` bridge network
- **Why:** Secure addon isolation, native Docker management

## Package Boundary (STRICT)

| Package | Can Import |
|---------|------------|
| `@namorix/core` | React ecosystem. Single package for frontend + external addons (shared merged in) |
| `@namorix/styles` | **Nothing** — pure SCSS |
| `@namorix/ui` | `@namorix/core`, React deps. Uses `--nmx-*` CSS vars from `@namorix/styles` (consumer must import) |
| `frontend` | `@namorix/core`, `@namorix/styles`, `@namorix/ui`, React deps |
| `backend` | ASP.NET Core 8 ecosystem only |

## Key Interfaces

```typescript
interface NmxSession { user: NmxUser; expiresAt: string }
interface NmxUser { id: number; username: string; role: number }
interface NmxAddonManifest { id: string; displayName: string; internalPort: number }
interface NmxAddonStatus { addonId: string; status: 'installed' | 'running' | 'stopped' | 'error' }
```

## Design Patterns

### Error Handling
- `ApiError` for HTTP errors (statusCode, message, code, field, meta)
- Client: `formatApiError(t, err)` resolves validation→auth→null, caller provides generic fallback
- Controller: throw ApiError.fromResponse(data) on non-success

### i18n Layering
- `@namorix/core` pre-loads base locales in `"core"` namespace
- Frontend loads page strings in `"translation"` namespace via `NmxI18n.load()`
- `fallbackNS: ["core", "translation"]` ensures core translations always available

### Validation (Two-Tier)
- **Server:** `validate(schema)` middleware — Schema-based, `ValidationErrorCode` enum
- **Client:** `ValidationRunner` — fluent builder, returns translated strings
- **Bridge:** `formatApiError()` parses API response, resolves code → i18n key → formatted string

### Decorator-based Routing (Backend — C#)
- ASP.NET Core attributes: `[ApiController]`, `[Route]`, `[HttpPost]`, `[HttpGet]`, `[Validate]`
- `AddControllers()` / `MapControllers()` for built-in route registration

### Authentication (Async isAuthenticated)
- `AuthChecker.isAuthenticated()` is **async** — calls `GET /api/auth/session` with `credentials: "include"`
- HttpOnly cookies are NOT readable by `document.cookie`, must verify via API
- Guards (`createAuthGuard`, etc.) await the async check
- `http` client (RequestBuilder) always includes `credentials: "include"`

### CSRF Double-Submit Pattern
- **Server:** `setCsrfCookie` sets non-HttpOnly `nmx_csrf_token` cookie; `validateCsrf` checks header matches cookie on mutating requests
- **Client:** `RequestBuilder._body()` reads cookie and auto-injects `X-CSRF-Token` header
- **Env:** Enabled only when `CSRF_MODE=double-submit`
- **Cookie policy:** Auth cookies `httpOnly: true, sameSite: "lax"`; CSRF cookie `httpOnly: false, sameSite: "lax"`
- Attacker can't read CSRF cookie from cross-origin → cannot forge matching header

### Fingerprint Verification on Token Refresh (Option C Balanced)
- **Client:** `generateFingerprint()` creates SHA-256 hash from `FingerprintComponents` (userAgent, acceptLanguage, acceptEncoding, screenResolution, timezone, platform). Falls back to base64 if non-HTTPS.
- **Header:** Fingerprint sent via `x-device-fingerprint` header on every request (auto-attached in `RequestBuilder.json()`)
- **Server verification on refresh:**
  - Fingerprint differs BUT IP same → update fingerprint, continue (browser/OS update)
  - Fingerprint AND IP both differ → revoke ALL user tokens (high risk: possible token theft)
- **Why Option C:** Avoids false positives when users update browser (fingerprint changes but IP stays same)

### Token Whitelist (refresh_tokens)
- Replaced `revokedTokens` blacklist with `refresh_tokens` whitelist
- New columns: `userAgent`, `fingerprint`, `ipAddress`, `lastUsedAt`
- On login: INSERT into whitelist with session metadata
- On refresh: DELETE old + INSERT new (rotation), preserves TTL via `remainingSeconds`
- On logout: DELETE by jti
- On logout-all: DELETE WHERE userId = ?
- Token reuse detection: unknown jti → `revokeAllUserTokens()` (anti-theft)
- Cleanup job: DELETE expired tokens by `expiresAt < now`

### Remember-Me (90d TTL)
- `login` passes `refreshTtl` based on `meta.rememberMe`: `config.jwtRefreshRememberTtl` (90d) vs `config.jwtRefreshTtl` (7d)
- On refresh: remaining TTL calculated from `existing.expiresAt`, preserved in new token

### Frontend Controller Pattern
- API calls encapsulated in controller objects (e.g., `authController`)
- Uses `http.url().post().json()` fluent API from `@namorix/core`
- Throws `ApiError.fromResponse(data)` on non-success

### State Management (Zustand) — Planned, Not Yet Implemented
- Stores: `useAuthStore`, `useWindowsStore`, `useAddonsStore`, `useDesktopStore`
- File pattern: `{name}.store.ts`
- **Note:** No Zustand stores exist yet — will be created during M3 (Desktop shell)

### React Component Patterns (@namorix/ui)
- Components prefixed with `Nmx` (e.g., `NmxButton`, `NmxInput`)
- Props interfaces: `[ComponentName]Props`
- CSS classes: BEM `nmx-kebab-case` (e.g., `nmx-button`, `nmx-button--primary`)
- Use CSS variables from `@namorix/styles` (--nmx-color-primary, etc.)
- Functional components only
- `shouldRender` prop for conditional rendering

## Event Flow

### Auth Flow (Current)
```
1. Login → POST /api/auth/login → Set HttpOnly cookies (access + refresh, sameSite: lax)
2. Session check → GET /api/auth/session → validate access token via cookie (credentials: "include")
3. Token refresh → POST /api/auth/refresh → rotate both tokens
4. Logout → POST /api/auth/logout → clear cookies, revoke token jti
5. CSRF on mutating requests: read nmx_csrf_token cookie → send X-CSRF-Token header
```

## Shell UI Architecture

### WindowState
```typescript
type WindowState = {
  windowId: string        // UUID
  appId: string           // 'file-manager' | 'terminal' | 'settings' | ...
  title: string
  icon?: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  minimized: boolean
  maximized: boolean
  zIndex: number
}
```

### Zustand Stores (Planned)
| Store | Responsibility |
|-------|----------------|
| `auth.store` | `user`, `status` (`anonymous` \| `loading` \| `authenticated`), `expiresAt` |
| `windows.store` | `windows: WindowState[]`, `focusOrder`, `openWindow`, `closeWindow`, `focusWindow` |
| `addons.store` | `AddonInfo[]` synced from WebSocket `shell:addons` |
| `desktop.store` | `theme`, `locale`, `wallpaper` |

### Window Manager
- `focusOrder`: array of windowId; last element = focused window
- On focus: move windowId to end of `focusOrder`, assign zIndex higher than others
- Drag/resize: Pointer Events on title bar and window edges

### Z-index Layer Stack
| Layer | z-index | Notes |
|-------|---------|-------|
| Auth overlay | 9000 | Full screen when not logged in |
| Notification center | 8000 | Notification panel |
| App launcher | 7000 | Start menu |
| Taskbar | 1000 | Always on top of window content |
| Windows | 100+ | Dynamic zIndex managed by WindowManager |
| Desktop icons | 50 | Desktop background |

### System Apps
- Each system app is mounted inside Window.tsx by appId (switch/registry map)
- Taskbar: shows running windows, focus, minimize/restore
- AppLauncher: shortcuts to open system apps (creates new WindowState)
- System apps: File Manager, Terminal, Settings, Log Viewer

## WebSocket Architecture

### /namorix-shell-ws (Socket.IO)
Server → Client:
| Event | Payload | Notes |
|-------|---------|-------|
| `shell:addons` | `AddonInfo[]` | Full snapshot on connect + status changes |
| `shell:addon:logLine` | `{ addonId, line }` | Streaming logs |
| `nmx:deprecation` | `NmxDeprecation` | Incompatible core version |

Client → Server:
| Event | Payload | Notes |
|-------|---------|-------|
| `nmx:handshake` | `{ addonId, coreVersion }` | Auto-emit on connectEvents() |
| `shell:addon:install` | `{ imageRef }` | |
| `shell:addon:start` | `{ addonId }` | |
| `shell:addon:stop` | `{ addonId }` | |
| `shell:addon:remove` | `{ addonId }` | |
| `shell:addon:logs` | `{ addonId, since? }` | |

Reconnection: Socket.IO with backoff; server sends full `shell:addons` on reconnect.

### /namorix-terminal-ws (PTY bridge)
Client → Server: `{ type: 'input' | 'resize'; data: string; cols?: number; rows?: number }`
Server → Client: `{ type: 'output'; data: string }`

## External Addon System

### Docker Lifecycle
- Client sends commands via shell WebSocket: install, start, stop, remove, logs
- Server uses Docker client via Unix socket (`/var/run/docker.sock`)
- Addon containers on `namorix_net` bridge network

### DockerMonitor & Auto-Discover
- Polls container changes; detects containers with label `namorix.addon=true`
- Metadata from labels: `namorix.addon.id`, `namorix.addon.display_name`, `namorix.addon.internal_port`
- Auto-discovers addons created outside UI

### Addon Launch
- User clicks addon → `window.open` to `http://<host>:<hostPort>/`
- Addon app runs independently in new browser tab
- `@namorix/core` in addon: `getSession()`, `createApiClient()`, `connectEvents()`

### Addon Auth Flows
Two distinct auth mechanisms:
1. **Server-to-server (AddonToken):** Desktop generates AddonSecret on install, injects via Docker env. Addon calls `POST /api/addon/handshake` to exchange secret for long-lived AddonToken.
2. **Browser-to-addon (nmx_token):** Cross-origin redirect flow — Desktop login → redirect with one-time `nmx_token` → addon exchanges for session via `POST /api/addon/session-exchange`.
