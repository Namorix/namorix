# Active Context

## Current Work Focus

M3 — Desktop Shell UI ✅ + Addon System ✅ + NetworkTraffic (SignalR) ✅ + Settings Addon ✅

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

### 2026-05-27 — Backend build fix (Directory.Build.props blocking ImplicitUsings)

- **backend (0.31.1 → 0.31.2)**: FIX build error — untracked `Namorix.Server/Directory.Build.props` overriding parent, blocking `ImplicitUsings` + `Nullable` (47 CS0246 errors). Deleted local file, moved `<Version>` to csproj. Added `<ImplicitUsings>` + `<Nullable>` directly to `Namorix.Core.csproj` (same root cause from local `Namorix.Core/Directory.Build.props`).

### 2026-05-26 (now) — Notification Center + Package Center addon scaffold

- **@namorix/core (0.24.0 → 0.25.0)**: MODIFIED `addon/types.ts` — added `notificationCenter` and `packageCenter` to LocaleKeys const.
- **@namorix/styles (0.23.0 → 0.24.0)**: NEW `app-notification-center.svg`, `app-package-center.svg` icons. MODIFIED `icons.scss` — new tokens. MODIFIED `desktop.scss` — height layout fix (`calc(100vh - taskbar-height)`). MODIFIED `taskbar.scss` — notification area. Icomoon rebuilt, theme CSS rebuilt.
- **@namorix/ui (0.18.2 → 0.18.3)**: MODIFIED `NmxIconSvg.types.ts` — added `APP_NOTIFICATION_CENTER`, `APP_PACKAGE_CENTER`. MODIFIED `NmxIconFont.types.ts` — new glyph.
- **frontend (0.29.0 → 0.30.0)**: NEW `addons/NotificationCenter/` + `addons/PackageCenter/` — addon components. MODIFIED `addons/index.ts`, `en.json`, `TaskbarView.tsx`.

### 2026-05-26 (latest) — File Manager + Terminal addon scaffold, localeKey i18n, icon tokens

- **@namorix/core (0.23.1 → 0.24.0)**: MODIFIED `addon/types.ts` — added `fileManager` and `terminal` to LocaleKeys const.
- **@namorix/styles (0.22.0 → 0.23.0)**: NEW `app-file-manager.svg`, `app-terminal.svg` icons. MODIFIED 4 existing SVG icons + `icons.scss` — new tokens. Theme CSS rebuilt.
- **@namorix/ui (0.18.1 → 0.18.2)**: MODIFIED `NmxIconSvg.types.ts` — added `APP_FILE_MANAGER`, `APP_TERMINAL` icon symbols.
- **frontend (0.28.0 → 0.29.0)**: NEW `addons/FileManager/` + `addons/Terminal/` — addon components (scaffold). MODIFIED `addons/index.ts`, `en.json`.

### 2026-05-26 (later) — About system addon (+ Vite version defines, i18n)

- **@namorix/styles (0.21.0 → 0.22.0)**: NEW `app-about.svg` icon. NEW `about.scss` — full About layout SCSS (logo, header, version, desc, meta-list, links, copyright). NEW icon token for about. Theme CSS rebuilt.
- **@namorix/ui (0.18.0 → 0.18.1)**: MODIFIED `NmxIconSvg.types.ts` — added `APP_ABOUT` SVG icon symbol.
- **frontend (0.27.0 → 0.28.0)**: NEW About addon — `About.tsx` + `About.addon.tsx` using NmxAddonRoot, NmxMetaList/NmxMetaItem, NmxButton variant="outline". NEW i18n keys (`addon.about.*`). NEW Vite `define` block — auto-injects `__APP_VERSION__`, `__CORE_VERSION__`, `__STYLES_VERSION__`, `__UI_VERSION__` from package.json files at build time.

### 2026-05-26 — MSBuild central config, CPM migration

- **backend (0.31.0 → 0.31.1)**: NEW `Directory.Build.props` — centralized MSBuild properties (version, authors, repo, Nullable, ImplicitUsings). NEW `Directory.Packages.props` — Central Package Management with 6 packages. MODIFIED 4 csproj files — removed duplicate properties, removed PackageReference Version attributes (managed centrally). REMOVED unused packages (Microsoft.AspNetCore.OpenApi, Swashbuckle.AspNetCore). DOWNGRADED Microsoft.Extensions.Caching.Memory 10.0.8 → 8.0.1.

