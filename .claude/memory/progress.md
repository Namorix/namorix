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
| frontend | 0.24.0 | M3 (NmxSearchInput, NetworkTraffic search/debounce/onTabChange) |
| @namorix/core | 0.18.1 | M3 (appearance settings i18n keys) |
| @namorix/styles | 0.18.0 | M3 (search-input SCSS, network-traffic container/search styles, tag-input rewrite) |
| @namorix/ui | 0.15.0 | M3 (NmxSearchInput, NmxTabContext generic + onTabChange, NmxFormInput ref) |
| backend | 0.26.0 | M3 (PostgreSQL, search API, Include TrafficAddress) |

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
| backend | Bug fixes, C# config tweaks | New endpoint, new service, auth feature |

## Version History

### 2026-05-23 — NmxSearchInput, PostgreSQL migration, search filter API

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/ui | 0.15.0 | NEW: `NmxSearchInput` — search input primitive with icon + clear button, uses NmxFormInput, `onSubmit` prop. MODIFIED: `NmxTabContext` — `useNmxTabContext<T>()` generic. MODIFIED: `NmxTabProvider` + `NmxToolbar` — `onTabChange` callback. MODIFIED: `NmxTagInput` — rewrite with scroller-wrap + dropdown isolation, full keyboard navigation fix (Arrow Up/Down/Enter/Escape). MODIFIED: `NmxFormInput` — `ref` prop (React 19 pattern). |
| @namorix/styles | 0.18.0 | NEW: `search-input.scss` — `.nmx-search-input` flex layout with icon + clear button. NEW: `network-traffic.scss` — `container-type` for toolbar, toolbar-actions flex override, search container query (260px → 100% at 580px). MODIFIED: `tag-input.scss` — scroller-wrap, dropdown sibling. MODIFIED: `form.scss` — autofill styling. MODIFIED: `launcher.scss` — removed redundant icon/clear classes. Theme CSS rebuilt. |
| frontend | 0.24.0 | NEW: NetworkTraffic search — NmxSearchInput in toolbar-actions, debounce 500ms, filter prop, `onTabChange` clears search on tab switch. NEW: `NmxSearchInput` in Launcher — replaces manual icon + input + clear pattern. MODIFIED: `NetworkTrafficLogs` — `filter` prop, API search param. MODIFIED: `traffic.controller` — `search` param in `listLogs()`. MODIFIED: `LauncherView` — removed search icon + clear button DOM (handled by NmxSearchInput). MODIFIED: `i18n/en.json` — searchPlaceholder key. |
| backend | 0.26.0 | CHANGED: SQLite → PostgreSQL (`Npgsql.EntityFrameworkCore.PostgreSQL`). NEW: `search` param in `GET /api/traffic/logs` — client-side filter (path/method/IP). MODIFIED: `TrafficMonitorService.GetLogs()` — added `Include(l => l.TrafficAddress)`, search filter. MODIFIED: `TrafficMonitorController.GetLogs()` — `search` query param. MODIFIED: `appsettings.json` — PostgreSQL connection string. MODIFIED: `Program.cs` — `UseNpgsql`. NEW: PostgreSQL migrations regen. |

### 2026-05-23 — NmxToolbar ecosystem, NmxTabContext, zOrder, data-table responsive

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/ui | 0.14.0 | NEW: `NmxToolbar/` — NmxToolbar, Header, List, Item, Content, Actions composable toolbar system. NEW: `NmxTabContext` + `NmxTabProvider` — shared tab state for Toolbar/Rail. NEW: `NmxAddonRoot` + `NmxAddonPage` — addon layout wrappers. NEW: `hooks/`, `breakpointDefaults.ts`, `cssVariableCache.ts`. MODIFIED: `NmxRail` — generic `<T>`, NmxTabContext integration. MODIFIED: `NmxDataTable` — responsive columns via hideBelow + ResizeObserver. MODIFIED: `NmxRail.types` — removed activeKey/onActiveTabChange (moved to context). |
| @namorix/styles | 0.17.0 | NEW: `components/toolbar.scss` — full toolbar SCSS (list, item, header, actions, content). NEW: `tokens/breakpoint.scss` — `--nmx-breakpoint-*` CSS vars (sm/md/lg/xl). NEW: `addon.scss` — `.nmx-addon-page` + `__data-table` + `__pagination`. NEW: `tokens.scss` — `--nmx-window-titlebar-height`. MODIFIED: `data-table.scss` — removed bg/border/shadow, header color/font. MODIFIED: `settings.scss` — BEM nesting. |
| frontend | 0.23.0 | REWRITE: `NetworkTraffic` — từ NmxRail → NmxToolbar ecosystem. REFACTOR: `Settings` tabs — từ manual useTabCache → NmxTabContext. MODIFIED: `windowsSlice` — zOrder tách khỏi order (taskbar dùng order, WM dùng zOrder). MODIFIED: `WindowManager` — render theo zOrder. MODIFIED: `windowSelectors` — selectorZOrder + selectorZIndex dùng zOrder. MODIFIED: `windowDefaults` — cleanup -32 dòng. MODIFIED: `Launcher` — minor fix. MODIFIED: `i18n/en.json` — +9 keys. |

### 2026-05-23 — SCSS token cleanup, NmxSettings components, rail container query

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.16.0 | NEW: `components/settings.scss` — NmxSettings component SCSS (section, card, row, accent-picker). NEW: `abstract/variables.scss` — `$nmx-breakpoint-*` (sm:580px, md:800px, lg:1100px, xl:1440px). NEW: `tokens/typography.scss` — `--nmx-letter-spacing-wider`. MODIFIED: `layouts/rail.scss` — container query auto-collapse at 640px. MODIFIED: `components/select.scss`, `slider.scss`, `segmented-group.scss` — removed hardcoded fallback hex/token values. DELETED: `shell/addon/setting.scss` — section/card/row/accent styles moved to settings.scss. MODIFIED: icomoon — new glyphs, theme CSS rebuilt. |
| @namorix/ui | 0.13.0 | NEW: `Components/NmxSettings/` — `NmxSettingsSection`, `NmxSettingsCard`, `NmxSettingsRow`, `NmxAccentColorPicker` composite components. MODIFIED: `NmxRailContent` — ResizeObserver sets `--nmx-rail-content-width/height` CSS vars. MODIFIED: `NmxRail` — container-type + container-name for CSS auto-collapse. MODIFIED: `NmxSelect`, `NmxSlider`, `NmxSegmentedGroup` — token fallback cleanup. NEW icon symbols. |
| frontend | 0.22.0 | MODIFIED: `SettingsAppearance` — refactored to use NmxSettingsSection/Card/Row/AccentColorPicker components. MODIFIED: `useAddonMount` — ResizeObserver sets `--nmx-mount-width/height` CSS vars on mount container. |
| backend | 0.25.1 | FIX: `TrafficMonitorController` — removed duplicate `GET stats` endpoint. |

### 2026-05-22 — Settings Appearance UI with 3 new UI primitives

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/ui | 0.12.0 | NEW: `NmxSelect` — styled native `<select>` primitive (value/defaultValue, options, placeholder, onChange). NEW: `NmxSlider` — range slider primitive (min/max/step, controlled/uncontrolled, showValue). NEW: `NmxSegmentedGroup` — segmented button group (1/N select, controlled/uncontrolled). |
| @namorix/styles | 0.15.0 | NEW: `components/select.scss` — .nmx-select with focus-visible ring, disabled state. NEW: `components/slider.scss` — .nmx-slider (flex row, input range, value label). NEW: `components/segmented-group.scss` — .nmx-segmented-group (flex row, button variants, active state with accent color). MODIFIED: `shell/addon/setting.scss` — added appearance layout styles (section, card, row, theme-grid, theme-card, accent-row classes). MODIFIED: `components/index.scss` — 3 new forwards. |
| @namorix/core | 0.18.1 | MODIFIED: `i18n/locales/en.json` — added `addon.settings.appearance.*` translation keys (20 keys). MODIFIED: `i18n/locales/vi.json` — Vietnamese translations for appearance settings (previously empty). |
| frontend | 0.21.0 | REWRITE: `SettingsAppearance.tsx` — full UI according to mockup with 4 sections (Theme grid + accent color, Layout with slider/toggle/segmented, Typography with select/segmented, Language & Region with 3 selects). Uses new primitives: NmxSelect, NmxSlider, NmxSegmentedGroup. |

