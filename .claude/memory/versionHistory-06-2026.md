# Version History — June 2026

## 2026-06-14 (2) — Appearance 3-layer cascade fix

| Package | Version | Changes |
|---------|---------|---------|
| frontend | 0.44.2 → 0.44.3 | MODIFIED: `auth.controller.ts` — `loadAppearance()` gọi song song `GET /api/settings/appearance` (system defaults) + `GET /api/user/settings` (user overrides), merge 3-layer. Xoá `loadAppearanceSystem()`. `useAppearanceSync.ts` — dùng `authController.loadAppearance()` cho mọi case. |

## 2026-06-14 — NmxStatCard threshold refactor, disk-usage CSS Grid

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/ui | 0.22.2 → 0.22.3 | MODIFIED: `NmxStatCard.tsx` — thêm thresholdCurrent/thresholdTotal props. resolvedColor tính % từ `current/total*100` thay parseFloat(value). |
| @namorix/styles | 0.31.1 → 0.31.2 | MODIFIED: `disk-usage.scss` — flex + container queries → CSS Grid (display: contents, grid-template-columns: max-content 1fr auto auto). Xoá @container queries. Themes rebuilt. |
| frontend | 0.44.1 → 0.44.2 | MODIFIED: `SystemMonitor.tsx` — CPU, CPU process, Memory, Process Memory dùng thresholdCurrent/thresholdTotal. `en.json` — processMemoryDescription bỏ `of {{total}}`. |

## 2026-06-13 — SystemMonitor refinements: system CPU, sparklines, threshold auto-color

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.35.0 → 0.35.1 | NEW: `utils/format.ts` — formatUptime (y/d/h/m auto-scale). |
| @namorix/ui | 0.22.0 → 0.22.1 | MODIFIED: `NmxStatCard.tsx` — thresholdEnabled + thresholds prop tự động đổi màu card theo %. Sparkline dùng resolvedColor. |
| frontend | 0.44.0 → 0.44.1 | MODIFIED: `SystemMonitor.tsx` — systemCPU card, sparklines cho CPU/memory/process memory, formatUptime. `en.json` — systemCPU, processMemory keys. |
| Namorix.Server | 0.37.0 → 0.37.1 | MODIFIED: `Workers/SystemStatsWorker.cs` — system CPU từ /proc/stat, memory từ /proc/meminfo (system RAM), history arrays (cpuHistory, memHistory, procMemHistory) cho sparkline. |

## 2026-06-13 — SystemMonitor full implementation, ServerSignalR, MainHub

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.34.1 → 0.35.0 | NEW: `utils/format.ts` — formatBytes, formatBytesSec. MODIFIED: `signalr/useSignalREvent.ts` — chờ connection. `signalr/useSignalRGroup.ts` — generic string, kebab→Pascal fix. `signalr/utils.ts` — groupMethod fix. |
| @namorix/ui | 0.21.6 → 0.22.0 | NEW: `Components/DiskUsage/` — DiskUsageList + DiskUsageItem với progress bar + badge %. `Components/NmxSection.tsx` — section label wrapper. MODIFIED: `NmxAddonRoot.tsx` — scrolled prop. `NmxMetaList.tsx` — contained prop. `NmxStatCard.tsx` — icon prop. `NmxIconFont.types.ts` — new icons (CPU, RAM, TIME, ARROW_BAR). |
| @namorix/styles | 0.30.2 → 0.31.0 | NEW: `disk-usage.scss`, `section.scss`, `shell/addon/system-monitor.scss`. MODIFIED: `addon.scss` — scrolled variant. `meta-list.scss` — contained variant. `stat-card.scss` — icon support. Icomoon rebuild. Themes rebuilt. |
| frontend | 0.43.1 → 0.44.0 | NEW: `addons/SystemMonitor/SystemMonitor.tsx` — full implement (4 sections: Process, Disk Space, IO, Environment). `signalr/` — constants + hooks. MODIFIED: `en.json` — systemMonitor i18n keys. |
| Namorix.Server | 0.36.3 → 0.37.0 | NEW: `Workers/SystemStatsWorker.cs` — push stats mỗi 1s (CPU, RAM, disk, IO, network, environment). `Hubs/MainHub.cs` — extends NmxHub, Subscribe/UnsubscribeSystemMonitor. `Constants/ServerSignalRGroups.cs`, `Infrastructure/ISystemMonitorNotifier.cs`, `Hubs/SignalRSystemMonitorNotifier.cs`. RENAMED: TokenCleanupWorker, NotificationCleanupWorker từ Workers → Server/Workers. MODIFIED: `ApplicationBuilderExtensions.cs` — generic `UseNamorixCore<THub>`. `Program.cs` — register workers + hub. |

