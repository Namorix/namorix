# Beacon — DDNS Updater Architecture Plan

## Overview

**Beacon** là addon core của Namorix, tự động cập nhật DNS record trỏ về public IP hiện tại của mạng (chức năng DDNS kiểu Synology DSM). Đứng cùng nhóm với Frontgate (Beacon báo "nhà đang ở IP nào", Frontgate mở cổng đón vào).

**Kiến trúc provider chia 2 nhóm:**
- **Simple GET** (1 URL, response text OK/KO): No-IP, DuckDNS, Dynu, Namecheap
- **REST JSON** (lookup record_id trước, sau đó PATCH/PUT JSON): Cloudflare, GoDaddy
- **Custom provider**: user tự khai báo URL template (Simple GET) hoặc endpoint + method + auth + body template (REST/JSON), có nút "Test connection"

→ Interface `IBcnProviderClient` + 2 implementation chung (`SimpleGetProvider` cấu hình bằng URL template, `RestJsonProvider` kiểu Cloudflare), thêm provider built-in mới chỉ cần khai báo template thay vì code mới.

## Current State

### Frontend scaffold (đã có sẵn)
- [x] `NmxAddonId.beacon` + `NmxAddonLocaleKeys.beacon` (`frontend/src/addons/types.ts`)
- [x] `Beacon.addon.tsx` — register addon: name "Beacon", desc "Updates your DNS when your IP changes", icon `APP_BEACON`, đã bỏ `defaultWidth/Height` (dùng window size mặc định)
- [x] `Beacon.tsx` — **đã dựng nav `NmxRail` 3 tab** (hostnames/activity/settings), content 3 view đang là placeholder
- [x] `BeaconHostnames.tsx` / `BeaconActivity.tsx` / `BeaconSettings.tsx` — đã tạo, **đang rỗng** (`<></>`)
- [x] `app-beacon.svg` + CSS var `--nmx-icon-app-beacon`
- [x] en.json block `"beacon"` (cấu trúc đầy đủ; audit 2026-08-03 chi tiết ở Frontend UI)
- [x] `NmxIconFont.types.ts` thêm icon `HOSTNAME` + `ACTIVITY` (`SLIDERS` đã có)
- [x] **Thay đổi chung `@namorix/ui` + `@namorix/styles`**: `NmxRailList` thêm prop `footer?: React.ReactNode`, render `.nmx-rail__footer` làm sibling bên dưới `.nmx-rail-list__items` (`margin-top: auto`, ẩn khi collapsed)

### Backend — Phase 0 + 1 + 2 + 3 (đã xong, build 0 error 0 warning)
- [x] Models: `BcnHostname`, `BcnSettings`, `BcnActivityLog`, `BcnProviderConfig`, `BcnProviderInfo` (+ enum `BcnCredentialFieldType`) + migration `20260803014256_AddBcnTables` + DbSet trong `AppDbContext`
- [x] Provider engine **Strategy + Registry**: `IBcnProviderClient` (`Infrastructure/`) + `BcnGetProviderBase` (abstract, GET-style) + 6 provider class (`NoIpProvider`, `DuckDnsProvider`, `DynuProvider`, `NamecheapProvider`, `CloudflareProvider`, `GoDaddyProvider`) + `BcnProviderRegistry` (DI `IEnumerable<IBcnProviderClient>`)
- [x] `BcnErrorCodes` (`Namorix.Server/Constants/BcnErrorCodes.cs`) + `BcnHttpStatus.ToErrorCode` (401/403→`InvalidCredentials`, 404→`HostnameNotFound`, _→`ProviderError`)
- [x] `ApiResponse` thêm field `Params` (generic dict) — provider trả `(Code, Params)` thay string message; `Params` chứa `zone`/`hostname`/`httpStatus` cho frontend i18n interpolation. `Meta` giữ nguyên cho validation
- [x] DI: `AddBcnProviders()` extension + đăng ký trong `Program.cs`
- [x] Custom provider engine (`BcnSimpleGetProvider`/`BcnRestJsonProvider` từ `BcnProviderConfig` template + `BcnTemplate` + `BcnProviderResolver`)
- [x] `BcnCheckWorker` (BackgroundService, đăng ký `AddHostedService` trong `Program.cs:108`) — loop `Task.Delay` theo `CheckIntervalMinutes` (default 15), detect IP → IP không đổi thì skip từng host → `resolver.Resolve(...).UpdateAsync(...)` → ghi activity log; `BcnHostname` chuyển field mutable sang `get; set;` (không cần migration — cột giữ nguyên)
- [x] Backoff khi rate-limit (ưu tiên `Retry-After`, fallback exponential gấp đôi, cap 24h) — hostname bị backoff bị filter khỏi vòng lặp (`.Where(h => h.BackoffUntil == null || h.BackoffUntil <= now)`); rate-limit **không đổi status** (giữ `Active`); lỗi vĩnh viễn → status `Error` + `DescribeError` (code + HTTP status); hostname `Disabled` bị skip (`.Where(h => h.Status != Disabled)`) — status model `active|disabled|error`
- [x] Activity log structured `Code`+`ParamsJson` (bỏ `Message`) — `BcnActivityCodes.Updated` (`BCN_UPDATED`), provider/error codes từ `BcnErrorCodes`, params JSON cho FE i18n; migration `20260803034107_AddBcnActivityLogCodeParams`
- [x] Pruning worker `BcnActivityCleanupWorker` (`PeriodicTimer` 6h, `ExecuteDeleteAsync` xóa log quá `RetentionDays = 7` ngày, đăng ký `Program.cs:109`)
- [x] `BcnController` (`api/beacon`, `[RequireAdmin]`) — hostnames CRUD + **toggle** (flip active↔disabled) + test + activity + providers + settings + status (`healthy` đếm `Active`); validation schemas `BcnHostnameSchema`/`BcnHostnameTestSchema`/`BcnSettingsSchema`
- [x] **Out-of-band drift detection + heartbeat (2026-08-05)** — verify record thật qua **authoritative DNS** (`AuthoritativeDnsResolver` + DnsClient.NET 1.8.0) provider-agnostic, **thay hẳn `GetCurrentAsync` REST per-provider**; refresh resolve `host.Domain` trực tiếp (đã bỏ `GetDomain` — Phase 8); DNS fail → stored fallback + heartbeat force-push theo `HeartbeatIntervalHours`; chi tiết Phase 6
- [x] **Refresh/probe + Clear activity (2026-08-05)** — `POST /api/beacon/refresh` + `BcnProbeQueue` probe IP từ provider → persist `CurrentIpv4/6` → worker self-heal cycle sau; `DELETE /api/beacon/activity` clear log; `BCN_PROBED` i18n; chi tiết Phase 7
- [x] **HostIsDomain + provider error param end-to-end (2026-08-05)** — provider record name == FQDN luôn (No-IP) khai `BcnProviderInfo.HostIsDomain = true`; controller derive `hostValue = domain`; FE ẩn host field + collapse `hostnameLabel`/activity label; `WithProvider` + `firstFailure` enrich → check/retry toast + activity log có tên provider; `renderBeaconCodeMessage` dùng chung formatBeaconError + check toast; chi tiết Phase 10
- [x] **Provider error detail + notification/activity interpolation + toggle enable + DisplayName collapse (2026-08-05)** — Namecheap `<Err1>` extract + NoIp `reason` mọi nhánh error + `bcnErrorDetail`/`DescribeDetail` 3-tier (`detail → httpStatus>0 → reason`); notification renderer translate provider/hostname/detail + thêm `return t(...)` (hết raw `BCN_PROVIDER_ERROR`); `firstFailure` enrich thêm `WithTag` (activity hết literal `{{hostname}}`); toggle Enable → `Updating` + enqueue (chạy update thật qua queue); `DisplayName` collapse backend (`Host == Domain ? Domain : …`); chi tiết Phase 11
- [x] **Multi-host chuyển xuống provider + token-match classify + constants consolidation + FE hints (2026-08-05)** — `BcnHostnameService` bỏ split, truyền `host.Host` (full comma string) cho provider tự xử lý; Cloudflare/GoDaddy split+loop per tag, **DuckDNS batch 1 request** (API nhận comma list — docs chính thức), **Namecheap split+loop per host** (docs chính thức mỗi request 1 giá trị `host=`, không nhận gộp); schema Host relax `*.suffix`; Dynu/NoIp classify token-match (`good <ip>`/`nochg <ip>` success, Dynu `notfqdn`→HostnameNotFound + `servererror`→Unavailable); `BcnParam`/`BcnCredentialParam`/`BcnHttpClientNames`/`BcnHeaderKey` constants thay hết hardcode; FE `hostHint`/`domainHint` (NmxFormField `helper`); chi tiết Phase 12
- [x] **SignalR realtime CRUD hostname (2026-08-08)** — event `beacon:hostname-changed` (created/updated/deleted) push từ `BcnController` sau mọi CRUD; FE đóng dialog edit + toast khi hostname đang mở bị xóa ngoài, refetch mọi thay đổi; fix `fetchHosts` detached-`.finally()` (giống frontgate); chi tiết Phase 13

### UI mock
- Mock `beacon-ddns-mock.jsx` (React + Tailwind + lucide-react) style Synology DSM: sidebar Hostnames/Activity/Settings, bảng hostname với status dot ping + provider badge monogram, modal Add hostname với lưới provider card + form động, custom provider toggle Simple GET / REST-JSON, Settings (interval, IP detection, IPv6 toggle).
- **Cần convert từ Tailwind → Nmx tokens + `@namorix/ui`** (NmxDataTable, NmxAlertDialog, NmxSelect, NmxToggle, NmxIcon...), không giữ Tailwind.

## Architecture

### Provider client interface

```csharp
public interface IBcnProviderClient
{
    BcnProviderInfo Info { get; }
    Task<BcnUpdateResult> UpdateAsync(
        string host, string domain, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6, CancellationToken ct);

    Task<BcnTestResult> TestAsync(
        string host, string domain, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6, CancellationToken ct);
}

// KHÔNG có GetDomain, KHÔNG có BcnFqdn.Build — domain là FQDN chuẩn dùng thẳng
// cho authoritative DNS refresh; host là tag (đơn) dùng cho update provider.

public record BcnUpdateResult(bool Success, string? Code = null,
    Dictionary<string, object?>? Params = null,
    bool RateLimited = false, DateTimeOffset? RetryAfter = null);
public record BcnTestResult(bool Success, string? Code = null,
    Dictionary<string, object?>? Params = null);

public record BcnCurrentRecord(string? Ipv4 = null, string? Ipv6 = null)
{
    public bool HasAny => Ipv4 is not null || Ipv6 is not null;
    public bool Matches(string? ipv4, string? ipv6) => Ipv4 == ipv4 && Ipv6 == ipv6;
}
```

