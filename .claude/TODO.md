# TODO

## SignalR — Token refresh before reconnect

**Context**: `signalr.service.ts` có `scheduleReconnect()` với exponential backoff nhưng chưa refresh access token trước khi reconnect. Khi cookie access token hết hạn, reconnect thất bại.

**Approach**: Gọi `POST /api/auth/refresh` trong `scheduleReconnect()` trước `startConnection()` để server set cookie mới.

**Files**:
- `frontend/packages/core/src/signalr/signalr.service.ts` — thêm `refreshAccessToken()` + gọi trong `scheduleReconnect()`

**Related**: Liên quan tới addon external (SignalR groups), xử lý sau khi làm M4.

---

## ESC to close launcher
- `frontend/src/App.tsx` hoặc Desktop — keydown Escape → đóng launcher

## Disable right-click global
- Desktop.tsx — `contextmenu` event listener prevent default
