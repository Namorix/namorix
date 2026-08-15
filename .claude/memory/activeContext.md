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

### 2026-08-15 — NmxCard spacing/empty/clickable + NmxToolbarContent spacing + NmxToolbarHeader onBack wiring (@namorix/ui 0.49.0 / @namorix/styles 0.58.0)

- **@namorix/ui 0.49.0:** `NmxCard` +`nmx-card--clickable` class khi có `onClick` (hover `--nmx-color-surface-mid`); `NmxCardBody` +`isEmpty` prop (`nmx-card__body--empty` placeholder); `NmxCardHeader` +`spacing` / `NmxCardFooter` +`spacingBottom` / `NmxToolbarContent` +`spacing` (đều qua `cxSpacing`); **`NmxToolbarHeader` wire `onClick={onBack}`** vào `.nmx-toolbar-header__action-back` — back-action giờ click được (trước chỉ hiện chevron, chưa wire). Consumer đầu tiên = weave `ThreadNetworkView` (`onBack` → `NetworkView`).
- **@namorix/styles 0.58.0:** `card.scss` — `nmx-card--clickable`/`nmx-card__body--empty` + `spacings()` mixin cho header/footer (margin-bottom qua `--nmx-card__header-spacing`); `toolbar.scss` — `.nmx-toolbar-content` +`spacings()` mixin.
- Versions: @namorix/ui 0.49.0 / @namorix/styles 0.58.0 (core/backend/frontend không bump — không file đổi).

### 2026-08-15 — NmxToolbarHeader back-action chevron + useSessionGuard deferred status fix (@namorix/core 0.67.1 / @namorix/ui 0.48.0 / @namorix/styles 0.57.2)

- **@namorix/ui 0.48.0:** `NmxToolbarHeader` — back-action slot: chevron `ARROW_NEXT` sau khối title/icon khi có `children`; `__action-back--clickable` (info block hover đổi màu). **`onBack` chưa wire vào onClick** (WIP — cần wire trong consumer, ví dụ weave `ThreadNetworkView`).
- **@namorix/styles 0.57.2:** `base/components/toolbar.scss` — `.nmx-toolbar-header__action-back` + `__info` + `--clickable` hover.
- **@namorix/core 0.67.1:** `hooks/useSessionGuard.ts` — widget case defer `setStatus("authenticated")` qua `setTimeout(..., 0)` + cleanup.

### 2026-08-15 — Dev Vite proxy + Chrome DevTools 404 vào Namorix.Core; useSessionGuard trả state; OAuth login redirect fix (Namorix.Core 0.59.0 / Namorix.Server 0.78.1 / @namorix/core 0.67.0)