**Out-of-band drift detection (2026-08-05, chốt authoritative DNS):** refresh resolve **`host.Domain` trực tiếp** — **không `GetDomain`, không `BcnFqdn.Build`** (Phase 8). Service query **trực tiếp authoritative nameserver** qua `AuthoritativeDnsResolver.ResolveAsync(domain, ct)` (DnsClient.NET 1.8.0): bootstrap NS lookup `NameServer.GooglePublicDns`, strip label dần tìm NS authoritative (hỗ trợ `.co.uk`), query A + AAAA thẳng tới IP NS với `UseCache = false`. `null` = không resolve được. **Provider-agnostic, không cần credential read API — thay hẳn `GetCurrentAsync` REST per-provider.**

**Lỗi contract — chỉ code + params, không có message string:**
- `Code` = error code UPPER_SNAKE từ `BcnErrorCodes` (BCN_NO_IP, BCN_INVALID_CREDENTIALS, BCN_HOSTNAME_NOT_FOUND, BCN_ZONE_NOT_FOUND, BCN_ACCOUNT_BLOCKED, BCN_UNAVAILABLE, BCN_RATE_LIMITED, BCN_PROVIDER_ERROR) — frontend map sang i18n key qua `formatCustomError`.
- `Params` = `Dictionary<string, object?>` chứa tham số cho i18n interpolation (`zone`, `hostname`, `httpStatus`) — phải truyền đủ, không bỏ sót, để frontend tự locale variable.
- `ApiResponse` thêm field additive `Params` (kệ `Meta`/`ValidationMeta` cũ), controller truyền thẳng `Params` từ result lên response.

### Config validation — field-level (2026-08-03)

`BcnErrorCodes.ConfigInvalid = "BCN_CONFIG_INVALID"` (bỏ message, trả `Params["field"]` = tên field). Config thiếu field bắt buộc bị chặn ở **2 lớp**:

**1. Runtime guard (provider) — chạy khi update/test thật:**
- `BcnSimpleGetProvider`: `UrlTemplate` rỗng → `(false, ConfigInvalid, {field:"urlTemplate"})`; `AuthType=="basic"` mà thiếu `User`/`Password` → `(false, ConfigInvalid, {field:"user"})`.
- `BcnRestJsonProvider`: `EndpointTemplate` rỗng → `{field:"endpointTemplate"}`; endpoint chứa `{recordId}` mà thiếu `RecordLookupTemplate` → `{field:"recordLookupTemplate"}`.

**2. Save-time guard (controller) — `BcnController.ValidateConfig` ở Create/Update (chặn từ lúc lưu):**
- Provider built-in (match `BcnProviderRegistry`): loop `Info.CredentialFields` với `Required==true`, check qua `GetConfigValue` mapping (`token→Token, username→User, password→Password, apiToken→ApiToken, apiKey→ApiKey, apiSecret→ApiSecret, zone→Zone`); thiếu → return `field.Key`.
- Custom (không match registry): check theo `Kind` — Get: `UrlTemplate` (+ basic auth `User`/`Password`); Rest: `EndpointTemplate` (+ `RecordLookupTemplate` nếu endpoint chứa `{recordId}`).
- Controller trả `400 BadRequest ApiResponse.Fail(ConfigInvalid, null, field)` → `data.field` → `ApiError.field` → frontend inject tên field.

`BcnProviderConfig` là JSON blob (điền field theo kind), deserialize trong client:
- **Get**: `UrlTemplate`, `AuthType` (None/HttpBasic/QueryParam), `User`, `Password`/`Token`, `SuccessMatch` (contains "OK" / HTTP 200 / custom regex). Placeholders: `{host} {domain} {ip} {ipv6} {token} {user} {password}` (bỏ `{hostname}` — Phase 8).
- **Rest**: `ApiToken` (hoặc key+secret), `Zone`, `Method` (PATCH/PUT/POST), `BodyTemplate` (JSON, `{ip}`), `SuccessPath` (JSON pointer truthy), `RecordId` (cache sau lookup lần đầu).
- **Custom**: `Label` + một trong 2 cấu hình trên theo `Kind`.

### Built-in provider catalog

Provider built-in là **class riêng** (Strategy + Registry), mỗi provider 1 class — không phải static catalog kiểu `DnsProviders.cs` như Frontgate. Class GET-style kế thừa `BcnGetProviderBase` (abstract, xử lý chung request/reponse + classify), class REST (Cloudflare/GoDaddy) implement trực tiếp `IBcnProviderClient`. `BcnProviderRegistry` resolve theo `Info.Id` từ `IEnumerable<IBcnProviderClient>` DI.

`BcnProviderInfo`: `id`, `name`, `initials` (monogram), `accent` (màu badge), `kind` (`BcnProviderKind`), `credentialFields` (list `BcnCredentialField` kiểu `DnsCredentialField`), `tested` (bool — provider đã test thật, DuckDNS = `true`).

**`Kind` trả từ API (2026-08-03)** — `BcnProviderInfo` thêm field `kind`, FE bỏ map `PROVIDER_KIND` hardcode; `handleProviderChange` đọc `kind` từ `providers.find((p) => p.id === id)?.kind`. `BcnProviderKind.Custom` là enum member chết (validation chỉ nhận `get`/`rest`; custom = providerId `custom` + kind get/rest). Credential **label → locale** (`fieldLabel` helper + `credentialFields.*`), `CRED_FIELD_TO_CONFIG` giữ cho storage mapping (`username→user` là mapping non-identity duy nhất).

| id | name | kind | initials | credential fields |
|----|------|------|----------|-------------------|
| cloudflare | Cloudflare | rest | CF | API token, Zone |
| godaddy | GoDaddy | rest | GD | API key, API secret |
| noip | No-IP | get | NI | username, password |
| namecheap | Namecheap | get | NC | password |
| duckdns | DuckDNS | get | DD | token |
| dynu | Dynu | get | DY | token |
| custom | Custom | get/rest | — | user-defined |

Provider **built-in chỉ là template** (URL + success-match + field layout) — credential nhập mỗi hostname. RestJsonProvider lookup record_id một lần rồi cache (mock: "looks up the record ID once"), update lại khi IP đổi; nếu update trả về "not found" → lookup lại.

**Drift read — authoritative DNS (2026-08-05, thay read API per-provider):** mọi provider verify record thật bằng DNS query tới authoritative NS (`AuthoritativeDnsResolver.ResolveAsync(host.Domain)` — `GetDomain`/`BcnFqdn` đã bỏ ở Phase 8), không cần credential phụ. Query fail (`null`) → fallback stored + heartbeat force-push. `GetCurrentAsync` đã xóa khỏi interface + DuckDNS/Cloudflare/GoDaddy.

### Update loop (worker)

Logic per-hostname (skip IP unchanged, backoff, notification, activity log) nằm **duy nhất** trong `BcnHostnameService.UpdateHostAsync(host, ipv4, ipv6, force, ct)` (scoped, shared giữa worker + controller check manual). `BcnCheckWorker : BackgroundService` (pattern `SystemMonitorStatsWorker`, timer `Task.Delay`) chỉ còn là orchestrator — resolve service từ scope rồi delegate, mỗi `CheckInterval`:
1. Detect public IPv4 (+ IPv6 nếu bật) — Auto (mặc định ipify.org) / ipify.org.
2. Bỏ qua hostname `Disabled` (filter `.Where(h => h.Status != Disabled)`).
3. `force=false` → service **verify record thật qua authoritative DNS** trước khi skip (2026-08-05; bổ sung hardening 2026-08-05):
   - `TryGetCurrentAsync(host.Domain)` = `AuthoritativeDnsResolver.ResolveAsync(domain)` → `current.Matches(ipDetected)`? in-sync → skip; lệch → push (bắt out-of-band change).
   - Resolve fail (`null`) → so stored IP (đã null khi Error — không pass bằng IP cũ).
   - **Skip guard (2026-08-05):** `if (!force && host.Status != Error)` — host đang `Error` **luôn push** (không skip), host/provider sai không tự nhảy Active.
   - **Heartbeat độc lập `current is null` (2026-08-05):** `heartbeatDue = await IsHeartbeatDueAsync(...)` — in-sync mà quá `HeartbeatIntervalHours` chưa push → **force-push** kể cả khi DNS resolve OK (chống DDNS provider hết hạn record — no-ip 30 ngày).
4. Mỗi hostname: build client theo kind → `UpdateAsync`.
5. Thành công → status `Active`, cập nhật `CurrentIp`, `LastUpdatedAt`, log Activity.
6. Rate-limited (429 / "rate limited" trong response) → **không đổi status** (giữ `Active`), chỉ set `BackoffUntil` (exponential, ưu tiên `Retry-After`).
7. Lỗi vĩnh viễn (401/403/400 auth, "badagent"/"nohost"...) → status `Error`, ghi lỗi chi tiết.
8. Public IP detection fail → skip cả vòng, không log spam.

`force=true` (controller check manual) bypass bước 3 — user chủ động bấm Retry/Update thì chạy kể cả IP không đổi.

### Hostname status — `active | disabled | error` (chốt 2026-08-03)

| State | Ý nghĩa | Worker |
|-------|---------|--------|
| `active` | Đang được duy trì, update thành công | set khi update OK |
| `disabled` | User tắt hostname (manual) | **bỏ qua** ở filter đầu vòng |
| `error` | Lỗi vĩnh viễn (auth/notfound) | set khi lỗi vĩnh viễn |

- **Bỏ `warn`**: rate-limit/backoff **không đổi status** — hostname vẫn `active`, chỉ set `BackoffUntil` để delay lần retry.
- Toggle manual: `POST /api/beacon/hostnames/{id}/toggle` flip `active`↔`disabled`.
- Enum `BcnHostnameStatus` rename `{Ok,Warn,Error}` → `{Active,Disabled,Error}` — column TEXT (`HasConversion<string>`) nên không đổi schema; migration `20260803075608_RenameBcnHostnameStatus` (rỗng, đã apply) + **pending** `MapOldBcnHostnameStatus` (SQL `UPDATE ... SET Status='Active' WHERE Status IN ('Ok','Warn')`).
- FE: badge active→success, disabled→trace/default, error→error; actions column `NmxMenuButton` (Enable/Disable dynamic theo status + Delete).

## Entity Design

