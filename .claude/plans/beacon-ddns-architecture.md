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
        string hostname, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6, CancellationToken ct);

    Task<BcnTestResult> TestAsync(
        string hostname, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6, CancellationToken ct);
}

public record BcnUpdateResult(bool Success, string? Code = null,
    Dictionary<string, object?>? Params = null,
    bool RateLimited = false, DateTimeOffset? RetryAfter = null);
public record BcnTestResult(bool Success, string? Code = null,
    Dictionary<string, object?>? Params = null);
```

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
- **Get**: `UrlTemplate`, `AuthType` (None/HttpBasic/QueryParam), `User`, `Password`/`Token`, `SuccessMatch` (contains "OK" / HTTP 200 / custom regex). Placeholders: `{hostname} {ip} {ipv6} {token} {user} {password}`.
- **Rest**: `ApiToken` (hoặc key+secret), `Zone`, `Method` (PATCH/PUT/POST), `BodyTemplate` (JSON, `{ip}`), `SuccessPath` (JSON pointer truthy), `RecordId` (cache sau lookup lần đầu).
- **Custom**: `Label` + một trong 2 cấu hình trên theo `Kind`.

### Built-in provider catalog

Provider built-in là **class riêng** (Strategy + Registry), mỗi provider 1 class — không phải static catalog kiểu `DnsProviders.cs` như Frontgate. Class GET-style kế thừa `BcnGetProviderBase` (abstract, xử lý chung request/reponse + classify), class REST (Cloudflare/GoDaddy) implement trực tiếp `IBcnProviderClient`. `BcnProviderRegistry` resolve theo `Info.Id` từ `IEnumerable<IBcnProviderClient>` DI.

`BcnProviderInfo`: `id`, `name`, `initials` (monogram), `accent` (màu badge), `kind` (`BcnProviderKind`), `credentialFields` (list `BcnCredentialField` kiểu `DnsCredentialField`).

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

### Update loop (worker)

Logic per-hostname (skip IP unchanged, backoff, notification, activity log) nằm **duy nhất** trong `BcnHostnameService.UpdateHostAsync(host, ipv4, ipv6, force, ct)` (scoped, shared giữa worker + controller check manual). `BcnCheckWorker : BackgroundService` (pattern `SystemMonitorStatsWorker`, timer `Task.Delay`) chỉ còn là orchestrator — resolve service từ scope rồi delegate, mỗi `CheckInterval`:
1. Detect public IPv4 (+ IPv6 nếu bật) — Auto (mặc định ipify.org) / ipify.org.
2. Bỏ qua hostname `Disabled` (filter `.Where(h => h.Status != Disabled)`).
3. `force=false` → service skip host khi IP không đổi (tiết kiệm API call, tránh rate-limit).
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
  Hostname      string                  — "home.izerocs.space"
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
  Id                 int (luôn = 1)
  CheckIntervalMinutes int   — 5/15/60
  IpDetectionService string  — "auto" | "ipify.org"
  UpdateIpv6         bool

BcnActivityLog
  Id          int (auto-increment)
  Timestamp   DateTime
  Level       BcnLogLevel     — Info | Warn | Error
  Code        string?         — UPPER_SNAKE activity/error code (BCN_UPDATED, BCN_RATE_LIMITED...)
  ParamsJson  string?         — JSON params cho FE i18n interpolation (ip, retryAt, zone...)
  HostnameId  string?         — nullable, FK SetNull khi xóa hostname
  Hostname    BcnHostname?    — nav: DTO trả kèm `hostname` text để FE hiển thị
```

- Custom provider **lưu inline trong `ConfigJson` của hostname** (mỗi hostname 1 config custom), không tách bảng riêng — khớp mock (custom là 1 provider kind trong grid). Nếu sau này cần tái dùng → tách `BcnCustomProvider` + FK.
- Activity log cần pruning (pattern `NotificationCleanupWorker`) — không để lớn vô hạn.

## API Endpoints (BcnController)

| Method | Route | Chức năng |
|--------|-------|-----------|
| GET | `/api/beacon/hostnames?page&size` | list paginated |
| POST | `/api/beacon/hostnames` | tạo (validate schema) |
| PUT | `/api/beacon/hostnames/{id}` | cập nhật credential/config |
| DELETE | `/api/beacon/hostnames/{id}` | xóa |
| POST | `/api/beacon/hostnames/{id}/toggle` | flip `active` ↔ `disabled` (manual) |
| POST | `/api/beacon/hostnames/{id}/check` | **Retry/Update** manual — detect IP theo `settings.UpdateIpv6` → `UpdateHostAsync(force: true)` → `{success, code, params}` (params passthrough `result.Params` — reason/httpStatus; NoIp nếu detect fail) |
| POST | `/api/beacon/hostnames/test` | **Test connection** — test config form (chưa save) bằng public IP hiện tại; `TestProviderRequest` kèm `Hostname`, test dùng hostname từ form (fallback `test.example.com` nếu trống) |
| GET | `/api/beacon/activity?page&size` | activity log paginated |
| GET | `/api/beacon/providers` | built-in catalog (kiểu `/api/frontgate/dns-providers`) |
| GET | `/api/beacon/settings` | đọc settings |
| PUT | `/api/beacon/settings` | cập nhật settings |
| GET | `/api/beacon/status` | last check + healthy count (sidebar footer) |

Tất cả `[RequireAdmin]`. Validation bằng `IValidationSchema` + `[Validate]` (hostname format regex, kind enum, config JSON parse).

