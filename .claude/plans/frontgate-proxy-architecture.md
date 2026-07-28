# Frontgate Proxy Architecture Plan

## Stack Decision: YARP

Use **YARP (Yet Another Reverse Proxy)** — Microsoft's official reverse proxy library — integrated directly into the ASP.NET Core pipeline:

- `AddReverseProxy()` + `MapReverseProxy()` — chạy chung process với backend, không cần Nginx/HAProxy riêng
- Config runtime qua `IProxyConfigProvider` — đọc từ DB (`FgReverseProxyRule` table), áp dụng ngay không cần restart
- Forward WebSocket, gRPC (HTTP/2), HTTP/1.1 built-in
- Load balancing, health check, retry policy có sẵn

### So với Nginx-generated config

| Tiêu chí | YARP | Nginx |
|----------|------|-------|
| Chạy chung process .NET | Chung | Riêng |
| Update rule runtime | Native, không cần reload | Cần `nginx -s reload` |
| WebSocket/HTTP2 | Built-in | Built-in |
| Debug/log | Cùng Serilog pipeline | Log riêng |
| TLS/SNI cert | Tự code | Native |

## Entity Design

### Core Entities

```
FgReverseProxyRule ──[CertificateId]──> FgCertificate          (nhiều rule dùng chung 1 cert)
FgReverseProxyRule ──[AccessPolicyId]──> FgAccessPolicy        (nhiều rule dùng chung 1 policy)
FgReverseProxyRule ── 1:n ──> FgReverseProxyLocation           (Custom Locations sub-routing)
FgCertificate       ── 1:n ──> FgCertificateDomain             (Multi-domain SANs, Cascade delete)
```

### Các bảng đã tạo

| Table | Fields | Status |
|-------|--------|--------|
| `FgReverseProxyRules` | Id, Source, DestinationScheme, DestinationHost, DestinationPort, CertificateId (FK), Access, AccessPolicyId (FK), WebSocketsSupport, CacheAssets, ForceSsl, Http2Support, HstsEnabled, HstsSubdomains, TrustForwardedProtoHeaders, AdditionalHeadersJson, Status, CreatedAt, UpdatedAt | ✅ |
| `FgCertificates` | Id, Issuer, Type, Source, Status, DnsProviderId, ExpiresAt, AutoRenew, CreatedAt | ✅ |
| `FgCertificateDomains` | Id, Domain, CertificateId (FK → FgCertificates, Cascade), Index trên Domain | ✅ |
| `FgAccessPolicies` | Id, Name, Type, RulesJson, CreatedAt | ✅ |
| `FgReverseProxyLocations` | Id, RuleId (FK), Path, Scheme, ForwardHost, ForwardPort (Cascade delete) | ✅ |

### ReverseProxyRule fields

| Field | Type | Ghi chú | Status |
|-------|------|---------|--------|
| `DestinationScheme` | string | "http"/"https" | ✅ |
| `DestinationHost` | string | host: tách từ Destination cũ | ✅ |
| `DestinationPort` | int | port: tách từ Destination cũ | ✅ |
| `WebSocketsSupport` | bool | WebSocket upgrade (mặc định true) | ✅ |
| `CacheAssets` | bool | Cache static assets | ✅ |
| `ForceSsl` | bool | Redirect HTTP→HTTPS | ✅ |
| `Http2Support` | bool | HTTP/2 to backend | ✅ |
| `HstsEnabled` | bool | HSTS header | ✅ |
| `HstsSubdomains` | bool | includeSubDomains | ✅ |
| `TrustForwardedProtoHeaders` | bool | Per-rule trust X-Forwarded-Proto (khác TrustedProxyMiddleware global) | ✅ |
| `AdditionalHeadersJson` | string? | YARP transforms escape hatch | ✅ |
| `BlockCommonExploits` | bool | WAF rule-set cơ bản | ✅ |

## YARP Transforms (2 layers)

Layer 1 — **TrustedProxyMiddleware (global)**: xử lý X-Forwarded-* từ request bên ngoài vào Frontgate, whitelist IP-based.

