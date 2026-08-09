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
  - `WardenActivity.tsx` — `NmxLogList` (severity info/warning/critical → info/warning/error), **`NmxPagination` + `usePageSize`** (page/pageSize/totalItems), Refresh button; **detail dialog + `detailJson` parse (thêm Phase 3 — 2026-08-09)**
  - `WardenRules.tsx` — `NmxDataTable` (name/source/ports·protocol/action + menu col `btnIsMenu`) + `NmxBadge` allow=success/deny=error + `NmxMenuButton<"toggle"|"edit"|"delete">` (MENU_VERTICAL trigger, `arrowDisabled`) + delete confirm `NmxAlertDialog`; **rule detail dialog + extraAction edit (thêm Phase 3 — 2026-08-09)**
  - `WardenRuleDialog.tsx` — add/edit rule: name (`confirmDisabled` khi name trống), sourceCidr, ports (**`NmxTagInput`** — thay textarea/input), protocol `NmxSelect`, action `NmxSelect`, enabled `NmxToggle`
- [x] **Frontend controller**: `wardenController.{listRules, createRule, updateRule, deleteRule, toggleRule, getSettings, updateSettings, getStats, listEvents}` — `toggleFirewall`/`setProfile` gộp vào `updateSettings` (backend PUT nhận cả 2); `listEvents` build `Record<string, string|number|boolean>` tường minh (fix TS index signature)
- [x] **Types**: `Warden.types.ts` — `WdFirewallRule`, `WdSecurityEvent`, `WdSettings`, `WdStats`, `WdEventQuery`, enums (`WdRuleAction`/`WdProtocol`/`WdSeverity`/`WdSecurityProfile`) + `WardenErrorCodes` map
- [x] **i18n**: en.json — warden namespace restructure thành **`tabs.*` + `pages.overview.*` / `pages.activity.*` / `pages.rules.*`** (đã đầy đủ); **vi.json — chưa làm (hoãn theo yêu cầu)**
- ⚠️ **Latent bug (chưa fix)**: `WardenOverview.tsx:86` — label firewall toggle dùng key `addon.warden.overview.fields.firewallDisabled` (thiếu `pages.` — fallback render raw key khi firewall tắt); nên đổi thành `addon.warden.pages.overview.fields.firewallDisabled`
- ✅ **Custom profile đã có nơi cấu hình (2026-08-09)**: backend `WdThresholdFactors.For` đọc `CustomThresholdFactor`/`CustomDurationFactor` từ `WdSettings`; frontend hiện 2 `NmxSlider` khi chọn profile Custom (xem "Profile-aware thresholds" Phase 2)

### Addon registry

- [x] `frontend/src/addons/index.ts` — import `./Warden/Warden.addon` (đã có sẵn)
- [x] `frontend/src/addons/Warden/` — dashboard tabs thay scaffold rỗng
- [x] @namorix/ui 0.44.0 — `NmxChipToggle` (role="switch") + `NmxSettingsWrap` + icon `TASK` (dùng `SECURITY`/`ERROR`/`NETWORK`/`STATS`/`ACTIVITY`/`TASK`/`SETTING`; SHIELD/BAN optional, defer)
- [x] @namorix/styles 0.55.0 — `warden.scss` (`__page` + `__setting-row`) + chip-toggle SCSS + icomoon glyph TASK

---

## Phase 1 — Event Publishing (Frontgate → Warden)

### Cơ chế

Internal addon dùng **SignalR group** để nhận event — giống pattern Beacon/Frontgate. Middleware Frontgate publish qua **`WdEventService`** (một nơi duy nhất: ghi `WdSecurityEvents` vào DB bằng `AppDbContext` rồi broadcast `warden:new-event`). Warden subscribe SignalR `warden:new-event` để refresh UI.

### Frontgate side — ✅ hoàn tất (2026-08-09, build pass 0 errors)

- [x] **AcmeChallengeMiddleware**: token không khớp → `PublishAsync(ACME_CHALLENGE_FAIL, Warning, AddonId.Frontgate, RemoteIp, detailJson: {path})`
- [x] **ProxyTrafficMiddleware**: request 404 → `PublishAsync(SCAN_404, Info, AddonId.Frontgate, ip, detailJson: {path})` — debounce bằng static `ConcurrentDictionary<string, DateTime> ScanWindow` (1 event/IP/5 phút, chống flood DB)
- [x] **IoC**: inject `IServiceScopeFactory` vào cả 2 middleware, resolve `WdEventService` per-request từ scope (pattern đã có sẵn trong codebase)
- [x] **AddonId** constant (`Namorix.Core.Constants`) — `Frontgate`/`Auth` làm `SourceAddon` (thay `WdEventSources` gợi ý ban đầu — dùng chung, tránh trùng lặp)

### Warden side — ✅ hoàn tất (2026-08-09)