## 2026-06-12 — LogCleanupWorker, wallpaper CSS var, cleanup freezePanelSize

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.30.1 → 0.30.2 | NEW: `base/tokens/misc.scss` — `--nmx-wallpaper` CSS variable. MODIFIED: `shell/components/desktop.scss` — dùng wallpaper var. `themes/dark/tokens.scss`, `themes/default/tokens.scss` — xoá wallpaper, reformat shadows. REMOVED: `themes/dark/icons/` — 2 files. |
| frontend | 0.43.0 → 0.43.1 | NEW: `public/icons/background.svg` — wallpaper background. MODIFIED: `public/icons/logo.svg` — logo mới. favicon files — update. REMOVED: `NotificationPanel.tsx` — xoá freezePanelSize (chuyển TODO). `addons/index.ts` — import reorder. |
| Namorix.Core | 0.36.2 → 0.36.3 | NEW: `Workers/LogCleanupWorker.cs` — cleanup log files sau 7 ngày. MODIFIED: `Extensions/ServiceCollectionExtensions.cs` — DI register LogCleanupWorker. |

## 2026-06-11 — Notification dedup, shared NotificationItem, xoá NotificationCenter addon

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.33.0 → 0.34.0 | MODIFIED: `notification/types.ts` — thêm occurrences, lastOccurredAt. `signalr/useSignalREvent.ts` — fix `conn.off(eventName)` → `conn.off(eventName, handler)`. |
| @namorix/ui | 0.21.4 → 0.21.5 | MODIFIED: `NmxIconFont.types.ts`, `NmxIconSvg.types.ts` — thêm icon symbols. |
| @namorix/styles | 0.29.0 → 0.30.0 | NEW: `notification.scss`. MODIFIED: icomoon fonts, theme CSS rebuilt. |
| frontend | 0.41.0 → 0.42.0 | NEW: `components/NotificationItem.tsx` — shared component (icon app + severity badge). DELETED: `addons/NotificationCenter/` — xoá addon window. MODIFIED: NotificationPanel — dùng NotificationItem chung, xoá "View all". `notificationsSlice` — dedup trong addNotification. `useNotificationEvents` — fetchUnreadCount on mount. i18n — dọn keys. |
| Namorix.Core | 0.36.1 → 0.36.2 | MODIFIED: `Models/Notification.cs` — thêm Occurrences, LastOccurredAt, Icon. `Responses/NotificationResponse.cs` — thêm fields tương ứng. `Constants/Notification.cs` — thêm NotificationSource, NotificationKeys.Auth.UserRegistered. |
| Namorix.Server | 0.36.1 → 0.36.2 | MODIFIED: `Services/NotificationService.cs` — CreateForAdminsAsync, dedup trong CreateAsync, ordering IsRead ASC. `Services/AuthService.cs` — thêm register notif, dùng NotificationType.Security. New migration. |

## 2026-06-11 — Notification model simplified, login failed notification, formatRelativeTime

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.32.0 → 0.33.0 | NEW: `utils/format.ts` — formatRelativeTime(). `addon/types.ts` — NmxAddonId. `i18n/locales/en.json` — common.time keys (justNow, minAgo, hoursAgo, daysAgo). MODIFIED: `hooks/useDateTimeFormat.ts` — thêm relativeTime(). `addon/factory.tsx` — Redux Provider wrapping. `notification/types.ts` — Key thay titleKey/descriptionKey. |
| frontend | 0.40.0 → 0.41.0 | NEW: `utils/notification.ts` — toHtml MD parser, resolveNotifTitleHtml/DescriptionHtml. `i18n/locales/notification/en.json` — auth.loginFailed keys. MODIFIED: NotificationPanel, NotificationCenter — relative time, MD support. useNotificationEvents — void dispatch fix. useAddonMount — pass Redux store. |
| Namorix.Core | 0.36.0 → 0.36.1 | MODIFIED: `Models/Notification.cs` — Key thay TitleKey/DescriptionKey. `Responses/NotificationResponse.cs` — Key thay TitleKey/DescriptionKey. NEW: `Constants/Notification.cs` — NotificationType (Info/Success/Warning/Error), NotificationKeys (Auth.LoginFailed). |
| Namorix.Server | 0.36.0 → 0.36.1 | MODIFIED: `Services/AuthService.cs` — login failed notification (user + admins). `Services/NotificationService.cs` — CreateAsync simplified (key instead of titleKey/descriptionKey). NEW migration. |