Layer 2 — **YARP built-in transforms**: tự động forward X-Forwarded-*, X-Real-IP header khi gửi request từ Frontgate tới backend addon. Có thể kiểm soát per-rule qua `AdditionalHeadersJson` field.

Không có "raw custom config" kiểu Nginx — đây là design decision bảo mật, thay bằng structured transforms + escape hatch có kiểm soát.

### YARP Feature Implementation Notes

Tất cả các flag đều implement được bằng C#/YARP, không cần Nginx hay config bên ngoài:

| Flag | Implementation Approach |
|------|----------------------|
| **WebSocketsSupport** | YARP built-in — tự động xử lý upgrade request, chỉ cần không disable |
| **ForceSsl** | Middleware trước `MapReverseProxy()` — check `HttpContext.Request.Scheme`, redirect 301 nếu không phải HTTPS |
| **CacheAssets** | YARP transform: `ResponseHeaderAppendTransform("Cache-Control", "public, max-age=86400")` kết hợp path condition |
| **Http2Support** | YARP cluster config — dùng `HttpVersionPolicy.RequestVersionOrHigher`, tự động fallback nếu backend không hỗ trợ |
| **HstsEnabled / HstsSubdomains** | Middleware hoặc YARP transform — thêm header `Strict-Transport-Security: max-age=31536000` (+ `includeSubDomains`) per-rule |
| **TrustForwardedProtoHeaders** | YARP mặc định tự động thêm `X-Forwarded-*` headers. Có thể disable transform per-route nếu backend không tin cậy |
| **BlockCommonExploits** | Middleware inspect request trước YARP — Regex pattern cho SQL injection, XSS, path traversal → 403 nếu khớp |

### Enums
- `ProxyAccessMode`: Public, Private, Restricted, BasicAuth
- `ProxyRuleStatus`: Inactive, Active, Error
- `CertificateType`: Rsa, Ecdsa
- `AccessPolicyType`: IpAllowlist, GeoBlock, BasicAuth

## Current Status

### ✅ Implemented (Phase 0 — Foundation)
- [x] **Backend models**: FgReverseProxyRule, FgCertificate, FgAccessPolicy (`Namorix.Server.Models`)
- [x] **Migration**: `AddFgTables` — creates all 3 Fg_ tables with FKs + indexes
- [x] **AppDbContext**: relationships (Certificate 1:n, AccessPolicy 1:n, SetNull delete)
- [x] **apiRoutes**: `ApiFrontgateRoutes` (`/api/frontgate/reverse-proxy`)
- [x] **Frontend controller**: `frontgateController.listRules()` with pagination
- [x] **Backend controller**: `FrontgateController.ListRules` (GET, RequireAdmin, paginated)
- [x] **FrontgateReverseProxy UI**: NmxDataTable list, pagination, detail dialog, add dialog form
- [x] **NmxFormField**: `inline` prop added
- [x] **form.scss**: `.nmx-form-field--inline` style (flex-row, align-center)
- [x] **TrustedProxyMiddleware**: notification to admin when untrusted proxy blocked (SemaphoreSlim)

### ✅ Completed (Phase 0.5 — Schema hoàn thiện)
- [x] **Tách Destination**: `Destination` (string) → `DestinationScheme` + `DestinationHost` + `DestinationPort`
- [x] **Thêm fields**: WebSocketsSupport, CacheAssets, ForceSsl, Http2Support, HstsEnabled, HstsSubdomains, TrustForwardedProtoHeaders, AdditionalHeadersJson
- [x] **FgReverseProxyLocation model**: bảng con cho path-based sub-routing (Cascade delete)
- [x] **Migration**: `UpdateFgReverseProxyRule` — schema update
- [x] **Frontend interface**: cập nhật ReverseProxyRule trong frontgate.controller.ts

