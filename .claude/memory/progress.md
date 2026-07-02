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
- [ ] Internal addon: File Manager (scaffold)
- [ ] Internal addon: Terminal (scaffold)
- [ ] Internal addon: Package Center (scaffold)
- [x] Internal addon: Settings (includes theme picker UI)

### M4 — External Addon System (Docker)
**Status:** Phase 1-5 ✅ + DockerMonitor refactoring ✅

- [x] Docker integration (DockerService, AddonService, DockerMonitorWorker, SignalR notifier)
- [x] OAuth2 authorization code flow (models, service, controller, middleware)
- [x] Backend Addon REST API (CRUD install/start/stop/remove)
- [x] Frontend core changes (types, API routes, addon controller, externalAddonEntry service, Redux slice)
- [x] Addon container lifecycle monitoring + SignalR status push
- [x] Phase 5: useAddonEvents hook (SignalR frontend integration)
- [x] Docker dev/prod setup (Dockerfile.dev, Dockerfile.prod, docker-compose.yml)
- [x] Federation config fix (@module-federation/vite, externalAddonEntry federation API)
- [x] namorix-weave external addon test (Hello World trên desktop ✅)
- [x] PackageCenter UI component (addon manager page — Rail+Grid+Card với All/Installed/Updated tabs)
- [ ] OAuth2 private_key_jwt full implementation (RSA key pair gen, client_assertion verify)

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
| frontend | 0.51.0 | M4 (AddonGrid stats/optimistic pending, AddonEventWatcher active, i18n status keys) |
| @namorix/core | 0.40.0 | M4 (AddonStatusPayload, starting status, deferred SignalR registration) |
| @namorix/styles | 0.35.0 | M4 (package-center stats block, rail flex fix) |
| @namorix/ui | 0.25.0 | M4 (NmxSpinner, NmxLoadingOverlay rename) |
| Namorix.Core | 0.41.0 | M4 (New error codes, AddonInstallation fields, extensions refactor) |
| Namorix.Server | 0.44.0 | M4 (AddonTaskExecutor full impl, AddonTaskPending constants, SetTaskPending) |

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

### 2026-07-02 — Backend task queue, SignalR event fix, global addon events, AddonGrid refactor, NmxSpinner

- @namorix/core 0.38.0 → 0.39.0: NEW: `http/error.ts`, `utils/markup.ts`, `utils/semver.ts`. MODIFIED: `addon/types.ts` — `AddonModule.globalComponent` field. `addon/factory.tsx` — `defineAddon` extended with `globalComponent` param. MODIFIED: `http/apiError.ts` — `fromResponse` fallback (`data.error ?? data.code`). `http/client.ts` — unauthorized flow với `apiAuthError` return. `signalr/signalr.service.ts` — `intentionalStop` flag, `hasBeenConnected` reset trong `stopConnection()`. `signalr/useSignalREvent.ts` — useRef cho handler, deps `[eventName]` only. `toast/` — error handling improvements. `types/error.ts` — new auth error types.
- @namorix/styles 0.33.1 → 0.34.0: NEW: `base/components/spinner.scss`. MODIFIED: `base/components/index.scss` — spinner + loading-overlay. `base/components/loading.scss` → `loading-overlay.scss`. Icomoon rebuild (fonts.scss, variables.scss) — new icon symbols. `base/shell/addon/package-center.scss` — AddonGrid layout refactor. Theme CSS rebuilt.
- @namorix/ui 0.24.1 → 0.25.0: NEW: `Primitives/NmxSpinner.tsx`. MODIFIED: `Primitives/NmxLoading.tsx` → `Components/NmxLoadingOverlay.tsx`. `Primitives/NmxIcon/NmxIconFont.types.ts` — new icon type symbols. `Components/index.ts`, `Primitives/index.ts` — updated exports.
- frontend 0.49.1 → 0.50.0: NEW: `PackageCenter/AddonEventWatcher.tsx` — global SignalR handler for addon status. `PackageCenter/addonError.ts`. `constants/` directory. MODIFIED: `Root.tsx` — global addon component mounting. `App.tsx` — unauthorized handler: `setHasBeenConnected(false)`, `stopConnection()`, navigate login. `registry.ts` — `listGlobalComponents()`. `PackageCenter/PackageCenter.addon.tsx` — passes `AddonEventWatcher` as `globalComponent`. `PackageCenter/AddonGrid.tsx` — 307-line refactor. `controllers/addon.controller.ts` — addon API changes. `hooks/useAddonEvents.ts` — updated. `i18n/locales/en.json` — new addon i18n keys (24 lines). `utils/notification.ts` — cleanup.
- Namorix.Core 0.40.0 → 0.41.0: MODIFIED: `Constants/Error.cs` — new error codes. `Controllers/LogController.cs` — changes. `Extensions/ApplicationBuilderExtensions.cs` — refactored. `Models/AddonInstallation.cs` — new fields (`PendingTaskId`, `LastStatusChangedAt`). `Services/TrafficMonitorService.cs` — changes.
- Namorix.Server 0.42.1 → 0.43.0: NEW: `Models/AddonTask.cs`. `Services/AddonTaskExecutor.cs` — async task executor with concurrent worker limit. `Services/AddonTaskQueue.cs` — Channel-based async queue. `Migrations/20260702075451_AddTaskFields.*` — new migration. MODIFIED: `Constants/Addon.cs` — new constants. `Constants/ServerSignalR.cs` — `AddonStatusChanged` event. `Controllers/AddonController.cs` — task enqueue endpoints, `SetTaskPending` with status. `Extensions/ApplicationBuilderExtensions.cs` — DI registration for task services. `Middleware/OAuth2Middleware.cs` — fixes. `Program.cs` — DI setup. `Services/DockerService.cs` — DockerClient extensions. `Services/AddonService.cs` — removed dead methods (Install/Uninstall/Start/Stop). `Workers/DockerMonitorWorker.cs` — startup PendingTaskId cleanup in `SyncAllContainersAsync`.