## Frontend UI

Convert mock Tailwind → Nmx. Cấu trúc:

- **`Beacon.tsx`** ✅: `NmxAddonRoot` + `NmxRail<BeaconTab>` (nav 3 tab hostnames/activity/settings, icon HOSTNAME/ACTIVITY/SLIDERS) + `NmxRailContent` cho từng view. Footer healthy-status "x/y healthy · Last check" sẽ truyền qua `footer` prop của `NmxRailList` (i18n key `addon.beacon.nav.*` đã có, chưa render).
- **`BeaconHostnames.tsx`**: `NmxDataTable` — cột Status (`NmxBadge` semantic theo `active`/`disabled`/`error`) / Hostname (mono, kèm createdAt) / Provider (badge màu) / Current IP (mono, v4 + v6) / actions = `NmxMenuButton` (**Check**/Retry theo status + Enable/Disable dynamic + Delete, hover reveal; disable khi `busyRowId === row.id`). Toolbar `NmxAlign` + Add/Refresh.
- **Add hostname modal — gộp inline trong `BeaconHostnames.tsx`** (`NmxAlertDialog`), không tách file `BeaconAddHostnameModal.tsx`: lưới provider card (6 + Custom, monogram màu, selected ring) → form động theo kind:
  - get: Hostname, token/password, note "single signed GET, no record lookup"
  - rest: Hostname, API token, Zone, note "record ID lookup once, then REST update"
  - custom: Hostname, Provider label, toggle **Simple GET / REST-JSON**, field tương ứng, nút **Test connection** → POST test → hiện success/error inline
- **`BeaconActivity.tsx`**: `NmxLogList` (composite mới, SCSS `log-list.scss`) — mỗi entry: time (mono, muted) + message color semantic (info→default, warn→warning, error→error); `fallbackConditions` (loading/error/empty, dùng type chung `NmxFallback`) + toolbar refresh (NmxAlign + NmxButton + icon REFRESH). **Cột level đã bỏ hẳn** → hết bug header `[object Object]`, không cần key `activity.level`.
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

## Open Decisions

1. ~~**Naming**~~ ✅ Chốt: **`Bcn` + `/api/beacon`** (nhất quán với Fg = addon initialism).
2. ~~**Public IP detection reuse**~~ ✅ Chốt 2026-08-03: **dựng shared service mới** `IPublicIpDetector`/`PublicIpService` (namespace `Namorix.Server.Services`, không gắn Bcn). Lưu ý: plan cũ ghi Frontgate "đã có DnsLookupChecker + ipify" là **sai** — backend chưa từng có code public IP. Nhưng **Frontgate cần public IP thật** cho HTTP-01 challenge check (so DNS resolve ↔ public IP, port 80 mở trước khi LE validate). Beacon dùng trước (worker + `/test`), Frontgate inject `IPublicIpDetector` reuse sau.
3. ~~**Secrets**~~ ✅ Chốt 2026-08-05: mã hóa bằng **ASP.NET Core DataProtection** (Encrypt-then-MAC, key ring xoay vòng 90 ngày, `purpose` `"Bcn.ConfigJson"`): `Protect()` trước khi persist, `Unprotect()` khi đọc — chỉ 5 field secret. Key ring persist `{dataBasePath}/keys` (Docker volume `/data/keys`, không dùng ephemeral filesystem — mất key = mất data vĩnh viễn). **Không** decrypt trả về frontend (secret một chiều: "để trống = giữ nguyên", FE giữ blob qua `keptSecrets`; backend chỉ Unprotect ở `BcnCheckWorker` + `/test`). Frontgate DNS-01 credentials dùng **chung cơ chế này** (đã ghi trong frontgate plan).
4. **Custom provider reuse**: lưu inline per-hostname (chốt ở Phase 0) — tách bảng `BcnCustomProvider` nếu cần tái dùng sau.
5. ~~**Hostname status model**~~ ✅ Chốt 2026-08-03: `active | disabled | error` (bỏ `warn`), toggle manual `POST /hostnames/{id}/toggle`, rate-limit không đổi status.
6. ~~**Config field label coverage**~~ ✅ Chốt 2026-08-05: **thêm key `configFields.user`** (`"user": "Username"` trong en.json) — basic auth custom trả field `user` không còn fallback raw. Giữ cả `username` (credential field key) — 2 map song song, không đổi schema.
7. **Field key naming**: backend trả `user` (custom basic) nhưng frontend credential field key là `username` — nên thống nhất về một phía (map `GetConfigValue`/`configFields` đã che được, không đổi schema).
8. ~~**IPv6 scope**~~ ✅ Chốt 2026-08-05: toggle **global `UpdateIpv6`** (default OFF — ISP không hỗ trợ v6 là thuộc tính mạng, không per-hostname). `{ip}` đổi sang **v4-preferred** (`ipv4 ?? ipv6`) để template custom không bị gửi v6 sai record A; AAAA dùng placeholder `{ipv6}` tường minh. Per-hostname override (`bool? UpdateIpv6` trong ConfigJson) là extension tùy chọn — không làm. Cloudflare không auto-create AAAA — user tạo record trước.
9. ~~**Notification channel**~~ ✅ Chốt 2026-08-05: hostname Error dùng **notification bell** (`NotificationService` + `Source="beacon"`), fire trên **transition** (không spam mỗi cycle) kèm recovery. Không dùng `IAddonNotifier` — đó là kênh widget trạng thái addon, không phải bell.