### 2026-05-26 — LogViewer chip filter, NmxChipFilter, multi-level filter, blurry window fix, ValidationFilter

- **@namorix/styles (0.20.0 → 0.21.0)**: NEW `select-multiple.scss`, `log-viewer.scss`. NEW palette colors (slate, violet, rose). NEW `$nmx-font-sizes` map + `sizes()` mixin. MODIFIED `chip.scss` — NmxChipFilter variant (role="checkbox", checkmark), `maps.scss` — semantic-colors extended (trace/debug/fatal), `window.scss` — animation fixes, `reset.scss` — overflow hidden. Theme CSS rebuilt.
- **@namorix/ui (0.17.0 → 0.18.0)**: NEW `NmxChipFilter` — filter chip with checkbox role + inline SVG checkmark. NEW `NmxSelectMultiple` — multi-select dropdown. NEW `NmxButtonLive`, `NmxButtonRefresh` — dedicated buttons wrapping NmxButton. MODIFIED `NmxButton` — added `active`, `title` props. MODIFIED `NmxSemanticColor` — added `trace`, `debug`, `fatal`. MODIFIED `NmxChip` — semantic color support.
- **@namorix/core (0.23.0 → 0.23.1)**: MODIFIED `signalr.service.ts` — auth-expired status for reconnect detection.
- **frontend (0.26.1 → 0.27.0)**: NEW LogViewer — chip multi-level filter (NmxChipFilter), live/pause (NmxButtonLive), select-multiple. FIX `useAddonMount` — `useEffect` → `useLayoutEffect` (blurry window when opening from desktop/launcher). MODIFIED `DesktopIcon` — double-click open. MODIFIED `log.controller.ts` — `Levels[]`. NEW i18n keys.
- **backend (0.30.1 → 0.31.0)**: NEW `ValidationFilter` — global action filter (replaces auto-400 model binding). NEW `LogQueryRequest` pattern. MODIFIED `LogController` — multi-level `Levels` parsing. MODIFIED `LogService` — `Levels` filter. MODIFIED `LogEntrySerializer` — `[JsonIgnore]` Level + computed int `LevelValue`. MODIFIED `ServiceCollectionExtensions` — `SuppressModelStateInvalidFilter` + `ValidationFilter`. MODIFIED `JsonErrorMiddleware` — headers fix.

### 2026-05-25 — ILogger injection across services/middleware, SignalR reconnect loop, NmxHorizontalWrap, RequireAdmin

- **backend (0.30.0 → 0.30.1)**: NEW `HubContextExtensions.RequireAdmin()` — extension method với ILogger warning log khi non-admin gọi SignalR methods. MODIFIED `NmxHub` — ILogger injection, full logging (connect/disconnect/subscribe/unsubscribe). MODIFIED 7 services/middleware files — ILogger injection với 20+ log points across auth operations (login, register, token reuse detection, fingerprint mismatch revoke, CSRF mismatch, untrusted proxy blocked).
- **@namorix/core (0.22.0 → 0.23.0)**: MODIFIED `signalr.service.ts` — `scheduleReconnect()` with exponential backoff (5s→10s→20s→30s cap), infinite retry, `reconnectDelay` reset on successful connection.
- **@namorix/ui (0.16.1 → 0.17.0)**: NEW `NmxHorizontalWrap` — flexbox wrap layout (gap/align/justify). NEW `NmxHorizontalWrapItem` (pushRight). 
- **@namorix/styles (0.19.2 → 0.20.0)**: NEW `horizontal-wrap.scss`. Multiple component SCSS fixes. Theme CSS rebuilt.
- **frontend (0.26.0 → 0.26.1)**: MODIFIED `App.tsx` — `hasBeenConnected` state, loading overlay shows on both disconnect + reconnect (không overlay ở Login page).

### 2026-05-25 (later) — LogGroup splitting, DataDirectory fixes, LogViewer rewrite with real API + SignalR

