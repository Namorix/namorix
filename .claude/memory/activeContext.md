# Active Context

## Current Work Focus

M3 — Desktop Shell UI ✅ + Addon System ✅ + NetworkTraffic Phase 2 (SignalR) ✅

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

### 2026-05-21 — Sparkline fix, auth cache, backend SignalR refinements

- **@namorix/core (0.14.0 → 0.14.1)**: MODIFIED `auth/auth.service.ts` — cache `getAuthStatus()` result, tránh request trùng lặp.
- **@namorix/ui (0.9.0 → 0.9.1)**: FIX `canvas.ts` — sparkline 1-data-point x coordinate NaN (dùng `plot.length` thay `data.length`). FIX `NmxStatCard.tsx` — sparkline color resolve từ `semantic` prop, không qua CSS variable. MODIFIED `cx.ts` — utility updates.
- **@namorix/styles (0.12.1 → 0.12.2)**: MODIFIED `auth.scss` — minor fix.
- **backend (0.22.0 → 0.22.1)**: NEW `NmxHubFilter` — IHubFilter centralized error handling. MODIFIED `Program.cs` — AddFilter, EnableDetailedErrors, rate limiter policy partition skips `/hubs`. Minor cleanup.
- **frontend (0.15.0 → 0.15.1)**: FIX `auth.controller.ts` — stopConnection on logout. FIX `Login.tsx`, `Register.tsx`, `main.tsx` — page refinements. DELETED `traffic.controller.ts` (dead code, replaced by SignalR). MODIFIED `NetworkTrafficOverview.tsx` — signalr event-driven stats.

### 2026-05-21 — SignalR frontend integration (core signalr module, event-driven traffic, middleware fixes)

- **@namorix/core (0.13.0 → 0.14.0)**: NEW `signalr/` module — `signalr.service.ts` (connection singleton with `@microsoft/signalr`), `useSignalR` hook (connection lifecycle tied to Desktop mount/unmount), `useSignalREvent` hook (typed event subscription), `useSignalRGroup` hook (group subscribe/unsubscribe with `onreconnected` handler), `constants.ts` (SignalRGroups, SignalREvent, typed payload records), `utils.ts` (capitalize, groupMethod).
- **frontend (0.14.0 → 0.15.0)**: NEW Vite proxy for `/hubs` with `ws: true`. NEW `@microsoft/signalr` dependency. MODIFIED `Desktop.tsx` — `useSignalR(true)` on authenticated Desktop mount. MODIFIED `auth.controller.ts` — `stopConnection()` before API logout call. REPLACED `useTrafficStatsPolling.ts` — removed 5s REST polling, now event-driven via SignalR `traffic:new-logs` with aggregate stats payload.
- **backend (0.21.0 → 0.22.0)**: NEW `SignalRPaths` constants (HubPrefix, HubMain). FIX `ITrafficNotifier.NotifyFlushAsync()` — removed `int count` param. FIX `TrafficLogsFlushed` record — `int Count` → full stats record. FIX `SignalRTrafficNotifier` — inject `TrafficMonitorService`, push aggregate stats on flush. FIX `TrafficMonitorMiddleware` — skip `/hubs` to avoid CountingStream sync write crash. REFACTOR `CsrfMiddleware`, `Program.cs` — use `SignalRPaths` constants.

### 2026-05-21 — cache module (useTabCache, Show), NetworkTraffic refactor

- **@namorix/core (0.12.0 → 0.13.0)**: NEW `cache/` module — `useTabCache()` hook (lazy mount + CSS hide + idle unmount via useReducer pattern), `Show` component (conditional render wrapper using `hidden` attribute). Exported from barrel.
- **frontend (0.13.2 → 0.14.0)**: REFACTOR NetworkTraffic addon — dùng `useTabCache<Tab>` + `Show` component + i18n title key.

### 2026-05-21 — defineAddon factory, addon context, Desktop defocus fix

