# Active Context

## Current Work Focus

M4 — External Addon System ✅ Complete

- Desktop shell: Taskbar, DesktopArea, WindowManager, Launcher ✅
- DesktopArea + Taskbar refactored into modular sub-components (DesktopIcon, DesktopAreaView, TaskbarAppButton, TaskbarView) ✅
- New useTaskbarClock hook for live clock ✅
- Addon contract dùng chung cho system + external: AddonEntry, NmxAddonManifest, AddonContext
- Internal addon (built-in) và external addon (Docker) — cùng contract, khác cách load + permission
- Frontend: `addons/registry.ts` (registerAddon, resolveAddon, listAddons), `*.addon.ts`, bootstrap qua `addons/index.ts`
- LogViewer addon: LogViewer.tsx + LogViewer.scss + LogViewer.addon.tsx (useEffect+registry mount)
- Backend addon metadata deferred — chỉ cần khi M4 external addon
- WindowFrame mount addon vào content area qua ref + AddonEntry lifecycle

### ✅ State Management Rewrite — COMPLETE (2026-05-19)

- Rewrite từ Zustand → Redux Toolkit: 4 store → 3 slice, 10 component files
- State normalized: `byId: Record<Id, WindowData>` + `order: Id[]`
- Gộp window + geometry + animation vào `windowsSlice`
- Memoized selectors với `createSelector`, `useAppSelector` mặc định `shallowEqual`
- Taskbar buttons không re-render khi drag/resize nhờ selector tối ưu
- Xóa 5 file Zustand store cũ (`stores/`)

## Recent Changes

Xem chi tiết tại [versionHistory-08-2026.md](versionHistory-08-2026.md), [versionHistory-07-2026.md](../archive/versionHistory-07-2026.md), [versionHistory-06-2026.md](../archive/versionHistory-06-2026.md) và [versionHistory-05-2026.md](../archive/versionHistory-05-2026.md).

### 2026-08-03 — Beacon DDNS addon đầy đủ + config validation + error i18n

- Backend (Namorix.Server 0.60.0): Beacon full — BcnController (hostnames CRUD/toggle/test/activity/providers/settings/status), BcnProviderRegistry + 6 provider + custom SimpleGet/RestJson, BcnCheckWorker (update loop, backoff, status active/disabled/error), BcnActivityCleanupWorker (pruning 7d), IPublicIpDetector/PublicIpService, migrations. **Config validation 2 lớp**: runtime guard trong provider + save-time `BcnController.ValidateConfig` (built-in qua registry CredentialFields, custom theo Kind) → `BCN_CONFIG_INVALID` + `ApiResponse.Fail(..., field)`. Frontgate ACME: AcmeChallengeMiddleware + AcmeCertQueue + AcmeChallengeStore + FgErrorCodes. NEW dep Certes.
- Namorix.Core 0.53.0: ApiResponse thêm `Params` field (additive) cho i18n params.
- @namorix/core 0.54.0: Beacon API routes, ApiResponse/ApiError `params` field, `formatCustomError` giờ inject `{ field, ...meta }` vào `t()` (interpolate `{{field}}`).
- @namorix/ui 0.36.0 + @namorix/styles 0.46.0: NEW NmxLogList, NmxAlign; NmxRail footer prop; NmxDataTable rowCellSpacing; beacon/log-list/align SCSS; icomoon + theme rebuild.
- frontend 0.69.0: Beacon addon 3 tab (hostnames NmxDataTable + add/edit dialog + provider grid + custom toggle + Test connection; activity NmxLogList; settings). Error handling Beacon-local: `formatBeaconError` (configInvalid + configFields map), `missingField` pre-check, `fieldLabel` (TDZ fix — khai báo trước handleConfirm), authOptions bỏ `query`. en.json +186.
- Frontend cache: các addon khác đổi `NmxDataTableFallback` → `NmxFallback`.

### 2026-07-28 — Frontgate Phase 2: Certificate domain table, createdAt column, Issues tab, rowCellSpacing, UTC parse fix

- @namorix/core 0.52.0 → 0.53.0: apiRoutes — unused-domains route. useDateTimeFormat timestamp→dateTime rename. format.ts UTC parse fix (parseUTCDate).
- @namorix/styles 0.45.0 → 0.45.1: data-table.scss rowCellSpacing via sizes mixin. select.scss fixes. frontgate.scss updates. Theme CSS rebuild.
- @namorix/ui 0.34.0 → 0.35.0: NmxDataTable rowCellSpacing prop. NmxSelect/NmxTagInput bug fixes.
- frontend 0.67.0 → 0.68.0: FrontgateCertificate createdAt column, expiresAt status-aware fix, Issues tab button. FrontgateReverseProxy createdAt column, domain list fix, rowCellSpacing. frontgate.controller new types/unusedDomains. en.json i18n additions.
- Namorix.Core 0.52.0 → 0.52.1: ServiceCollectionExtensions internal changes.
- Namorix.Server 0.58.0 → 0.59.0: NEW FgCertificateDomain model + migration. GetUnusedCertDomains endpoint. FgCertificate CreatedAt field.

### 2026-07-28 — Frontgate Phase 2: Certificate creation dialogs, file storage, NmxFileInput, DNS providers

- @namorix/core 0.51.0 → 0.52.0: apiRoutes.ts — 3 new cert routes (letsencrypt-http, letsencrypt-dns, custom), dnsProviders, certificatesAll.
- @namorix/styles 0.44.1 → 0.45.0: NEW file-input.scss. form.scss/select.scss tweaks. Icomoon rebuild.
- @namorix/ui 0.33.0 → 0.34.0: NEW NmxFileInput primitive (hidden input, click area, icon swap). NmxAlertDialog confirmDisabled prop. NmxLoadingOverlay createPortal fix. FILE_LINK/UPLOAD icon symbols.
- frontend 0.66.0 → 0.67.0: 3 cert dialogs (letsEncryptHttp, letsEncryptDns, custom) with domain/keyType/DNS provider/NmxFileInput fields, confirmDisabled, resetForm. New frontgate.controller payload types + create functions + listDnsProviders. i18n en.json +124 lines (dnsProviders, dialogs).
- Namorix.Server 0.57.0 → 0.58.0: NEW DnsProviders model (~80 providers). 3 POST cert endpoints with file-based storage via DataDirectory.WriteFile. FgCertificate KeyPath/CertPath replacing PEM columns. DnsProviderId field.

- @namorix/ui 0.32.0 → 0.33.0: NmxMenuButton dividerIndexes prop refactor — replaced `divider?: boolean` on option with `dividerIndexes?: { value, position }[]` on props. Divider follows option by value, renders above/below. filterItem edge case: no options → hide trigger. NEW `APP_BEACON` icon symbol.
- @namorix/styles 0.44.0 → 0.44.1: Menu button divider SCSS styles, button/frontgate/dark tokens tweaks. NEW `--nmx-icon-app-beacon` icon token.
- frontend 0.65.0 → 0.66.0: FrontgateCertificate 3-state filterItem (pending→delete only, error→retry+delete, other→renew+download+delete). dividerIndexes on action menu. LogViewer pagination repositioned (below data table). NEW internal addon **Beacon** (DNS updater — scaffold). Beacon i18n keys, app-beacon.svg icon, addon registration.
- Namorix.Server 0.56.0 → 0.57.0: NEW FgCertPendingResetWorker — one-shot BackgroundService resetting Pending→Error on startup.

