# Progress

## What Works

- Frontend Vite project created with React + TypeScript
- Backend Express project scaffold with TypeScript + tsx
- pnpm monorepo workspace configured
- `@namorix/styles` package (SCSS tokens, reset, fonts, variables, mixins)
- `@namorix/ui` package with components:
  - NmxButton, NmxForm (7 sub-components), NmxInlineAlert, NmxToggle
- `@namorix/core` with:
  - `cx` utility, `ApiError`, `http` client (RequestBuilder with CSRF auto-injection, 401 auto-refresh + retry)
  - `GuardedRoute`, auth guards (createAuthGuard, createLoginGuard, createRegisterGuard)
  - `NmxI18n` class (i18n layering: core + translation namespaces)
  - `ValidationRunner` (fluent client-side validation)
  - `formatApiError`, `formatValidationError`, `formatAuthError`
  - `authService` (async `isAuthenticated` via `/api/auth/session`)
- `@namorix/shared` merged into `@namorix/core` (2026-05-14 restructure)
- React Router setup with /login, /register, / routes
- Auth pages (Login, Register with AuthPage wrapper) + responsive layout
- i18next with react-i18next (en/vi locales, layered namespaces)
- Auth endpoints (login/register/logout/session/refresh/status) — decorator-based
- JWT secret management (env var or .secret file)
- First user = admin, subsequent = user
- Token refresh with rotation
- Auth guards with GuardedRoute (async isAuthenticated)
- Controller pattern for frontend API calls
- Login page with client-side validation + API connection + rememberMe toggle connected + rememberMe toggle connected
- `useAuthForm` hook (shared alert state + error handling for Login/Register)
- `validate()` middleware in backend-core (Schema-based)
- `createMiddleware()` in backend-core (configurable stack)
- CSRF double-submit protection (set + validate cookie/header mismatch), enabled by default
- HttpOnly auth cookies with sameSite: lax
- Cookie wrappers in @namorix/backend-core (set/get/clear for access, refresh, csrf)
- Token whitelist: refresh_tokens table (jti, userId, userAgent, fingerprint, ipAddress, timestamps)
- Token reuse detection: unknown jti → revoke all user tokens
- logout-all endpoint (revoke all user tokens by userId)
- Remember-me (90d TTL, preserved on rotation via remaining seconds)
- eslint config + lint scripts across all packages (strictTypeChecked)
- **Fingerprint generation**: `packages/core/src/fingerprint/` with `FingerprintComponents` interface + SHA-256 hash (fallback base64 if non-HTTPS)
- **Fingerprint verification on refresh**: Option C balanced — revoke if both fingerprint AND IP changed; allow if only fingerprint changed (browser/OS update)
- **Trust proxy + getClientIP()**: Priority chain (CF → X-Forwarded-For → X-Real-IP → X-Client-IP → True-Client-IP)
- **Secure cookie flag**: Configurable via SECURE_COOKIE env var
- **backend-c (.NET/C#)**: ASP.NET Core 8 + EF Core + SQLite migration scaffolded (migrated from Node.js backend, now in `backend/` folder)

## Milestones

### M1 — Static Shell UI + Mock Auth Page
**Status:** Complete ✅

### M2 — Full Auth Backend
**Status:** Complete ✅

- [x] Backend scaffold (Express + TypeScript + tsx)
- [x] `@namorix/backend-core` setup (logger, jwt, db, middleware, validate, utils, decorators, csrf)
- [x] `@namorix/shared` setup (types, constants, error codes, helpers, http-headers)
- [x] Database schema (users, refreshTokens, settings)
- [x] Auth API endpoints (login/register/logout/logout-all/session/refresh/status)
- [x] JWT utilities (signAccessToken with optional TTL, signRefreshToken, verifyToken)
- [x] Auth service (Login, Register, refreshToken, revokeToken, revokeAllUserTokens, cleanupExpiredTokens, getAuthStatus)
- [x] Config + Secret management (CSRF_DISABLE=false by default, JWT_ACCESS_TTL, JWT_REFRESH_TTL, JWT_REFRESH_REMEMBER_TTL)
- [x] First user = admin logic
- [x] Token refresh with rotation + TTL preservation (remember-me 90d)
- [x] Cookie wrappers in @namorix/backend-core (set/get/clear for access, refresh, csrf)
- [x] Settings service with in-memory cache
- [x] Cleanup job for expired refresh_tokens (daily cron at 03:00)
- [x] `validate()` middleware (Schema-based)
- [x] `createMiddleware()` (configurable middleware stack)
- [x] Decorator system (@Controller, @Get, @Post, @Validate, registerController)
- [x] `ValidationErrorCode` + `AuthErrorCode` enums in shared
- [x] `ApiError` class in @namorix/core
- [x] Frontend auth.controller.ts (controller pattern)
- [x] Register page with client-side validation + API connection
- [x] Login page with client-side validation + API connection
- [x] i18n layering (core namespace + frontend translation namespace)
- [x] ValidationRunner (fluent client-side validation)
- [x] formatApiError / formatValidationError / formatAuthError
- [x] CSRF double-submit protection (csf token cookie + header validation)
- [x] Async isAuthenticated (calls /api/auth/session instead of document.cookie)
- [x] HttpHeader moved from @namorix/core to @namorix/shared
- [x] backend-core tsconfig.json
- [x] Frontend fingerprint generation (B1): `packages/core/src/fingerprint/` with `FingerprintComponents` interface + `generateFingerprint()` + SHA-256 hash (base64 fallback)
- [x] Backend fingerprint verification on refresh (B2): Option C balanced — revoke if both fingerprint AND IP changed; allow if only fingerprint changed
- [x] Trust proxy + getClientIP() (CF → X-Forwarded-For → X-Real-IP → X-Client-IP → True-Client-IP)
- [x] Secure cookie flag (SECURE_COOKIE env var, replaces COOKIE_SECURE)
- [x] eslint config + lint scripts across all packages (strictTypeChecked)
- [ ] Vitest tests for auth.service (no test files exist yet)

### M3 — System Addons (Built-in)
**Status:** Desktop Shell UI ✅ + Addon System ✅ + NetworkTraffic Phase 1 ✅ + Settings Addon ✅

- [x] Desktop shell UI (taskbar, launcher, desktop area)
- [x] Zustand stores (windows, launcher, geometry, taskbarRect)
- [x] WindowManager + WindowFrame (drag, resize, minimize, maximize)
- [x] Addon contract trong `@namorix/core` (AddonEntry, NmxAddonManifest, AddonContext)
- [x] Frontend addon registry (registerAddon, resolveAddon, listAddons)
- [x] WindowFrame addon mounting (useEffect + registry)
- [x] Launcher + DesktopArea dùng listAddons() từ registry
- [x] Internal addon: Log Viewer (LogViewer component + mount/unmount lifecycle)
- [x] Internal addon: About (About Namorix — version, meta, GitHub links)
- [x] Theme system: types (`@namorix/core`), theme loader/registry (frontend), backend theme repository API
- [x] **Zustand → Redux migration** (4 stores → 3 slices, normalized state, memoized selectors, 10 component files rewritten)
- [x] **NetworkTraffic backend Phase 1** — models, middleware, service, controller, workers, DI
- [ ] Internal addon: Terminal
- [x] Internal addon: Settings (includes theme picker UI)

### M4 — External Addon System (Docker)
**Status:** Not Started

- Dùng chung contract với internal addon (AddonEntry, NmxAddonManifest)
- External addon load động qua `import()` từ Docker container
- Khác biệt: handshake token auth, EventBus sandbox, Docker lifecycle

### M5 — @namorix/core npm Publishing
**Status:** Not Started

## Known Issues

- Vitest tests for auth.service listed in M2 but no test files exist
- i18n `vi.json` locale contains keys but translations are English — partially resolved: appearance settings now have Vietnamese translations
- `addonInstalls` table documented but not yet in schema (only 3 of 4 tables)
- `frontend/src/components/index.ts` only exports AuthPage

## Current Version

| Package | Version | Milestone |
|---------|---------|-----------|
| frontend | 0.43.1 | M3 (Remove freezePanelSize, addons reorder) |
| @namorix/core | 0.34.1 | M3 (useDoubleTap hook, apiRoutes deleteRead) |
| @namorix/styles | 0.30.2 | M3 (Wallpaper CSS var, shadow tweaks, remove dark icons) |
| @namorix/ui | 0.21.6 | M3 (New NmxIconFontSymbol entries) |
| Namorix.Core | 0.36.3 | M3 (LogCleanupWorker — cleanup logs sau 7 ngày) |
| Namorix.Server | 0.36.3 | M3 (DeleteRead endpoint + service) |

## Version Rules

### Per-Package Versioning
- Each package tracks its own version independently
- Version reflects **when that package's deliverables change**, not project-wide milestones

### Version Bump Triggers

| Package | Bump Patch when | Bump Minor when |
|---------|----------------|-----------------|
| frontend | Bug fixes, CSS tweaks | New pages, routing changes, auth flow, i18n |
| @namorix/core | Bug fixes | New type, new module, breaking change |
| @namorix/styles | Token fixes | New token, new variable, new export |
| @namorix/ui | Bug fixes | New component, component breaking change |
| Namorix.Core | Bug fixes, internal refactor | New public API, new module, breaking change |
| Namorix.Server | Bug fixes, config tweaks | New endpoint, new middleware, auth feature |

**Quan trọng — backend version độc lập:**
- `Namorix.Core/` files → bump **Namorix.Core** chỉ
- `Namorix.Adapters/` files → bump **Namorix.Server** (Adapters không có version riêng)
- `Namorix.Server/` files → bump **Namorix.Server** chỉ
- `Namorix.Workers/` files → bump **Namorix.Server**
- Không bao giờ bump cả Core + Server cùng lúc nếu chỉ 1 trong 2 thay đổi

## Version History

Xem chi tiết tại:
- [versionHistory-06-2026.md](versionHistory-06-2026.md) — June 2026
- [versionHistory-05-2026.md](../archive/versionHistory-05-2026.md) — May 2026

