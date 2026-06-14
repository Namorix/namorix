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

Xem chi tiết tại [versionHistory-06-2026.md](versionHistory-06-2026.md) và [versionHistory-05-2026.md](../archive/versionHistory-05-2026.md).

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

## Next Steps

1. M3 — Internal addon: File Manager
2. M3 — Permission tree UI (deferred)
3. Write Vitest tests for auth.service