Naming: **`Bcn` prefix** cho entity (BcnHostname...), route `/api/beacon`, controller `BcnController` — nhất quán với Frontgate (`Fg` = addon initialism). *(Đã chốt 2026-08-03.)*

```
BcnHostname
  Id            string (Guid N)         — như FgCertificate.Id
  Host          string                  — "izerocs" | "@,www" | "*" (comma-separated tags)
  Domain        string                  — "izerocs.duckdns.org" | "izerocs.space" (FQDN chuẩn dùng thẳng cho refresh)
  ProviderId    string                  — "cloudflare" | "custom"
  Kind          BcnProviderKind        — Get | Rest | Custom
  ConfigJson    string                  — credential + template (JSON, kiểu AdditionalHeadersJson)
  Status        BcnHostnameStatus      — Active | Disabled | Error
  CurrentIpv4   string?
  CurrentIpv6   string?
  LastCheckedAt DateTime?
  LastUpdatedAt DateTime?
  LastError     string?
  BackoffUntil  DateTime?               — rate-limit backoff
  CreatedAt     DateTime

BcnSettings (singleton row)
  Id                    int (luôn = 1)
  CheckIntervalMinutes  int   — 1/5/15/30/45/60/90
  HeartbeatIntervalHours int  — 1/3/6/12/24 (2026-08-05)
  IpDetectionService    string — "auto" | "ipify.org"
  UpdateIpv6            bool

BcnActivityLog
  Id          int (auto-increment)
  Timestamp   DateTime
  Level       BcnLogLevel     — Info | Warn | Error
  Code        string?         — UPPER_SNAKE activity/error code (BCN_UPDATED, BCN_RATE_LIMITED...)
  ParamsJson  string?         — JSON params cho FE i18n interpolation (ip, retryAt, zone...)
  HostnameId  string?         — nullable, FK SetNull khi xóa hostname
  Hostname    BcnHostname?    — nav: DTO trả kèm `host` + `domain` text để FE hiển thị
```

- Custom provider **lưu inline trong `ConfigJson` của hostname** (mỗi hostname 1 config custom), không tách bảng riêng — khớp mock (custom là 1 provider kind trong grid). Nếu sau này cần tái dùng → tách `BcnCustomProvider` + FK.
- Activity log cần pruning (pattern `NotificationCleanupWorker`) — không để lớn vô hạn.

## API Endpoints (BcnController)

| Method | Route | Chức năng |
|--------|-------|-----------|
| GET | `/api/beacon/hostnames?page&size` | list paginated |
| POST | `/api/beacon/hostnames` | tạo (validate schema) |
| PUT | `/api/beacon/hostnames/{id}` | cập nhật credential/config (+ reset `CurrentIpv4/6` = null khi đổi host/domain — 2026-08-05) |
| DELETE | `/api/beacon/hostnames/{id}` | xóa |
| POST | `/api/beacon/hostnames/{id}/toggle` | flip `active` ↔ `disabled` (manual) |
| POST | `/api/beacon/hostnames/{id}/check` | **Retry/Update** manual — detect IP theo `settings.UpdateIpv6` → `UpdateHostAsync(force: true)` → `{success, code, params}` (params passthrough `result.Params` — reason/httpStatus; NoIp nếu detect fail) |
| POST | `/api/beacon/hostnames/test` | **Test connection** — test config form (chưa save) bằng public IP hiện tại; `TestProviderRequest` kèm `Host` + `Domain`, test dùng host từ form (fallback `@` + `example.com` nếu trống) |
| GET | `/api/beacon/activity?page&size` | activity log paginated |
| DELETE | `/api/beacon/activity` | clear toàn bộ activity log (bulk `ExecuteDeleteAsync`, trả `{deleted}`) |
| POST | `/api/beacon/refresh` | probe tất cả hostname từ provider (authoritative DNS) → persist IP, worker tự sửa |
| GET | `/api/beacon/providers` | built-in catalog (kiểu `/api/frontgate/dns-providers`) |
| GET | `/api/beacon/settings` | đọc settings |
| PUT | `/api/beacon/settings` | cập nhật settings |
| GET | `/api/beacon/status` | last check + healthy count (sidebar footer) |

Tất cả `[RequireAdmin]`. Validation bằng `IValidationSchema` + `[Validate]` (hostname format regex, kind enum, config JSON parse).

## Frontend UI

Convert mock Tailwind → Nmx. Cấu trúc:

- **`Beacon.tsx`** ✅: `NmxAddonRoot` + `NmxRail<BeaconTab>` (nav 3 tab hostnames/activity/settings, icon HOSTNAME/ACTIVITY/SLIDERS) + `NmxRailContent` cho từng view. Footer healthy-status "x/y healthy · Last check" sẽ truyền qua `footer` prop của `NmxRailList` (i18n key `addon.beacon.nav.*` đã có, chưa render).
- **`BeaconHostnames.tsx`**: `NmxDataTable` — cột Status (`NmxBadge` semantic theo `active`/`disabled`/`error`/`updating`) / Host (tags) + Domain (mono, sub-line hiện IP hiện tại) / Provider (badge màu) / actions = `NmxMenuButton` (**Check**/Retry theo status + Enable/Disable dynamic + Delete, hover reveal; disable khi `busyRowId === row.id`). Toolbar `NmxAlign` + Add/Refresh.
- **Add hostname modal — gộp inline trong `BeaconHostnames.tsx`** (`NmxAlertDialog`), không tách file `BeaconAddHostnameModal.tsx`: lưới provider card (6 + Custom, monogram màu, selected ring) → form động theo kind:
  - get: Domain, Host (`NmxTagInput` multi), token/password, note "single signed GET, no record lookup"
  - rest: Domain, Host (`NmxTagInput` multi), API token, Zone, note "record ID lookup once, then REST update"
  - custom: Domain, Host (`NmxTagInput` multi), Provider label, toggle **Simple GET / REST-JSON**, field tương ứng, nút **Test connection** → POST test → hiện success/error inline
- **`BeaconActivity.tsx`**: `NmxLogList` (composite mới, SCSS `log-list.scss`) — mỗi entry: time (mono, muted) + message color semantic (info→default, warn→warning, error→error); `fallbackConditions` (loading/error/empty, dùng type chung `NmxFallback`) + toolbar **Clear** (NmxAlertDialog confirm + `clearActivity()`) + **Refresh**. **Cột level đã bỏ hẳn** → hết bug header `[object Object]`, không cần key `activity.level`. Realtime: `useServerSignalREvent(BeaconActivityCreated)` refetch khi có log mới. Refresh-on-open đã fix bằng `useActiveTab()` gate (`activeTab !== "activity"` → return; refetch mỗi khi tab active) + subscribe cả 2 beacon events. Warning `No client method ... beacon:activity-created` đã fix (BeaconActivity tự register handler khi mount).
- **`BeaconSettings.tsx`**: Check interval (NmxSelect), IP detection service (NmxSelect), IPv6 toggle (NmxToggle).
- **`beacon.controller.ts`** + `ApiBeaconRoutes` (core/apiRoutes.ts).

**en.json `addon.beacon` audit (2026-08-03):**
- Sửa prefix `addon.` trong `BeaconErrorCodes`/`BeaconActivityCodes` (trước thiếu `addon.` → không translate).
- Đã thêm: `hostnames.status.{active,disabled,error}`, `hostnames.actions.{enable,disable,delete}`, `hostnames.feedback.{enableSuccess,disableSuccess,toggleError}`, `addDialog.editTitle`, `addDialog.credentialFields.*`, `activity.refresh`.
- Đã bỏ: `hostnames.title`, `hostnames.subtitle`, `hostnames.actions.edit`, `settings.title`. Đổi `status.{ok,warn}` → `{active,disabled}`.
- **Chưa dùng (2026-08-05)**: `nav.healthy`, `nav.lastCheck` (footer `NmxRail` chưa render — pending). Đã xóa khỏi en.json: `addDialog.empty`, `addDialog.authType` + 11 keys di tích custom-provider editor (getMethod, restMethod, providerLabel, providerLabelHint, providerLabelPlaceholder, simpleGetDesc, restJsonDesc, authBearer, authCustomHeader, credential, cancel).
- **Quyết định: KHÔNG thêm key `activity.level`** — header cột level `BeaconActivity.tsx` (trước render `[object Object]`) **đã resolve bằng cách bỏ hẳn cột level** (chuyển sang `NmxLogList`), không tạo i18n key mới. Kéo theo `activity.title` + `activity.levels.{info,warn,error}` thành thừa — pending xóa.

**Error handling config field (2026-08-03):**
- `BeaconErrorCodes.BCN_CONFIG_INVALID` → `addon.beacon.errors.configInvalid` = "Missing required config field: {{field}}".
- `formatBeaconError(err)` (Beacon-local, không đụng core `formatCustomError`): nếu `err.code === "BCN_CONFIG_INVALID"` → `t(configInvalid, { field: t(configFields.${err.field}, { defaultValue: err.field }) })`; còn lại delegate `formatCustomError`. Dùng ở catch của `handleConfirm`.
- `configFields` map (en.json:659): `urlTemplate/endpointTemplate/recordLookupTemplate/token/username/password/apiToken/apiKey/apiSecret/zone` → label đẹp; key không có trong map → fallback raw (`user` từ basic auth chưa có).
- `missingField` pre-check trong `handleConfirm`: provider built-in + field `required` còn rỗng → toast `configInvalid` trước khi submit (không cần chờ backend).
- `CRED_FIELD_TO_CONFIG` (credential key → config JSON key): `username→user` là mapping non-identity duy nhất, còn lại identity.
- `fieldLabel` (lookup `credentialFields.*`) khai báo **trước** `handleConfirm` — fix TDZ "Cannot access variable before it is declared" (deps array evaluate eager lúc render).
- Custom provider editor: authOptions chỉ còn `none | basic` (đã bỏ `query` — Option A).

**UI primitives**: `NmxAlign` (Layouts/) + `NmxLogList` (Components/, `NmxLogEntry` + `fallbackConditions`) đã thêm. `NmxFallback` (shared type, `types/base.ts`) thay cho `NmxDataTableFallback` — NmxDataTable + NmxLogList cùng dùng; **rename đang dở**: 6 addon còn import `NmxDataTableFallback` (không còn export từ `@namorix/ui`) — cần đổi sang `NmxFallback`. `NmxSectionHeader` (rename từ `NmxToolbarHeading`) vẫn đang plan — chưa có trong repo.

## Phases