- **@namorix/core (0.11.0 → 0.12.0)**: NEW `factory.tsx` — `defineAddon()` factory (tự động createRoot/mount/unmount). NEW `context.tsx` — `AddonContextProvider` wrapper + `useAddonContext()` hook cho addon đọc context từ shell. DELETED `NmxAddonBase.ts`.
- **frontend (0.13.1 → 0.13.2)**: FIX Desktop.tsx — global mousedown defocus exclude `.nmx-taskbar__app-btn`. REFACTOR LogViewer, NetworkTraffic, Settings, SystemMonitor → dùng `defineAddon()`.

### 2026-05-20 — NmxStatCard, NmxGrid, canvas sparkline, traffic controller + polling

- **@namorix/core (0.10.5 → 0.11.0)**: NEW `ApiTrafficRoutes` (base, endpoints, logs, stats). NEW `http.query(params)` method for clean URLSearchParams handling.
- **@namorix/styles (0.11.0 → 0.12.0)**: NEW stat-card.scss (nmx-stat-card, BEM). NEW grid.scss layout (nmx-grid, auto-fit + minmax). NEW shell/addon/ SCSS (network-traffic content override). NEW spacings mixin for gap modifier classes. Theme CSS rebuilt.
- **@namorix/ui (0.8.0 → 0.9.0)**: NEW NmxStatCard primitive (value, label, unit, trend, sparkData + canvas sparkline with HiDPI/ResizeObserver/gradient). NEW NmxGrid layout (cols="auto"|number, minColWidth, gap props). NEW canvas.ts — drawSparkline utility. NEW cxSpacing + NmxSpacing type.
- **frontend (0.13.0 → 0.13.1)**: NEW traffic.controller.ts (getStats + 4 DTO types). NEW useTrafficStatsPolling hook (30s polling, rolling 20-point history). NEW NetworkTrafficOverview with NmxStatCard + NmxGrid stats row + sparkline. i18n labels for overview stats.

### 2026-05-19 — State Management Rewrite (Zustand → Redux Toolkit)

- **frontend (0.11.1 → 0.12.0)**: Zustand → Redux Toolkit rewrite. 4 stores → 3 slices (`windowsSlice`, `launcherSlice`, `taskbarSlice`). Normalized state (`byId` + `order`). Gộp window + geometry + animation vào `windowsSlice`. Memoized selectors với `createSelector`. `useAppSelector` mặc định `shallowEqual`. Taskbar tối ưu — không re-render khi drag/resize. Xóa 5 file `stores/*.store.ts` cũ.
- **@namorix/styles (0.8.0 → 0.9.0)**: Thêm `app-network-traffic.svg`, `app-system-monitor.svg` icons + token. Thêm `--nmx-window-drag-threshold`, `--nmx-window-titlebar-cursor-offset`, `--nmx-window-cascade-step`, `--nmx-window-cascade-max-offset` tokens. Launcher/taskbar/desktop SCSS tweaks. Theme entry fix.
- **@namorix/ui (0.6.3 → 0.6.4)**: Thêm `APP_SYSTEM_MONITOR`, `APP_NETWORK_TRAFFIC` icon symbols.
- **frontend**: New addons — NetworkTraffic, SystemMonitor. Config module `config/windowDefaults.ts` cache CSS tokens. WindowFrame tách 6 hook. Fix drag restore (threshold-based), double-click restore dưới cursor, icon MAXIMIZE/RESTORE swap, min resize từ CSS token.

### 2026-05-20 — NmxRail + NetworkTraffic UI + NmxHostContext

- **@namorix/styles (0.10.0 → 0.11.0)**: NEW animation tokens (duration + easing). NEW `_rail.scss` layout component (`--nmx-rail-width`, `--nmx-rail-collapse-width`). NEW icomoon glyphs (STATS, NODES, LIST, MENU, MENU_FOLD). Updated forwards + theme CSS.
- **@namorix/ui (0.7.0 → 0.8.0)**: NEW NmxRail component suite (NmxRail, NmxRailList, NmxRailItem, NmxRailContent, NmxRailContext, types). NEW hooks/NmxHostContext.ts — `NmxHostContext` + `useIsWindowed` (check if component runs inside shell). NEW NmxIconFontSymbol — STATS, NODES, LOGS, MENU, MENU_FOLD. DELETED NmxDataTable old sub-components (Head, Body, Row, Cell).
- **frontend (0.12.1 → 0.13.0)**: NEW NetworkTraffic full UI — NmxRail sidebar + 4 tabs (Overview, Endpoints, Logs, Threats) + OverviewTab. NEW NmxHostContext Provider wrapping App in Root.tsx. i18n translations for addon tabs.