- [x] **WdEventService**: `PublishAsync(eventType, severity, sourceAddon, sourceIp?, count, detailJson?)` — save DB + notify qua `IWardenNotifier`
- [x] **I WardenNotifier** + **SignalRWardenNotifier**: `warden:new-event` qua `Clients.Group("warden")`, payload `{ id, eventType, severity, sourceAddon, sourceIp, count, timestamp }`
- [x] **MainHub**: `SubscribeWarden()` / `UnsubscribeWarden()` (expression-bodied, mirror Beacon)
- [x] **Frontend**: `WardenActivity` — `useServerSignalRGroup(Warden, true)` + `useServerSignalREvent(WardenNewEvent, () => fetchEvents(page, pageSize))`
- [x] **SignalR constants**: `ServerSignalR.cs` + `frontend signalr/constants.ts` — `Warden` group + `WardenNewEvent` = `"warden:new-event"`
- [x] **Program.cs**: `AddScoped<WdEventService>()` + `AddScoped<IWardenNotifier, SignalRWardenNotifier>()`

---

## Phase 2 — Threshold Logic + Rule Execution — ✅ hoàn tất (2026-08-09)

### Threshold engine — ✅ hoàn tất (2026-08-09, build pass 0 errors)

- [x] **WdThresholdRules** (hardcode `Constants/Warden.cs`): `(Threshold, Lookback, BanDuration)` theo từng event type:
  - `ACME_CHALLENGE_FAIL`: 20/5 phút → deny 1 giờ
  - `SCAN_404`: 10/1 giờ → deny 30 phút *(đổi từ ">50/5ph" — debounce 5 phút khiến count ≤ 1/5ph, ngưỡng 50 bất khả thi)*
  - `BRUTE_FORCE`: 10/5 phút → deny 1 giờ
  - `EXPLOIT_ATTEMPT`: 3/5 phút → deny **30 ngày** *(đổi từ vĩnh viễn — quyết định 2026-08-09, tránh false positive IP CGNAT/NAT dùng chung)*
- [x] **WdThresholdWorker** (`BackgroundService`, loop 10s): load event 60 phút, filter theo lookback từng type, group by `(SourceIp, EventType)`, count > threshold → ban
- [x] **Escalation**: tái phạm trong 24h sau khi tự hết hạn → ban vĩnh viễn (trong `BanAsync`)
- [x] **Auto-deny tạo từ threshold**: insert `WdFirewallRule` (Auto=true, Deny, SourceCidr=ip, `ExpiresAt = now.Add(duration)`) — skip nếu đã có auto-ban active cho IP
- [x] **WdBanCleanupWorker** (`BackgroundService`, loop 30s): ban hết hạn → `Enabled=false` + remove
- [x] **Persistence**: restart → `ReapplyActiveRulesAsync` re-apply active rules nếu FirewallEnabled (giống `RequeueUpdatingAsync` trong Beacon)
- [x] **Program.cs**: `AddHostedService<WdThresholdWorker>()` + `AddHostedService<WdBanCleanupWorker>()`

### Rule execution — ✅ hoàn tất (2026-08-09, build pass 0 errors)

- [x] **WdFirewallService**: `ApplyRuleAsync` / `RemoveRuleAsync` / `ApplyAllAsync` — render rule → **`iptables` thật** qua `Process.Start()` (stub log-only đã thay). Add/remove `DROP` cho IP/source, dùng comment marker `wd:<id>` để remove đúng rule
- [x] **Guard footgun**: rule Deny với `SourceCidr = null` → skip (tránh `iptables -A INPUT -j DROP` chặn toàn bộ traffic)
- [x] **Chain = `INPUT`** (quyết định 2026-08-09): Warden chạy **trong container netns** (bridge, không host network) — traffic published port khi vào tới netns container là traffic local → `INPUT` chặn được. **KHÔNG dùng `DOCKER-USER`** (chỉ đúng khi iptables chạy trên host netns)
- [x] **`ArgumentList` thay string `Arguments`**: mỗi phần tử là 1 argv — fix `Ports = "80, 443"` bị tách vỡ theo space + không còn argument injection qua `SourceCidr`
- [x] **`-w`** chờ xtables lock (tránh fail khi 2 lệnh iptables chạy trùng — worker ban IP đúng lúc resync)
- [x] **Idempotent `-C` → `-I`**: check tồn tại trước khi insert đầu chain (tránh nhân bản rule khi restart/resync; `-D` cũng chỉ chạy nếu tồn tại)
- [x] **Error handling**: đọc stderr, check exit code, log lỗi (không throw — tránh crash worker); case exit 4 / "Permission denied" / "Operation not permitted" → **log warning riêng** gợi ý thiếu NET_ADMIN/seccomp
- [x] **Enforcement feedback (hướng L — quyết định 2026-08-09)**: `ApplyRuleAsync`/`RemoveRuleAsync` → `Task<bool>` (skip-non-deny = `true`, null SourceCidr = `false`); fail không còn nuốt im lặng
- [x] **Rollback khi enforce fail**: `WdThresholdWorker.BanAsync` fail → xóa rule + save (retry tick sau, không phantom rule Enabled); `WdController` create/update/toggle fail → hoàn tác DB + trả `ApiResponse.Fail(WD_ENFORCEMENT_FAILED)` (HTTP 200 + success=false — frontend `if (!data.success) throw` xử lý). **Không dùng field `EnforcementStatus` + badge** — over-engineering cho lỗi deploy-time binary; auto-ban (case đa số) tự hồi phục qua retry, admin-rule thì toast lỗi tức thì
- [x] **TOCTOU fix**: `SemaphoreSlim(1,1)` trong `WdFirewallService` bao **cả cặp check-then-act** (`-C` rồi `-I`/`-D`), không phải trong `ExecAsync` (lock lỏng hơn thì 2 thread vẫn check rồi cùng insert). `-w` giữ cho lock xtables cross-process

