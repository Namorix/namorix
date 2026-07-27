# TODO

## NmxMenuButton — Divider by index, loading state

**Context**: Hiện tại divider gắn trên option (`divider: true`), khi filter ẩn option thì divider bị lệch. Cần chuyển sang cơ chế `dividerIndexes` (số âm từ dưới lên). Ngoài ra thiếu loading state trên NmxMenuButton.

**Approach**:
- Thay `divider?: boolean` trong `NmxMenuButtonOption` bằng `dividerIndexes?: number[]` trên props
- Số dương = index trong filtered list từ trên xuống
- Số âm = đếm từ dưới lên (vd -1 = trước item cuối)
- Thêm `loading?: boolean` prop, khi loading disabled button + ẩn dropdown
- `filterItem` edge case: khi không còn option nào → ẩn luôn cả trigger button

**Files**:
- `frontend/packages/ui/src/Primitives/NmxMenuButton.tsx`
- `frontend/src/addons/Frontgate/FrontgateCertificate.tsx`

---

## NmxOAuth2Client — Block infinite retry on invalid_client

**Context**: Khi DB backend bị reset (migration, xoá bảng), `AddonInstallations` mất record OAuth → `IssueClientCredentialsTokenAsync` trả về `400 invalid_client`. Addon retry vô hạn mỗi 5 giây vì `_cached` không bao giờ được set → spam DB query + log.

**Approach**: 
- `NmxOAuth2Client.GetAccessTokenAsync()` hoặc `EnsureSuccessAsync()` — detect `invalid_client` error, re-throw dạng permanent (không retry được) thay vì transient
- `AddonHostedServiceBase.ConnectWithRetryAsync()` — phân biệt `NmxOAuthException` permanent vs transient:
  - Permanent (invalid_client, không tìm thấy addon trong DB): dừng retry, set `_initialized = false`, log fatal, không retry nữa
  - Transient (timeout, network error): retry như hiện tại
- Optional: tự động re-register nếu phát hiện `invalid_client` → xoá `oauth.json` + gọi lại registration nếu có `NMX_REGISTRATION_TOKEN`

**Files**:
- `backend/src/Namorix.Core/OAuth/NmxOAuth2Client.cs` — thêm error classification
- `backend/src/Namorix.Core/Grpc/AddonHostedServiceBase.cs` — phân biệt permanent/transient error

**Note**: Cả `Namorix.Core` (OAuth client SDK) và `AddonHostedServiceBase` đều là shared code cho addon, không phải backend.

---

## SignalR — Token refresh before reconnect

**Context**: `signalr.service.ts` có `scheduleReconnect()` với exponential backoff nhưng chưa refresh access token trước khi reconnect. Khi cookie access token hết hạn, reconnect thất bại.

**Approach**: Gọi `POST /api/auth/refresh` trong `scheduleReconnect()` trước `startConnection()` để server set cookie mới.

**Files**:
- `frontend/packages/core/src/signalr/signalr.service.ts` — thêm `refreshAccessToken()` + gọi trong `scheduleReconnect()`

**Related**: Liên quan tới addon external (SignalR groups), xử lý sau khi làm M4.

## SignalR — Dialog loading overlay khi mất kết nối

**Context**: Khi SignalR mất kết nối (reconnecting state), dialog (NmxAlertDialog, NmxDialog) bị loading overlay che mất nội dung. Cần phân biệt SignalR loading state với dialog loading state.

**Approach**:
- Nguyên nhân: SignalR reconnecting state propagate qua global store/context, dialog `loading` prop bị ảnh hưởng
- Fix: tách biệt dialog loading state (form submitting) khỏi global SignalR connection state

**Files**:
- `frontend/src/App.tsx` — kiểm tra `shouldShowReconnecting` và các effect liên quan
- `frontend/packages/ui/src/Components/NmxDialog/NmxDialog.tsx` — kiểm tra `loading` prop propagation

---

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

## Email encryption