### 2026-05-22 — change password, user controller, resolveError, logout button, bug fixes

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.25.0 | NEW: `UserController.PUT "password"` — change password endpoint. NEW: `ChangePasswordSchema` — validation schema (currentPassword required, newPassword required + minLength). NEW: `UserService.ChangePasswordAsync()` — verify current password, hash new password via BCrypt. MODIFIED: `Error.cs` — added `IncorrectPassword` + `PasswordChangeFailed` error codes. |
| @namorix/core | 0.18.0 | NEW: `resolveError()` utility in `validation-messages.ts` — unified error-to-string resolver (ApiError.formatApiError → Error.message → generic key fallback). MODIFIED: `types/error.ts` — added `INCORRECT_PASSWORD`, `PASSWORD_CHANGE_FAILED` to AuthErrorCodes. MODIFIED: `validation-messages.ts` — added resolveAuthError cases for new error codes. MODIFIED: `i18n/locales/en.json` — added `incorrectPassword`, `passwordChangeFailed` translation keys. MODIFIED: `apiRoutes.ts` — password route `API_AUTH_BASE` → `API_USER_BASE`. FIX: `theme/registry.ts` — dedup merged built-in + external themes by id. |
| @namorix/styles | 0.14.2 | MODIFIED: `launcher.scss` — new `__footer` section (border-top separator, `__item--logout` horizontal layout). MODIFIED: `taskbar.scss`, `index.scss`, icon fonts, theme CSS. |
| @namorix/ui | 0.11.2 | FIX: `NmxToggle.tsx` — chỉ pass `defaultChecked` khi `checked` undefined (fix React warning both checked + defaultChecked). |
| frontend | 0.20.0 | NEW: Launcher logout button — `LauncherView` footer với nút logout + icon + label. MODIFIED: `auth.controller.ts` — `stopConnection` flag `isLoggingOut` trong nmxStore để tránh `Blocked` popup khi intentional logout. MODIFIED: `App.tsx` — onCloseHandler check `nmxStore.get("isLoggingOut")`, skip setBlocked khi intentional. MODIFIED: `SettingsAccount.tsx` — refactored to use `settingsController.changePassword()` + `resolveError()` catch pattern, removed direct nmxHttp. MODIFIED: `settings.controller.ts` — added `changePassword()` method. MOVED: password route from `ApiAuthRoutes.password` (`/api/auth/password`) → `ApiUserRoutes.password` (`/api/user/password`). |

### 2026-05-21 (Settings addon: full 3 tabs, NmxTagInput, themeStore, controllers; NetworkTraffic Logs/Threats)

### 2026-05-22 — SignalR error handling, loading overlay, settings register toggle, maximize fix

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.16.0 | NEW: `signalr/useSignalRStatus.ts` — status observer hook. NEW: `types/user.ts` — UserRole constants (Admin=1, User=0). MODIFIED: `signalr/signalr.service.ts` — status event system (addStatusHandler/removeStatusHandler), emit on reconnecting/reconnected/close, addOnCloseHandler/removeOnCloseHandler. MODIFIED: `useSignalR.ts` — refactored status tracking. MODIFIED: `apiRoutes.ts` — ApiSettingsRoutes.register. MODIFIED: `types/error.ts` — HttpErrorCodes.CONNECTION_LOST. MODIFIED: `i18n/validation-runner.ts` — CURRENT_PASSWORD, NEW_PASSWORD. MODIFIED: `i18n/locales/en.json` — common.fields (currentPassword, newPassword), user.role. |
| @namorix/ui | 0.11.0 | NEW: `NmxLoading` primitive — full-screen loading overlay with spinner, two modes (solid bg / transparent overlay), CSS spin animation. MODIFIED: `NmxIconFont.types.ts` — LINK icon symbol. MODIFIED: `NmxToggle.tsx` — checked prop fix. MODIFIED: `NmxInlineAlert.tsx` — refactor. |
| @namorix/styles | 0.14.0 | NEW: `components/loading.scss` — NmxLoading SCSS (spin animation, overlay/solid modes). NEW: `shell/addon/setting.scss` — profile header, avatar, meta styles. MODIFIED: `shell/components/taskbar.scss` — tray signal icon (nmx-taskbar__signal with connected/disconnected/reconnecting states + blink keyframe). MODIFIED: `shell/components/blocked.scss` — refresh button styles. MODIFIED: icomoon fonts, spacing/typography tokens. |
| frontend | 0.18.0 | NEW: App.tsx — SignalR `addOnCloseHandler` + heartbeat ping (5s health check when disconnected), NmxLoading wrapper for initial load + reconnect overlay. NEW: Blocked.tsx — refresh button (`window.location.reload()`). NEW: Taskbar/TaskbarView — SignalR status icon in tray (LINK icon, color-coded: green connected, yellow blink reconnecting, red disconnected). NEW: `useAuthForm.ts` — refactored to object alert pattern `{ semantic, message } \| null`. NEW: `settings.controller.ts` — consolidated `getAll()`/`setAll()`. MODIFIED: SettingsSystem.tsx — register toggle, single API call for all settings. MODIFIED: SettingsAccount.tsx — profile header (avatar + username/role), validate() chain for change password. MODIFIED: WindowFrameView.tsx — maximize height fix `calc(100vh - var(--nmx-taskbar-height))`. MODIFIED: Login.tsx, Register.tsx — adapted to new useAuthForm pattern. MODIFIED: i18n/en.json — settings system saved/saveFailed keys, blocked refresh key. |
| backend | 0.24.0 | NEW: SettingsController — `GET /api/settings` + `PUT /api/settings` (consolidated all settings), `GET /api/settings/register` + `PUT /api/settings/register`. MODIFIED: SettingsService — `GetAllAsync()`, `SetAllAsync()`, `SetListAsync` cache fix (`memoryCache.Remove` thay `memoryCache.Set` để tránh InvalidCastException string→List). |