### 2026-07-26 — Frontgate Phase 1: Edit dialog, delete confirm, ForceSsl middleware, port 80/443

- @namorix/core 0.49.0 → 0.50.0: NEW `formatCustomError` with `codeMap` parameter for error code → i18n translation mapping.
- @namorix/styles 0.41.1 → 0.42.0: Dialog, toast, frontgate SCSS updates, elevation token fix.
- @namorix/ui 0.30.1 → 0.30.2: NmxKeyValueEditor, NmxToastProvider, NmxSelect fixes.
- frontend 0.62.0 → 0.63.0: Edit dialog with pre-filled form, delete with confirmation dialog, Status dropdown now functional. `updateSuccess`/`updateError`/`deleteSuccess`/`deleteError` i18n keys.
- Namorix.Core 0.52.0 → 0.53.0: JsonStringEnumConverter(CamelCase) for lowercase enum serialization.
- Namorix.Server 0.55.0 → 0.56.0: ForceSsl redirect middleware (ConcurrentDictionary + HTTP→HTTPS 301), port 80/443 optional Kestrel binding, Edit/Delete CRUD endpoints, Status fix in CreateRuleRequest, ListRules Include Locations, FrontgateProxyConfigProvider.ForceSslSources.

### 2026-07-26 — Frontgate Phase 1: Form submit + validation, backend validation, toast createPortal, error codes

- @namorix/core 0.48.0 → 0.49.0: NEW `formatServerError` — looks up `err.code` as i18n key, returns `string | ApiError` for flexible error handling. Toast error handling improved.
- @namorix/styles 0.41.0 → 0.41.1: Toast SCSS z-index fix, elevation token fix.
- @namorix/ui 0.30.0 → 0.30.1: NmxToastProvider wrapped in createPortal(document.body) — fixes toast behind dialog overlay (stacking context).
- frontend 0.61.0 → 0.62.0: Frontgate form submit + validation, handleConfirm with .then().catch().finally(), formSubmitting loading state. Frontgate i18n error codes (ruleNotFound, duplicateSource).
- Namorix.Core 0.51.0 → 0.52.0: NEW validation rules — FormatValidationRule.Trim, JsonValidationRule, CollectionValidationRule.
- Namorix.Server 0.54.0 → 0.55.0: Frontgate backend validation via [Validate(FrontgateRuleSchema)], duplicate source check, Enum.Parse ignoreCase fix, Locations navigation property.

### 2026-07-26 — Frontgate Phase 1: Floating UI NmxSelect, NmxKeyValueEditor, Locations, 4-tab consolidation

- @namorix/core 0.47.0 → 0.48.0: `apiRoutes.ts` — added `certificates` route. `toast/toast.types.ts` — `message` type fix.
- @namorix/styles 0.40.0 → 0.41.0: New `key-value-editor.scss`. Floating UI select refactor. icomoon rebuild.
- @namorix/ui 0.29.0 → 0.30.0: NEW `NmxKeyValueEditor`. NmxSelect Floating UI migration. NmxAlertDialog `extraAction`/`noSpacingBody`/`noBodyScrollbar`. New `CODE`, `ADVANCED` icon symbols. `@floating-ui/react` dep added.
- frontend 0.60.0 → 0.61.0: FrontgateReverseProxy 4-tab form (General/Headers/Locations/Advanced). Floating UI NmxSelect for certificate/status/access. NmxKeyValueEditor for headers. Card-based location editor. Certificate selector with None/Request new/real certs. Location CRUD. i18n keys.
- Namorix.Server 0.53.0 → 0.54.0: `ListCertificates` endpoint. Locations support in CreateRule/UpdateRule.

### 2026-07-26 — Frontgate Phase 1: YARP integration, CRUD API, full form UI

- @namorix/ui 0.28.1 → 0.29.0: NEW `NmxTabs` generic tab component (controlled/uncontrolled). NEW `NmxFormRow` flex row layout. MODIFIED `NmxFormField` — added `rowFlex` prop. `NmxAlertDialog` — added `noSpacingBody` (flush) prop.
- @namorix/styles 0.39.1 → 0.40.0: SCSS updates for tabs and frontgate form.
- @namorix/core 0.46.0 → 0.47.0: `apiRoutes.ts` — new `ApiFrontgateRoutes` (reverseProxy, reverseProxyById).
- frontend 0.59.0 → 0.60.0: New `frontgate.controller.ts` with full CRUD methods + types. `FrontgateReverseProxy.tsx` — full form dialog with 3-tab layout (General/Features/Security), NmxFormRow destination fields, toggles for WebSockets/Cache/HTTP2/ForceSSL/HSTS/BlockExploits, resetForm pattern.
- Namorix.Core 0.50.0 → 0.51.0: `ApplicationBuilderExtensions` — added `configureEndpoints` callback for clean Core/Server separation.
- Namorix.Server 0.52.0 → 0.53.0: NEW `FrontgateProxyConfigProvider` — YARP IProxyConfigProvider reading active rules from DB with CancellationChangeToken. NEW `FrontgateController` — full CRUD (ListRules/CreateRule/UpdateRule/DeleteRule), each write calls `UpdateAsync()` for runtime reload. `FgReverseProxyRule` — added `BlockCommonExploits`. YARP DI in Program.cs via configureEndpoints. New migration `AddBlockCommonExploits`.

### 2026-07-25 — OAuth reuse detection, formatHttpError, Frontgate pages, token cleanup

- @namorix/core 0.45.0 → 0.46.0: NEW `useUserRoleAdmin` hook, `formatHttpError` function with FORBIDDEN/HTTP error codes. Toast error resolution now covers all error categories.
- Frontend 0.58.0 → 0.59.0: Frontgate TSX with NmxToolbar (Reverse Proxy, Certificate, Error Pages tabs) + 3 scaffold components. DesktopArea role guard for admin API calls. Window minimize/restore bug fix.
- Namorix.Core 0.49.0 → 0.50.0: NEW `OAuthRefreshErrors` constants. `DeleteCookie` extension method added.
- Namorix.Server 0.51.0 → 0.52.0: OAuth refresh token reuse detection — token reused → revoke entire chain + return `TOKEN_REUSED`. TokenCleanupWorker mở rộng cleanup `OAuthAuthorizationCodes` + `OAuthTokens`. OAuthConsent model + table removed.
- @namorix/styles 0.39.0 → 0.39.1: SCSS tweaks, icomoon rebuild.
- @namorix/ui 0.28.0 → 0.28.1: Icon type updates.

### 2026-07-25 — Frontgate addon scaffold

- New internal addon "Frontgate" — reverse proxy management UI for routing traffic to addons via custom domains/subdomains.
- @namorix/styles: added `--nmx-icon-app-frontgate` icon token (0.38.2 → 0.39.0).
- @namorix/ui: added `APP_FRONTGATE` icon symbol (0.27.0 → 0.28.0).
- Frontend: Frontgate addon folder with manifest + empty component, registered in addons/index.ts, types updated, i18n keys added (0.57.0 → 0.58.0).

