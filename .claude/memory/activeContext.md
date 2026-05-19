# Active Context

## Current Work Focus

M3 — Desktop Shell UI ✅ + Addon System (contract, registry, Log Viewer) ✅

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

### 2026-05-19 — State Management Rewrite (Zustand → Redux Toolkit)

- **frontend (0.11.1 → 0.12.0)**: Zustand → Redux Toolkit rewrite. 4 stores → 3 slices (`windowsSlice`, `launcherSlice`, `taskbarSlice`). Normalized state (`byId` + `order`). Gộp window + geometry + animation vào `windowsSlice`. Memoized selectors với `createSelector`. `useAppSelector` mặc định `shallowEqual`. Taskbar tối ưu — không re-render khi drag/resize. Xóa 5 file `stores/*.store.ts` cũ.
- **@namorix/styles (0.8.0 → 0.9.0)**: Thêm `app-network-traffic.svg`, `app-system-monitor.svg` icons + token. Launcher/taskbar SCSS tweak. Theme entry đổi.
- **@namorix/ui (0.6.3 → 0.6.4)**: Thêm `APP_SYSTEM_MONITOR`, `APP_NETWORK_TRAFFIC` icon symbols.
- **frontend**: New addons — NetworkTraffic, SystemMonitor.

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

## Pending Fixes (TODO tomorrow)

### CSS URL resolution inconsistency
- `restoreTheme()` ghép URL từ `ThemeRoutes.themes.replace("{id}", ...)`
- `switchTheme()` dùng `manifest.css` trực tiếp — sau refresh load sai URL
- **Fix:** Option A — thêm `NMX_THEME_CSS_URL_KEY`, lưu URL thật, restore ưu tiên URL này, fallback ghép từ ID
- **Files:** `constants.ts`, `loader.ts` (thêm `saveThemePreference`), `ThemeProvider.tsx` (lưu URL khi switch), `auth.controller.ts` (lưu URL khi login sync)

### ThemeManifest types drift
- TS `ThemeManifest` thiếu `IsBuiltIn` field so với C# model — `getAllThemes()` gộp built-in + external, không phân biệt được
- **Fix:** Thêm `isBuiltIn: boolean` vào TS interface

### SetThemeRequest thiếu validation
- `UserController.cs:45-47` — `SetThemeRequest.ThemeId` thiếu `[Required]`, `[MaxLength]`
- `User.cs:16` — `ThemeId` thiếu `[MaxLength]` (các string field khác đều có)
- **Fix:** Thêm `[Required]`, `[MaxLength(100)]` vào cả 2 chỗ

### Login flow — theme fetch error propagation
- `auth.controller.ts:20-27` — Nếu GET `/api/user/theme` fail, error propagate ra caller dù login đã OK
- **Fix:** Tách try/catch riêng cho theme fetch, không block login

### `/api/themes` không có handler
- `ThemeController.cs` đã uncomment + implement, `ThemeService` register DI
- **Fix:** Đã implement ✅

### Thiếu `public/themes/registry.json`
- `ThemeRoutes.builtin` = `/themes/registry.json` — file chưa được tạo
- **Fix:** Tạo thư mục `frontend/public/themes/` + file registry JSON

## Next Steps

1. M3 — Internal addon: File Manager
2. M3 — Internal addon: Terminal (xterm.js)
3. M3 — Internal addon: Settings
4. M4 — SignalR + backend addon metadata
5. Write Vitest tests for auth.service
6. Add Vietnamese translations (vi.json is empty)