### 2026-07-02 (2) — AddonTaskExecutor full impl, useSignalREvent deferred registration, AddonGrid stats/optimistic pending

- @namorix/core 0.39.0 → 0.40.0: MODIFIED: `addon/types.ts` — new `AddonStatusPayload` interface, `"starting"` added to `AddonContainerStatus` union. `signalr/useSignalREvent.ts` — deferred registration via `addStatusHandler`/`removeStatusHandler` when connection not ready; removed console.log.
- @namorix/styles 0.34.0 → 0.35.0: MODIFIED: `package-center.scss` — `__stats` block (centered summary text), `flex: 1` on rail, smaller placeholder font.
- frontend 0.50.0 → 0.51.0: MODIFIED: `PackageCenter/AddonGrid.tsx` — stats bar (total/running/stopped), handleStart returns Promise with optimistic pending state, installed-first alphabetical sort, updated tab filters by `hasUpdate`, uninstall action rename. MODIFIED: `PackageCenter/AddonEventWatcher.tsx` — uses `AddonStatusPayload`, removed console.log, `useServerSignalREvent` uncommented (now active). REMOVED: `hooks/useAddonEvents.ts` (dead commented code). MODIFIED: `pages/Desktop.tsx` — removed `useAddonEvents` call. MODIFIED: `store/slices/externalAddonsSlice.ts` — `AddonStatusPayload` type for `updateAddonStatus`. MODIFIED: `i18n/locales/en.json` — new `stats` key, `starting`/`stopping` tab labels.
- Namorix.Server 0.43.0 → 0.44.0: MODIFIED: `Constants/Addon.cs` — extracted `AddonTaskPending` class from `AddonStatus`. MODIFIED: `Services/AddonTaskExecutor.cs` — `StartAsync`/`StopAsync`/`UninstallAsync` full implementation with Docker calls + `SetStatusAsync` with `ExecuteUpdateAsync` (clears `PendingTaskId`). MODIFIED: `Controllers/AddonController.cs` — `SetTaskPending` calls with `AddonTaskPending.{Starting,Stopping,Uninstalling}`. `AddonStatus.Uninstalling` → `AddonTaskPending.Uninstalling`.

### 2026-06-30 — displayName→name refactor, PackageCenter, Description/Author labels

- @namorix/core 0.36.0 → 0.37.0: MODIFIED: `addon/types.ts` — `displayName`→`name`, `nmxStore` optional, `ExternalAddonManifest`, `AddonContext` updated.
- @namorix/styles 0.31.5 → 0.32.0: MODIFIED: Icomoon rebuild, `tokens/icons.scss` — new icon symbols. NEW: `shell/addon/package-center.scss`.
- @namorix/ui 0.22.4 → 0.23.0: MODIFIED: `NmxIconFont.types.ts`, `NmxIconSvg.types.ts` — new icon type symbols.
- frontend 0.47.0 → 0.48.0: MODIFIED: All 8 builtin addon manifests (`displayName`→`name`). `PackageCenter.tsx` — full Rail+Grid+Card refactor. `DesktopIcon.tsx`, `LauncherView.tsx`, `useLauncherSearch.ts`, `WindowFrameView.tsx`, `taskbarSelectors.ts` — `displayName`→`name`. `controllers/addon.controller.ts` — DTO/request fields. `i18n/locales/en.json` — new PackageCenter keys.
- Namorix.Core 0.38.0 → 0.39.0: MODIFIED: `Models/AddonManifest.cs` — `DisplayName`→`Name`, `Description`/`Author` set accessor.
- Namorix.Server 0.40.0 → 0.41.0: MODIFIED: `Constants/Addon.cs` — thêm `Description`, `Author` constants. `Services/AddonService.cs` — `DisplayName`→`Name`. `Workers/DockerMonitorWorker.cs` — Description/Author label reading trong auto-discover + SyncExisting.