### Phase 0 — Schema ✅ (đã xong)
- [x] Quyết định naming → **`Bcn` + `/api/beacon`**
- [x] Models: `BcnHostname`, `BcnSettings`, `BcnActivityLog`, `BcnProviderConfig`, `BcnProviderInfo` + enums (`BcnCredentialFieldType`)
- [x] Migration `20260803014256_AddBcnTables` + DbContext DbSets

### Phase 1 — Provider engine ✅ (đã xong)
- [x] `IBcnProviderClient` + `BcnGetProviderBase` + 6 provider class (NoIp/DuckDns/Dynu/Namecheap GET-style, Cloudflare/GoDaddy REST) + `BcnProviderRegistry`
- [x] `BcnErrorCodes` + `BcnHttpStatus.ToErrorCode` — provider trả `(Code, Params)`, `ApiResponse.Params` additive field
- [x] Test connection logic (`TestAsync` per provider)
- [x] `AddBcnProviders()` DI extension (`BcnProviderServiceCollectionExtensions`) + đăng ký trong `Program.cs` — 6 provider + `BcnProviderRegistry` + HttpClient `BcnGet`/`BcnRest`
- [x] Custom provider engine: `BcnSimpleGetProvider`/`BcnRestJsonProvider` (config-driven từ `BcnProviderConfig` template) + `BcnTemplate` (replace placeholder) + `BcnProviderResolver` (built-in → registry, custom → theo `Kind`)

### Phase 2 — Worker + update loop ✅ (đã xong)
- [x] Public IP detection: `IPublicIpDetector` (`Infrastructure/`) + `PublicIpService` (`Services/`, `auto`/`ipify.org`, IPv4+IPv6 song song, service fail → skip) + DI `AddHttpClient("PublicIp")` (timeout 10s + User-Agent)
- [x] `BcnCheckWorker` (BackgroundService, interval từ `BcnSettings.CheckIntervalMinutes`, detect IP → skip host khi IP không đổi → update qua resolver; `BcnHostname` settable, đăng ký `AddHostedService`)
- [x] Backoff khi rate-limit (`Retry-After` ưu tiên, fallback exponential gấp đôi cap 24h; hostname bị backoff bị filter) + phân loại lỗi vĩnh viễn (`DescribeError` code + HTTP status)
- [x] Activity log ghi structured `Code`+`ParamsJson` (`BCN_UPDATED`/`BCN_RATE_LIMITED`/provider codes — FE tự i18n), migration `AddBcnActivityLogCodeParams`
- [x] Pruning worker `BcnActivityCleanupWorker` (`PeriodicTimer` 6h, `ExecuteDeleteAsync` xóa log quá `RetentionDays = 7` ngày, pattern `NotificationCleanupWorker`, đăng ký `Program.cs:109`)

### Phase 3 — API ✅ (đã xong, build 0 error 0 warning)
- [x] `BcnController` (`api/beacon`, `[RequireAdmin]`) — hostnames CRUD + `/test` (detect IP public → `TestAsync` → `{success, code, params}`) + activity (trả kèm `hostname` text qua nav) + providers (`registry.Infos`) + settings + status (`{total, healthy, lastCheck}`)
- [x] Validation schemas `BcnHostnameSchema`/`BcnHostnameTestSchema`/`BcnSettingsSchema` — resolve bằng `Activator.CreateInstance` (không cần DI); `Kind` chỉ `get`/`rest` (custom = providerId `custom` + kind get/rest)
- [x] Config validation 2 lớp: runtime guard (provider: UrlTemplate/basic creds/EndpointTemplate/recordLookupTemplate) + save-time `ValidateConfig` (controller: built-in qua registry CredentialFields, custom theo Kind) → `BCN_CONFIG_INVALID` + `ApiResponse.Fail(..., field)`
- [x] `BcnSettings` + `BcnHostname` đổi field cập nhật được sang `set` (check interval/IP service/IPv6, hostname/providerId/kind/configJson)

### Phase 4 — Frontend UI ✅ (đã xong)
- [x] `Beacon.tsx` nav (NmxRail 3 tab) + scaffold 3 views + en.json keys + `NmxRailList` footer slot
- [x] Hostnames table (NmxDataTable + status `NmxBadge` + provider badge + actions `NmxMenuButton` enable/disable/delete) — `BeaconHostnames.tsx`
- [x] Toggle hostname `POST /hostnames/{id}/toggle` (controller + controller FE + `NmxMenuButton`) — status model `active|disabled|error` (bỏ `warn`)
- [x] Add hostname modal (provider grid + form động + custom toggle + Test connection) — gộp inline trong `BeaconHostnames.tsx`
- [x] Activity + Settings views — `BeaconActivity.tsx` / `BeaconSettings.tsx`
- [x] `beacon.controller.ts` + `ApiBeaconRoutes`
- [x] Error i18n + pre-check: `configInvalid` + `configFields` map + `formatBeaconError` + `missingField` guard trong `handleConfirm` + `fieldLabel` (TDZ fix) + authOptions bỏ `query`

### Phase 5 — Polish
- [x] IPv6 AAAA update khi provider hỗ trợ — **opt-in qua global `UpdateIpv6`** (đã có, default `false`, vì ISP có thể không hỗ trợ v6). Backend: `BcnTemplate` flip `{ip}` = `ipv4 ?? ipv6` (trước `ipv6 ?? ipv4` — tránh template custom bị gửi v6 sai record A); GET providers `BuildUrl` thêm param v6 khi có (`DuckDns` `&ipv6=`, `NoIp` `&myipv6=`, `Dynu` `&myipv6=`; `Namecheap` giữ v4-only); REST providers update **cả A + AAAA** khi cả 2 IP có (GoDaddy loop type trong URL, Cloudflare loop `FindRecordIdAsync` theo type + `["type"]` trong params lỗi `HostnameNotFound`); `BcnController.TestProvider` đọc `settings.UpdateIpv6` thay vì hardcode `false`. FE: table IP cell hiển thị v4 + v6 (`row.currentIpv6`), toggle `NmxSettingsRow` thêm `description` + key `updateIpv6Hint` (en.json). Lưu ý: Cloudflare không tự tạo record AAAA — user phải tạo sẵn (GoDaddy PUT tự upsert); GoDaddy/Cloudflare giờ 2 request/lần.
- [x] Notification khi hostname chuyển Error — dùng **notification bell** (`NotificationService.CreateForAdminsAsync(type, key, source, params)` → SignalR `notification:received`), **không** dùng `IAddonNotifier`/`addon:status-changed` (cái đó là widget status addon). `Source = "beacon"` → render "Beacon" qua `addon.beacon.title`. Fire **chỉ khi transition** (`prevStatus != Error` — tránh spam mỗi cycle; recovery `Error→Active` notify `beacon:hostnameRecovered` type `success`). `BcnCheckWorker`: resolve `NotificationService` scoped từ scope (dùng chung DbContext — flush sớm, harmless), capture `prevStatus` trước try/catch, helper `NotifyHostnameAsync`. Key `beacon:hostnameError`/`beacon:hostnameRecovered` + translation trong `i18n/locales/notification/en.json` (namespace riêng, format `**{{var}}**`; `vi.json` rỗng → fallback en). Verify: `dotnet build` 0 errors 0 warnings.
- [x] Secret encryption cho token/password trong `ConfigJson` — ASP.NET Core DataProtection: `BcnSecretProtector` (`Services/BcnProviders/`) Protect 5 field secret (`Token`/`Password`/`ApiToken`/`ApiKey`/`ApiSecret`) trước persist, Unprotect khi đọc; key ring persist `{dataBasePath}/keys` (Docker volume `/data/keys`). Wire: `BcnController` Create/Update `Protect` + Test `Unprotect`, `BcnCheckWorker` `Unprotect` (try/catch `CryptographicException` → status Error, không abort loop). Legacy plaintext giữ nguyên (detect prefix `CfDJ8`), không cần migration. `ConfigWriteOptions` thêm `JsonStringEnumConverter` (kind serialize `"get"`/`"rest"`). FE `keptSecrets` state: blob cũ giữ cho payload (Protect idempotent), input secret trống, pre-check `missingField` xét cả `keptSecrets`, fix `typeof v === "string"` (configJson chứa `null`/`kind` int)
- [x] Gỡ `console.log(raw)` còn sót trong `formatBeaconError` (BeaconHostnames.tsx:164)
- [x] Thêm key `configFields.user` — basic auth custom trả field `user`, hiện fallback raw → đã thêm `"user": "Username"` vào `addon.beacon.errors.configFields` (en.json)
- [x] ifconfig.co deprecation — đã bỏ hẳn service (chỉ ipify.org): backend `PublicIpService` (All=`[Ipify]`), frontend `BeaconSettings.tsx` ipOptions + `en.json` ipIfconfig
- [x] Nút **Retry/Update** manual trên menu hostname — gộp 1 action `check`: status `error` → "Retry" (semantic warning, icon REFRESH), ngược lại → "Update" (semantic success, icon UPDATE). Backend: extract logic update thành `BcnHostnameService` (scoped, `UpdateHostAsync(host, ipv4, ipv6, force=false, ct)` — `force=true` bypass skip-IP-unchanged, return `BcnUpdateResult`); `BcnCheckWorker` **slim còn ~60 dòng** — resolve `BcnHostnameService` từ scope rồi delegate, xóa hẳn inline `UpdateHostAsync`/`DescribeError`/`ComputeBackoff`/`Log`/`NotifyHostnameAsync` + inject `BcnProviderResolver`/`BcnSecretProtector` (1 nguồn logic duy nhất, hết nguy cơ drift); controller `POST /hostnames/{id}/check` (find host → detect IP theo `settings.UpdateIpv6` → `NoIp` early-return → `UpdateHostAsync(force: true)` → save → `{success, code, params}`). FE: `ApiBeaconRoutes.hostnameCheck` + `beacon.controller.checkHostname` (`CheckHostnameResult`); `BeaconHostnames` gộp `togglingId`+`checkingId` → 1 state `busyRowId` (disable menu khi in-flight), `handleCheck` dùng `formatCustomError` (fail → `ApiError("", result.code)`); i18n `actions.{retry,update}` + `feedback.{checkSuccess,checkError}`. Verify: `dotnet build` 0 errors 0 warnings + `pnpm tsc --noEmit` pass.
- [x] **Polish session 2026-08-05** (add-dialog gọn + feedback markup + error params + JSON enum consistency):
  - **Add dialog**: mở đầu chỉ hostname + provider select placeholder ("Select a provider…"); chọn provider xong mới xổ fields. `resetForm` sạch (bỏ prefill DuckDNS). `providerOptions.description` = mô tả **provider là gì** (natural language, không list field) qua `providers.descriptions.*`.
  - **Secret placeholder**: secret đã có giá trị mã hóa (`keptSecrets`) → `secretPlaceholder` ("Leave blank to keep the saved value"); chưa có → `credentialPlaceholders.*` hướng dẫn nhập. Helper `fieldPlaceholder(fieldKey, cfgKey)`.
  - **Feedback markup `**{{hostname}}**`**: toàn bộ `hostnames.feedback.*` (deleteConfirm `[color:warning]**…**[/color]`). Render qua `markupToHtml` (core util): `NmxToastProvider` + `NmxLogList` dùng `dangerouslySetInnerHTML`, `NmxAlertDialog` delete `markupToHtmlEnabled`.
  - **Error params end-to-end** (fix activity "KO" vs toast "()" lệch + không interpolate): (a) `DuckDnsProvider.Classify` fail trả `params.reason` (body thật); (b) FE `bcnErrorDetail(params)` normalize `httpStatus`/`reason` → 1 param `detail`; (c) `BcnController.CheckHostname` trả `@params = result.Params` (trước hardcode `{hostname}`); (d) `providerError` = "Provider returned an error **({{detail}})**". `BeaconActivity.renderMessage` + `handleCheck` đều truyền `detail: bcnErrorDetail(params)`.
  - **JsonStringEnumConverter mismatch** (fix `JsonException BcnProviderKind at $.kind` khi edit token): write options có converter → DB lưu `"kind":"get"`, read options + `BcnHostnameService` default options không có → đọc fail. Fix: **shared `BcnProviderConfig.SerializerOptions`** (CamelCase + case-insensitive + JsonStringEnumConverter) dùng chung `BcnController.DeserializeConfig`/serialize + `BcnHostnameService:28`. Legacy `"kind":0` int vẫn parse được.
  - **DuckDNS hostname regex**: `BcnHostnameSchema` trước đòi FQDN (`label.label.tld`) nhưng DuckDNS chỉ cần subdomain (`home`) → relax còn optional-label + tld.
  - **Update-on-save + status `Updating`** (không block UI): save hostname (create/edit) giờ push update ngay nhưng **không await trong request** — `BcnHostnameService` thêm `UpdateHostWithDetectedIpAsync(host, force, ct)` (đọc settings → detect IP → NoIp → status Error + `BCN_NO_IP`; còn lại delegate `UpdateHostAsync`); `BcnController` Create/Update set `Status = Updating` + `queue.EnqueueAsync(host.Id)` rồi trả về ngay. **NEW `Services/BcnUpdateQueue.cs`** (BackgroundService + `Channel<string>` + `SemaphoreSlim(2,2)` + `IServiceScopeFactory`, pattern y hệt `AddonTaskQueue`) chạy update ngầm → success → Active, error → Error, rate-limit → còn Updating nên fallback Active + `BackoffUntil`; throw bất ngờ → `SetErrorStatusAsync` (Error + `BCN_PROVIDER_ERROR` — khỏi kẹt Updating vĩnh viễn). Enum `BcnHostnameStatus` đổi tên `Pending` → `Updating` (2026-08-05; không cần migration — không có row nào đang `Pending`). `BcnCheckWorker` **skip host Updating** (tránh race double-update). DI: `AddSingleton<BcnUpdateQueue>()` + `AddHostedService<BcnUpdateQueue>(factory)`. FE: type `BcnHostnameStatus` thêm `"updating"`, badge updating → semantic `warning`, i18n `status.updating = "Updating"`. Verify: `dotnet build` 0 errors 0 warnings + `pnpm tsc --noEmit` pass.