- **Dev Vite proxy → Namorix.Core (0.59.0)**: move dev single-origin proxy từ weave/server-local vào core để tái sử dụng — NEW `Extensions/DevViteReverseProxyExtensions.cs` (C# 14 `extension` blocks): `AddDevViteReverseProxy(env, config)` (dev-only `AddReverseProxy().LoadFromMemory` route `dev:vite` catch-all → Vite `:5102`, `ActivityTimeout` 10 min) + `MapDevViteReverseProxy(env)` (dev-only `MapReverseProxy()`). `Namorix.Core.csproj` +`Yarp.ReverseProxy`. First consumer = weave `Program.cs` (bỏ YARP local, dùng core extension).
- **`UseChromeDevToolsProbe404()`**: `ApplicationBuilderExtensions.cs` + middleware 404 hoá `/.well-known/appspecific/com.chrome.devtools.json` trước session auth + YARP (Chrome probe không trigger session DB lookup / không proxy sang Vite).
- **`useSessionGuard` trả state (@namorix/core 0.67.0)**: return type `void` → `SessionGuardState` (`"loading" | "authenticated" | "unauthorized"`) — cho phép UI render loading overlay; weave `WeaveApp` gating theo state (`NmxLoadingOverlay` khi loading).
- **OAuth login redirect fix (Namorix.Server 0.78.1)**: `OAuthController` dùng `Request.Scheme://Request.Host` thay `FrontendConfig.BaseUrl` (đúng origin sau proxy / cổng tùy chỉnh; bỏ DI `IOptions<FrontendConfig>`).
- Versions: Namorix.Core 0.59.0 / Namorix.Server 0.78.1 / @namorix/core 0.67.0 (frontend/ui/styles/warden không bump — không file đổi).

### 2026-08-15 — gRPC user OAuth over addon channel + traffic monitor refactor (Core→Server) + dev single-origin proxy + port renumber (Namorix.Server 0.78.0 / Namorix.Core 0.58.0 / frontend 0.90.1)

- **gRPC user OAuth (Namorix.Core 0.58.0 / Namorix.Server 0.78.0)**: Addon backend giờ exchange/refresh **user** token trực tiếp qua gRPC addon channel — `AddonChannelService.ExchangeUserCode` (authorization code + PKCE; caller auth bằng machine token trên gRPC auth header; `client_assertion` chứng minh addon sở hữu code; `RequireAddonClientIdAsync` + ClientId mismatch → `PermissionDenied`) / `RefreshUserToken` (dùng stored refresh token). `OAuthService.ExchangeCodeAsync` trả thêm `UserId` + NEW `GetClientIdAsync(addonId)`. Client: `AddonChannelClient.ExchangeUserCodeAsync`/`RefreshUserTokenAsync`, `NmxOAuth2Client.CreateClientAssertionAsync` (extract từ `GetAccessTokenAsync` — reuse cho gRPC).
- **Traffic monitor refactor (Core → Server)**: toàn bộ `Traffic*` chuyển sang `Namorix.Server` (`Workers/TrafficMonitor/`, `TrafficBuffer`/`ITrafficNotifier`/`SignalRTrafficNotifier`, `TrafficRoutes`, `TrafficMonitorController`/`TrafficMonitorFilter`).
- **Dev single-origin proxy (Server)**: `FrontgateProxyConfigProvider` +dev Vite route catch-all → cluster `dev:vite` (ActivityTimeout 10 min — Vite cold start esbuild; mô hình giống weave `LoadFromMemory`).
- **Port renumber 5000/5001/5002**: REST+SignalR / gRPC / Vite — sync backend config, `vite.config.ts` env-driven (`DESKTOP_FRONTEND_PORT`/`DESKTOP_BACKEND_PORT`), Dockerfile/composes, 3 READMEs.
- **Frontend (0.90.1)**: config-only — `vite.config.ts` `hmr.clientPort = backendPort`; xóa staged `Dockerfile.dev`/`Dockerfile.prod`/`docker-compose.yml`/`icomoon.ps1`.
- Versions: Namorix.Server 0.78.0 / Namorix.Core 0.58.0 / frontend 0.90.1 (core/ui/styles/warden không bump — không file đổi).

### 2026-08-13 — Warden audit trail + Activity search + notification detail time + panel overlay (Namorix.Server 0.77.0 / frontend 0.90.0)

- **Warden audit trail (Namorix.Server 0.77.0)**: `WdFirewallService` chokepoint giờ publish `WdSecurityEvent` cho toàn bộ rule lifecycle — `NotifyRuleAppliedAsync` → `AUTO_BAN` (Critical, auto) / `RULE_APPLIED` (Warning, manual); `NotifyRuleRemovedAsync` → `BAN_EXPIRED` (Info, auto + hết hạn) / `RULE_REMOVED` (Info). Fix lỗi trước đây: IP bị block xuất hiện trong Notifications (Herald) nhưng không có trong Activity log Warden — 2 kênh audit tách rời. `detailJson` qua `JsonSerializer` + constants `WdEventAction.Applied`/`Removed`. `Constants/Warden.cs` +4 event types. Không feedback loop threshold — 4 type mới rơi vào default `int.MaxValue` threshold.
- **Warden Activity search (frontend 0.90.0 / warden 0.7.0)**: `WardenActivity.tsx` +live search theo IP (`listEvents({ ip: search })`, onChange/onSubmit reset page 1), toolbar `NmxSearchInput` + `NmxButtonClear`/`NmxButtonRefresh`. Backend `WdEventController.List` đã có sẵn filter `ip` — chỉ thiếu frontend wiring.
- **Notification detail time**: `NotificationPanel.tsx` dùng `useDateTimeFormat().dateTime` hiện `createdAt`/`lastOccurredAt` theo format hệ thống (`appearance_time_format`/`date_format`).
- **Notification panel overlay**: `Taskbar.tsx` +`__overlay` transparent click-catcher — mousedown `preventDefault`+`stopPropagation` đóng panel TRƯỚC khi click-through, không trigger onClick item bên dưới (pattern launcher).
- **Launcher cleanup**: bỏ `NmxSearchInput`/`query`/`searchRef` khỏi `Launcher`/`LauncherView`.
- **@namorix/ui 0.47.0**: NEW `NmxButtonClear` primitive (ghost + error + DELETE icon, `nmx-button__clear`).
- **@namorix/core 0.66.2**: `ui.pagination.showing` → `"{{from}}-{{to}} / {{total}}"` (ngắn gọn, chống tràn).
- Versions: Namorix.Server 0.77.0 / ui 0.47.0 / styles 0.57.1 / core 0.66.2 / frontend 0.90.0 / warden 0.7.0.

### 2026-08-10 — Core default hub path sync: /hubs/namorix (@namorix/core 0.66.1)

- **Sync default hub path**: `HUB_MAIN` (`apiRoutes.ts`) + `DEFAULT_HUBS_PATH` (`config.ts`) đổi `/hubs/main` → `/hubs/namorix` — khớp backend `feat(backend): rename HubMain to HubNamorix` (`07e64bb`). App frontend đã truyền tường minh `hubsPath: "/hubs/namorix"` trong `coreConfig`; fix này bảo vệ external addon tạo `createNmxCore()` không truyền `hubsPath` (fallback đúng thay vì hub path cũ).
- **Docs sync**: README.md (controller example), backend/README.md (SignalR hub), FLOW.md (connection lifecycle + App Init) → `/hubs/namorix`.
- Versions: core 0.66.1 (frontend/backend/addon không bump — không có file thay đổi).

### 2026-08-10 — Core factory/instance pattern + frontend pre-bound shim (@namorix/core 0.66.0 / frontend 0.89.0)

- **Core — module-level global state → factory/instance pattern** (như i18n — chống xung đột state khi `@namorix/core` share qua Module Federation M4/M5). Core chỉ export factory thuần: `createNmxCore(config)` (bỏ `configureCore`), `createAuthRefresh(core)`, `createHttpClient(authRefresh)` (bỏ singleton `nmxHttp`), `createAuthService({core, http})`, `createOauth(core)`, `createThemeLoader(core)`, `createSignalrService({core, authRefresh})`, `createSignalRHooks(signalr)`. 4 signalr hooks đổi thành nhận `signalr` làm param đầu. `createMount` +`deps.oauth`.
- **Frontend — pre-bound shim 2 lớp**: `src/config/coreConfig.ts` = instance duy nhất (compose factories + re-export alias cũ để consumer không đổi API) + `src/signalr/useSignalR.ts` = pre-bound hook wrapper (ép type `ServerSignalRGroupsType`/`ServerSignalREventType`). ~22 consumer files chỉ đổi import nguồn.
- **Fix LogViewer crash**: `log.controller.ts` route sai `ApiTrafficRoutes.logs` → `ApiLogRoutes.logs`.
- **Lưu ý**: backend 3 file đang rename `HubMain`→`HubNamorix` (`/hubs/main`→`/hubs/namorix`) chưa commit — nếu commit chung sẽ lệch với frontend `coreConfig` `hubsPath: "/hubs/main"`. Addon internal (LogViewer/NetworkTraffic/...) KHÔNG bump — plumbing-only import change.
- Versions: core 0.66.0 / frontend 0.89.0 (backend/addon không bump).

### 2026-08-10 — SignalR multi-hub refactor (@namorix/core 0.65.0)

- **Multi-hub `SignalrClient`**: module-level singleton → class per `hubPath` (cached trong `clients` Map). NEW API: `resolveHubPath(hubPath?)` (default `getHubsPath() ?? HUB_MAIN`), `getSignalrClient(hubPath?)`. Mọi hàm export +`hubPath` param (`getConnection`/`startConnection`/`stopConnection`/`addStatusHandler`/...).
- **`pendingHandlers` buffer**: `client.on()` trước khi connection tồn tại → buffer trong `pendingHandlers`, flush khi `start()` build connection (survives reconnect). Bỏ cơ chế defer `addStatusHandler` cũ trong `useSignalREvent`.
- **Config**: `CoreConfig` +`hubsPath?: string` (default `"/hubs/main"`), `main.tsx` wiring `hubsPath: "/hubs/main"`. Backend `SignalR.cs` `HubMain = $"{HubPrefix}/main"`.
- **Hooks**: `useSignalR(active, hubPath?)`/`useSignalREvent(event, handler, hubPath?)`/`useSignalRGroup(group, active, hubPath?)`/`useSignalRStatus(hubPath?)`.
- Versions: core 0.65.0 / frontend 0.88.1 / Namorix.Core 0.57.1.

### 2026-08-10 — Warden rules add/update feedback toasts + NmxCard restructure (committed)

- **Warden rule add/update feedback (frontend 0.88.0)**: `WardenRules.tsx` `handleSubmitRule` giờ hiện `nmxToast.success` (`pages.rules.feedback.addSuccess`/`updateSuccess` kèm `{{name}}`); error giữ `formatCustomError(t, err, WardenErrorCodes)` + fallback locale `addError`/`updateError` qua tham số `fallbackMessage` của `nmxToast.error`. Delete dialog keys chuyển `addon.warden.dialog.*` → `addon.warden.pages.rules.dialog.*`, `deleteConfirm` dùng markup `[color:warning]**{{name}}**[/color]` + `markupToHtmlEnabled` trên NmxAlertDialog.
- **NmxCard restructure (@namorix/ui 0.46.0 / styles 0.57.0)**: NEW `NmxCardContainer` (nmx-card__container — container-type inline-size) + `NmxCardSection` (`title` uppercase, max-width 960px qua container query ≥lg). `NmxCard` +`spacing` prop (`none` \| NmxSpacing), `NmxDataTable` +`radiusEnabled`, `NmxMetaList` +`alignItem`, `NmxIconFont` size default `sm` → `null`, `types/base.ts` +`WithSpacing`.
- **Lưu ý Warden iptables (runtime — đã chẩn đoán session này)**: rule **Allow** không được enforce xuống iptables — `WdFirewallService.ApplyRuleAsync` trả `true` ngay cho allow/disabled rule ("nothing to enforce") → server báo add success nhưng `grep wd:` trống (đúng thiết kế, KHÔNG phải lỗi). Deny rule cần container **root** + `NET_ADMIN` + `seccomp:unconfined` — default Docker seccomp chặn nf_tables netlink → "Could not fetch rule set generation id: Permission denied (you must be root)" dù root+NET_ADMIN.
- Versions: ui 0.46.0 / styles 0.57.0 / frontend 0.88.0 / warden 0.6.0 (core/Namorix.Server không bump).

### 2026-08-09 — SignalR reconnect refresh-based + Frontgate DryRunCountdown extract (uncommitted)

- **SignalR reconnect fix**: `scheduleReconnect()` giờ gọi `refreshAccessToken()` trước mỗi lần `startConnection()` — trước đây khi server down + access token hết hạn, reconnect thất bại 401 vô hạn. NEW `http/authRefresh.ts` — single-flight refresh dùng chung REST + SignalR, tri-state `"success" | "expired" | "network"`: `"expired"` (401) dừng retry + trigger `onUnauthorized` (App.tsx → closeAllWindows + stopConnection + redirect login), `"network"` (server down) giữ exponential backoff. Kèm header `x-csrf-token` + `x-device-fingerprint` (thiếu CSRF → refresh bị 403). `setOnUnauthorized` re-export qua barrel `http/index.ts`. Lưu ý: KHÔNG dùng `res.ok` làm điều kiện auth-chết vì network error cũng `!ok`.
- **Frontgate DryRunCountdown**: tách countdown self-ticking ra `DryRunCountdown.tsx` + hook `useDryRunActive.ts` (isDryRunActive + useDryRunClock — tự interval 1s) — parent không re-render mỗi giây nữa.
- Chưa commit — sẽ ghi vào progress.md khi commit.

### 2026-08-09 — Appearance — Backend endpoint merge 3-layer (uncommitted)

- **Backend**: thêm `GET /api/settings/appearance/merged` public (`SettingsController.GetMergedAppearance`) — gộp 3 tầng code defaults ← system defaults ← user overrides về 1 call, thay vì frontend tự merge 2 API. `SettingsService.GetMergedAppearanceAsync(int? userId)` compose `GetAppearanceDefaultsAsync()` (cache `appearance_defaults`) + `userSettingsService.GetAllAsync(userId)` (cache `user_settings_{userId}`) — thêm `UserSettingsService` vào constructor, không vòng DI.
- **Anonymous-safe**: endpoint public (SettingsController không có `[RequireAuth]` class-level), `userId` derive từ JWT claim khi có cookie auth — quan trọng vì `loadAppearance()` chạy cả trên trang login (chưa đăng nhập). Không đặt dưới `/api/user/*` vì `UserController` có class-level `[RequireAuth]` (ActionFilterAttribute không tôn trọng `[AllowAnonymous]`).
- **Frontend**: `auth.controller.ts` `loadAppearance()` đổi từ 2 call (`ApiUserRoutes.settings` + `ApiSettingsRoutes.appearanceSystem`) sang 1 call `ApiSettingsRoutes.appearanceMerged`, bỏ logic merge + bỏ import `ApiUserRoutes`/`AppearanceDefaults`. `apiRoutes.ts` +`appearanceMerged` route. Settings addon vẫn dùng `appearanceSystem` cũ (không đụng).
- Chưa commit — sẽ ghi vào progress.md khi commit.

### 2026-08-09 — Warden activity Clear + useActiveTab tab guards

- **Clear activity (Warden)**: nút Clear trong `WardenActivity.tsx` hoạt động — `confirmClear`/`clearing` state + `handleClearConfirm` gọi `wardenController.clearEvents()` → toast `clearSuccess`/`clearError`, `NmxAlertDialog` confirm `confirmSemantic="error"` `loading={clearing}`. Backend thêm `DELETE /api/warden/events` (`WdEventController.Clear` — `ExecuteDeleteAsync` → `{ deleted }`, pattern Beacon `DELETE /activity`).
- **`useActiveTab` guards**: cả 3 page Warden (Overview/Activity/Rules) giờ chỉ fetch khi tab đang active (`useActiveTab<WardenTab>` + `if (activeTab !== "...") return`) — tránh fetch khi tab không mở. `WardenRules` loading chỉ khi list rỗng (`rules.length <= 0`).
- Versions: frontend 0.86.0 / warden 0.5.0 / Namorix.Server 0.75.0 (core/ui/styles/Namorix.Core không bump).

### 2026-08-09 — Warden Phase 1-4: event publishing + Herald notifications + realtime + Frontgate security fixes

- **Warden backend Phase 1-4 (Namorix.Server 0.74.0)**: `WdEventService.PublishAsync` (save `WdSecurityEvent` + push SignalR `warden:new-event`), `SignalRWardenNotifier` (group `warden`), `WdFirewallService` +180 (iptables/nftables enforcement engine, `WdThresholdRules.For` + `WdThresholdFactors.For`), `WdThresholdWorker` (threshold engine — AcmeChallengeFail/Scan404/BruteForce), `WdBanCleanupWorker` (hết hạn rule). **Herald**: `IHeraldNotifier` + `HeraldNotifier` — `warden:ruleApplied` (Warning) / `warden:ruleRemoved` (Info), **chỉ khi `Action == Deny`**, params `name`/`sourceCidr`/`expiresAt`. `WdSettings` +`CustomThresholdFactor`/`CustomDurationFactor` (migration `AddWdCustomProfileFactors`).
- **Herald DI pattern**: `WdFirewallService` là singleton → resolve `IHeraldNotifier` (scoped — phụ thuộc `NotificationService`) qua `IServiceScopeFactory`. `ApplyAllAsync(notify:false)` khi restart — tránh spam notify cho toàn bộ rules.
- **Event publishing**: `AcmeChallengeMiddleware` +13 (publish `AcmeChallengeFail`), `ProxyTrafficMiddleware` (publish `Scan404` — debounce 1 event/IP/5-min window qua `ScanWindow` ConcurrentDictionary, chống flood khi bot scan).
- **Notification keys**: bỏ `NotificationSource` constants → `NotificationKeys.Warden.RuleApplied`/`RuleRemoved` (camelCase `warden:ruleApplied`/`warden:ruleRemoved`, align frontend template).
- **Frontgate security fixes**: `/hubs` traffic không còn được `ProxyTrafficMiddleware` ghi (skip `SignalRPath.HubPrefix`); `/frontgate.html` bị chặn → 404 trên proxy ports (lambda TRƯỚC `UseStaticFiles` — static file short-circuit nếu đặt sau) + API port; root proxy port vẫn fallback hiện nội dung frontgate.html.
- **Frontend (0.85.0)**: Warden detail dialogs (`WardenActivity`/`WardenRules` — click row → `NmxAlertDialog` + `NmxMetaList`), stats realtime (`WardenOverview` — SignalR `warden:new-event` + 30s poll), `signalr/constants.ts` +`ServerSignalRGroups.Warden`/`WardenNewEvent`, `notification.ts` +warden source icon, i18n `warden.ruleApplied`/`ruleRemoved` (`{{sourceCidr}}`). `@namorix/ui` +`BLOCK` icon + fix `DENSITY_DEFAULT` glyph, styles icomoon +`$ic-block`.
- **Pending**: vi.json Warden keys, iptables/nftables thực tế cần `NET_ADMIN` capability (EnforcementFailed error code), publish event từ `BlockCommonExploitsMiddleware`/`AccessControlMiddleware`/`RateLimitMiddleware`, block log detail dialog còn ít.
- Versions: ui 0.45.0 / styles 0.56.0 / frontend 0.85.0 / warden 0.4.0 / Namorix.Core 0.57.0 / Namorix.Server 0.74.0 / core 0.63.0 (không bump).

### 2026-08-09 — Warden dashboard tabs (Overview/Activity/Rules) + NmxChipToggle + NmxSettingsWrap

- **Warden addon restructure → tabs**: `Warden.tsx` đổi từ single-page dashboard sang `NmxToolbar` tabs (overview/activity/rules/settings). **Fix `useNmxTabContext must be used within NmxTabProvider`**: content phải nằm TRONG `<NmxToolbar>` (provider scope) — `NmxToolbarContent` là sibling thì throw. `WardenOverview.tsx` (firewall master toggle `NmxToggle` + 3 `NmxStatCard` + profile `NmxSegmentedGroup`), `WardenActivity.tsx` (`NmxLogList` + `NmxPagination`/`usePageSize`, severity info/warning/critical → info/warning/error), `WardenRules.tsx` (`NmxDataTable` + `NmxBadge` allow=success/deny=error + `NmxMenuButton` toggle/edit/delete + delete confirm `NmxAlertDialog`). `WardenRuleDialog.tsx` ports → `NmxTagInput`. Đã xóa `WardenBlockLog`/`WardenProfile`/`WardenStats`/`WardenRules` cũ (gộp vào Overview/Rules). i18n warden namespace restructure `pages.*`.
- **Fix NmxSegmentedGroup profile không chọn được**: `settings` chưa từng fetch (`settings === null` → `value` kẹt "medium" + guard `if (!settings) return`) — thêm `fetchSettings` + gọi trong useEffect.
- **NEW UI primitive `NmxChipToggle`** (@namorix/ui 0.44.0): role="switch", controlled/uncontrolled (`checked`/`defaultChecked`/`onCheckedChanged` — pattern NmxToggle), `aria-checked`/`aria-disabled`, `cx/cxSemantic/cxSpacing`. NEW `NmxSettingsWrap` (Components/NmxSettings). +1 icon `TASK` (NmxIconFont.types + icomoon glyph).
- **@namorix/styles 0.55.0**: chip.scss `--toggle` active/disabled, settings.scss, warden.scss mở rộng, icomoon rebuild.
- **Cập nhật đè ghi chú Phase 0 cũ**: dòng "Không bump @namorix/ui, @namorix/styles" trong entry Phase 0 giờ đã lỗi thời — session này ui 0.43→0.44, styles 0.54→0.55.
- **Pending (Phase 1-3)**: event publishing (AcmeChallenge/ProxyTraffic → WdSecurityEvent), SignalR `warden:new-event`, threshold engine + iptables/nftables execution (Phase 2), block log detail dialog + stats realtime (Phase 3), vi.json. `WdSettings.Profile` (custom) vẫn chỉ lưu không dùng — `WdFirewallService` là stub.
- Versions: ui 0.44.0 / styles 0.55.0 / frontend 0.84.0 / warden 0.3.0 / core 0.63.0 / Namorix.Server 0.73.0.

### 2026-08-09 — Warden Phase 0 — host-level firewall foundation + dashboard

- **Warden addon (Phase 0 foundation + dashboard)**: internal addon host-level firewall (dưới Frontgate HTTP layer), prefix `Wd`.
- **Backend (Namorix.Server 0.73.0)**: `Models/Warden/` — `WdFirewallRule` (Name, SourceCidr, Ports, Protocol, Action Allow/Deny, Enabled, Auto, ExpiresAt), `WdSecurityEvent` (EventType, Severity, SourceAddon, SourceIp, Count, WindowStart, Detail, Timestamp), `WdSettings` (FirewallEnabled, SecurityProfile — single-row Id=1); migration `AddWdTables` (index Ip + Timestamp); `Controllers/Warden/` — `WdController` (CRUD rules + toggle + settings + stats `/api/warden`), `WdEventController` (events paginated, filter IP/type/severity `/api/warden/events`), cả 2 `[RequireAdmin]`; `Services/Warden/WdFirewallService.cs` (stub Phase 0 — log-only apply/remove/applyAll, `AddSingleton`); `Constants/Warden.cs` (`WdErrorCodes` + `WdEventTypes` + `WdSecurityProfile`); `Validation/Warden/WdRuleSchema.cs` (CIDR/ports format check). `AppDbContext` refactor `OnModelCreating` → `Configure*` methods + `ConfigureWarden`.
- **Frontend (0.83.0)**: `addons/Warden/` — `Warden.tsx` (dashboard `NmxAddonRoot scrolled`: firewall master toggle `NmxToggle`, `WardenStats`, profile, rules, block log, add/edit dialog + confirm delete `NmxAlertDialog`), `WardenStats.tsx` (3 `NmxStatCard`, blockedToday `semantic="error"`), `WardenProfile.tsx` (`NmxSegmentedGroup` Low/Medium/High/Custom), `WardenRules.tsx` (`NmxDataTable` + `NmxBadge` allow=success/deny=error + `NmxMenuButton` toggle/edit/delete), `WardenBlockLog.tsx` (`NmxLogList`, severity → info/warning/error), `WardenRuleDialog.tsx` (add/edit rule), `Warden.types.ts`, `warden.controller.ts` (`updateSettings` gộp firewallEnabled + profile; `listEvents` build Record tường minh fix TS). `en.json` +warden namespace (vi.json hoãn).
- **@namorix/core 0.63.0**: `apiRoutes.ts` +`ApiWardenRoutes`; `version.ts` `NmxAddonVersions.warden` 0.1.0→0.2.0.
- **Không bump**: @namorix/ui, @namorix/styles, Namorix.Core (không có file thay đổi).
- **Pending (Phase 1-3)**: event publishing (AcmeChallenge/ProxyTraffic → WdSecurityEvent), SignalR `warden:new-event`, threshold engine + iptables/nftables execution (Phase 2), block log detail dialog + stats realtime (Phase 3), vi.json.
- Versions: core 0.63.0 / frontend 0.83.0 / Namorix.Server 0.73.0 / warden 0.2.0.

### 2026-08-09 — Frontgate GeoIP database management + upload progress + traffic routes

- **GeoIP Database Management (Frontgate Settings tab)**: `FrontgateSettings.tsx` (new) — status (file size/database type/build epoch + backup meta), upload database với **progress bar** (XHR `upload.onprogress` — fetch không có progress; `NmxFileInput` +`progress` prop; `RequestBuilder` +`formUpload<T>` giữ withCredentials/CSRF/fingerprint), rollback với `NmxAlertDialog` + `NmxMetaList` so sánh current vs backup (nút rollback ẩn khi `!hasBackup`).
- **Backend GeoIp**: `GeoIpController` (`GET /api/frontgate/geoip` status, `POST` upload `[RequestSizeLimit(50MB)]`, `POST /api/frontgate/geoip/rollback`); `GeoIpService.TryUpdateDatabase` probe-validate → `File.Copy` `.bak` → overwrite; `RollbackDatabase` copy `.bak` back + **`File.Delete(bak)`** (consume backup). `ExemptPaths.NonJsonBody` +`/api/frontgate/geoip` (fix 415 multipart). `Frontgate.cs` +3 codes.
- **Traffic routes**: NEW `TrafficRoutes.cs` (`Base = "/api/traffic"`) — `TrafficMonitorController` route qua constant + bỏ `RegisterEndpointRequest` dead code; `ProxyTrafficMiddleware` skip `/api/traffic` (không đếm traffic nội bộ).
- **Shell desktop config**: `config.ts` +`isShellDesktop`/`isShellDesktopEnv()`; `main.tsx` DEV-only import `main.scss`, `apiBaseUrl` simplify (`VITE_API_URL ?? window.location.origin`), `isShellDesktop: true`; `Register.tsx` bỏ hardcode form initial state; LogViewer/NetworkTrafficLogs meta items `alignValue="end"`.
- Versions: core 0.62.0 / ui 0.43.0 / styles 0.54.0 / frontend 0.82.0 / Namorix.Core 0.56.0 / Namorix.Server 0.72.0 / frontgate 1.10.0.

### 2026-08-08 — Theme rework default→light + Docker deployment + RemoveThemeCssPath

- **Theme rename**: folder `themes/default` → `themes/light` (index/shell/tokens); styles vite input `light/theme` → output `/themes/light/theme.css`. `shell.scss` forward `themes/light/shell`.
- **RemoveThemeCssPath**: `ThemeManifest` bỏ `CssPath` (backend model + FE type + migration `20260808132328_RemoveThemeCssPath`). `@namorix/core` `applyTheme` → `loadTheme(themeId, "theme.css")` — path cố định qua `ThemeRoutes.themes` `/themes/{id}/{path}`.
- **sanitizePath**: +`sanitizePath(path)` (join segments) + `sanitizePathSegment` loop-until-stable (strip `..`/`/`/`\` lặp — chống traversal bypass). @namorix/core exports trỏ `./src/index.ts`.
- **Docker deploy**: root `Dockerfile` (3-stage: node SPA build → dotnet publish → aspnet runtime, SPA vào `/app/public`), `docker-compose.yml` (ports 5001/5002/80/443, bind `data/`, docker.sock, `user: 1000:984` + `cap_add NET_BIND_SERVICE`), `docker-compose.deploy.yml` (named volume), `.dockerignore`, `Makefile`. `Program.cs`: prod serve SPA từ `./public`, startup `MigrateAsync()` trước `FrontgateProxyConfigProvider.UpdateAsync()` (fix `no such table: FgReverseProxyRules` trên DB trống).
- Versions: core 0.61.0 / styles 0.53.0 / frontend 0.81.1 / Namorix.Core 0.55.0 / Namorix.Server 0.71.1.
- **Lưu ý (rename kèm đợt đổi tên theme, chưa khớp SCSS — đang dùng fallback)**: `windowDefaults.ts` đọc `--nmx-window-light-width` (token SCSS vẫn `--nmx-window-default-width`); `NmxIconFont.types.ts` `DENSITY_DEFAULT: "ic-density-light"` (glyph SCSS vẫn `.ic-density-default`); `shell.scss` đang forward `themes/dark/shell` (nội dung `light`/`dark` shell giống nhau — cùng forward `base/shell`).

### 2026-08-08 — Frontgate cert download + access policy/custom cert validation + NmxTagInput overflow fix

- **Cert download**: backend `CertificateController.DownloadCertificate` `GET /api/frontgate/certificates/{id}/download` — đọc `privatekey.pem` + `fullchain.pem` từ `certs/{name}/` (name = primaryDomain `*`→`_`), zip 2 file → `{name}.zip` (MediaTypeNames.Application.Zip); 404 `CertificateNotFound`/`CertificateFilesMissing` (`FG_CERTIFICATE_FILES_MISSING` — constant mới). `DataDirectory` +`ReadFile(subPath)` (`byte[]?`, null nếu file thiếu). FE: `downloadCert` dùng `fetch` blob + `<a>` anchor (vì `nmxHttp` chỉ có `.json()`), branch `download` trong `handleAction`, `certificateDownload` route, mapping `FG_CERTIFICATE_FILES_MISSING`, i18n `certificateFilesMissing`/`downloadError`. **Bug gặp**: `ZipArchive` `archive.CreateEntry(...).Open().Write(...)` không dispose stream entry trước khi tạo entry thứ 2 → `IOException "Entries cannot be created while previously created entries are still open"` → fix `await using` từng entry stream.
- **Validation**: `AccessPolicyController` Create/Update + `CertificateController.CreateCustomCert` thêm `[Validate(typeof(...))]`; NEW `Validation/Frontgate/AccessPolicySchema.cs` + `CustomCertSchema.cs` (schema property name phải khớp request record prop — `ValidateAttribute.GetPropertyValue` dùng `GetProperty(prop.Name)` chính xác).
- **Access Policy rules → NmxTagInput**: `FrontgateAccessPolicy.tsx` thay `<textarea>` rules bằng `NmxTagInput` — state `formRules: string[]`, `parseRulesToArray`, bỏ `parseRulesToLines`/`serializeLinesToArray`, `JSON.stringify(formRules)`, fix stale closure `formRules` thiếu trong deps `handleConfirm`.
- **NmxTagInput overflow fix**: Floating UI migration (portal thoát parent overflow — cùng pattern NmxSelect); `tag-input.scss` bỏ `position: absolute` inline, z-index 100→1000.
- Versions: core 0.60.0 / ui 0.42.1 / styles 0.52.1 / frontend 0.81.0 / Namorix.Core 0.54.1 / Namorix.Server 0.71.0 / frontgate 1.9.0.

### 2026-08-08 — Traffic source separation (API/Proxy) + Frontgate audit/rate-limit/health + Notification toast

- **Traffic source separation**: `TrafficSource` enum (`Api`/`Proxy`) trong `TrafficLogSerializer` — format 9 token `{ts} {method} {path} {status} {dur}ms {size}B {ip} {uid} {source}`, backward-compat theo token count (7/8 token cũ → `Api`). Write sites: `TrafficMonitorFilter` (API port) ghi `Source = Api`, `ProxyTrafficMiddleware` (proxy ports) ghi `Source = Proxy` — cùng vào `TrafficBuffer` Channel → NetworkTraffic show TOTAL, query param `source` filter. FE: `NetworkTraffic.tsx` (parent) thêm `NmxMenuButton` source filter All/API/Proxy (icons FILTER/API/PROXY), state `source` hoisted lên parent, pass xuống `NetworkTrafficLogs` qua prop, child dùng `prevSourceRef` detect source change → reset page về 1.
- **Frontgate audit log**: NEW `FgAuditLog` model + migration `AddFgAuditLog`, `AuditLogController` (list/clear), service `FrontgateAudit`, worker `FgAuditCleanupWorker`, SignalR event `frontgate:audit-created` (group `frontgate`). FE: `FrontgateAudit.tsx` tab (thay Error Pages — `FrontgateErrorPages.tsx` xóa).
- **Frontgate rate limit**: `RateLimitMiddleware` + migration `AddFgRateLimit` + setting keys (FrontgateRuleSchema/SetSettingsSchema). Per-source/rule rate limiting trên proxy ports.
- **Frontgate backend health**: `FgBackendHealthWorker` + migration `AddFgBackendHealth` — kiểm tra health backend upstream, phản hồi proxy khi backend down.
- **Notification toast**: refactor `NotificationItem.tsx` → `components/Notification/` (NotificationItem, NotificationToasts, index) — click toast copy + dismiss; `notification-toast.scss` mới (moved từ components → shell/components); NotificationPanel cải tiến. UI: `NmxLogList` markup render, `NmxSlider`/`NmxSegmentedGroup`/`NmxFormField` tweaks, icon types +3.
- Versions: core 0.59.0 / ui 0.42.0 / styles 0.52.0 / frontend 0.80.0 / Namorix.Core 0.54.0 / Namorix.Server 0.70.0 / frontgate 1.8.0 / networkTraffic 1.3.0.

### 2026-08-08 — Frontgate access control fixes: ::ffff: IP normalize + BasicAuth camelCase + policy selector

- **Root cause block không ăn**: Kestrel dual-stack bind `[::]` → client IPv4 xuất hiện dạng mapped `::ffff:a.b.c.d`. `FrontgateAccessService.IpMatches` so string/byte-length giữa 16-byte mapped IP vs 4-byte IPv4 rule → **không bao giờ match**. Fix: đầu `Evaluate` thêm `if (clientIp.IsIPv4MappedToIPv6) clientIp = clientIp.MapToIPv4();` — denylist/allowlist/Private mode hoạt động đúng.
- **`::ffff:` hiển thị**: `NetworkHelper.ToDisplayString` (normalize mapped → hiển thị thuần IPv4) dùng cho traffic/log/notification — thay `.ToString()` ở `TrafficMonitorFilter`, `ProxyTrafficMiddleware`, `TrustedProxyMiddleware`. `AccessControlMiddleware` bỏ debug `Console.WriteLine`, truyền thẳng `IPAddress` cho `Evaluate` tự normalize (dư 1 `using Namorix.Core.Helpers;` không lỗi).
- **BasicAuth `rulesJson` camelCase**: `FrontgateAccessService.SerializerOptions` (CamelCase + `PropertyNameCaseInsensitive`) — `HashBasicAuthPassword` serialize `FgBasicAuthPolicy` bằng options này (trước đây `JsonSerializer.Serialize` mặc định → **PascalCase** `{"Username","PasswordHash"}` → FE `parseBasicAuthUsername` đọc `obj?.username` ra rỗng khi edit). `Evaluate` deserialize case-insensitive → row cũ PascalCase vẫn đọc được.
- **Keep-hash khi password trống**: `HashBasicAuthPassword` — password rỗng + có sẵn `passwordHash` → giữ hash cũ (trước hash chuỗi rỗng → mất password khi edit để trống).
- **FE rule-form policy selector**: `formPolicyId` + `accessPolicies` fetch + payload `accessPolicyId` + `policyOptions` filter theo `formAccess` (basicAuth → chỉ basicAuth policies) + select hiện khi `restricted`/`basicAuth` — Restricted/BasicAuth giờ save được.
- Versions: styles 0.51.1 / frontend 0.79.0 / Namorix.Core 0.53.3 / Namorix.Server 0.69.1 / frontgate 1.7.0.

### 2026-08-08 — SignalR realtime CRUD — Beacon + Frontgate (rule/dry-run/cert)

- **Pattern realtime CRUD (frontgate-style)**: backend notifier push `{id, action}` lowercase-string event (group `beacon`/`frontgate`) → frontend `useServerSignalREvent` subscribe → đóng info/edit dialog nếu item bị xóa ngoài + toast → refetch list.
- **Frontgate**: `FgCertAction` (Created/Updated/Deleted) + event `frontgate:cert-changed` — `IFrontgateNotifier.NotifyCertChanged(certId, action)`; FE `FrontgateCertificate` subscribe → close info dialog nếu `deleted && payload.certId === selectedCert?.id` + toast `deletedExternally` → refetch. **Fix detached-finally**: `fetchCerts` `await` + `return res.items` → `Promise<CertificateItem[]>` (trước đây `.then().finally()` không return → rejection nuốt, callers `.catch` không fire).
- **Beacon**: `BcnHostnameAction` + event `beacon:hostname-changed` — `IBeaconNotifier.NotifyHostnameChanged(hostnameId, hostname, action)`; FE `BeaconHostnames` subscribe → close edit dialog nếu hostname bị xóa ngoài + refetch.
- **SignalR enum serialization**: protocol serializer SignalR (`AddJsonProtocol`) không chịu `JsonStringEnumConverter` của MVC — enum ra integer. Fix: `action.ToString().ToLowerInvariant()` tại notifier call site, dùng **named anonymous member** (`action = action.ToString()...`) — dạng projection gây CS0828.
- **Self-delete race avoidance**: toast "deleted externally" chỉ check info/edit dialog state (`selectedCert`/`editing`/`infoRule`), KHÔNG check delete-confirm state (`deletingCert`/`deleting`) — tránh false-fire khi SignalR event tới trước khi local `.then()` clear state (own-delete).
- Versions: styles 0.51.0 / frontend 0.78.0 / Namorix.Server 0.69.0 / frontgate 1.6.0 / beacon 1.1.0.

### 2026-08-07 — Frontgate Reverse Proxy UX hoàn thiện (menu actions, info dialog, dry-run minutes, UTC fix)

- **Row action menu**: nút Delete cuối row → `NmxMenuButton` (MENU_VERTICAL trigger, `arrowDisabled`) — Confirm dry-run / Cancel dry-run / Edit / Delete. `filterItem` chỉ hiện 2 mục dry-run khi `isDryRunActive`; `dividerIndexes` top-divider trước Edit + Delete.
- **Info dialog on row click**: click row → `NmxAlertDialog` "Proxy info" (`infoRule` state) hiện Source/Destination/Access/Status/Created at (`createdTime`)/dry-run countdown qua `NmxMetaList`; nút Apply dry-run chỉ render khi còn active (`confirmShouldRender`).
- **Dry-run minute select**: General tab select 1P/5P/10P → `payload.dryRunMinutes`; backend `CreateRuleRequest.DryRunMinutes = 1` + `ResolveDryRunSeconds(minutes)` (1|5|10 → ×60, else 60) thay hằng `_dryRunSeconds`.
- **`isDryRunActive` + JS countdown**: helper `expiresAt != null && new Date(expiresAt) > now`, `now` state tick 1s — cột/badge/menu/dialog cùng dùng, hết hạn hiển thị "—".
- **UTC timezone fix**: `UtcDateTimeJsonConverter` (`Namorix.Core/Helpers`, JsonConverter<DateTime> — Unspecified→Utc) đăng ký global trong `AddJsonOptions` — SQLite mất `DateTimeKind` → trước đây serialized thiếu `Z` (`...T14:12:35.775856`) → FE `new Date()` parse nhầm local +7h → countdown 00:00. Giờ xuất `Z` → đúng.
- **@namorix/ui 0.41.0**: NmxIconFont `size`/`semantic` props (+cxSize, NmxSize), EDIT/UNDO icons, NmxAlertDialog `confirmShouldRender`. **@namorix/styles 0.50.0**: icomoon rebuild + icon-font/frontgate SCSS + theme rebuild. **Namorix.Core 0.53.2**, **Namorix.Server 0.68.0**, frontend 0.77.0, frontgate 1.5.0.
- **Pending**: test runtime Phase 3 FE (dry-run toggle, countdown, access policy CRUD, action menu, info dialog).

### 2026-08-07 — Frontgate Phase 3: Access Control + dry-run + Warden scaffold

- **Phase 3 Access Control (FE + BE)**: `FrontgateAccessPolicy.tsx` (Access Policy tab — CRUD, type switch ipAllowlist/geoBlock/basicAuth/ipDenylist, rules textarea ↔ JSON, username/password cho basicAuth), `AccessPolicyController` + `FrontgateAccessService` + `AccessControlMiddleware` + `GeoIpService` (MaxMind.GeoIP2). **BasicAuth hash fix**: `HashBasicAuthPassword` skip re-hash nếu password bắt đầu `$2a`/`$2b`/`$2y` → edit giữ nguyên hash cũ khi để trống password.
- **Dry-run**: FE toggle + countdown badge + Apply/Cancel, backend `FgReverseProxyRule.DryRunExpiresAt` + `FgDryRunRollbackWorker` rollback. **Fix stale closure**: `formDryRun` thêm vào deps `handleConfirm` (FrontgateReverseProxy.tsx:463).
- **Certificate**: retry/renew endpoints, `SniCertProvider`, `FgCertRenewWorker`, SignalR `frontgate:cert-status-changed` (group `frontgate`).
- **Warden scaffold**: plan `warden-security-addon.md` + addon scaffold (ban IP qua iptables/nftables — backend chưa implement).
- **Fix**: LogViewer/NetworkTraffic loading guard (`setLoading(true)` gating + deps `[entries.length]`).
- Versions: core 0.58.0 / ui 0.40.0 / styles 0.49.0 / frontend 0.76.0 / server 0.67.0 / frontgate 1.4.0.
- **Pending**: test runtime Phase 3 FE (dry-run toggle, countdown, access policy CRUD).

### 2026-08-06 — Drop DNS-01

- Quyết định **bỏ hẳn LE via DNS (DNS-01)** — hiếm dùng, cần credential/zone per provider, chi phí maintain cao. Đã gỡ: `IDnsProvider`/`CloudflareDnsProvider`/`DnsProviderResolver`/`DnsProviderServiceCollectionExtensions`, `RunDnsAsync`, `POST /certificates/letsencrypt-dns/dry-run`, FE dialog `letsEncryptDns`, `createLetsEncryptDnsCert`, `listDnsProviders`, catalog `DnsProviders.cs`, enum `LetsEncryptDns`. **Giữ column `FgCertificate.DnsProviderId`** (drop khi migration tổng thể). Provider list lưu trong frontgate plan làm reference.
- Version: core 0.57.1 / frontend 0.75.0 / server 0.66.0 / frontgate 1.3.1.

### 2026-08-06 — Frontgate LE dry-run + notification panel fix + addon version catalog

- Backend (Namorix.Server 0.64.0 → 0.65.0): **LE HTTP-01 dry-run test** — `AcmeDryRunService` (staging flow: account key riêng `pki/acme-staging-account.key`, `NewAccount(null,true)` khi key mới — fix `accountDoesNotExist`, `LetsEncryptStagingV2`, **dừng ở challenge không Generate**, `finally` Remove token, timeout 60s) + `DnsLookupChecker` (A record vs public IP qua `IPublicIpDetector` reuse → `DryRunWarning`). Endpoint `POST /certificates/letsencrypt-http/dry-run` → `{ passed, message, warnings }`; `CreateLetsEncryptDryRunRequest(Domains)` bỏ KeyType (dry-run không Generate). DI `AddSingleton` cả 2.
- @namorix/core 0.56.1 → 0.57.0: **NEW `version.ts`** (`NmxAddonVersions` — catalog version 10 addon internal; skill `update-docs-and-versions` đã thêm rule bump addon) + `apiRoutes` dry-run route.
- @namorix/ui 0.38.0 → 0.39.0: `NmxToastProvider` — click toast → copy message + dismiss.
- frontend 0.73.0 → 0.74.0: Frontgate dry-run Test button (`handleTestLetsEncrypt` + `onExtraAction` + i18n); **fix NotificationPanel bug** — `didInitialFetch` ref thay guard `items.length > 0` (SignalR `addNotification` pre-populate items → skip fetch lịch sử → panel chỉ hiện notif mới, scroll chết).
- **Frontgate plan**: HTTP-01 còn 1 mục (SignalR cert status push); DNS-01 (5) + auto-renew/SNI (2) chưa làm.

### 2026-08-05 — Multi-host xuống provider + SignalR reconnect fix

- Backend (Namorix.Server 0.63.0 → 0.64.0): **Multi-host chuyển xuống provider** — `BcnHostnameService` bỏ split/loop, truyền `host.Host` full comma string cho `provider.UpdateAsync` 1 lần (skip-check 1 lần, xoá `WithTag`). `Cloudflare`/`GoDaddy` split+loop tag × (A/AAAA) + `firstFailure ??=`; Cloudflare `recordName` switch (`@`→domain, `*`→`*.domain`, full-name→dùng thẳng, label→`tag.domain`) + **fix `FindZoneIdAsync`** `zones?name={zone}` (endpoint `zones/{zone}` cần zone ID — đang truyền name → 404) + `WithHostname`. **Namecheap split+loop per host** (docs chính thức mỗi request 1 giá trị `host=`, không nhận gộp) — cần `BcnGetProviderBase.UpdateAsync` thêm `virtual`; DuckDNS giữ batch. Schema Host relax `*.suffix` (`(\*\.)?`). NoIp/Dynu `Classify` token-match (`good <ip>`/`nochg <ip>` success; Dynu `notfqdn`/`servererror`). Constants: `BcnParam` mở rộng + `BcnCredentialParam`/`BcnHttpClientNames`/`BcnHeaderKey` — thay hết hardcode. `Tested: true` cho Cloudflare/Dynu/NoIp/Namecheap. **Test = real update** (TestAsync → UpdateAsync — bấm Test là sửa record thật).
- @namorix/core 0.56.0 → 0.56.1: **SignalR reconnect fix** — `startConnection()` reuse connection (chỉ tạo mới khi `!connection`) → giữ `conn.on` handlers qua reconnect, hết warning "No client method" + drop event (fix Open Decision #14).
- frontend 0.72.0 → 0.73.0: Beacon `hostHint`/`domainHint` (NmxFormField `helper` + i18n).
- **NEW `@namorix/core` `version.ts`**: `NmxAddonVersions` — version catalog 10 addon internal (about 1.0.0, log-viewer 1.1.0, settings 1.1.0, system-monitor 1.2.0, network-traffic 1.2.0, package-center 1.2.0, frontgate 1.2.0, beacon 1.0.0, file-manager 0.1.0, terminal 0.1.0). Quy trình `update-docs-and-versions` (skill) sẽ bump version addon trong file này khi `frontend/src/addons/<name>/` thay đổi.
- **Pending**: Namecheap override `UpdateAsync` (chưa apply — cần base `virtual`); Cloudflare `FindZoneIdAsync` `zones?name=` (chưa xác nhận apply); window.scss comment-out animation — có vẻ debug leftover cần kiểm tra trước commit.

### 2026-08-05 — Beacon host/domain split, HostIsDomain, provider error detail, notification/activity interpolation, toggle enable

- Backend (Namorix.Server 0.62.0 → 0.63.0): **Breaking** host/domain split — `BcnHostname` `Hostname` → `Host` (multi-tag comma `@,www,home`) + `Domain` (FQDN dùng thẳng authoritative DNS), migration `AddBcnDomainAndHost`; `IBcnProviderClient` + toàn bộ provider signature `host`+`domain` (bỏ `GetDomain`); controller request DTO `Host`+`Domain`, dup check theo cặp. **`HostIsDomain`** provider (No-IP): controller derive `hostValue = domain` (lưu `Host = Domain`), FE ẩn host field + collapse label (`host === domain ? domain : host · domain`). **Provider error detail**: Namecheap extract `<Err1>` (GeneratedRegex + HtmlDecode), NoIp `reason` mọi error branch; backend `DescribeDetail` 3-tier mirror FE `bcnErrorDetail` (`detail → httpStatus>0 → reason`). **Notification**: `NotifyHostnameAsync` +provider param, `Beacon.addon.tsx` renderer translate provider/hostname/detail + `return t(...)` (hết raw code `BCN_PROVIDER_ERROR`). **Activity**: `firstFailure` enrich thêm `WithTag` (hostname tag) → hết literal `{{hostname}}`. **Toggle enable** → `Updating` + enqueue (chạy update qua `BcnUpdateQueue` thay vì set thẳng Active). `DisplayName` collapse backend.
- frontend 0.71.0 → 0.72.0: Beacon host/domain form, hostIsDomain UI, notification renderer, `bcnErrorDetail` priority mới, activity label collapse, i18n.
- @namorix/styles 0.48.0 → 0.48.1: beacon.scss `__created` → `__ip`.
- **NoIp chưa test thật (TODO ⏳)** — DuckDNS + Namecheap đã test pass, NoIp code xong chờ test với provider thật.

### 2026-08-05 — Beacon authoritative DNS, probe/refresh queue, realtime events, clear activity

- Backend (Namorix.Server 0.61.0 → 0.62.0): **Authoritative DNS read** — `AuthoritativeDnsResolver` (DnsClient.NET) bootstrap NS qua `GooglePublicDns`, label-strip tìm zone, query `A`/`AAAA` trực tiếp authoritative server (`UseCache=false`) → so IP hiện tại thay vì provider GET. NEW `BcnProbeQueue` (Channel queue — `POST /refresh` batch probe non-disabled hosts → `NotifyHostnamesRefreshed(updated)`) + `BcnUpdateQueue` (Channel queue 1-host/event cho create/update, concurrency 2, `RequeueUpdatingAsync` on startup, fail → status Error + notify). NEW `IBeaconNotifier`/`SignalRBeaconNotifier` — 3 events: `beacon:activity-created`, `beacon:hostname-status-changed`, `beacon:hostnames-refreshed`. Controller thêm `POST /api/beacon/refresh` + `DELETE /api/beacon/activity`. NEW dep DnsClient.
- @namorix/core 0.55.0 → 0.56.0: `refresh` route.
- @namorix/styles 0.47.0 → 0.48.0: log-list/meta-list/reset/beacon/desktop SCSS + background.svg + theme rebuild. `log-list.scss` thêm container query ≤400px (item column, time xuống dưới message).
- @namorix/ui 0.37.0 → 0.38.0: `NmxMetaItem` `useSelectEnabled` prop.
- frontend 0.70.0 → 0.71.0: refresh button + `refreshHostnames`, clearActivity confirm flow, realtime events.
- **Đã fix:** Activity tab refresh-on-open — `BeaconActivity.tsx` gate `useActiveTab() !== "activity"` (refetch mỗi khi tab active) + subscribe cả 2 beacon events; DuckDNS dead `_httpFactory` đã bỏ; `BcnProbeQueue` logger đã dùng; warning `No client method ... beacon:activity-created` đã fix (BeaconActivity tự register handler khi mount).

### 2026-08-05 — Beacon polish: markup feedback, secret placeholders, error params, JSON enum consistency

- Backend (Namorix.Server 0.60.0 → 0.61.0): NEW `BcnHostnameService` (update logic single source — worker + controller `/check` delegate) + `BcnSecretProtector` (DataProtection mã hóa 5 field secret). `BcnController` thêm `POST /hostnames/{id}/check` (trả `@params = result.Params` — passthrough reason/httpStatus), dùng shared `BcnProviderConfig.SerializerOptions` (JsonStringEnumConverter — fix `JsonException BcnProviderKind` khi edit token). `BcnCheckWorker` slim còn ~60 dòng (orchestrator). Regex hostname relax cho subdomain (DuckDNS `home`). DuckDNS `Classify` trả `params.reason`. `SelfSignedCertificateProvider` thêm IsValidCertificate check.
- @namorix/core 0.54.0 → 0.55.0: `hostnameCheck` route.
- @namorix/ui 0.36.0 → 0.37.0 + @namorix/styles 0.46.0 → 0.47.0: NmxToastProvider + NmxLogList render markup (`markupToHtml`); new palette/dark tokens; log-list/settings/toast SCSS; theme rebuild.
- frontend 0.69.0 → 0.70.0: add dialog gọn (provider placeholder + natural-language descriptions, secret/credential placeholders, resetForm sạch), feedback `**{{hostname}}**` markup, `bcnErrorDetail` normalize `httpStatus`/`reason` → `detail`, `handleCheck`/activity render detail, BeaconSettings IPv6 hint + bỏ ifconfig.co. en.json + notification/en.json (beacon hostnameError/hostnameRecovered).

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