### 🔜 Phase 1 — Core Proxy
- [x] **FrontgateProxyConfigProvider**: `IProxyConfigProvider` đọc active rules từ DB, build clusters/routes với YARP transforms
- [x] **YARP DI registration**: `AddSingleton<FrontgateProxyConfigProvider>()`, `AddReverseProxy()`, singleton `IProxyConfigProvider`
- [x] **MapReverseProxy()**: `configureEndpoints` callback trong `UseNamorixCore`, Server register `endpoints.MapReverseProxy()` mà không cần Core reference YARP
- [x] **Frontgate CRUD API**: Create (POST), Read (GET list), Update (PUT), Delete (DELETE) — tất cả gọi `UpdateAsync()` sau khi save
- [x] **Frontend controller**: `createRule`, `updateRule`, `deleteRule` + `CreateReverseProxyRulePayload`
- [x] **NmxTabs component**: generic tab bar với controlled/uncontrolled pattern
- [x] **NmxFormRow**: flex row component cho form layout
- [x] **NmxFormField.rowFlex**: prop để set flex trong row
- [x] **NmxAlertDialog.flush** (`noSpacingBody`): tắt padding body dialog
- [x] **NmxAlertDialog.extraAction**: thêm `extraActionLabel` + `onExtraAction` cho nút phụ bên trái footer
- [x] **NmxSelect Floating UI migration**: chuyển từ native `<select>` sang custom div-based dropdown với `@floating-ui/react` (`useFloating`, `FloatingPortal`, `useClick`, `useDismiss`, `useListNavigation`), `renderOption` prop, keyboard nav
- [x] **NmxKeyValueEditor component**: key-value pair editor dạng bảng (Name + Value header, delete row), SCSS trong `@namorix/styles`
- [x] **Add dialog UI**: 4 tabs (General/Headers/Locations/Advanced), reset form, destination row layout
- [x] **General tab**: Source, Destination row, Certificate (None + Request new), Status, Force SSL
- [x] **Advanced tab**: gộp Features (WebSockets, Cache Assets, HTTP/2) + Security (HSTS + Subdomains, Trust Forwarded Proto, Block Common Exploits, Access select)
- [x] **Headers tab**: NmxKeyValueEditor với empty state, nút Add Header qua `extraAction` của dialog
- [x] **Status field**: formStatus state + statusOptions select (General tab)
- [x] **Certificate selector**: options gồm None + Request a new Certificate + real certs từ API
- [x] **BlockCommonExploits field**: thêm model, migration, API, frontend interface
- [x] **Certificate API**: `GET /api/frontgate/certificates` (paginated) + `GET /api/frontgate/certificates/all` (all) + `CertificateItem` interface + `listCertificates()` / `listAllCertificates()`
- [x] **i18n keys**: `certificate`, `certificatePlaceholder`, `certificateNone`, `certificateRequestNew`, `trustForwardedProto`, `headerName`, `headerValue`, `additionalHeaders`, `statusOptions`, `accessOptions`, `addHeader`, `emptyHeaders`, `headers`, `locations`, `addLocation`, `emptyLocations`
- [x] **Locations CRUD API**: backend xử lý `Locations` list trong CreateRule/UpdateRule, xóa cũ + thêm mới, Cascade delete
- [x] **Locations UI**: card-based sub-routing editor (path + delete row, scheme/host/port row) trong Locations tab riêng
- [x] **Additional Headers YARP transform**: backend deserial `AdditionalHeadersJson` + thêm RequestHeader transforms trong `FrontgateProxyConfigProvider`
- [x] **Form submit + validation**: `onConfirm` gọi `frontgateController.createRule()` với form data, client-side validation, error display
- [x] **Backend validation — FormatValidationRule.Trim**: thêm Trim property cho FormatValidationRule
- [x] **Backend validation — JsonValidationRule**: rule mới validate JSON string parse được, có MinLength/MaxLength
- [x] **Backend validation — CollectionValidationRule**: rule generic validate collection items qua ItemValidator delegate
- [x] **Backend validation — FrontgateRuleSchema**: schema với 7 fields (Source, DestinationHost, DestinationScheme, DestinationPort, Access, AdditionalHeadersJson, Locations)
- [x] **Backend validation — [Validate] attribute**: thêm lên CreateRule và UpdateRule
- [x] **Backend validation — Locations gộp vào 1 SaveChanges**: bỏ foreach riêng, gán rule.Locations navigation property
- [x] **Core — formatCustomError**: function với `codeMap` parameter lookup `err.code` → i18n key, returns `string | ApiError`
- [x] **Toast createPortal**: fix toast behind dialog overlay (stacking context với `contain: strict`)
- [x] **Edit dialog**: pre-filled form + `editingRule` state, gọi `frontgateController.updateRule()`, dialog title dynamic (addProxy/editProxy)
- [x] **Delete with confirmation**: nút delete + confirmation dialog, loading state
### 🔜 Phase 2 — Certificate & Infrastructure