### 2026-06-30 (2) — Addon catalog sync system, NmxIconSvg URL support, NmxGrid cols fix, AddonManifest→AddonInstallation

- @namorix/core 0.37.0 → 0.38.0: MODIFIED: `addon/types.ts` — AddonCatalogEntry type. `apiRoutes.ts` — catalog API routes. NEW: `NmxIconSvg src` prop for external URL icon loading.
- @namorix/styles 0.32.0 → 0.33.0: MODIFIED: `components/icon/icon-svg.scss` — `.symbol` class with `background-image` support for external icon URLs. Theme CSS rebuilt.
- @namorix/ui 0.23.0 → 0.24.0: MODIFIED: `NmxIconSvg.tsx` — added `src` prop, renders `<img>` with fallback to SVG symbol on error. `NmxGrid.tsx` — cols fix: numeric `cols` uses `repeat(N, 1fr)` instead of `auto-fit`.
- frontend 0.48.0 → 0.49.0: NEW: `AddonGrid.tsx` — catalog+installed merge grid for PackageCenter. MODIFIED: `PackageCenter.tsx` — catalog tab integration, refresh button. `en.json` — catalog loading/empty i18n keys.
- Namorix.Core 0.39.0 → 0.40.0: NEW: `Config/AddonCatalogConfig.cs` — CatalogUrl, TtlSeconds, SyncIntervalSeconds, RetryDelaySeconds. `Models/AddonInstallation.cs` — model rename from AddonManifest (via migration).
- Namorix.Server 0.41.0 → 0.42.0: NEW: `Workers/CatalogSyncWorker.cs` — dual-delay background sync (success=SyncInterval, failure=RetryDelay). `Services/CatalogService.cs` — catalog index fetch + manifest sync + TTL check. `Models/AddonCatalogEntry.cs` — DB entity for catalog cache. `Models/Catalog/CatalogIndex.cs` — DTOs. MODIFIED: `Controllers/AddonController.cs` — GET /api/addons/catalog, POST /api/addons/catalog/sync. `Program.cs` — AddonCatalogConfig DI, CatalogService HttpClient, CatalogSyncWorker hosted service. `Services/AddonService.cs` — GetCatalogAsync, RefreshCatalogAsync. `Persistence/AppDbContext.cs` — AddonInstallations rename. `Workers/DockerMonitorWorker.cs` — AddonManifest→AddonInstallation. `Services/OAuthService.cs` — AddonManifest→AddonInstallation.

### 2026-06-14
- @namorix/styles 0.31.0 → 0.31.1: DiskUsage container queries `.nmx-disk-item__name`, settings hardcoded 580px → variable
- @namorix/ui 0.22.1 → 0.22.2: NmxStatCard canvas resolution fix (getBoundingClientRect → clientWidth/clientHeight)
- Namorix.Server 0.37.1 → 0.37.2: SystemStatsWorker rename → SystemMonitorStatsWorker, DriveType/overlay filter, Namorix.Workers project removal

### 2026-06-14 (2) — NmxStatCard threshold refactor, disk-usage CSS Grid
- @namorix/ui 0.22.2 → 0.22.3: NmxStatCard thresholdCurrent/thresholdTotal props. resolvedColor tính % từ `current/total*100` thay vì parseFloat(value).
- @namorix/styles 0.31.1 → 0.31.2: DiskUsage flex + container queries → CSS Grid (display: contents, grid-template-columns). Xoá @container queries.
- frontend 0.44.1 → 0.44.2: SystemMonitor — CPU, CPU process, Memory, Process Memory dùng thresholdCurrent/thresholdTotal. en.json: processMemoryDescription bỏ `of {{total}}`.

### 2026-06-14 (3) — Appearance 3-layer cascade fix
- frontend 0.44.2 → 0.44.3: `auth.controller.ts` — `loadAppearance()` gọi song song `GET /api/settings/appearance` (system defaults) + `GET /api/user/settings` (user overrides), merge đúng 3-layer (`AppearanceDefaults ← sysRes ← userRes`). Xoá `loadAppearanceSystem()`. `useAppearanceSync.ts` — dùng `authController.loadAppearance()` cho mọi case.

