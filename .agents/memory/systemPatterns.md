# System Patterns

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   Shell UI   │  │  Addon Tabs  │  │  Terminal App    │ │
│  │  (React)     │  │  (external)  │  │  (xterm.js)     │ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘ │
└─────────┼─────────────────┼────────────────────┼──────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│                    Backend (Express)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   REST API   │  │ Shell WS    │  │  Terminal WS     │  │
│  │  (auth, etc) │  │ (Socket.IO) │  │  (PTY bridge)   │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
│         │                 │                    │           │
│         ▼                 ▼                    ▼           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              @namorix/backend-core                    │ │
│  │  JWT │ Logger │ SQLite/Drizzle │ Docker │ Config    │ │
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
- `@namorix/backend-core` — server utilities, never imported by frontend
- **Why:** Type drift prevention, consistent design across addons

### 3. SQLite + Drizzle for Database
- Single-node deployment simplicity
- Drizzle ORM for type-safe queries
- **Why:** No separate DB server needed for self-hosted

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
| `@namorix/shared` | **Nothing** internal — zero deps |
| `@namorix/core` | `@namorix/shared`, React ecosystem |
| `@namorix/styles` | **Nothing** — pure SCSS |
| `@namorix/ui` | `@namorix/core`, React deps. Uses `--nmx-*` CSS vars from `@namorix/styles` (consumer must import) |
| `@namorix/backend-core` | `@namorix/shared`, express, pino, drizzle, etc. **Not** `@namorix/core` |
| `frontend` | `@namorix/core`, `@namorix/styles`, `@namorix/ui`, `@namorix/shared`, React deps |
| `backend` | `@namorix/backend-core`, `@namorix/shared`, Express |

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

### Decorator-based Routing (Backend)
- `@Controller(prefix)`, `@Get/@Post/@Put/@Patch/@Delete(path)`, `@Validate(schema)` store metadata
- `registerController(router, ControllerClass)` reads Reflect metadata, wires Express routes
- Uses `Symbol.for()` for cross-module metadata keys (NOT `Symbol()`)

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
- On sign-in: INSERT into whitelist with session metadata
- On refresh: DELETE old + INSERT new (rotation), preserves TTL via `remainingSeconds`
- On sign-out: DELETE by jti
- On sign-out-all: DELETE WHERE userId = ?
- Token reuse detection: unknown jti → `revokeAllUserTokens()` (anti-theft)
- Cleanup job: DELETE expired tokens by `expiresAt < now`

### Remember-Me (90d TTL)
- `signIn` passes `refreshTtl` based on `meta.rememberMe`: `config.jwtRefreshRememberTtl` (90d) vs `config.jwtRefreshTtl` (7d)
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
1. SignIn → POST /api/auth/signin → Set HttpOnly cookies (access + refresh, sameSite: lax)
2. Session check → GET /api/auth/session → validate access token via cookie (credentials: "include")
3. Token refresh → POST /api/auth/refresh → rotate both tokens
4. SignOut → POST /api/auth/signout → clear cookies, revoke token jti
5. CSRF on mutating requests: read nmx_csrf_token cookie → send X-CSRF-Token header
```