- **backend (0.29.0 → 0.30.0)**: NEW LogGroup splitting — flat files split into subdirectories by source category (`data/logs/core/`, `data/logs/app/`, `data/logs/controller/`, `data/logs/auth/`, `data/logs/database/`, `data/logs/misc/`). NEW `MapSourceToGroup()` — maps C# namespace to LogGroup. NEW `IFlatFileStore.AppendAsync<T>(entry, subDirectory)` — subdirectory support. NEW `FileLoggerProvider` DI registration + `FlatFileOptions.MinLogLevel`. FIX `DataDirectory.PurgeCategory` — `SearchOption.AllDirectories`, `LogPattern`→`*.log`, `DateFromFileName` last-10-chars. FIX `FlatFileStore.GetFilesForCategory` — recursive search for files in subdirectories.
- **@namorix/core (0.21.0 → 0.22.0)**: NEW `types/logs.ts` module — `LogLevel` type, `LogGroup` type, `LogEntry` type with `level: number` and `group: number`. NEW `ApiLogRoutes`. MOVED `LogEntry` from `signalr/constants.ts` to `types/logs.ts`.
- **frontend (0.25.1 → 0.26.0)**: REWRITE `LogViewer.tsx` — real API via `logController.listLogs()`, SignalR real-time, `NmxDataTable`/`NmxPagination`/`NmxBadge`/`NmxSelect`/`NmxSearchInput`/`NmxButton`. NEW `log.controller.ts`. NEW i18n keys (`addon.logViewer.*`).
- **@namorix/styles (0.19.1 → 0.19.2)**: Minor SCSS tweaks (addon.scss, network-traffic cleanup, theme CSS rebuilt).

### 2026-05-25 — Core migration: shared infrastructure → Namorix.Core, Log pipeline, DI extensions

- **backend (0.28.0 → 0.29.0)**: MAJOR REFACTOR — 20+ files moved from Adapters/Server/Workers to Namorix.Core (FlatFileStore, all middleware, hubs/filters/notifiers, traffic pipeline, SecurityHeaders, NetworkHelper). NEW: Log pipeline — `LogEntrySerializer`, `LogBuffer` (Channel 50K), `LogFlushWorker` (batch 100/5s), `FileLogger`+`FileLoggerProvider` (ILogger capture), `ILogNotifier`/`SignalRLogNotifier` (SignalR broadcast), `LogService` (query), `LogController` (REST API). NEW: `ServiceCollectionExtensions.AddNamorixCore()` — one-call DI for all Core services + SignalR + rate limiter + controllers + CORS + memory cache. NEW: `ApplicationBuilderExtensions.UseNamorixCore()` — middleware pipeline with callback for CORS/Auth/TrustedProxy injection. FIX: `DataDirectory.PurgeCategory` flat file pattern. FIX: `ServiceCollectionExtensions` interface-to-itself bug. Program.cs simplified by ~80 lines.
- **@namorix/core (0.20.0 → 0.21.0)**: NEW `LogLevel` enum + SignalR Logs constants (`logs:new-entry`).
- **frontend (0.25.1 → 0.25.2)**: NetworkTraffic wiring updates, new i18n keys.

### 2026-05-24 — NmxSearchInput dropdown fixes, ParseTime bug fix, page reset, page clamp

- **@namorix/ui (0.16.0 → 0.16.1)**: FIX `NmxSearchInput` — Enter submit, suggestion click insert text, arrow keys skip disabled items, `usedKeys` prevents duplicate suggestion keys, `showDropdown` state separated from `focused`, dropdown hide on Enter/re-show on typing. NEW `insertSuggestion` useCallback.
- **@namorix/styles (0.19.0 → 0.19.1)**: FIX `search-input.scss` dropdown tweaks. Theme CSS rebuilt.
- **@namorix/core (0.19.0 → 0.20.0)**: NEW `BucketData` type + `TrafficStatsInit` event constant for cumulative stats on SignalR subscribe.
- **frontend (0.25.0 → 0.25.1)**: FIX `NetworkTrafficLogs` — page reset on filter change using `prevFilterRef`. FIX `useTrafficStatsPolling` — handles `traffic:stats-init` for stat cards.
- **backend (0.27.0 → 0.28.0)**: FIX `ParseTime` — bare hour parsing, UTC timezone, widened window. FIX `GetLogs` — page clamp. NEW `TrafficStatsWorker`. NEW `traffic:stats-init` on subscribe with cumulative `BucketData[]`. NEW CsvHelper dependency.