### 2026-06-21 (2) — M4 External Addon System Phase 1-4 (Backend Docker + OAuth2, Frontend Core)

- @namorix/core 0.35.1 → 0.36.0: MODIFIED: `addon/types.ts` — ExternalAddonManifest, AddonContainerStatus, InstallAddonRequest. `apiRoutes.ts` — ApiAddonRoutes.
- frontend 0.44.4 → 0.45.0: NEW: `controllers/addon.controller.ts`, `services/externalAddonEntry.ts`, `store/slices/externalAddonsSlice.ts`. MODIFIED: store/index.ts, slices/index.ts, controllers/index.ts.
- Namorix.Core 0.36.4 → 0.37.0: NEW: `Models/OAuthAuthorizationCode.cs`, `OAuthConsent.cs`, `OAuthToken.cs`. MODIFIED: `Models/AddonManifest.cs` (expanded).
- Namorix.Server 0.38.0 → 0.39.0: NEW: Docker integration (DockerService, AddonService, DockerMonitorWorker, SignalRAddonNotifier, IAddonNotifier). OAuth2 (OAuthService, OAuthController, OAuth2Middleware). AddonController, AddonStatus constants. MODIFIED: Program.cs, AppDbContext, ServerSignalR.

### 2026-06-25 (2) — DockerMonitor refactoring, Docker constants, button/alert dialog fixes

- @namorix/styles 0.31.4 → 0.31.5: MODIFIED: `button.scss` — padding/font-size/font-weight tweaks, class rename `upper-case` → `uppercase`. Theme CSS rebuilt.
- @namorix/ui 0.22.3 → 0.22.4: MODIFIED: `NmxAlertDialog.tsx` — thêm uppercase prop, confirm button semantic → info. `NmxButton.tsx` — class fix `upper-case` → `uppercase`.
- @namorix/core 0.36.0 (no bump): No changes.
- frontend 0.46.0 → 0.47.0: MODIFIED: `PackageCenter.tsx` — uncomment + refactor (190+265 lines). `Desktop.tsx` — xoá external addon test registration. `vite.config.ts` — comment out optimizeDeps. `SettingsAccount.tsx` — button size=sm.
- Namorix.Core 0.37.0 → 0.38.0: NEW: `Constants/Docker.cs` — DockerState, DockerEvent, DockerFilter. MODIFIED: `Models/AddonManifest.cs` — DisplayName, HostPort init-only → get/set (build error fix).
- Namorix.Server 0.39.0 → 0.40.0: MODIFIED: `Constants/Addon.cs` — AddonLabels constants. `Services/DockerService.cs` — Client public (private _client → public Client). `Workers/DockerMonitorWorker.cs` — event stream + health check poll + auto-discover + action-based handling.

### 2026-06-25 — M4 Phase 5: Docker setup, federation config, external addon wiring

- frontend 0.45.0 → 0.46.0: NEW: Docker dev/prod setup (Dockerfile.dev, Dockerfile.prod, docker-compose.yml, .dockerignore). @module-federation/runtime dep. useAddonEvents hook, externalAddonSelectors. MODIFIED: vite.config.ts (federation config, Docker csproj read fix), externalAddonEntry.ts (federation API), Desktop.tsx, main.tsx, signalr/constants.ts. Docker scripts in package.json.
- @namorix/styles 0.31.3 → 0.31.4: MODIFIED: index.scss — `@forward "themes/default"` → `@forward "themes/dark"`.

### 2026-06-21 — Merge Namorix.Adapters into Namorix.Server

- Namorix.Server 0.37.2 → 0.38.0: Merged Persistence (AppDbContext), Services (Auth, User, Settings, Permission, Theme, Notification, UserSettings), Migrations from Adapters. Updated namespaces, csproj packages, solution file.
- Namorix.Core 0.36.3 → 0.36.4: LogEntrySerializer string update, AppearanceOptionsData minor fix.
- @namorix/styles 0.31.2 → 0.31.3: SCSS fixes (split, desktop, window, typography), theme CSS updates.
- frontend 0.44.3 → 0.44.4: DesktopIcon.tsx minor fix.

Xem chi tiết tại:
- [versionHistory-07-2026.md](versionHistory-07-2026.md) — July 2026
- [versionHistory-06-2026.md](versionHistory-06-2026.md) — June 2026
- [versionHistory-05-2026.md](../archive/versionHistory-05-2026.md) — May 2026