### Phase 6 — Out-of-band drift detection + heartbeat (2026-08-05) ✅ (build 0/0, tsc pass)
- [x] **Authoritative DNS read thay read API per-provider** — `AuthoritativeDnsResolver` (`Services/BcnProviders/`, DnsClient.NET 1.8.0 trong `Directory.Packages.props` + csproj): bootstrap NS query `NameServer.GooglePublicDns` → strip label dần tìm NS authoritative (`NsRecords()`), query A + AAAA thẳng tới IP NS (`UseCache=false`); record `BcnCurrentRecord(Ipv4, Ipv6)` (`Matches()`, `HasAny`)
- [x] `IBcnProviderClient` thêm `GetDomain(hostname, config)` — provider khai FQDN cần query (base `=> hostname`; DuckDNS override `{sub}.duckdns.org`); **xóa hẳn `GetCurrentAsync`** khỏi interface + REST read trong DuckDNS/Cloudflare/GoDaddy
- [x] `BcnHostnameService.UpdateHostAsync` — skip guard: `TryGetCurrentAsync` (`GetDomain` + `ResolveAsync`) → `current.Matches(ipDetected)`? skip : push; resolve fail (`null`) → stored + heartbeat. `Unprotect` lên trước skip, capture `provider` 1 lần
- [x] Heartbeat force-push — DNS fail + in-sync + `LastUpdatedAt` quá `HeartbeatIntervalHours` → push bất kể so sánh; tự sửa out-of-band change trong vòng 1 heartbeat. Tái dùng `LastUpdatedAt` (không field mới / migration)
- [x] Setting `HeartbeatIntervalHours` (1/3/6/12/24, default 1h): `BcnSettings` + schema (int range như `CheckIntervalMinutes`) + controller map + `UpdateSettingsRequest` + migration `20260805082851_AddBcnHeartbeatInterval` + `IsHeartbeatDueAsync` đọc lazy (chỉ khi no-read + in-sync)
- [x] Frontend: `BeaconSettings` state + select 1-24h + load/save + dep array; `BcnSettingsDto`/`UpdateSettingsPayload` thêm `heartbeatIntervalHours`; en.json `heartbeatInterval`/`Hint`/`heartbeat{1,3,6,12,24}h`
- [x] Fix `defaultValue: 0` → `setHeartbeat(String(s.heartbeatIntervalHours || 1))` (BeaconSettings.tsx:28) — row settings cũ = 0 không còn select trống

### Phase 7 — Refresh/probe + Clear activity + activity realtime (2026-08-05) ✅ (build 0/0, tsc pass)
- [x] **`BcnProbeQueue`** (`Services/BcnProbeQueue.cs`, `BackgroundService` + `Channel<int>` + `IServiceScopeFactory`): `EnqueueAsync()` 0 tham số; batch probe host không disabled qua `RefreshHostFromProviderAsync` → đếm host OK → `NotifyHostnamesRefreshed(updated)`. DI `AddSingleton` + `AddHostedService`
- [x] **`RefreshHostFromProviderAsync`** (`BcnHostnameService`): `GetDomain` + `AuthoritativeDnsResolver.ResolveAsync` → persist `CurrentIpv4/6` + `LastCheckedAt`; IP đổi → log `BCN_PROBED` → worker self-heal ở cycle sau (probe chỉ đọc, không update DNS). Record `BcnProbeResult(Supported, Ipv4, Ipv6, Error)`
- [x] `POST /api/beacon/refresh` (`BcnController`, inject `BcnProbeQueue`) — enqueue probe, trả `ApiResponse.Ok()` ngay
- [x] **Clear activity** — `DELETE /api/beacon/activity` (bulk `ExecuteDeleteAsync`, trả `{deleted}`) + FE `clearActivity()` + Clear button + `NmxAlertDialog` confirm + i18n `clearConfirm/clearSuccess/clearError`
- [x] `BCN_PROBED` i18n — `BcnActivityCodes.Probed` (backend) + `BeaconActivityCodes.BCN_PROBED` → `addon.beacon.activity.probed` = "Current record: {{ip}}" (en.json:802)
- [x] `LogAndNotifyAsync` thêm `await db.SaveChangesAsync()` trước `NotifyActivityCreated` — DB committed trước khi FE refetch (tránh fire-before-commit race)
- [x] SignalR Beacon events: `NotifyActivityCreated` (`beacon:activity-created`), `NotifyHostnameStatusChanged`, `NotifyHostnamesRefreshed` (`SignalRBeaconNotifier`); FE constants đồng bộ
- [x] FE: `BeaconHostnames.handleRefresh` → `refreshHostnames()` + `refreshing` state; đăng ký `BeaconHostnamesRefreshed` (refetch + `setRefreshing(false)`) + `BeaconHostnameStatusChanged`
- [x] **Pending — activity tab auto-refresh khi mở** (đã fix): `NmxRail` giữ tab mount sẵn (`display:none`) → `BeaconActivity` chỉ fetch lúc mount đầu. Fix: `useActiveTab()` (`@namorix/ui`) gate refetch khi tab trở lại active — `BeaconActivity.tsx:47,63-70` `if (activeTab !== "activity") return` + subscribe cả `beacon:activity-created`/`beacon:hostnames-refreshed`
- [x] **Pending — warning `No client method ... beacon:activity-created`** (đã fix): warning benign do client library log khi nhận event không có handler. `BeaconActivity` tự register handler `beacon:activity-created` khi mount, NmxRail giữ mounted sau lần mở đầu → không còn warning.
- [x] **Pending — minor** (đã fix): DuckDNS dead field `_httpFactory` đã bỏ (constructor param truyền thẳng xuống `BcnGetProviderBase`); `BcnProbeQueue` logger đã dùng (`LogInformation` line 40)

### Phase 8 — Split `hostname` → `host` (multi) + `domain` (2026-08-05) ✅ (build 0/0, tsc pass)

Đổi mô hình: **`Hostname` → `Host` (multi-tag, comma-separated) + `Domain` (FQDN chuẩn)**. `Host` chỉ dùng để **update provider** (mỗi tag = 1 record đẩy lên). `Domain` là **domain hoàn chỉnh** dùng thẳng cho **refresh/probe** (authoritative DNS) — **không build `host.domain`**.

**Chốt:**
- `Host` lưu comma-separated trong cột cũ (**rename** `Hostname` → `Host`). Tag: `@` (apex) | `*` (wildcard) | label đơn (`izerocs`, `www`).
- `Domain` = FQDN đầy đủ dùng thẳng cho refresh: DuckDNS → `izerocs.duckdns.org`, Namecheap → `izerocs.space` (apex).
- **KHÔNG có `BcnFqdn`/build host.domain.** Refresh resolve `Domain` trực tiếp (`AuthoritativeDnsResolver.ResolveAsync(host.Domain)`). Bỏ `GetDomain` khỏi interface.
- Provider `UpdateAsync(host, domain, ...)` — host = tag đơn, domain = FQDN; mỗi provider dùng cái nó cần: DuckDNS/Namecheap dùng `host`; Cloudflare/GoDaddy/Dynu/NoIp dùng `domain` làm record name/hostname.
- Row cũ: `Host` giữ nguyên (full name cũ), `Domain = ""` — **không backfill** (test data, user edit lại tay).