**Context**: Email trong DB đang lưu plaintext, cần mã hóa trước khi persist.

**Approach**: Dùng AES-256 encryption ở service layer — encrypt khi write `User.Email`, decrypt khi read. Hoặc dùng hashing nếu chỉ cần check uniqueness + không cần đọc lại email gốc.

**Files**:
- `backend/src/Namorix.Adapters/Services/AuthService.cs` — encrypt trước `SaveChangesAsync`
- `backend/src/Namorix.Adapters/Services/UserService.cs` — decrypt khi read email
- Có thể tạo helper class `EmailEncryption` ở `Namorix.Core/Helpers/`

**Note**: Không urgent — làm khi cần compliance hoặc user request.

---

## Appearance — Backend endpoint merge 3-layer

**Context**: Hiện tại `loadAppearance()` gọi 2 API song song từ frontend (`GET /api/settings/appearance` + `GET /api/user/settings`) rồi merge. Gọn hơn nếu backend có 1 endpoint trả về luôn kết quả đã merge.

**Approach**: Thêm `GET /api/user/appearance` (hoặc tương tự) — backend merge code defaults ← system defaults ← user overrides, frontend chỉ cần gọi 1 endpoint.

**Files**:
- `Namorix.Server/Controllers/UserController.cs` hoặc `SettingsController.cs` — endpoint mới
- `Namorix.Adapters/Services/UserSettingsService.cs` — thêm `GetMergedAppearanceAsync()`
- `frontend/src/controllers/auth.controller.ts` — sửa `loadAppearance()` gọi 1 endpoint thay 2
- `frontend/packages/core/src/apiRoutes.ts` — thêm route mới

**Note**: Không urgent — frontend đã merge ổn. Làm khi rảnh hoặc cần tối ưu.
---

**Context**: Hiện tại `AuthService.Login()` chỉ check `Username`. Cần cho phép login bằng email.

**Approach**:
- Backend `AuthService.Login()` — check `u.Username == input || u.Email == input`
- Frontend `Login.tsx` — đổi label từ "Username" thành "Username or Email"
- `LoginSchema` — giữ nguyên validation (không đổi tên field)

**Files**:
- `backend/src/Namorix.Adapters/Services/AuthService.cs` — sửa `Login()`
- `frontend/src/i18n/locales/en.json` + `vi.json` — sửa label
- `frontend/packages/core/src/i18n/locales/en.json` — sửa `common.fields.username` label

---

## Change Password — Revoke existing tokens

**Context**: Khi user đổi mật khẩu, các refresh token + access token cũ vẫn còn hiệu lực đến khi hết hạn. Nếu tài khoản bị compromise, attacker đổi password nhưng session cũ vẫn sống (hoặc ngược lại: user đổi password để kick attacker nhưng token cũ vẫn dùng được).

**Approach**:
- `AuthService.ChangePasswordAsync()` — sau khi cập nhật password hash, gọi `RevokeAllUserTokens(userId)` để revoke toàn bộ refresh tokens
- Frontend sau khi đổi password thành công → redirect về login (hoặc forced logout) vì access token hiện tại cũng mất hiệu lực (refresh token bị revoke → access token không refresh được)
- Cân nhắc: access token còn hạn dùng luôn hay không? Option A: hard (revoke cả refresh token, access token sống đến hết hạn). Option B: soft (revoke cả refresh, nhưng giữ session hiện tại sống và cấp refresh token mới cho session hiện tại).

**Files**:
- `backend/src/Namorix.Server/Services/AuthService.cs` — thêm `RevokeAllUserTokens()` trong `ChangePasswordAsync()`
- `backend/src/Namorix.Server/Controllers/UserController.cs` — sau khi change password success, clear cookies + trả về yêu cầu re-login
- `frontend/src/pages/Settings/AccountTab.tsx` — handle change password success → redirect `/login`

---

## Notification Panel + Launcher — Freeze panel size khi filter