### 2026-07-25 — OAuth PKCE cookie refresh, Base64 fix, createMount OAuth flow

- Backend (Namorix.Core): NEW `HttpResponseExtensions.SetCookie` — reusable cookie setter (HttpOnly, SameSite=Lax, Path=/api). NEW `OAuthRefreshToken` entity for token rotation. NEW `TokenHash` utility (SHA256). AppConfig thêm `OAuthRefreshTokenTtlDays`. Cookie constant `AddonRefreshToken`.
- Backend (Namorix.Server): NEW `FrontendConfig` — frontend URL config. BackendConfig moved từ Core → Server. OAuth PKCE full flow — authorize redirect via login page with returnUrl, token exchange with PKCE verification, refresh token rotation via `nmx_addon_refresh_token` cookie. AuthController dùng SetCookie extension. TokenCleanupWorker mở rộng cleanup OAuthRefreshTokens. New migration `AddOAuthRefreshToken`. Base64UrlEncode → Convert.ToBase64String fix cho TokenHash compatibility.
- Core (@namorix/core): OAuth code in `createMount.tsx` uncommented — handleRedirectCallback, trySilentRefresh, authorizeRedirect now execute. `browser.ts` silent refresh dùng desktopUrl trích từ oauthConfig.tokenUrl.
- Frontend: Login page handles returnUrl from OAuth authorize redirect. i18n updates.
- Fixes: Cookie path `/api/oauth/token/refresh` → `/api` (browser discards Set-Cookie when resp path ≠ cookie path). RefreshToken endpoint dùng `CookieName.AddonRefreshToken`.
- Versions: @namorix/core 0.45.0, frontend 0.57.0, Namorix.Core 0.49.0, Namorix.Server 0.51.0.

### 2026-07-25 (2) — parseUTCDate timezone fix, addon info dialog, OAuth config endpoint, silent refresh

- Core: `parseUTCDate()` helper added to `utils/format.ts` — fixes `installedAt` showing wrong relative time due to missing timezone info. `formatRelativeTime` now uses it for all date parsing.
- UI: NmxCard gains `onClick` prop. NmxAlertDialog/NmxDialog extended. base.ts updated with WithClickable type.
- Styles: New `__card-clickable` SCSS block in package-center. Dialog tweaks.
- Frontend: AddonGrid adds info dialog on double-tap (useDoubleTap + NmxMetaList) showing installedAt/version/author/description. All button handlers use `e.stopPropagation()` to prevent card hover + button hover conflict. AddonEventWatcher does silent full data reload after terminal status change (no loading flag).
- Backend: `NmxOAuth2Client.ClientId` public, `OAuthEndpoints.Authorize` added. New `NmxOAuthConfigEndpointExtensions` — `MapNmxOAuthConfig()` serves `/.well-known/nmx-oauth-config` for addon standalone OAuth discovery.
- Versions: @namorix/core 0.44.1, @namorix/styles 0.38.2, @namorix/ui 0.27.0, frontend 0.56.0, Namorix.Core 0.48.0.

### 2026-07-25 — AddonService DTO join, DockerMonitorWorker cleanup, auth guard, loadAppearance fix

- Backend: AddonInstallation model moved from Namorix.Core → Namorix.Server. AddonService `GetInstalledAddonsAsync` LEFT JOIN với AddonCatalogEntries, DTO lấy Name/Description/Icon/Author từ catalog. AddonTaskExecutor bỏ copy cosmetic fields. DockerMonitorWorker bỏ đọc labels (Name/Description/Author). Migration files consolidated.
- Frontend: `App.tsx` unauthorized handler guard — skip redirect nếu đang ở `/login`/`/register` (tránh navigation loop khi 401 từ `loadAppearance()`). `loadAppearance()` bỏ try/catch — `json()` không throw, `userRes.success` handle đúng. `externalAddonsSlice.updateAddonStatus` điền thêm description/author/image từ catalog. Import path fix cho 3 type (AddonContainerStatus, AddonPendingPhase, ExternalAddonManifest) từ `@namorix/core` → local `../addons`.
- Versions: frontend 0.55.2, Namorix.Server 0.50.1.
- Core: `addon/types.ts` — `displayName`→`name`, `nmxStore` optional. Icomoon rebuild + new icon symbols. NmxIcon types updated.
- Backend: AddonManifest `DisplayName`→`Name`, `Description`/`Author` set. DockerMonitor reads Description/Author from container labels. AddonLabels constants expanded.
- Frontend: All 8 builtin addon manifests renamed `displayName`→`name`. PackageCenter full refactor (Rail+Grid+Card). Controllers, components, selectors updated. New i18n keys.
- Styles: New `package-center.scss`, icon tokens, theme CSS rebuilt.

### 2026-06-30 (2) — Addon catalog sync, NmxIconSvg URL support, NmxGrid cols fix, AddonManifest→AddonInstallation
- Backend: CatalogSyncWorker (dual-delay background sync, success=SyncInterval, failure=RetryDelay). CatalogService (catalog index fetch + manifest sync + TTL check). AddonCatalogConfig. AddonCatalogEntry DB entity. Catalog DTOs. AddonController GET catalog + POST sync. DI wiring in Program.cs. AddonService GetCatalogAsync/RefreshCatalogAsync. AddonManifest→AddonInstallation rename (AppDbContext migration, DockerMonitorWorker, OAuthService).
- Core: AddonCatalogEntry type, catalog API routes. NmxIconSvg src prop for external URL icon.
- UI: NmxIconSvg src prop — renders `<img>` with fallback to SVG symbol on error. NmxGrid cols fix — numeric cols uses `repeat(N, 1fr)`.
- Styles: icon-svg.scss `.symbol` class with background-image support. Theme CSS rebuilt.
- Frontend: AddonGrid component (catalog+installed merge). PackageCenter catalog tab + refresh button. Catalog loading/empty i18n keys.

### 2026-07-01 — AuthService ExecuteDeleteAsync concurrency fix, NmxGrid wrapping fix
- Backend: AuthService `RevokeAllUserTokens` refactored to `ExecuteDeleteAsync` — eliminates `DbUpdateConcurrencyException` khi concurrent revoke (fingerprint mismatch race condition).
- UI: NmxGrid dùng `repeat(auto-fill, minmax(...))` thay `repeat(N, 1fr)` khi có `minColWidth` — items wrap đúng khi container hẹp.
- Styles: icon-svg.scss, package-center.scss tweaks. Theme CSS rebuilt.
- Frontend: AddonGrid wrapping fix.