### 2026-05-22 — nmxStore, admin role filtering, mobile support, launcher overflow fix

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.17.0 | NEW: `store/` module — nmxStore observable singleton (get/set/subscribe), useNmxStore hook, accessors (useUserStore, setThemeStore, useRegisterEnabledStore), initStores auto-init. NEW: `utils/isMobile.ts` — user agent + viewport detection. MODIFIED: `addon/types.ts` — AddonContext now passes nmxStore, removed locale/theme; NmxAddonManifest added optional role field. MODIFIED: `auth/auth.service.ts` — auto-populate user + registerEnabled into nmxStore. MODIFIED: `index.ts` — barrel export store. MODIFIED: `theme/index.ts` — removed themeStore export. DELETED: `providers/ThemeProvider.tsx`, `theme/themeStore.ts` (replaced by nmxStore accessors). |
| @namorix/styles | 0.14.1 | FIX: `launcher.scss` — overflow on mobile (left+right spacing thay left:0). MODIFIED: `data-table.scss`, `rail.scss`. |
| @namorix/ui | 0.11.1 | FIX: `canvas.ts` — sparkline fixes. FIX: `NmxRail.tsx` — layout fixes. FIX: `NmxStatCard.tsx`. |
| frontend | 0.19.0 | NEW: Admin role-based addon filtering — `listAddons()` accepts userRole param, launcher + desktop filter by user role. NEW: Mobile support — isMobile() auto-maximizes windows, hides maximize button in titlebar. NEW: Settings system tab — admin-only via useUserStore + filter. MODIFIED: `registry.ts` — role filter. MODIFIED: `useLauncherSearch.ts`, `DesktopArea.tsx` — pass user role. MODIFIED: `WindowFrameView.tsx`, `WindowTitleBar.tsx` — mobile hide maximize. MODIFIED: `useOpenWindow.ts` — mobile auto-maximize. MODIFIED: `Root.tsx` — removed ThemeProvider. MODIFIED: `Login.tsx` — useRegisterEnabledStore. MODIFIED: `useAddonMount.ts` — pass nmxStore to addon context. |
| backend | 0.24.1 | FIX: `NmxHub.cs` — SubscribeTraffic admin role check dùng `FindFirst(JwtClaims.Role)` thay `IsInRole()` (custom int claim). FIX: `NmxHubFilter.cs` — let HubException pass through (không catch generic). |

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.15.0 | NEW: `theme/themeStore.ts` — module-level singleton for cross-root theme state with get/set/subscribe. NEW: `useThemeStore()` hook. NEW: `ApiSettingsRoutes` (proxies, origins). NEW: `ApiUserRoutes.password`. MODIFIED: `ThemeProvider.tsx` — refactored to use themeStore for state management (broadcast via `themeStore.set()`). MODIFIED: `apiRoutes.ts` — added settings routes, fixed theme route. |
| @namorix/ui | 0.10.0 | NEW: `NmxTagInput` primitive — controlled tag input with keyboard shortcuts (Enter/Tab/comma to create, Backspace to remove last, Escape to close dropdown), dropdown suggestions with "Create" fallback. MODIFIED: `NmxIconFont.types.ts` — added APPEARANCE, SETTING, USER icon symbols. |
| @namorix/styles | 0.13.0 | NEW: `components/tag-input.scss` — flexbox wrap container, inline tag chips, remove button, absolute dropdown. NEW: `components/addon.scss` — Settings addon styles (theme-item, theme-list, list-item). MODIFIED: `icomoon` — new glyphs for settings icons. MODIFIED: `spacing.scss` — token updates. |
| frontend | 0.17.0 | NEW: Settings addon — NmxRail + 3 tabs (Appearance with theme picker + themeStore, System with NmxForm + NmxTagInput for proxies/origins, Account with user info + change password form). NEW: `settings.controller.ts` — getProxies, setProxies, getOrigins, setOrigins. NEW: `NetworkTrafficLogs.tsx` — NmxDataTable with pagination. NEW: `NetworkTrafficThreats.tsx` — placeholder. NEW: `utils.ts` — helper functions. MODIFIED: `Settings.tsx` — replaced mock with NmxRail layout. MODIFIED: `NetworkTraffic.tsx` — wire logs tab. MODIFIED: `traffic.controller.ts` — listLogs pagination. MODIFIED: `en.json` — settings + network traffic i18n keys. |
| backend | 0.23.1 | FIX: `TrafficAddress.cs` — removed cyclic reference (ICollection\<TrafficLog\>). MODIFIED: `TrafficMonitorService.cs` — minor fix. DELETED: old migration `20260519154427_InitialCreate`. NEW: migration `20260521134753_InitialCreate` (regenerated). |

### 2026-05-21 (SignalR backend: Hubs, notifiers, topic broadcasting)

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.21.0 | NEW: `Hubs/NmxHub.cs` — auth check, SubscribeTraffic/UnsubscribeTraffic. NEW: `Hubs/SignalRTrafficNotifier.cs` — ITrafficNotifier implement, broadcast to "traffic" group. NEW: `Hubs/SignalRSystemNotifier.cs` — ISystemNotifier implement, broadcast system:config-changed. NEW: `Core/Infrastructure/ITrafficNotifier.cs` + `ISystemNotifier.cs` — interfaces. NEW: `Core/Infrastructure/SignalREvents.cs` — typed records (TrafficLogsFlushed, ConfigChanged, ThemeChanged). NEW: `Core/Constants/SignalR.cs` — SignalGroups + SignalEvents constants. MODIFIED: `Program.cs` — AddSignalR, MapHub, DI for both notifiers. MODIFIED: `AuthMiddleware.cs` — added ClaimTypes.NameIdentifier (SignalR user mapping). MODIFIED: `CsrfMiddleware.cs` — skip /hubs path. MODIFIED: `SettingsService.cs` — inject ISystemNotifier, broadcast on SetRegisterEnabled. MODIFIED: `TrafficFlushWorker.cs` — resolve ITrafficNotifier from scope, notify after flush. MODIFIED: `UserController.cs` — inject IHubContext, broadcast user:theme-changed per user. MODIFIED: `TrafficMonitorController.cs` — removed `[TrafficMonitor]`. |
| frontend | 0.14.1 | FIX: NetworkTraffic.tsx — removed unused `useState` import. |
| @namorix/styles | 0.12.1 | MODIFIED: rail.scss, network-traffic.scss, index.scss, theme CSS — cleanup. |

### 2026-05-21 (SignalR frontend integration: core signalr module, event-driven traffic, middleware fixes)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.14.0 | NEW: `signalr/` module — `signalr.service.ts` (connection singleton, start/stop/state), `useSignalR.ts` (connection lifecycle hook), `useSignalREvent.ts` (typed event subscription hook), `useSignalRGroup.ts` (group subscribe/unsubscribe with reconnect), `constants.ts` (SignalRGroups, SignalREvent, typed payloads), `utils.ts` (capitalize, groupMethod). MODIFIED: `apiRoutes.ts` — added `HUB_MAIN`. MODIFIED: `index.ts` — barrel export. |
| frontend | 0.15.0 | NEW: `vite.config.ts` — `/hubs` proxy with WebSocket support. NEW: `package.json` — `@microsoft/signalr` dependency. NEW: `Desktop.tsx` — `useSignalR(true)` on mount. NEW: `auth.controller.ts` — `stopConnection()` on logout. NEW: `useTrafficGroup.ts` — SignalR traffic group subscription. MODIFIED: `useTrafficStatsPolling.ts` — replaced 5s REST polling with event-driven `traffic:new-logs`. |
| backend | 0.22.0 | NEW: `Core/Constants/SignalR.cs` — `SignalRPaths` (HubPrefix, HubMain). MODIFIED: `ITrafficNotifier.cs` — removed `int count` param from `NotifyFlushAsync`. MODIFIED: `SignalREvents.cs` — `TrafficLogsFlushed` changed from `int Count` to full stats record. MODIFIED: `SignalRTrafficNotifier.cs` — inject `TrafficMonitorService`, push aggregate stats. MODIFIED: `TrafficMonitorMiddleware.cs` — skip `/hubs` (fix sync write crash). MODIFIED: `CsrfMiddleware.cs` — use `SignalRPaths.HubPrefix`. MODIFIED: `Program.cs` — use `SignalRPaths.HubMain`. MODIFIED: `TrafficFlushWorker.cs` — `NotifyFlushAsync()` no param. |

### 2026-05-21 (SignalR refinements: hub filter, rate limit partition, sparkline fix, auth cache)

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.22.1 | NEW: `Hubs/NmxHubFilter.cs` — IHubFilter for centralized error handling. MODIFIED: `Program.cs` — AddFilter, EnableDetailedErrors, rate limiter policy partition (skip `/hubs`). MODIFIED: `NmxHub.cs` — hub tweaks. MODIFIED: `TrafficFlushWorker.cs`, `SignalRTrafficNotifier.cs` — cleanup. |
| @namorix/core | 0.14.1 | MODIFIED: `auth/auth.service.ts` — added cache for `getAuthStatus()`. |
| @namorix/ui | 0.9.1 | FIX: `canvas.ts` — sparkline 1-data-point NaN x coordinate. FIX: `NmxStatCard.tsx` — semantic color resolves from prop, not CSS variable. MODIFIED: `cx.ts` — utility updates. |
| @namorix/styles | 0.12.2 | MODIFIED: `auth.scss` — minor fix. |
| frontend | 0.15.1 | FIX: `auth.controller.ts` — stopConnection on logout. FIX: `Login.tsx`, `Register.tsx` — page refinements. FIX: `main.tsx` — updates. DELETED: `traffic.controller.ts` (dead code, replaced by SignalR). MODIFIED: `NetworkTrafficOverview.tsx` — signalr event-driven stats. |

