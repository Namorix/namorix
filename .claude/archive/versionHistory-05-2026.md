# Version History — May 2026

## 2026-05-28 — Settings appearance 3-layer cascade, NmxDialog + NmxAlertDialog, SettingsController refactor

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/ui | 0.18.4 → 0.19.0 | NEW: `NmxDialog` (composite with Header/Body/Footer, React Portal, size variants, dismissable). NEW: `NmxAlertDialog` (confirm/cancel dialog with NmxInlineAlert + NmxButton). MODIFIED: `Components/index.ts` — barrel exports for both. |
| @namorix/styles | 0.24.1 → 0.25.0 | NEW: `dialog.scss` — full dialog SCSS (overlay, panel, sizes, header/close button, body, footer). MODIFIED: `button.scss`, `data-table.scss`, `settings.scss`, `index.scss`. Theme CSS rebuilt. |
| @namorix/core | 0.25.0 → 0.25.1 | MODIFIED: `apiRoutes.ts` — added `ApiSettingsRoutes.appearanceOptions`. |
| frontend | 0.31.0 → 0.32.0 | REWRITE: `SettingsAppearance.tsx` — 3-layer cascade (user override → system default → hardcoded), fetches options from API. MODIFIED: `settings.controller.ts` — added `getAppearanceOptions()`, renamed `getAll()` → `getSystem()`, `setAll()` → `setSystem()`. MODIFIED: `SettingsSystem.tsx` — updated method names. MODIFIED: `en.json` — new translation keys. |
| Namorix.Core | 0.31.2 → 0.32.0 | NEW: `Data/AppearanceOptionsData.cs` — static data class (AccentColors, FontFamilies, Densities, FontSizes, Languages, DateFormats). ENHANCED: `Middleware/RequireAdminAttribute.cs` — ILogger injection, user ID/username logging on forbidden. |
| Namorix.Server | 0.31.2 → 0.32.0 | REFACTOR: `SettingsController.cs` — changed from `[RequireAdmin]` class-level to `[RequireAuth]` + per-method `[RequireAdmin]`, consolidated endpoints to `GET/PUT "system"`. NEW: `GET "appearance/options"` endpoint (public, no admin required). |

## 2026-05-27 — TrafficMonitorFilter, FlatFileStore sort fix, LogViewer live/refresh, SearchInput suggestion fix

| Package | Version | Changes |
|---------|---------|---------|
| Namorix.Core | 0.31.2 → 0.31.3 | NEW: `TrafficMonitorFilter` (IAsyncActionFilter) — replaces `TrafficMonitorMiddleware`, only logs endpoints with `[TrafficMonitor]` attribute. FIX: `FlatFileStore.QueryAsync` — sort entries by timestamp DESC instead of file path order (fix log grouping by category). MODIFIED: `ServiceCollectionExtensions` — register filter globally. MODIFIED: `ApplicationBuilderExtensions` — removed `UseTrafficMonitor()`, changed methods to private. REMOVED: `TrafficMonitorMiddleware.cs`. |
| @namorix/ui | 0.18.3 → 0.18.4 | FIX: `NmxButtonLive` — minor fix. FIX: `NmxSearchInput` — suggestion key prefix conflict (`p=` vs `ip=`). |
| @namorix/styles | 0.24.0 → 0.24.1 | FIX: `search-input.scss` — suggestion dropdown styling adjustments. Theme CSS rebuilt. |
| frontend | 0.30.0 → 0.31.0 | NEW: `LogViewer.tsx` — wired `NmxButtonRefresh` + `NmxButtonLive` (live toggle, SignalR group subscribe conditional on live state, refreshKey re-fetch). MODIFIED: `NetworkTraffic.tsx` + `NetworkTrafficLogs.tsx` — feature updates. |

## 2026-05-27 — Backend build fix (Directory.Build.props blocking ImplicitUsings)

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.31.1 → 0.31.2 | FIX: `Namorix.Server/Directory.Build.props` (untracked) override `src/Directory.Build.props`, chặn `ImplicitUsings` + `Nullable` → 47 lỗi build. Xóa file local, chuyển `<Version>` vào csproj. FIX: `Namorix.Core.csproj` — thêm trực tiếp `<ImplicitUsings>` + `<Nullable>`. |

## 2026-05-26 (even later) — Notification Center + Package Center addon scaffold

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.24.0 → 0.25.0 | MODIFIED: `addon/types.ts` — added `notificationCenter` and `packageCenter` to `LocaleKeys` const. |
| @namorix/styles | 0.23.0 → 0.24.0 | NEW: `base/icons/app-notification-center.svg`, `app-package-center.svg` icons. MODIFIED: `base/tokens/icons.scss` — new icon tokens. MODIFIED: icomoon rebuilt, `desktop.scss` layout fix, `taskbar.scss` notification area. Theme CSS rebuilt (default + dark). |
| @namorix/ui | 0.18.2 → 0.18.3 | MODIFIED: `NmxIconSvg.types.ts` — added `APP_NOTIFICATION_CENTER`, `APP_PACKAGE_CENTER` icon symbols. MODIFIED: `NmxIconFont.types.ts` — new font icon symbol. |
| frontend | 0.29.0 → 0.30.0 | NEW: `addons/NotificationCenter/` + `addons/PackageCenter/` — addon components. MODIFIED: `addons/index.ts`, `i18n/locales/en.json`, `TaskbarView.tsx`. |

## 2026-05-26 (latest) — File Manager + Terminal addon scaffold, localeKey i18n, icon tokens

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.23.1 → 0.24.0 | MODIFIED: `addon/types.ts` — added `fileManager` and `terminal` to `LocaleKeys` const. |
| @namorix/styles | 0.22.0 → 0.23.0 | NEW: `base/icons/app-file-manager.svg`, `app-terminal.svg` icons. MODIFIED: 4 existing SVGs (about, logs, settings, system-monitor) — minor tweaks. MODIFIED: `base/tokens/icons.scss` — new icon tokens. Theme CSS rebuilt (default + dark). |
| @namorix/ui | 0.18.1 → 0.18.2 | MODIFIED: `NmxIconSvg.types.ts` — added `APP_FILE_MANAGER`, `APP_TERMINAL` icon symbols. |
| frontend | 0.28.0 → 0.29.0 | NEW: `addons/FileManager/` + `addons/Terminal/` — addon components (defineAddon + registerAddon). MODIFIED: `addons/index.ts`, `i18n/locales/en.json`. |