### Profile-aware thresholds — ✅ hoàn tất (2026-08-09, backend build 0 errors + migration applied)

- [x] **WdThresholdFactors** (`Constants/Warden.cs`): nhân tử theo profile — `Low` (threshold ×2, duration ×0.5), `Medium` (1.0/1.0), `High` (×0.5, ×2), `Custom` (đọc `WdSettings.CustomThresholdFactor`/`CustomDurationFactor`). **Lookback không scale** — chỉ scale threshold + ban duration
- [x] **WdThresholdRules.For(eventType, thresholdFactor, durationFactor)**: base threshold × factor (`Math.Max(1, round)`), base duration × factor (null duration giữ null)
- [x] **WdSettings**: thêm `CustomThresholdFactor` + `CustomDurationFactor` (double, default 1.0) — migration `AddWdCustomProfileFactors` (2 cột REAL vào `WdSettings`, kèm `SourceIp` nullable trên `WdSecurityEvents`)
- [x] **WdThresholdWorker**: load `WdSettings` → `WdThresholdFactors.For(profile, settings)` → truyền 2 factor vào `For()` cho cả filter lookback lẫn threshold check
- [x] **WdController.UpdateSettings**: `CustomThresholdFactor`/`CustomDurationFactor` optional (`?? existing`) trong `WdSettingsRequest`
- [x] **Frontend `WardenOverview`**: profile `custom` → hiện 2 `NmxSlider` (threshold/duration, min 0.1, max 3, step 0.1, showValue, unit "×") + local `factorValues` state + **debounce 600ms** persist (vì `updateSettings` re-apply toàn bộ iptables rule — không persist mỗi tick slider)
- [x] **i18n**: en.json — `customThresholdFactor`/`customThresholdFactorHint`/`customDurationFactor`/`customDurationFactorHint` (vi.json hoãn theo yêu cầu)

### Deploy requirements (quyết định A — 2026-08-09)

- [x] **`cap_add: NET_ADMIN`** — cả `docker-compose.yml` + `docker-compose.deploy.yml` (chỉ `NET_BIND_SERVICE` ban đầu → iptables fail Permission denied âm thầm)
- [x] **`Dockerfile`**: `apt-get install iptables` (runtime image `aspnet:10.0` không có sẵn binary — không cài thì `Process.Start` throw "No such file or directory")
- ⚠️ **Seccomp**: nếu runtime vẫn báo "Operation not permitted" dù có NET_ADMIN → cần `--security-opt seccomp=unconfined`. **Cân nhắc**: container này đã mount `/var/run/docker.sock` → `seccomp=unconfined` làm rộng attack surface đáng kể — chỉ thêm nếu thật sự bị chặn

### Ghi chú

- ✅ **WdThresholdRules profile-aware (đã xử lý 2026-08-09)**: toggle Low/Medium/High/Custom ảnh hưởng threshold qua `WdThresholdFactors`; Custom đọc override từ `WdSettings.CustomThresholdFactor`/`CustomDurationFactor` — xem mục "Profile-aware thresholds" ở trên
- ✅ **Footgun rule execution** (đã xử lý 2026-08-09): rule Deny với `SourceCidr = null` ("any source") → `ApplyRuleAsync` skip + log warning, không còn rủi ro `iptables -A INPUT -j DROP` chặn toàn bộ traffic

---

## Phase 3 — Management UI (Dashboard) — ✅ hoàn tất (2026-08-09)

> Dashboard đã xây toàn bộ trong **Phase 0 frontend**. Phase này bổ sung: detail dialog + realtime refresh — **xong 2026-08-09**.

