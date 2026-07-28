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
- [x] OAuth2 private_key_jwt full implementation (RSA key pair gen, client_assertion verify)
- [x] gRPC Addon Channel (bidirectional stream, auth interceptor, 5-min recheck, active cancellation)
- [x] OAuth revoke endpoint + NotifyAddonWidgetEvent (gRPC → SignalR bridge)

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
| frontend | 0.67.0 | M4 (Frontgate Phase 2: 3 cert dialogs, NmxFileInput, file-input.scss, DNS providers) |
| @namorix/core | 0.52.0 | M4 (Frontgate cert endpoints: letsencrypt-http, letsencrypt-dns, custom, dnsProviders) |
| @namorix/styles | 0.45.0 | M4 (file-input.scss, form/select SCSS tweaks, icomoon rebuild) |
| @namorix/ui | 0.34.0 | M4 (NmxFileInput primitive, NmxAlertDialog confirmDisabled prop, loading createPortal) |
| Namorix.Core | 0.52.0 | M4 (DataBasePath centralization, DataPaths constants) |
| Namorix.Server | 0.58.0 | M4 (DnsProviders model, 3 POST cert endpoints, cert file storage, KeyPath/CertPath) |

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

### 2026-07-28 — Frontgate Phase 2: Certificate creation, file storage, DNS providers, NmxFileInput

- @namorix/core 0.51.0 → 0.52.0: MODIFIED: `apiRoutes.ts` — added 3 cert routes (letsencrypt-http, letsencrypt-dns, custom), dnsProviders, certificatesAll.
- @namorix/styles 0.44.1 → 0.45.0: NEW: `base/components/file-input.scss` — NmxFileInput styles. MODIFIED: `base/components/form.scss` — form-field inline layout. `base/components/select.scss` — Floating UI tweaks. `base/icomoon/` — font/variables rebuild (new icon symbols).
- @namorix/ui 0.33.0 → 0.34.0: NEW: `Primitives/NmxFileInput.tsx` — file input primitive (hidden input, click area, icon UPLOAD↔FILE_LINK, FileReader text content). MODIFIED: `Components/NmxAlertDialog/NmxAlertDialog.types.ts` — added `confirmDisabled` prop. `Components/NmxAlertDialog/NmxAlertDialog.tsx` — confirmDisabled disables confirm button. `Components/NmxLoadingOverlay.tsx` — wrapped in createPortal(document.body) for correct z-index stacking. `Primitives/NmxIcon/NmxIconFont.types.ts` — added FILE_LINK, UPLOAD icon symbols. `Primitives/index.ts` — added NmxFileInput export.
- frontend 0.66.0 → 0.67.0: MODIFIED: `addons/Frontgate/FrontgateCertificate.tsx` — 3 NmxAlertDialog cert creation dialogs (letsEncryptHttp, letsEncryptDns, custom) with domain/keyType/DNS provider fields, NmxFileInput for PEM upload, confirmDisabled validation, resetForm pattern, addSubmitting state. `addons/Frontgate/frontgate.controller.ts` — added payload types (CreateLetsEncryptCertPayload, CreateLetsEncryptDnsCertPayload, CreateCustomCertPayload) + create functions (createLetsEncryptCert, createLetsEncryptDnsCert, createCustomCert) + listDnsProviders. `addons/Frontgate/Frontgate.types.ts` — FrontgateCertificateKeyType. `i18n/locales/en.json` — ~124 lines: dnsProviders labels (~80), 3 dialogs with title/confirm/info/placeholder, certType options, dialogs section.
- Namorix.Server 0.57.0 → 0.58.0: NEW: `Models/DnsProviders.cs` — ~80 DNS providers (8 implemented: Cloudflare/Route53/DigitalOcean/GoDaddy/Azure DNS/Google Cloud/Namecheap/ACME-DNS), DnsProvider record with CredentialFields. MODIFIED: `Controllers/FrontgateController.cs` — added 3 POST cert endpoints (letsencrypt-http, letsencrypt-dns, custom) with FgCertificateSource distinction, file-based cert storage via DataDirectory.WriteFile, DnsProviderId support. `Models/FgCertificate.cs` — replaced PrivateKeyEncrypted/CertificateChain with KeyPath/CertPath file paths, added DnsProviderId. NEW migrations: `AddFgCertificateDnsProviderId`, `AddFgCertificateFilePaths`.

- @namorix/ui 0.30.2 → 0.31.0: NEW: `Primitives/NmxMenuButton.tsx` — Floating UI dropdown (useFloating, FloatingPortal, useClick, useDismiss, useListNavigation), `filterItem` prop, `NmxMenuButtonOption<T>` interface with value/label/semantic/icon/divider, `getReferenceProps` compose pattern for row click isolation, `data-row-action` attribute. MODIFIED: `Components/NmxAlertDialog/NmxAlertDialog.types.ts` — added `markupToHtmlEnabled` prop. `Components/NmxAlertDialog/NmxAlertDialog.tsx` — `markupToHtmlEnabled` renders description via `dangerouslySetInnerHTML`. `Components/NmxDialog/NmxDialog.types.ts` — added `noSpacingBody` prop. `Components/NmxDialog/NmxDialogBody.tsx` — noSpacingBody support (flush dialog body). `Primitives/NmxIcon/NmxIconFont.types.ts` — added MENU_VERTICAL, REFRESH, DOWNLOAD, HTTP, DNS, UPLOAD icon symbols. `Primitives/index.ts` — added NmxMenuButton export.
- @namorix/core 0.50.0 → 0.51.0: MODIFIED: `utils/markup.ts` — markupToHtml overload accepting ReactNode (pass through). `apiRoutes.ts` — added `certificateById`. `hooks/useDateTimeFormat.ts` — added `dateOnly` formatter.
- @namorix/styles 0.42.0 → 0.43.0: NEW: `base/components/menu-button.scss` — NmxMenuButton styles (trigger arrow, Floating UI dropdown, items, divider, item-icon). MODIFIED: `base/components/index.scss` — added menu-button forward. `base/components/button.scss`, `base/components/data-table.scss` — tweaks. `base/icomoon/` — fonts, variables, selection.json, _font-face.scss rebuild (new icon symbols). `base/shell/addon/frontgate.scss` — page/actions/list styles. `base/shell/components/blocked.scss` — style updates.
- frontend 0.63.0 → 0.64.0: NEW: `addons/Frontgate/FrontgateCertificate.tsx` — full certificate tab (NmxDataTable with domain/issuer/type/status-expiry/action columns, NmxMenuButton action menu with filterItem for Renew/Retry/Download/Delete, clickable rows → detail NmxAlertDialog with NmxMetaList, delete with confirmation dialog, toast feedback, renderType/renderStatus/renderExpiry helpers). NEW: `addons/Frontgate/Frontgate.types.ts` — FrontgateErrorCodes enum. MODIFIED: `addons/Frontgate/frontgate.controller.ts` — CertificateItem type with status/isInUse, deleteCertificate method, certificateById route. `addons/Frontgate/Frontgate.tsx` — minor updates. `i18n/locales/en.json` — 44-line certificate section (titleInformation, actions, fields, statusValues/inUseValues, options, feedback). `addons/Frontgate/FrontgateReverseProxy.tsx` — minor updates. Various taskbar/window files — unused import cleanup. `frontend/public/frontgate.html` — frontgate standalone landing page (nmx-card, nmx-meta-list, nmx-icon-box from theme system).
- Namorix.Core 0.51.0 → 0.52.0: NEW: `Constants/DataPaths.cs` — central path constants. MODIFIED: `Config/AppConfig.cs` — DataBasePath property from appsettings. `Extensions/ApplicationBuilderExtensions.cs`, `Extensions/ServiceCollectionExtensions.cs` — DataBasePath integration. `FlatFile/FlatFileOptions.cs` — removed BasePath (uses shared DataBasePath). `FlatFile/FlatFileStore.cs` — DataDirectory integration. `IO/DataDirectory.cs` — uses AppConfig.DataBasePath.
- Namorix.Server 0.54.0 → 0.55.0: NEW: `Models/FgCertificate.cs` — FgCertificateStatus enum (Active/Pending/Error) + Status property. `Infrastructure/SelfSignedCertificateProvider.cs` — auto-gen PFX when HttpsPort > 0 without SslCertPath, saves to data/pki/. `Migrations/20260727063316_AddFgCertificateStatus.cs` — adds Status column to FgCertificates. MODIFIED: `Controllers/FrontgateController.cs` — DeleteCertificate endpoint (DELETE /certificates/{id}), ListCertificates removed .ToString() (JsonStringEnumConverter handles serialization), added isInUse = ReverseProxyRules.Any(). `Persistence/AppDbContext.cs` — FgCertificateStatus config (HasConversion<string>, HasMaxLength(20)). `Program.cs` — pipeline separation (UseWhen: API port full pipeline, proxy ports only ForceSsl + YARP + static). `Config/BackendConfig.cs` — HttpPort, HttpsPort, SslCertPath, SslCertPassword. `appsettings.json` — HttpPort/HttpsPort config.

