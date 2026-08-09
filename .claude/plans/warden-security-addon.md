# Warden — Security Enforcement Addon

## Overview

**Warden** là internal addon (built-in như Beacon/Frontgate) — **tường lửa cấp host**, đóng vai trò lớp bảo vệ dưới Frontgate (lớp HTTP). Nhận security event từ addon khác (Frontgate, Auth), phân tích threshold, thực thi **allow/deny rule** qua iptables/nftables. Tên Warden, icon shield/castle, tông amber/bronze.

### Vị trí kiến trúc

| Lớp | Addon | Phạm vi |
|-----|-------|---------|
| HTTP | Frontgate | Reverse proxy, access control, rate limit |
| Host | **Warden** | Firewall rule, cổng, block IP ở tầng network |

---

## Dashboard UI (Mock — 2026-08-09, restructure → tabs 2026-08-09)

Giao diện mẫu đã chốt: dashboard kiểu DSM (Synology), tông amber, đứng cùng Frontgate nhưng tầng host. Layout + mapping component sẵn có:

> **Restructure (2026-08-09)**: đã đổi từ single-page dashboard sang **4 tabs** qua `NmxToolbar` — **Overview / Activity / Rules / Settings**. Content phải nằm TRONG `<NmxToolbar>` (provider scope — `NmxToolbarContent` là sibling thì throw `useNmxTabContext must be used within NmxTabProvider`). Tab `settings` hiện **chưa có `NmxToolbarContent`** → render rỗng (chưa có nội dung cần thiết).

### Component mapping (đã verify tồn tại trong `@namorix/ui`)

| Block trong mock | Component | Ghi chú |
|------------------|-----------|---------|
| Header icon shield-check + "Warden / Tường lửa cấp host" | `NmxIconFont` symbol `SECURITY` (có sẵn) trong `NmxIconBox` bg warning | tone amber, hoặc thêm `SHIELD` |
| Firewall master toggle ("Đang bật") | `NmxToggle` (`checked`, `onCheckedChanged`) | |
| 3 metric card: Quy tắc đang hoạt động / Đã chặn hôm nay / Cổng đang mở | `NmxStatCard` × 3 (`label`, `value`, `semantic`, `icon`) | "Đã chặn hôm nay" dùng `semantic="error"` (codebase không có "danger") |
| Hồ sơ bảo mật (Trung bình/Thấp/Cao/Tùy chỉnh) | `NmxSegmentedGroup` (`options`, `value`, `onChange`) | DSM-style, active warning tone |
| Danh sách quy tắc (Tên / Nguồn / Cổng-Giao thức / Hành động / edit) | `NmxDataTable` (`columns`, `rows`, `rowCellSpacing`, `onRowClick`) + `NmxBadge` semantic success/error cho Cho phép/Từ chối + `NmxMenuButton` cho edit | |
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
- ✅ **`TASK` đã thêm (2026-08-09)** — dùng cho tab Rules (`NmxIconFontSymbol.TASK` + icomoon glyph)

### SCSS mới (`@namorix/styles`)

- `base/shell/addon/warden.scss` — ✅ **đã làm (2026-08-09)** — `.nmx-addon-warden__page` + `__setting-row` (border-radius 0), layout trang tabs; dùng tokens chung + tone amber qua warning tokens

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

### Backend — ✅ hoàn tất (2026-08-09, build pass 0 errors)

- [x] **Models**: `WdFirewallRule` (Id, Name, SourceCidr, Ports, Protocol, Action: Allow/Deny, Enabled, **Auto**, Priority?, **ExpiresAt**, CreatedAt) + `WdSecurityEvent` (Id, EventType, **Severity**, SourceAddon, SourceIp, Count, WindowStart, Detail?, Timestamp) + `WdSettings` (FirewallEnabled, SecurityProfile — **single-row, Id = 1**) — tại `Namorix.Server/Models/Warden/`
- [x] **Migration**: `AddWdTables` — bảng rule + event + settings với index trên Ip + Timestamp
- [x] **AppDbContext**: DbSet + relationships (refactor `OnModelCreating` → `Configure*` methods, thêm `ConfigureWarden`)
- [x] **WdController**: CRUD firewall rules (list/create/update/delete/toggle) + get/set settings (firewall enabled, profile) + stats (activeRules, blockedToday, openPorts) — `[RequireAdmin]`, route `/api/warden`
- [x] **WdEventController**: list security events paginated, filter theo IP/type/severity — route `/api/warden/events`
- [x] **WdRuleSchema** (validation `[Validate]`): name required 1-64, SourceCidr/Ports optional, enum protocol/action — CIDR/ports format check qua `WdErrorCodes.InvalidCidr`/`InvalidPorts`
- [x] **WdFirewallService**: **stub Phase 0** (log-only apply/remove/applyAll) — render rule → `iptables`/`nftables` để dành Phase 2; registered `AddSingleton<WdFirewallService>()`
- [x] **Constants**: `WdErrorCodes` (RuleNotFound, IpAlreadyBanned, InvalidCidr, InvalidPorts) + `WdEventTypes` (ACME_CHALLENGE_FAIL, SCAN_404, BRUTE_FORCE, EXPLOIT_ATTEMPT) + `WdSecurityProfile` enum (Low/Medium/High/Custom)

### Frontend — ✅ hoàn tất (2026-08-09, `tsc -b` pass 0 errors) — restructure tabs đợt 2

