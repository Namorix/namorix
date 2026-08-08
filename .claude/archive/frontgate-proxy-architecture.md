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
| `FgReverseProxyRules` | Id, Source, DestinationScheme, DestinationHost, DestinationPort, CertificateId (FK), Access, AccessPolicyId (FK), WebSocketsSupport, CacheAssets, ForceSsl, Http2Support, HstsEnabled, HstsSubdomains, TrustForwardedProtoHeaders, AdditionalHeadersJson, Status, DryRunExpiresAt, DryRunSnapshotJson, CreatedAt, UpdatedAt | ✅ |
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

| Flag | Implementation |
|------|----------------|
| **WebSocketsSupport** | `BlockWebSocketMiddleware` — block `Upgrade: websocket` 426 nếu flag false (YARP tự xử lý upgrade). Tra cứu per-rule qua `WebSocketSources` dictionary |
| **ForceSsl** | `ForceSslMiddleware` — redirect 301 HTTP→HTTPS. Tra cứu per-rule qua `ForceSslSources` |
| **CacheAssets** | YARP `ResponseHeader` transform: `Cache-Control: public, max-age=86400` |
| **Http2Support** | YARP `HttpRequest.Version` + `VersionPolicy` per-rule |
| **HstsEnabled / HstsSubdomains** | `HstsMiddleware` — `Strict-Transport-Security` header. Tra cứu per-rule qua `HstsSources` + `HstsSubdomainSources` |
| **TrustForwardedProtoHeaders** | YARP mặc định auto-add X-Forwarded-* (chưa có per-rule toggle) |
| **BlockCommonExploits** | `BlockCommonExploitsMiddleware` — Regex SQLi/XSS/path traversal → 403. Tra cứu per-rule qua `BlockExploitSources` |
| **AdditionalHeadersJson** | YARP `RequestHeader` transform — deserialize JSON, mỗi key-value thành 1 transform |

### Enums
- `ProxyAccessMode`: Public, Private, Restricted, BasicAuth
- `ProxyRuleStatus`: Inactive, Active, Error
- `CertificateType`: Rsa, Ecdsa
- `AccessPolicyType`: IpAllowlist, GeoBlock, BasicAuth, IpDenylist

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
- [x] **Certificate add dialogs UI**: 3 NmxAlertDialog (letsEncryptHttp, letsEncryptDns, custom) — **giờ còn 2** (letsEncryptDns đã bỏ khi drop DNS-01)
- [x] **DnsProviders model**: class tĩnh ~80 provider + `Implemented` flag — **ĐÃ XOÁ** (drop DNS-01), thay bằng `IDnsProvider`/`DnsProviderInfo` (giờ cũng đã bỏ)
- [x] **DNS providers API**: `GET /api/frontgate/dns-providers` + `listDnsProviders()` — **ĐÃ XOÁ** (drop DNS-01)
- [x] **`FgCertificateSource` enum**: `LetsEncryptHttp`, `LetsEncryptDns`, `Custom` — **giờ còn 2** (`LetsEncryptDns` đã bỏ khi drop DNS-01)
- [x] **3 POST certificate endpoints**: letsencrypt-http, letsencrypt-dns, custom — **giờ còn 2** (letsencrypt-dns đã bỏ)
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

**Cơ chế async task (đã chọn — Option A):** POST `/certificates/letsencrypt-http` chỉ validate + tạo cert `Pending` + enqueue ACME task → return ngay (không block UI). Background worker chạy toàn bộ flow Certes (order → nhận token → lưu challenge → chờ LE verify → finalize → set `Active`/`Error` + lưu PEM). Frontend nhận SignalR status push để refresh — giống pattern `AddonTaskQueue`/`AddonTaskExecutor` sẵn có. Lý do: HTTP-01 mất 5-30s (chờ LE callback), block request dễ timeout và UX tệ khi thất bại. `FgCertPendingResetWorker` hiện có (Pending → Error khi restart) là safety net.

