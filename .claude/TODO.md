# TODO

## SignalR — Token refresh before reconnect

**Context**: `signalr.service.ts` có `scheduleReconnect()` với exponential backoff nhưng chưa refresh access token trước khi reconnect. Khi cookie access token hết hạn, reconnect thất bại.

**Approach**: Gọi `POST /api/auth/refresh` trong `scheduleReconnect()` trước `startConnection()` để server set cookie mới.

**Files**:
- `frontend/packages/core/src/signalr/signalr.service.ts` — thêm `refreshAccessToken()` + gọi trong `scheduleReconnect()`

**Related**: Liên quan tới addon external (SignalR groups), xử lý sau khi làm M4.

## SignalR — Auth check when reconnect fails

**Context**: `scheduleReconnect()` retry vô hạn, nếu JWT expired → loading/reconnect mãi. Cần check session auth sau N lần failed, nếu expired thì redirect về login, không retry tiếp.

**Approach**: 
- Thêm `"auth-expired"` vào `SignalRStatus`
- Trong `scheduleReconnect()`, sau 3 attempts (~35s), gọi `GET /api/auth/session` bằng fetch với `credentials: "include"`
- Nếu session expired → `emitStatus("auth-expired")` → App.tsx redirect `window.location.href = DefaultPaths.LOGIN`
- Reset `reconnectAttempts` khi connect thành công

**Files**:
- `frontend/packages/core/src/signalr/types.ts` — thêm `"auth-expired"`
- `frontend/packages/core/src/signalr/signalr.service.ts` — `reconnectAttempts`, `isSessionExpired()`, auth check trong `scheduleReconnect()`
- `frontend/src/App.tsx` — effect redirect + sửa `shouldShowReconnecting`

**Note**: Không dùng `nmxHttp` để tránh circular dependency, dùng `fetch` trực tiếp.

---

## Version bump — localeKey addon i18n system

**Context**: Đã thêm `localeKey` vào `NmxAddonManifest` + `AddonItem`, resolve displayName/description qua i18n. Cần bump version và update memory bank.

**Bumps**:
- `@namorix/core` 0.23.1 → 0.24.0 (MINOR — new `LocaleKeys` type + `localeKey` field)
- `@namorix/styles` 0.22.0 → 0.22.1 (PATCH — token tweaks, `semantic.scss`)
- `frontend` 0.28.0 → 0.29.0 (MINOR — localeKey i18n system, descriptions, backend version defines, search fix)

**Docs**: Update `progress.md` (Current Version + history), `activeContext.md` (recent changes).

---

## NmxDataTable — Virtual Scrolling (TanStack Virtual)

**Context**: Current NmxDataTable renders ALL rows in DOM. For datasets >200 rows, need virtual scrolling.

**Approach**: Use `@tanstack/react-virtual` to only render visible rows + overscan buffer.

**Required changes**:
- `NmxDataTableProps`: need `rowHeight` (fixed or estimated), `overscan` props
- `NmxDataTable.tsx`: wrap body in virtual container, calculate visible range from scrollTop, translateY positioning
- TanStack Virtual handles the math (`estimateSize`, `getVirtualItems`, `totalSize`)
- Backend already paginates — only needed if displaying 500+ rows without pagination

**Files**:
- `frontend/packages/ui/src/Components/NmxDataTable/NmxDataTable.tsx`
- `frontend/packages/ui/src/Components/NmxDataTable/NmxDataTable.type.ts`

**Note**: Không urgent — current backend paginates at 50/200 items.

---

## Rail Collapse — Ẩn toggle trên mobile, chuyển lên window title bar

**Context**: Settings dùng NmxRail. Trên mobile NmxRail force collapsed, nhưng nút collapse toggle (`showToggle`) vẫn hiện trong rail. Muốn ẩn nó và chuyển thành nút menu trên title bar.

**Current behavior**:
- `NmxRailList` hiển thị toggle button (`NmxRailItem` với MENU_FOLD/MENU icon) khi `showToggle = true` (mặc định = `isWindowed`)
- Mobile NmxRail tự set `isCollapsed = true`, toggle vẫn visible

**Required changes**:
- `NmxRailList.tsx`: thêm logic `!isDeviceMobile` vào `isToggleShowed` để ẩn toggle trên mobile
- `WindowTitleBar.tsx`: thêm optional `onMenuToggle` prop, hiển thị nút menu (NmxIconFontSymbol.MENU) khi `isMobile()` — chỉ mobile mới có
- `WindowFrameView.tsx`: kết nối NmxRailContext với WindowTitleBar, pass `toggleCollapsed` xuống
- Cần expose NmxRailContext ra ngoài window (hoặc dùng signal/event) để title bar có thể toggle mà không cần biết rail bên trong

**Alternative approach**: Dùng `NmxHostContext` shell context để truyền `onMenuToggle` từ Settings (NmxRail user) lên window title bar qua WindowFrameView.

**Files**:
- `frontend/packages/ui/src/Components/NmxRail/NmxRail.tsx`
- `frontend/packages/ui/src/Components/NmxRail/NmxRailList.tsx`
- `frontend/src/components/WindowFrame/WindowTitleBar.tsx`
- `frontend/src/components/WindowFrame/WindowFrameView.tsx`
- `frontend/src/components/WindowFrame/WindowFrame.types.ts`