Thư viện ACME: **Certes** (`Certes` NuGet) — giao tiếp với Let's Encrypt, xử lý challenge, cấp và renew cert.

**3 flow tạo cert riêng biệt** (tham khảo Nginx Proxy Manager), không gộp chung — mỗi flow dùng challenge/nguồn cert khác, code path riêng.

#### ✅ Done (Foundation)

- [x] **Port 80/443 binding**: optional Kestrel config (`ListenAnyIP(80)`, `ListenAnyIP(443)` với HTTPS), cần root/setcap, config qua env/appsettings
- [x] **ForceSsl redirect middleware**: middleware check per-rule ForceSsl, redirect 301 HTTP→HTTPS trước MapReverseProxy
- [x] **Self-signed certificate auto-generation**: `SelfSignedCertificateProvider` — tự gen PFX khi `HttpsPort > 0` mà không có `SslCertPath`
- [x] **DataBasePath centralization**: `AppConfig.DataBasePath` từ `appsettings.json`, dùng chung cho `DataDirectory`, `FlatFileStore`, cert storage
- [x] **Pipeline separation**: `UseWhen` branch — API port (5001) full pipeline (CORS/Auth/CSRF), proxy ports (5080/5443) only ForceSsl + YARP
- [x] **Custom proxy port response**: `MapFallbackToFile("frontgate.html")` — standalone landing page ở `frontend/public/frontgate.html`, dùng `nmx-card`, `nmx-meta-list`, `nmx-icon-box` từ theme system, cùng giao diện với desktop
- [x] **`FgCertificateStatus` enum + migration**: `Active`, `Pending`, `Error` lifecycle status
- [x] **`ListCertificates` API fix**: bỏ `.ToString()` — dùng `JsonStringEnumConverter(CamelCase)` global
- [x] **`NmxMenuButton` improvements**: `filterItem` prop, `React.Fragment key` fix, `divider` support, `getReferenceProps` compose pattern fix row click leak, `semantic` + icon on options
- [x] **Delete certificate API**: `DELETE /certificates/{id}` + frontend controller + confirm dialog + toast
- [x] **Certificate tab UI**: list cert (Domain, Issuer, Type, Status gộp InUse, ExpiresAt), action menu (Renew/Retry/Download/Delete), click row show detail dialog. i18n keys cho status values, inUse values, actions, feedback.
- [x] **Json enum serialization**: `JsonStringEnumConverter(CamelCase)` trong `AddNamorixCore` — tất cả enum serialize thành camelCase string
- [x] **Certificate endpoint split**: tách `ListCertificates` thành 2 endpoint riêng — `GET /certificates` (paginated, page ≥ 1) và `GET /certificates/all` (flat list), cập nhật `ApiFrontgateRoutes.certificatesAll` + frontend controller
- [x] **NmxLoadingOverlay createPortal**: fix z-index stacking context với `#root { contain: strict }` — dùng `createPortal` render ra `document.body`, cùng level với FloatingPortal dialogs/menus
- [x] **NmxFileInput component**: primitive file input với styled drop zone, icon thay đổi UPLOAD ↔ FILE_LINK, click anywhere mở file picker
- [x] **Certificate add dialogs UI**: 3 NmxAlertDialog (letsEncryptHttp, letsEncryptDns, custom) với form fields (domain, key type, dns provider, name, cert PEM upload), i18n keys, state management
- [x] **DnsProviders model**: class tĩnh với danh sách ~80 DNS provider, credential fields, `Implemented` flag, bỏ label (dùng i18n frontend)
- [x] **DNS providers API**: `GET /api/frontgate/dns-providers` trả về mảng id + `ApiFrontgateRoutes.dnsProviders` + `listDnsProviders()` controller + `en.json` labels cho từng provider
- [x] **`FgCertificateSource` enum**: `LetsEncryptHttp`, `LetsEncryptDns`, `Custom` — không lẫn với `CertificateType` (Rsa/Ecdsa là key algorithm)
- [x] **3 POST certificate endpoints**: `POST /certificates/letsencrypt-http`, `POST /certificates/letsencrypt-dns`, `POST /certificates/custom` + request records + frontend routes + controller functions
- [x] **Certificate file storage**: bỏ `PrivateKeyEncrypted`/`CertificateChain` khỏi DB — PEM files lưu disk qua `DataDirectory.WriteFile()`, không lưu path trong DB (tự suy từ domain đầu tiên: `certs/{primaryDomain}/privkey.pem`, `certs/{primaryDomain}/fullchain.pem`)
- [x] **en.json dnsProviders**: ~80 DNS provider labels
- [x] **en.json dialogs**: title, confirm, info, placeholder keys cho 3 cert dialogs