### 2026-07-27 — Frontgate Phase 2: Certificate pagination, NmxSelect description, Source field

- @namorix/ui 0.31.0 → 0.32.0: MODIFIED: `Primitives/NmxSelect.tsx` — `NmxSelectData` added `description?: string` field. `NmxSelect` renders `nmx-select__option-description` span in dropdown when description present.
- @namorix/styles 0.43.0 → 0.44.0: MODIFIED: `base/components/select.scss` — `.nmx-select__option` `flex-direction: column`. New `.nmx-select__option-label` and `.nmx-select__option-description` selectors with `white-space: nowrap` / `text-overflow: ellipsis` / `overflow: hidden`. Description uses `--nmx-color-on-surface-variant`.
- frontend 0.64.0 → 0.65.0: MODIFIED: `addons/Frontgate/FrontgateCertificate.tsx` — full pagination (NmxPagination, usePageSize, fetchCerts with page/size, useEffect deps, refresh onClick). `addons/Frontgate/FrontgateReverseProxy.tsx` — certificate dropdown options with description (None: "Disable SSL/TLS", Request New: "Auto-provision Let's Encrypt", existing: `{{issuer}} — Expires: {{expires}}`), `dateOnly` formatter, `listAllCertificates` returns paginated response. `addons/Frontgate/frontgate.controller.ts` — `listAllCertificates` returns `CertificateResponse` (`{ items, total }`). `i18n/locales/en.json` — 3 new `certificateOptions` keys.
- Namorix.Server 0.55.0 → 0.56.0: MODIFIED: `Models/FgCertificate.cs` — added `FgCertificateSource` enum (LetsEncryptHttp, LetsEncryptDns, Custom) + `Source` property. `Persistence/AppDbContext.cs` — `FgCertificate.Source` config (HasConversion<string>, HasMaxLength(20)). `Controllers/FrontgateController.cs` — `ListCertificates` includes `source = c.Source` in response, pagination with page=0 default (flat array), page>0 returns `{ items, total }`. NEW migration `20260727091943_AddFgCertificateSource`.

### 2026-07-27 — Frontgate Phase 2: NmxMenuButton divider refactor, filterItem, FgCertPendingResetWorker, LogViewer pagination

- @namorix/ui 0.32.0 → 0.33.0: MODIFIED: `Primitives/NmxMenuButton.tsx` — divider refactor: removed `divider?: boolean` from `NmxMenuButtonOption`, added `dividerIndexes?: NmxMenuButtonDivider<T>[]` prop with `{ value: T, position: "top" | "bottom" }` approach (divider follows option by `value`, renders above/below). `filterItem` edge case: when no options remain, trigger button is hidden. Used `filteredOptions` intermediary for correct filtered rendering. `Primitives/NmxIcon/NmxIconSvg.types.ts` — added `APP_BEACON: "app-beacon"` symbol.
- @namorix/styles 0.44.0 → 0.44.1: MODIFIED: `base/components/menu-button.scss` — added `.nmx-menu-button__divider` styles. `base/components/button.scss` — tweaks. `base/shell/addon/frontgate.scss` — frontgate style updates. `themes/dark/tokens.scss` — dark token adjustments. `base/tokens/icons.scss` — added `--nmx-icon-app-beacon` CSS variable.
- frontend 0.65.0 → 0.66.0: MODIFIED: `addons/Frontgate/FrontgateCertificate.tsx` — filterItem 3-state logic (pending→delete only, error→retry+delete, other→renew+download+delete), `dividerIndexes={[{ value: "delete", position: "top" }]}` on action menu. `addons/Frontgate/FrontgateReverseProxy.tsx` — certificate dropdown with descriptions. `addons/LogViewer/LogViewer.tsx` — pagination repositioned below data table (before alert dialog). `i18n/locales/en.json` — 3 new certificateOptions description keys, 2 new beacon i18n keys. NEW: `addons/Beacon/` — Beacon addon scaffold (DNS updater, empty component). MODIFIED: `addons/index.ts` — added Beacon import. `addons/types.ts` — added `beacon` to NmxAddonId and NmxAddonLocaleKeys. NEW: `public/icons/app-beacon.svg` — Beacon icon.
- Namorix.Server 0.56.0 → 0.57.0: NEW: `Workers/FgCertPendingResetWorker.cs` — one-shot BackgroundService: on startup, resets all `FgCertificateStatus.Pending` → `Error` via `ExecuteUpdateAsync`. MODIFIED: `Program.cs` — registered `FgCertPendingResetWorker` as hosted service.

### 2026-07-25 — Frontgate addon scaffold, APP_FRONTGATE icon symbol