## 2026-05-26 (later) — About system addon (+ Vite version defines, i18n)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.21.0 → 0.22.0 | NEW: `base/icons/app-about.svg`. NEW: `base/shell/addon/about.scss` — full About layout (logo, header, version, desc, meta-list, links, copyright). MODIFIED: `base/tokens/icons.scss` — new about icon token. Theme CSS rebuilt. |
| @namorix/ui | 0.18.0 → 0.18.1 | MODIFIED: `NmxIconSvg.types.ts` — added `APP_ABOUT` icon symbol. |
| frontend | 0.27.0 → 0.28.0 | NEW: `addons/About/` — About system addon (defineAddon + registerAddon, NmxAddonRoot, NmxMetaList, NmxButton). NEW: `vite.config.ts` — `define` block injecting `__APP_VERSION__`, `__CORE_VERSION__`, `__STYLES_VERSION__`, `__UI_VERSION__`. NEW: i18n `addon.about.*` keys. MODIFIED: `addons/index.ts` — import About. |

## 2026-05-26 — MSBuild central config, CPM migration

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.31.0 → 0.31.1 | NEW: `Directory.Build.props` — shared MSBuild properties (Version, Authors, RepositoryUrl, Nullable, ImplicitUsings). NEW: `Directory.Packages.props` — Central Package Management (BCrypt.Net-Next, EF Core, Sqlite, Design, Caching.Memory, System.IdentityModel.Tokens.Jwt). MODIFIED: 4 csproj files — removed duplicate properties, PackageReference Version (managed centrally). REMOVED: Microsoft.AspNetCore.OpenApi, Swashbuckle.AspNetCore. DOWNGRADED: Microsoft.Extensions.Caching.Memory 10.0.8 → 8.0.1 (net8.0 compat). |

## 2026-05-26 — LogViewer chip filter, NmxChipFilter, multi-level filter, blurry window fix, ValidationFilter

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.20.0 → 0.21.0 | NEW: `select-multiple.scss`, `log-viewer.scss`. NEW: palette colors (slate, violet, rose). NEW: `$nmx-font-sizes` map, `sizes()` mixin. MODIFIED: `chip.scss` — NmxChipFilter variant, `maps.scss` — semantic-colors extended (trace/debug/fatal), `reset.scss` — overflow hidden, `window.scss` — will-change fix. Theme CSS rebuilt. |
| @namorix/ui | 0.17.0 → 0.18.0 | NEW: `NmxChipFilter` — filter chip with checkbox role, inline SVG checkmark. NEW: `NmxSelectMultiple` — multi-select dropdown. NEW: `NmxButtonLive`, `NmxButtonRefresh`. MODIFIED: `NmxButton` — `active`, `title` props. MODIFIED: `NmxSemanticColor` — added `trace`, `debug`, `fatal`. MODIFIED: `NmxChip` — `semantic` color support. |
| @namorix/core | 0.23.0 → 0.23.1 | MODIFIED: `signalr.service.ts` — auth-expired status support. |
| frontend | 0.26.1 → 0.27.0 | NEW: LogViewer — chip multi-level filter (NmxChipFilter), live/pause (NmxButtonLive). NEW: NmxSelectMultiple in LogViewer. MODIFIED: `useAddonMount` — `useEffect` → `useLayoutEffect` (fix blurry window). MODIFIED: `DesktopIcon` — double-click open. MODIFIED: `log.controller.ts` — `Levels[]` query param. |
| backend | 0.30.1 → 0.31.0 | NEW: `ValidationFilter` — global action filter. MODIFIED: `LogController` — `LogQueryRequest` pattern, `Levels` parsing. MODIFIED: `LogService` — `Levels` property (int[]). MODIFIED: `LogEntrySerializer` — `[JsonIgnore]` Level + `LevelValue`. MODIFIED: `ServiceCollectionExtensions` — `SuppressModelStateInvalidFilter` + `ValidationFilter`. MODIFIED: `JsonErrorMiddleware` — headers fix. |

## 2026-05-25 (later) — LogGroup splitting, DataDirectory fixes, LogViewer rewrite with real API + SignalR

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.30.0 | NEW: `LogGroups` constants (core/app/controller/auth/database/misc). NEW: `LogEntrySerializer.MapSourceToGroup`. NEW: `IFlatFileStore.AppendAsync<T>(entry, subDirectory)`. NEW: `FileLoggerProvider` DI registration. NEW: `FlatFileOptions.MinLogLevel`. MODIFIED: `LogFlushWorker` — passes `LogGroup` as subdirectory. MODIFIED: `FlatFileStore.GetFilesForCategory` — `SearchOption.AllDirectories`. MODIFIED: `DataDirectory.PurgeCategory` — `SearchOption.AllDirectories`, `LogPattern → *.log`, `DateFromFileName` last-10-chars. |
| @namorix/core | 0.22.0 | NEW: `types/logs.ts` — `LogLevel`, `LogGroup`, `LogEntry` types. NEW: `ApiLogRoutes`. MOVED: `LogEntry` from `signalr/constants.ts` → `types/logs.ts`. |
| @namorix/styles | 0.19.2 | MODIFIED: `addon.scss` — minor LogViewer styling. DELETED: unused `network-traffic.scss`. Theme CSS rebuilt. |
| frontend | 0.26.0 | REWRITE: `LogViewer.tsx` — real API via `logController.listLogs()`, SignalR real-time, NmxDataTable (5 columns), NmxPagination, NmxSelect, NmxSearchInput, NmxBadge. NEW: `log.controller.ts`. NEW: i18n `addon.logViewer.*` keys. |