**[x] Model + migration** — `Models/BcnHostname.cs`: `Hostname` → `Host` + thêm `Domain` (`[Required][MaxLength(253)]`). Migration `20260805115204_AddBcnDomainAndHost`: `RenameColumn("BcnHostnames","Hostname","Host")` + `AddColumn("Domain","TEXT",nullable:false,defaultValue:"")` + update snapshot.

**[x] Validation** — `Validation/BcnHostnameSchema.cs`:
- `Host`: required — comma-list, mỗi tag match `^(@|\*|[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)$` (cho phép `@`, `*`).
- `Domain`: required — regex FQDN chuẩn `^(?=.{1,253}$)([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$`.

**[x] Provider interface + tất cả provider** — `IBcnProviderClient` đổi param `hostname` → `host` + `domain` (xem section "Provider client interface" — đã bỏ `GetDomain`, bỏ `BcnFqdn`). Service refresh dùng `host.Domain` trực tiếp. Mỗi provider map theo API của nó:
- `BcnGetProviderBase`: `BuildUrl(string host, string domain, ...)`.
- DuckDNS: `domains={host}` (subdomain, list comma OK) — bỏ logic split.
- Namecheap: `host={host}&domain={domain}` — dùng thẳng cả 2.
- Cloudflare: record `name` = `domain` (FQDN user nhập).
- GoDaddy: record `name` = `host` (tag/@, zone từ config) — bỏ cắt `hostname.Length > zone.Length`.
- Dynu/NoIp: `hostname={domain}` (FQDN).
- Custom GET/REST: `BcnTemplate` **bỏ `{hostname}`**, thêm `{host}` + `{domain}`.

**[x] Update loop multi-host** — `Services/BcnHostnameService.cs`: refresh/probe resolve `host.Domain` (1 lần, không cần provider). Update: `host.Split(',')` → foreach tag: `provider.UpdateAsync(tag, host.Domain, ...)`; `*` tag vẫn push bình thường (không có `*.domain` nữa — refresh theo Domain không phải tag). `RefreshHostFromProviderAsync`/`TryGetCurrentAsync` dùng `host.Domain`.

**[x] Controller** — `Controllers/BcnController.cs`: request DTO `Host` + `Domain`; dup check `(Host, Domain)`; `/test` truyền `request.Host ?? "@"` + `request.Domain ?? "example.com"`.

**[x] Frontend** — `Beacon.types.ts`: `BcnHostnameDto` `host` + `domain`; `beacon.controller.ts` payload `{ host, domain, providerId, kind, configJson }`; `BeaconHostnames.tsx`: form Domain (`NmxFormInput`) + Host → `NmxTagInput` (multi) `formHost: string[]`, `buildPayload host = formHost.join(",")`, edit prepop split, `resetForm` set `formHost([])` + `formDomain("")`; table column render `host · domain`; `BeaconActivity.tsx:126` display `host · domain`; en.json `fields.host`/`fields.domain`, `addDialog.host`/`hostPlaceholder`/`domain`/`domainPlaceholder`, `urlTemplateHint`/`Placeholder` + `bodyTemplatePlaceholder` bỏ `{hostname}` (dùng `{host}`/`{domain}`); feedback giữ `{{hostname}}` = display string `host · domain`.

Verify: `dotnet build` 0 errors 0 warnings + `pnpm tsc -b` pass — **đã chạy 2026-08-05 sau khi apply, đạt 0/0.**

### Phase 9 — Error handling hardening (2026-08-05)

**Context**: Refactor host/domain lộ ra 2 lỗi error-path:
(a) `WithTag` dùng `dict["hostname"] ??= tag` — indexer `get_Item` chạy **trước** phép gán, throw `KeyNotFoundException` khi params không có key `hostname` (DuckDNS trả `{reason}`, exception trả `{httpStatus, detail}`), exception trồi ra `ExceptionMiddleware` → 500 thay vì activity log.
(b) Host để sai báo Error rồi interval **tự nhảy Active** — `inSync` tin authoritative DNS của domain (host tag chỉ nằm trong URL provider, DNS không thấy) + stored IP cũ, nên bỏ qua provider thật.

**Chốt fix (đã apply đủ):**
- [x] **`WithTag` `??=` → `TryAdd`** — `dict.TryAdd("hostname", tag)` không throw khi key thiếu; key `hostname` giữ = display string cho FE i18n `{{hostname}}`.
- [x] **Null `CurrentIpv4/6` khi vào Error** — mọi path: branch fail chính `UpdateHostAsync`, `ConfigInvalid` (crypto fail), `NoIp` (`UpdateHostWithDetectedIpAsync`), `SetErrorStatusAsync` (queue, `(string?)null` cast cho `SetProperty`).
- [x] **Controller `PUT /hostnames/{id}` reset `CurrentIpv4/6 = null`** khi user đổi host/domain — ngăn fallback `inSync` dùng IP cũ pass → Active sai.
- [x] **Interval skip guard** — `if (!force && host.Status != Error) { ...; if (inSync && !heartbeatDue) continue; }` — host `Error` luôn gọi provider thật, host sai giữ Error.
- [x] **Heartbeat độc lập `current is null`** — `heartbeatDue = await IsHeartbeatDueAsync(...)` (bỏ prefix `current is null`) → push định kỳ kể cả khi DNS resolve OK.

**Files**:
- `Services/BcnHostnameService.cs` — WithTag `TryAdd` + null IP 3 branch + skip guard + heartbeat
- `Services/BcnUpdateQueue.cs` — `SetErrorStatusAsync` null IP
- `Controllers/BcnController.cs` — `UpdateHostname` reset `CurrentIpv4/6`

**Verify**: `dotnet build` 0 errors 0 warnings.

### Phase 10 — HostIsDomain + provider error param end-to-end (2026-08-05) ✅

**Context**: 2 yêu cầu cuối session:
(a) Provider có record name == FQDN luôn (No-IP: hostname = `{domain}`) — form nhập `Host` thừa, hiển thị `host · domain` bị lặp (NoIp → `example.com · example.com`).
(b) Toast/check error thiếu tên provider — `providerError` template có `{{provider}}` nhưng `CheckHostname` trả `result.Params` thô (provider chỉ được thêm ở chỗ LOG, không vào `firstFailure` return).

**Chốt fix (đã apply đủ):**
- [x] **`BcnProviderInfo` thêm flag `HostIsDomain`** (param thứ 5, default `false`) — `Models/BcnProviderInfo.cs`. `NoIpProvider`: `HostIsDomain: true`.
- [x] **Controller derive `hostValue`** — Create/Update (`BcnController.cs:44-46, 90-92`): `registry.Contains(pid) && registry.Get(pid).Info.HostIsDomain ? request.Domain : request.Host` → HostIsDomain provider lưu `Host = Domain`. Dup check theo cặp `(hostValue, Domain)` như cũ.
- [x] **Validation relax** — `BcnHostnameSchema.Host` pattern cho phép dấu chấm `[a-zA-Z0-9.-]` (2 chỗ) — host = domain FQDN (NoIp) không còn `INVALID_FORMAT`. `Domain` giữ strict FQDN.
- [x] **FE collapse hiển thị** — `hostnameLabel(host, domain, isDomain) = isDomain ? domain : host · domain` (BeaconHostnames:211-212). Dùng ở: table host column (lookup `providers.find(p => p.id === row.providerId)?.hostIsDomain`, :582-590), toast create/update success (:401-406), delete/toggle dùng `domain` trực tiếp. `NmxFormField` host `shouldRender={!selectedProvider?.hostIsDomain}` (ẩn hẳn, :789-799); `buildPayload` gửi `host = formDomain.trim()` khi hostIsDomain (:304-307); `handleTest` guard + `extraActionDisabled` check hostIsDomain (:324, :774-775).
- [x] **Activity log label collapse** — `BeaconActivity.tsx:133-136`: `row.host === row.domain ? row.domain : [row.host, row.domain].filter(Boolean).join(" · ")`.
- [x] **`WithProvider` helper** — `BcnHostnameService.cs:290-295`: `dict.TryAdd("provider", providerId)` (TryAdd, không throw khi key thiếu). 3 chỗ dùng:
  - `firstFailure ??= result with { Params = WithProvider(WithTag(result.Params, tag), host.ProviderId) }` (:93-96) — **enrich 1 lần ở nguồn** → `CheckHostname` return `result.Params` (BcnController:178) giờ mang `provider` + `hostname` → check/retry toast + activity final-failure đủ param (bổ sung `WithTag` ở Phase 11).
  - log per-tag fail: `WithProvider(WithTag(result.Params, tag), host.ProviderId)` (:100).
  - log final fail: `firstFailure.Params` (:134-135) — đã mang provider từ :93.
- [x] **`BcnUpdateQueue.SetErrorStatusAsync`** — ParamsJson thêm `provider = host.ProviderId` (activity log queue-error cũng có tên provider).
- [x] **FE `renderBeaconCodeMessage(t, code, params)` helper** (BeaconHostnames:56-74) — translate provider id → display name (`t('addon.beacon.providers.${id}', { defaultValue: id })`), thêm `detail: bcnErrorDetail(params)`, trả `null` khi code không nằm trong `BeaconErrorCodes`. Dùng ở **cả** `formatBeaconError` (branch `PROVIDER_ERROR`) và check/retry toast `handleCheck` (inline, không qua formatBeaconError).
- [x] **`BeaconActivity.renderMessage`** (BeaconActivity:100-104) — translate `params.provider` qua providers locale trước khi `t(key, { ...params, provider: providerLabel, detail: bcnErrorDetail(params) })`.
- [x] **en.json:676** — `"providerError": "Provider **{{provider}}** returned an error **({{detail}})**"`.

**Note — Kind denormalization (đừng "fix")**: `BcnHostname.Kind` (column plaintext — FE đọc vì ConfigJson bị DataProtection mã hoá) và `BcnProviderConfig.Kind` (trong blob — `BcnProviderResolver` dùng lúc chạy, custom get/rest) lưu cùng giá trị từ `request.Kind`. Cố ý, đã ghi trong TODO.md.

**Minor sót**: `BeaconHostnames.tsx:228` còn `console.log(e?.code)` — debug log, nên bỏ.