- @namorix/styles 0.38.2 → 0.39.0: MODIFIED: `base/tokens/icons.scss` — added `--nmx-icon-app-frontgate` CSS variable for new Frontgate icon.
- @namorix/ui 0.27.0 → 0.28.0: MODIFIED: `Primitives/NmxIcon/NmxIconSvg.types.ts` — added `APP_FRONTGATE: "app-frontgate"` symbol.
- frontend 0.57.0 → 0.58.0: NEW: `addons/Frontgate/Frontgate.addon.tsx` — addon manifest registered. NEW: `addons/Frontgate/Frontgate.tsx` — empty component scaffold. MODIFIED: `addons/index.ts` — added Frontgate import. `addons/types.ts` — added `frontgate` to NmxAddonId and NmxAddonLocaleKeys. `i18n/locales/en.json` — frontgate i18n keys. Themes CSS rebuilt.

### 2026-07-26 — Frontgate Phase 1: Floating UI NmxSelect, NmxKeyValueEditor, Locations tab, 4-tab consolidation

- @namorix/core 0.47.0 → 0.48.0: MODIFIED: `apiRoutes.ts` — added `certificates` route. `toast/toast.types.ts` — fixed `message` type (`string | unknown` → `unknown`).
- @namorix/styles 0.40.0 → 0.41.0: NEW: `base/components/key-value-editor.scss` — table-style editor SCSS. MODIFIED: `select.scss` — Floating UI refactor (removed absolute positioning, z-index 100→1000). `pagination.scss` — `.nmx-select__control` cascade via `.nmx-pagination__size-wrap`. `tabs.scss`, `dialog.scss` (noSpacingBody), `form.scss`, `frontgate.scss` (location editor, empty state), icomoon rebuild (new icon symbols).
- @namorix/ui 0.29.0 → 0.30.0: NEW: `Components/NmxKeyValueEditor/` — key-value pair editor with Name/Value header, delete rows. `package.json` — added `@floating-ui/react` dependency. MODIFIED: `Primitives/NmxSelect.tsx` — full Floating UI migration (`useFloating`, `FloatingPortal`, `useClick`, `useDismiss`, `useListNavigation`, `renderOption` prop, keyboard nav). `Components/NmxAlertDialog/` — added `extraActionLabel`/`onExtraAction` for contextual footer action, `noSpacingBody`, `noBodyScrollbar` props. `Primitives/NmxTabs.tsx` — tab component updates. `Primitives/NmxIcon/NmxIconFont.types.ts` — added `CODE`, `ADVANCED` symbols. `Components/NmxToastProvider.tsx` — toast message `String()` cast fix.
- frontend 0.60.0 → 0.61.0: MODIFIED: `addons/Frontgate/FrontgateReverseProxy.tsx` — 4-tab form UI (General/Headers/Locations/Advanced), Floating UI NmxSelect for certificate/status/access, NmxKeyValueEditor for headers, card-based location editor with path+delete + scheme/host/port rows, Certificate selector (None + Request new + real certs), `serializeHeaders()` JSON transform, `resetForm` state, `extraAction` for Add Header/Add Location. `addons/Frontgate/frontgate.controller.ts` — added `CertificateItem` interface, `listCertificates()`, `locations` in payload. `i18n/locales/en.json` — added Frontgate i18n keys (certificate, statusOptions, accessOptions, headerName, locations etc.).
- Namorix.Server 0.53.0 → 0.54.0: MODIFIED: `Controllers/FrontgateController.cs` — added `ListCertificates` (GET), Locations handling in CreateRule/UpdateRule. `Models/FgReverseProxyRule.cs` — minor updates.

### 2026-07-26 — Frontgate Phase 1: YARP integration, CRUD API, full form UI

- @namorix/ui 0.28.1 → 0.29.0: NEW: `Primitives/NmxTabs.tsx` — generic tab component `<T extends string = string>` with controlled/uncontrolled pattern. NEW: `Primitives/NmxForm/NmxFormRow.tsx` — flex row layout component. MODIFIED: `Primitives/NmxForm/NmxFormField.tsx` — added `rowFlex` prop for row layouts. `Components/NmxAlertDialog/NmxAlertDialog.types.ts` — added `noSpacingBody` (flush) prop to remove body padding.
- @namorix/styles 0.39.1 → 0.40.0: MODIFIED: SCSS component updates for tabs and frontgate form layout.
- @namorix/core 0.46.0 → 0.47.0: MODIFIED: `apiRoutes.ts` — added `ApiFrontgateRoutes` with reverseProxy and reverseProxyById routes.
- frontend 0.59.0 → 0.60.0: NEW: `addons/Frontgate/frontgate.controller.ts` — `CreateReverseProxyRulePayload`, `ReverseProxyRuleResponse` types, `createRule()`/`updateRule()`/`deleteRule()` methods with `UpdateAsync()` integration. MODIFIED: `addons/Frontgate/FrontgateReverseProxy.tsx` — full add dialog with NmxTabs (General/Features/Security), NmxFormRow destination layout (scheme+host+port), toggle controls for WebSockets/Cache/HTTP2/ForceSSL/HSTS/BlockExploits, `resetForm` pattern, states for all form fields. `i18n/locales/en.json` — Frontgate form field i18n keys.
- Namorix.Core 0.50.0 → 0.51.0: MODIFIED: `Extensions/ApplicationBuilderExtensions.cs` — added `Action<IEndpointRouteBuilder>? configureEndpoints = null` callback for Server-only endpoint registration without Core referencing YARP.
- Namorix.Server 0.52.0 → 0.53.0: NEW: `Services/FrontgateProxyConfigProvider.cs` — `IProxyConfigProvider` reading active `FgReverseProxyRules` from DB, building YARP clusters/routes with transforms (WebSockets, HTTP/2, HSTS, ForwardedHeaders, X-Forwarded-For). Uses `CancellationChangeToken` for runtime config reload. NEW: `Controllers/FrontgateController.cs` — full CRUD: `ListRules` (GET, paginated, RequireAdmin), `CreateRule` (POST, calls `UpdateAsync()`), `UpdateRule` (PUT, calls `UpdateAsync()`), `DeleteRule` (DELETE, calls `UpdateAsync()`). MODIFIED: `Models/FgReverseProxyRule.cs` — added `BlockCommonExploits` field. `Program.cs` — YARP DI: `AddSingleton<FrontgateProxyConfigProvider>()`, `AddReverseProxy()`, `IProxyConfigConfigProvider` singleton, `MapReverseProxy()` via configureEndpoints callback. `Persistence/AppDbContext.cs` — FgReverseProxyRule relationships. NEW migration `AddBlockCommonExploits`. `.claude/plans/frontgate-proxy-architecture.md` — updated with granular Phase 1 items.

### 2026-07-26 — Frontgate Phase 1: Form submit + validation, backend validation, toast createPortal, error codes

