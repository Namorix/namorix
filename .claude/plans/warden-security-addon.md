# Warden — Security Enforcement Addon

## Overview

**Warden** là internal addon (built-in như Beacon/Frontgate) — **tường lửa cấp host**, đóng vai trò lớp bảo vệ dưới Frontgate (lớp HTTP). Nhận security event từ addon khác (Frontgate, Auth), phân tích threshold, thực thi **allow/deny rule** qua iptables/nftables. Tên Warden, icon shield/castle, tông amber/bronze.

### Vị trí kiến trúc

| Lớp | Addon | Phạm vi |
|-----|-------|---------|
| HTTP | Frontgate | Reverse proxy, access control, rate limit |
| Host | **Warden** | Firewall rule, cổng, block IP ở tầng network |

---

## Dashboard UI (Mock — 2026-08-09)

Giao diện mẫu đã chốt: dashboard kiểu DSM (Synology), tông amber, đứng cùng Frontgate nhưng tầng host. Layout + mapping component sẵn có:

### Component mapping (đã verify tồn tại trong `@namorix/ui`)

| Block trong mock | Component | Ghi chú |
|------------------|-----------|---------|
| Header icon shield-check + "Warden / Tường lửa cấp host" | `NmxIconFont` symbol `SECURITY` (có sẵn) trong `NmxIconBox` bg warning | tone amber, hoặc thêm `SHIELD` |
| Firewall master toggle ("Đang bật") | `NmxToggle` (`checked`, `onCheckedChanged`) | |
| 3 metric card: Quy tắc đang hoạt động / Đã chặn hôm nay / Cổng đang mở | `NmxStatCard` × 3 (`label`, `value`, `semantic`, `icon`) | "Đã chặn hôm nay" dùng `semantic="danger"` |
| Hồ sơ bảo mật (Trung bình/Thấp/Cao/Tùy chỉnh) | `NmxSegmentedGroup` (`options`, `value`, `onChange`) | DSM-style, active warning tone |
| Danh sách quy tắc (Tên / Nguồn / Cổng-Giao thức / Hành động / edit) | `NmxDataTable` (`columns`, `rows`, `rowCellSpacing`, `onRowClick`) + `NmxBadge` semantic success/danger cho Cho phép/Từ chối + `NmxMenuButton` cho edit | |
| Hoạt động gần đây (block log) | `NmxLogList` (`items: NmxLogEntry[]`, `semantic`) | icon `ERROR`/`BAN`, time relative |

### Component đã xác nhận sẵn có

- `NmxStatCard` — `label`, `value`, `icon`, `semantic`, `trend`, `thresholdCurrent/thresholdTotal`
- `NmxSegmentedGroup` — `options`, `value`, `onChange` (generic)
- `NmxToggle` — `checked`, `onCheckedChanged`, `disabled`
- `NmxDataTable` — `columns` (header/renderCell/grow/hideBelow), `rows`, `rowCellSpacing`, `clickableRows`, `onRowClick`
- `NmxBadge` — `semantic`
- `NmxLogList` — `items: NmxLogEntry[]` (`timestamp`, `message`, `level?`, `semantic`), `onItemClick`, markup render
- `NmxMenuButton` — dropdown với `filterItem`, `dividerIndexes`
- `NmxIconFont` — `SECURITY`, `LOCK`, `ERROR`, `WARNING`, `REVERSE_PROXY`, `HOSTNAME`, `ACTIVITY` (có sẵn)
- `NmxIconSvg` — `APP_WARDEN` + `frontend/public/icons/app-warden.svg` (đã có)

### Icon cần thêm (@namorix/ui + @namorix/styles icomoon)

- `SHIELD` (header/stat card) — hoặc dùng `SECURITY` sẵn có
- `BAN` / `FORBIDDEN` (icon block log, "Đã chặn" stat)
- `PORT` / `RULE` (tab/badge cổng) — optional

### SCSS mới (`@namorix/styles`)

- `base/shell/addon/warden.scss` — layout dashboard (stat grid 3-col, profile row, rule table, log list), tone amber (warning tokens)

---

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

- [ ] **Models**: `WdFirewallRule` (Id, Name, SourceCidr, Ports, Protocol, Action: Allow/Deny, Enabled, Priority?, CreatedAt) + `WdSecurityEvent` (Id, EventType, Severity, SourceAddon, SourceIp, Count, WindowStart, Detail?, Timestamp) + `WdSettings` (FirewallEnabled, SecurityProfile)
- [ ] **Migration**: `AddWdTables` — bảng rule + event + settings với index trên Ip + Timestamp
- [ ] **AppDbContext**: DbSet + relationships
- [ ] **WdController**: CRUD firewall rules (list/create/update/delete/toggle) + get/set settings (firewall enabled, profile) + stats (activeRules, blockedToday, openPorts) — `[RequireAdmin]`, route `/api/warden`
- [ ] **WdEventController**: list security events paginated, filter theo IP/type/severity — route `/api/warden/events`
- [ ] **WdFirewallService**: render rule list → `iptables`/`nftables` (`Process.Start()`) — add/remove rule trên apply
- [ ] **Constants**: `WdErrorCodes` (RuleNotFound, IpAlreadyBanned, etc.) + `WdEventTypes` + `WdSecurityProfile` enum (Low/Medium/High/Custom)