- [x] **ACME challenge middleware**: `AcmeChallengeMiddleware` serve `.well-known/acme-challenge/{token}` trên proxy port, đặt trước `ForceSslMiddleware` (tránh redirect HTTPS). Serve token từ store, 404 nếu không tồn tại. Đăng ký đầu pipeline proxy trong `Program.cs`.
- [x] **Challenge token storage**: `AcmeChallengeStore` — singleton in-memory `ConcurrentDictionary<string, string>` (token → keyAuthorization), Add/TryGet/Remove. Worker Add **trước** `Validate()`, Remove sau khi LE verify xong.
- [x] **ACME worker**: `AcmeCertQueue` — `BackgroundService` theo pattern `AddonTaskQueue`: `Channel<string>` (bounded 50) + `SemaphoreSlim(2, 2)`, nhận certId → scope → Certes HTTP-01 flow (NewOrder → Authorizations → `auth.Http()` → store.Add(token, `KeyAuthz`) → Validate + poll 60s → store.Remove → `order.Generate(csr, certKey)` → `chain.ToPem(certKey)` + `certKey.ToPem()` → `WriteFile` `certs/{primary}/privkey.pem` + `fullchain.pem` → `ExecuteUpdateAsync` set Active + ExpiresAt + Issuer). Fail → set Error. Account key persist `pki/acme-account.key`. Dùng chung cho HTTP-01/DNS-01/auto-renew.
- [x] **Certes integration**: `Directory.Packages.props` thêm `<PackageVersion Include="Certes" Version="3.0.4" />`, csproj thêm `PackageReference`. DI: `AddSingleton<AcmeCertQueue>` + `AddHostedService`. (API verify từ chính XML doc 3.0.4: `KeyAuthz` property, `order.Generate(csrInfo, key)`, `chain.ToPem(key)`.)
- [x] **Controller wiring**: inject `AcmeCertQueue`, `CreateLetsEncryptCert` gọi `certQueue.EnqueueAsync(cert.Id)` sau SaveChanges (id do server sinh mỗi POST — không có đường FE gửi trùng id; worker guard `Status == Pending` chống enqueue trùng idempotent).
- [x] **Dedup + validation**: `CERT_ALREADY_EXISTS` (chặn Pending/Active cùng primary domain) + `FrontgateCertSchema` (`[Validate]`): domain non-empty / format regex / wildcard reject (`WILDCARD_NOT_ALLOWED`), keyType chỉ `rsa`/`ecdsa`. Guard `CERT_DOMAINS_REQUIRED` chặn `.First()` 500 khi domains rỗng. FE: 2 error code mới (`CERT_DOMAINS_REQUIRED`, `WILDCARD_NOT_ALLOWED`) + i18n en.json. Schema chỉ áp dụng HTTP-01 (DNS-01 sẽ cần schema riêng cho phép wildcard).
- [x] **Domain validation — DNS lookup** ✅ 2026-08-06: `DnsLookupChecker` — resolve A record (IPv4) từng domain so với public IP server (**reuse `IPublicIpDetector`** thay vì `AppConfig.FrontgatePublicIp` override — khác spec gốc), trả `DryRunWarning(Domain, ResolvedIps[], ServerIp)` khi lệch/no A record; IP detect fail → bỏ qua im lặng. Gắn vào dry-run (`TestLetsEncryptHttp` trả `warnings[]`).
- [x] **Dry-run test** ✅ 2026-08-06: nút "Test" ở UI = `POST /certificates/letsencrypt-http/dry-run` — `AcmeDryRunService` chạy **staging flow**: account key riêng `pki/acme-staging-account.key` (không trộn prod, `NewAccount(null, true)` khi key mới), NewOrder qua `LetsEncryptStagingV2` → `auth.Http()` → `challengeStore.Add(token, KeyAuthz)` → `challenge.Validate()` → **dừng ở challenge, không finalize/Generate**. Sau mỗi lần validate (cả success lẫn fail) `challengeStore.Remove(token)` (trong `finally`). Timeout 60s → `passed: false`. Response: `{ passed, message?, warnings[] }` (warnings từ `DnsLookupChecker`). `CreateLetsEncryptDryRunRequest(Domains)` — **bỏ `KeyType`** (dry-run không Generate nên keyType thừa). FE: `frontgate.controller.testLetsEncryptHttp` + `onExtraAction={handleTestLetsEncrypt}` (disable khi chạy) + i18n `testSuccess`/`testError`/`testWarning`.
- [x] **SignalR cert status push**: ✅ 2026-08-07 — `IFrontgateNotifier` → `SignalRFrontgateNotifier` send via `Clients.Group("frontgate")`; `MainHub.SubscribeFrontgate`/`UnsubscribeFrontgate`; frontend `useServerSignalRGroup` + `useServerSignalREvent` → auto-refresh list when cert Pending→Active/Error
- [x] **Retry flow**: ✅ 2026-08-07 — `POST /certificates/{id}/retry` → set Pending → re-enqueue; frontend `handleAction("retry")` → `retryCertificate()` → toast; error code `CertNotRetriable`; i18n `retrySuccess`/`retryError`
- [x] **ACME account registration**: ✅ 2026-08-07 — `NewAccount(contacts: [mailto:{adminEmail}], true)` — lấy email từ admin user đầu tiên, idempotent
- [x] **useActiveTab refetch**: ✅ 2026-08-07 — `FrontgateCertificate` + `FrontgateReverseProxy` gọi `useActiveTab()` trong `useEffect` → refetch khi chuyển tab
- [x] **ProxyTrafficMiddleware**: ✅ 2026-08-07 — middleware bọc toàn bộ proxy pipeline (port 80/443), log traffic vào `TrafficBuffer` giống `TrafficMonitorFilter` nhưng dùng ASP.NET middleware (không phải MVC filter) — capture ACME challenge, YARP forward, static files. `CountingStream` + `Stopwatch` cho duration + response size.
- [x] **DeleteCertificate xóa file PEM**: ✅ 2026-08-07 — `DELETE /certificates/{id}` giờ Include domains, xóa `certs/{name}/privkey.pem` + `certs/{name}/fullchain.pem` qua `DataDirectory.DeleteFile()` trước khi Remove DB record.
- [x] **DataDirectory constants**: ✅ 2026-08-07 — `CertDir = "certs"`, `PrivateKeyFile = "privkey.pem"`, `FullChainFile = "fullchain.pem"`, `DeleteFile(subPath)`, `CertPath(certName)`. Thay toàn bộ hardcode string `certs/`/`privkey.pem`/`fullchain.pem` trong `AcmeCertQueue`, `CreateCustomCert`, `DeleteCertificate`.
- [x] **Add rule + request cert flow**: ✅ 2026-08-07 — `CERT_REQUEST_NEW` gửi `undefined` lên backend (tránh FK error), frontend fire-and-forget `createLetsEncryptCert()` sau khi create rule thành công. Rule luôn được tạo, cert fail → toast riêng không ảnh hưởng rule.
- [x] **CreateRule/UpdateRule RequestCert**: ✅ 2026-08-07 — `CreateRuleRequest.RequestCert` (bool). Backend xử lý atomic trong cùng 1 SaveChanges: tạo cert Pending → gán CertificateId cho rule → enqueue ACME. UpdateRule cũng có logic tương tự.
- [x] **SSL column + cert status trong ReverseProxy**: ✅ 2026-08-07 — backend trả `certStatus` trong ListRules (JOIN `FgCertificates`), frontend hiển thị badge với `getStatusSemantic`. `FrontgateReverseProxy` lắng nghe `FrontgateCertStatusChanged` SignalR event để refresh khi cert chuyển status.