### 2026-05-20 — Reusable UI components + Settings addon + WindowFrame mount fix

- **@namorix/styles (0.9.0 → 0.10.0)**: NEW 6 component SCSS (badge, chip, pulse-dot, pagination, data-table, addon). NEW `--nmx-radius-half` token. UPDATED icomoon glyphs, theme CSS rebuilt.
- **@namorix/ui (0.6.4 → 0.7.0)**: NEW NmxBadge (severity badge), NmxChip (toggleable filter chip), NmxPulseDot (animated status dot), NmxPagination (prev/next + count), NmxDataTable (data-driven grid with columns/rows/subgrid/fallback/clickable). NEW `ARROW_PREV`, `ARROW_NEXT` icon symbols.
- **frontend (0.12.0 → 0.12.1)**: FIX WindowFrame addon mount — pass `win.app` (addon ID) instead of `winId` (Redux window ID) to `useAddonMount`. Settings addon expanded (+212 lines). Updated vite proxy target.

### 2026-05-20 — NetworkTraffic Backend Phase 1.5 (fixes)

- **backend (0.20.0 → 0.20.1)**: FIX: middleware từ HashSet → ConcurrentDictionary<(string,string),int> có EndpointId, Stopwatch đo duration, CountingStream đo Response.Body BytesWritten, IP→TrafficAddressId cache, ConcurrentDictionary cho Registry. FIX: CleanupWorker IServiceScopeFactory, Label init→set, typo + return/continue. NEW: UseTrafficMonitorAsync async scan [TrafficMonitor] controller, gắn attribute vào 8 controller. MODIFIED: Program.cs await UseTrafficMonitorAsync.

### 2026-05-19 — NetworkTraffic Backend Phase 1

- **backend (0.19.1 → 0.20.0)**: Network traffic monitoring system — 3 models (TrafficEndpoint, TrafficAddress, TrafficLog), TrafficBuffer (Channel bounded 50K DropOldest), TrafficMonitorService (CRUD + stats), TrafficMonitorMiddleware (static HashSet + Channel), TrafficMonitorController (6 admin endpoints), TrafficFlushWorker (batch 100/5s), TrafficCleanupWorker (30d retention), DI + pipeline. Migration regenerated.

### 2026-05-18

### Shared types refactoring: AddonItem, OnOpenApp, addonToItems, rectToOrigin
- **frontend (0.11.0 → 0.11.1)**: NEW shared types — `AddonItem`, `OnOpenApp` (types/addon-item.ts), `rectToOrigin` utility (types/windowing.ts). NEW `addonToItems` mapper (addons/index.ts). REFACTOR: DesktopArea + Launcher dùng `AddonItem` thay `DesktopIconData`/`LauncherAddonItem` riêng, xoá DesktopArea.types.tsx, Launcher.types.ts. RENAMED: useTaskbarRectStore.ts → taskbarRect.store.ts.