**Context**: Khi toggle filter unread/all, số lượng items thay đổi → panel co giãn, UI không mượt. Hiện tại dùng `freezePanelSize` set inline `style.height/width` trước khi filter, `unfreezePanelSize` remove sau. Cách này chưa tối ưu.

**Approach** (cần nghiên cứu):
- Tìm cách freeze kích thước panel mà không cần JS inline style
- Hoặc animate transition khi panel thay đổi kích thước
- Áp dụng cho cả NotificationPanel và Launcher

**Files**:
- `frontend/src/components/Taskbar/NotificationPanel.tsx`
- `frontend/src/components/Launcher/`
- `frontend/packages/styles/src/base/shell/components/`

**Note**: Nghiên cứu sau.

---

## Install container — AddonTaskExecutor.InstallAsync

**Context**: Install button ở PackageCenter AddonGrid không có onClick handler. Backend `InstallAsync` đang để trống. Cần implement flow install: pull image → create container → start → save DB → notify.

**Approach**:
- Frontend: thêm `image` field vào `DisplayAddon`, populate từ `cat.image`, handleInstall pattern giống handleStart/Stop
- Backend: Implement `InstallAsync` — pull image, create container với labels/env vars, **lưu DB status = "installed" (không start)**, notify
- Sau install, user bấm Start → dùng ContainerId từ DB để start
- ContainerId từ Docker create response, lưu vào DB → dùng cho start/stop/uninstall sau

**Issues**:
- `DesktopApiUrl` (NMX_DESKTOP_API_URL env var cho container) — cần config hoặc hardcode
- OAuth key gen (ClientId/RedirectUri) — generate tạm, OAuth đầy đủ làm sau
- HostPort auto-allocate khi không chỉ định — Docker random port
- Cần quyết định DesktopApiUrl approach trước khi implement

**Files**:
- `frontend/src/addons/PackageCenter/AddonGrid.tsx` — thêm `image` vào DisplayAddon, handleInstall, gắn onClick
- `backend/src/Namorix.Server/Services/AddonTaskExecutor.cs` — implement InstallAsync
- `backend/src/Namorix.Server/Controllers/AddonController.cs` — thêm SetTaskPending(Installing)
- `backend/src/Namorix.Core/Config/AppConfig.cs` — optional: thêm DesktopApiUrl

**Status**: Deferred — chờ quyết định DesktopApiUrl + OAuth approach.

## OAuthConsents — Planned

**Context**: `OAuthConsents` table đã được tạo trong DB schema nhưng chưa được sử dụng. Dùng để lưu consent grant của user cho mỗi OAuth client — cho phép user revoke consent cho addon cụ thể, và hỏi consent lần đầu khi addon request authorization.

**Approach**:
- Backend: OAuthService kiểm tra OAuthConsents trước khi tạo authorization code (nếu `prompt=consent` hoặc chưa có consent)
- Backend: API endpoint `GET /api/oauth/consents` + `DELETE /api/oauth/consents/{clientId}` cho user quản lý
- Frontend: OAuth consent dialog khi addon request lần đầu
- Frontend: Settings tab quản lý consented addons

**Files**:
- `backend/src/Namorix.Server/Services/OAuthService.cs` — thêm consent check
- `backend/src/Namorix.Server/Controllers/OAuthController.cs` — thêm consent endpoints
- `frontend/src/pages/Settings/` — thêm OAuth consents tab

**Status**: Planned — chờ khi có external addon request flow cần consent.

---

## Upcoming Addons

- Beam (media)
- Scout (Camera)
- Vault (Drive)

---

## Frontgate — Replace dev static path on production build

**Context**: Proxy ports serve `frontend/public/` via `PhysicalFileProvider` với path tạm thời (`../../frontend/public/` từ project dir). Build production cần replace bằng frontend built output path.

**Files**: `Program.cs` — proxy branch `PhysicalFileProvider` + `MapFallbackToFile` paths.

	