- **backend (0.26.0 → 0.27.0)**: COMPLETE REWRITE of traffic storage from EF Core/PostgreSQL to flat file system. New infrastructure: `IFlatFileSerializer<T>`, `IFlatFileStore`/`FlatFileStore`, `DataDirectory` (Core.IO). New flat model `TrafficLogSerializer` with no FK entities. New filter/predicate system (`TrafficLogFilter`+`TrafficLogFilterParser`+`TrafficLogFilterPredicate`). `TrafficMonitorService`, `TrafficFlushWorker`, `TrafficCleanupWorker` rewritten to use flat file stack. `TrafficMonitorMiddleware` simplified — no endpoint/address registry. `TrafficMonitorController` cleaned up. Deleted EF Core traffic models and migrations.
- **@namorix/core (0.18.1 → 0.19.0)**: NEW `hooks/` module with `usePageSize` hook (localStorage persistence). NEW `PaginationDefaults`. NEW i18n keys for pagination/table.
- **@namorix/ui (0.15.0 → 0.16.0)**: MODIFIED `NmxPagination` — `elapsedMs`, `pageSize`, `pageSizeOptions`, `onPageSizeChange`. MODIFIED `NmxSearchInput` — suggestions dropdown with keyboard nav. MODIFIED `NmxFormInput` — `ref` prop. MODIFIED `NmxSelect` — `placeholder` prop.
- **@namorix/styles (0.18.0 → 0.19.0)**: NEW `pagination.scss`. MODIFIED `search-input.scss` — suggestions dropdown. NEW elevation tokens (`--nmx-search-shadow`, `--nmx-pagination-shadow`). NEW icomoon glyphs. Theme CSS rebuilt.
- **frontend (0.24.0 → 0.25.0)**: NetworkTraffic — flat model refactoring, removed endpoints tab. Deleted `NetworkTrafficEndpoints.tsx`, `LogViewer.scss`. Updated i18n keys.

### 2026-05-23 — NmxSearchInput, PostgreSQL migration, search filter API

- **@namorix/ui (0.14.0 → 0.15.0)**: NEW `NmxSearchInput` — search input with icon + clear, uses NmxFormInput, `onSubmit` prop. MODIFIED `NmxTabContext` — `useNmxTabContext<T>()` generic. MODIFIED `NmxTabProvider` + `NmxToolbar` — `onTabChange` callback. MODIFIED `NmxTagInput` — full rewrite (scroller-wrap, keyboard nav, dropdown isolation). MODIFIED `NmxFormInput` — `ref` prop.
- **@namorix/styles (0.17.0 → 0.18.0)**: NEW `search-input.scss`. NEW `network-traffic.scss` — container-type, toolbar-actions flex, search container query. MODIFIED `tag-input.scss`, `form.scss`, `launcher.scss`. Theme CSS rebuilt.
- **frontend (0.23.0 → 0.24.0)**: NetworkTraffic search — NmxSearchInput + debounce 500ms + filter + onTabChange clear. Launcher — uses NmxSearchInput. NetworkTrafficLogs — filter prop, API search. i18n — searchPlaceholder key.
- **backend (0.25.1 → 0.26.0)**: SQLite → PostgreSQL (Npgsql). NEW `search` param in `GET /api/traffic/logs`. MODIFIED TrafficMonitorService — Include TrafficAddress, search filter. PostgreSQL migrations regen.

### 2026-05-23 — NmxToolbar ecosystem, NmxTabContext, zOrder, data-table responsive

- **@namorix/ui (0.13.0 → 0.14.0)**: NEW `NmxToolbar/` — composable toolbar system replacing NmxRail in horizontal layouts. NEW `NmxTabContext` + `NmxTabProvider` — shared tab context for both NmxToolbar and NmxRail (removes manual useTabCache boilerplate). NEW `NmxAddonRoot/Page` — addon layout wrappers. NEW `hooks/`, `breakpointDefaults.ts`, `cssVariableCache.ts`. MODIFIED `NmxRail` — generic `<T>`, NmxTabContext. MODIFIED `NmxDataTable` — responsive columns via hideBelow + ResizeObserver + breakpoint CSS vars. MODIFIED `NmxRail.types` — removed activeKey/onActiveTabChange.
- **@namorix/styles (0.16.0 → 0.17.0)**: NEW `toolbar.scss` — full toolbar component SCSS. NEW `tokens/breakpoint.scss` — `--nmx-breakpoint-*` CSS vars. NEW `addon.scss` — `.nmx-addon-page` with data-table/pagination slots. NEW `--nmx-window-titlebar-height` token. MODIFIED `data-table.scss` — removed bg/border/shadow, new header styling (surface-mid, xs font). MODIFIED `settings.scss` — BEM nesting.
- **frontend (0.22.0 → 0.23.0)**: REWRITE NetworkTraffic — NmxRail → NmxToolbar. REFACTOR Settings — useTabCache/Show → NmxTabContext. MODIFIED windowsSlice — zOrder tách khỏi order (taskbar order, WM zOrder). MODIFIED WindowManager — render theo zOrder. MODIFIED windowSelectors — zOrder selectors. MODIFIED windowDefaults — cleanup. i18n +9 keys.