## 2026-06-10 — AddonItem extends NmxAddonManifest, WindowData refactor, instanceMode

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.31.0 → 0.32.0 | NEW: `addon/types.ts` — NmxAddonInstanceMode (single/multi), NmxAddonLocaleKeys rename. MODIFIED: `NmxAddonManifest` — thêm instanceMode field. |
| frontend | 0.39.0 → 0.40.0 | REFACTOR: `AddonItem extends NmxAddonManifest` — loại bỏ field duplication. `WindowData` — thay `app/title/localeKey/icon` bằng `item: AddonItem`. `OnOpenApp` — simplified to `(item, rect?)`. `useOpenWindow` — nhận `AddonItem` + `originRect?`. NEW: instanceMode support — `single` (default, focus existing) / `multi` (always open new). MODIFIED: 25 files total (addons, taskbar, launcher, desktop, window frame, store). |

## 2026-06-10 — Notification Center addon, taskbar badge + panel

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.30.2 → 0.31.0 | NEW: `notification/types.ts` — NmxNotificationDto. MODIFIED: `signalr/constants.ts` — new NotificationReceived/NotificationReadStatus events. `apiRoutes.ts` — new ApiNotificationRoutes. |
| @namorix/ui | 0.21.3 → 0.21.4 | NEW: `NmxIconFont.types.ts` — new icon symbols. |
| @namorix/styles | 0.28.2 → 0.29.0 | NEW: `taskbar.scss` — notification panel + item SCSS. MODIFIED: icomoon — updated font with new icons. |
| frontend | 0.38.2 → 0.39.0 | NEW: `slices/notificationsSlice.ts` — Redux state for notifications. `selectors/notificationSelectors.ts` — capped unread count. `hooks/useNotificationEvents.ts` — SignalR event listener. `controllers/notification.controller.ts` — REST API calls. `components/Taskbar/NotificationPanel.tsx` — dropdown panel. `addons/NotificationCenter/NotificationCenter.tsx` — full addon window. `utils/notification.ts` — i18n resolve helper. `i18n/locales/notification/` — notification content keys. MODIFIED: Taskbar.tsx, TaskbarView.tsx — badge + panel + launcher coordination. Desktop.tsx — mount useNotificationEvents. |
| Namorix.Core | 0.35.2 → 0.36.0 | NEW: `Models/Notification.cs` — notification entity. `Infrastructure/INotificationNotifier.cs` — notifier interface. `Hubs/SignalRNotificationNotifier.cs` — SignalR implementation. `Responses/NotificationResponse.cs` — DTO. MODIFIED: `Constants/SignalR.cs` — new events. |
| Namorix.Server | 0.35.2 → 0.36.0 | NEW: `Controllers/NotificationController.cs` — REST API (list, unread, mark read, delete). `Adapters/Services/NotificationService.cs` — business logic. MODIFIED: `Program.cs` — DI registration. `Adapters/Persistence/AppDbContext.cs` — DbSet + indexes. |

## 2026-06-X — SVG icons moved to public, relative → absolute paths

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.28.0 → 0.28.1 | MODIFIED: `base/tokens/icons.scss` — SVG paths từ `../icons/` → `/icons/`. MODIFIED: `public/themes/*/theme.css` — rebuilt với absolute URLs. REMOVED: `base/icons/` — 10 SVG files moved to `frontend/public/icons/`. |

