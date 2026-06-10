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

### 2026-06-10 — bản cập nhật gần nhất

Detail dialogs, meta-list grid, logout confirm, register fix, theme cleanup, format utilities, i18n sync, time format, settings validation, appearance caching, toast system, density icons.

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

### Toast Notification System (Planned)
- **Architecture:** Event bus trong `@namorix/core` (`nmxToast` singleton), React provider trong `@namorix/ui` (`NmxToastProvider`), mount trong `Root.tsx`
- **API:** `nmxToast.long(msg)`, `nmxToast.short(msg)`, `.success()`, `.error()`, `.warning()`, `.info()`
- **Context isolation:** Widget addon (cùng DOM) → toast trên desktop. Standalone (window.open riêng) → tự mount provider → toast trong standalone
- **Tokens:** Dùng `--nmx-color-{success/error/warning/info}` CSS variable từ styles, không hardcode
- **Khi nào implement:** Khi cần toast cho Settings save confirm hoặc external addon feedback

## Pending Fixes

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