### 2026-05-23 — SCSS token cleanup, NmxSettings components, rail container query, mount size vars

- **@namorix/ui (0.12.0 → 0.13.0)**: NEW `NmxSettingsSection`, `NmxSettingsCard`, `NmxSettingsRow`, `NmxAccentColorPicker` — reusable settings layout components. MODIFIED `NmxRailContent` — ResizeObserver sets `--nmx-rail-content-width/height` CSS vars. MODIFIED `NmxRail` — `container-type: inline-size` + CSS container query auto-collapse under 640px. Token fallback cleanup in Select/Slider/SegmentedGroup.
- **@namorix/styles (0.15.0 → 0.16.0)**: NEW `settings.scss` component SCSS. NEW `$nmx-breakpoint-*` SCSS variables (sm/md/lg/xl). NEW `--nmx-letter-spacing-wider` typography token. MODIFIED `rail.scss` — container query. DELETED setting.scss section/card/row/accent moved to settings.scss. Icomoon glyphs updated, theme CSS rebuilt.
- **frontend (0.21.0 → 0.22.0)**: SettingsAppearance refactored to use NmxSettings components. `useAddonMount` — ResizeObserver sets `--nmx-mount-width/height` CSS vars on mount container.
- **backend (0.25.0 → 0.25.1)**: Removed duplicate stats endpoint from TrafficMonitorController.

### 2026-05-22 — Settings Appearance UI with 3 new UI primitives

- **@namorix/ui (0.11.2 → 0.12.0)**: NEW `NmxSelect` — styled native `<select>` primitive. NEW `NmxSlider` — range slider primitive. NEW `NmxSegmentedGroup` — segmented button group primitive.
- **@namorix/styles (0.14.2 → 0.15.0)**: NEW `select.scss`, `slider.scss`, `segmented-group.scss` component SCSS. MODIFIED `setting.scss` — full appearance layout (section, card, row, theme-grid, theme-card, accent color).
- **@namorix/core (0.18.0 → 0.18.1)**: MODIFIED `i18n/locales/en.json` + `vi.json` — added 20 `addon.settings.appearance.*` translation keys.
- **frontend (0.20.0 → 0.21.0)**: REWRITE `SettingsAppearance.tsx` — full UI with 4 sections (Theme, Layout, Typography, Language & Region) using new primitives.

### 2026-05-22 — change password, user controller, resolveError, logout button, bug fixes

- **backend (0.24.1 → 0.25.0)**: NEW `UserController.PUT "password"` — change password endpoint. NEW `ChangePasswordSchema` — validation schema. NEW `UserService.ChangePasswordAsync()` — verify + hash password. MODIFIED `Error.cs` — added `IncorrectPassword`, `PasswordChangeFailed`.
- **@namorix/core (0.17.0 → 0.18.0)**: NEW `resolveError()` utility. MODIFIED `types/error.ts` — new auth error codes. MODIFIED `validation-messages.ts` — new resolveAuthError cases. MODIFIED `i18n/locales/en.json` — new translation keys. FIX `apiRoutes.ts` — password route moved to API_USER_BASE. FIX `theme/registry.ts` — dedup themes.
- **@namorix/styles (0.14.1 → 0.14.2)**: Launcher logout CSS, taskbar refinements, icon/theme updates.
- **@namorix/ui (0.11.1 → 0.11.2)**: FIX NmxToggle checked/defaultChecked.
- **frontend (0.19.0 → 0.20.0)**: Launcher logout button. auth.controller — isLoggingOut flag tránh Blocked popup. App.tsx — skip setBlocked when intentional. SettingsAccount — refactored to controller + resolveError. settings.controller — added changePassword. Password route moved to ApiUserRoutes.

### 2026-05-22 — nmxStore, admin role filtering, mobile support, launcher overflow fix

