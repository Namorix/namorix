# Warden — Security Enforcement Addon

## Overview

**Warden** là internal addon (built-in như Beacon/Frontgate) — bảo vệ server bằng cách nhận security event từ addon khác, phân tích threshold, và thực thi ban IP qua iptables/nftables. Tên Warden, màu amber/bronze.

## Event Contract

```
SecurityEventType  ← loại event
Severity           ← mức độ (Info, Warning, Critical)
SourceAddon        ← addon nào gửi event
SourceIp           ← IP vi phạm
Count              ← số lần vi phạm trong cửa sổ
WindowStart        ← thời gian đầu cửa sổ
Detail?            ← JSON blob (path, status code, etc.)
Timestamp          ← thời gian event
```

### Event Types (ví dụ ban đầu)

| Type | Mô tả | Source |
|------|-------|--------|
| `ACME_CHALLENGE_FAIL` | `/.well-known/acme-challenge` nhận request nhưng không có token hợp lệ | Frontgate |
| `SCAN_404` | Request đường dẫn không tồn tại (>N lần) | Frontgate |
| `BRUTE_FORCE` | Login fail liên tục | Auth |
| `EXPLOIT_ATTEMPT` | SQL injection / XSS / path traversal pattern khớp | Frontgate |

---

## Phase 0 — Foundation

### Backend

- [ ] **Models**: `WdBanRule` (Id, Ip, Reason, BanType: Temporary/Permanent, ExpiresAt?, CreatedAt) + `WdSecurityEvent` (Id, EventType, Severity, SourceAddon, SourceIp, Count, WindowStart, Detail?, Timestamp)
- [ ] **Migration**: `AddWdTables` — 2 bảng với index trên Ip + Timestamp
- [ ] **AppDbContext**: DbSet + relationships
- [ ] **WdBanController**: CRUD cơ bản (list banned IPs, unban, whitelist check) — `[RequireAdmin]`, route `/api/warden`
- [ ] **WdEventController**: list security events paginated, filter theo IP/type/severity — route `/api/warden/events`
- [ ] **Constants**: `WdErrorCodes` (IpAlreadyBanned, IpNotBanned, etc.) + `WdEventTypes` static class

### Frontend

- [ ] **Core**: `apiRoutes.ts` — `ApiWardenRoutes`
- [ ] **Addon struct**: `warden.addon.ts` + `Warden.tsx` (NmxToolbar như Frontgate — 2 tab: Banned IPs, Events)
- [ ] **Frontend controller**: `wardenController.{listBans, unban, banManually, listEvents}`
- [ ] **Types**: `Warden.types.ts` — interfaces + `WardenErrorCodes`
- [ ] **UI Ban list**: NmxDataTable (IP, Lý do, Loại ban, Hết hạn, Action menu: Unban)
- [ ] **UI Event log**: NmxDataTable (SourceIp, EventType, Severity badge, Count, Timestamp)
- [ ] **i18n**: en.json — warden namespace (tabs, fields, actions, errors)

### Addon registry

- [ ] `frontend/src/addons/index.ts` — import Warden addon
- [ ] `frontend/src/addons/Warden/` — thư mục addon mới
- [ ] @namorix/ui — thêm icon `APP_WARDEN`
- [ ] @namorix/styles — thêm icon token + warden SCSS

---

## Phase 1 — Event Publishing (Frontgate → Warden)

### Cơ chế

Internal addon dùng **SignalR group** để nhận event — giống pattern Beacon/Frontgate. Frontgate publish event vào `WdSecurityEvents` table qua direct DB write (cùng `AppDbContext` trong cùng process). Warden subscribe SignalR `warden:new-event` để refresh UI.

### Frontgate side

- [ ] **AcmeChallengeMiddleware**: bot scan `/.well-known/acme-challenge` không khớp token → ghi `WdSecurityEvent` (type: `ACME_CHALLENGE_FAIL`, ip: RemoteIp, detail: path)
- [ ] **ProxyTrafficMiddleware**: request 404 → ghi `WdSecurityEvent` (type: `SCAN_404`, ip: RemoteIp, count: 1 cho mỗi IP trong cửa sổ 5 phút — debounce bằng in-memory ConcurrentDictionary)
- [ ] **IoC**: inject `AppDbContext` into `AcmeChallengeMiddleware` (đã có scope factory pattern)

### Warden side

- [ ] **WdEventService**: `PublishEvent(ip, type, ...)` — save DB + notify SignalR
- [ ] **I WardenNotifier** + **SignalRWardenNotifier**: `warden:new-event` qua `Clients.Group("warden")`
- [ ] **MainHub**: `SubscribeWarden()` / `UnsubscribeWarden()`
- [ ] **Frontend**: `useServerSignalRGroup("warden")` + `useServerSignalREvent("warden:new-event")` → refetch event list
- [ ] **SignalR constants**: `ServerSignalR.cs` + `frontend signalr/constants.ts`

---

## Phase 2 — Threshold Logic + Ban Execution

### Threshold engine

- [ ] **WdThresholdWorker**: `BackgroundService` (loop ~10s), quét `WdSecurityEvent` gần đây, group by `(SourceIp, EventType)`, tính sliding window count
- [ ] **Threshold rules** (config trong DB `WdSettings` hoặc hardcode ban đầu):
  - `ACME_CHALLENGE_FAIL`: >20 lần/5 phút → ban 1 giờ
  - `SCAN_404`: >50 lần/5 phút → ban 30 phút
  - `BRUTE_FORCE`: >10 lần/5 phút → ban 1 giờ
  - `EXPLOIT_ATTEMPT`: >3 lần/5 phút → ban vĩnh viễn
- [ ] **Escalation**: tái phạm trong 24h sau khi unban tự động → ban vĩnh viễn

### Ban execution

- [ ] **WdFirewallService**: gọi `iptables`/`nftables` qua `Process.Start()` — add rule `DROP` cho IP, remove rule khi unban
- [ ] **Unban tự động**: `WdBanCleanupWorker` (BackgroundService, loop 30s) — check `ExpiresAt < now` → gọi `WdFirewallService.UnbanIp()` + update DB status
- [ ] **Persistence**: server restart → `WdBanCleanupWorker.OnStart` re-apply tất cả active bans (giống `RequeueUpdatingAsync` trong Beacon)

---

## Phase 3 — Management UI

- [ ] **Manual ban**: dialog nhập IP + lý do + thời hạn
- [ ] **Manual unban**: nút Unban trong bảng với confirm dialog
- [ ] **Whitelist**: IP whitelist — không bao giờ bị ban (dùng cho admin IP)
- [ ] **Event detail**: click row event → dialog hiển thị Detail JSON
- [ ] **Stats overview**: header hiển thị số IP đang ban / total events / events 24h

---

## Phase 4 — Herald Integration (Future)

- [ ] Khi ban IP → publish event `warden:ip-banned` qua `IHeraldNotifier` để tổng hợp notification
- [ ] Khi unban → `warden:ip-unbanned`

---

## Verification

1. Bot scan `/.well-known/acme-challenge` → xuất hiện trong Warden Events tab
2. Đủ ngưỡng → IP xuất hiện trong Banned IPs tab + `iptables -L` thấy rule DROP
3. Bấm Unban → IP biến mất khỏi bảng + iptables rule được xóa
4. Hết hạn ban → tự động unban, IP biến mất khỏi bảng
5. Server restart → bans được re-apply