#### ❌ Let's Encrypt via DNS (DNS-01) — DROPPED (2026-08-06)

Quyết định bỏ — DNS-01 hiếm dùng, cần credential/zone per provider, chi phí maintain cao so với lợi ích. Đã gỡ: `IDnsProvider`/`CloudflareDnsProvider`/`DnsProviderResolver`/`DnsProviderServiceCollectionExtensions`, `AcmeDryRunService.RunDnsAsync` + `WaitForTxtRecordAsync`, `POST /certificates/letsencrypt-dns/dry-run`, dialog FE `letsEncryptDns`, `createLetsEncryptDnsCert`, `listDnsProviders`, enum `FgCertificateSource.LetsEncryptDns`, FE type union `letsEncryptDns`, catalog static `DnsProviders` (danh sách dưới đây giữ làm reference).

**Giữ lại (chưa gỡ):** column `FgCertificate.DnsProviderId` — harmless, drop khi làm migration tổng thể sau này.

**Provider list (reference nếu sau này đổi ý):**

| Provider | Credential fields |
|----------|-------------------|
| cloudflare | apiToken (secret) |
| route53 | accessKeyId, secretAccessKey, region?, hostedZoneId? |
| digitalocean | authToken (secret) |
| godaddy | apiKey, apiSecret |
| azuredns | tenantId, clientId, clientSecret, subscriptionId?, resourceGroup? |
| gcloud | project, serviceAccountFile |
| namecheap | apiUser, apiKey |
| acme-dns | apiBase |

Backlog (chưa có schema): active24, akamai-edgedns, aliyun, arvancloud, baidu, beget, bunny, cdmon, cloudns, cloudxns, constellix, corenetworks, cpanel, ddnss, desec, directadmin, dnsmadeeasy, dnsimple, dnsmulti, dnspod, dode, domeneshop, duckdns, dynu, easydns, eurodns, firstdomains, freedns, gandiv5, gcore, glesys, googledomains, hetzner, hetznercloud, hostingnl, hover, hurricane, hurricane-ddns, infomaniak, inwx, ionos, ispconfig, isset, joker, leaseweb, linode, loopia, luadns, mc-host24, netcup, nicru, njalla, ns1, oraclecloud, ovh, plesk, porkbun, pdns, regru, rfc2136, rockenstein, selectelv2, simply, spaceship, strato, tencentcloud, timewebcloud, transip, vultr, websupport, wedos, zoneedit

#### 🔨 Custom Certificate (Upload)

- [x] **NmxFileInput component**: primitive file input, click area mở file picker, icon UPLOAD ↔ FILE_LINK
- [x] **PEM file storage**: `DataDirectory.WriteFile()` ghi `certs/{name}/privkey.pem` + `fullchain.pem`
- [x] **Cert validation via `X509Certificate2.CreateFromPem()`**: parse PEM, auto check key match, expiry, passphrase (throw `CryptographicException` nếu invalid). Gộp chung keypair validation + passphrase reject + expiry check.
- [x] **File size limit**: max 64KB per field trước khi parse, chặn DoS/file giả dạng
- [x] **Auto-generate filename**: dùng domain name, không dùng filename gốc từ upload (tránh path traversal)
- [x] **Auto-renew toggle**: `NmxToggle` ở dialog LE http (DNS-01 đã bỏ), mặc định `true`. Custom cert không có auto-renew.