## 2026-05-25 — ILogger injection across services/middleware, SignalR reconnect loop, NmxHorizontalWrap, RequireAdmin

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.30.1 | NEW: `HubContextExtensions.RequireAdmin()` with ILogger warning. MODIFIED: `NmxHub` — ILogger injection, connect/disconnect/subscribe/unsubscribe logging. MODIFIED: 7 files — ILogger injection (20+ log points across auth operations). |
| @namorix/core | 0.23.0 | MODIFIED: `signalr.service.ts` — `scheduleReconnect()` with exponential backoff (5s→30s cap), infinite retry, reset on success. |
| @namorix/ui | 0.17.0 | NEW: `NmxHorizontalWrap` — flexbox wrap layout. NEW: `NmxHorizontalWrapItem` (pushRight). |
| @namorix/styles | 0.20.0 | NEW: `horizontal-wrap.scss`. Multiple component SCSS fixes. Theme CSS rebuilt. |
| frontend | 0.26.1 | MODIFIED: `App.tsx` — `hasBeenConnected` state, loading overlay on disconnect + reconnect (no overlay on Login). |

## 2026-05-25 — Core migration: shared infrastructure moved to Namorix.Core, new Log pipeline, DI extensions

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.29.0 | MAJOR REFACTOR: 20+ files moved from Adapters/Server/Workers → `Namorix.Core` (FlatFileStore, TrafficLogSerializer, TrafficBuffer, traffic workers, TrafficMonitorService/Controller/Middleware, all middleware, all hubs/filters/notifiers, NetworkHelper). NEW: `LogController` (GET/DELETE /api/logs). NEW: `ServiceCollectionExtensions.AddNamorixCore()`. NEW: `ApplicationBuilderExtensions.UseNamorixCore()`. NEW: Log pipeline — `LogEntrySerializer`, `LogBuffer` (Channel 50K), `LogFlushWorker` (batch 100/5s), `FileLogger`+`FileLoggerProvider`, `ILogNotifier`/`SignalRLogNotifier`, `LogService`. NEW: `Constants/Log.cs`. NEW: `Infrastructure/ILogNotifier.cs`. FIX: `ServiceCollectionExtensions` — interface-to-itself bug. FIX: `DataDirectory.PurgeCategory`. MOVED: `SecurityHeadersMiddleware` → Core. SIMPLIFIED: `Program.cs` ~80 lines. |
| @namorix/core | 0.21.0 | NEW: `LogLevel` enum. NEW: `signalr/constants.ts` — Logs SignalRGroups + SignalREvent (`logs:new-entry`). |
| frontend | 0.25.2 | MODIFIED: `NetworkTraffic.tsx` wiring. MODIFIED: i18n keys. |

## 2026-05-24 — NmxSearchInput dropdown fixes, ParseTime timezone/window fix, page reset, page clamp

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/ui | 0.16.1 | FIX: NmxSearchInput — Enter submit, suggestion click, arrow keys, `usedKeys`, `showDropdown` separated. NEW: `insertSuggestion` useCallback. |
| @namorix/styles | 0.19.1 | FIX: `search-input.scss` dropdown. Theme CSS rebuilt. |
| @namorix/core | 0.20.0 | NEW: `BucketData` type. NEW: `TrafficStatsInit` event constant. |
| frontend | 0.25.1 | FIX: `NetworkTrafficLogs` — page reset on filter change. FIX: `useTrafficStatsPolling` — handles `traffic:stats-init`. |
| backend | 0.28.0 | FIX: `ParseTime` — bare hour parsing, UTC timezone, widened window. FIX: `GetLogs` — page clamp. NEW: `TrafficStatsWorker`. NEW: `traffic:stats-init` on subscribe. NEW: CsvHelper dependency. |

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.27.0 | MAJOR REWRITE: EF Core/PostgreSQL → flat file storage for NetworkTraffic. NEW: `IFlatFileSerializer<T>`, `IFlatFileStore`, `FlatFileStore`, `DataDirectory` (Core.IO), `TrafficLogSerializer` (flat model). NEW: `TrafficLogFilter`+`TrafficLogFilterParser`+`TrafficLogFilterPredicate`. REWRITTEN: `TrafficMonitorService`, `TrafficFlushWorker`, `TrafficCleanupWorker`. SIMPLIFIED: `TrafficMonitorMiddleware`, `TrafficMonitorController`. DELETED: EF traffic models, migrations. |
| @namorix/core | 0.19.0 | NEW: `hooks/usePageSize` (localStorage persistence). NEW: `PaginationDefaults`. NEW: i18n keys. |
| @namorix/ui | 0.16.0 | MODIFIED: `NmxPagination` — `elapsedMs`, `pageSize`, `pageSizeOptions`, `onPageSizeChange`. MODIFIED: `NmxSearchInput` — suggestions dropdown with keyboard nav. MODIFIED: `NmxFormInput` — `ref` prop. MODIFIED: `NmxSelect` — `placeholder` prop. |
| @namorix/styles | 0.19.0 | NEW: `pagination.scss`. MODIFIED: `search-input.scss` — suggestions. NEW: `--nmx-search-shadow`, `--nmx-pagination-shadow`. NEW: icomoon glyphs. Theme CSS rebuilt. |
| frontend | 0.25.0 | MODIFIED: NetworkTraffic — flat model, removed endpoints tab. DELETED: `NetworkTrafficEndpoints.tsx`. Updated i18n. |

## 2026-05-23 — NmxToolbar ecosystem, NmxTabContext, zOrder, data-table responsive

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/ui | 0.14.0 | NEW: `NmxToolbar/` — composable toolbar system. NEW: `NmxTabContext` + `NmxTabProvider`. NEW: `NmxAddonRoot`/`NmxAddonPage`. NEW: `hooks/`, `breakpointDefaults.ts`, `cssVariableCache.ts`. MODIFIED: `NmxRail` — generic `<T>`, NmxTabContext. MODIFIED: `NmxDataTable` — responsive via `hideBelow` + ResizeObserver. MODIFIED: `NmxRail.types` — removed activeKey/onActiveTabChange. |
| @namorix/styles | 0.17.0 | NEW: `toolbar.scss`, `tokens/breakpoint.scss`, `addon.scss`, `--nmx-window-titlebar-height`. MODIFIED: `data-table.scss` — removed bg/border/shadow. MODIFIED: `settings.scss` — BEM nesting. |
| frontend | 0.23.0 | REWRITE: NetworkTraffic — NmxRail → NmxToolbar. REFACTOR: Settings — useTabCache → NmxTabContext. MODIFIED: `windowsSlice` — zOrder separate from order. MODIFIED: WindowManager — render by zOrder. |