## 2026-06-10 — Detail dialogs, meta-list grid, logout confirm, register fix

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.30.1 → 0.30.2 | FIX: `auth/auth.service.ts` — `isRegistrationOpen()` trả về true nếu `needsRegister` (không có user nào), bypass register_enabled. |
| @namorix/ui | 0.21.2 → 0.21.3 | NEW: `NmxAlertDialog` — thêm `hideCancel`, `size` prop, children thay `description`. `NmxBadge` — thêm `size` prop (sm/md). `NmxMetaItem` — thêm children support, align props. |
| @namorix/styles | 0.28.1 → 0.28.2 | REFACTOR: `meta-list.scss` — flex → grid (`auto 1fr`). NEW: `badge.scss` — size variant (`--sm`). Theme CSS rebuilt. |
| frontend | 0.38.1 → 0.38.2 | NEW: `LogViewer.tsx` — detail dialog (NmxAlertDialog + NmxMetaList). `NetworkTrafficLogs.tsx` — detail dialog. `Launcher.tsx` — logout confirm dialog. FIX: `Register.tsx` — register flow. `Blocked.tsx`, `Login.tsx` — minor fixes. |
| Namorix.Core | 0.35.0 → 0.35.1 | MODIFIED: `AppearanceOptionsData.cs` — minor update. |
| Namorix.Server | 0.35.1 → 0.35.2 | FIX: `AuthController.cs` — register check: if `needsRegister` then allow register even if register_enabled=false. MODIFIED: `ThemeService.cs`, `ThemeController.cs`. |

## 2026-06-10 (evening) — Theme registry cleanup, error catch audit, theme list from API

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.30.0 → 0.30.1 | REMOVED: `theme/registry.ts` — dead code (getAllThemes không dùng). `apiRoutes.ts` — xóa `ThemeRoutes.builtin`. README.md — utils description. |
| frontend | 0.38.0 → 0.38.1 | NEW: `SettingsAppearance.tsx` — fetch themes từ `GET /api/themes` thay hardcode. `settings.controller.ts` — thêm `getThemes()`. FIX: `App.tsx` — `.catch(console.log)` → `nmxToast.error`. `useAppearanceSync.ts` — `.catch(() => {})` → `nmxToast.error`. REMOVED: `useTrafficGroup.ts` — dead code. |
| Namorix.Server | 0.35.0 → 0.35.1 | NEW: `ThemeService.cs` (Adapters) — thêm "dark" theme. `ThemeController.cs` — trả về cả light + dark. |

## 2026-06-10 (later 2) — Core format utilities, useDateTimeFormat hook, i18n language sync

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.29.0 → 0.30.0 | NEW: `utils/format.ts` — `formatDateTime()`, `formatTimestamp()`, `formatDuration()`, `formatSize()`. NEW: `hooks/useDateTimeFormat.ts` — hook tự động đọc time/date format từ appearance store, trả về `clock()` + `timestamp()` functions. NEW: `store/accessors.ts` — `getAppearanceStore()` getter. |
| frontend | 0.37.0 → 0.38.0 | REFACTOR: `useTaskbarClock.ts` — dùng `useDateTimeFormat()` hook từ core. `LogViewer.tsx` + `NetworkTrafficLogs.tsx` — dùng `formatTimestamp()` từ core. `NetworkTraffic/utils.ts` — xóa `formatTimestamp`, `formatDuration`, `formatSize` (đã chuyển vào core). `auth.controller.ts` — thêm `i18n.changeLanguage()` dựa trên `appearance_language`. |

## 2026-06-10 (later) — Time format, user settings SignalR notifier, accent CSS tokens, clock format

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.28.0 → 0.29.0 | NEW: `theme/loader.ts` — `applyAppearanceTokens()` (maps appearance settings to CSS custom properties). NEW: `signalr/constants.ts` — `UserSettingsChanged` event. MODIFIED: `types/appearance.ts` — +`appearance_time_format`. `store/nmxStore.ts` — +`NmxStoreKeys.appearance`. `constants.ts` — +appearance constant. |
| @namorix/styles | 0.27.1 → 0.28.0 | NEW: `base/tokens/accent.scss` — accent color CSS token. MODIFIED: `spacing.scss` — density-related spacing tokens. `typography.scss` — font-size unit scaling. Theme CSS rebuilt (default + dark). |
| frontend | 0.36.0 → 0.37.0 | NEW: `hooks/useAppearanceSync.ts` — hook xử lý appearance load + SignalR listener. MODIFIED: `useTaskbarClock.ts` — date format + time format (12h/24h). `SettingsAppearance.tsx` — time format picker, default accent option. `auth.controller.ts` — gộp `loadAppearance`, refactor. `Root.tsx` — simplified, delegated to `useAppearanceSync`. `settings.controller.ts` — +timeFormats. |
| Namorix.Core | 0.34.0 → 0.35.0 | NEW: `Infrastructure/IUserSettingsNotifier.cs` — interface for user settings notifications. `Hubs/SignalRUserSettingsNotifier.cs` — sends `user:settings-changed` via SignalR. MODIFIED: `Models/ThemeManifest.cs` — +`DefaultAccentColor`. `Constants/Settings.cs` — +`TimeFormat`. `Data/AppearanceOptionsData.cs` — +`TimeFormats`, +default accent. `Validation/Schemas/SetSettingsSchema.cs` — +`AppearanceTimeFormat` rule. `Services/UserSettingsService.cs` — inject notifier, call on SetBatch/Set. |
| Namorix.Server | 0.34.0 → 0.35.0 | MODIFIED: `Services/ThemeService.cs` — +`DefaultAccentColor` on Light theme. `Controllers/ThemeController.cs` — include defaultAccentColor. `Extensions/ServiceCollectionExtensions.cs` — register `IUserSettingsNotifier`. |