#### ✅ Remaining (Wire up)

- [x] **Wire 3 onConfirm handlers**: gọi API tương ứng, then/catch/finally với nmxToast + fetchCerts
- [x] **en.json**: thêm 6 keys `dialogs.letsEncryptHttp.success/error`, `letsEncryptDns.success/error`, `custom.success/error`
- [x] **Controller inject `DataDirectory`**: sửa primary constructor `FrontgateController(AppDbContext db, DataDirectory dataDir)`

#### 🔨 Auto-renew Worker & SNI

- [x] **Renew worker**: ✅ 2026-08-07 — `FgCertRenewWorker` BackgroundService, chạy daily, check cert `AutoRenew=true` + `ExpiresAt < now+30 days` → set Pending → `certQueue.EnqueueAsync()`. Pattern theo `BcnCheckWorker`.
- [x] **Renew UI + endpoint**: ✅ 2026-08-07 — `POST /certificates/{id}/renew` + `frontgateController.renewCertificate()` + handleAction "renew" với toast.
- [x] **Kestrel SNI binding**: ✅ 2026-08-07 — `ServerOptionsSelectionCallback` đọc file cert trực tiếp từ `certs/{sni}/privkey.pem` + `fullchain.pem` qua `CreateFromPemFile`, fallback về self-signed cert. Không cần DI, không cần DB query.
- [x] **Certificate tab UI**: list cert (Domain, Issuer, Type, Status gộp InUse, ExpiresAt), action menu (Renew/Download/Delete), click row show detail dialog. `NmxMenuButton` với `getReferenceProps` compose pattern fix row click leak. i18n keys cho status values, inUse values, actions.
- [x] **RewriteRedirectLocationMiddleware**: ✅ 2026-08-07 — rewrite response `Location` header từ internal IP → public domain (host:port). Đặt trong proxy pipeline, sau AcmeChallenge, trước ForceSsl.
- [x] **Pipeline fix**: ✅ 2026-08-07 — `UseApiErrorHandling` + `UseSecurityHeaders` chuyển vào `UseWhen` cho API port (5001), tránh can thiệp proxy ports gây lỗi 415 UNSUPPORTED_MEDIA_TYPE.
- [x] **YARP log level**: ✅ 2026-08-07 — raise `Yarp` → Warning, `HttpForwarder` → Error trong appsettings, bỏ noise log proxying per-request.
- [x] **Locations sub-routing**: ✅ 2026-08-07 — `FrontgateProxyConfigProvider` build routes riêng cho từng location, match `Path` + `Hosts`, cluster destination riêng. Fix `abstract record` → `record` cho `LocationRequest`. Path pattern `/{**catch-all}`.

### 🔜 Phase 3 — Access Control

#### ✅ Backend Done (2026-08-07)

- [x] **IP Allowlist/Denylist**: `AccessPolicyType.IpAllowlist`/`IpDenylist` qua `FgAccessPolicy` — `FrontgateAccessService.Evaluate` (allowlist match→Allow, denylist match→Deny)
- [x] **Geo-block via MaxMind GeoIP2**: `MaxMind.GeoIP2` 6.1.0 + `GeoIpService` singleton (lazy-load mmdb, path tương đối theo `DataBasePath`), fail-open khi thiếu file/IP không tìm thấy
- [x] **HTTP Basic Auth**: hash BCrypt khi save (`AccessPolicyController.HashBasicAuthPassword`), verify trong `Evaluate`, 401 + `WWW-Authenticate: Basic realm="{host}"` từ `AccessControlMiddleware`, fail-closed
- [x] **Self-lockout prevention**: `ValidatePolicyAsync` simulate request từ admin IP (`GetAdminIp` từ `HttpContextKeys.RealIp`) trước khi save → `FG_POLICY_LOCKS_OUT_ADMIN` (bỏ qua rule Inactive + BasicAuth)
- [x] **Dry-run mode**: `CreateRuleRequest.DryRun` → rule Status=Active + `DryRunExpiresAt` (apply thật), `FgDryRunRollbackWorker` tự rollback sau `Frontgate:DryRunSeconds` nếu không confirm, `POST {id}/dry-run/confirm` + `{id}/dry-run/cancel`, snapshot qua `FgRuleSnapshot` (Create + Update)
- [x] **Policy infra**: `AccessSources` cache trong `FrontgateProxyConfigProvider` + `UpdateAsync()` sau mọi CRUD rule/policy — bỏ DB query per-request trong `AccessControlMiddleware`