## 2026-05-23 — SCSS token cleanup, NmxSettings components, rail container query

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.16.0 | NEW: `settings.scss`, `$nmx-breakpoint-*` variables, `--nmx-letter-spacing-wider`. MODIFIED: `rail.scss` — container query auto-collapse. DELETED: `setting.scss`. Theme CSS rebuilt. |
| @namorix/ui | 0.13.0 | NEW: `NmxSettingsSection/Card/Row/AccentColorPicker`. MODIFIED: `NmxRailContent` — ResizeObserver sets CSS vars. MODIFIED: `NmxRail` — container-type. |
| frontend | 0.22.0 | MODIFIED: `SettingsAppearance` — uses NmxSettings components. MODIFIED: `useAddonMount` — ResizeObserver sets CSS vars. |
| backend | 0.25.1 | FIX: duplicate stats endpoint removed. |

## 2026-05-22 — Settings Appearance UI with 3 new UI primitives

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/ui | 0.12.0 | NEW: `NmxSelect`, `NmxSlider`, `NmxSegmentedGroup` primitives. |
| @namorix/styles | 0.15.0 | NEW: `select.scss`, `slider.scss`, `segmented-group.scss`. MODIFIED: `setting.scss` — appearance layout. |
| @namorix/core | 0.18.1 | MODIFIED: i18n — 20 appearance translation keys. |
| frontend | 0.21.0 | REWRITE: `SettingsAppearance.tsx` — 4 sections with new primitives. |

## 2026-05-22 — change password, user controller, resolveError, logout button, bug fixes

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.25.0 | NEW: `UserController.PUT "password"`. NEW: `ChangePasswordSchema`. NEW: `UserService.ChangePasswordAsync()`. MODIFIED: `Error.cs` — `IncorrectPassword`, `PasswordChangeFailed`. |
| @namorix/core | 0.18.0 | NEW: `resolveError()` utility. MODIFIED: error types, validation-messages, i18n, apiRoutes. FIX: `theme/registry.ts` — dedup themes. |
| @namorix/styles | 0.14.2 | MODIFIED: `launcher.scss` — logout footer, `taskbar.scss`, icon fonts. |
| @namorix/ui | 0.11.2 | FIX: `NmxToggle` — checked/defaultChecked. |
| frontend | 0.20.0 | NEW: Launcher logout button. MODIFIED: `auth.controller.ts` — `isLoggingOut` flag. MODIFIED: `App.tsx` — skip `setBlocked` on intentional logout. MODIFIED: `SettingsAccount.tsx` — controller + resolveError. |

## 2026-05-22 — nmxStore, admin role filtering, mobile support, launcher overflow fix

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.17.0 | NEW: `store/` module — nmxStore singleton, useNmxStore hook, accessors (useUserStore, setThemeStore, useRegisterEnabledStore). NEW: `utils/isMobile.ts`. MODIFIED: `addon/types.ts` — AddonContext nmxStore, manifest role field. MODIFIED: `auth/auth.service.ts` — auto-populate nmxStore. DELETED: `ThemeProvider.tsx`, `themeStore.ts`. |
| @namorix/styles | 0.14.1 | FIX: `launcher.scss` — mobile overflow. |
| @namorix/ui | 0.11.1 | FIX: canvas sparkline, NmxRail, NmxStatCard. |
| frontend | 0.19.0 | NEW: Admin role-based addon filtering, mobile auto-maximize, Settings system tab (admin-only). MODIFIED: registry, launcher, desktop, WindowFrame, WindowTitleBar, useOpenWindow. |
| backend | 0.24.1 | FIX: NmxHub — SubscribeTraffic admin role check. FIX: NmxHubFilter — let HubException pass through. |

## 2026-05-22 — SignalR error handling, loading overlay, settings register toggle, maximize fix

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.16.0 | NEW: `useSignalRStatus` hook. NEW: `UserRole` constants. MODIFIED: signalr.service — status events, addOnCloseHandler. NEW: ApiSettingsRoutes.register. NEW: error codes, i18n keys. |
| @namorix/ui | 0.11.0 | NEW: `NmxLoading` primitive (full-screen overlay, spinner). MODIFIED: NmxToggle checked prop fix. NmxInlineAlert refactor. |
| @namorix/styles | 0.14.0 | NEW: `loading.scss`, `setting.scss` (profile, meta). MODIFIED: `taskbar.scss` — signal icon states with blink. `blocked.scss` — refresh button. |
| frontend | 0.18.0 | NEW: App.tsx — SignalR close handler + heartbeat, NmxLoading. NEW: Blocked.tsx refresh button. NEW: Taskbar signal status icon. NEW: settings.controller. MODIFIED: useAuthForm alert pattern. SettingsSystem register toggle. SettingsAccount profile header. WindowFrameView maximize fix. |
| backend | 0.24.0 | NEW: SettingsController — consolidated GET/PUT, register toggle. MODIFIED: SettingsService — GetAllAsync, SetAllAsync, cache fix. |

## 2026-05-21 (Settings addon: full 3 tabs, NmxTagInput, themeStore, controllers; NetworkTraffic Logs/Threats)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.15.0 | NEW: `themeStore`, `useThemeStore`, `ApiSettingsRoutes`, `ApiUserRoutes.password`. MODIFIED: `ThemeProvider` — uses themeStore. |
| @namorix/ui | 0.10.0 | NEW: `NmxTagInput` — keyboard shortcuts, dropdown with "Create" fallback. NEW icon symbols: APPEARANCE, SETTING, USER. |
| @namorix/styles | 0.13.0 | NEW: `tag-input.scss`, Settings styles. New icomoon glyphs. Spacing token updates. |
| frontend | 0.17.0 | NEW: Settings addon — NmxRail + 3 tabs. NEW: `settings.controller`. NEW: `NetworkTrafficLogs`, `NetworkTrafficThreats`, `utils.ts`. |
| backend | 0.23.1 | FIX: `TrafficAddress.cs` cyclic reference. Migration regenerated. |