**Files**:
- `Models/BcnProviderInfo.cs` — `HostIsDomain` param; `Services/BcnProviders/NoIpProvider.cs` — `HostIsDomain: true`
- `Controllers/BcnController.cs` — Create/Update hostValue + CheckHostname passthrough params
- `Validation/BcnHostnameSchema.cs` — Host pattern relax cho phép dấu chấm
- `Services/BcnHostnameService.cs` — `WithProvider` + firstFailure enrich + 2 log site
- `Services/BcnUpdateQueue.cs` — ParamsJson provider
- `frontend/src/addons/Beacon/BeaconHostnames.tsx` — `renderBeaconCodeMessage`, `hostnameLabel`, hostIsDomain (form/table/toast/guard)
- `frontend/src/addons/Beacon/BeaconActivity.tsx` — renderMessage provider + label collapse
- `frontend/src/addons/Beacon/Beacon.types.ts` — `BcnProviderInfo.hostIsDomain`, `bcnErrorDetail`
- `frontend/src/i18n/locales/en.json` — providerError template

**Verify**: `dotnet build` + `pnpm tsc` — user đã chạy sau khi apply, đạt.

### Phase 11 — Provider error detail + notification/activity interpolation + toggle enable + DisplayName collapse (2026-08-05) ✅

**Context**: 4 mảng bổ sung sau Phase 10:
(a) **Provider error detail chưa rõ** — Namecheap trả raw XML (`<?xml…><Err1>…`), NoIp không mang `reason` qua mọi error path, `bcnErrorDetail`/`DescribeDetail` ưu tiên sai → path exception hiện "HTTP 0" thay vì `ex.Message`.
(b) **Notification + activity hiển thị literal** `{{provider}}`/`{{hostname}}` — param thiếu hoặc renderer không translate.
(c) **Toggle Enable set thẳng `Active` không chạy update** — record lệch (IP đổi lúc disable) vẫn báo active.
(d) **`DisplayName` backend chưa collapse** — NoIp lưu `Host = Domain` hiện `example.com · example.com` ở notification + log.

**Chốt fix (đã apply đủ):**