### WindowFrame full animation system, size management via CSS tokens, Settings addon scaffold
- **frontend (0.10.8 → 0.11.0)**: WindowFrame animation states — "opening", "restoring", "closing", "minimizing", "maximizing", "unmaximizing". Open: scale+fade from icon position. Close: scale+fade at center. Minimize: scale+fade toward taskbar button. Restore: scale+fade from taskbar button. Maximize/unmaximize: scale+translate between current and viewport rect. AnimState managed in window.store (not local useState) to avoid ESLint hook violations. New `useTaskbarRectStore` (Zustand) — live DOMRect lookup for taskbar buttons. Drag constraints via CSS token `--nmx-window-drag-min-visible`, read from `getComputedStyle`. Window size management via CSS tokens (`--nmx-window-default-*`, `--nmx-window-min-*`, `--nmx-window-margin`), read from `documentElement`. `NmxAddonManifest` extended with `defaultWidth`, `defaultHeight`, `preferFullSize`. Cascade/random window positioning on open. `defocusAll` added to window store — global mousedown listener defocuses when clicking outside any `.nmx-window-frame`. Launcher optimized to use `translate` individual property (GPU-composited). Settings addon scaffolded with manifest + entry + placeholder component. Taskbar minimize now triggers animation via store (not direct state change). WindowFrameView props expanded for `maximizeVars`/`unmaximizeVars` CSS custom properties.
- **@namorix/core (0.10.4 → 0.10.5)**: `NmxAddonManifest` thêm 3 field optional — `defaultWidth`, `defaultHeight`, `preferFullSize`.
- **@namorix/styles (0.7.1 → 0.8.0)**: 5 CSS tokens mới cho window sizing. 2 animation token mới. maximize/unmaximize @keyframes. Launcher animation rewrite (`translate` + `scale` individual properties). New `app-settings.svg` icon. Desktop.scss minor.
- **@namorix/ui (0.6.2 → 0.6.3)**: New `NmxIconSvgSymbol.APP_SETTINGS`.

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

### Service Error Handling — DB Failures Go Unwrapped (Intentional)
Các service method (PermissionService, SettingsService) không có try/catch cho DB operations. Nếu EF Core failed (unique constraint, connection loss, etc.), exception propagate lên controller rồi ExceptionMiddleware trả 500 generic.

**Quyết định:** Đây là lỗi hệ thống, không cần bắt. ExceptionMiddleware trả 500 đủ để người dùng biết và báo quản trị viên. Chỉ try/catch những operation quan trọng (vd: transaction rollback trong PermissionService.DeletePermission).

### Auth Filter Attribute — Inconsistent Pattern ✅ (Resolved)
Cả 3 attribute filter (`RequireAuthAttribute`, `RequireAdminAttribute`, `RequirePermissionAttribute`) đã thống nhất dùng `ActionFilterAttribute` + async `OnActionExecutionAsync`.

## Pending Fixes

### CSS URL resolution inconsistency
- `restoreTheme()` ghép URL từ `ThemeRoutes.themes.replace("{id}", ...)`
- `switchTheme()` dùng `manifest.css` trực tiếp — sau refresh load sai URL
- **Fix:** Option A — thêm `NMX_THEME_CSS_URL_KEY`, lưu URL thật, restore ưu tiên URL này, fallback ghép từ ID
- **Files:** `constants.ts`, `loader.ts` (thêm `saveThemePreference`), `ThemeProvider.tsx` (lưu URL khi switch), `auth.controller.ts` (lưu URL khi login sync)

### SetThemeRequest thiếu validation
- `UserController.cs:45-47` — `SetThemeRequest.ThemeId` thiếu `[Required]`, `[MaxLength]`
- `User.cs:16` — `ThemeId` thiếu `[MaxLength]` (các string field khác đều có)
- **Fix:** Thêm `[Required]`, `[MaxLength(100)]` vào cả 2 chỗ

### Login flow — theme fetch error propagation
- `auth.controller.ts:20-27` — Nếu GET `/api/user/theme` fail, error propagate ra caller dù login đã OK
- **Fix:** Tách try/catch riêng cho theme fetch, không block login

### ✅ Resolved
- ThemeManifest types drift — `isBuiltIn: boolean` đã có ✅
- `/api/themes` handler — đã implement ✅
- `public/themes/registry.json` — đã tạo ✅

## Next Steps

1. M3 — Internal addon: File Manager
2. M3 — Internal addon: Terminal (xterm.js)
3. M3 — Internal addon: Settings
4. Write Vitest tests for auth.service
5. Add Vietnamese translations (vi.json is empty)