### Frontend

- [ ] **Core**: `apiRoutes.ts` — `ApiWardenRoutes`
- [ ] **Addon struct**: `warden.addon.ts` + `Warden.tsx` (dashboard layout theo mock)
- [ ] **Components**: `WardenStats.tsx` (3 `NmxStatCard`), `WardenProfile.tsx` (`NmxSegmentedGroup` Low/Medium/High/Custom), `WardenRules.tsx` (`NmxDataTable` + `NmxBadge` allow/deny + `NmxMenuButton` edit), `WardenBlockLog.tsx` (`NmxLogList`), `WardenRuleDialog.tsx` (add/edit rule)
- [ ] **Frontend controller**: `wardenController.{listRules, createRule, updateRule, deleteRule, toggleFirewall, setProfile, getStats, listEvents}`
- [ ] **Types**: `Warden.types.ts` — interfaces + `WardenErrorCodes`
- [ ] **i18n**: en.json + vi.json — warden namespace (dashboard, profile, rule fields, actions, errors)

### Addon registry

- [ ] `frontend/src/addons/index.ts` — import Warden addon
- [ ] `frontend/src/addons/Warden/` — dashboard components (thay scaffold rỗng hiện tại)
- [ ] @namorix/ui — thêm icon `SHIELD`/`BAN` (hoặc dùng `SECURITY` sẵn có)
- [ ] @namorix/styles — thêm icon token + `warden.scss`

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
- [ ] **Frontend**: `useServerSignalRGroup("warden")` + `useServerSignalREvent("warden:new-event")` → refetch event list + block log
- [ ] **SignalR constants**: `ServerSignalR.cs` + `frontend signalr/constants.ts`

---

## Phase 2 — Threshold Logic + Rule Execution

### Threshold engine

- [ ] **WdThresholdWorker**: `BackgroundService` (loop ~10s), quét `WdSecurityEvent` gần đây, group by `(SourceIp, EventType)`, tính sliding window count
- [ ] **Threshold rules** (config trong DB `WdSettings` hoặc hardcode ban đầu):
  - `ACME_CHALLENGE_FAIL`: >20 lần/5 phút → deny 1 giờ
  - `SCAN_404`: >50 lần/5 phút → deny 30 phút
  - `BRUTE_FORCE`: >10 lần/5 phút → deny 1 giờ
  - `EXPLOIT_ATTEMPT`: >3 lần/5 phút → deny vĩnh viễn
- [ ] **Escalation**: tái phạm trong 24h sau khi tự unban → deny vĩnh viễn

### Rule execution

- [ ] **WdFirewallService**: `ApplyRule()` / `RemoveRule()` — gọi `iptables`/`nftables` qua `Process.Start()` — add/remove `DROP` rule cho IP/source
- [ ] **Auto-deny tạo từ threshold**: insert `WdFirewallRule` (Action: Deny, source = IP) + apply
- [ ] **Tự hết hạn**: `WdBanCleanupWorker` (BackgroundService, loop 30s) — check `ExpiresAt < now` → `RemoveRule()` + update DB
- [ ] **Persistence**: server restart → `WdBanCleanupWorker.OnStart` re-apply tất cả active rules (giống `RequeueUpdatingAsync` trong Beacon)

---

## Phase 3 — Management UI (Dashboard)

- [ ] **Firewall master toggle**: header `NmxToggle` → `toggleFirewall()` (on/off toàn bộ rule)
- [ ] **Hồ sơ bảo mật**: `NmxSegmentedGroup` Thấp/Trung bình/Cao/Tùy chỉnh → `setProfile()` (mỗi profile = preset rule set)
- [ ] **Rule CRUD**: `NmxDataTable` (Tên/Nguồn/Cổng-Giao thức/Hành động) + `NmxMenuButton` edit/delete + `NmxAlertDialog` confirm delete; nút "Thêm quy tắc" mở `NmxRuleDialog` (tên, source CIDR, cổng, protocol, action allow/deny)
- [ ] **Block log**: `NmxLogList` — event deny gần đây (ip, lý do, time relative), click → detail dialog
- [ ] **Stats**: `NmxStatCard` × 3 (active rules / blocked today / open ports) — refresh theo SignalR + interval

---

## Phase 4 — Herald Integration (Future)

- [ ] Khi deny rule được apply → publish event `warden:rule-applied` qua `IHeraldNotifier` để tổng hợp notification
- [ ] Khi rule bị gỡ → `warden:rule-removed`

---

## Verification

1. Bot scan `/.well-known/acme-challenge` → xuất hiện trong Warden Events tab
2. Đủ ngưỡng → deny rule xuất hiện trong bảng + `iptables -L` thấy rule DROP
3. Bấm remove rule → rule biến mất khỏi bảng + iptables rule được xóa
4. Hết hạn ban → tự động gỡ, rule biến mất khỏi bảng
5. Server restart → rules được re-apply
6. Dashboard: 3 stat card hiển thị đúng (active rules / blocked today / open ports), toggle firewall on/off apply toàn bộ