- [x] **Core**: `apiRoutes.ts` — `ApiWardenRoutes` (`rules`, `ruleById(id)`, `ruleToggle(id)`, `settings`, `stats`, `events`)
- [x] **Addon struct**: `Warden.addon.tsx` (registerAddon, `NmxAddonId.warden`, `UserRole.Admin`, icon `APP_WARDEN`) + `Warden.tsx` (**tabs** `NmxToolbar<WardenTab>` defaultTab="overview", header `NmxToolbarList`, 3 `NmxToolbarContent`: overview/activity/rules; tab settings chưa có content)
- [x] **Components** (đổi tên/ghép sau restructure — cũ `WardenStats`/`WardenProfile`/`WardenBlockLog`/`WardenRules` đã xóa):
  - `WardenOverview.tsx` — firewall master toggle `NmxToggle` (`NmxSettingsRow`/`NmxSettingsCard`/`NmxSettingsWrap`, disabled khi `!settings`), 3 `NmxStatCard` (activeRules / blockedToday `semantic="error"` / openPorts) `NmxGrid cols={3}`, profile `NmxSegmentedGroup<WdSecurityProfile>` Low/Medium/High/**Custom**. Fetch cả `getStats` + `getSettings` (trước chỉ fetch stats → profile/toggle kẹt disabled — **fix**)
  - `WardenActivity.tsx` — `NmxLogList` (severity info/warning/critical → info/warning/error), **`NmxPagination` + `usePageSize`** (page/pageSize/totalItems), Refresh button
  - `WardenRules.tsx` — `NmxDataTable` (name/source/ports·protocol/action + menu col `btnIsMenu`) + `NmxBadge` allow=success/deny=error + `NmxMenuButton<"toggle"|"edit"|"delete">` (MENU_VERTICAL trigger, `arrowDisabled`) + delete confirm `NmxAlertDialog`
  - `WardenRuleDialog.tsx` — add/edit rule: name (`confirmDisabled` khi name trống), sourceCidr, ports (**`NmxTagInput`** — thay textarea/input), protocol `NmxSelect`, action `NmxSelect`, enabled `NmxToggle`
- [x] **Frontend controller**: `wardenController.{listRules, createRule, updateRule, deleteRule, toggleRule, getSettings, updateSettings, getStats, listEvents}` — `toggleFirewall`/`setProfile` gộp vào `updateSettings` (backend PUT nhận cả 2); `listEvents` build `Record<string, string|number|boolean>` tường minh (fix TS index signature)
- [x] **Types**: `Warden.types.ts` — `WdFirewallRule`, `WdSecurityEvent`, `WdSettings`, `WdStats`, `WdEventQuery`, enums (`WdRuleAction`/`WdProtocol`/`WdSeverity`/`WdSecurityProfile`) + `WardenErrorCodes` map
- [x] **i18n**: en.json — warden namespace restructure thành **`tabs.*` + `pages.overview.*` / `pages.activity.*` / `pages.rules.*`** (đã đầy đủ); **vi.json — chưa làm (hoãn theo yêu cầu)**
- ⚠️ **Latent bug (chưa fix)**: `WardenOverview.tsx:86` — label firewall toggle dùng key `addon.warden.overview.fields.firewallDisabled` (thiếu `pages.` — fallback render raw key khi firewall tắt); nên đổi thành `addon.warden.pages.overview.fields.firewallDisabled`
- ⚠️ **Custom profile chưa có nơi cấu hình**: backend `WdSettings.Profile` lưu enum nhưng **không đọc/apply ở đâu** (WdFirewallService là stub Phase 2); `ProfileOptions` vẫn expose "custom" nhưng không có config backing → nên ẩn cho tới khi backend hỗ trợ, hoặc giữ làm placeholder

### Addon registry

- [x] `frontend/src/addons/index.ts` — import `./Warden/Warden.addon` (đã có sẵn)
- [x] `frontend/src/addons/Warden/` — dashboard tabs thay scaffold rỗng
- [x] @namorix/ui 0.44.0 — `NmxChipToggle` (role="switch") + `NmxSettingsWrap` + icon `TASK` (dùng `SECURITY`/`ERROR`/`NETWORK`/`STATS`/`ACTIVITY`/`TASK`/`SETTING`; SHIELD/BAN optional, defer)
- [x] @namorix/styles 0.55.0 — `warden.scss` (`__page` + `__setting-row`) + chip-toggle SCSS + icomoon glyph TASK

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

> Dashboard đã xây toàn bộ trong **Phase 0 frontend**. Phase này còn lại: detail dialog + realtime refresh.

- [x] **Firewall master toggle**: `NmxToggle` → `updateSettings({ firewallEnabled })` — **đã xây Phase 0**
- [x] **Hồ sơ bảo mật**: `NmxSegmentedGroup` → `updateSettings({ profile })` — **đã xây Phase 0**
- [x] **Rule CRUD**: `NmxDataTable` + `NmxMenuButton` + `NmxAlertDialog` confirm delete + `WardenRuleDialog` — **đã xây Phase 0**
- [x] **Block log**: `NmxLogList` hiện event recent — **đã xây Phase 0** (dùng `dateTime()`, không "time relative")
- [ ] **Block log detail dialog**: click item → dialog xem chi tiết event (`detailJson`)
- [ ] **Stats realtime**: refresh `NmxStatCard` theo SignalR (`warden:new-event`) + interval

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