- [x] **Frontend UI: Access tab** ✅ 2026-08-07 (implemented, **chờ test** ngày 08-08) — `FrontgateAccessPolicy.tsx`: DataTable + dialog add/edit theo 4 loại policy (ipAllowlist/ipDenylist/geoBlock = textarea lines → JSON array; basicAuth = username+password → JSON, edit để trống password giữ hash cũ nhờ `HashBasicAuthPassword` skip prefix `$2b$`). Nối C2 dry-run: toggle → `payload.dryRun`, column countdown (tick 1s, `formatDryRunRemaining`) + nút Apply/Cancel gọi `confirmDryRun`/`cancelDryRun`. i18n en.json: `pages.accessPolicy.*` + `reverseProxy.dryRun.*`, SCSS `__dryrun`.
  - ✅ **Fix stale closure** 2026-08-07: `formDryRun` đã thêm vào deps `handleConfirm` (FrontgateReverseProxy.tsx:463) — toggle giờ áp dụng đúng khi save.

#### ✅ Phase 3b — Reverse Proxy UX hoàn thiện (2026-08-07)

- [x] **NmxMenuButton action menu**: thay nút Delete cuối row bằng `NmxMenuButton` (MENU_VERTICAL trigger) — options Confirm dry-run / Cancel dry-run / Edit / Delete, `filterItem` chỉ hiện 2 mục dry-run khi `isDryRunActive`, `dividerIndexes` top-divider trước Edit + Delete.
- [x] **Dry-run minute select**: form General tab thêm select 1P/5P/10P → `payload.dryRunMinutes`; backend `CreateRuleRequest.DryRunMinutes` (default 1) + `ResolveDryRunSeconds(minutes)` (1|5|10 → ×60, else 60) thay hằng `_dryRunSeconds`.
- [x] **Info dialog on row click**: click row → `NmxAlertDialog` "Proxy info" hiện Source/Destination/Access/Status/Created at/dry-run countdown qua `NmxMetaList`, nút Apply chỉ hiện khi còn active (`confirmShouldRender`).
- [x] **`isDryRunActive` + JS countdown fix**: helper `expiresAt != null && new Date(expiresAt) > now`, tick 1s — cột + dialog + menu cùng dùng, hết hạn hiển thị "—".
- [x] **UTC timezone fix**: `UtcDateTimeJsonConverter` (JsonConverter<DateTime>, Unspecified→Utc) đăng ký global trong `AddJsonOptions` — hết serialized thiếu `Z` (SQLite mất `DateTimeKind`) → `new Date("...Z")` parse đúng UTC.

#### ✅ Frontend Reverse Proxy tab UX (2026-08-07)

- [x] **Row action menu** ✅ 2026-08-07 — cột action cuối chuyển thành `NmxMenuButton` (trigger `MENU_VERTICAL` + `arrowDisabled`): Confirm dry-run (CHECK/success), Rollback dry-run (UNDO/warning), Edit (EDIT), Delete (DELETE/error). Dùng `filterItem` để ẩn/hiện 2 mục dry-run theo `isDryRunActive(row.dryRunExpiresAt, now)`; `dividerIndexes` top-trước Edit + Delete.
- [x] **Info dialog on row click** ✅ 2026-08-07 — click row → `NmxAlertDialog` "Proxy info" hiện Source / Destination / Access / Status / Created at (`createdTime`) / dry-run countdown qua `NmxMetaList`; nút Apply dry-run chỉ render khi dry-run còn active (`confirmShouldRender`).
- [x] **Dry-run duration select** ✅ 2026-08-07 — General tab chọn 1P/5P/10P → `payload.dryRunMinutes`; backend `CreateRuleRequest.DryRunMinutes = 1` + `ResolveDryRunSeconds(minutes)` (1|5|10 → *60, else 60) thay hằng `_dryRunSeconds` ở Create + Update.
- [x] **Countdown expiry fix** ✅ 2026-08-07 — `isDryRunActive(expiresAt, now)` (expiresAt != null && > now) dùng chung badge/menu/info dialog — hết đếm ngược "00:00" ngay sau khi hết hạn; cột dry-run hiển thị "—" khi inactive.
- [x] **UTC serialization fix** ✅ 2026-08-07 — `Namorix.Core/Helpers/UtcDateTimeJsonConverter.cs` (`JsonConverter<DateTime>`: Unspecified → treat as UTC, Write → `DateTime.SpecifyKind` Utc) đăng ký global trong `AddJsonOptions` (`options.JsonSerializerOptions.Converters.Add`). SQLite + EF Core mất `DateTimeKind` (Unspecified) → serializer trước đây xuất thiếu `Z` (`2026-08-07T14:12:35.775856`) → `new Date()` parse nhầm local (+7h). Giờ xuất `...Z` → countdown chạy đúng.

#### ✅ SignalR realtime — rule/dry-run changed (2026-08-08)