### 2026-05-21 (TrafficMonitorAttribute redesign: TrafficX attributes, middleware refactor, auto-disable register)

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.23.0 | NEW: `Core/Attributes/TrafficMonitorAttribute.cs` — TrafficGet/Post/Put/Delete/Patch attributes extending HttpMethodAttribute with Label. MODIFIED: `Server/Extensions/ApplicationBuilderExtensions.cs` — UseTrafficMonitorAsync only scans TrafficX attributes (Label property), removes old [TrafficMonitor] fallback scan. MODIFIED: `Controllers/AuthController.cs` — replace [HttpX] with [TrafficX], auto-disable register after first admin registration. DELETED: 7 controllers — removed [TrafficMonitor] class-level attribute. DELETED: `Hubs/NmxHub.cs` — unused using. |
| frontend | 0.16.0 | NEW: `NetworkTrafficEndpoints.tsx` — NmxDataTable-based endpoints tab. MODIFIED: `NetworkTraffic.tsx` — wire endpoints tab with isMounted + Show. MODIFIED: `traffic.controller.ts` — added listEndpoints(). MODIFIED: `i18n/en.json` — endpoints tab keys. |
| @namorix/ui | 0.9.2 | MODIFIED: `NmxBadge.tsx` — added bgEnabled prop. MODIFIED: `NmxDataTable.tsx` + `NmxDataTable.type.ts` — added disableEllipsisHeader, disableEllipsisCell props, CSS class rename. |
| @namorix/styles | 0.12.3 | MODIFIED: badge.scss, data-table.scss, network-traffic.scss, index.scss — SCSS tweaks. |
| @namorix/core | 0.14.2 | NEW: `constants.ts` — HttpMethods object + HttpMethod type. |

### 2026-05-21 (cache module: useTabCache, Show component, NetworkTraffic refactor)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.13.0 | NEW: `cache/` module — `useTabCache()` hook (lazy mount + CSS hide + idle unmount via useReducer), `Show` component (render when `when` prop is true, hidden otherwise). MODIFIED: `index.ts` barrel — exports cache module. |
| frontend | 0.14.0 | REFACTOR: NetworkTraffic addon — dùng `useTabCache` + `Show` thay manual `useState` + conditional render. i18n: thêm `addon.networkTraffic.overview.title` key. |

### 2026-05-21 (defineAddon factory, addon context, Desktop defocus fix)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.12.0 | NEW: `factory.tsx` — `defineAddon()` factory (createRoot + mount + unmount boilerplate). NEW: `context.tsx` — `AddonContextProvider`, `useAddonContext()` hook. MODIFIED: `index.ts` barrel — exports factory + context. DELETED: `NmxAddonBase.ts` (replaced by defineAddon). |
| frontend | 0.13.2 | FIX: Desktop.tsx defocus handler — exclude `.nmx-taskbar__app-btn` để cho phép minimize toggle. REFACTOR: 4 addon files (LogViewer, NetworkTraffic, Settings, SystemMonitor) → dùng `defineAddon()`. |

### 2026-05-20 (NmxStatCard, NmxGrid, canvas sparkline, traffic controller + polling)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.11.0 | NEW: ApiTrafficRoutes (base, endpoints, logs, stats). NEW: http.query() method on RequestBuilder. |
| @namorix/styles | 0.12.0 | NEW: stat-card.scss component (nmx-stat-card with BEM elements). NEW: grid.scss layout (nmx-grid with auto-fit). NEW: shell/addon/ SCSS (network-traffic.scss, addon content override). NEW: spacings mixin for gap modifier classes. MODIFIED: maps.scss, mixins.scss, components/index.scss, layouts/index.scss, rail.scss. REBUILT: theme CSS. |
| @namorix/ui | 0.9.0 | NEW: NmxStatCard primitive (value, label, unit, trend, sparkData + canvas sparkline). NEW: NmxGrid layout (cols, minColWidth, gap with semantic props). NEW: canvas.ts — drawSparkline utility (HiDPI, ResizeObserver, gradient fill). NEW: cxSpacing helper. NEW: NmxSpacing type. MODIFIED: Primitives/index.ts, utils/index.ts, index.ts barrel, types/primitives.ts. |
| frontend | 0.13.1 | NEW: traffic.controller.ts (getStats, TrafficStats/TrafficLog/TrafficEndpoint types). NEW: useTrafficStatsPolling hook (30s polling, rolling 20pt history). NEW: NetworkTrafficOverviewTab → NetworkTrafficOverview with NmxStatCard + NmxGrid stats row. MODIFIED: i18n/en.json — network traffic overview labels. |

### 2026-05-20 (NmxRail + NetworkTraffic UI + NmxHostContext)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.11.0 | NEW: animation tokens file (duration + easing), _rail.scss layout component NEW: --nmx-rail-width, --nmx-rail-collapse-width tokens. NEW: icomoon glyphs (STATS, NODES, LIST, MENU, MENU_FOLD). MODIFIED: layouts/index.scss, tokens/index.scss. UPDATED: icomoon variables, fonts, theme CSS rebuilt. |
| @namorix/ui | 0.8.0 | NEW: NmxRail component suite (NmxRail, NmxRailList, NmxRailItem, NmxRailContent, NmxRailContext, types). NEW: hooks/NmxHostContext.ts — NmxHostContext + useIsWindowed. NEW: NmxIconFontSymbol — STATS, NODES, LOGS, MENU, MENU_FOLD. DELETED: NmxDataTable old sub-components (Head, Body, Row, Cell). |
| frontend | 0.13.0 | NEW: NetworkTraffic full UI with NmxRail sidebar + 1 OverviewTab. NEW: NmxHostContext Provider wrap in Root.tsx. MODIFIED: i18n/en.json — new addon translations. UPDATED: theme CSS rebuilt. |
| backend | 0.20.2 | PATCH: launchSettings.json |

### 2026-05-20 (Reusable UI components + Settings addon + WindowFrame mount fix)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.10.0 | NEW: 6 component SCSS (badge, chip, pulse-dot, pagination, data-table, addon). NEW: --nmx-radius-half token. MODIFIED: index.scss — 6 new @forward entries. UPDATED: icomoon glyphs, theme CSS rebuilt, window.scss. |
| @namorix/ui | 0.7.0 | NEW: NmxBadge (severity/status badge), NmxChip (toggleable filter chip), NmxPulseDot (animated status dot), NmxPagination (pagination controls), NmxDataTable (data-driven grid table with columns+rows API, subgrid, fallback states, clickable rows). NEW: NmxIconFontSymbol.ARROW_PREV, ARROW_NEXT. |
| frontend | 0.12.1 | FIX: WindowFrame addon mount — use win.app (addon ID) thay winId (Redux window ID). NEW: Settings addon — content implementation (+212 lines). MODIFIED: useAddonMount, useWindowHandlers, WindowFrameView. UPDATED: vite.config.ts proxy target. |

### 2026-05-20 (NetworkTraffic backend Phase 1.5 — fixes)

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.20.1 | FIX: middleware HashSet→ConcurrentDictionary<(string,string),int> (EndpointId lookup). NEW: CountingStream (wrap Response.Body, BytesWritten). NEW: IP→TrafficAddressId caching (ConcurrentDictionary<string,long>). FIX: CleanupWorker IServiceProvider→IServiceScopeFactory. FIX: Stopwatch thay DateTime.UtcNow. FIX: traffic scan Filter method-level attributes. FIX: Label init→set. FIX: typo + return→continue. MODIFIED: gắn [TrafficMonitor] vào 8 controller. NEW: UseTrafficMonitorAsync auto-scan startup. MODIFIED: Program.cs await. |

### 2026-05-19 (NetworkTraffic backend Phase 1)

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.20.0 | NEW: TrafficEndpoint, TrafficAddress, TrafficLog models. NEW: TrafficBuffer (Channel<TrafficLog> bounded 50K, DropOldest). NEW: TrafficMonitorService (CRUD, logs, stats). NEW: TrafficMonitorMiddleware (static HashSet + Channel). NEW: TrafficMonitorController (6 admin endpoints). NEW: TrafficFlushWorker (batch 100/5s). NEW: TrafficCleanupWorker (30d retention). MODIFIED: AppDbContext (3 DbSets + indexes), Program.cs (DI), ApplicationBuilderExtensions (UseTrafficMonitor). Migration regenerated. |