#### ✅ Schema Changes

- [x] **`FgCertificateSource` enum** — đã implement
- [x] **`FgCertificates.DnsProviderId`** — đã thêm field
- [x] **Bỏ `PrivateKeyEncrypted`/`CertificateChain`** — chuyển sang file-based storage
- [x] **Multi-domain support**: bảng `FgCertificateDomains` (Id, Domain, CertificateId FK, Index trên Domain). FK Cascade delete. Query SNI: `SELECT CertificateId FROM FgCertificateDomains WHERE Domain = @sniHost` — O(log n). Domain đầu tiên là primary dùng để derive cert file path. `FgReverseProxyRule.Source` giữ nguyên (không FK).

#### ✅ UI & Integration Polish

- [x] **Multi-domain bảng riêng**: `FgCertificateDomain` model + migration + FK Cascade delete + Index trên Domain
- [x] **Backend API unused-domains**: `GET /certificates/unused-domains` — lấy reverse proxy domains chưa gán cert
- [x] **Frontend listUnusedDomains**: `nmxHttp` pattern + `ApiFrontgateRoutes.certificateUnusedDomains`
- [x] **NmxTagInput suggestions**: fix dropdown chỉ hiện khi có input → show all suggestions on focus, bỏ `input ?` guard
- [x] **NmxTagInput empty tag fix**: `useState<string[]>([""])` → `useState<string[]>([])` — xóa tag rỗng
- [x] **NmxDataTable zebra striping**: `nth-child(even)` background với `color-mix`
- [x] **NmxDataTable rowCellSpacing**: prop `rowCellSpacing?: NmxSpacing` + `cxSpacing` + SCSS spacing modifiers qua `sizes` mixin
- [x] **NmxSelect ReactNode label**: label type `string | React.ReactNode`, render JSX trực tiếp (không function)
- [x] **Circular reference fix**: `ReferenceHandler.IgnoreCycles` trong `ServiceCollectionExtensions.cs`
- [x] **ExpiresAt display fix**: `renderExpiry` kiểm tra `status` — chỉ active mới hiện date, pending/error hiển thị "—"
- [x] **Cert selector reverse proxy**: `c.domain` → JSX domain list, dùng `c.domains?.map` render inline spans
- [x] **createdAt API**: thêm `createdAt = c.CreatedAt` vào 2 projection certificates + certificates/all
- [x] **createdAt interfaces**: thêm `createdAt: string` vào `CertificateItem` + `ReverseProxyRule`
- [x] **createdAt i18n**: thêm `"createdAt": "Created"` cho cả `reverseProxy.fields` và `certificate.fields`
- [x] **createdAt UI**: column createdAt trong Certificate table + meta item trong detail dialog
- [x] **UTC parse fix**: `formatDateTime`/`formatTimestamp` dùng `parseUTCDate` thay vì `new Date(input)` — fix timezone sai khi backend gửi ISO string không có Z

#### 🔨 Let's Encrypt via HTTP (HTTP-01)

- [ ] **ACME challenge middleware**: serve `.well-known/acme-challenge/{token}` trên proxy port, đặt trước ForceSslMiddleware (tránh redirect HTTPS)
- [ ] **Domain validation**: DNS lookup confirm domain trỏ đúng IP Frontgate trước khi gọi Certes, cảnh báo nếu chưa đúng
- [ ] **Wildcard reject**: validate input, reject `*.` domain ở flow này
- [ ] **Dry-run test**: nút "Test" ở UI = dry-run challenge trước khi Save, tránh burn Let's Encrypt rate-limit