- [x] **2 SignalR event mới**: `frontgate:rule-changed` (created/updated/deleted) + `frontgate:dry-run-changed` (confirm/cancel/expire) — khai báo trong `Constants/ServerSignalR.cs` (backend) + `src/signalr/constants.ts` (frontend).
- [x] **Enum → lowercase string**: `SignalRFrontgateNotifier` dùng `action.ToString().ToLowerInvariant()` (dạng named member `action = ...` — projection `new { action.ToString().ToLowerInvariant() }` gây lỗi CS0828). **Lý do:** SignalR protocol serializer (`AddJsonProtocol`) không dùng `JsonStringEnumConverter` của MVC `AddJsonOptions` → enum serialize thành **số** (0/1/2). Cùng fix cho `status` trong `NotifyCertStatusChanged`.
- [x] **Notifier wiring**: `ReverseProxyController` inject `IFrontgateNotifier` — gọi `NotifyRuleChanged` sau Create/Update/Delete rule, `NotifyDryRunChanged` sau Confirm/Cancel dry-run. `FgDryRunRollbackWorker` gọi `NotifyDryRunChanged(Expire)` sau rollback.
- [x] **Frontend subscribe + refresh**: `FrontgateReverseProxy` đã subscribe group `frontgate` (`useServerSignalRGroup`); thêm `useServerSignalREvent` cho cả 2 event → gọi `refresh()` refetch list.
- [x] **fetchRules trả `items`**: bỏ pattern `.then()` detached (chuỗi `.finally()` nuốt rejection → `.catch(setError)`/`.catch(nmxToast.error)` không bao giờ chạy), chuyển `await` + `return res.items` → `Promise<ReverseProxyRule[]>`.
- [x] **Dialog sync khi thay đổi ngoài**: `handleRuleChanged` — nếu rule đang mở info/edit bị xóa ngoài → đóng dialog + toast `ruleDeletedExternally` kèm `{{source}}` (lấy từ `infoRule?.source`/`editingRule?.source`); mọi change → `refresh()` sync lại `infoRule` theo id (find → null nếu đã xóa). Chỉ `deleted` mới đóng dialog, `created`/`updated` chỉ refresh.

#### 🚫 SignalR realtime — không làm (bỏ 2026-08-08)

- [x] ~~Toast create/update/delete kèm source~~ — user thấy dài dòng, bỏ. Toast chỉ có `ruleDeletedExternally` (đã kèm `{{source}}`) + `deleteConfirm` (đã có sẵn).
- [x] **Gỡ `"create"` khỏi `FrontgateDryRunAction`** ✅ 2026-08-08 — FE union giờ `"confirm" | "cancel" | "expire"`, khớp backend `FgDryRunAction { Confirm, Cancel, Expire }`.

#### ✅ SignalR realtime — cert changed (2026-08-08)

- [x] **`FgCertAction` enum + `frontgate:cert-changed` event**: `FgCertAction { Created, Updated, Deleted }` trong `Constants/Frontgate.cs`; `FrontgateCertChanged = $"{ServerSignalRGroups.Frontgate}:cert-changed"` trong `Constants/ServerSignalR.cs` (backend) + `src/signalr/constants.ts` (frontend).
- [x] **Notifier wiring**: `IFrontgateNotifier.NotifyCertChanged(certId, FgCertAction)` + implementation trong `SignalRFrontgateNotifier` (cùng pattern `action = action.ToString().ToLowerInvariant()`). `CertificateController` inject `IFrontgateNotifier` — gọi `NotifyCertChanged(Deleted)` trong `DeleteCertificate` sau khi Remove + SaveChanges.
- [x] **Frontend subscribe + refresh**: `FrontgateCertificate` thêm `useServerSignalREvent<FrontgateCertChangedPayload>` → mọi change refetch list.
- [x] **Dialog sync khi xóa ngoài**: listener chỉ check `selectedCert?.id` (info dialog — **không** check `deletingCert` để tránh false-fire toast khi chính mình xóa, SignalR event có thể tới trước khi local `.then()` clear state) — cert đang mở info bị xóa ngoài → đóng dialog + toast `deletedExternally` kèm `{{domain}}` (từ `selectedCert?.domains?.[0]`); `created`/`updated` chỉ refresh.
- [x] **fetchCerts trả `items`**: cùng fix `.then()` detached (`.finally()` nuốt rejection) → `await` + `return res.items` (`Promise<CertificateItem[]>`).
- [x] **en.json**: `"deletedExternally": "Certificate **{{domain}}** was deleted by another session"` trong `pages.certificate.feedback`.

#### ✅ Access control fixes + policy selector (2026-08-08)