### 2026-05-19 (State management rewrite: Zustand → Redux Toolkit, new addons)

| Package | Version | Changes |
|---------|---------|---------|
| frontend | 0.12.0 | REWRITE: Zustand → Redux Toolkit. 4 stores → 3 slices (windowsSlice, launcherSlice, taskbarSlice). Normalized state (byId+order). Gộp window+geometry+animation vào windowsSlice. Memoized selectors (createSelector). useAppSelector mặc định shallowEqual. Taskbar optimized — không re-render khi drag/resize. Xóa 5 files stores/*.store.ts cũ. NEW: config/windowDefaults.ts (CSS token cache). NEW: NetworkTraffic, SystemMonitor addons. REFACTOR: WindowFrame tách thành 6 hook riêng (useWindowDrag, useWindowResize, useWindowAnimVars, useWindowOrigins, useWindowHandlers, useAddonMount). FIX: drag restore chỉ khi kéo > threshold, double-click restore đặt cửa sổ dưới cursor, icon MAXIMIZE/RESTORE swap, min resize từ CSS token. |
| @namorix/styles | 0.9.0 | NEW: app-network-traffic.svg, app-system-monitor.svg icons. NEW: --nmx-icon-app-system-monitor, --nmx-icon-app-network-traffic tokens. NEW: --nmx-window-drag-threshold, --nmx-window-titlebar-cursor-offset, --nmx-window-cascade-step, --nmx-window-cascade-max-offset tokens. UPDATED: launcher.scss, taskbar.scss, desktop.scss, tokens.scss. FIX: index.scss @forward themes/default. |
| @namorix/ui | 0.6.4 | NEW: NmxIconSvgSymbol.APP_SYSTEM_MONITOR, NmxIconSvgSymbol.APP_NETWORK_TRAFFIC. |

### 2026-05-18 (Shared types refactoring: AddonItem, OnOpenApp, addonToItems, rectToOrigin)
| Package | Version | Changes |
|---------|---------|---------|
| frontend | 0.11.1 | NEW: shared types — AddonItem, OnOpenApp (types/addon-item.ts), rectToOrigin utility (types/windowing.ts). NEW: addonToItems mapper (addons/index.ts). REFACTOR: DesktopArea + Launcher dùng AddonItem thay DesktopIconData/LauncherAddonItem riêng. DELETED: DesktopArea.types.tsx, Launcher.types.ts. RENAMED: useTaskbarRectStore.ts → taskbarRect.store.ts. |

### 2026-05-18 (WindowFrame animation system, size management, Settings addon scaffold)
| Package | Version | Changes |
|---------|---------|---------|
| frontend | 0.11.0 | NEW: WindowFrame full animation system — open (scale+fade from icon), close (scale+fade to center), minimize (scale+fade to taskbar), maximize (scale+translate to viewport), unmaximize (reverse). NEW: window size management via CSS tokens (--nmx-window-default-*, --nmx-window-min-*, --nmx-window-margin), cascade/random positioning. NEW: drag constraints via CSS token (--nmx-window-drag-min-visible). NEW: useTaskbarRectStore (Zustand), defocusAll on background click. NEW: Settings addon scaffold. Updated: AnimState driven through window store, Launcher translate optimization, Taskbar minimize from toggle button. Refactor: DesktopArea + Launcher pass addon manifest size fields. |
| @namorix/core | 0.10.5 | NEW: NmxAddonManifest — defaultWidth, defaultHeight, preferFullSize optional fields. |
| @namorix/styles | 0.8.0 | NEW: maximize/unmaximize @keyframes (window-maximize, window-unmaximize). NEW: 5 CSS tokens (--nmx-window-default-width, --nmx-window-default-height, --nmx-window-min-width, --nmx-window-min-height, --nmx-window-margin). NEW: --nmx-window-drag-min-visible token. NEW: app-settings.svg icon. Updated: Launcher animation (translate individual property), desktop.scss minor. Token: --nmx-window-maximize-animation-ms, --nmx-window-unmaximize-animation-ms. |
| @namorix/ui | 0.6.3 | NEW: NmxIconSvgSymbol.APP_SETTINGS. |

### 2026-05-15 (Addon system: contract, registry, LogViewer addon)
| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.9.0 | New addon module: addon/types.ts (NmxAddonManifest, AddonContext, AddonEntry, AddonModule), barrel export |
| frontend | 0.9.0 | New addon system: registry.ts (registerAddon, resolveAddon, listAddons), WindowFrame addon mounting via useEffect + resolveAddon, Launcher + DesktopArea dùng listAddons() thay hardcoded array. New LogViewer addon (LogViewer.tsx + LogViewer.scss + LogViewer.addon.tsx) |

### 2026-05-15 (Theme system: types, loader, registry, ThemeProvider, backend API)
| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.10.0 | New theme module: types.ts (ThemeManifest), loader.ts (restoreTheme, loadTheme), registry.ts (getBuiltInThemes, getAllThemes), barrel export. New providers module: ThemeProvider.tsx (ThemeContext, useTheme hook, switchTheme). New http.getJson method. New constants (NMX_THEME_CSS_ID, NMX_THEME_STORAGE_KEY). New API routes (ApiThemeRoutes, ThemeRoutes, ApiUserRoutes). |
| frontend | 0.10.0 | Theme integration: Root component with ThemeProvider wrap, restoreTheme() on app start, getAllThemes() load. Login theme sync — fetch user themeId from `/api/user/theme` → localStorage. |
| backend | 0.18.0 | New ThemeManifest model. User.ThemeId field. AppDbContext: ThemeManifests + AddonManifests DbSet + unique indexes. New UserService (GetThemeAsync, SetThemeAsync). New UserController (GET/PUT /api/user/theme). |

### 2026-05-17 (WindowFrame bug fixes, store refactor, geometry store, useOpenWindow)
| Package | Version | Changes |
|---------|---------|---------|
| frontend | 0.10.8 | Fix: WindowFrame — resize/drag bug fixes, frame types refinement (+44 lines). Refactor: window.store — simplified (-36 lines), windowing types expanded (+12). NEW: useOpenWindow hook, windowGeometry.store. Updated: DesktopArea, Launcher/types. Updated: index.html (meta tags). |

### 2026-05-17 (Taskbar/WindowFrame refactor, WindowManager flatten, blocked SCSS migration)
| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.7.1 | NEW: icomoon — new glyphs (fonts.scss, variables.scss). Moved: Blocked.scss từ frontend vào shell/components/blocked.scss. Updated: window.scss (27 lines), index.scss, shell/components/index.scss. |
| @namorix/ui | 0.6.2 | Updated: NmxIconFont.types.ts — +3 new icon symbols for new icomoon glyphs. |
| frontend | 0.10.7 | Refactor: Taskbar — Taskbar, TaskbarAppButton, TaskbarView (178 total lines). Refactor: WindowFrame — resize/drag logic overhaul (useWindowResize +127 lines, useWindowDrag +48 lines). Refactor: WindowFrameView — simplified (-83 lines). NEW: WindowTitleBar, WindowResizeHandles sub-components. NEW: WindowManager flattened (subdirectory → single file). Updated: window.store.ts (+68 lines), windowing types (+2). Updated: Desktop.tsx. Fix: Blocked.tsx removed unused import. |

### 2026-05-17 (Shell SCSS migration, component refactor: WindowFrame/Launcher/AuthView split)
| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.7.0 | NEW: shell/components/ — taskbar.scss, window.scss. NEW: tokens/elevation.scss. NEW: icons/app-logs.svg. Moved: auth.scss, desktop.scss từ frontend vào shell/components/. Icon: icomoon rebuilt (removed unused glyphs). Updated: shell/index.scss, tokens/icons.scss, theme tokens, theme CSS rebuilt. |
| @namorix/core | 0.10.4 | NEW: addon/types.ts — NmxAddonIconType (= NmxIconSvgSymbol), icon field type refinement. Fix: ThemeProvider import path. |
| @namorix/ui | 0.6.1 | Fix: NmxIconSvg cleanup (removed dead code), type tweaks. |
| frontend | 0.10.6 | NEW: WindowFrame — split into WindowFrameView, useAddonMount, useWindowDrag, useWindowResize, WindowFrame.types, barrel. NEW: Launcher — split into LauncherView, useLauncherSearch, Launcher.types, barrel. NEW: barrel exports — controllers/index.ts, hooks/index.ts, stores/index.ts, DesktopArea/index.ts, Taskbar/index.ts, WindowManager/index.ts, Launcher/index.ts, WindowFrame/index.ts. Refactor: AuthPage → AuthView rename. Fix: Login, Register minor. Chore: SCSS files deleted from frontend (moved to styles package). Chore: main.scss moved src/styles/ → src/. |

### 2026-05-16 (Shell refactor: DesktopArea/Taskbar modular, NmxMetaList, abstract/ restructure)
| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.6.0 | NEW: abstract/ (maps.scss, palette.scss) — variables/mixins moved to abstract/. NEW: shell/ + shell.scss entry, tokens/ directory, icons/ directory. NEW: components/meta-list.scss (NmxMetaList), components/icon/icon-svg.scss (NmxIconSvg). NEW: package.json exports — ./mixins, ./shell. Updated: icomoon — new icon glyphs (ttf/woff/svg rebuilt). Updated: all component SCSS (button, card, form, inline-alert, toggle, icon-box), theme tokens (default + dark). Deleted: base/icon-font.scss, base/tokens.scss, base/typography.scss, base/utilities.scss (empty placeholders). |
| @namorix/ui | 0.6.0 | NEW: Components/NmxMetaList/ — NmxMetaList (parent), NmxMetaItem (child, label+value+valueColor). NEW: Primitives/NmxIcon/NmxIconSvg — SVG icon variant (NmxIconSvgSymbol const+type). Updated: NmxIconFont.types — new icon symbols. Updated: NmxCardHeader — API refinements. Updated: types/base.ts, utils/cx.ts — new helpers. |
| frontend | 0.10.5 | NEW: DesktopArea — split DesktopIcon + DesktopAreaView + types. NEW: Taskbar — split TaskbarAppButton + TaskbarView + types; new useTaskbarClock hook. Updated: Blocked — dùng NmxMetaList thay raw HTML. Updated: WindowFrame — SCSS cleanup, window.store — refactored. Chore: remove tokens.scss, theme CSS rebuilt. |

### 2026-05-16 (NmxIconFont, NmxIconBox, icon SCSS, shared types/utils)
| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.5.0 | NEW: base/icomoon/ (variables.scss — font path + icon codes, fonts.scss — @font-face + icomoon base). NEW: base/components/icon/ (icon-font.scss, icon-box.scss component styles). NEW: base/typography.scss, base/utilities.scss. Fix: base/index.scss — reorder forwards, add icomoon/utilities/icon-font/typography. Fix: fonts.scss — quote style + DM Sans. Fix: variables.scss — semicolon. Fix: vite.config.ts — cssMinify: false. Fix: components/index.scss — forward icon. Format: button, form, inline-alert SCSS cleanup. |
| @namorix/ui | 0.5.0 | NEW: Primitives/NmxIcon/ — NmxIconFont (symbol prop, cxSize), NmxIconBox (semantic color, children). NEW: types/ — base.ts (WithBaseProps, WithHTMLProps, WithSemanticColor, WithVariant), primitives.ts (NmxButtonVariant, NmxSemanticColor, NmxCxInput). NEW: utils/ — cx.ts (moved from core), cx-size.ts, cx-semantic.ts, cx-variant.ts. Refactor: NmxButton, NmxInlineAlert, NmxToggle, NmxCard — dùng shared types thay local. Exports: types, utils, NmxIcon added to index.ts/barrel. |
| @namorix/core | 0.10.3 | Chore: remove cx export from utils/index.ts (moved to @namorix/ui). |
| frontend | 0.10.4 | Fix: Login, Register, Blocked, Taskbar, WindowFrame — prop refactoring (semantic color, shouldRender). Chore: theme CSS rebuilt. Fix: index.html meta tag. |

### 2026-05-16 (Styles: base/components/, layouts/, dark tokens; UI: NmxCard, flatten primitives)
| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.4.0 | NEW: base/components/ (card, form, inline-alert, toggle, button SCSS), base/layouts/ (split). NEW: themes/dark/tokens.scss (dark :root vars). Fix: base/tokens.scss — light colors. Fix: base/components/button.scss — BEM naming (--full-width, --upper-case). Fix: vite.config.ts — SCSS entries direct (no TS), xoá remove-js-output plugin. Chore: xoá tsconfig.json, scss.d.ts, theme index.ts entries. |
| @namorix/ui | 0.4.0 | NEW: Components/ — NmxCard, NmxCardContent, NmxCardBody, NmxCardHeader, NmxCardFooter. NEW: package.json exports (./Components, ./Primitives). Restructure: flattened Primitives (NmxButton, NmxInlineAlert, NmxToggle từ subfolder → flat). Chore: xoá SCSS khỏi ui (moved to @namorix/styles). |
| frontend | 0.10.3 | Refactor: Login, Register dùng NmxCard thay layout custom. Fix: AuthPage import cleanup. Fix: Blocked.scss, main.scss, tokens.scss — CSS cleanup. |

### 2026-05-16 (Styles restructure: base/ + themes/, validation, dedupe, env fix)
| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.3.0 | NEW: base/ subdir (reset, fonts, mixins, variables, tokens), themes/ structure (dark/index.scss). NEW: vite.config.ts, tsconfig.json, scss.d.ts for theme CSS build. Updated: index.scss forwards base. |
| @namorix/core | 0.10.2 | NEW: env/production.ts (conditional DEV flag via package.json exports). NEW: utils/dedupe.ts, utils/sanitizePath.ts. Fix: theme/types.ts — isBuiltIn, cssPath fields. Fix: theme/loader.ts — {id}/{path} URI pattern. Fix: theme/registry.ts — merged built-in + API fetch. Fix: ThemeProvider.tsx — switch/restore. Fix: guards.ts — dedupeGuard wrapper. |
| frontend | 0.10.2 | NEW: vite.config.ts — theme CSS build entries. Fix: main.tsx — restoreTheme, theme import. Fix: main.scss — @forward → @use. Fix: AuthPage.scss — minor. |
| backend | 0.19.1 | NEW: SetThemeSchema (IValidationSchema). Fix: UserController — [Validate] attribute. Fix: ThemeManifest — css → cssPath. Fix: AuthController — TryRefresh refactor. Chore: migrations recreated. |

### 2026-05-16 (Auth fix: UserService DI, AuthController refactor, refresh + guard fixes)
| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.19.0 | New ThemeController (GET /api/themes) + ThemeService. Fix: UserService register DI (lỗi 500). Fix: ThemeManifest nullable fields. Refactor: AuthController — session endpoint gọi TryRefresh() thay vì 401 ngay; cookie helpers dùng AuthService TTL methods; UserOk helper. Fix: AuthService TTL methods (GetAccessTokenExpirationDateTime, GetRefreshTokenExpiration). Config: AccessTokenExpirationMinutes → AccessTokenExpirationSeconds (appsettings + JwtConfig). |
| @namorix/core | 0.10.1 | Fix: client.ts — skip refresh cho session URL (tránh loop khi session expired). Fix: client.ts — return refreshResponse khi refresh fail thay vì fallthrough gây lỗi parse. |
| frontend | 0.10.1 | Fix: guards.ts — dedupeGuard wrapper ngăn double guard call trong React StrictMode. Chore: Root.tsx — tách Root component khỏi main.tsx. |

### 2026-05-15 (Desktop shell UI: taskbar, launcher, window manager + stores + types)
| Package | Version | Changes |
|---------|---------|---------|
| frontend | 0.8.0 | New desktop shell UI: Taskbar (clock, launcher toggle, window buttons), DesktopArea (icon shortcuts), WindowFrame (drag, resize, minimize, maximize, close), WindowManager, Launcher (start menu). New stores: window.store.ts (Zustand — open/close/focus/minimize/maximize/move/resize), launcher.store.ts. New types: WindowId, WindowState. Desktop.tsx — placeholder → full shell layout. App tokens: --nmx-taskbar-height, --nmx-window-frame-edge-size. Deps: added zustand |

### 2026-05-15 (Bug fixes: refresh token, IPv6, CSRF; multi-project migration)
| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.17.1 | Bug fixes: Refresh token flow — hash Base64 lookup thay vì parse JWT; NetworkHelper — xử lý IPv6 loopback + pure IPv6; CsrfMiddleware — dùng biến `token` local cho first-request 403; Program.cs CORS — fallback về AppConfig.AllowedOrigins; PermissionService — xoá dead code; RequireAdminAttribute — int.TryParse thay vì ToString(); Logout — RevokeTokenByHash thay vì ExtractJtiFromToken. Refactor: multi-project migration (Namorix.Core, Namorix.Adapters, Namorix.Server, Namorix.Workers). Cleanup: ExtractJtiFromToken, using SQLitePCL dư |
| @namorix/core | 0.8.1 | guards.ts: extracted DefaultPaths as reusable const object |
| frontend | 0.7.1 | App.tsx: Blocked page health check on mount; guard wiring refinements |

### 2026-05-15 (Permission/RBAC system, auth middleware, attribute filters, CORS dynamic config)
| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.17.0 | New Permission/RBAC system: PermissionController, UserPermissionController, PermissionService (cached), Permission/UserPermission models; New middleware: AuthMiddleware (JWT decode → HttpContext.User), NotFoundMiddleware (404 → ApiResponse JSON), RequireAuthAttribute, RequireAdminAttribute, RequirePermissionAttribute; New constants: HttpHeaders, Time, User (Admin=1/User=0); New Responses/ForbiddenObjectResult; SettingsController dynamic CORS origins (IMemoryCache); SettingsService generic GetListAsync/SetListAsync; AuthController session user existence check + cookie cleanup on invalid user; PermissionService with assignment/revocation + cache |

### 2026-05-14 (Trusted proxy detection, health endpoint, Blocked page, error code refactoring)
| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.8.0 | New types: MiddlewareErrorCodes tách từ HttpErrorCodes; ApiResponse thêm statusCode; api-routes thêm ApiMiddlewareRoutes; client.ts inject HTTP status code via spread; validation-messages thêm formatMiddlewareError; i18n thêm common.errors.untrustedProxy |
| frontend | 0.7.0 | New Blocked page (switch-case theo error code), Blocked.scss (color-mix), health.controller.ts, controllers restructuring (assets/controllers/ → controllers/), App.tsx health check on mount với blocking logic, i18n thêm blocked section (4 error types) |
| backend | 0.16.0 | New HealthController (GET /api/health), NetworkHelper (CORS origin validation), Error.cs refactoring (tách MiddlewareErrorCodes), TrustedProxyMiddleware trả về JSON ApiResponse, middleware pipeline reorder (UseCors trước UseTrustedProxy) |

### 2026-05-14 (Workspace restructure: packages → frontend/ + shared → core)
| Package | Version | Changes |
|---------|---------|---------|
| frontend | 0.6.0 | Workspace restructure: xoá root package.json, pnpm-workspace.yaml, tsconfig.base.json; chuyển `packages/*` vào `frontend/packages/*`; frontend tự đứng với workspace riêng; eslint.config.js→.ts; thêm jiti |
| @namorix/core | 0.7.0 | Merge `@namorix/shared` vào core: types/, api-routes.ts, constants.ts; core giờ là package duy nhất cho frontend + external addon |
| root (namorix) | — | Đã xoá `package.json`, `tsconfig.base.json`, `pnpm-workspace.yaml` khỏi root — workspace chuyển vào frontend/ |

### 2026-05-14 (Cleanup: xoá backend-n + packages/backend-core)
| Package | Version | Changes |
|---------|---------|---------|
| root (namorix) | 0.3.1 | Xoá thư mục `backend-n/` (Node.js backend cũ) và `packages/backend-core/` (TypeScript utilities). Cập nhật docs: CLAUDE.md, README.md, architecture.md, memory files, m2-auth.md, m4-addon-system.md, skill file |

### 2026-05-14 (latest — TrustedProxyMiddleware, SettingsController)
| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.15.0 | TrustedProxyMiddleware (chỉ trust X-Forwarded-For từ IP trong trusted list, block untrusted proxy), SettingsController (GET/PUT /api/settings/proxies), SettingsService GetTrustedProxies/SetTrustedProxies, HttpContextKeys (TrustedProxy, RealIp, RealScheme), GetClientIp dùng RealIp từ context trước, fallback RemoteIpAddress |
| frontend | 0.5.4 | main.tsx conditional API URL (izerocs.space → https), vite.config.ts conditional X-Forwarded-For forward (chỉ forward nếu đã có từ upstream) |
| root (namorix) | 0.3.0 | Backend 0.15.0 new feature (trusted proxy system) |

### 2026-05-13 (SecurityHeaders, Settings cache, SecureCookie fix)
| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.14.1 | SecurityHeadersMiddleware (X-ContentType-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy), SettingsService IMemoryCache (5min), SecureCookie dùng AppConfig trực tiếp thay vì AllowedOrigins heuristic, UseXForwardedHeaders extension (KnownNetworks/KnownProxies clear), Kestrel 10KB body limit, JsonErrorMiddleware StatusCodes constants, AccessToken TTL 15→5 |
| frontend | 0.5.3 | Enable Vite proxy /api, API URL default fix (bỏ hardcoded port) |
| root (namorix) | 0.2.1 | Backend 0.14.1 + frontend 0.5.3 patches |

### 2026-05-13 (CSRF, rate limiting, token cleanup)
| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.14.0 | Add CsrfMiddleware, rate limiting (100 req/min), TokenCleanupService (BackgroundService), AppConfig CsrfEnabled/SecureCookie, HttpErrorCodes.RateLimitExceeded, ApplicationBuilderExtensions.UseCsrfProtection, Program.cs pipeline update |
| root (namorix) | 0.2.0 | Backend 0.14.0 new features |

### 2026-05-13 (Validation system expansion)
| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.13.0 | Validation expansion: FormatValidationRule, EnumValidateRule, ApiResponse refactor (Error/Field/Meta), JsonErrorMiddleware Validated flag, AuthService ValidateAndParseToken extracted, empty string→Required fix, HttpContextKeys constant, global usings cleanup |
| root (namorix) | 0.1.9 | Backend 0.13.0 validation expansion |

### 2026-05-13 (Naming migration + docs cleanup)
| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.12.0 | Add custom [Validate] attribute for auth endpoints: IValidationSchema, ValidateAttribute, ValidationRule; LoginSchema, RegisterSchema using AuthConstraints; JsonErrorMiddleware bug fix (remove FlushAsync) |
| Package | Version | Changes |
|---------|---------|---------|
| root (namorix) | 0.1.8 | Docs cleanup: xóa backend-go/ + docs/migration-backend-go.md, xóa AGENTS.md references, update README code examples |
| frontend | 0.5.2 | i18n text: "Sign in" → "Log in", "Sign up" → "Register" across en.json + page links |
| @namorix/core | 0.6.3 | Field refactoring: needsSignup→needsRegister, signUpEnabled→registerEnabled; guards updated; validation-messages key renamed |
| @namorix/shared | 0.7.0 | **Breaking:** AuthStatus.needsSignup→needsRegister, signUpEnabled→registerEnabled; AuthErrorCode.SIGNUP_CLOSED→REGISTER_CLOSED |
| backend | 0.11.0 | CORS middleware (AddCors/UseCors with AllowCredentials); SettingsService method renames; JsonErrorMiddleware StatusCodes fix |

### 2026-05-12 (Bug fix session)
| Package | Version | Changes |
|---------|---------|---------|
| root (namorix) | 0.1.7 | Bug fix: auth guard loop (checkHasUsers/isAuthenticated catch 401 instead of throw) |
| backend | 0.10.0 | New: ExceptionMiddleware, JsonErrorMiddleware, ApplicationBuilderExtensions for consistent JSON error responses |
| @namorix/core | 0.6.2 | Bug fix: checkHasUsers() and isAuthenticated() catch 401 instead of throwing |

### 2026-05-12 (Phase 4 complete)
| Package | Version | Changes |
|---------|---------|---------|
| root (namorix) | 0.1.6 | C# migration Phase 4 complete: AuthController (7 endpoints), typed ApiResponse<T>, route rename (login/register/logout) |
| backend | 0.9.0 | AuthController with 7 endpoints (login, register, logout, logout-all, session, refresh, status), typed ApiResponse<T>, SettingsService, CleanIp helper, GetClientIp proxy chain |
| @namorix/shared | 0.6.1 | Route naming: signin→login, signup→register, signout→logout |
| @namorix/core | 0.6.1 | Guard route references updated to match new API route naming |
| frontend | 0.5.1 | Login/Register pages renamed, route wiring updated to new API routes |

### 2026-05-12 (latest)
| Package | Version | Changes |
|---------|---------|---------|
| root (namorix) | 0.1.5 | Backend C# migration Phase 4: AuthController with 7 endpoints, typed ApiResponse<T> |
| backend | 0.8.0 | Add AuthController (signin/signup/signout/signout-all/session/refresh/status), ApiResponse<T> typed responses, UserResponse, StatusResponse, SettingsService, CleanIp helper |

### 2026-05-12 (Phase 1-3)
| Package | Version | Changes |
|---------|---------|---------|
| root (namorix) | 0.1.4 | Backend C# migration Phase 1-3: AuthService, Config/Constants/Exceptions folders, IOptions<T> pattern |
| backend | 0.7.0 | New AuthService module (Login, Register, RefreshToken, RevokeToken, fingerprint check), Config pattern (IOptions<JwtConfig>), Settings model, Constants/Exceptions folders |

### 2026-05-10 (latest)
| Package | Version | Changes |
|---------|---------|---------|
| root (namorix) | 0.1.3 | Bump any package (Phase B: core 0.6.0, backend 0.6.2) |
| @namorix/core | 0.6.0 | Add fingerprint module (`FingerprintComponents` interface, `generateFingerprint()`, SHA-256 hash with base64 fallback), attach fingerprint header in `RequestBuilder.json()` |
| backend | 0.6.2 | Phase B complete: fingerprint verify Option C balanced in `refreshToken()` — revoke if fingerprint + IP changed; allow if only fingerprint changed (browser/OS update) |

### 2026-05-10 (Phase B)
| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.6.0 | Add `generateFingerprint()` + `FingerprintComponents` interface, SHA-256 hash in `RequestBuilder.json()` |
| backend | 0.6.1 | Add fingerprint verification in `refreshToken()` with Option C (balanced) — revoke only when both fingerprint and IP change |

### 2026-05-10 (later)
| Package | Version | Changes |
|---------|---------|---------|
| root (namorix) | 0.1.3 | JWT TTL config/env fix, rememberMe frontend wiring, useAuthForm dedup |
| frontend | 0.5.1 | Fix rememberMe toggle (wired to backend); add useAuthForm hook (dedup alert state + error handling in Login/Register) |
| @namorix/backend-core | 0.5.1 | signAccessToken accepts optional TTL param; remove generateTokenPair + TokenPair (dead code) |
| backend | 0.6.1 | signIn/refreshToken use config TTLs instead of hardcoded; add JWT_REFRESH_REMEMBER_TTL env var |

### 2026-05-10 (earlier)
| Package | Version | Changes |
|---------|---------|---------|
| root (namorix) | 0.1.2 | Add lint workspace script (pnpm -r run lint) |
| @namorix/shared | 0.6.0 | Add UserAgent + Fingerprint http headers; type→interface for AuthResult, User, ValidationErrorMeta, ValidationRule, ValidationMessage; eslint config + tsconfig |
| @namorix/backend-core | 0.5.0 | Add cookie wrappers (set/get/clear for access, refresh, csrf); CSRF double-submit middleware; verifyToken returns JwtPayload\|null; signRefreshToken accepts optional TTL (StringValue); eslint config; add @types/ms |
| @namorix/core | 0.5.2 | eslint config; type→interface refactors |
| backend | 0.6.0 | refresh_tokens whitelist (replaces revoked_tokens) with userAgent, fingerprint, ipAddress, lastUsedAt; signout-all endpoint; remember-me (90d TTL preserved on rotation); CSRF enabled by default (CSRF_DISABLE=false); remove verifyAccessToken (redundant after verifyToken null-return); cookie wrappers moved to backend-core; eslint fix (any, template literal, async, type assertions) |

### 2026-05-09 (later)
| Package | Version | Changes |
|---------|---------|---------|
| root (namorix) | 0.1.1 | Auto token refresh fix (bug fix in @namorix/core) |
| @namorix/core | 0.5.1 | Add 401 auto-refresh + retry in RequestBuilder.json() |

### 2026-05-09
| Package | Version | Changes |
|---------|---------|---------|
| root (namorix) | 0.1.0 | Add license field (GPL-3.0-only), sync versions to package.json files |
| @namorix/backend-core | 0.4.0 | Add CSRF middleware (setCsrfCookie, validateCsrf), create tsconfig.json |
| @namorix/core | 0.5.0 | Fix isAuthenticated (async fetch /session), CSRF auto-header in RequestBuilder, remove HttpHeader (moved to shared) |
| @namorix/shared | 0.5.0 | Add NMX_COOKIE_CSRF_KEY, SystemErrorCode.CSRF_MISMATCH, HttpHeader (moved from core, lowercase for Express) |
| frontend | 0.5.0 | Async isAuthenticated fix, CSRF token in requests |
| backend | 0.5.0 | Add CSRF_MODE env var + csrfMode config |
| @namorix/styles | 0.2.0 | Add variables.scss ($nmx-breakpoint-collapse) + package.json exports |

### 2026-05-09 (earlier)
| Package | Version | Changes |
|---------|---------|---------|
| @namorix/backend-core | 0.3.0 | Add decorator system (@Controller, @Get, @Post, @Validate, registerController) |
| @namorix/core | 0.4.0 | Add NmxI18n class, ValidationRunner, validation-messages, formatApiError |
| @namorix/shared | 0.4.0 | Add ValidationErrorCode enum, AuthErrorCode enum, rename ValidateErrorCode→ValidationErrorCode |
| frontend | 0.4.0 | Login connected, client-side validation, i18n layering |
| backend | 0.4.0 | Refactor routes to decorator-based, @Validate on signIn/signUp |

### 2026-05-08
| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.3.0 | Use createMiddleware from backend-core, validate middleware, fix tsconfig |
| @namorix/shared | 0.3.0 | Add ValidateErrorMeta type, ValidateErrorCode constants |
| @namorix/core | 0.3.0 | Add ApiError class with fromResponse(), http module |
| frontend | 0.3.0 | Add auth.controller.ts, connect Register to real API |
| @namorix/ui | 0.3.0 | Add @types/react, scss.d.ts, use FormHTMLAttributes |
| @namorix/backend-core | 0.2.0 | Add createMiddleware, validate middleware, cookie/response utils |

### 2026-05-07
| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.1.0 | Auth endpoints (signin/signup/signout/session), config, secret management |
| @namorix/backend-core | 0.1.0 | NmxDataBase class, logger with tag + timestamp, jwt utilities |
| @namorix/shared | 0.1.0 | Types (UserPublic, ApiResponse), constants, errors |
| @namorix/styles | 0.1.0 | CSS tokens, reset, fonts |
| @namorix/ui | 0.2.0 | NmxButton, NmxForm, NmxInlineAlert, NmxSwitch components |

### 2026-05-06
| Package | Version | Changes |
|---------|---------|---------|
| frontend | 0.0.1 | Initial Vite project, React Router setup |
| @namorix/core | 0.0.1 | cx utility |