- @namorix/core 0.48.0 → 0.49.0: NEW: `i18n/validation-messages.ts` — `formatServerError` function (looks up `err.code` as i18n key, returns `string | ApiError`). MODIFIED: `toast/toast.service.ts` — improved error handling with ApiError code fallback chain.
- @namorix/styles 0.41.0 → 0.41.1: MODIFIED: `base/components/toast.scss` — z-index adjustments. `base/tokens/elevation.scss` — token fix.
- @namorix/ui 0.30.0 → 0.30.1: MODIFIED: `Components/NmxToastProvider.tsx` — wrapped in `createPortal(document.body)` to fix toast behind dialog overlay (stacking context issue with `contain: strict` on `#root`).
- frontend 0.61.0 → 0.62.0: MODIFIED: `addons/Frontgate/FrontgateReverseProxy.tsx` — form submit + validation (`handleConfirm` with client-side validation, API call via `createRule()` with `.then().catch().finally()` pattern, `formSubmitting` loading state, `nmxToast.error` for errors). Removed unused `certificates` state, `formatApiError` import. Added `feedback.createSuccess`/`createError` i18n keys. `i18n/locales/en.json` — added `errors.ruleNotFound`, `errors.duplicateSource` keys.
- Namorix.Core 0.51.0 → 0.52.0: NEW: `Validation/ValidationRule.cs` — `FormatValidationRule.Trim` property (whitespace trim before validation), `JsonValidationRule` (validates JSON string parseable via `JsonDocument.Parse`, MinLength/MaxLength), `CollectionValidationRule` (validates IList items via `ItemValidator` delegate with indexed field names).
- Namorix.Server 0.54.0 → 0.55.0: MODIFIED: `Controllers/FrontgateController.cs` — added `[Validate(typeof(FrontgateRuleSchema))]` on CreateRule/UpdateRule, duplicate Source check with `DUPLICATE_SOURCE` error code, `Enum.Parse(ignoreCase: true)` fix, Locations via navigation property (single `SaveChangesAsync()`). NEW: `Validation/FrontgateRuleSchema.cs` — validation schema with 7 properties (Source, DestinationHost, DestinationScheme, DestinationPort, Access, AdditionalHeadersJson, Locations).

### 2026-07-26 — Frontgate Phase 1: Edit dialog, delete confirm, ForceSsl, port 80/443

- @namorix/core 0.49.0 → 0.50.0: NEW: `i18n/validation-messages.ts` — `formatCustomError` function with `codeMap` parameter for `err.code` → i18n key mapping, returns `string | ApiError` if no match. MODIFIED: `toast/toast.service.ts` — error handling improvements.
- @namorix/styles 0.41.1 → 0.42.0: MODIFIED: `base/components/dialog.scss` — NmxAlertDialog style updates. `base/components/toast.scss` — z-index fixes. `base/shell/addon/frontgate.scss` — Frontgate form styles. `base/tokens/elevation.scss` — token adjustments.
- @namorix/ui 0.30.1 → 0.30.2: MODIFIED: `Components/NmxKeyValueEditor/NmxKeyValueEditor.tsx` — component fixes. `Components/NmxToastProvider.tsx` — createPortal migration. `Primitives/NmxSelect.tsx` — cleanup.
- frontend 0.62.0 → 0.63.0: MODIFIED: `addons/Frontgate/FrontgateReverseProxy.tsx` — edit dialog (`editingRule` state + `fillForm` pre-fill), delete confirmation flow (`deletingRule` + `deleteSubmitting` + `handleDeleteConfirm`), delete column with stopPropagation, Status form dropdown now functional. `addons/Frontgate/frontgate.controller.ts` — `status` field in `CreateReverseProxyRulePayload`. `i18n/locales/en.json` — `updateSuccess`, `updateError`, `deleteSuccess`, `deleteError`, `confirmDelete` keys.
- Namorix.Core 0.52.0 → 0.53.0: MODIFIED: `Extensions/ServiceCollectionExtensions.cs` — added `JsonStringEnumConverter(JsonNamingPolicy.CamelCase)` for lowercase enum serialization. `Validation/ValidationRule.cs` — new rules.
- Namorix.Server 0.55.0 → 0.56.0: MODIFIED: `Controllers/FrontgateController.cs` — ListRules `.Include(r => r.Locations)`, `CreateRuleRequest.Status` field, `Enum.Parse(ignoreCase: true)` fix, update duplicate source check wraps in `if (request.Source != rule.Source)`. `Config/BackendConfig.cs` — added `HttpPort`, `HttpsPort`, `SslCertPath`, `SslCertPassword`. `Program.cs` — port 80/443 optional Kestrel binding, `app.UseMiddleware<ForceSslMiddleware>()`. `appsettings.json` — added HttpPort/HttpsPort/Ssl config. `Services/FrontgateProxyConfigProvider.cs` — `ConcurrentDictionary<string, byte> ForceSslSources` populated from rules. NEW: `Middleware/ForceSslMiddleware.cs` — HTTP→HTTPS 301 redirect per-rule. `.claude/plans/frontgate-proxy-architecture.md` — Phase 2 items 1-2 marked done.

### 2026-07-25 — OAuth reuse detection, formatHttpError, Frontgate pages, token cleanup

- @namorix/core 0.45.0 → 0.46.0: NEW: `hooks/useUserRoleAdmin.ts` — role check hook. `i18n/validation-messages.ts` — `formatHttpError` function (handles NOT_FOUND, INTERNAL_ERROR, CONNECTION_LOST, FORBIDDEN). MODIFIED: `types/error.ts` — added `FORBIDDEN` to HttpErrorCodes. `i18n/locales/en.json` — added `notFound`, `internalError`, `connectionLost`, `forbidden` keys. `toast/toast.service.ts` — uses `formatApiError` instead of just `resolveAuthError`.
- @namorix/styles 0.39.0 → 0.39.1: MODIFIED: SCSS component tweaks (button, search-input, segmented-group, select, toolbar, desktop). Icomoon icons rebuilt (fonts, variables, selection).
- @namorix/ui 0.28.0 → 0.28.1: MODIFIED: `Primitives/NmxIcon/NmxIconFont.types.ts` — icon type symbol updates.
- frontend 0.58.0 → 0.59.0: NEW: `addons/Frontgate/Frontgate.tsx` — NmxToolbar layout with ReverseProxy/Certificate/ErrorPages tabs. NEW: `addons/Frontgate/FrontgateReverseProxy.tsx`, `FrontgateCertificate.tsx`, `FrontgateErrorPages.tsx` — tab component scaffolds. MODIFIED: `addons/Frontgate/Frontgate.addon.tsx` — updated. `components/DesktopArea/DesktopArea.tsx` — role guard for admin API calls. `store/slices/windowsSlice.ts` — minimize/restore bug fix. `i18n/locales/en.json` — Frontgate tab keys.
- Namorix.Core 0.49.0 → 0.50.0: NEW: `Constants/Error.cs` — `OAuthRefreshErrors` with `TokenReused`. MODIFIED: `Extensions/HttpResponseExtensions.cs` — refactored to C# extension class, added `DeleteCookie` extension method.
- Namorix.Server 0.51.0 → 0.52.0: NEW: `Services/OAuthService.cs` — `OAuthRefreshStatus` enum, reuse detection in `RefreshAddonTokenAsync` (revokes entire token chain on reuse). MODIFIED: `Controllers/OAuthController.cs` — handles `Reused` status (clears cookie, returns 401 with `TOKEN_REUSED`). `Workers/TokenCleanupWorker.cs` — added cleanup for `OAuthAuthorizationCodes` and `OAuthTokens`. `Persistence/AppDbContext.cs` — removed OAuthConsent DbSet. REMOVED: `Models/OAuthConsent.cs`. NEW migration `RemoveOAuthConsent`.