## 2026-06-10 — Settings validation, Esc dialog dismiss, auth theme refactor, appearance caching

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.27.0 → 0.28.0 | NEW: `theme/loader.ts` — `applyTheme()` utility. `apiRoutes.ts` — `appearance` route for system defaults. |
| @namorix/ui | 0.21.1 → 0.21.2 | NEW: `NmxDialog` — Esc keydown handler dismisses dialog when `dismissable=true`. |
| frontend | 0.35.0 → 0.36.0 | REFACTOR: `Root.tsx` — `useEffect [user]` handles both `loadSystemDefaults()` (unauthenticated) and `loadAppearance()` (authenticated). `auth.controller.ts` — removed `loadAppearance()` from login, added `loadSystemDefaults()`. `main.tsx` — removed `restoreTheme()`, calls `loadSystemDefaults()`. `Desktop.tsx` — removed redundant `loadAppearance()`. |
| Namorix.Core | 0.33.0 → 0.34.0 | NEW: `ValidationRule.cs` — `AllowedValuesValidationRule` (validates string against allowed list). `Validation/Schemas/SetSettingsSchema.cs` — settings request DTO + schema with AppearanceOptionsData validation. `Constants/Settings.cs` — `AppearanceSettingKeys.All`, `AppearanceDefaults` class. `Constants/Error.cs` — `InvalidOption` error code. `Constants/Validation.cs` — `AllowedValues` in `ValidationMeta`. MODIFIED: `SettingsService.cs` — added `GetAppearanceDefaultsAsync()` with memory cache, fixed key prefix bug in `SetAppearanceDefaultsAsync()`. `UserSettingsService.cs` — added `IMemoryCache` to `GetAllAsync()`, invalidate on Set/SetBatch. |
| Namorix.Server | 0.33.0 → 0.34.0 | NEW: `SettingsController.cs` — `GET /api/settings/appearance` public endpoint. `UserController.cs` — `[Validate(typeof(SetSettingsSchema))]` on `SetSettings`, `SetSettingsRequest` DTO. `SettingsController.cs` — `[Validate(typeof(SetSettingsSchema))]` on `PUT /api/settings/appearance`. |