## 2026-05-21 (TrafficMonitorAttribute redesign: TrafficX attributes, middleware refactor, auto-disable register)

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.23.0 | NEW: TrafficGet/Post/Put/Delete/Patch attributes extending HttpMethodAttribute. MODIFIED: UseTrafficMonitorAsync scans TrafficX only. MODIFIED: AuthController — TrafficX methods, auto-disable register. DELETED: [TrafficMonitor] from 7 controllers. |
| frontend | 0.16.0 | NEW: `NetworkTrafficEndpoints.tsx`. MODIFIED: NetworkTraffic wires endpoints. NEW: traffic.controller `listEndpoints()`. NEW i18n keys. |
| @namorix/ui | 0.9.2 | MODIFIED: NmxBadge — `bgEnabled`. NmxDataTable — `disableEllipsisHeader/Cell`. |
| @namorix/styles | 0.12.3 | SCSS tweaks. |
| @namorix/core | 0.14.2 | NEW: HttpMethods + HttpMethod type. |

## 2026-05-21 (SignalR backend: Hubs, notifiers, topic broadcasting)

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.21.0 | NEW: NmxHub, SignalRTrafficNotifier, SignalRSystemNotifier, ITrafficNotifier, ISystemNotifier, typed SignalREvents, SignalR constants. MODIFIED: Program.cs AddSignalR/MapHub, AuthMiddleware ClaimTypes.NameIdentifier, CsrfMiddleware skip /hubs, SettingsService notifier. |
| frontend | 0.14.1 | FIX: unused import. |
| @namorix/styles | 0.12.1 | Cleanup. |

## 2026-05-21 (SignalR frontend integration: core signalr module, event-driven traffic, middleware fixes)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.14.0 | NEW: `signalr/` module — signalr.service, useSignalR, useSignalREvent, useSignalRGroup, constants, utils. NEW: `apiRoutes.ts` — HUB_MAIN. |
| frontend | 0.15.0 | NEW: Vite `/hubs` proxy with WebSocket. NEW: `@microsoft/signalr`. MODIFIED: Desktop — useSignalR on mount. auth.controller — stopConnection on logout. REPLACED: traffic polling with SignalR event-driven. |
| backend | 0.22.0 | NEW: SignalRPaths constants. MODIFIED: ITrafficNotifier, SignalRTrafficNotifier, TrafficMonitorMiddleware skip /hubs, CsrfMiddleware hub prefix. |

## 2026-05-21 (SignalR refinements: hub filter, rate limit partition, sparkline fix, auth cache)

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.22.1 | NEW: NmxHubFilter (IHubFilter). MODIFIED: Program.cs — AddFilter, rate limiter skip /hubs. |
| @namorix/core | 0.14.1 | MODIFIED: auth auth.service.ts — cache getAuthStatus(). |
| @namorix/ui | 0.9.1 | FIX: sparkline 1-data-point NaN. FIX: NmxStatCard semantic color via prop. |
| @namorix/styles | 0.12.2 | FIX: auth.scss. |
| frontend | 0.15.1 | FIX: auth.controller stopConnection, Login/Register, main. DELETED: traffic.controller (dead code). MODIFIED: NetworkTrafficOverview. |

## 2026-05-21 (cache module: useTabCache, Show component, NetworkTraffic refactor)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.13.0 | NEW: `cache/` module — useTabCache hook (lazy mount + CSS hide + idle unmount), Show component. |
| frontend | 0.14.0 | REFACTOR: NetworkTraffic — useTabCache + Show. i18n keys. |

## 2026-05-21 (defineAddon factory, addon context, Desktop defocus fix)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.12.0 | NEW: `factory.tsx` — defineAddon() (createRoot/mount/unmount). NEW: `context.tsx` — AddonContextProvider, useAddonContext(). DELETED: NmxAddonBase.ts. |
| frontend | 0.13.2 | FIX: Desktop defocus — exclude `.nmx-taskbar__app-btn`. REFACTOR: 4 addon files → defineAddon(). |

## 2026-05-20 (NmxStatCard, NmxGrid, canvas sparkline, traffic controller + polling)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.11.0 | NEW: ApiTrafficRoutes. NEW: http.query() method. |
| @namorix/styles | 0.12.0 | NEW: stat-card.scss, grid.scss, network-traffic.scss. NEW: spacings mixin. Theme CSS rebuilt. |
| @namorix/ui | 0.9.0 | NEW: NmxStatCard (value/label/unit/trend/sparkData + canvas sparkline). NEW: NmxGrid (cols/minColWidth/gap). NEW: canvas.ts — drawSparkline. NEW: cxSpacing + NmxSpacing. |
| frontend | 0.13.1 | NEW: traffic.controller (getStats). NEW: useTrafficStatsPolling (30s, 20pt rolling). NEW: NetworkTrafficOverview with NmxStatCard + NmxGrid. i18n labels. |

## 2026-05-20 (NmxRail + NetworkTraffic UI + NmxHostContext)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.11.0 | NEW: animation tokens, _rail.scss (--nmx-rail-width/--nmx-rail-collapse-width). NEW: icomoon glyphs (STATS, NODES, LIST, MENU, MENU_FOLD). Theme CSS rebuilt. |
| @namorix/ui | 0.8.0 | NEW: NmxRail suite (NmxRail, NmxRailList, NmxRailItem, NmxRailContent, NmxRailContext, types). NEW: hooks/NmxHostContext (useIsWindowed). NEW: NmxIconFont symbols. DELETED: NmxDataTable old sub-components. |
| frontend | 0.13.0 | NEW: NetworkTraffic full UI — NmxRail + 4 tabs. NEW: NmxHostContext Provider. i18n keys. |

## 2026-05-20 (Reusable UI components + Settings addon + WindowFrame mount fix)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.10.0 | NEW: 6 component SCSS (badge, chip, pulse-dot, pagination, data-table, addon). NEW: `--nmx-radius-half`. Theme CSS rebuilt. |
| @namorix/ui | 0.7.0 | NEW: NmxBadge, NmxChip, NmxPulseDot, NmxPagination, NmxDataTable. NEW: ARROW_PREV, ARROW_NEXT icons. |
| frontend | 0.12.1 | FIX: WindowFrame addon mount — `win.app` thay `winId`. NEW: Settings addon (+212 lines). |

## 2026-05-20 (NetworkTraffic backend Phase 1.5 — fixes)

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.20.1 | FIX: middleware ConcurrentDictionary<(string,string),int> (EndpointId). NEW: CountingStream (Response.Body BytesWritten). NEW: IP→TrafficAddressId cache. FIX: CleanupWorker IServiceScopeFactory, Stopwatch, method-level scan, Label init→set. TrafficMonitor gắn vào 8 controller. |