### 2026-07-25 — OAuth PKCE cookie refresh, Base64 fix, createMount OAuth flow, BackendConfig move

- @namorix/core 0.44.1 → 0.45.0: MODIFIED: `oauth/browser.ts` — silent refresh uses desktopUrl from config. `mount/createMount.tsx` — uncommented OAuth flow (handleRedirectCallback, trySilentRefresh, authorizeRedirect now active). `oauth/constants.ts` — new constants. `apiRoutes.ts` — OAuth route updates.
- frontend 0.56.0 → 0.57.0: MODIFIED: `pages/Login.tsx` — returnUrl support for OAuth authorize redirect. `i18n/locales/en.json` — i18n updates. `vite.config.ts` — config changes.
- Namorix.Core 0.48.0 → 0.49.0: NEW: `Extensions/HttpResponseExtensions.cs` — SetCookie extension method (HttpOnly, SameSite=Lax, Path=/api). `Models/OAuthRefreshToken.cs` — refresh token entity. `Utils/TokenHash.cs` — SHA256 hash utility. MODIFIED: `Config/AppConfig.cs` — OAuthRefreshTokenTtlDays. `Constants/Cookie.cs` — AddonRefreshToken name. `Constants/OAuth.cs` — expanded constants.
- Namorix.Server 0.50.1 → 0.51.0: NEW: `Config/FrontendConfig.cs` — frontend URL config for login redirect. MOVED: `Config/BackendConfig.cs` — từ Namorix.Core sang. MODIFIED: `Controllers/OAuthController.cs` — refresh endpoint with cookie read, SetAddonRefreshTokenCookie. `Controllers/AuthController.cs` — dùng SetCookie extension. `Services/OAuthService.cs` — PKCE verification, refresh token rotation (OAuthRefreshToken), standard base64 fix. `Persistence/AppDbContext.cs` — OAuthRefreshTokens DbSet. `Workers/TokenCleanupWorker.cs` — OAuthRefreshToken cleanup. NEW migration `AddOAuthRefreshToken`.
- @namorix/styles — không thay đổi.
- @namorix/ui — không thay đổi.

### 2026-07-25 — parseUTCDate timezone fix, addon info dialog, OAuth config endpoint, silent refresh

- @namorix/core 0.44.0 → 0.44.1: MODIFIED: `utils/format.ts` — added `parseUTCDate()` helper, `formatRelativeTime` now uses it for timezone-safe date parsing (fixes `installedAt` showing "7 hours ago" in UTC+7).
- @namorix/styles 0.38.1 → 0.38.2: MODIFIED: `components/dialog.scss` — tweaks. `shell/addon/package-center.scss` — new `__card-clickable` block with cursor/hover. Theme CSS rebuilt.
- @namorix/ui 0.26.0 → 0.27.0: MODIFIED: `Components/NmxCard/NmxCard.tsx` — added `onClick` prop. `Components/NmxAlertDialog/` — extended for size/confirmLabel/cancelLabel flexibility. `Components/NmxDialog/` — types and header extensions. `types/base.ts` — WithClickable support.
- frontend 0.55.2 → 0.56.0: MODIFIED: `addons/PackageCenter/AddonGrid.tsx` — info dialog on double-tap (useDoubleTap), NmxMetaList with installedAt/version/author/description, e.stopPropagation() on all buttons. `AddonEventWatcher.tsx` — silent fetch full data after terminal status change. `i18n/locales/en.json` — new infoLabels keys. Theme CSS rebuilt.
- Namorix.Core 0.47.0 → 0.48.0: MODIFIED: `OAuth/NmxOAuth2Client.cs` — `ClientId` public property. `OAuth/OAuthEndpoints.cs` — added `Authorize` constant. NEW: `OAuth/NmxOAuthConfigEndpointExtensions.cs` — `MapNmxOAuthConfig()` extension method serving `/.well-known/nmx-oauth-config` for addon standalone OAuth discovery.

### 2026-07-25 — AddonService DTO join, DockerMonitorWorker cleanup, auth guard, loadAppearance fix, AddonInstallation move

- frontend 0.55.1 → 0.55.2: MODIFIED: `App.tsx` — unauthorized handler guard (skip redirect on `/login`/`/register`). `controllers/auth.controller.ts` — `loadAppearance()` bỏ try/catch (json() không throw), user settings call không gây navigation loop. `controllers/addon.controller.ts` — import path fix (AddonContainerStatus/AddonPendingPhase/ExternalAddonManifest từ local `../addons` thay `@namorix/core`). `store/slices/externalAddonsSlice.ts` — `updateAddonStatus` điền thêm `description`/`author`/`image` từ catalog entry. `addons/PackageCenter/AddonGrid.tsx` — SignalR handler gọi `loadData()` khi task hoàn thành.
- Namorix.Server 0.50.0 → 0.50.1: MODIFIED: `Services/AddonService.cs` — `GetInstalledAddonsAsync` dùng LEFT JOIN với `AddonCatalogEntries`, `AddonInstallationDto` lấy Name/Description/Icon/Author từ catalog thay vì installation record. MODIFIED: `Services/AddonTaskExecutor.cs` — bỏ copy Name/Description/Icon/Author từ catalog vào installation. MODIFIED: `Workers/DockerMonitorWorker.cs` — bỏ đọc Name/Description/Author từ container labels. REMOVED: `Namorix.Core/Models/AddonInstallation.cs` (moved to `Namorix.Server/Models/AddonInstallation.cs`).

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

### 2026-07-03 (2) — Refresh race condition fix, RememberMe preserve on token refresh

- @namorix/core 0.41.0 → 0.41.1: MODIFIED: `http/client.ts` — shared refresh promise (`refreshPromise`) để dedupe concurrent 401 refresh calls, tránh token reuse detection trên backend.
- frontend 0.52.0 → 0.52.1: MODIFIED: `AddonGrid.tsx` — `version: cat.version` → `version: installed?.version ?? cat.version` (hiển thị đúng version đã install thay vì lấy từ catalog).
- Namorix.Core 0.42.0 → 0.42.1: MODIFIED: `Models/RefreshToken.cs` — added `RememberMe` property.
- Namorix.Server 0.45.0 → 0.45.1: MODIFIED: `Services/AuthService.cs` — `RefreshToken()` dùng `storedToken.RememberMe` cho TTL tính toán, không còn hardcode 7 ngày. `Controllers/AuthController.cs` — `TryRefresh()` dùng `rememberMe` từ tuple cho `SetRefreshCookie`. NEW migration `AddRememberMeToRefreshToken`.