- [x] **IPv4-mapped IPv6 normalize**: `FrontgateAccessService.Evaluate` đầu method `if (clientIp.IsIPv4MappedToIPv6) clientIp = clientIp.MapToIPv4();` — fix denylist/allowlist/Private mode không bao giờ match (`::ffff:27.67.212.166` vs `27.67.212.166` string/byte-length lệch). `NetworkHelper.ToDisplayString` (`Namorix.Core/Helpers`) normalize IP cho traffic/log/notification (hết tiền tố `::ffff:`). Dùng ở `TrafficMonitorFilter`, `ProxyTrafficMiddleware`, `TrustedProxyMiddleware` (notification). `AccessControlMiddleware` bỏ debug `Console.WriteLine`, truyền thẳng `IPAddress` cho `Evaluate` tự normalize.
- [x] **BasicAuth `rulesJson` camelCase storage**: `FrontgateAccessService.SerializerOptions` (`PropertyNamingPolicy = CamelCase` + `PropertyNameCaseInsensitive = true`) — `AccessPolicyController.HashBasicAuthPassword` serialize `FgBasicAuthPolicy` bằng options này → DB lưu `{"username","passwordHash"}` (trước đây `JsonSerializer.Serialize` mặc định → PascalCase `{"Username","PasswordHash"}` → FE `parseBasicAuthUsername` đọc `obj?.username` ra rỗng). `Evaluate` deserialize bằng options này (case-insensitive — row cũ PascalCase vẫn đọc được).
- [x] **Keep-hash khi password trống**: `HashBasicAuthPassword` — nếu `password` rỗng + có sẵn `passwordHash` trong rulesJson → giữ hash cũ, không hash chuỗi rỗng (trước đây edit để trống password → hash rỗng → mất password). FE đã có hint "Leave blank to keep the current password".
- [x] **FE rule-form policy selector**: `FrontgateReverseProxy.tsx` — `formPolicyId` + `accessPolicies` state + fetch `listAccessPolicies()`, payload `accessPolicyId`, `policyOptions` lọc theo `formAccess` (basicAuth → chỉ basicAuth policies), select hiện khi `restricted`/`basicAuth`, `handleAccessChange` reset policy khi đổi mode; `frontgate.controller.ts` `CreateReverseProxyRulePayload` +`accessPolicyId?`. i18n `accessPolicy`/`selectPolicy`.

### 🔜 Phase 4 — Advanced Features

- [x] **Audit log (ai sửa rule gì, lúc nào)** ✅ 2026-08-08 — `FgAuditLog` entity (`Id` long, `Timestamp`, `Actor`/`ActorId` denormalized, `ClientIp` từ RealIp, `TargetType`/`TargetId`/`TargetName`, `Action`, `BeforeJson`/`AfterJson` 8192) + helper tĩnh `FrontgateAudit.Who()/LogAsync()` (không cần DI). Hook 13 call-site: rule (Create/Update/Delete/DryRunConfirm/DryRunCancel), policy (Create/Update/Delete — **không snapshot** `RulesJson` để tránh lọt `passwordHash`), cert (Create LE/custom, Delete, Retry/Renew). Update rule snapshot `before` (trước mutation) + `after` (trước SaveChanges) cho diff. `AuditLogController` `[RequireAdmin]`: `GET /api/frontgate/audit?page&size&targetType&targetId` (desc) + `DELETE` clear (self-log `AuditCleared` ghi `{deleted}` — xoá trước, log sau). `FgAuditCleanupWorker` retention 30 ngày (6h/lần). Migration `AddFgAuditLog`. FE: tab `audit` (icon `ACTIVITY`), `FrontgateAudit.tsx` (`NmxLogList` + pagination + clear confirm, mirror `BeaconActivity`), `listAudit`/`clearAudit` + route `/audit`, i18n `pages.audit.*`. Enum serialize camelCase nhờ global `JsonStringEnumConverter` (`ServiceCollectionExtensions.cs`).
  - ✅ **SignalR audit** 2026-08-08 — `IFrontgateNotifier.NotifyAuditCreated` + `frontgate:audit-created` event (`targetType`/`action` `.ToLowerInvariant()` vì SignalR protocol không dùng MVC enum converter). FE `FrontgateAudit` subscribe → refetch.
  - ✅ **Row-click snapshot** 2026-08-08 — `NmxLogList.onItemClick` prop mới (`@namorix/ui`, backward-compatible, keyboard Enter/Space + `nmx-log-list__item--clickable` styles) → click row log mở `NmxAlertDialog` hiện meta qua `NmxMetaList` (action/timestamp/actor/ip/target) + **chỉ** `BeforeJson` pretty-print (`formatJson` = `JSON.stringify(JSON.parse, null, 2)`, `isBlockMessage` → mono + `pre-wrap`).
  - **Clear log realtime**: dùng chung event `frontgate:audit-created` (self-log `AuditCleared` → `NotifyAuditCreated`) — **không có** event riêng `audit-cleared` (đủ dùng vì FE refetch toàn list, chốt không tách).
- [x] **No-op detection UpdateRule/UpdatePolicy** ✅ 2026-08-08 — `UpdateRule` so field-by-field (Source/Destination/AccessPolicyId/CertificateId/Access/Status/các cờ SSL-cache/AdditionalHeadersJson + `LocationsEqual` so Path/Scheme/ForwardHost/ForwardPort; `RequestCert`/`DryRun` luôn coi là change) — không đổi → `return Ok(rule)` im lặng, **skip** SaveChanges + audit `Updated` + `proxyProvider.UpdateAsync()` + notify. Validation (`[Validate]` + `ValidatePolicyAsync`) chạy trước nên data sai vẫn báo lỗi. `UpdatePolicy` so Name/Type/RulesJson — BasicAuth re-save hash cũ → no-op đúng, plaintext mới → re-hash = change. Không đổi response shape (FE không cần sửa).
- [ ] TCP/UDP Stream forwarding (non-HTTP addon)
- [ ] Redirection Hosts (301/302)