## 2026-06-09 — Email/Name on User, UserSettings store, Appearance settings save

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.26.0 → 0.27.0 | NEW: `types/appearance.ts` — `AppearanceSettings` interface. NEW: `store` — `appearance` key + `setAppearanceStore`, `useAppearanceStore`. MODIFIED: `types/user.ts` — `email`, `name` fields. `types/error.ts` — `EMAIL_EXISTS`, `NAME_EXISTS`. `constants.ts` — `AppearanceDefaults`, `AppearanceKeys`. `apiRoutes.ts` — `UserSettings` + `appearanceDefaults`. `i18n/validation-runner.ts` — +EMAIL, NAME. `i18n/validation-messages.ts` — resolve email/name errors. |
| @namorix/styles | 0.27.0 → 0.27.1 | MODIFIED: `auth.scss` — minor fixes. |
| @namorix/ui | 0.21.0 → 0.21.1 | MODIFIED: `NmxButtonLive` — `active` → `semantic` prop. |
| frontend | 0.34.0 → 0.35.0 | NEW: `Register.tsx` — email + name fields. REWRITE: `SettingsAccount.tsx` — split Profile/Password sections, email/name editable. REWRITE: `SettingsAppearance.tsx` — load/save via UserSettings API, 2 save modes (self / system default). NEW: `settings.controller.ts` — `getUserSettings`, `saveUserSettings`, `setAppearanceDefaults`. MODIFIED: `auth.controller.ts` — `loadAppearance()` after login/session restore. MODIFIED: `Desktop.tsx` — loadAppearance on mount. NEW i18n keys. |
| Namorix.Core | 0.32.0 → 0.33.0 | NEW: `Models/UserSetting.cs`, `Validation/Schemas/UpdateProfileSchema.cs`. MODIFIED: `Models/User.cs` — +Email, Name, UserSettings. `ValidationRule.cs` — FormatValidationRule +MinLength/MaxLength. `Constants/Auth.cs` — +EmailPattern, EmailMaxLength, Name constants. `Constants/Error.cs` — +EmailExists, NameExists. `Constants/Settings.cs` — +AppearanceSettingKeys. `Data/AppearanceOptionsData.cs` — removed Inter/Geist/JetBrains Mono. `Responses/ApiResponse.cs` — UserResponse +Email, Name. |
| Namorix.Server | 0.32.0 → 0.33.0 | NEW: `UserSettingsService.cs`, `GET/PUT /api/user/settings`, `PUT /api/user/profile`, `PUT /api/settings/appearance`. MODIFIED: `AuthService.cs` — Register nhận email, name, check duplicates. `UserController.cs` — +profile, settings. `SettingsController.cs` — +PUT appearance. `AppDbContext.cs` — +UserSetting DbSet, unique indexes. `AuthController.cs` — catch EmailExists/NameExists. New migration. |

## 2026-06-09 — Toast notification system, form refactor, needsRegister store

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/core | 0.25.2 → 0.26.0 | NEW: `toast/` module — NmxToastBus (event emitter), NmxToastEvent types, nmxToast singleton with .long/.short/.success/.error/.warning/.info. NEW: `store` — needsRegister key + accessors (getNeedsRegisterStore, useNeedsRegisterStore, setNeedsRegisterStore). MODIFIED: `auth/auth.service.ts` — persists needsRegister from getAuthStatus(). MODIFIED: `NmxIconFontSymbol` — +WARNING, +INFO. |
| @namorix/styles | 0.26.0 → 0.27.0 | NEW: `toast.scss` — drop+expand animation, semantic color variants (success/error/warning/info). NEW: icomoon — ic-warning, ic-info glyphs. MODIFIED: `form.scss` — input border fix. Theme CSS rebuilt. |
| @namorix/ui | 0.20.0 → 0.21.0 | NEW: `NmxToastProvider` — subscribes to nmxToast event bus, renders toast queue with 3-toast cap, uses NmxIconFont for type icons. MODIFIED: `NmxAlertDialog` — useTranslation from core barrel. |
| frontend | 0.33.0 → 0.34.0 | NEW: `Root.tsx` — mount NmxToastProvider. REFACTOR: `Register.tsx` — use useNeedsRegisterStore instead of checkHasUsers() effect. REFACTOR: `Login.tsx`, `SettingsSystem.tsx`, `SettingsAccount.tsx` — form simplification, removed redundant state. NEW i18n keys. |

## 2026-06-09 — Density icons, font-size preview, button variants, NmxAlertDialog i18n

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.25.0 → 0.26.0 | NEW: `button.scss` — variant styles (outline, ghost, text). NEW: `maps.scss` — added "default" semantic color. NEW: `dialog.scss` — scrim token, styling updates. NEW: `segmented-group.scss` — renderItem style. NEW: `tokens/typography.scss` — preview font-size tokens. NEW: `themes/` — scrim, default color tokens. NEW: icomoon — 3 density icons. |
| @namorix/ui | 0.19.0 → 0.20.0 | NEW: `NmxSegmentedGroup` — icon support + renderItem prop. NEW: `NmxAlertDialog` — i18n integration (useTranslation from core). NEW: `NmxIconFont.types.ts` — 3 density icon symbols. MODIFIED: `primitives.ts` — added "default" to NmxSemanticColor. |
| @namorix/core | 0.25.1 → 0.25.2 | NEW: `i18n/index.ts` — re-export useTranslation from react-i18next. MODIFIED: `i18n/locales/en.json` — dialog i18n keys. |
| frontend | 0.32.0 → 0.33.0 | NEW: `SettingsAppearance.tsx` — density icons (SegmentedGroup icon), font-size preview (renderItem with "Aa" per size). MODIFIED: `i18n/locales/en.json` — new keys. |