### 2026-07-02 (2) — AddonTaskExecutor full impl, useSignalREvent deferred registration, AddonGrid stats/optimistic pending
- Core: `AddonStatusPayload` type, `"starting"` in `AddonContainerStatus` union. `useSignalREvent` deferred registration via `addStatusHandler`/`removeStatusHandler` (registers callback when connection not ready).
- Backend: `AddonTaskPending` extracted constants. `AddonTaskExecutor` full impl — `StartAsync`/`StopAsync`/`UninstallAsync` with Docker calls + `SetStatusAsync` + `IAddonNotifier`. Controller `SetTaskPending` calls with typed constants.
- Frontend: AddonGrid stats bar (total/running/stopped), handleStart optimistic pending with error rollback, installed-first sort, updated tab filters by `hasUpdate`. `AddonEventWatcher` uses `AddonStatusPayload`, `useServerSignalREvent` uncommented (now active). Removed dead `useAddonEvents` hook + Desktop import.
- Styles: `package-center.scss` — `__stats` block, rail `flex: 1`.
- Versions: core 0.40.0, styles 0.35.0, frontend 0.51.0, Namorix.Server 0.44.0.

### 2026-07-03 (2) — Refresh race condition fix, RememberMe preserve on token refresh

- Core: HTTP client shared refresh promise (`refreshPromise`) — dedupe concurrent 401 calls, tránh token reuse detection.
- Frontend: AddonGrid version display bug fix — dùng `installed?.version ?? cat.version` thay vì `cat.version`.
- Backend: `RefreshToken` entity thêm `RememberMe` property. `AuthService.RefreshToken()` dùng `storedToken.RememberMe` cho TTL. `AuthController.TryRefresh()` dùng `rememberMe` từ tuple cho cookie. Migration mới `AddRememberMeToRefreshToken`.
- Versions: core 0.41.1, frontend 0.52.1, Namorix.Core 0.42.1, Namorix.Server 0.45.1.

### 2026-07-04 — OAuth2 private_key_jwt full implementation, registration flow, middleware exemption

- Backend (Namorix.Core): NEW OAuth2 module — `NmxOAuth2Client` (self-registration + token caching), `NmxAddonConfig` (env var config), DI extension, endpoint constants, response DTOs. NEW `Config/BackendConfig.cs` — `RegistrationTokenTtlMinutes`. NEW `Constants/OAuth.cs` — env vars, defaults, grant types. NEW `Constants/ExemptPaths.cs` — middleware bypass cho OAuth endpoints. NEW `Models/OAuthRegistration.cs`. MODIFIED: `Constants/Error.cs` — OAuth errors. `Middleware/CsrfMiddleware.cs` + `JsonErrorMiddleware.cs` — ExemptPaths pattern.
- Backend (Namorix.Server): `OAuthController` — register/token endpoints. `OAuthService` — full JWT RS256 verification. `AddonTaskExecutor` — registration token gen. `DockerService` — passes `NMX_REGISTRATION_TOKEN` to containers. `TokenCleanupWorker` — OAuthRegistration cleanup.
- Core: `addon/types.ts` — // TODO comments.
- Styles: `taskbar.scss` — clock font-size 4xl → 3xl.
- Versions: Namorix.Core 0.43.0, Namorix.Server 0.46.0, @namorix/core 0.41.3, @namorix/styles 0.36.2.

### 2026-07-13 — gRPC client module, Kestrel 2-port, CacheSignatureProviders fix

- Backend (Namorix.Core): NEW Grpc/ module — AddonChannelClient (gRPC client with OAuth2 token + duplex stream), AddonChannelClientExtensions (DI), RetryConnectHostedService (auto-reconnect base class). MODIFIED: OAuth.cs — GrpcUrl, DataDir constants. NmxAddonConfig — GrpcUrl property. Core.csproj — protobuf GrpcServices=Both.
- Backend (Namorix.Server): Kestrel 2-port config (5000 HTTP/1.1, 5002 HTTP/2), gRPC reflection dev-only. AddonChannelService — recheck loop, widget-event logging, heartbeat handling. OAuthService — CacheSignatureProviders = false fix (RsaSecurityKey stale cache bug).
- Versions: Namorix.Core 0.45.0, Namorix.Server 0.48.0.

### 2026-07-24 — Addon refactor to frontend, core modules, port restructure, external addon DX

- Core (0.43.0): NEW `createMount` — wraps component with AddonModeProvider, addon dev chỉ cần 1 dòng. NEW `host.ts` — AddonModeProvider, useAddonMode, useIsWidget, useIsStandalone. NEW `i18n/ensure.ts` — ensureI18n utility for external addons. NEW `NmxI18n.loadAll` method. tsup build setup complete. `addon/` module moved to frontend (package boundary fix). `containerUrl` removed.
- Frontend (0.55.0): Addon types/factory/context moved from core to `frontend/src/addons/`. NEW `closeWindowsByAddonId` in windowsSlice. `externalAddonEntry` simplified — passes `mode: widget` via context. `createMount` + `AddonModeProvider` handle mode detection. `DesktopArea` updated for new flow. Built-in addons import from local path instead of core.
- Styles (0.38.0): Icon font bundle restructured — fonts moved into package, relative path via Vite resolve.
- Backend (Namorix.Core 0.46.1, Namorix.Server 0.49.1): Port defaults updated to new scheme (Frontend 5000, Backend REST 5001, gRPC 5002, Weave 5100). Docker compose + .env + launchSettings synced.
- README: New Ports section with full addon port table. Quick start port references updated.
- Versions: @namorix/core 0.43.0, @namorix/styles 0.38.0, frontend 0.55.0, Namorix.Core 0.46.1, Namorix.Server 0.49.1.

### 2026-07-24 (2) — OAuth PKCE standalone mode, M4 completion

- Core (0.44.0): NEW `oauth/` module — PKCE browser client (authorizeRedirect, handleRedirectCallback, sha256 fallback, constants). MODIFIED `createMount` — auto OAuth flow on standalone mode (check URL callback → exchange token / redirect authorize). NEW `mount/`, `oauth/` barrel exports.
- Backend: OAuthAuthorizationCode PKCE fields (CodeChallenge, CodeChallengeMethod). Authorize endpoint rewritten with session check + PKCE params. Token endpoint supports code_verifier. ExchangeCodeAsync PKCE verification + client_assertion fallback.
- README: M4 milestone ✅. External addons section updated (widget/standalone modes, OAuth).
- Plan file `.claude/plans/m4-external-addon-system.md` deleted.
- Versions: @namorix/core 0.44.0, @namorix/styles 0.38.1, frontend 0.55.1, Namorix.Core 0.47.0, Namorix.Server 0.50.0.

### 2026-07-23 — External addon entry port, schema update, MF desktop integration

- Backend (Namorix.Core): `AddonInstallation` model added `Ports` (JSON string) property for full port list. NEW migration `AddPortsToAddonInstallations`.
- Backend (Namorix.Server): `PortDto` added `Entry` boolean field. `AddonTaskExecutor` added `GetEntryPort()` — prioritizes port with `"entry": true`, falls back to first port. `InstallAsync` now sets `HostPort` from catalog port on creation. `ParseCatalogPorts` sets `HostPort = container` for direct bind.
- Catalog: `addon-v1.json` schema updated — ports items gain optional `entry` boolean.
- Core: `AddonContext.containerUrl` removed (dead code). tsup build setup added to package.json.
- Frontend: `DesktopArea` now uses catalog port as baseUrl when addon not running (Docker), fallback to `hostPort` when running. External addon error state no longer filtered out (shows disabled). MF entry registered via `createExternalAddonEntry` with `baseUrl` param. `externalAddonEntry.ts` accepts optional `baseUrl`, removed `containerUrl` usage.
- Versions: Namorix.Core 0.46.0, Namorix.Server 0.49.0, @namorix/core 0.42.0, frontend 0.54.0.