TCP/UDP Stream + Redirection Hosts: không thêm giá trị thực tế cho Namorix — giữ backlog, không ưu tiên.

### 🔜 Phase 5 — Edge Cases

#### ✅ Rate limiting per rule (2026-08-08)

- [x] **Backend model**: `FgReverseProxyRule.RateLimit` (int?) + `RateLimitWindowSec` (int?, default 60) — migration `AddFgRateLimit`
- [x] **RateLimitMiddleware**: sliding-window in-memory `ConcurrentDictionary<string, RateWindow>` key `host|RemoteIpAddress`, vượt `Limit` trong `WindowSec` → `429 Too Many Requests`. Đăng ký proxy pipeline sau `BlockCommonExploitsMiddleware`, trước `ForceSslMiddleware` → cả HTTP (trước redirect) lẫn HTTPS đều bị đếm
- [x] **Config cache**: `FrontgateProxyConfigProvider.RateLimitSources` populate trong `UpdateAsync()` — không đọc DB per-request (cùng pattern `BlockExploitSources`/`AccessSources`)
- [x] **CRUD wiring**: `CreateRuleRequest.RateLimit/RateLimitWindowSec`, list projection, CreateRule/UpdateRule assignment (kèm no-op detection), `FrontgateRuleSchema` validation (RateLimit 0–1.000.000, WindowSec 1–86.400 — nullable nên bỏ qua khi không set)
- [x] **Frontend UI**: toggle `formRateLimitEnabled` (Advanced tab) → `NmxSlider` (1–1000 req, `showValue`) + `NmxSegmentedGroup` window (1s/10s/60s/1h); `rateLimit`/`rateLimitWindowSec` trong `ReverseProxyRule` + `CreateReverseProxyRulePayload`; payload gửi `undefined` khi tắt (backend giữ null)
- [x] **NmxSlider `unit` prop**: thay hardcode `"px"` bằng prop `unit` (default `""`) — số thuần, không suffix
- [x] **i18n**: `rateLimit`, `rateLimitRequests`, `rateLimitWindow`
- [x] **Test** ✅ 2026-08-08: rule `izerocs.space` RateLimit=5/10s — request 1–5 pass (302), request 6–8 → **429**, sau 10s window reset → pass lại. Mỗi client IP có bucket riêng nên 1 IP spam không ảnh hưởng người khác

#### ✅ Health check backend per rule (2026-08-08)

- [x] **Backend model**: `FgReverseProxyRule.IsHealthy` (bool?, null = chưa probe) + `LastHealthCheckAt` (DateTime?) — migration `AddFgBackendHealth`
- [x] **`FgBackendHealthWorker`**: `PeriodicTimer(60s)`, chỉ probe rule `Status == Active`. Probe `GET {scheme}://{host}:{port}/` qua `SocketsHttpHandler` (`ConnectTimeout` 5s, bypass cert check vì chỉ check reachability — backend self-signed vẫn tính sống). `2xx/3xx` = up, `4xx/5xx`/exception = down. **Chỉ notify khi trạng thái đổi** — tái dùng `NotifyRuleChanged(Updated)` → FE refetch qua SignalR `frontgate:rule-changed` sẵn có (zero FE realtime code mới). SaveChanges mỗi cycle (vài row/60s, rất nhẹ)
- [x] **UpdateRule reset destination**: khi đổi `DestinationScheme`/`DestinationHost`/`DestinationPort` → reset `IsHealthy`/`LastHealthCheckAt` về null (health cũ không còn đúng destination mới) — UI hiện "—" chờ probe kế (≤60s)
- [x] **ListRules projection**: trả `IsHealthy`/`LastHealthCheckAt` → FE nhận được
- [x] **NmxPulseDot primitive** (`@namorix/ui`): component `status?: "live" | "stopped" | "error"` (spread `...rest`, title tooltip pass-through) + `pulse-dot.scss` (`--live` success + pulse 1.4s, `--error`, `--stopped` gray) + barrel export
- [x] **Frontend**: `ReverseProxyRule` + `isHealthy`/`lastHealthCheckAt`; health column dùng `NmxPulseDot` — map `null → stopped` / `true → live` / `false → error`; hiển thị cả trong info dialog; i18n `health`
- [x] **Design decision**: giữ `Status = Active` khi backend chết (hướng B) — vẫn proxy → user nhận 502 thay vì connection refused, không mất cả domain. Không đổi Status = Error (sẽ bị `UpdateAsync` gỡ khỏi YARP). Không audit health change (tránh spam log 60s/lần)
- [x] **Test**: kill backend destination → ≤60s badge chuyển đỏ + SignalR push → bật lại → quay về xanh