**Note**: Khi làm M4 external addon, Settings vẫn là built-in, nên cơ chế này chỉ áp dụng cho Settings.

---

## Email encryption

**Context**: Email trong DB đang lưu plaintext, cần mã hóa trước khi persist.

**Approach**: Dùng AES-256 encryption ở service layer — encrypt khi write `User.Email`, decrypt khi read. Hoặc dùng hashing nếu chỉ cần check uniqueness + không cần đọc lại email gốc.

**Files**:
- `backend/src/Namorix.Adapters/Services/AuthService.cs` — encrypt trước `SaveChangesAsync`
- `backend/src/Namorix.Adapters/Services/UserService.cs` — decrypt khi read email
- Có thể tạo helper class `EmailEncryption` ở `Namorix.Core/Helpers/`

**Note**: Không urgent — làm khi cần compliance hoặc user request.

---

## Appearance Settings — 3-layer cascade (Cách 2)

**Context**: SettingsAppearance UI có 8 mục (theme, accent color, collapsed, density, font family, size, language, date format) nhưng backend chỉ có `User.ThemeId`. Cần hệ thống settings hoàn chỉnh với 3-layer cascade: **user override → system default (admin set) → hardcoded default (code)**.

**Schema**:
- `Setting` table (key-value, đã có) — thêm keys `appearance_*` cho system defaults
- `User.Preferences` (`string?`, JSON) — chỉ lưu **overrides**, không lưu toàn bộ
  - VD: `{ "appearance_theme": "light", "appearance_font_size": "large" }`
  - User mới → `preferences = null` → tự động thấy system default
  - User override field nào thì field đó khác system default

**Data class** — `Namorix.Core/Data/AppearanceSettingsData.cs` (hoặc Model):
```csharp
public class AppearanceSettingsData
{
    public string Theme { get; init; } = "dark";
    public string AccentColor { get; init; } = "blue";
    public bool CollapsedDefault { get; init; } = false;
    public string Density { get; init; } = "default";
    public string FontFamily { get; init; } = "Inter";
    public string FontSize { get; init; } = "md";
    public string Language { get; init; } = "en";
    public string DateFormat { get; init; } = "DD/MM/YYYY";
}
```

**Merge logic** — 3 bước:
```
1. Start: new AppearanceSettingsData()                  // hardcoded defaults
2. Override từ Setting table (key `appearance_*`)        // admin system defaults
3. Override từ User.Preferences (JSON, partial fields)   // user-specific overrides
```

**API endpoints**:
- `GET  /api/settings/appearance` → system defaults (hardcoded ← DB), admin only
- `PUT  /api/settings/appearance` → admin set system defaults `[RequireAdmin]`
- `GET  /api/settings/appearance/options` → UI metadata (accent colors, fonts, densities, etc.)
- `GET  /api/user/preferences` → merged result (system ← user override)
- `PUT  /api/user/preferences` → save partial overrides (body: `{ "appearance_theme": "light" }`)

**Files — Backend**:
- `Namorix.Core/Data/AppearanceSettingsData.cs` — **NEW**: data class + defaults
- `Namorix.Core/Data/AppearanceOptionsData.cs` — **NEW**: options response class (accent colors, fonts, densities, languages, date formats)
- `Namorix.Core/Constants/Settings.cs` — thêm `Appearance*` keys
- `Namorix.Core/Models/User.cs` — thêm `string? Preferences` field
- `Namorix.Adapters/Services/SettingsService.cs` — thêm `Get/SetAppearanceDefaults()`, `GetAppearanceOptions()`
- `Namorix.Adapters/Services/UserService.cs` — thêm `Get/SetPreferences(int userId)`
- `Namorix.Server/Controllers/SettingsController.cs` — thêm appearance + options endpoints
- `Namorix.Server/Controllers/UserController.cs` — thêm preferences endpoints

**Files — Frontend**:
- `frontend/src/addons/Settings/SettingsAppearance.tsx` — fetch/save API, admin checkbox
- `frontend/packages/core/src/apiRoutes.ts` — thêm routes mới
- `frontend/src/store/slices/appearanceSlice.ts` — (optional) Redux slice

**Notes**:
- `Setting` table đã generic (key-value), không cần migration
- `User.Preferences` cần EF Core migration mới (add column)
- Admin set system default → user chưa override field nào sẽ thấy ngay
- User đã override → không bị ảnh hưởng bởi admin thay đổi

---

## Login — hỗ trợ email hoặc username

**Context**: Hiện tại `AuthService.Login()` chỉ check `Username`. Cần cho phép login bằng email.

**Approach**:
- Backend `AuthService.Login()` — check `u.Username == input || u.Email == input`
- Frontend `Login.tsx` — đổi label từ "Username" thành "Username or Email"
- `LoginSchema` — giữ nguyên validation (không đổi tên field)

**Files**:
- `backend/src/Namorix.Adapters/Services/AuthService.cs` — sửa `Login()`
- `frontend/src/i18n/locales/en.json` + `vi.json` — sửa label
- `frontend/packages/core/src/i18n/locales/en.json` — sửa `common.fields.username` label

