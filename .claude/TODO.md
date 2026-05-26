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