### 2026-07-13 (5) — External addons on desktop with disabled state

- Frontend: DesktopArea fetches external addons on mount via `addonController.list()` + dispatches to Redux. Desktop icons now merge builtin + external addons with `disabled` flag when `status !== "running"`. Disabled icons rendered with `filter: brightness(0.35)` and no hover background. Double-click disabled icon calls `addonController.start()`. New `mapDtoToManifest` shared helper (dedup with AddonGrid). `AddonItem` extended with `disabled?: boolean`. `externalAddonsSlice.updateAddonStatus` now includes `icon` from catalog for new entries.
- Styles: New `&--disabled` modifier in `desktop.scss` with brightness filter.
- Versions: frontend 0.53.0, @namorix/styles 0.37.0.

### 2026-07-13 (4) — Package Center pending overlay recovery, double toast dedup

- Backend (Namorix.Server): AddonTaskExecutor `SetStatusAsync` returns int with `WHERE Status !=` dedup guard. Start/Stop only notify if status actually changed (prevents double toast from DockerMonitorWorker race). DockerMonitorWorker `HandleEventAsync` checks `PendingTaskPhase != Uninstalling` before setting Error on Destroy (prevents error+success double toast during uninstall).
- Frontend: AddonGrid — `pendingMap` recovery via 30s timeout fallback + `resolvedPendingMap` useMemo reconcile with Redux status. `pendingTaskPhase` mapped from API DTO for on-mount recovery. SignalR handler simplified to use `setPending`/`clearPending`. Redux `updateAddonStatus` clears `pendingTaskId`/`pendingTaskPhase` on terminal status.
- Versions: Namorix.Server 0.48.3, frontend 0.52.4.

### 2026-07-13 (2) — Bug fixes: recheck loop, container conflict, EF cache

- Backend (Namorix.Core): AddonChannelClient _lifetimeCt fix. AddonHostedServiceBase rename.
- Backend (Namorix.Server): DockerService.RemoveContainerIfExistsAsync + GetContainerLogsAsync. AddonTaskExecutor gọi RemoveContainerIfExistsAsync trước create (tránh Docker Conflict). AddonChannelService recheck loop cancel linkedCts + log English. OAuthService.IsAddonAuthorizedAsync dùng AnyAsync + AsNoTracking (tránh EF cache).
- Versions: Namorix.Core 0.45.1, Namorix.Server 0.48.1.

### 2026-07-04 (2) — gRPC Addon Channel, revoke endpoint, NotifyAddonWidgetEvent

- Backend (Namorix.Core): NEW Protos/addon_channel.proto — bidirectional gRPC streaming. ExemptPaths thêm /api/oauth/revoke. AddonInstallation consistent init setters. NmxOAuth2Client fix File.Exists(). Package deps: Grpc.AspNetCore + Protobuf.
- Backend (Namorix.Server): NEW gRPC channel — AddonChannelManager (ConcurrentDictionary cho active cancellation), AddonChannelService (bidirectional stream + interceptor auth + 5-min periodic re-check). NEW OAuthController.Revoke — call RevokeTokenAsync + DisconnectAsync. OAuthService — RevokeTokenAsync, IsAddonAuthorizedAsync, ValidateTokenAsync. IAddonNotifier + SignalRAddonNotifier — NotifyAddonWidgetEvent. AddonWidgetEvent SignalR constant. OAuth2Middleware — Bearer prefix constant. Program.cs — gRPC wiring. Package deps: Grpc.AspNetCore + Protobuf.
- Versions: Namorix.Core 0.44.0, Namorix.Server 0.47.0.

### 2026-07-03 (4) — InstallAsync catalog rewrite, frontend catalog store, identity cleanup

- Backend: `AddonTaskExecutor.InstallAsync` full rewrite — catalog lookup, null check for catalogEntry, ParseCatalogPorts, proper AddonStatus.Installed (not Running), Docker error handling. `DockerService` — ImageExistsLocallyAsync, container Name = spec.AddonId. InstallRequest simplified to just Id. Xoá `ComputeAddonId` + AddonHelper.
- Frontend: Redux slice thêm catalog state + setCatalog reducer. `updateAddonStatus` tạo minimal entry cho addon mới với name từ catalog. AddonEventWatcher thêm catalogRef fallback + "installed" toast handler. handleInstall/InstallAddonDto simplified. ADDON_NOT_FOUND error code.
- Core: Xoá `computeAddonId` util (không còn dùng).
- Versions: Namorix.Core 0.42.3, Namorix.Server 0.45.3, frontend 0.52.3.

### 2026-07-03 (3) — F5 refresh race fix, ContainerId separation, toast dedup, orphan cleanup

- Core: HTTP client bỏ `ApiAuthRoutes.session` khỏi interceptor exclusion list — session 401 dùng chung shared refresh promise với các request khác, triệt tiêu race condition F5. Simplify `AddonContainerStatus` type (xóa unused states).
- Styles: Package-center SCSS thêm `.running` (success) và `.stopped` (warning) color cho `__icon-status` block.
- Frontend: AddonGrid version display fix, status icon cải thiện (running/stop/error icons với màu), stop button semantic `success`→`default`.
- Backend: `Session()` không còn gọi `TryRefresh()` nội bộ — trả về 401 luôn nếu thiếu/expired access token, không clear refresh cookie khi session fail. `AddonTaskExecutor` dùng `addon.ContainerId` cho Docker operations thay vì addonId. Xoá `FindContainerIdAsync`. `DockerMonitorWorker` toast dedup (`SetAddonStatusAsync` guard `&& a.Status != status`), orphan cleanup (xóa DB record + `NotifyAddonUninstalled`), sync `ContainerId` trong `SyncSingleAddon`. Migration mới `AddContainerIdToAddonInstallations`.
- Versions: core 0.41.2, styles 0.36.1, frontend 0.52.2, Namorix.Core 0.42.2, Namorix.Server 0.45.2.

### 2026-07-03 — NotifyPendingTaskChanged wiring, error toast, LastErrorCode rename
- Core: `AddonPendingPhase` type (6 phases), `AddonPendingTaskPayload` interface, `lastErrorCode` + `pendingTaskPhase` on ExternalAddonManifest, `lastErrorCode` on AddonStatusPayload.
- Backend: `IAddonNotifier` extended with `NotifyPendingTaskChanged` + `NotifyAddonUninstalled`. `AddonTaskExecutor` refactored — Start/Stop DB null check, Docker error → `AddonErrorCodes`, UninstallAsync uses new notifier methods. `SetTaskPending` calls `NotifyPendingTaskChanged`. `AddonErrorCodes` constants. `LastErrorMessage` → `LastErrorCode` rename + migration. SignalR events: `addon:pending-task-changed`, `addon:uninstalled`.
- Frontend: `AddonEventWatcher` toast on start/stop success + error via `formatAddonErrorCode`. `AddonGrid` — `AddonPendingTaskChanged` handler, stats rename (`total`→`installed` + `available`), error badge on card. `formatAddonErrorCode` function. New SignalR events in constants. `lastErrorCode` in `updateAddonStatus` reducer.
- Styles/UI: `ERROR` icon symbol in Icomoon + NmxIconFont. `__icon-status` error block in package-center SCSS.
- Versions: core 0.41.0, styles 0.36.0, ui 0.26.0, frontend 0.52.0, Namorix.Core 0.42.0, Namorix.Server 0.45.0.