## 2026-05-19 (NetworkTraffic backend Phase 1)

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.20.0 | NEW: TrafficEndpoint, TrafficAddress, TrafficLog models. NEW: TrafficBuffer (Channel 50K DropOldest). NEW: TrafficMonitorService (CRUD, logs, stats). NEW: TrafficMonitorMiddleware. NEW: TrafficMonitorController (6 endpoints). NEW: TrafficFlushWorker, TrafficCleanupWorker. AppDbContext updates. Migration. |

## 2026-05-19 (State management rewrite: Zustand → Redux Toolkit, new addons)

| Package | Version | Changes |
|---------|---------|---------|
| frontend | 0.12.0 | REWRITE: Zustand → Redux Toolkit. 4 stores → 3 slices. Normalized state (byId+order). Window/geometry/animation merged. Memoized selectors (createSelector). useAppSelector default shallowEqual. Xóa 5 store files. NEW: config/windowDefaults.ts (CSS token cache). NEW: NetworkTraffic, SystemMonitor addons. REFACTOR: WindowFrame → 6 hooks. |
| @namorix/styles | 0.9.0 | NEW: network-traffic/svg. NEW: window CSS tokens. Launcher/taskbar/desktop tweaks. Theme fix. |
| @namorix/ui | 0.6.4 | NEW: icon symbols for NetworkTraffic, SystemMonitor. |

## 2026-05-18 (Shared types refactoring: AddonItem, OnOpenApp, addonToItems, rectToOrigin)

| Package | Version | Changes |
|---------|---------|---------|
| frontend | 0.11.1 | NEW: AddonItem, OnOpenApp types, rectToOrigin utility, addonToItems mapper. REFACTOR: DesktopArea + Launcher dùng AddonItem. DELETED: DesktopArea.types.tsx, Launcher.types.ts. RENAMED: useTaskbarRectStore. |

## 2026-05-18 (WindowFrame animation system, size management, Settings addon scaffold)

| Package | Version | Changes |
|---------|---------|---------|
| frontend | 0.11.0 | NEW: WindowFrame animation system (open/close/minimize/maximize/unmaximize). NEW: CSS token-based size management. NEW: cascade/random positioning. NEW: useTaskbarRectStore (Zustand). NEW: Settings addon scaffold. |
| @namorix/core | 0.10.5 | NEW: NmxAddonManifest — defaultWidth, defaultHeight, preferFullSize. |
| @namorix/styles | 0.8.0 | NEW: maximize/unmaximize @keyframes. NEW: 5 window sizing tokens. NEW: app-settings.svg. Launcher animation rewrite. |
| @namorix/ui | 0.6.3 | NEW: NmxIconSvgSymbol.APP_SETTINGS. |

## 2026-05-17 (WindowFrame bug fixes, store refactor, geometry store, useOpenWindow)

| Package | Version | Changes |
|---------|---------|---------|
| frontend | 0.10.8 | FIX: WindowFrame resize/drag bugs. REFACTOR: window.store simplified. NEW: useOpenWindow hook, windowGeometry.store. |

## 2026-05-17 (Taskbar/WindowFrame refactor, WindowManager flatten, blocked SCSS migration)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.7.1 | NEW: icomoon glyphs. MOVED: Blocked.scss to shell/components. Window SCSS updates. |
| @namorix/ui | 0.6.2 | NEW: 3 icon symbols. |
| frontend | 0.10.7 | REFACTOR: Taskbar (3 sub-components). REFACTOR: WindowFrame resize/drag overhaul. NEW: WindowTitleBar, WindowResizeHandles. WindowManager flattened. |

## 2026-05-17 (Shell SCSS migration, component refactor: WindowFrame/Launcher/AuthView split)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.7.0 | NEW: shell/components (taskbar, window, elevation, app-logs icon). MOVED: auth.scss/desktop.scss from frontend. Icomoon rebuilt. |
| @namorix/core | 0.10.4 | NEW: NmxAddonIconType. Fix: ThemeProvider import. |
| @namorix/ui | 0.6.1 | FIX: NmxIconSvg cleanup. |
| frontend | 0.10.6 | REFACTOR: WindowFrame split (6 files), Launcher split (4 files), barrel exports. AuthPage → AuthView. SCSS files moved to styles package. |

## 2026-05-16 (Shell refactor: DesktopArea/Taskbar modular, NmxMetaList, abstract/ restructure)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.6.0 | NEW: abstract/ (maps, palette), shell/ + entry, tokens/, icons/, meta-list.scss, icon-svg.scss. Updated: all component SCSS, icomoon, theme tokens. |
| @namorix/ui | 0.6.0 | NEW: NmxMetaList/NmxMetaItem, NmxIconSvg (SVG icons). Updated: NmxIconFont types, NmxCardHeader, types, cx. |
| frontend | 0.10.5 | REFACTOR: DesktopArea (DesktopIcon + types), Taskbar (AppButton + types + useTaskbarClock). Updated: Blocked uses NmxMetaList. WindowFrame SCSS cleanup. |

## 2026-05-16 (NmxIconFont, NmxIconBox, icon SCSS, shared types/utils)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.5.0 | NEW: icomoon/ (variables, fonts), components/icon/ (icon-font, icon-box). Fix: base/index.scss ordering. |
| @namorix/ui | 0.5.0 | NEW: NmxIconFont, NmxIconBox primitives. NEW: types/ (base, primitives). NEW: utils/ (cx, cx-size, cx-semantic, cx-variant). REFACTOR: NmxButton, NmxInlineAlert, NmxToggle, NmxCard use shared types. |
| @namorix/core | 0.10.3 | REMOVED: cx export (moved to @namorix/ui). |
| frontend | 0.10.4 | REFACTOR: prop renaming (semantic color, shouldRender). Theme CSS rebuilt. |

## 2026-05-16 (Styles: base/components/, layouts/, dark tokens; UI: NmxCard, flatten primitives)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.4.0 | NEW: base/components/ (card, form, inline-alert, toggle, button), layouts/ (split), themes/dark/tokens.scss. Fix: button BEM naming. |
| @namorix/ui | 0.4.0 | NEW: NmxCard suite. Primitives flattened. SCSS removed from ui (moved to styles). |
| frontend | 0.10.3 | REFACTOR: Login, Register use NmxCard. AuthPage cleanup. |