- [x] **Firewall master toggle**: `NmxToggle` → `updateSettings({ firewallEnabled })` — **đã xây Phase 0**
- [x] **Hồ sơ bảo mật**: `NmxSegmentedGroup` → `updateSettings({ profile })` — **đã xây Phase 0**
- [x] **Rule CRUD**: `NmxDataTable` + `NmxMenuButton` + `NmxAlertDialog` confirm delete + `WardenRuleDialog` — **đã xây Phase 0**
- [x] **Block log**: `NmxLogList` hiện event recent — **đã xây Phase 0** (dùng `dateTime()`, không "time relative")
- [x] **Block log detail dialog** (2026-08-09): click event trong `NmxLogList` (`onItemClick` → `setSelected`) → dialog **`NmxAlertDialog`** (chọn thay `NmxDialog`; nút đóng error-toned do component hardcode) hiện chi tiết qua **`NmxMetaList`/`NmxMetaItem`** (sourceIp, sourceAddon, severity màu theo `SeveritySemantic`, count, windowStart khi count>1, timestamp, + `detailJson` parse an toàn bằng `JSON.parse`, render từng cặp key/value); i18n `addon.warden.pages.activity.detail.*`
- [x] **Rule detail dialog** (2026-08-09): click row trong `NmxDataTable` (`clickableRows` + `onRowClick` → `setDetailTarget`) → `NmxAlertDialog` info qua **`NmxMetaList`/`NmxMetaItem`** (`alignValue="end"`): name, source, ports·protocol, action (màu theo `ActionSemantic`), status (success/error), type (auto/manual), priority + expiresAt có điều kiện, createdAt; **`extraActionLabel` "Edit rule"** → đóng info rồi mở `WardenRuleDialog` với rule đó; confirm tự ẩn (không `onConfirm`); click menu không mở dialog vì `NmxMenuButton` stopPropagation; i18n `addon.warden.pages.rules.detail.*`
- [x] **Stats realtime** (2026-08-09): `WardenOverview` join group `Warden` + `useServerSignalREvent(WardenNewEvent, fetchStats)` + poll nhẹ 30s qua `setInterval` (bù trường hợp bỏ lỡ event khi tab tắt)

---

## Phase 4 — Herald Integration — ✅ hoàn tất (2026-08-09)

> Khi deny rule được apply/gỡ → `IHeraldNotifier` tạo notification `Warning`/`Info` cho tất cả admin, hiện trong bell + desktop notification. **Xong 2026-08-09.**

- [x] **Contract**: `IHeraldNotifier` (`NotifyRuleAppliedAsync` / `NotifyRuleRemovedAsync`) + impl `HeraldNotifier` (chỉ notify khi `Action == Deny`)
- [x] **Key**: `NotificationKeys.Warden.RuleApplied = "warden:ruleApplied"`, `RuleRemoved = "warden:ruleRemoved"` (camelCase — frontend template `warden.ruleApplied` / `warden.ruleRemoved`)
- [x] **DI**: `AddScoped<IHeraldNotifier, HeraldNotifier>()`; `WdFirewallService` (singleton) resolve qua `IServiceScopeFactory` — không share scoped service qua singleton
- [x] **Hook vào `WdFirewallService`**: `ApplyRuleAsync` / `RemoveRuleAsync` nhận `bool notify = true`; `UpsertRuleAsync` notify chỉ khi **thật sự insert mới** (`Inserted == true`) — tránh spam khi re-sync
- [x] **Không spam khi restart**: `ApplyAllAsync` mặc định `notify = false` — startup re-apply + bật/tắt firewall toàn bộ không bắn notification
- [x] **Call sites**: `WdThresholdWorker` auto-ban → `ApplyRuleAsync(rule, ct: ct)` (notify mặc định true); `WdBanCleanupWorker` hết hạn → `RemoveRuleAsync(rule, ct: ct)` (bắn "removed"); dùng named arg `ct: ct` nên không phụ thuộc thứ tự tham số
- [x] **Frontend**: template notification `warden.ruleApplied` / `warden.ruleRemoved` trong `notification/en.json`; `NOTIFICATION_SOURCE_ICON` có `warden → APP_WARDEN` (bell hiện icon addon)

---

## Verification

1. Bot scan `/.well-known/acme-challenge` → xuất hiện trong Warden Events tab
2. Đủ ngưỡng → deny rule xuất hiện trong bảng + `iptables -L` thấy rule DROP
3. Bấm remove rule → rule biến mất khỏi bảng + iptables rule được xóa
4. Hết hạn ban → tự động gỡ, rule biến mất khỏi bảng
5. Server restart → rules được re-apply
6. Dashboard: 3 stat card hiển thị đúng (active rules / blocked today / open ports), toggle firewall on/off apply toàn bộ
7. Herald: tạo deny rule mới → bell + desktop hiện "IP ... has been blocked"; gỡ rule → "IP ... is unblocked"; restart server → **không** bắn notification hàng loạt