**Provider error detail:**
- [x] **`NamecheapProvider.Classify`** (`NamecheapProvider.cs:18-36`) — `<ErrCount>0</ErrCount>` → success; fail trích `<Err1>` qua `GeneratedRegex` + `WebUtility.HtmlDecode`, fallback `body.Trim()` → hết raw XML.
- [x] **`NoIpProvider.Classify`** (`NoIpProvider.cs:20-37`) — `reason = text` mọi nhánh error (`badauth`/`nohost`/`abuse`/`911`/`_`); `abuse`/`911` giữ `RateLimited: true` (**Params positional trước `RateLimited:`** — named arg out-of-position + unnamed arg là lỗi compile C#).
- [x] **`bcnErrorDetail`** (`Beacon.types.ts:88-102`) — priority `detail → httpStatus > 0 → reason` (path exception trả `detail` = `ex.Message` không còn hiện "HTTP 0").
- [x] **`DescribeDetail` mirror** (`BcnHostnameService.cs:211-219`) — backend notification detail cùng thứ tự 3-tier `detail → httpStatus>0 → reason` (trước chỉ đọc `httpStatus` → notification "()" trống khi provider chỉ gửi `reason`).

**Notification renderer:**
- [x] **`NotifyHostnameAsync`** (`BcnHostnameService.cs:270-271`) — thêm `provider = host.ProviderId` (trước chỉ `hostname` + `error` + `detail` → literal `{{provider}}`).
- [x] **`Beacon.addon.tsx:20-37`** — `registerNotificationDescriptionRenderer("beacon")`: translate `params.error` (code UPPER_SNAKE) → i18n qua `BeaconErrorCodes`, truyền `hostname`/`provider` (translate qua `addon.beacon.providers.*`)/`detail`; **bỏ `console.log` còn sót**; **thêm `return t('notification:'+notif.key, params)`** — trước return undefined → default resolver hiện raw `BCN_PROVIDER_ERROR`.

**Activity log interpolation:**
- [x] **`firstFailure` enrich thêm `WithTag`** (`BcnHostnameService.cs:93-96`) — `WithProvider(WithTag(result.Params, tag), host.ProviderId)` (trước chỉ `WithProvider`) → activity final-failure (`:134`) giờ mang `hostname` (tag) → hết literal `{{hostname}}` ở `hostnameNotFound`/`providerError`. Per-tag log (`:100`) vốn đã có `WithTag`.

**Toggle Enable:**
- [x] **`ToggleHostname`** (`BcnController.cs:188-193`) — Disabled → Enable: `Status = Updating` + `queue.EnqueueAsync(host.Id)` (đi qua `BcnUpdateQueue` như Create/Update: success → `Active`, fail → `Error`, rate-limit → fallback `Active` + `BackoffUntil`). Disable → set `Disabled` như cũ.

**DisplayName collapse:**
- [x] **`BcnHostname.DisplayName`** (`BcnHostname.cs:20`, `[NotMapped]`) — `Host == Domain ? Domain : $"{Host} · {Domain}"`. Mọi nơi service dùng `host.DisplayName` thay `Host` (notification `hostname`, `NotifyStatusChangedAsync`, activity log `hostnameId` display) — hết lặp `example.com · example.com` cho NoIp.

**Files**:
- `Services/BcnProviders/NamecheapProvider.cs` — `<Err1>` extract; `Services/BcnProviders/NoIpProvider.cs` — reason all branches
- `Services/BcnHostnameService.cs` — `DescribeDetail` 3-tier, `NotifyHostnameAsync` provider, `firstFailure` WithTag, DisplayName usage
- `Controllers/BcnController.cs` — toggle Enable → Updating + enqueue
- `Models/BcnHostname.cs` — `DisplayName` collapse
- `frontend/src/addons/Beacon/Beacon.types.ts` — `bcnErrorDetail` priority
- `frontend/src/addons/Beacon/Beacon.addon.tsx` — notification renderer (provider/hostname/detail + return)
- `frontend/src/addons/Beacon/BeaconActivity.tsx` — `renderMessage` provider translate + `bcnErrorDetail` (đã có từ Phase 10)
- `.claude/TODO.md` — resolved: provider error (DuckDNS ✅ Namecheap ✅ NoIp ⏳ cần test thật), toggle enable

**Verify**: `dotnet build` + `pnpm tsc` — user apply trực tiếp từng fix, đạt. **NoIp chưa test thật (TODO ⏳)** — DuckDNS + Namecheap đã test pass, NoIp code xong chờ test với provider thật.

### Phase 12 — Multi-host xuống provider + token-match classify + constants + FE hints (2026-08-05) ✅

**Context**: (a) Multi-host orchestration (split + per-tag loop) đang ở `BcnHostnameService` — chuyển xuống provider để mỗi provider tự quyết cách xử lý (DuckDNS batch 1 request — API nhận comma list; Cloudflare/GoDaddy/Namecheap loop N request). (b) NoIp/Dynu trả `good <ip>` có IP suffix → exact-match fail. (c) Hardcode string còn nhiều trong provider. (d) Form host/domain thiếu hint.

**Chốt fix (đã apply):**
- [x] **`BcnHostnameService`** — bỏ `Split`/vòng foreach tag; skip-check 1 lần (inSync/heartbeat đều host-level); gọi `provider.UpdateAsync(host.Host, host.Domain, ...)` **1 lần** với full chuỗi comma; xử lý 1 result; **xoá helper `WithTag`** (provider tự set param `hostname` cho tag fail).
- [x] **`CloudflareProvider`** — split host → loop **tag × (A/AAAA)**, `recordName` switch (`@`→domain, `*`→`*.domain`, có dấu chấm→dùng thẳng, label trần→`tag.domain`); dùng `recordName` cho `FindRecordIdAsync` + payload `name` + error param (`WithHostname`); **fix `FindZoneIdAsync`** `zones?name={zone}` (trước `zones/{zone}` — endpoint đó cần zone ID, `config.Zone` là name → 404); `Tested: true`.
- [x] **`GoDaddyProvider`** — split host → loop **tag × (A/AAAA)**, `name = tag`, `firstFailure ??=` (không return ngay như cũ).
- [x] **`DuckDnsProvider`** — **không đổi** — API `domains={host}` **chính thức nhận comma list** ("separated by commas") → 1 request batch.
- [x] **`NamecheapProvider`** — **split+loop per host** — docs chính thức: **mỗi request 1 giá trị `host=`** (`@`/`www`/`*`), **KHÔNG có cú pháp `host=@,www` gộp** (client thứ 3 `rexxars` hỗ trợ comma là loop nội bộ, không phải 1 request). Cần: `BcnGetProviderBase.UpdateAsync` thêm `virtual` + Namecheap override loop từng tag gọi `base.UpdateAsync(tag, ...)`, collect `firstFailure ??=` + `WithHostname`. `Tested: true` (4th positional = `Tested`, KHÔNG phải HostIsDomain — verify `BcnProviderInfo` constructor). Case-sensitivity: host/domain phải đúng chữ hoa/thường như dashboard — pass nguyên user nhập.
- [x] **`NoIpProvider`/`DynuProvider`** — `Classify` đổi sang **token-match** (`Split(' ')[0]`) — `good <ip>`/`nochg <ip>` → success; Dynu thêm `notfqdn`→`HostnameNotFound` + `servererror`→`Unavailable`; `Tested: true` cả 2.
- [x] **`BcnHostnameSchema`** — Host pattern thêm `(\*\.)?` (cho `*.suffix`): `^(@|\*|(\*\.)?[a-zA-Z0-9](...))(...)*$`.
- [x] **Constants** — `BcnParam` mở rộng (`FieldConfig`/`FieldHost`/`FieldUrlTemplate`/`FieldUser`/`FieldEndpointTemplate`/`FieldRecordLookupTemplate`/`Zone`/`Type`), `BcnCredentialParam` (username/password/token/apiToken/apiKey/apiSecret/zone), `BcnHttpClientNames` (Get/Rest), `BcnHeaderKey` (Bearer/SsoKey) — thay hết hardcode trong toàn bộ provider + `BcnController.GetConfigValue`.
- [x] **FE hints** — `addDialog.hostHint` + `domainHint` (en.json) → `NmxFormField` prop `helper` (BeaconHostnames :800, :811) — giải thích format tag `@` (apex) / `*` (wildcard) / `www` (→ www.domain) / `*.example.com`, cách nhau dấu phẩy.
- [x] **Note — Test = real update** — mọi provider `TestAsync` delegate `UpdateAsync` → bấm "Test connection" **sửa record DNS thật** bằng IP hiện tại; fail `HostnameNotFound` nếu record chưa tồn tại.

**Behavior change**: per-tag log (2 tag fail = 2 entry) → **1 log tổng** (params mang `hostname` tag fail đầu).

**Files**: `Services/BcnHostnameService.cs`; `Services/BcnProviders/{Cloudflare,GoDaddy,NoIp,Dynu,Namecheap,DuckDns}Provider.cs`; `Models/BcnProviderInfo.cs` (Tested); `Validation/BcnHostnameSchema.cs`; `Constants/Beacon.cs`; `Controllers/BcnController.cs`; `Infrastructure/IBcnProviderClient.cs`; FE `BeaconHostnames.tsx` + `en.json`.

**Verify**: `dotnet build` 0 errors 0 warnings. NoIp + Dynu đã test thật (lỗi `good <ip>` → fix token-match → retest). Cloudflare đang test multi-host.

**Pending**: SignalR reconnect bug (`@namorix/core` — Open Decision #14); activity per-tag → 1 log đã chấp nhận.

### Phase 13 — SignalR realtime CRUD hostname (2026-08-08) ✅

**Context**: Frontgate có pattern realtime CRUD (`frontgate:rule-changed`) — Beacon chưa. `BcnController` không notify khi create/update/delete hostname; chỉ `BcnHostnameService`/`BcnProbeQueue` push status/refresh (Phase 7). Cross-session sửa/xóa hostname → session kia list + dialog edit stale, không có toast.

**Chốt fix (đã apply đủ, đọc lại 9 file xác nhận):**
- [x] **Enum `BcnHostnameAction { Created, Updated, Deleted }`** — `Constants/Beacon.cs:73`
- [x] **Event `beacon:hostname-changed`** — `ServerSignalREvent.BeaconHostnameChanged` (backend `Constants/ServerSignalR.cs:21` + FE `src/signalr/constants.ts:17`)
- [x] **`IBeaconNotifier.NotifyHostnameChanged(hostnameId, hostname, BcnHostnameAction)`** + `SignalRBeaconNotifier` implement — action `action.ToString().ToLowerInvariant()` (SignalR protocol serializer không dùng `JsonStringEnumConverter` của MVC → enum serialize thành **số**, phải convert tay — giống fix frontgate)
- [x] **`BcnController` inject `IBeaconNotifier`** (param cuối constructor) — Create → `Created` (:71), Update → `Updated` (:117), Delete → `Deleted` (:133, capture `displayName = host.DisplayName` trước `Remove`)
- [x] **FE types** — `BcnHostnameChangedPayload { hostnameId, hostname, action }` (`Beacon.types.ts:89-92`) + union `BcnHostnameAction = "created"|"updated"|"deleted"` (:23)
- [x] **FE listener `BeaconHostnameChanged`** (`BeaconHostnames.tsx:736-755`) — nếu hostname đang mở dialog edit (`editing.id`) bị xóa ngoài → `resetForm()` + đóng dialog + toast `deletedExternally` kèm `{{hostname}}`; mọi action → refetch list
- [x] **en.json `deletedExternally`** = "**{{hostname}}** was deleted by another session"
- [x] **`fetchHosts` fix lỗi `.finally()` detached** — chuyển `await` + `return res.items` (`Promise<BcnHostnameDto[]>`) → `.catch(nmxToast.error)` bên ngoài giờ bắt được rejection (giống fix frontgate)

**Design notes**: toast chỉ bắn khi hostname đang mở dialog edit bị xóa ngoài (self-delete không bắn — `editing` đã null sau khi đóng); **không** theo dõi `deleting` state (tránh race self-delete, giống frontgate không check dialog delete). `created`/`updated` chỉ refetch, **không** re-sync form edit đang mở — form Beacon có `keptSecrets` phức tạp, re-sync dễ hỏng secret.

**Files**: `Constants/Beacon.cs`, `Constants/ServerSignalR.cs`, `Infrastructure/IBeaconNotifier.cs`, `Hubs/SignalRBeaconNotifier.cs`, `Controllers/BcnController.cs`, FE `src/signalr/constants.ts`, `Beacon.types.ts`, `BeaconHostnames.tsx`, `en.json`

1. ~~**Naming**~~ ✅ Chốt: **`Bcn` + `/api/beacon`** (nhất quán với Fg = addon initialism).
2. ~~**Public IP detection reuse**~~ ✅ Chốt 2026-08-03: **dựng shared service mới** `IPublicIpDetector`/`PublicIpService` (namespace `Namorix.Server.Services`, không gắn Bcn). Lưu ý: plan cũ ghi Frontgate "đã có DnsLookupChecker + ipify" là **sai** — backend chưa từng có code public IP. Nhưng **Frontgate cần public IP thật** cho HTTP-01 challenge check (so DNS resolve ↔ public IP, port 80 mở trước khi LE validate). Beacon dùng trước (worker + `/test`), Frontgate inject `IPublicIpDetector` reuse sau.
3. ~~**Secrets**~~ ✅ Chốt 2026-08-05: mã hóa bằng **ASP.NET Core DataProtection** (Encrypt-then-MAC, key ring xoay vòng 90 ngày, `purpose` `"Bcn.ConfigJson"`): `Protect()` trước khi persist, `Unprotect()` khi đọc — chỉ 5 field secret. Key ring persist `{dataBasePath}/keys` (Docker volume `/data/keys`, không dùng ephemeral filesystem — mất key = mất data vĩnh viễn). **Không** decrypt trả về frontend (secret một chiều: "để trống = giữ nguyên", FE giữ blob qua `keptSecrets`; backend chỉ Unprotect ở `BcnCheckWorker` + `/test`). Frontgate DNS-01 credentials dùng **chung cơ chế này** (đã ghi trong frontgate plan).
4. ~~**Custom provider reuse**~~ ✅ Chốt 2026-08-05: lưu inline per-hostname (chốt ở Phase 0) — tách bảng `BcnCustomProvider` nếu cần tái dùng sau. **Giữ nguyên** (user xác nhận 2026-08-05).
5. ~~**Hostname status model**~~ ✅ Chốt 2026-08-03: `active | disabled | error` (bỏ `warn`), toggle manual `POST /hostnames/{id}/toggle`, rate-limit không đổi status. **Bổ sung 2026-08-05:** thêm `updating` (đổi tên từ `pending` cùng ngày) — update-on-save đang chạy ngầm (`BcnUpdateQueue`), transition → Active/Error; rate-limit fallback Active + `BackoffUntil`.
6. ~~**Config field label coverage**~~ ✅ Chốt 2026-08-05: **thêm key `configFields.user`** (`"user": "Username"` trong en.json) — basic auth custom trả field `user` không còn fallback raw. Giữ cả `username` (credential field key) — 2 map song song, không đổi schema.
7. **Field key naming**: backend trả `user` (custom basic) nhưng frontend credential field key là `username` — nên thống nhất về một phía (map `GetConfigValue`/`configFields` đã che được, không đổi schema).
8. ~~**IPv6 scope**~~ ✅ Chốt 2026-08-05: toggle **global `UpdateIpv6`** (default OFF — ISP không hỗ trợ v6 là thuộc tính mạng, không per-hostname). `{ip}` đổi sang **v4-preferred** (`ipv4 ?? ipv6`) để template custom không bị gửi v6 sai record A; AAAA dùng placeholder `{ipv6}` tường minh. Per-hostname override (`bool? UpdateIpv6` trong ConfigJson) là extension tùy chọn — không làm. Cloudflare không auto-create AAAA — user tạo record trước.
9. ~~**Notification channel**~~ ✅ Chốt 2026-08-05: hostname Error dùng **notification bell** (`NotificationService` + `Source="beacon"`), fire trên **transition** (không spam mỗi cycle) kèm recovery. Không dùng `IAddonNotifier` — đó là kênh widget trạng thái addon, không phải bell.
10. ~~**Drift detection nguồn**~~ ✅ Chốt 2026-08-05 (cập nhật): verify record thật bằng **authoritative DNS query** (`GetDomain` + `AuthoritativeDnsResolver`) — provider-agnostic, không cần credential read API, **bỏ hẳn `GetCurrentAsync` REST per-provider**. Query thẳng NS authoritative với `UseCache=false` (tránh cache lệch của system resolver). Query fail → `null` + heartbeat force-push.
11. ~~**Heartbeat timer**~~ ✅ Chốt 2026-08-05: tái dùng `LastUpdatedAt` (push thành công reset) — không thêm `LastForcePushAt`. Interval `HeartbeatIntervalHours` configurable 1-24h (default 1h).
12. ~~**Hostname → host + domain**~~ ✅ Chốt 2026-08-05 (sửa 2026-08-05): tách `Host` (multi-tag, comma-separated — `@`/`*`/label) + `Domain` (**FQDN chuẩn dùng thẳng cho refresh**, không build `host.domain`). DuckDNS host = subdomain (`izerocs`), domain = `izerocs.duckdns.org`. **Bỏ `BcnFqdn`/`GetDomain`** — refresh resolve `Domain` trực tiếp. Row cũ không backfill — user edit lại. (Phase 8.)
13. ~~**HostIsDomain provider**~~ ✅ Chốt 2026-08-05: provider record name == FQDN luôn (No-IP) khai `BcnProviderInfo.HostIsDomain = true`. Controller derive `hostValue = domain` khi flag set (lưu `Host = Domain`), FE ẩn host field + collapse hiển thị (`hostnameLabel`: isDomain → chỉ `domain`; activity label: `host === domain` → chỉ `domain`). Validation Host pattern relax cho phép dấu chấm. (Phase 10.) Chốt lại 2026-08-05: chỉ NoIp + Dynu dùng `HostIsDomain: true` (named); **Namecheap `, true` là `Tested: true` (positional thứ 4), không phải HostIsDomain** — đừng nhầm.
14. ~~**SignalR reconnect làm mất event handler**~~ ✅ **RESOLVED 2026-08-05** (core 0.56.1): `signalr.service.ts` `startConnection()` **rebuild `HubConnection` mới** khi state Disconnected (sau drop/backend restart) → mọi `conn.on(...)` do `useSignalREvent` đăng ký trên connection cũ **mất hết**; `useSignalREvent` không re-register (deps `[eventName]`) — khác `useSignalRGroup` (có `conn.onreconnected` re-subscribe). Hậu quả: event đầu tiên sau reconnect (`notification:received`, beacon, system-monitor) → **"No client method" warning + bị drop**. **Fix đã apply (hướng A):** `startConnection` **reuse connection** — chỉ tạo mới khi `!connection`, còn lại `.start()` lại cùng instance → giữ `conn.on` handlers qua reconnect. *(Bug `@namorix/core` — không riêng Beacon, phát hiện trong lúc test Beacon.)*