### 2026-07-02 — Backend task queue, SignalR event fix, global addon events, AddonGrid refactor
- Core: New modules (`error.ts`, `markup.ts`, `semver.ts`). `AddonModule.globalComponent` field. `defineAddon` accepts `globalComponent` param. `useSignalREvent` useRef fix — handler deps `[eventName]` only. `signalr.service.ts` — `intentionalStop` flag, `hasBeenConnected` reset. `ApiError.fromResponse` fallback `data.error ?? data.code`.
- Backend: New AddonTask model + AddonTaskQueue (Channel-based) + AddonTaskExecutor (max 2 concurrent). New migration `AddTaskFields`. `SetTaskPending` sets both `PendingTaskId` and `Status`. DockerMonitorWorker startup sync clears stale `PendingTaskId`. Removed dead methods from AddonService.
- Frontend: AddonEventWatcher global SignalR handler. Root.tsx mounts global addon components. App.tsx unauthorized handler — `setHasBeenConnected(false)`, `stopConnection()`. registry `listGlobalComponents()`. AddonGrid 307-line refactor. New i18n keys. PackageCenter passes AddonEventWatcher as globalComponent.
- UI: New NmxSpinner primitive. NmxLoading → NmxLoadingOverlay rename.
- Styles: New spinner SCSS, icomoon rebuild (new icons), package-center SCSS refactor.

### 2026-06-21 — M4 External Addon System Phase 1-4
- Backend: Docker integration (DockerService, AddonService, DockerMonitorWorker, SignalRAddonNotifier). OAuth2 full flow (models, service, controller, middleware). Addon REST API. New migration with OAuth tables.
- Core: External addon types (ExternalAddonManifest, AddonContainerStatus, InstallAddonRequest), API routes.
- Frontend: addon.controller.ts, externalAddonEntry iframe service, externalAddonsSlice Redux store.

### 2026-06-25 — M4 Phase 5: Docker setup, federation config, external addon wiring
- Frontend: Docker dev/prod setup (Dockerfile.dev, Dockerfile.prod, docker-compose.yml). Federation config via @module-federation/vite. useAddonEvents hook, externalAddonSelectors. externalAddonEntry.ts federation API fix. HMR config for Docker dev.
- Styles: Theme import changed from default → dark.
- External: namorix-thread addon test thành công (Hello World via federation mount).

### 2026-06-25 (2) — DockerMonitor refactoring, Docker constants, PackageCenter uncomment, button fixes
- Backend: DockerMonitorWorker refactored với event stream + health check poll + auto-discover. New DockerState/DockerEvent/DockerFilter constants. DockerService.Client public. AddonLabels constants. AddonManifest init-only → get/set fix.
- Frontend: PackageCenter uncomment + refactor. Desktop cleanup (xoá test registration code). vite.config.ts comment out optimizeDeps (Vite cache fix). SettingsAccount button size=sm.
- UI/Styles: Button padding/font-size/font-weight tweaks. uppercase class rename (upper-case → uppercase). NmxAlertDialog thêm uppercase prop + semantic fix. Theme CSS rebuilt.

## Active Decisions
- Backend: Merged `Namorix.Adapters` (Persistence, Services, Migrations) vào `Namorix.Server`. Xoá project Namorix.Adapters. Cập nhật namespace, csproj packages, solution. Regenerated migration.
- Core: `LogEntrySerializer.cs` — string reference `Namorix.Adapters` → `Namorix.Server`.
- Styles: SCSS fixes across split/desktop/window/typography, theme CSS updates.
- Frontend: DesktopIcon.tsx minor fix.

### 2026-06-14 (3) — Appearance 3-layer cascade fix
- Frontend: `loadAppearance()` gọi song song `GET /api/settings/appearance` (layer 1+2) + `GET /api/user/settings` (layer 3). Merge `{ ...AppearanceDefaults, ...sysRes.data, ...userRes.data }`. Xoá `loadAppearanceSystem()`. `useAppearanceSync` dùng `authController.loadAppearance()` cho cả login chưa login.

### 2026-06-14 (2) — NmxStatCard thresholdCurrent/thresholdTotal, disk-usage CSS Grid
- UI: NmxStatCard thêm `thresholdCurrent`/`thresholdTotal` props. `resolvedColor` tính % từ `current/total*100` — tách threshold khỏi display value. CPU, Memory, Process Memory dùng raw numbers.
- Styles: DiskUsage flex + container queries → CSS Grid (`display: contents`, `grid-template-columns: max-content 1fr auto auto`). Xóa hết `@container` queries.
- Frontend: SystemMonitor — thêm `thresholdCurrent`/`thresholdTotal` cho CPU, CPU process, Memory, Process Memory. i18n: processMemoryDescription bỏ `" of {{total}}"` (không cần vì display value đã show).

### 2026-06-14 — Worker rename, disk filter, NmxStatCard canvas fix, styles container queries

- Backend: SystemStatsWorker renamed → SystemMonitorStatsWorker. Disk filter improved (DriveType.Fixed, overlay/fs exclusion, DistinctBy). Namorix.Workers project removed (workers moved to Server/Workers in previous commit).
- Styles: DiskUsage container queries for `.nmx-disk-item__name` (responsive width breakpoints). Settings.scss hardcoded 580px → `$nmx-breakpoint-sm` variable.
- UI: NmxStatCard canvas resolution fix — `getBoundingClientRect()` → `clientWidth`/`clientHeight` để tránh blur khi window-open scale animation.

### 2026-06-13 — SystemMonitor full implementation, ServerSignalR, MainHub

- Backend: SystemStatsWorker push CPU/memory/uptime/disk/IO/network mỗi 1s. MainHub extends NmxHub. ServerSignalR constants. ISystemMonitorNotifier + SignalRSystemMonitorNotifier. Workers moved từ Namorix.Workers sang Server/Workers.
- Core: formatBytes/Sec utils. useSignalREvent chờ connection. useSignalRGroup generic string. groupMethod fix kebab→Pascal.
- UI/Styles: DiskUsage (progress bar + badge), NmxSection, stat-card icon, meta-list contained, addon scrolled. Icomoon rebuild với CPU/RAM/TIME/ARROW_BAR icons.
- Frontend: SystemMonitor full — Process section (CPU, Memory, Uptime), Disk Space (DiskUsageList), IO (disk read/write, net rx/tx), Environment (meta-list). signalr/ constants + hooks.

### 2026-06-12 — LogCleanupWorker, wallpaper CSS var, cleanup freezePanelSize

- Backend: Thêm LogCleanupWorker — cleanup log files cũ hơn 7 ngày. DI register.
- Styles: Thêm `--nmx-wallpaper` CSS var, desktop.scss dùng wallpaper. Xoá dark theme icons folder.
- Frontend: Xoá freezePanelSize khỏi NotificationPanel (chuyển TODO). Reorder addons import.