### 2026-07-03 — NotifyPendingTaskChanged wiring, error toast, LastErrorCode rename

- @namorix/core 0.40.0 → 0.41.0: MODIFIED: `addon/types.ts` — `AddonPendingPhase` type, `AddonPendingTaskPayload` interface, `lastErrorCode` + `pendingTaskPhase` fields on `ExternalAddonManifest`, `lastErrorCode` on `AddonStatusPayload`. `AddonContainerStatus` type promoted before `AddonModule`.
- @namorix/styles 0.35.0 → 0.36.0: MODIFIED: `package-center.scss` — new `__icon-status` BEM block (error icon styling). Icomoon icons rebuilt (fonts, variables, ttf, woff).
- @namorix/ui 0.25.0 → 0.26.0: MODIFIED: `NmxIconFont.types.ts` — `ERROR = "ic-error"` symbol.
- frontend 0.51.0 → 0.52.0: MODIFIED: `AddonEventWatcher.tsx` — toast on start/stop success + error via `formatAddonErrorCode`, `AddonUninstalled` handler. `AddonGrid.tsx` — `AddonPendingTaskChanged` handler for pending overlay, stats rename `total`→`installed` + `available` count, error badge on card. `addonError.ts` — `formatAddonErrorCode` function. `addon.controller.ts` — `pendingTaskPhase` + `lastErrorCode` in `AddonManifestDto`. `signalr/constants.ts` — `AddonPendingTaskChanged` + `AddonUninstalled` events. `externalAddonsSlice.ts` — `lastErrorCode` in `updateAddonStatus`. `en.json` — new error locale keys, `generic` error, stats template.
- Namorix.Core 0.41.0 → 0.42.0: MODIFIED: `Models/AddonInstallation.cs` — `LastErrorMessage` → `LastErrorCode`.
- Namorix.Server 0.44.0 → 0.45.0: MODIFIED: `Infrastructure/IAddonNotifier.cs` — `NotifyPendingTaskChanged` + `NotifyAddonUninstalled`. `Hubs/SignalRAddonNotifier.cs` — implementations for both. `Services/AddonTaskExecutor.cs` — `StartAsync`/`StopAsync` DB null check, Docker error → `AddonErrorCodes`, `UninstallAsync` uses `NotifyPendingTaskChanged` + `NotifyAddonUninstalled`. `Services/AddonTaskQueue.cs` — `NotifyPendingTaskChanged` in `SetErrorStatusAsync`, logger in catch. `Infrastructure/IAddonNotifier.cs`. NEW: `Constants/AddonError.cs`. MODIFIED: `Constants/Addon.cs` — `AddonTaskPending` renamed → `AddonTaskPendingStatus` + new constants (Installing, Updating, Pulling). `Constants/ServerSignalR.cs` — `AddonUninstalled` event. `Services/AddonService.cs` — inject `IAddonNotifier`, `SetTaskPending` calls `NotifyPendingTaskChanged`. NEW migration `RenameLastErrorCode`.`

### 2026-07-04 — OAuth2 private_key_jwt full implementation, registration flow, middleware exemption pattern

- Namorix.Core 0.42.3 → 0.43.0: NEW: `OAuth/NmxOAuth2Client.cs` — OAuth2 client with self-registration + token caching. `OAuth/NmxAddonConfig.cs` — addon config (reads env vars). `OAuth/NmxOAuth2ServiceCollectionExtensions.cs` — DI extension. `OAuth/OAuthEndpoints.cs` — endpoint constants. `OAuth/OAuthResponse.cs` — response DTOs. `Config/BackendConfig.cs` — RegistrationTokenTtlMinutes. `Constants/OAuth.cs` — OAuth env vars, defaults, grant types, params. `Constants/ExemptPaths.cs` — middleware bypass paths. `Models/OAuthRegistration.cs` — registration token entity. MODIFIED: `Constants/Error.cs` — OAuthErrors, OAuthRegisterErrors. `Middleware/CsrfMiddleware.cs` — ExemptPaths usage. `Middleware/JsonErrorMiddleware.cs` — ExemptPaths usage. `Namorix.Core.csproj` — new deps.
- Namorix.Server 0.45.3 → 0.46.0: NEW: `Migrations/20260704041156_AddOAuthRegistration.cs`. MODIFIED: `Controllers/OAuthController.cs` — register/token endpoints. `Services/OAuthService.cs` — full JWT RS256 verification. `Services/AddonTaskExecutor.cs` — registration token in InstallAsync. `Services/DockerService.cs` — passes NMX_REGISTRATION_TOKEN to containers. `Workers/TokenCleanupWorker.cs` — OAuthRegistration cleanup. `Persistence/AppDbContext.cs` — OAuthRegistration DbSet. `Program.cs` — OAuthService DI. `Constants/Addon.cs` — registration constants. `appsettings.json` — OAuth config.
- @namorix/core 0.41.2 → 0.41.3: MODIFIED: `addon/types.ts` — // TODO comments on `updating`/`pulling` status values.
- @namorix/styles 0.36.1 → 0.36.2: MODIFIED: `taskbar.scss` — clock font-size 4xl → 3xl.

### 2026-07-04 (2) — gRPC Addon Channel, revoke endpoint, NotifyAddonWidgetEvent

- Namorix.Core 0.43.0 → 0.44.0: NEW: `Protos/addon_channel.proto` — bidirectional gRPC Connect rpc. MODIFIED: `Constants/ExemptPaths.cs` — thêm `/api/oauth/revoke` vào NoCsrfSession. `Models/AddonInstallation.cs` — consistent `init` setters. `OAuth/NmxOAuth2Client.cs` — fix `File.Exists()` logic. `Namorix.Core.csproj` — Grpc.AspNetCore + Protobuf.
- Namorix.Server 0.46.0 → 0.47.0: NEW: `Services/AddonChannelManager.cs` — ConcurrentDictionary for active gRPC cancellation. `Services/Grpc/AddonChannelService.cs` — bidirectional streaming + interceptor auth + 5-min recheck. MODIFIED: `Controllers/OAuthController.cs` — revoke endpoint + ChannelManager injection. `Services/OAuthService.cs` — RevokeTokenAsync, IsAddonAuthorizedAsync, ValidateTokenAsync. `Infrastructure/IAddonNotifier.cs` + `Hubs/SignalRAddonNotifier.cs` — NotifyAddonWidgetEvent. `Constants/ServerSignalR.cs` — AddonWidgetEvent. `Middleware/OAuth2Middleware.cs` — Bearer prefix constant. `Program.cs` — AddGrpc + ChannelManager + MapGrpcService. `Namorix.Server.csproj` — Grpc.AspNetCore + Protobuf.

### 2026-07-13 — gRPC client module, Kestrel 2-port, CacheSignatureProviders fix

- Namorix.Core 0.44.0 → 0.45.0: NEW: `Grpc/AddonChannelClient.cs` — gRPC client with OAuth2 token + duplex stream. `Grpc/AddonChannelClientExtensions.cs` — DI extension. `Grpc/RetryConnectHostedService.cs` — auto-reconnect base class for addons. MODIFIED: `Constants/OAuth.cs` — GrpcUrl, DataDir constants. `OAuth/NmxAddonConfig.cs` — GrpcUrl property. `Namorix.Core.csproj` — protobuf with GrpcServices=Both.
- Namorix.Server 0.47.0 → 0.48.0: MODIFIED: `Program.cs` — Kestrel 2-port (5000 HTTP/1.1, 5002 HTTP/2), gRPC reflection. `Services/Grpc/AddonChannelService.cs` — recheck loop, widget-event logging, heartbeat handling. `Services/OAuthService.cs` — fix `CacheSignatureProviders = false` (RsaSecurityKey stale cache bug). `appsettings.Development.json` — gRPC logging level.

### 2026-07-13 (2) — Bug fixes: recheck loop, container conflict, EF cache

- Backend (Namorix.Core): AddonChannelClient _lifetimeCt fix. AddonHostedServiceBase rename.
- Backend (Namorix.Server): DockerService.RemoveContainerIfExistsAsync + GetContainerLogsAsync. AddonTaskExecutor gọi RemoveContainerIfExistsAsync trước create (tránh Docker Conflict). AddonChannelService recheck loop cancel linkedCts + log English. OAuthService.IsAddonAuthorizedAsync dùng AnyAsync + AsNoTracking (tránh EF cache).
- Versions: Namorix.Core 0.45.1, Namorix.Server 0.48.1.

### 2026-07-13 (3) — Client disconnect cleanup, server RpcException propagation, channelManager injection

- Backend (Namorix.Core): AddonChannelClient ReceiveLoopAsync — log + cleanup on RpcException(Cancelled), _call = null để IsConnected trả về false. AddonHostedServiceBase debug log.
- Backend (Namorix.Server): AddonChannelService throw RpcException(Cancelled) khi bị ChannelManager disconnect. AddonChannelManager debug Console.WriteLine. AddonTaskExecutor inject AddonChannelManager + gọi DisconnectAsync trong Uninstall/Stop. AddonTaskQueue pass channelManager tới executor.
- Versions: Namorix.Core 0.45.2, Namorix.Server 0.48.2.

### 2026-07-13 (4) — Package Center pending overlay recovery, double toast dedup

- Namorix.Server 0.48.2 → 0.48.3: MODIFIED: `Services/AddonTaskExecutor.cs` — `SetStatusAsync` returns `int` with `WHERE Status !=` dedup guard. `StartAsync`/`StopAsync` only call `NotifyAddonStatusChanged` if `changed > 0` (prevents double toast when DockerMonitorWorker processes stop event first). `UninstallAsync` reorder. MODIFIED: `Workers/DockerMonitorWorker.cs` — `HandleEventAsync` Destroy checks `PendingTaskPhase != Uninstalling` before Error (prevents error+success double toast during uninstall).
- frontend 0.52.3 → 0.52.4: MODIFIED: `PackageCenter/AddonGrid.tsx` — pending overlay recovery: `setPending`/`clearPending` with 30s timeout fallback + `resolvedPendingMap` useMemo reconcile with Redux status + `pendingTaskPhase` API mapping for on-mount recovery. SignalR handler simplified. MODIFIED: `controllers/addon.controller.ts` — `AddonManifestDto` added `pendingTaskPhase`. MODIFIED: `store/slices/externalAddonsSlice.ts` — `updateAddonStatus` clears `pendingTaskId`/`pendingTaskPhase` on terminal status.

### 2026-07-13 (5) — External addons on desktop with disabled state

- @namorix/styles 0.36.2 → 0.37.0: MODIFIED: `desktop.scss` — new `&__item--disabled` modifier with `filter: brightness(0.35)`, no hover background.
- frontend 0.52.4 → 0.53.0: MODIFIED: `DesktopArea.tsx` — merge external addons from Redux with builtin, fetch on mount via `addonController.list()`. `DesktopIcon.tsx` — new `disabled` prop + `onDisabledClick` (calls start API). `DesktopAreaView.tsx` — pass through props. `AddonGrid.tsx` — use shared `mapDtoToManifest`. `addon.controller.ts` — new `mapDtoToManifest` helper. `externalAddonsSlice.ts` — `updateAddonStatus` includes `icon` from catalog. `addon-item.ts` — `disabled?: boolean` on AddonItem.

### 2026-07-23 — External addon entry port, catalog schema update, MF desktop integration

- Namorix.Core 0.45.2 → 0.46.0: MODIFIED: `Models/AddonInstallation.cs` — new `Ports` property (JSON string) for full port list.
- Namorix.Server 0.48.3 → 0.49.0: NEW: `Migrations/20260723094003_AddPortsToAddonInstallations.cs` — migration adding Ports column. MODIFIED: `Models/Catalog/PortDto.cs` — new `Entry` boolean field. MODIFIED: `Services/AddonTaskExecutor.cs` — new `GetEntryPort()` prioritizes port with `"entry": true`, falls back to first port. `ParseCatalogPorts` now sets `HostPort = container` for direct port bind. `InstallAsync` saves `HostPort` and `Ports` on creation. MODIFIED: `catalog/schema/addon-v1.json` — ports items gain optional `entry` boolean.
- @namorix/core 0.41.3 → 0.42.0: MODIFIED: `addon/types.ts` — `AddonContext.containerUrl` removed (dead code). `package.json` — tsup build setup for external addon consumption.
- frontend 0.53.0 → 0.54.0: MODIFIED: `DesktopArea.tsx` — catalog port used as baseUrl when addon not running, `hostPort` when running. Error addons no longer filtered (shown disabled). MF entry registered via `createExternalAddonEntry` with `baseUrl`. `externalAddonEntry.ts` — accepts optional `baseUrl` param, removed `containerUrl`. `addon.controller.ts` — `AddonManifestDto` added `ports` field.

### 2026-07-24 (2) — OAuth PKCE standalone mode, createMount auto OAuth, M4 completion

- @namorix/core 0.43.0 → 0.44.0: NEW: `oauth/` module — PKCE browser client (authorizeRedirect, handleRedirectCallback, getAccessToken, sha256 fallback, constants). MODIFIED: `mount/createMount.tsx` — auto OAuth flow on standalone mode (check URL callback → exchange token / redirect authorize). `mount/` folder with barrel export. `apiRoutes.ts` — ApiOAuthRoutes.
- @namorix/styles 0.38.0 → 0.38.1: MODIFIED: `rail.scss` — layout fixes. `window.scss` — shell component tweaks. Theme CSS rebuilt.
- frontend 0.55.0 → 0.55.1: MODIFIED: `useAddonMount.ts`, `WindowFrame.tsx`, `WindowFrameView.tsx`, `WindowFrame.types.ts` — OAuth context in AddonContext.
- Namorix.Core 0.46.1 → 0.47.0: MODIFIED: `Models/OAuthAuthorizationCode.cs` — added CodeChallenge + CodeChallengeMethod fields. `Constants/OAuth.cs` — added CodeVerifier constant.
- Namorix.Server 0.49.1 → 0.50.0: MODIFIED: `Controllers/OAuthController.cs` — authorize endpoint rewritten (session check, PKCE params, login redirect). Token endpoint supports code_verifier. `Services/OAuthService.cs` — CreateAuthorizationCodeAsync accepts codeChallenge params, ExchangeCodeAsync supports PKCE verification + client_assertion fallback.
- REMOVED: `.claude/plans/m4-external-addon-system.md` — M4 complete.
- README: Updated for M4 completion (features, external addons widget/standalone, milestones).

- @namorix/core 0.42.0 → 0.43.0: NEW: `createMount.tsx` — wraps component with AddonModeProvider, 1-line mount for addons. NEW: `host.ts` — AddonModeProvider, useAddonMode, useIsWidget, useIsStandalone. NEW: `i18n/ensure.ts` — ensureI18n for external addons. MODIFIED: `i18n/index.ts` — new loadAll method. MODIFIED: `index.ts` — removed addon barrel, added createMount + host exports. REMOVED: `addon/` folder (moved to frontend).
- @namorix/styles 0.37.0 → 0.38.0: MODIFIED: Icon font restructured — fonts moved into package `base/icomoon/fonts/`, relative path for Vite resolution. `index.scss` updated.
- frontend 0.54.0 → 0.55.0: MODIFIED: `addons/` — types, factory, context moved from core. `windowsSlice.ts` — NEW closeWindowsByAddonId reducer. `externalAddonEntry` — passes `mode: widget` via context, removed root/render logic. `DesktopArea` — updated for moved imports. `vite.config`, `docker-compose`, `.env` — port 5174→5000, proxy 5000→5001. 8 builtin addon imports updated. `useAddonMount`, `useOpenWindow` paths updated. `Register.tsx` import fix.
- Namorix.Core 0.45.2 → 0.46.1: MODIFIED: `BackendConfig.cs` — port default 5000→5001.
- Namorix.Server 0.48.2 → 0.49.1: MODIFIED: `Program.cs`, `appsettings.json`, `launchSettings.json` — port defaults updated to new scheme.

- Namorix.Core 0.45.0 → 0.45.1: MODIFIED: `Grpc/AddonChannelClient.cs` — `_lifetimeCt` fix (dùng `_lifetimeCt` thay `_cts.Token` trong `ScheduleTokenRefreshAsync`). MODIFIED: `Grpc/AddonHostedServiceBase.cs` — rename from `RetryConnectHostedService`. MODIFIED: `OAuth/NmxOAuth2Client.cs` — CurrentTokenExpiresAt accessor.
- Namorix.Server 0.48.0 → 0.48.1: MODIFIED: `Services/DockerService.cs` — new `RemoveContainerIfExistsAsync`, `GetContainerLogsAsync`. MODIFIED: `Services/AddonTaskExecutor.cs` — gọi `RemoveContainerIfExistsAsync` trước `CreateContainerAsync` (tránh Docker Conflict khi addon đã có container). MODIFIED: `Services/Grpc/AddonChannelService.cs` — `RecheckLoopAsync` cancel linkedCts trước throw, log English. MODIFIED: `Services/OAuthService.cs` — `IsAddonAuthorizedAsync` dùng `AnyAsync` + `AsNoTracking` (tránh EF identity map cache trả true sau khi DB record đã xoá).

### 2026-07-03 (4) — InstallAsync catalog rewrite, frontend catalog store, identity cleanup

- Namorix.Core 0.42.2 → 0.42.3: MODIFIED: `Constants/Error.cs` — ADDON_NOT_FOUND error code.
- Namorix.Server 0.45.2 → 0.45.3: MODIFIED: `Services/AddonTaskExecutor.cs` — InstallAsync full rewrite: catalog lookup, null check for catalogEntry, ParseCatalogPorts, proper AddonStatus.Installed (not Running), Docker error handling. `Services/DockerService.cs` — ImageExistsLocallyAsync, container Name = spec.AddonId. `Controllers/AddonController.cs` — use request.Id instead of computed AddonId. `Services/AddonService.cs` — InstallRequest simplified to just Id. REMOVED: `Helpers/AddonHelper.cs` (ComputeAddonId unused).
- frontend 0.52.2 → 0.52.3: MODIFIED: `store/slices/externalAddonsSlice.ts` — catalog state + setCatalog reducer, updateAddonStatus creates minimal entry for new addons with name from catalog. `store/selectors/externalAddonSelectors.ts` — selectorCatalog. `addons/PackageCenter/AddonEventWatcher.tsx` — catalogRef fallback for name, "installed" toast handler. `addons/PackageCenter/AddonGrid.tsx` — handleInstall simplified (id only), Redux catalog integration. `controllers/addon.controller.ts` — InstallAddonDto simplified (id only). `addons/PackageCenter/addonError.ts` + `constants/error.ts` — ADDON_NOT_FOUND. `i18n/locales/en.json` — installed key.
- @namorix/core: REMOVED: `addon/utils.ts` — computeAddonId (no longer needed).

### 2026-07-03 (3) — F5 refresh race fix, ContainerId separation, toast dedup

- @namorix/core 0.41.1 → 0.41.2: MODIFIED: `http/client.ts` — bỏ `ApiAuthRoutes.session` khỏi interceptor exclusion list, session 401 dùng shared refresh promise với các request khác. MODIFIED: `addon/types.ts` — simplify `AddonContainerStatus` union (xóa unused states).
- @namorix/styles 0.36.0 → 0.36.1: MODIFIED: `package-center.scss` — thêm `.running` (success) và `.stopped` (warning) color cho `__icon-status` block.
- frontend 0.52.1 → 0.52.2: MODIFIED: `AddonGrid.tsx` — version display fix (`installed?.version ?? cat.version`), status icon cải thiện (running/stop/error icons với color), stop button semantic `success`→`default`.
- Namorix.Core 0.42.1 → 0.42.2: MODIFIED: `Models/AddonInstallation.cs` — thêm `ContainerId` property.
- Namorix.Server 0.45.1 → 0.45.2: MODIFIED: `Controllers/AuthController.cs` — `Session()` không còn gọi `TryRefresh()` (trả về 401 luôn nếu thiếu/expired access token), không clear refresh cookie khi session fail. MODIFIED: `Services/AddonTaskExecutor.cs` — `StartAsync`/`StopAsync`/`UninstallAsync` dùng `addon.ContainerId` thay vì `addonId` cho Docker operations. Xoá `FindContainerIdAsync`. MODIFIED: `Workers/DockerMonitorWorker.cs` — `SetAddonStatusAsync` thêm guard `&& a.Status != status` tránh duplicate notification. `SyncSingleAddon` sync `ContainerId`. Orphan cleanup: xóa DB record + `NotifyAddonUninstalled` thay vì set Error status. NEW migration `AddContainerIdToAddonInstallations`.

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