#### 🔨 Let's Encrypt via DNS (DNS-01)

- [ ] **`IDnsProvider` interface**: `CreateTxtRecordAsync(domain, token)` / `DeleteTxtRecordAsync(domain, token)`
- [ ] **`CloudflareDnsProvider`**: implement đầu tiên (dùng API token, không dùng Global API Key)
- [ ] **Certes DNS-01 flow**: tạo challenge → gọi `CreateTxtRecordAsync` → chờ propagation → verify → cleanup
- [ ] **Wildcard allowed**: chỉ flow này cho phép `*.domain.com` — validate input cho phép wildcard

#### 🔨 Custom Certificate (Upload)

- [x] **NmxFileInput component**: primitive file input, click area mở file picker, icon UPLOAD ↔ FILE_LINK
- [x] **PEM file storage**: `DataDirectory.WriteFile()` ghi `certs/{name}/privkey.pem` + `fullchain.pem`
- [x] **Cert validation via `X509Certificate2.CreateFromPem()`**: parse PEM, auto check key match, expiry, passphrase (throw `CryptographicException` nếu invalid). Gộp chung keypair validation + passphrase reject + expiry check.
- [x] **File size limit**: max 64KB per field trước khi parse, chặn DoS/file giả dạng
- [x] **Auto-generate filename**: dùng domain name, không dùng filename gốc từ upload (tránh path traversal)
- [x] **Auto-renew toggle**: `NmxToggle` ở 2 dialog LE (http + dns), mặc định `true`. Custom cert không có auto-renew.

#### ✅ Remaining (Wire up)

- [x] **Wire 3 onConfirm handlers**: gọi API tương ứng, then/catch/finally với nmxToast + fetchCerts
- [x] **en.json**: thêm 6 keys `dialogs.letsEncryptHttp.success/error`, `letsEncryptDns.success/error`, `custom.success/error`
- [x] **Controller inject `DataDirectory`**: sửa primary constructor `FrontgateController(AppDbContext db, DataDirectory dataDir)`

#### 🔨 Auto-renew Worker & SNI

- [ ] **Renew worker**: `IHostedService` chạy daily, check cert `AutoRenew = true` và `ExpiresAt < now + 30 days`. Gọi lại đúng flow (HTTP-01/DNS-01) theo `Source` gốc
- [ ] **Kestrel SNI binding**: `ServerOptionsSelectionCallback` (async) — query DB theo SNI hostname, fallback self-signed cert nếu không match
- [x] **Certificate tab UI**: list cert (Domain, Issuer, Type, Status gộp InUse, ExpiresAt), action menu (Renew/Download/Delete), click row show detail dialog. `NmxMenuButton` với `getReferenceProps` compose pattern fix row click leak. i18n keys cho status values, inUse values, actions.

### 🔜 Phase 3 — Access Control
- [ ] IP Allowlist/Denylist (qua AccessPolicy)
- [ ] Geo-block via MaxMind GeoIP2 .NET
- [ ] HTTP Basic Auth
- [ ] **Self-lockout prevention**: simulate request từ admin IP trước khi save, chặn nếu rule mới khóa mất admin
- [ ] **Dry-run mode**: apply rule set tạm thời, tự rollback sau N giây nếu admin không confirm
- [ ] Frontgate UI: Access tab (manage policies)

### 🔜 Phase 4 — Advanced Features
- [ ] TCP/UDP Stream forwarding (non-HTTP addon)
- [ ] Redirection Hosts (301/302)
- [ ] 404 Default Host
- [ ] Custom Error Pages (502/503 per rule)
- [ ] Audit log (ai sửa rule gì, lúc nào)
- [ ] 2FA (TOTP) cho Frontgate admin

### 🔜 Phase 5 — Edge Cases
- [ ] Docker addon expose port tự động update rule
- [ ] Rate limiting per rule
- [ ] Health check backend per rule
- [ ] Metrics + real-time traffic stats