## 2026-05-16 (Styles restructure: base/ + themes/, validation, dedupe, env fix)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.3.0 | NEW: base/ subdir, themes/ structure, vite.config.ts for theme CSS build. |
| @namorix/core | 0.10.2 | NEW: env/production.ts, utils/dedupe.ts, utils/sanitizePath.ts. Fix: theme types, loader, registry, ThemeProvider, guards. |
| frontend | 0.10.2 | NEW: vite.config.ts theme build entries. Fix: main.tsx restoreTheme, SCSS @forward → @use. |
| backend | 0.19.1 | NEW: SetThemeSchema. Fix: UserController Validate, ThemeManifest cssPath, AuthController TryRefresh. Migrations recreated. |

## 2026-05-16 (Auth fix: UserService DI, AuthController refactor, refresh + guard fixes)

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.19.0 | NEW: ThemeController, ThemeService. FIX: UserService DI (500 error). REFACTOR: AuthController session TryRefresh, cookie helpers. Config: AccessTokenExpirationSeconds. |
| @namorix/core | 0.10.1 | FIX: client.ts — skip refresh for session URL, return refreshResponse on fail. |
| frontend | 0.10.1 | FIX: guards — dedupeGuard for React StrictMode. Root.tsx extracted from main. |

## 2026-05-15 (Addon system: contract, registry, LogViewer addon)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.9.0 | NEW: addon module — addon/types.ts (NmxAddonManifest, AddonContext, AddonEntry, AddonModule). |
| frontend | 0.9.0 | NEW: addon system — registry.ts (registerAddon, resolveAddon, listAddons). WindowFrame addon mounting. Launcher + DesktopArea use listAddons(). NEW: LogViewer addon. |

## 2026-05-15 (Theme system: types, loader, registry, ThemeProvider, backend API)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.10.0 | NEW: theme module (types, loader, registry), ThemeProvider (ThemeContext, useTheme, switchTheme). NEW: http.getJson. NEW: constants, API routes. |
| frontend | 0.10.0 | NEW: Theme integration — Root with ThemeProvider, restoreTheme(), getAllThemes(). Login theme sync. |
| backend | 0.18.0 | NEW: ThemeManifest model, User.ThemeId, ThemeManifests + AddonManifests DbSet. NEW: UserService (GetThemeAsync/SetThemeAsync), UserController (GET/PUT theme). |

## 2026-05-15 (Desktop shell UI: taskbar, launcher, window manager + stores + types)

| Package | Version | Changes |
|---------|---------|---------|
| frontend | 0.8.0 | NEW: Desktop shell UI — Taskbar (clock, launcher toggle, window buttons), DesktopArea (icons), WindowFrame (drag/resize/minimize/maximize/close), WindowManager, Launcher (start menu). NEW: Zustand stores (window, launcher). NEW: types (WindowId, WindowState). Desktop.tsx full shell layout. Deps: zustand. |

## 2026-05-15 (Bug fixes: refresh token, IPv6, CSRF; multi-project migration)

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.17.1 | FIX: Refresh token — hash Base64 lookup, IPv6 loopback + pure IPv6, CsrfMiddleware local var, CORS fallback, PermissionService dead code. REFACTOR: multi-project migration (Core, Adapters, Server, Workers). |
| @namorix/core | 0.8.1 | NEW: DefaultPaths const object. |
| frontend | 0.7.1 | App.tsx: Blocked page health check, guard wiring. |

## 2026-05-15 (Permission/RBAC system, auth middleware, attribute filters, CORS dynamic config)

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.17.0 | NEW: Permission/RBAC (PermissionController, UserPermissionController, PermissionService cached, Permission/UserPermission models). NEW: middleware (AuthMiddleware, NotFoundMiddleware, RequireAuthAttribute, RequireAdminAttribute, RequirePermissionAttribute). NEW: constants (HttpHeaders, Time, User). SettingsController dynamic CORS. AuthService Session user check. |

## 2026-05-14 (Trusted proxy detection, health endpoint, Blocked page, error code refactoring)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.8.0 | NEW: MiddlewareErrorCodes, ApiResponse statusCode, apiRoutes, client.ts statusCode injection, formatMiddlewareError, i18n untrustedProxy. |
| frontend | 0.7.0 | NEW: Blocked page (switch-case), Blocked.scss (color-mix), health.controller, controllers restructuring, App.tsx health check. |
| backend | 0.16.0 | NEW: HealthController, NetworkHelper (CORS). REFACTOR: Error.cs (MiddlewareErrorCodes). TrustedProxyMiddleware JSON ApiResponse. Middleware pipeline reorder. |

## 2026-05-14 (Workspace restructure: packages → frontend/ + shared → core)

| Package | Version | Changes |
|---------|---------|---------|
| frontend | 0.6.0 | Workspace restructure: packages moved to frontend/. eslint.config.js→.ts. Deps: jiti. |
| @namorix/core | 0.7.0 | Merged @namorix/shared into core (types, api-routes, constants). |
| root | — | Xóa root package.json, tsconfig.base.json, pnpm-workspace.yaml. |

## 2026-05-14 (Cleanup: xoá backend-n + packages/backend-core)

| Package | Version | Changes |
|---------|---------|---------|
| root | 0.3.1 | Xoá backend-n/, packages/backend-core/. Update docs: CLAUDE.md, README.md, architecture, memory, m2-auth, m4-addon-system. |

## 2026-05-14 (TrustedProxyMiddleware, SettingsController)

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.15.0 | NEW: TrustedProxyMiddleware (trusted IP list), SettingsController (GET/PUT proxies), SettingsService Get/SetTrustedProxies. |
| frontend | 0.5.4 | Conditional API URL. Conditional X-Forwarded-For forward. |
| root | 0.3.0 | Backend 0.15.0 new feature. |

## 2026-05-13 (SecurityHeaders, Settings cache, SecureCookie fix)

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.14.1 | NEW: SecurityHeadersMiddleware, SettingsService IMemoryCache (5min). FIX: SecureCookie, UseXForwardedHeaders, Kestrel 10KB body limit. TTL: 15→5 min. |
| frontend | 0.5.3 | Enable Vite proxy /api. URL default fix. |
| root | 0.2.1 | Patches. |