### 2026-06-11 — Notification dedup, shared NotificationItem, xoá NotificationCenter addon

- Backend: Thêm Occurrences/LastOccurredAt/Icon vào model. CreateForAdminsAsync. Dedup trong CreateAsync (tìm unread cùng key → tăng occurrences). Order IsRead ASC. AuthService thêm register notif.
- Core: NmxNotificationDto thêm occurrences/lastOccurredAt. Fix useSignalREvent — `conn.off(eventName, handler)` thay vì `conn.off(eventName)`.
- UI/Styles: New notification.scss, app-system icon, icomoon rebuild.
- Frontend: Tách NotificationItem component dùng chung (icon app + severity badge). Xoá NotificationCenter addon. Panel bỏ "View all". notificationsSlice dedup. fetchUnreadCount on mount.

### 2026-06-11 — Notification model simplified, login failed notif, formatRelativeTime

- Backend: Notification model simplified (Key thay titleKey/descriptionKey). Thêm `NotificationType` + `NotificationKeys` constants. AuthService gửi notifi khi login failed (cho user + admin). Migration mới.
- Core: Thêm `formatRelativeTime()`, `NmxAddonId`, `common.time` i18n keys. `useDateTimeFormat` thêm `relativeTime()`. Factory wrap Redux Provider cho addon. DTO simplified (Key).
- Frontend: NotificationPanel/NotificationCenter dùng relative time + MD rendering. Thêm notifi key `auth.loginFailed`.

### 2026-06-10 — AddonItem extends NmxAddonManifest, WindowData refactor, instanceMode

Addon/window system refactor:
- `AddonItem extends NmxAddonManifest` — loại bỏ field duplication
- `WindowData` — thay `app/title/localeKey/icon` bằng `item: AddonItem`
- `OnOpenApp` simplified to `(item, rect?)`
- `useOpenWindow` simplified to `(item, originRect?)`
- Thêm `NmxAddonInstanceMode` (single/multi) — single mode focus window đã tồn tại thay vì mở mới
- `NmxAddonLocaleKeys` rename từ `LocaleKeys`

### 2026-06-10 — Notification Center (i18n key + params, full backend)

Notification Center system: taskbar badge + dropdown panel + addon window.
- Backend: Notification model, INotificationNotifier + SignalRNotificationNotifier, NotificationService, NotificationController (REST API: list, unread count, mark read, delete), DbContext + indexes, DI registration
- Frontend core: NmxNotificationDto type, SignalR events (notification:received, notification:read-status), API routes
- Redux: notificationsSlice (items, unreadCount, pagination), selectors, store wiring
- Controller: notification.controller.ts (nmxHttp pattern)
- Hooks: useNotificationEvents (mount in Desktop.tsx, listens SignalR)
- Utils: resolveNotifTitle/resolveNotifDescription (i18n key+params lookup)
- UI: taskbar badge (NmxBadge with unread count cap 99+), NotificationPanel dropdown, NotificationCenter addon window (filter all/unread, pagination, mark all read)
- i18n: notification namespace keys (fileUploaded, settings, system events)
- SCSS: notification panel + item styles (follows Launcher pattern: surface bg, md shadow, all: unset, hover border-radius transition)

## Active Decisions

### Authentication Check Strategy
- `isAuthenticated()` now makes an async API call (`GET /api/auth/session`) instead of sync cookie check
- This correctly handles HttpOnly cookies
- Guard components already supported async guards — `GuardFn = () => Promise<string | null>`
- HTTP client (`http.url().get().json()`) provides `credentials: "include"` automatically

### CSRF Protection Strategy
- **Double-submit cookie pattern** — stateless, no server session needed
- Non-HttpOnly CSRF cookie is readable by JS but not by cross-origin pages
- **Enabled by default** (`CSRF_DISABLE` env var to opt-out)
- CSRF cookie wrappers in `@namorix/backend-core/utils/cookie.ts`
- `sameSite: "lax"` on auth cookies provides baseline protection even without CSRF

### Token Whitelist Strategy
- **Whitelist** (`refresh_tokens` table): track active refresh tokens by jti
- On refresh: DELETE old + INSERT new (atomic rotation), preserve remaining TTL
- On unknown jti: revoke ALL user tokens (anti-theft — prevents reuse of stolen tokens)
- Logout: DELETE one jti. Logout-all: DELETE all by userId
- No token_version column needed — whitelist approach is simpler and gives per-device control

### Fingerprint Validation Strategy ✅ (Resolved — Strict)
Đã là **Strict mode**: fingerprint mismatch → `RevokeAllUserTokens`. Không cần xét IP. Code ở `RefreshToken()` lines 165-171 đã kiểm tra fingerprint !== stored fingerprint và revoke ngay.

### MessagePack Protocol — Deferred (JSON đủ dùng hiện tại)

- SignalR default protocol là JSON, đủ cho payload hiện tại (4 int/double fields + 1-2 strings per event)
- MessagePack giảm kích thước wire transfer ~30-50% nhưng chỉ có lợi khi payload lớn (50+ records/event)
- **Khi nào bật:** Khi SignalR bắt đầu push batch data (>20 records/event) hoặc có metrics với nhiều float arrays
- **Kích hoạt:** `.AddMessagePackProtocol()` trong `AddSignalR()`, thêm `@messagepack` trên frontend

### Token Refresh Strategy
- Auto-refresh on 401 handled in `RequestBuilder.json()` (HTTP client level, transparent to callers)
- Refresh endpoint is guarded against self-calling (`isRefreshUrl` check)
- Only one retry per request (`_retried` flag)
- Remember-me (90d) TTL preserved across refreshes via `remainingSeconds` calculation; configured via `JWT_REFRESH_REMEMBER_TTL` env
- `verifyToken` returns `JwtPayload | null` (no throw), used uniformly across all call sites

### Cookie Policy
- Access + refresh tokens: `httpOnly: true, sameSite: "lax"` (HttpOnly for security)
- CSRF token: `httpOnly: false, sameSite: "lax"` (readable by JS for double-submit)
- `sameSite: "lax"` chosen over `"strict"` because frontend/backend run on different ports in dev

### Window Scroll Containment — `overflow: clip` → `auto` + `overscroll-behavior: contain`

`.nmx-window-frame__mount` dùng `overflow: clip` để addon tự quản lý scroll container, tránh mount bị scroll ngoài ý muốn. Nhưng `clip` khiến browser coi window là non-scrollable → wheel event leak ra document → scroll window bên dưới khi window trên không có scrollable content.

**Fix:** `overflow: auto` + `overscroll-behavior: contain`:
- `auto`: mount tự scroll nếu addon content overflow, không scroll nếu content đủ ngắn
- `overscroll-behavior: contain`: chặn wheel event chain ra ngoài mount (lên document hoặc window khác)

**Lịch sử:** `overflow: auto` (fe38ff6) → `overflow: hidden` (d3f1bc9) → `overflow: clip` (dcdc366) → `auto + overscroll-behavior: contain` (hiện tại)