- **@namorix/core (0.16.0 → 0.17.0)**: NEW `store/` module — nmxStore observable singleton (get/set/subscribe/useNmxStore hook), accessors (useUserStore, setThemeStore, useRegisterEnabledStore), initStores auto-init at module level. NEW `utils/isMobile.ts`. MODIFIED `addon/types.ts` — AddonContext passes nmxStore, removed locale/theme; NmxAddonManifest added role? field. MODIFIED `auth/auth.service.ts` — auto-populate user + registerEnabled into nmxStore. DELETED `providers/ThemeProvider.tsx`, `theme/themeStore.ts` (replaced by accessors).
- **@namorix/styles (0.14.0 → 0.14.1)**: FIX launcher mobile overflow (left: 0 + translate → left: spacing-md + right: spacing-md).
- **@namorix/ui (0.11.0 → 0.11.1)**: Bug fixes for canvas sparkline, NmxRail, NmxStatCard.
- **frontend (0.18.0 → 0.19.0)**: Admin role-based addon filtering (listAddons filter by userRole), mobile window support (auto-maximize + hide maximize button), Settings admin-only system tab, launcher/desktop role-filtered addons. MODIFIED `registry.ts`, `useLauncherSearch.ts`, `DesktopArea.tsx`, `WindowFrameView.tsx`, `WindowTitleBar.tsx`, `useOpenWindow.ts`, `Root.tsx`, `Login.tsx`, `useAddonMount.ts`.
- **backend (0.24.0 → 0.24.1)**: FIX NmxHub.cs — SubscribeTraffic admin check dùng `FindFirst(JwtClaims.Role)` thay `IsInRole()`. FIX NmxHubFilter — let HubException pass through.

## Recent Changes

### 2026-05-21 — Settings addon (full 3 tabs), NmxTagInput, themeStore, NetworkTraffic Logs/Threats

- **@namorix/core (0.14.2 → 0.15.0)**: NEW `theme/themeStore.ts` — module-level singleton for cross-root theme state (get/set/subscribe). NEW `useThemeStore()` hook. MODIFIED `ThemeProvider.tsx` — refactored to use themeStore (broadcast via `themeStore.set()`). NEW `ApiSettingsRoutes` (proxies, origins). NEW `ApiUserRoutes.password`.
- **@namorix/ui (0.9.2 → 0.10.0)**: NEW `NmxTagInput` — controlled tag input with keyboard shortcuts (Enter/Tab/comma tạo tag, Backspace xoá cuối, Escape đóng dropdown), suggestions "Create" fallback. NEW icon symbols: APPEARANCE, SETTING, USER.
- **@namorix/styles (0.12.3 → 0.13.0)**: NEW `tag-input.scss`. NEW Settings addon styles trong `addon.scss`. New icomoon glyphs. Spacing token updates.
- **frontend (0.16.0 → 0.17.0)**: NEW Settings addon — NmxRail + 3 tabs (Appearance theme picker, System proxies/origins form, Account info + change password). NEW `settings.controller.ts`. NEW `NetworkTrafficLogs.tsx` + `NetworkTrafficThreats.tsx` + `utils.ts`. MODIFIED `Settings.tsx` — replace mock. MODIFIED `i18n/en.json` — settings + network traffic keys.
- **backend (0.23.0 → 0.23.1)**: FIX `TrafficAddress.cs` — removed cyclic reference. Migration regenerated.

### 2026-05-21 — TrafficMonitorAttribute redesign: TrafficX attributes, middleware refactor, endpoints tab

- **backend (0.22.1 → 0.23.0)**: NEW TrafficGet/Post/Put/Delete/Patch attributes extending HttpMethodAttribute with Label. MODIFIED `UseTrafficMonitorAsync` — chỉ scan TrafficX (Label property), bỏ fallback [TrafficMonitor] filter. MODIFIED `AuthController` — `[HttpPost]` → `[TrafficPost]` trên all methods, auto-disable register sau khi tạo admin. DELETED `[TrafficMonitor]` class-level trên 7 controllers.
- **frontend (0.15.1 → 0.16.0)**: NEW `NetworkTrafficEndpoints.tsx` — endpoints tab với NmxDataTable. MODIFIED `NetworkTraffic.tsx` — wire endpoints tab. MODIFIED `traffic.controller.ts` — `listEndpoints()`. NEW i18n keys.
- **@namorix/ui (0.9.1 → 0.9.2)**: MODIFIED `NmxBadge.tsx` — `bgEnabled` prop. MODIFIED `NmxDataTable` — `disableEllipsisHeader`, `disableEllipsisCell`.
- **@namorix/styles (0.12.2 → 0.12.3)**: SCSS tweaks for badge, data-table, network-traffic.
- **@namorix/core (0.14.1 → 0.14.2)**: NEW `HttpMethods` + `HttpMethod` type.

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
2. M3 — Permission tree UI (deferred)
3. Write Vitest tests for auth.service