## 2026-05-13 (CSRF, rate limiting, token cleanup)

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.14.0 | NEW: CsrfMiddleware, rate limiting (100 req/min), TokenCleanupService (BackgroundService). AppConfig CsrfEnabled/SecureCookie. |

## 2026-05-13 (Validation system expansion)

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.13.0 | NEW: FormatValidationRule, EnumValidateRule. ApiResponse refactor (Error/Field/Meta). JsonErrorMiddleware Validated flag. |

## 2026-05-13 (Naming migration + docs cleanup)

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.12.0 | NEW: [Validate] attribute, IValidationSchema, ValidateAttribute, ValidationRule. LoginSchema, RegisterSchema. |
| root | 0.1.8 | Docs cleanup. |
| frontend | 0.5.2 | i18n: "Sign in" → "Log in", "Sign up" → "Register". |
| @namorix/core | 0.6.3 | Field rename: needsSignup→needsRegister, signUpEnabled→registerEnabled. |
| @namorix/shared | 0.7.0 | Breaking: AuthStatus rename fields. |
| backend | 0.11.0 | CORS middleware. SettingsService renames. JsonErrorMiddleware fix. |

## 2026-05-12 (Bug fix session)

| Package | Version | Changes |
|---------|---------|---------|
| root | 0.1.7 | FIX: auth guard loop — checkHasUsers/isAuthenticated catch 401. |
| backend | 0.10.0 | NEW: ExceptionMiddleware, JsonErrorMiddleware, ApplicationBuilderExtensions. |
| @namorix/core | 0.6.2 | FIX: checkHasUsers(), isAuthenticated() catch 401. |

## 2026-05-12 (Phase 4 complete)

| Package | Version | Changes |
|---------|---------|---------|
| root | 0.1.6 | C# migration Phase 4 complete. |
| backend | 0.9.0 | AuthController (7 endpoints), typed ApiResponse, SettingsService. |
| @namorix/shared | 0.6.1 | Route rename: signin→login, signup→register, signout→logout. |
| @namorix/core | 0.6.1 | Guard route references updated. |
| frontend | 0.5.1 | Login/Register pages renamed. |

## 2026-05-12 (latest)

| Package | Version | Changes |
|---------|---------|---------|
| root | 0.1.5 | Backend C# migration Phase 4. |
| backend | 0.8.0 | AuthController, ApiResponse, SettingsService. |

## 2026-05-12 (Phase 1-3)

| Package | Version | Changes |
|---------|---------|---------|
| root | 0.1.4 | Backend C# migration Phase 1-3. |
| backend | 0.7.0 | AuthService, Config pattern (IOptions), Settings model. |

## 2026-05-10

| Package | Version | Changes |
|---------|---------|---------|
| root | 0.1.3 | Bump, Phase B (fingerprint). |
| @namorix/core | 0.6.0 | NEW: fingerprint module (FingerprintComponents, generateFingerprint, SHA-256). |
| backend | 0.6.2 | Phase B: fingerprint Option C balanced. |
| @namorix/backend-core | 0.5.1 | signAccessToken optional TTL. |
| frontend | 0.5.1 | rememberMe toggle wired, useAuthForm hook. |

## 2026-05-10 (earlier)

| Package | Version | Changes |
|---------|---------|---------|
| root | 0.1.2 | Lint workspace script. |
| @namorix/shared | 0.6.0 | Headers (UserAgent, Fingerprint), interface types, eslint. |
| @namorix/backend-core | 0.5.0 | Cookie wrappers, CSRF middleware, verifyToken returns JwtPayload|null, eslint. |
| backend | 0.6.0 | refresh_tokens whitelist, signout-all, remember-me, CSRF default ON. |

## 2026-05-09

| Package | Version | Changes |
|---------|---------|---------|
| root | 0.1.1 | Auto token refresh fix. |
| @namorix/core | 0.5.1 | 401 auto-refresh + retry in RequestBuilder.json(). |
| @namorix/backend-core | 0.4.0 | CSRF middleware (setCsrfCookie, validateCsrf), tsconfig.json. |
| @namorix/core | 0.5.0 | isAuthenticated async /session, CSRF auto-header. |
| @namorix/shared | 0.5.0 | CSRF cookie key, SystemErrorCode, HttpHeader. |
| frontend | 0.5.0 | Async isAuthenticated, CSRF token. |
| backend | 0.5.0 | CSRF_MODE env. |
| @namorix/styles | 0.2.0 | variables.scss, package.json exports. |

## 2026-05-09 (earlier)

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/backend-core | 0.3.0 | Decorator system (@Controller, @Get, @Post, @Validate). |
| @namorix/core | 0.4.0 | NmxI18n, ValidationRunner, formatApiError. |
| @namorix/shared | 0.4.0 | ValidationErrorCode, AuthErrorCode enums. |
| frontend | 0.4.0 | Login connected, validation, i18n. |
| backend | 0.4.0 | Decorator routes, @Validate. |

## 2026-05-08

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.3.0 | createMiddleware, validate middleware. |
| @namorix/shared | 0.3.0 | ValidateErrorMeta, ValidateErrorCode. |
| @namorix/core | 0.3.0 | ApiError, http module. |
| frontend | 0.3.0 | auth.controller, Register connected. |
| @namorix/ui | 0.3.0 | @types/react, scss.d.ts. |
| @namorix/backend-core | 0.2.0 | createMiddleware, validate, cookie/response utils. |

## 2026-05-07

| Package | Version | Changes |
|---------|---------|---------|
| backend | 0.1.0 | Auth endpoints, config, secret management. |
| @namorix/backend-core | 0.1.0 | NmxDataBase, logger, jwt utilities. |
| @namorix/shared | 0.1.0 | Types (UserPublic, ApiResponse), constants, errors. |
| @namorix/styles | 0.1.0 | CSS tokens, reset, fonts. |
| @namorix/ui | 0.2.0 | NmxButton, NmxForm, NmxInlineAlert, NmxSwitch. |

## 2026-05-06

| Package | Version | Changes |
|---------|---------|---------|
| frontend | 0.0.1 | Initial Vite project, React Router setup. |
| @namorix/core | 0.0.1 | cx utility. |