### Service Error Handling — DB Failures Go Unwrapped (Intentional)
Các service method (PermissionService, SettingsService) không có try/catch cho DB operations. Nếu EF Core failed (unique constraint, connection loss, etc.), exception propagate lên controller rồi ExceptionMiddleware trả 500 generic.

**Quyết định:** Đây là lỗi hệ thống, không cần bắt. ExceptionMiddleware trả 500 đủ để người dùng biết và báo quản trị viên. Chỉ try/catch những operation quan trọng (vd: transaction rollback trong PermissionService.DeletePermission).

### Auth Filter Attribute — Inconsistent Pattern ✅ (Resolved)
Cả 3 attribute filter (`RequireAuthAttribute`, `RequireAdminAttribute`, `RequirePermissionAttribute`) đã thống nhất dùng `ActionFilterAttribute` + async `OnActionExecutionAsync`.

### Toast Notification System (Planned)
- **Architecture:** Event bus trong `@namorix/core` (`nmxToast` singleton), React provider trong `@namorix/ui` (`NmxToastProvider`), mount trong `Root.tsx`
- **API:** `nmxToast.long(msg)`, `nmxToast.short(msg)`, `.success()`, `.error()`, `.warning()`, `.info()`
- **Context isolation:** Widget addon (cùng DOM) → toast trên desktop. Standalone (window.open riêng) → tự mount provider → toast trong standalone
- **Tokens:** Dùng `--nmx-color-{success/error/warning/info}` CSS variable từ styles, không hardcode
- **Khi nào implement:** Khi cần toast cho Settings save confirm hoặc external addon feedback

## Pending Fixes

### 🔴 Window scroll containment — ✅ Resolved
`.nmx-window-frame__mount` — `overflow: clip` → `overflow: auto` + `overscroll-behavior: contain`. Ngăn scroll leak qua window bên dưới.

### 🔴 Redux Provider cho addon mount — ✅ Resolved
`factory.tsx` wrap `<Provider store={context.store}>` khi context có store.

### 🔴 SignalR notification handler trả về result — ✅ Resolved
`useNotificationEvents` dùng `void dispatch()` để tránh SignalR báo lỗi "not expecting a result".


### SetThemeRequest thiếu validation
- `UserController.cs:45-47` — `SetThemeRequest.ThemeId` thiếu `[Required]`, `[MaxLength]`
- `User.cs:16` — `ThemeId` thiếu `[MaxLength]` (các string field khác đều có)
- **Fix:** Thêm `[Required]`, `[MaxLength(100)]` vào cả 2 chỗ

### ✅ Resolved
- CSS URL resolution inconsistency — **removed localStorage `restoreTheme()`**, replaced with server-fetch approach via `loadSystemDefaults()`/`loadAppearance()` ✅
- Login flow theme fetch error — removed old `/api/user/theme` call, theme loaded through `loadAppearance()` in Root useEffect ✅
- Settings validation missing — added `SetSettingsSchema` + `AllowedValuesValidationRule` + `[Validate]` attribute ✅
- NmxDialog missing Esc dismiss — added keydown handler ✅
- ThemeManifest types drift — `isBuiltIn: boolean` đã có ✅
- `/api/themes` handler — đã implement ✅
- `public/themes/registry.json` — đã tạo ✅

### 2026-07-27 — Frontgate Phase 2: Certificate tab, NmxMenuButton, action menu, pipeline separation

- @namorix/ui 0.30.2 → 0.31.0: NEW `NmxMenuButton` — Floating UI dropdown with filterItem prop, getReferenceProps compose pattern, data-row-action. NmxAlertDialog markupToHtmlEnabled. NmxDialog noSpacingBody. New icon symbols (MENU_VERTICAL, REFRESH, DOWNLOAD, HTTP, DNS, UPLOAD).
- @namorix/core 0.50.0 → 0.51.0: markupToHtml ReactNode overload. certificateById API route. dateOnly formatter.
- @namorix/styles 0.42.0 → 0.43.0: New menu-button.scss. Icomoon rebuild. Frontgate/blocked SCSS updates.
- frontend 0.63.0 → 0.64.0: Full Frontgate Certificate tab — NmxDataTable, NmxMenuButton action menu (Renew/Retry/Download/Delete), info dialog on row click, delete confirm with toast. certificateById API route. i18n certificate section (44 lines). frontgate.html landing page.
- Namorix.Core 0.51.0 → 0.52.0: DataPaths constants. DataBasePath centralization. FlatFileOptions BasePath removed (shared path).
- Namorix.Server 0.54.0 → 0.55.0: FgCertificateStatus enum + migration. DeleteCertificate endpoint. ListCertificates fix. Pipeline separation (UseWhen). SelfSignedCertificateProvider. BackendConfig HttpPort/HttpsPort.

### 2026-07-27 — Frontgate Phase 2: Certificate pagination, NmxSelect description, Source field

- @namorix/ui 0.31.0 → 0.32.0: NmxSelectData added `description` field. NmxSelect renders description in dropdown.
- @namorix/styles 0.43.0 → 0.44.0: New `.nmx-select__option-label`/`-description` selectors. Option `flex-direction: column`.
- frontend 0.64.0 → 0.65.0: Certificate tab pagination (NmxPagination, usePageSize). Certificate dropdown options with description (None/Request New/existing with issuer+expiry). listAllCertificates returns CertificateResponse.
- Namorix.Server 0.55.0 → 0.56.0: FgCertificateSource enum + Source column. ListCertificates pagination (page≤0 flat array, page>0 paginated).

### 2026-07-27 — Frontgate Phase 2: Pipeline separation, self-signed cert, frontgate.html landing page

- **Pipeline separation**: `UseWhen` branch — API port (5001) gets full pipeline (CORS/Auth/CSRF/Controllers/SignalR), proxy ports (80/443) only ForceSsl + YARP + static fallback
- **Self-signed certificate**: `SelfSignedCertificateProvider` — auto-gen PFX khi `HttpsPort > 0` mà không có `SslCertPath`, lưu vào `data/pki/`
- **DataBasePath centralization**: `AppConfig.DataBasePath` từ `appsettings.json`, dùng chung cho `DataDirectory`, `FlatFileStore`, cert storage. Xoá `FlatFileOptions.BasePath` redundant
- **Frontgate landing page**: `frontend/public/frontgate.html` — standalone HTML dùng CSS variables từ `@namorix/styles`, cùng theme với desktop, trả về khi truy cập proxy ports không YARP route. Refactored từ custom `.fg-*` classes sang dùng `nmx-card`, `nmx-meta-list`, `nmx-meta-list--contained`, `nmx-icon-box`, `nmx-icon-font` có sẵn trong theme system
- **Dev path**: Backend serve `frontend/public/` qua `PhysicalFileProvider` — path resolve từ project directory (`backend/src/Namorix.Server/`) lên repo root cần 3 `..`: `../../frontend/public/`
- **Production note**: Frontend sẽ built vào backend output, serve từ 1 port duy nhất — cần replace PhysicalFileProvider path bằng production build path

## Next Steps

1. **M5** — @namorix/core publish npm + addon integration guide
2. M3 — Internal addon: File Manager (scaffold)
3. M3 — Internal addon: Terminal (scaffold)
