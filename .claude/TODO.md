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

	